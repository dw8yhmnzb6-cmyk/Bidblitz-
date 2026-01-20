"""Rewards router - Achievements, Daily Rewards, Gamification"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import uuid
import random

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/rewards", tags=["Rewards"])

# ==================== ACHIEVEMENT DEFINITIONS ====================

ACHIEVEMENTS = {
    # Bidding Achievements
    "first_bid": {
        "name": "Erster Schritt",
        "description": "Erstes Gebot platziert",
        "icon": "🎯",
        "reward_bids": 2,
        "category": "bidding"
    },
    "bid_10": {
        "name": "Aktiver Bieter",
        "description": "10 Gebote platziert",
        "icon": "⚡",
        "reward_bids": 5,
        "category": "bidding"
    },
    "bid_50": {
        "name": "Bieter-Profi",
        "description": "50 Gebote platziert",
        "icon": "🔥",
        "reward_bids": 15,
        "category": "bidding"
    },
    "bid_100": {
        "name": "Bieter-Champion",
        "description": "100 Gebote platziert",
        "icon": "🏆",
        "reward_bids": 30,
        "category": "bidding"
    },
    "bid_500": {
        "name": "Bieter-Legende",
        "description": "500 Gebote platziert",
        "icon": "👑",
        "reward_bids": 100,
        "category": "bidding"
    },
    
    # Winning Achievements
    "first_win": {
        "name": "Erster Sieg",
        "description": "Erste Auktion gewonnen",
        "icon": "🎉",
        "reward_bids": 10,
        "category": "winning"
    },
    "win_5": {
        "name": "Gewinner",
        "description": "5 Auktionen gewonnen",
        "icon": "🌟",
        "reward_bids": 25,
        "category": "winning"
    },
    "win_10": {
        "name": "Schnäppchenjäger",
        "description": "10 Auktionen gewonnen",
        "icon": "💎",
        "reward_bids": 50,
        "category": "winning"
    },
    "win_25": {
        "name": "Auktions-Meister",
        "description": "25 Auktionen gewonnen",
        "icon": "🎖️",
        "reward_bids": 100,
        "category": "winning"
    },
    
    # Buy Now Achievements
    "first_buy_now": {
        "name": "Sofortkäufer",
        "description": "Ersten Artikel mit Sofortkauf erworben",
        "icon": "💰",
        "reward_bids": 5,
        "category": "buying"
    },
    
    # Engagement Achievements
    "login_7_days": {
        "name": "Treuer Besucher",
        "description": "7 Tage in Folge eingeloggt",
        "icon": "📅",
        "reward_bids": 15,
        "category": "engagement"
    },
    "login_30_days": {
        "name": "Stammgast",
        "description": "30 Tage in Folge eingeloggt",
        "icon": "🏠",
        "reward_bids": 50,
        "category": "engagement"
    },
    
    # Referral Achievements
    "first_referral": {
        "name": "Empfehler",
        "description": "Ersten Freund eingeladen",
        "icon": "👥",
        "reward_bids": 10,
        "category": "social"
    },
    "referral_5": {
        "name": "Netzwerker",
        "description": "5 Freunde eingeladen",
        "icon": "🌐",
        "reward_bids": 30,
        "category": "social"
    },
    
    # Special Achievements
    "early_bird": {
        "name": "Frühaufsteher",
        "description": "Gebot zwischen 5-7 Uhr platziert",
        "icon": "🐦",
        "reward_bids": 3,
        "category": "special"
    },
    "night_owl": {
        "name": "Nachteule",
        "description": "Gebot zwischen 2-4 Uhr platziert",
        "icon": "🦉",
        "reward_bids": 3,
        "category": "special"
    },
    "sniper": {
        "name": "Scharfschütze",
        "description": "Auktion in letzten 5 Sekunden gewonnen",
        "icon": "🎯",
        "reward_bids": 10,
        "category": "special"
    },
    "big_saver": {
        "name": "Sparfuchs",
        "description": "Produkt für unter 10% des Originalpreises gewonnen",
        "icon": "💸",
        "reward_bids": 20,
        "category": "special"
    }
}

# Daily Reward Tiers
DAILY_REWARDS = [
    {"day": 1, "bids": 1, "description": "Tag 1 Bonus"},
    {"day": 2, "bids": 2, "description": "Tag 2 Bonus"},
    {"day": 3, "bids": 3, "description": "Tag 3 Bonus"},
    {"day": 4, "bids": 4, "description": "Tag 4 Bonus"},
    {"day": 5, "bids": 5, "description": "Tag 5 Bonus"},
    {"day": 6, "bids": 7, "description": "Tag 6 Bonus"},
    {"day": 7, "bids": 10, "description": "Wochenbonus! 🎉"},
]

# ==================== ACHIEVEMENTS ====================

@router.get("/achievements")
async def get_achievements(user: dict = Depends(get_current_user)):
    """Get all achievements with user's progress"""
    user_achievements = await db.achievements.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    earned_ids = {a["achievement_id"] for a in user_achievements}
    
    # Get user stats for progress
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    total_bids_placed = user_data.get("total_bids_placed", 0)
    won_auctions = len(user_data.get("won_auctions", []))
    referral_count = user_data.get("referral_count", 0)
    
    result = []
    for ach_id, ach in ACHIEVEMENTS.items():
        earned = ach_id in earned_ids
        earned_data = next((a for a in user_achievements if a["achievement_id"] == ach_id), None)
        
        # Calculate progress
        progress = 0
        target = 1
        if "bid_" in ach_id:
            target = int(ach_id.split("_")[1]) if "_" in ach_id else 1
            progress = min(total_bids_placed, target)
        elif "win_" in ach_id:
            target = int(ach_id.split("_")[1]) if "_" in ach_id else 1
            progress = min(won_auctions, target)
        elif "referral_" in ach_id:
            target = int(ach_id.split("_")[1]) if "_" in ach_id else 1
            progress = min(referral_count, target)
        elif earned:
            progress = target = 1
        
        result.append({
            "id": ach_id,
            "name": ach["name"],
            "description": ach["description"],
            "icon": ach["icon"],
            "reward_bids": ach["reward_bids"],
            "category": ach["category"],
            "earned": earned,
            "earned_at": earned_data.get("earned_at") if earned_data else None,
            "progress": progress,
            "target": target,
            "progress_percent": round((progress / target) * 100) if target > 0 else 0
        })
    
    # Sort: unearned first (sorted by progress), then earned
    result.sort(key=lambda x: (x["earned"], -x["progress_percent"]))
    
    return {
        "achievements": result,
        "total_earned": len(earned_ids),
        "total_available": len(ACHIEVEMENTS),
        "total_bids_earned": sum(ACHIEVEMENTS[a]["reward_bids"] for a in earned_ids)
    }

