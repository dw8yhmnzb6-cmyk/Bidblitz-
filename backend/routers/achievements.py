"""Achievements Router - Badges, achievements, and gamification"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/achievements", tags=["Achievements"])

# ==================== ACHIEVEMENT DEFINITIONS ====================

ACHIEVEMENTS = {
    # Bidding Achievements
    "first_bid": {
        "id": "first_bid",
        "name_de": "Erster Schritt",
        "name_en": "First Step",
        "description_de": "Platziere dein erstes Gebot",
        "description_en": "Place your first bid",
        "icon": "🎯",
        "category": "bidding",
        "reward_bids": 2,
        "condition": {"bids_placed": 1}
    },
    "bid_10": {
        "id": "bid_10",
        "name_de": "Anfänger Bieter",
        "name_en": "Beginner Bidder",
        "description_de": "Platziere 10 Gebote",
        "description_en": "Place 10 bids",
        "icon": "⚡",
        "category": "bidding",
        "reward_bids": 3,
        "condition": {"bids_placed": 10}
    },
    "bid_100": {
        "id": "bid_100",
        "name_de": "Aktiver Bieter",
        "name_en": "Active Bidder",
        "description_de": "Platziere 100 Gebote",
        "description_en": "Place 100 bids",
        "icon": "🔥",
        "category": "bidding",
        "reward_bids": 10,
        "condition": {"bids_placed": 100}
    },
    "bid_500": {
        "id": "bid_500",
        "name_de": "Pro Bieter",
        "name_en": "Pro Bidder",
        "description_de": "Platziere 500 Gebote",
        "description_en": "Place 500 bids",
        "icon": "💎",
        "category": "bidding",
        "reward_bids": 25,
        "condition": {"bids_placed": 500}
    },
    "bid_1000": {
        "id": "bid_1000",
        "name_de": "Meister Bieter",
        "name_en": "Master Bidder",
        "description_de": "Platziere 1000 Gebote",
        "description_en": "Place 1000 bids",
        "icon": "👑",
        "category": "bidding",
        "reward_bids": 50,
        "condition": {"bids_placed": 1000}
    },
    
    # Winning Achievements
    "first_win": {
        "id": "first_win",
        "name_de": "Erster Sieg",
        "name_en": "First Win",
        "description_de": "Gewinne deine erste Auktion",
        "description_en": "Win your first auction",
        "icon": "🏆",
        "category": "winning",
        "reward_bids": 5,
        "condition": {"auctions_won": 1}
    },
    "win_5": {
        "id": "win_5",
        "name_de": "Gewinner",
        "name_en": "Winner",
        "description_de": "Gewinne 5 Auktionen",
        "description_en": "Win 5 auctions",
        "icon": "🥇",
        "category": "winning",
        "reward_bids": 15,
        "condition": {"auctions_won": 5}
    },
    "win_25": {
        "id": "win_25",
        "name_de": "Champion",
        "name_en": "Champion",
        "description_de": "Gewinne 25 Auktionen",
        "description_en": "Win 25 auctions",
        "icon": "🌟",
        "category": "winning",
        "reward_bids": 50,
        "condition": {"auctions_won": 25}
    },
    "win_100": {
        "id": "win_100",
        "name_de": "Legende",
        "name_en": "Legend",
        "description_de": "Gewinne 100 Auktionen",
        "description_en": "Win 100 auctions",
        "icon": "🎖️",
        "category": "winning",
        "reward_bids": 100,
        "condition": {"auctions_won": 100}
    },
    
    # Special Achievements
    "night_owl": {
        "id": "night_owl",
        "name_de": "Nachteule",
        "name_en": "Night Owl",
        "description_de": "Gewinne eine Auktion zwischen 00:00 und 05:00",
        "description_en": "Win an auction between midnight and 5am",
        "icon": "🦉",
        "category": "special",
        "reward_bids": 10,
        "condition": {"night_win": True}
    },
    "sniper": {
        "id": "sniper",
        "name_de": "Scharfschütze",
        "name_en": "Sniper",
        "description_de": "Gewinne mit nur 1 Gebot",
        "description_en": "Win with only 1 bid",
        "icon": "🎯",
        "category": "special",
        "reward_bids": 15,
        "condition": {"single_bid_win": True}
    },
    "big_saver": {
        "id": "big_saver",
        "name_de": "Großer Sparer",
        "name_en": "Big Saver",
        "description_de": "Spare über 90% bei einer Auktion",
        "description_en": "Save over 90% on an auction",
        "icon": "💰",
        "category": "special",
        "reward_bids": 20,
        "condition": {"savings_percent": 90}
    },
    "streak_3": {
        "id": "streak_3",
        "name_de": "Heißer Lauf",
        "name_en": "Hot Streak",
        "description_de": "Gewinne 3 Auktionen in Folge",
        "description_en": "Win 3 auctions in a row",
        "icon": "🔥",
        "category": "special",
        "reward_bids": 15,
        "condition": {"win_streak": 3}
    },
    
    # Social Achievements
    "referral_1": {
        "id": "referral_1",
        "name_de": "Botschafter",
        "name_en": "Ambassador",
        "description_de": "Lade einen Freund ein",
        "description_en": "Invite a friend",
        "icon": "🤝",
        "category": "social",
        "reward_bids": 10,
        "condition": {"referrals": 1}
    },
    "referral_5": {
        "id": "referral_5",
        "name_de": "Netzwerker",
        "name_en": "Networker",
        "description_de": "Lade 5 Freunde ein",
        "description_en": "Invite 5 friends",
        "icon": "🌐",
        "category": "social",
        "reward_bids": 30,
        "condition": {"referrals": 5}
    },
    "reviewer": {
        "id": "reviewer",
        "name_de": "Bewerter",
        "name_en": "Reviewer",
        "description_de": "Schreibe eine Bewertung nach einem Gewinn",
        "description_en": "Write a review after winning",
        "icon": "✍️",
        "category": "social",
        "reward_bids": 5,
        "condition": {"reviews_written": 1}
    },
    
    # Loyalty Achievements
    "week_streak": {
        "id": "week_streak",
        "name_de": "Treuer Bieter",
        "name_en": "Loyal Bidder",
        "description_de": "Biete 7 Tage in Folge",
        "description_en": "Bid for 7 days in a row",
        "icon": "📅",
        "category": "loyalty",
        "reward_bids": 10,
        "condition": {"login_streak": 7}
    },
    "month_member": {
        "id": "month_member",
        "name_de": "Stammgast",
        "name_en": "Regular",
        "description_de": "Sei einen Monat aktiv",
        "description_en": "Be active for a month",
        "icon": "🏠",
        "category": "loyalty",
        "reward_bids": 15,
        "condition": {"days_active": 30}
    }
}

# ==================== ENDPOINTS ====================

@router.get("/all")
async def get_all_achievements(language: str = "de"):
    """Get all available achievements"""
    achievements = []
    for ach_id, ach in ACHIEVEMENTS.items():
        achievements.append({
            "id": ach_id,
            "name": ach.get(f"name_{language}", ach["name_de"]),
            "description": ach.get(f"description_{language}", ach["description_de"]),
            "icon": ach["icon"],
            "category": ach["category"],
            "reward_bids": ach["reward_bids"]
        })
    
    # Group by category
    categories = {}
    for ach in achievements:
        cat = ach["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(ach)
    
    return {"achievements": achievements, "by_category": categories}

@router.get("/my-achievements")
async def get_my_achievements(user: dict = Depends(get_current_user), language: str = "de"):
    """Get user's earned achievements"""
    user_id = user["id"]
    
    # Get earned achievements
    earned = await db.user_achievements.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    earned_ids = [a["achievement_id"] for a in earned]
    
    # Build response
    all_achievements = []
    earned_count = 0
    total_rewards = 0
    
    for ach_id, ach in ACHIEVEMENTS.items():
        is_earned = ach_id in earned_ids
        earned_data = next((e for e in earned if e["achievement_id"] == ach_id), None)
        
        all_achievements.append({
            "id": ach_id,
            "name": ach.get(f"name_{language}", ach["name_de"]),
            "description": ach.get(f"description_{language}", ach["description_de"]),
            "icon": ach["icon"],
            "category": ach["category"],
            "reward_bids": ach["reward_bids"],
            "earned": is_earned,
            "earned_at": earned_data.get("earned_at") if earned_data else None
        })
        
        if is_earned:
            earned_count += 1
            total_rewards += ach["reward_bids"]
    
    return {
        "achievements": all_achievements,
        "stats": {
            "earned": earned_count,
            "total": len(ACHIEVEMENTS),
            "progress_percent": round(earned_count / len(ACHIEVEMENTS) * 100, 1),
            "total_rewards_earned": total_rewards
        }
    }

