"""Streak Protection Router - Protect login streaks"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta, date
from pydantic import BaseModel
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/streak-protection", tags=["Streak Protection"])

# ==================== CONFIGURATION ====================

# Streak milestones and rewards
STREAK_REWARDS = {
    7: {"bids": 5, "name": "1 Woche"},
    14: {"bids": 10, "name": "2 Wochen"},
    30: {"bids": 20, "name": "1 Monat"},
    60: {"bids": 35, "name": "2 Monate"},
    90: {"bids": 50, "name": "3 Monate"},
    180: {"bids": 100, "name": "6 Monate"},
    365: {"bids": 200, "name": "1 Jahr"}
}

# Protection settings
PROTECTION_COOLDOWN_DAYS = 30  # Can only use protection once per month
PROTECTION_REQUIREMENT_DAYS = 7  # Minimum streak to get protection

# ==================== ENDPOINTS ====================

@router.get("/status")
async def get_streak_status(user: dict = Depends(get_current_user)):
    """Get user's current streak status"""
    user_id = user["id"]
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    current_streak = user_data.get("login_streak", 0)
    last_login = user_data.get("last_login_date")
    
    # Check if streak is still active
    today = date.today()
    streak_active = True
    
    if last_login:
        try:
            last_date = datetime.fromisoformat(last_login.replace("Z", "+00:00")).date()
            days_since = (today - last_date).days
            
            if days_since > 1:
                # Streak would be broken
                streak_active = False
        except:
            pass
    
    # Check protection status
    protection = await db.streak_protections.find_one({
        "user_id": user_id,
        "status": "active"
    }, {"_id": 0})
    
    has_protection = protection is not None
    
    # Check if can use protection
    last_used = await db.streak_protections.find_one({
        "user_id": user_id,
        "used_at": {"$exists": True}
    }, {"_id": 0}, sort=[("used_at", -1)])
    
    can_earn_protection = current_streak >= PROTECTION_REQUIREMENT_DAYS
    
    protection_on_cooldown = False
    cooldown_days_remaining = 0
    
    if last_used:
        used_date = datetime.fromisoformat(last_used["used_at"].replace("Z", "+00:00")).date()
        days_since_use = (today - used_date).days
        if days_since_use < PROTECTION_COOLDOWN_DAYS:
            protection_on_cooldown = True
            cooldown_days_remaining = PROTECTION_COOLDOWN_DAYS - days_since_use
    
    # Calculate next milestone
    next_milestone = None
    next_reward = None
    for days, reward in sorted(STREAK_REWARDS.items()):
        if days > current_streak:
            next_milestone = days
            next_reward = reward
            break
    
    return {
        "current_streak": current_streak,
        "streak_active": streak_active,
        "last_login": last_login,
        "has_protection": has_protection,
        "can_earn_protection": can_earn_protection,
        "protection_on_cooldown": protection_on_cooldown,
        "cooldown_days_remaining": cooldown_days_remaining,
        "next_milestone": next_milestone,
        "next_reward": next_reward,
        "streak_rewards": STREAK_REWARDS
    }

@router.post("/activate")
async def activate_protection(user: dict = Depends(get_current_user)):
    """Activate streak protection (earned at 7-day streak)"""
    user_id = user["id"]
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    current_streak = user_data.get("login_streak", 0) if user_data else 0
    
    if current_streak < PROTECTION_REQUIREMENT_DAYS:
        raise HTTPException(
            status_code=400,
            detail=f"Du brauchst mindestens {PROTECTION_REQUIREMENT_DAYS} Tage Streak für den Schutz. Aktuell: {current_streak} Tage"
        )
    
    # Check cooldown
    today = date.today()
    last_used = await db.streak_protections.find_one({
        "user_id": user_id,
        "used_at": {"$exists": True}
    }, {"_id": 0}, sort=[("used_at", -1)])
    
    if last_used:
        used_date = datetime.fromisoformat(last_used["used_at"].replace("Z", "+00:00")).date()
        days_since = (today - used_date).days
        if days_since < PROTECTION_COOLDOWN_DAYS:
            raise HTTPException(
                status_code=400,
                detail=f"Streak-Schutz ist noch im Cooldown. Noch {PROTECTION_COOLDOWN_DAYS - days_since} Tage warten."
            )
    
    # Check if already has active protection
    existing = await db.streak_protections.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du hast bereits einen aktiven Streak-Schutz")
    
    # Create protection
    protection = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "streak_at_activation": current_streak,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.streak_protections.insert_one(protection)
    
    logger.info(f"Streak protection activated for {user_id} at {current_streak} day streak")
    
    return {
        "success": True,
        "message": "🛡️ Streak-Schutz aktiviert! Dein Streak ist bei einem verpassten Tag geschützt.",
        "protection_id": protection["id"]
    }