@router.get("/achievements/recent")
async def get_recent_achievements(user: dict = Depends(get_current_user)):
    """Get recently earned achievements"""
    recent = await db.achievements.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("earned_at", -1).to_list(5)
    
    for ach in recent:
        ach_def = ACHIEVEMENTS.get(ach["achievement_id"], {})
        ach["icon"] = ach_def.get("icon", "🏆")
        ach["reward_bids"] = ach_def.get("reward_bids", 0)
    
    return recent

# ==================== DAILY REWARDS ====================

@router.get("/daily")
async def get_daily_reward_status(user: dict = Depends(get_current_user)):
    """Get daily reward status"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # Get user's daily reward data
    reward_data = await db.daily_rewards.find_one({"user_id": user["id"]})
    
    if not reward_data:
        return {
            "can_claim": True,
            "current_streak": 0,
            "next_reward": DAILY_REWARDS[0],
            "last_claim": None,
            "streak_rewards": DAILY_REWARDS
        }
    
    last_claim = reward_data.get("last_claim", "")
    current_streak = reward_data.get("current_streak", 0)
    
    # Check if already claimed today
    can_claim = last_claim < today
    
    # Check if streak is broken (more than 48 hours since last claim)
    if last_claim:
        last_claim_dt = datetime.fromisoformat(last_claim.replace('Z', '+00:00'))
        hours_since = (now - last_claim_dt).total_seconds() / 3600
        if hours_since > 48:
            current_streak = 0
    
    # Next reward (cycle back after day 7)
    next_day = (current_streak % 7) + 1 if can_claim else ((current_streak % 7) + 1)
    next_reward = DAILY_REWARDS[next_day - 1] if can_claim else DAILY_REWARDS[min(next_day, 6)]
    
    return {
        "can_claim": can_claim,
        "current_streak": current_streak,
        "next_reward": next_reward,
        "last_claim": last_claim,
        "streak_rewards": DAILY_REWARDS,
        "next_claim_available": today if can_claim else (datetime.fromisoformat(today) + timedelta(days=1)).isoformat()
    }

@router.post("/daily/claim")
async def claim_daily_reward(user: dict = Depends(get_current_user)):
    """Claim daily reward"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    reward_data = await db.daily_rewards.find_one({"user_id": user["id"]})
    
    if reward_data:
        last_claim = reward_data.get("last_claim", "")
        
        if last_claim >= today:
            raise HTTPException(status_code=400, detail="Tagesbonus bereits abgeholt!")
        
        # Calculate streak
        current_streak = reward_data.get("current_streak", 0)
        if last_claim:
            last_claim_dt = datetime.fromisoformat(last_claim.replace('Z', '+00:00'))
            hours_since = (now - last_claim_dt).total_seconds() / 3600
            if hours_since > 48:
                current_streak = 0  # Reset streak
        
        new_streak = current_streak + 1
    else:
        new_streak = 1
    
    # Get reward for current day (cycle after 7)
    day_index = ((new_streak - 1) % 7)
    reward = DAILY_REWARDS[day_index]
    bids_earned = reward["bids"]
    
    # Bonus for completing a week
    bonus_bids = 0
    if new_streak > 0 and new_streak % 7 == 0:
        bonus_bids = 5  # Extra bonus for completing a week
    
    total_bids = bids_earned + bonus_bids
    
    # Update or create reward data
    await db.daily_rewards.update_one(
        {"user_id": user["id"]},
        {
            "$set": {
                "last_claim": now.isoformat(),
                "current_streak": new_streak
            },
            "$inc": {"total_claims": 1, "total_bids_earned": total_bids},
            "$setOnInsert": {"user_id": user["id"], "created_at": now.isoformat()}
        },
        upsert=True
    )
    
    # Add bids to user
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"bids_balance": total_bids}}
    )
    
    # Check for login streak achievements
    if new_streak >= 7:
        await grant_achievement(user["id"], "login_7_days")
    if new_streak >= 30:
        await grant_achievement(user["id"], "login_30_days")
    
    # Get updated user balance
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "bids_balance": 1})
    
    return {
        "message": f"🎁 Tagesbonus abgeholt!",
        "bids_earned": bids_earned,
        "bonus_bids": bonus_bids,
        "total_bids": total_bids,
        "new_streak": new_streak,
        "day": day_index + 1,
        "new_balance": updated_user.get("bids_balance", 0),
        "next_reward": DAILY_REWARDS[(day_index + 1) % 7]
    }

