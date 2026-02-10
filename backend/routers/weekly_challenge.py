"""Weekly Challenge System - Competition for biggest savings"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/weekly-challenge", tags=["Weekly Challenge"])

@router.get("/current")
async def get_current_challenge():
    """Get current week's challenge"""
    now = datetime.now(timezone.utc)
    
    # Find active challenge
    challenge = await db.weekly_challenges.find_one({
        "status": "active",
        "end_date": {"$gt": now.isoformat()}
    }, {"_id": 0})
    
    if not challenge:
        # Create new challenge
        start = now
        end = now + timedelta(days=7)
        
        challenge = {
            "id": str(uuid.uuid4()),
            "week_number": now.isocalendar()[1],
            "year": now.year,
            "title": f"Woche {now.isocalendar()[1]} Challenge",
            "description": "Wer spart diese Woche am meisten?",
            "prize_bids": 100,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "status": "active"
        }
        await db.weekly_challenges.insert_one(challenge)
        del challenge["_id"]
    
    # Get leaderboard
    leaderboard = await db.challenge_scores.find(
        {"challenge_id": challenge["id"]},
        {"_id": 0}
    ).sort("total_savings", -1).limit(10).to_list(10)
    
    for entry in leaderboard:
        user = await db.users.find_one({"id": entry["user_id"]}, {"username": 1})
        entry["username"] = user.get("username", "User") if user else "User"
    
    challenge["leaderboard"] = leaderboard
    
    return {"challenge": challenge}

@router.post("/record-win")
async def record_challenge_win(user: dict = Depends(get_current_user)):
    """Record a win for the weekly challenge (called after auction win)"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    # Get current challenge
    challenge = await db.weekly_challenges.find_one({
        "status": "active",
        "end_date": {"$gt": now.isoformat()}
    })
    
    if not challenge:
        return {"recorded": False}
    
    # Get user's latest win
    latest_win = await db.won_auctions.find_one(
        {"winner_id": user_id},
        sort=[("won_at", -1)]
    )
    
    if not latest_win:
        return {"recorded": False}
    
    savings = latest_win.get("retail_price", 0) - latest_win.get("final_price", 0)
    
    # Update or create score
    await db.challenge_scores.update_one(
        {"challenge_id": challenge["id"], "user_id": user_id},
        {
            "$inc": {"total_savings": savings, "wins_count": 1},
            "$set": {"last_win_at": now.isoformat()}
        },
        upsert=True
    )
    
    return {"recorded": True, "savings_added": savings}

@router.get("/my-rank")
async def get_my_rank(user: dict = Depends(get_current_user)):
    """Get user's rank in current challenge"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    challenge = await db.weekly_challenges.find_one({
        "status": "active",
        "end_date": {"$gt": now.isoformat()}
    })
    
    if not challenge:
        return {"rank": None, "in_challenge": False}
    
    my_score = await db.challenge_scores.find_one(
        {"challenge_id": challenge["id"], "user_id": user_id},
        {"_id": 0}
    )
    
    if not my_score:
        return {"rank": None, "in_challenge": False, "total_savings": 0}
    
    # Count users with higher savings
    higher_count = await db.challenge_scores.count_documents({
        "challenge_id": challenge["id"],
        "total_savings": {"$gt": my_score.get("total_savings", 0)}
    })
    
    return {
        "rank": higher_count + 1,
        "in_challenge": True,
        "total_savings": my_score.get("total_savings", 0),
        "wins_count": my_score.get("wins_count", 0)
    }

@router.get("/history")
async def get_challenge_history():
    """Get past challenge winners"""
    challenges = await db.weekly_challenges.find(
        {"status": "completed"},
        {"_id": 0}
    ).sort("end_date", -1).limit(10).to_list(10)
    
    for challenge in challenges:
        winner = await db.challenge_scores.find_one(
            {"challenge_id": challenge["id"]},
            {"_id": 0},
            sort=[("total_savings", -1)]
        )
        if winner:
            user = await db.users.find_one({"id": winner["user_id"]}, {"username": 1})
            challenge["winner"] = {
                "username": user.get("username", "User") if user else "User",
                "total_savings": winner.get("total_savings", 0)
            }
    
    return {"history": challenges}

weekly_challenge_router = router
