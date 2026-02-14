"""
Top Bidder Router - Daily top bidder tracking and rewards
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
import os

router = APIRouter(prefix="/gamification", tags=["gamification"])

# Database connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "bidblitz")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Auth dependency
from routers.auth import get_current_user

DAILY_REWARD_BIDS = 10  # Free bids for daily top bidder

@router.get("/top-bidders/today")
async def get_top_bidders_today(
    limit: int = 10,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Get top bidders for today with bid counts"""
    try:
        # Get start of today (UTC)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Aggregate bids from today
        pipeline = [
            {
                "$match": {
                    "bid_history": {"$exists": True, "$ne": []}
                }
            },
            {"$unwind": "$bid_history"},
            {
                "$match": {
                    "bid_history.timestamp": {"$gte": today_start.isoformat()},
                    "bid_history.is_bot": {"$ne": True}  # Exclude bots
                }
            },
            {
                "$group": {
                    "_id": "$bid_history.user_id",
                    "user_name": {"$first": "$bid_history.user_name"},
                    "bids": {"$sum": 1}
                }
            },
            {"$sort": {"bids": -1}},
            {"$limit": limit}
        ]
        
        results = await db.auctions.aggregate(pipeline).to_list(limit)
        
        top_bidders = []
        for r in results:
            # Get user avatar if exists
            user = await db.users.find_one({"id": r["_id"]}, {"_id": 0, "profile_image": 1})
            top_bidders.append({
                "user_id": r["_id"],
                "name": r["user_name"] or "Bieter",
                "bids": r["bids"],
                "avatar": user.get("profile_image") if user else None
            })
        
        # Get current user's rank if authenticated
        user_rank = None
        user_bids = 0
        if current_user:
            user_id = current_user.get("id")
            # Find user in full list
            full_pipeline = [
                {"$match": {"bid_history": {"$exists": True, "$ne": []}}},
                {"$unwind": "$bid_history"},
                {
                    "$match": {
                        "bid_history.timestamp": {"$gte": today_start.isoformat()},
                        "bid_history.is_bot": {"$ne": True}
                    }
                },
                {
                    "$group": {
                        "_id": "$bid_history.user_id",
                        "bids": {"$sum": 1}
                    }
                },
                {"$sort": {"bids": -1}}
            ]
            all_bidders = await db.auctions.aggregate(full_pipeline).to_list(1000)
            
            for i, bidder in enumerate(all_bidders, 1):
                if bidder["_id"] == user_id:
                    user_rank = i
                    user_bids = bidder["bids"]
                    break
        
        return {
            "top_bidders": top_bidders,
            "user_rank": user_rank,
            "user_bids": user_bids,
            "reward_bids": DAILY_REWARD_BIDS,
            "date": today_start.isoformat()
        }
        
    except Exception as e:
        # Return empty list on error
        return {
            "top_bidders": [],
            "user_rank": None,
            "user_bids": 0,
            "reward_bids": DAILY_REWARD_BIDS
        }


@router.post("/top-bidders/award-daily")
async def award_daily_top_bidder(current_user: dict = Depends(get_current_user)):
    """Admin endpoint to award the daily top bidder (run at midnight)"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        # Get yesterday's date
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        yesterday_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_end = yesterday_start + timedelta(days=1)
        
        # Find top bidder from yesterday
        pipeline = [
            {"$match": {"bid_history": {"$exists": True, "$ne": []}}},
            {"$unwind": "$bid_history"},
            {
                "$match": {
                    "bid_history.timestamp": {
                        "$gte": yesterday_start.isoformat(),
                        "$lt": yesterday_end.isoformat()
                    },
                    "bid_history.is_bot": {"$ne": True}
                }
            },
            {
                "$group": {
                    "_id": "$bid_history.user_id",
                    "user_name": {"$first": "$bid_history.user_name"},
                    "bids": {"$sum": 1}
                }
            },
            {"$sort": {"bids": -1}},
            {"$limit": 1}
        ]
        
        results = await db.auctions.aggregate(pipeline).to_list(1)
        
        if not results:
            return {"message": "No bidders yesterday", "awarded": False}
        
        winner = results[0]
        winner_id = winner["_id"]
        winner_name = winner["user_name"]
        winner_bids = winner["bids"]
        
        # Check if already awarded
        existing = await db.daily_bidder_awards.find_one({
            "date": yesterday_start.isoformat(),
            "user_id": winner_id
        })
        
        if existing:
            return {"message": "Already awarded", "awarded": False}
        
        # Award free bids
        await db.users.update_one(
            {"id": winner_id},
            {"$inc": {"bid_balance": DAILY_REWARD_BIDS}}
        )
        
        # Record award
        await db.daily_bidder_awards.insert_one({
            "date": yesterday_start.isoformat(),
            "user_id": winner_id,
            "user_name": winner_name,
            "bids_placed": winner_bids,
            "reward_bids": DAILY_REWARD_BIDS,
            "awarded_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "message": f"Awarded {DAILY_REWARD_BIDS} bids to {winner_name}",
            "awarded": True,
            "winner": {
                "name": winner_name,
                "bids": winner_bids,
                "reward": DAILY_REWARD_BIDS
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-bidders/history")
async def get_top_bidder_history(days: int = 7):
    """Get history of daily top bidder awards"""
    try:
        awards = await db.daily_bidder_awards.find(
            {},
            {"_id": 0}
        ).sort("date", -1).limit(days).to_list(days)
        
        return {"awards": awards}
    except Exception as e:
        return {"awards": []}


top_bidder_router = router