@router.get("/progress")
async def get_achievement_progress(user: dict = Depends(get_current_user)):
    """Get user's progress towards unearned achievements"""
    user_id = user["id"]
    
    # Get user stats
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    # Count various stats
    bids_placed = await db.bids.count_documents({"user_id": user_id, "is_bot": {"$ne": True}})
    auctions_won = await db.auctions.count_documents({"winner_id": user_id})
    referrals = await db.users.count_documents({"referred_by": user_id})
    reviews = await db.winner_reviews.count_documents({"user_id": user_id})
    
    # Get earned achievements
    earned = await db.user_achievements.distinct("achievement_id", {"user_id": user_id})
    
    progress = []
    for ach_id, ach in ACHIEVEMENTS.items():
        if ach_id in earned:
            continue
        
        condition = ach.get("condition", {})
        current = 0
        target = 0
        
        if "bids_placed" in condition:
            current = bids_placed
            target = condition["bids_placed"]
        elif "auctions_won" in condition:
            current = auctions_won
            target = condition["auctions_won"]
        elif "referrals" in condition:
            current = referrals
            target = condition["referrals"]
        elif "reviews_written" in condition:
            current = reviews
            target = condition["reviews_written"]
        else:
            continue
        
        progress.append({
            "id": ach_id,
            "name": ach["name_de"],
            "icon": ach["icon"],
            "current": current,
            "target": target,
            "progress_percent": min(100, round(current / target * 100, 1)) if target > 0 else 0,
            "reward_bids": ach["reward_bids"]
        })
    
    # Sort by closest to completion
    progress.sort(key=lambda x: x["progress_percent"], reverse=True)
    
    return {"progress": progress[:10]}  # Return top 10 closest

