"""Bid Combo System - Bonus for consecutive bids"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/bid-combo", tags=["Bid Combo"])

# Combo multipliers
COMBO_LEVELS = {
    3: {"multiplier": 1.1, "bonus_bids": 1, "name": "3er Combo"},
    5: {"multiplier": 1.2, "bonus_bids": 2, "name": "5er Combo"},
    10: {"multiplier": 1.5, "bonus_bids": 5, "name": "10er Combo!"},
    20: {"multiplier": 2.0, "bonus_bids": 10, "name": "20er MEGA Combo!!"},
    50: {"multiplier": 3.0, "bonus_bids": 25, "name": "50er ULTRA Combo!!!"}
}

@router.get("/status")
async def get_combo_status(user: dict = Depends(get_current_user)):
    """Get user's current bid combo status"""
    user_id = user["id"]
    
    # Get combo data
    combo = await db.bid_combos.find_one({"user_id": user_id}, {"_id": 0})
    
    if not combo:
        return {
            "current_combo": 0,
            "last_bid_time": None,
            "combo_active": False,
            "next_bonus_at": 3,
            "current_multiplier": 1.0
        }
    
    # Check if combo is still active (within 30 seconds of last bid)
    last_bid = datetime.fromisoformat(combo["last_bid_time"].replace('Z', '+00:00'))
    now = datetime.now(timezone.utc)
    combo_active = (now - last_bid).total_seconds() < 30
    
    current_combo = combo.get("current_combo", 0) if combo_active else 0
    
    # Find current multiplier
    multiplier = 1.0
    for level, info in sorted(COMBO_LEVELS.items()):
        if current_combo >= level:
            multiplier = info["multiplier"]
    
    # Find next bonus level
    next_bonus = 3
    for level in sorted(COMBO_LEVELS.keys()):
        if current_combo < level:
            next_bonus = level
            break
    
    return {
        "current_combo": current_combo,
        "last_bid_time": combo.get("last_bid_time"),
        "combo_active": combo_active,
        "next_bonus_at": next_bonus,
        "current_multiplier": multiplier,
        "total_bonus_bids_earned": combo.get("total_bonus_bids", 0)
    }

@router.post("/record-bid")
async def record_bid_for_combo(user: dict = Depends(get_current_user)):
    """Record a bid and update combo (called after successful bid)"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    # Get existing combo
    combo = await db.bid_combos.find_one({"user_id": user_id})
    
    if combo:
        last_bid = datetime.fromisoformat(combo["last_bid_time"].replace('Z', '+00:00'))
        time_diff = (now - last_bid).total_seconds()
        
        if time_diff < 30:
            # Combo continues
            new_combo = combo.get("current_combo", 0) + 1
        else:
            # Combo reset
            new_combo = 1
    else:
        new_combo = 1
    
    # Check for bonus
    bonus_earned = 0
    combo_name = None
    if new_combo in COMBO_LEVELS:
        bonus_earned = COMBO_LEVELS[new_combo]["bonus_bids"]
        combo_name = COMBO_LEVELS[new_combo]["name"]
        
        # Award bonus bids
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"bids": bonus_earned}}
        )
        
        logger.info(f"Combo bonus: User {user_id} earned {bonus_earned} bids for {combo_name}")
    
    # Update combo record
    await db.bid_combos.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "current_combo": new_combo,
            "last_bid_time": now.isoformat()
        }, "$inc": {"total_bonus_bids": bonus_earned}},
        upsert=True
    )
    
    return {
        "current_combo": new_combo,
        "bonus_earned": bonus_earned,
        "combo_name": combo_name,
        "message": f"+{bonus_earned} Bonus-Gebote!" if bonus_earned > 0 else None
    }

@router.get("/leaderboard")
async def get_combo_leaderboard():
    """Get top combo streaks"""
    top = await db.bid_combos.find(
        {},
        {"_id": 0, "user_id": 1, "current_combo": 1, "total_bonus_bids": 1}
    ).sort("current_combo", -1).limit(10).to_list(10)
    
    for entry in top:
        user = await db.users.find_one({"id": entry["user_id"]}, {"_id": 0, "username": 1})
        entry["username"] = user.get("username", "User") if user else "User"
    
    return {"leaderboard": top}

bid_combo_router = router