@router.post("/use")
async def use_protection(user: dict = Depends(get_current_user)):
    """Use streak protection to save a broken streak"""
    user_id = user["id"]
    
    # Check for active protection
    protection = await db.streak_protections.find_one({
        "user_id": user_id,
        "status": "active"
    }, {"_id": 0})
    
    if not protection:
        raise HTTPException(status_code=404, detail="Kein aktiver Streak-Schutz vorhanden")
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    last_login = user_data.get("last_login_date") if user_data else None
    
    if not last_login:
        raise HTTPException(status_code=400, detail="Kein Streak zum Schützen")
    
    today = date.today()
    last_date = datetime.fromisoformat(last_login.replace("Z", "+00:00")).date()
    days_since = (today - last_date).days
    
    if days_since <= 1:
        raise HTTPException(status_code=400, detail="Dein Streak ist nicht in Gefahr!")
    
    if days_since > 2:
        raise HTTPException(
            status_code=400,
            detail="Streak-Schutz kann nur bei 1 verpasstem Tag verwendet werden. Dein Streak wurde leider zurückgesetzt."
        )
    
    # Use protection - restore streak
    await db.streak_protections.update_one(
        {"id": protection["id"]},
        {"$set": {
            "status": "used",
            "used_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update last login to yesterday to bridge the gap
    yesterday = (today - timedelta(days=1)).isoformat()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"last_login_date": yesterday}}
    )
    
    logger.info(f"Streak protection used by {user_id}")
    
    return {
        "success": True,
        "message": "🛡️ Streak-Schutz verwendet! Dein Streak bleibt erhalten.",
        "streak_saved": True
    }

@router.get("/history")
async def get_protection_history(user: dict = Depends(get_current_user)):
    """Get history of streak protections"""
    protections = await db.streak_protections.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return {"protections": protections}

@router.post("/claim-reward/{days}")
async def claim_streak_reward(days: int, user: dict = Depends(get_current_user)):
    """Claim a streak milestone reward"""
    user_id = user["id"]
    
    if days not in STREAK_REWARDS:
        raise HTTPException(status_code=400, detail="Ungültige Meilenstein-Stufe")
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    current_streak = user_data.get("login_streak", 0) if user_data else 0
    
    if current_streak < days:
        raise HTTPException(
            status_code=400,
            detail=f"Du brauchst {days} Tage Streak. Aktuell: {current_streak} Tage"
        )
    
    # Check if already claimed
    claimed = await db.streak_rewards_claimed.find_one({
        "user_id": user_id,
        "milestone_days": days
    })
    
    if claimed:
        raise HTTPException(status_code=400, detail="Diese Belohnung wurde bereits abgeholt")
    
    reward = STREAK_REWARDS[days]
    
    # Record claim
    claim = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "milestone_days": days,
        "reward_bids": reward["bids"],
        "milestone_name": reward["name"],
        "claimed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.streak_rewards_claimed.insert_one(claim)
    
    # Add bids
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids": reward["bids"]}}
    )
    
    logger.info(f"Streak reward claimed: {user_id} - {days} days - {reward['bids']} bids")
    
    return {
        "success": True,
        "message": f"🎉 {reward['name']}-Meilenstein erreicht! +{reward['bids']} Gebote!",
        "bids_earned": reward["bids"]
    }

@router.get("/claimed-rewards")
async def get_claimed_rewards(user: dict = Depends(get_current_user)):
    """Get all claimed streak rewards"""
    claimed = await db.streak_rewards_claimed.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(50)
    
    claimed_days = [c["milestone_days"] for c in claimed]
    
    return {
        "claimed": claimed,
        "claimed_milestones": claimed_days,
        "all_milestones": list(STREAK_REWARDS.keys())
    }


streak_protection_router = router
