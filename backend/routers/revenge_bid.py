"""Revenge Bid Router - Quick counter-bid when outbid"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/revenge-bid", tags=["Revenge Bid"])

# Configuration
REVENGE_WINDOW_SECONDS = 30  # Time window after being outbid to use revenge bid
REVENGE_COOLDOWN_SECONDS = 60  # Cooldown between revenge bids on same auction

# ==================== SCHEMAS ====================

class RevengeBidRequest(BaseModel):
    auction_id: str

# ==================== ENDPOINTS ====================

@router.get("/status/{auction_id}")
async def get_revenge_bid_status(auction_id: str, user: dict = Depends(get_current_user)):
    """Check if user can use revenge bid on an auction"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    # Get auction
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    if auction.get("status") != "active":
        return {"can_revenge": False, "reason": "Auktion nicht aktiv"}
    
    # Check if user was recently outbid
    # Get user's last bid on this auction
    user_last_bid = await db.bids.find_one(
        {"auction_id": auction_id, "user_id": user_id, "is_bot": {"$ne": True}},
        sort=[("created_at", -1)]
    )
    
    if not user_last_bid:
        return {"can_revenge": False, "reason": "Kein eigenes Gebot vorhanden"}
    
    # Get the latest bid overall
    latest_bid = await db.bids.find_one(
        {"auction_id": auction_id},
        sort=[("created_at", -1)]
    )
    
    # Check if someone else outbid the user
    if latest_bid and latest_bid.get("user_id") == user_id:
        return {"can_revenge": False, "reason": "Du bist aktuell Höchstbieter"}
    
    # Check time window
    last_bid_time = datetime.fromisoformat(user_last_bid["created_at"].replace('Z', '+00:00'))
    time_since_bid = (now - last_bid_time).total_seconds()
    
    if time_since_bid > REVENGE_WINDOW_SECONDS:
        return {
            "can_revenge": False, 
            "reason": "Zeitfenster abgelaufen",
            "window_expired": True
        }
    
    # Check cooldown
    last_revenge = await db.revenge_bids.find_one(
        {
            "auction_id": auction_id,
            "user_id": user_id,
            "created_at": {"$gte": (now - timedelta(seconds=REVENGE_COOLDOWN_SECONDS)).isoformat()}
        }
    )
    
    if last_revenge:
        cooldown_remaining = REVENGE_COOLDOWN_SECONDS - (now - datetime.fromisoformat(last_revenge["created_at"].replace('Z', '+00:00'))).total_seconds()
        return {
            "can_revenge": False,
            "reason": "Cooldown aktiv",
            "cooldown_remaining": int(cooldown_remaining)
        }
    
    # Check if user has bids
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "bids_balance": 1, "bids": 1})
    bids_balance = user_data.get("bids_balance", user_data.get("bids", 0))
    
    if bids_balance < 1:
        return {"can_revenge": False, "reason": "Keine Gebote verfügbar"}
    
    # User can revenge!
    time_remaining = REVENGE_WINDOW_SECONDS - time_since_bid
    
    return {
        "can_revenge": True,
        "time_remaining": int(time_remaining),
        "outbid_by": "Anderer Bieter",  # Could show name if desired
        "message": f"⚡ Zurückschlagen! Noch {int(time_remaining)} Sekunden!"
    }

@router.post("/strike")
async def execute_revenge_bid(data: RevengeBidRequest, user: dict = Depends(get_current_user)):
    """Execute a revenge bid - instant counter-bid after being outbid"""
    user_id = user["id"]
    
    # Verify user can revenge
    status = await get_revenge_bid_status(data.auction_id, user)
    if not status.get("can_revenge"):
        raise HTTPException(status_code=400, detail=status.get("reason", "Revenge-Bid nicht möglich"))
    
    # Get auction
    auction = await db.auctions.find_one({"id": data.auction_id}, {"_id": 0})
    if not auction or auction.get("status") != "active":
        raise HTTPException(status_code=400, detail="Auktion nicht mehr aktiv")
    
    # Deduct bid
    result = await db.users.update_one(
        {"id": user_id, "$or": [{"bids_balance": {"$gte": 1}}, {"bids": {"$gte": 1}}]},
        {"$inc": {"bids_balance": -1, "bids": -1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Keine Gebote verfügbar")
    
    now = datetime.now(timezone.utc)
    
    # Place the bid
    new_price = round(auction.get("current_price", 0) + 0.01, 2)
    
    bid = {
        "id": str(uuid.uuid4()),
        "auction_id": data.auction_id,
        "user_id": user_id,
        "amount": new_price,
        "is_bot": False,
        "is_revenge": True,
        "created_at": now.isoformat()
    }
    
    await db.bids.insert_one(bid)
    
    # Update auction
    new_end_time = now + timedelta(seconds=15)  # Reset timer
    
    await db.auctions.update_one(
        {"id": data.auction_id},
        {
            "$set": {
                "current_price": new_price,
                "last_bidder_id": user_id,
                "last_bid_at": now.isoformat(),
                "end_time": new_end_time.isoformat()
            },
            "$inc": {"total_bids": 1}
        }
    )
    
    # Record revenge bid
    await db.revenge_bids.insert_one({
        "id": str(uuid.uuid4()),
        "auction_id": data.auction_id,
        "user_id": user_id,
        "bid_id": bid["id"],
        "new_price": new_price,
        "created_at": now.isoformat()
    })
    
    logger.info(f"Revenge bid: {user_id} on auction {data.auction_id} - new price €{new_price}")
    
    return {
        "success": True,
        "message": "⚡ Zurückgeschlagen!",
        "new_price": new_price,
        "bid_id": bid["id"]
    }

@router.get("/my-revenges")
async def get_my_revenge_history(user: dict = Depends(get_current_user), limit: int = 20):
    """Get user's revenge bid history"""
    revenges = await db.revenge_bids.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Enrich with auction info
    for r in revenges:
        auction = await db.auctions.find_one(
            {"id": r["auction_id"]},
            {"_id": 0, "product_name": 1, "product_image": 1}
        )
        if auction:
            r["auction"] = auction
    
    return {"revenge_bids": revenges}

@router.get("/stats")
async def get_revenge_stats(user: dict = Depends(get_current_user)):
    """Get user's revenge bid statistics"""
    user_id = user["id"]
    
    total_revenges = await db.revenge_bids.count_documents({"user_id": user_id})
    
    # Successful revenges (where user eventually won)
    revenge_auction_ids = await db.revenge_bids.distinct("auction_id", {"user_id": user_id})
    wins_after_revenge = await db.auctions.count_documents({
        "id": {"$in": revenge_auction_ids},
        "winner_id": user_id
    })
    
    return {
        "total_revenge_bids": total_revenges,
        "auctions_won_after_revenge": wins_after_revenge,
        "success_rate": round((wins_after_revenge / total_revenges) * 100, 1) if total_revenges > 0 else 0
    }


revenge_bid_router = router