# ==================== LEADERBOARD ====================

@router.get("/leaderboard")
async def get_leaderboard(period: str = "weekly"):
    """Get leaderboard - top bidders and winners"""
    now = datetime.now(timezone.utc)
    
    if period == "daily":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        start_date = now - timedelta(days=7)
    else:  # monthly
        start_date = now - timedelta(days=30)
    
    # Get top winners (users with most won auctions)
    users = await db.users.find(
        {"is_admin": {"$ne": True}, "is_bot": {"$ne": True}},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "won_auctions": 1, "total_bids_placed": 1}
    ).to_list(1000)
    
    # Calculate scores
    leaderboard = []
    for user in users:
        wins = len(user.get("won_auctions", []))
        bids = user.get("total_bids_placed", 0)
        name = user.get("name") or user.get("email", "").split("@")[0]
        
        if wins > 0 or bids > 0:
            leaderboard.append({
                "user_id": user["id"],
                "name": name[:20],  # Truncate name
                "wins": wins,
                "bids": bids,
                "score": wins * 100 + bids  # Simple scoring
            })
    
    # Sort by score
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    
    # Add ranks
    for i, entry in enumerate(leaderboard[:50], 1):
        entry["rank"] = i
        if i == 1:
            entry["badge"] = "🥇"
        elif i == 2:
            entry["badge"] = "🥈"
        elif i == 3:
            entry["badge"] = "🥉"
        elif i <= 10:
            entry["badge"] = "⭐"
        else:
            entry["badge"] = ""
    
    return {
        "period": period,
        "leaderboard": leaderboard[:50],
        "total_participants": len(leaderboard)
    }

# ==================== HELPER FUNCTIONS ====================

async def grant_achievement(user_id: str, achievement_id: str):
    """Grant an achievement to a user if not already earned"""
    if achievement_id not in ACHIEVEMENTS:
        return False
    
    existing = await db.achievements.find_one({
        "user_id": user_id,
        "achievement_id": achievement_id
    })
    
    if existing:
        return False
    
    ach = ACHIEVEMENTS[achievement_id]
    
    await db.achievements.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "achievement_id": achievement_id,
        "name": ach["name"],
        "description": ach["description"],
        "earned_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Award bonus bids
    if ach.get("reward_bids", 0) > 0:
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"bids_balance": ach["reward_bids"]}}
        )
    
    logger.info(f"Achievement '{achievement_id}' granted to user {user_id}")
    return True

async def check_bid_achievements(user_id: str, total_bids: int):
    """Check and grant bid-based achievements"""
    if total_bids >= 1:
        await grant_achievement(user_id, "first_bid")
    if total_bids >= 10:
        await grant_achievement(user_id, "bid_10")
    if total_bids >= 50:
        await grant_achievement(user_id, "bid_50")
    if total_bids >= 100:
        await grant_achievement(user_id, "bid_100")
    if total_bids >= 500:
        await grant_achievement(user_id, "bid_500")

async def check_win_achievements(user_id: str, total_wins: int):
    """Check and grant win-based achievements"""
    if total_wins >= 1:
        await grant_achievement(user_id, "first_win")
    if total_wins >= 5:
        await grant_achievement(user_id, "win_5")
    if total_wins >= 10:
        await grant_achievement(user_id, "win_10")
    if total_wins >= 25:
        await grant_achievement(user_id, "win_25")

async def check_time_achievements(user_id: str):
    """Check and grant time-based achievements"""
    hour = datetime.now(timezone.utc).hour
    if 5 <= hour < 7:
        await grant_achievement(user_id, "early_bird")
    elif 2 <= hour < 4:
        await grant_achievement(user_id, "night_owl")