# ==================== HELPER FUNCTIONS ====================

async def check_and_award_achievements(user_id: str):
    """Check if user has earned any new achievements and award them"""
    # Get user stats
    bids_placed = await db.bids.count_documents({"user_id": user_id, "is_bot": {"$ne": True}})
    auctions_won = await db.auctions.count_documents({"winner_id": user_id})
    referrals = await db.users.count_documents({"referred_by": user_id})
    reviews = await db.winner_reviews.count_documents({"user_id": user_id})
    
    # Get already earned achievements
    earned = await db.user_achievements.distinct("achievement_id", {"user_id": user_id})
    
    newly_earned = []
    
    for ach_id, ach in ACHIEVEMENTS.items():
        if ach_id in earned:
            continue
        
        condition = ach.get("condition", {})
        should_award = False
        
        if "bids_placed" in condition and bids_placed >= condition["bids_placed"]:
            should_award = True
        elif "auctions_won" in condition and auctions_won >= condition["auctions_won"]:
            should_award = True
        elif "referrals" in condition and referrals >= condition["referrals"]:
            should_award = True
        elif "reviews_written" in condition and reviews >= condition["reviews_written"]:
            should_award = True
        
        if should_award:
            # Award achievement
            await db.user_achievements.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "achievement_id": ach_id,
                "earned_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Award bonus bids
            if ach.get("reward_bids", 0) > 0:
                await db.users.update_one(
                    {"id": user_id},
                    {"$inc": {"bids": ach["reward_bids"]}}
                )
            
            newly_earned.append({
                "id": ach_id,
                "name": ach["name_de"],
                "icon": ach["icon"],
                "reward_bids": ach["reward_bids"]
            })
            
            logger.info(f"Achievement earned: {user_id} - {ach_id} (+{ach.get('reward_bids', 0)} bids)")
    
    return newly_earned

async def award_special_achievement(user_id: str, achievement_id: str):
    """Award a special achievement that requires manual checking"""
    if achievement_id not in ACHIEVEMENTS:
        return None
    
    # Check if already earned
    existing = await db.user_achievements.find_one({
        "user_id": user_id,
        "achievement_id": achievement_id
    })
    
    if existing:
        return None
    
    ach = ACHIEVEMENTS[achievement_id]
    
    # Award achievement
    await db.user_achievements.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "achievement_id": achievement_id,
        "earned_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Award bonus bids
    if ach.get("reward_bids", 0) > 0:
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"bids": ach["reward_bids"]}}
        )
    
    logger.info(f"Special achievement awarded: {user_id} - {achievement_id}")
    
    return {
        "id": achievement_id,
        "name": ach["name_de"],
        "icon": ach["icon"],
        "reward_bids": ach["reward_bids"]
    }


achievements_router = router
