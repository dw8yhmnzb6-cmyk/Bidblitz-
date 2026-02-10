"""Daily Login Streak Router - Gamification feature for daily rewards"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/daily-streak", tags=["Daily Streak"])

# Reward tiers based on streak day
def get_reward_for_day(day: int) -> int:
    if day <= 0:
        return 1
    if day == 1:
        return 1
    if day == 2:
        return 2
    if day == 3:
        return 3
    if day == 4:
        return 4
    if day == 5:
        return 5
    if day == 6:
        return 7
    if day == 7:
        return 10  # Weekly bonus!
    # After week 1, cycle with bonuses
    week_num = (day - 1) // 7
    day_in_week = ((day - 1) % 7) + 1
    base_reward = get_reward_for_day(day_in_week)
    return base_reward + week_num * 2  # +2 per week bonus


@router.get("/status")
async def get_streak_status(user: dict = Depends(get_current_user)):
    """Get current streak status for user"""
    user_id = user["id"]
    
    # Get user's streak data
    streak_data = await db.daily_streaks.find_one({"user_id": user_id}, {"_id": 0})
    
    if not streak_data:
        # Initialize streak data
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "total_claims": 0,
            "total_bids_earned": 0,
            "claimed_today": False,
            "today_reward": get_reward_for_day(1),
            "next_reward": get_reward_for_day(2),
            "last_claim": None
        }
    
    # Check if claimed today
    today = datetime.now(timezone.utc).date()
    last_claim = streak_data.get("last_claim_date")
    
    if last_claim:
        last_claim_date = datetime.fromisoformat(last_claim.replace('Z', '+00:00')).date()
        claimed_today = last_claim_date == today
        
        # Check if streak is broken (missed a day)
        yesterday = today - timedelta(days=1)
        if last_claim_date < yesterday:
            # Streak broken - reset
            streak_data["current_streak"] = 0
    else:
        claimed_today = False
    
    current_streak = streak_data.get("current_streak", 0)
    
    return {
        "current_streak": current_streak,
        "longest_streak": streak_data.get("longest_streak", 0),
        "total_claims": streak_data.get("total_claims", 0),
        "total_bids_earned": streak_data.get("total_bids_earned", 0),
        "claimed_today": claimed_today,
        "today_reward": get_reward_for_day(current_streak + 1),
        "next_reward": get_reward_for_day(current_streak + 2),
        "last_claim": streak_data.get("last_claim_date")
    }


@router.post("/claim")
async def claim_daily_reward(user: dict = Depends(get_current_user)):
    """Claim daily streak reward"""
    user_id = user["id"]
    today = datetime.now(timezone.utc)
    today_date = today.date()
    
    # Get existing streak data
    streak_data = await db.daily_streaks.find_one({"user_id": user_id})
    
    if streak_data:
        last_claim = streak_data.get("last_claim_date")
        if last_claim:
            last_claim_date = datetime.fromisoformat(last_claim.replace('Z', '+00:00')).date()
            
            # Already claimed today
            if last_claim_date == today_date:
                raise HTTPException(status_code=400, detail="Heute bereits abgeholt!")
            
            # Check if streak continues or resets
            yesterday = today_date - timedelta(days=1)
            if last_claim_date == yesterday:
                # Streak continues
                new_streak = streak_data.get("current_streak", 0) + 1
            else:
                # Streak broken
                new_streak = 1
        else:
            new_streak = 1
    else:
        new_streak = 1
        streak_data = {
            "user_id": user_id,
            "current_streak": 0,
            "longest_streak": 0,
            "total_claims": 0,
            "total_bids_earned": 0
        }
    
    # Calculate reward
    bids_reward = get_reward_for_day(new_streak)
    
    # Update streak data
    new_longest = max(streak_data.get("longest_streak", 0), new_streak)
    
    await db.daily_streaks.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "current_streak": new_streak,
            "longest_streak": new_longest,
            "total_claims": streak_data.get("total_claims", 0) + 1,
            "total_bids_earned": streak_data.get("total_bids_earned", 0) + bids_reward,
            "last_claim_date": today.isoformat()
        }},
        upsert=True
    )
    
    # Add bids to user
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids": bids_reward}}
    )
    
    # Log the claim
    await db.streak_claims.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "streak_day": new_streak,
        "bids_earned": bids_reward,
        "claimed_at": today.isoformat()
    })
    
    logger.info(f"Daily streak claimed: User {user_id}, Day {new_streak}, Reward {bids_reward} bids")
    
    # Check for milestone
    is_weekly_milestone = new_streak % 7 == 0
    
    return {
        "success": True,
        "current_streak": new_streak,
        "bids_earned": bids_reward,
        "is_milestone": is_weekly_milestone,
        "next_reward": get_reward_for_day(new_streak + 1),
        "message": f"+{bids_reward} Gebote! Tag {new_streak} Streak!"
    }


@router.get("/leaderboard")
async def get_streak_leaderboard():
    """Get top streak holders"""
    top_streaks = await db.daily_streaks.find(
        {"current_streak": {"$gt": 0}},
        {"_id": 0, "user_id": 1, "current_streak": 1, "longest_streak": 1}
    ).sort("current_streak", -1).limit(10).to_list(10)
    
    # Enrich with usernames
    for streak in top_streaks:
        user = await db.users.find_one({"id": streak["user_id"]}, {"_id": 0, "username": 1})
        streak["username"] = user.get("username", "User") if user else "User"
    
    return {"leaderboard": top_streaks}


daily_streak_router = router
