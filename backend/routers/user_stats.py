"""User Statistics - Personal stats and savings tracker"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/user-stats", tags=["User Statistics"])

# ==================== STATISTICS ENDPOINTS ====================

@router.get("/overview")
async def get_stats_overview(user: dict = Depends(get_current_user)):
    """Get comprehensive user statistics overview"""
    user_id = user["id"]
    
    # Get won auctions
    won_auctions = await db.won_auctions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Calculate savings
    total_savings = 0
    total_retail_value = 0
    total_paid = 0
    
    for auction in won_auctions:
        retail = auction.get("retail_price") or 0
        paid = (auction.get("final_price") or 0) + (auction.get("bids_cost") or 0)
        total_retail_value += retail
        total_paid += paid
        total_savings += max(0, retail - paid)
    
    # Get bid statistics
    total_bids_placed = await db.bids.count_documents({"user_id": user_id})
    total_bids_purchased = user.get("total_bids_purchased", 0)
    
    # Get auction participation
    participated_auctions = await db.bids.distinct("auction_id", {"user_id": user_id})
    
    # Win rate
    win_rate = (len(won_auctions) / len(participated_auctions) * 100) if participated_auctions else 0
    
    # Loyalty points
    loyalty = await db.loyalty_points.find_one({"user_id": user_id}, {"_id": 0})
    
    # Streak info
    current_streak = user.get("login_streak", 0)
    max_streak = user.get("max_login_streak", 0)
    
    # Recent activity (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_bids = await db.bids.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": thirty_days_ago}
    })
    recent_wins = await db.won_auctions.count_documents({
        "user_id": user_id,
        "won_at": {"$gte": thirty_days_ago}
    })
    
    return {
        "overview": {
            "total_savings": round(total_savings, 2),
            "total_retail_value": round(total_retail_value, 2),
            "total_paid": round(total_paid, 2),
            "savings_percentage": round((total_savings / total_retail_value * 100), 1) if total_retail_value > 0 else 0
        },
        "auctions": {
            "total_won": len(won_auctions),
            "total_participated": len(participated_auctions),
            "win_rate": round(win_rate, 1)
        },
        "bids": {
            "total_placed": total_bids_placed,
            "total_purchased": total_bids_purchased,
            "current_balance": user.get("bids_balance", 0)
        },
        "loyalty": {
            "available_points": loyalty.get("available_points", 0) if loyalty else 0,
            "lifetime_points": loyalty.get("lifetime_points", 0) if loyalty else 0,
            "level": loyalty.get("level", "Bronze") if loyalty else "Bronze"
        },
        "streaks": {
            "current_login_streak": current_streak,
            "max_login_streak": max_streak
        },
        "recent_activity": {
            "bids_last_30_days": recent_bids,
            "wins_last_30_days": recent_wins
        },
        "member_since": user.get("created_at", ""),
        "is_vip": user.get("is_vip", False)
    }

@router.get("/achievements")
async def get_achievements(user: dict = Depends(get_current_user)):
    """Get user achievements and badges"""
    user_id = user["id"]
    
    # Define achievements
    achievements = [
        {
            "id": "first_win",
            "name": "Erster Sieg",
            "description": "Erste Auktion gewonnen",
            "icon": "🏆",
            "unlocked": False
        },
        {
            "id": "bid_100",
            "name": "Fleißiger Bieter",
            "description": "100 Gebote platziert",
            "icon": "⚡",
            "unlocked": False
        },
        {
            "id": "bid_500",
            "name": "Power-Bieter",
            "description": "500 Gebote platziert",
            "icon": "💪",
            "unlocked": False
        },
        {
            "id": "bid_1000",
            "name": "Gebot-Meister",
            "description": "1000 Gebote platziert",
            "icon": "👑",
            "unlocked": False
        },
        {
            "id": "win_5",
            "name": "Gewinner",
            "description": "5 Auktionen gewonnen",
            "icon": "🥇",
            "unlocked": False
        },
        {
            "id": "win_25",
            "name": "Champion",
            "description": "25 Auktionen gewonnen",
            "icon": "🏅",
            "unlocked": False
        },
        {
            "id": "savings_100",
            "name": "Sparfuchs",
            "description": "€100 gespart",
            "icon": "💰",
            "unlocked": False
        },
        {
            "id": "savings_500",
            "name": "Spar-Profi",
            "description": "€500 gespart",
            "icon": "💎",
            "unlocked": False
        },
        {
            "id": "streak_7",
            "name": "Treuer Besucher",
            "description": "7 Tage Login-Streak",
            "icon": "🔥",
            "unlocked": False
        },
        {
            "id": "streak_30",
            "name": "Stammgast",
            "description": "30 Tage Login-Streak",
            "icon": "⭐",
            "unlocked": False
        },
        {
            "id": "referral_1",
            "name": "Empfehler",
            "description": "Ersten Freund geworben",
            "icon": "🤝",
            "unlocked": False
        },
        {
            "id": "vip",
            "name": "VIP-Status",
            "description": "VIP-Mitglied geworden",
            "icon": "👑",
            "unlocked": False
        }
    ]
    
    # Check unlocks
    total_bids = await db.bids.count_documents({"user_id": user_id})
    total_wins = await db.won_auctions.count_documents({"user_id": user_id})
    
    # Calculate savings
    won_auctions = await db.won_auctions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    total_savings = sum(
        max(0, (a.get("retail_price") or 0) - (a.get("final_price") or 0) - (a.get("bids_cost") or 0))
        for a in won_auctions
    )
    
    max_streak = user.get("max_login_streak", 0)
    referrals = await db.referrals.count_documents({"referrer_id": user_id, "has_purchased": True})
    
    # Update achievement status
    for ach in achievements:
        if ach["id"] == "first_win" and total_wins >= 1:
            ach["unlocked"] = True
        elif ach["id"] == "bid_100" and total_bids >= 100:
            ach["unlocked"] = True
        elif ach["id"] == "bid_500" and total_bids >= 500:
            ach["unlocked"] = True
        elif ach["id"] == "bid_1000" and total_bids >= 1000:
            ach["unlocked"] = True
        elif ach["id"] == "win_5" and total_wins >= 5:
            ach["unlocked"] = True
        elif ach["id"] == "win_25" and total_wins >= 25:
            ach["unlocked"] = True
        elif ach["id"] == "savings_100" and total_savings >= 100:
            ach["unlocked"] = True
        elif ach["id"] == "savings_500" and total_savings >= 500:
            ach["unlocked"] = True
        elif ach["id"] == "streak_7" and max_streak >= 7:
            ach["unlocked"] = True
        elif ach["id"] == "streak_30" and max_streak >= 30:
            ach["unlocked"] = True
        elif ach["id"] == "referral_1" and referrals >= 1:
            ach["unlocked"] = True
        elif ach["id"] == "vip" and user.get("is_vip"):
            ach["unlocked"] = True
    
    unlocked = [a for a in achievements if a["unlocked"]]
    locked = [a for a in achievements if not a["unlocked"]]
    
    return {
        "achievements": achievements,
        "unlocked_count": len(unlocked),
        "total_count": len(achievements),
        "completion_percentage": round(len(unlocked) / len(achievements) * 100)
    }

@router.get("/history")
async def get_bidding_history(
    limit: int = 50,
    offset: int = 0,
    user: dict = Depends(get_current_user)
):
    """Get user's bidding history"""
    bids = await db.bids.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    # Enrich with auction info
    enriched = []
    for bid in bids:
        auction = await db.auctions.find_one(
            {"id": bid["auction_id"]},
            {"_id": 0, "id": 1, "status": 1}
        )
        product = None
        if auction:
            product = await db.products.find_one(
                {"id": auction.get("product_id")},
                {"_id": 0, "name": 1, "image_url": 1}
            )
        enriched.append({
            **bid,
            "auction_status": auction.get("status") if auction else "unknown",
            "product_name": product.get("name") if product else "Unbekannt",
            "product_image": product.get("image_url") if product else None
        })
    
    total = await db.bids.count_documents({"user_id": user["id"]})
    
    return {
        "bids": enriched,
        "total": total,
        "has_more": offset + limit < total
    }

@router.get("/wins")
async def get_win_history(
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get user's win history with savings"""
    wins = await db.won_auctions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("won_at", -1).limit(limit).to_list(limit)
    
    # Enrich with product info
    enriched = []
    for win in wins:
        product = await db.products.find_one(
            {"id": win.get("product_id")},
            {"_id": 0, "name": 1, "image_url": 1, "retail_price": 1}
        )
        
        retail = win.get("retail_price", 0)
        paid = win.get("final_price", 0) + win.get("bids_cost", 0)
        savings = max(0, retail - paid)
        
        enriched.append({
            **win,
            "product": product,
            "savings": round(savings, 2),
            "savings_percent": round((savings / retail * 100), 1) if retail > 0 else 0
        })
    
    return {"wins": enriched}

@router.get("/leaderboard-position")
async def get_leaderboard_position(user: dict = Depends(get_current_user)):
    """Get user's position in various leaderboards"""
    user_id = user["id"]
    
    # Savings leaderboard
    all_users_savings = []
    users = await db.users.find({}, {"_id": 0, "id": 1}).to_list(10000)
    
    for u in users:
        wins = await db.won_auctions.find({"user_id": u["id"]}).to_list(1000)
        savings = sum(
            max(0, w.get("retail_price", 0) - w.get("final_price", 0) - w.get("bids_cost", 0))
            for w in wins
        )
        all_users_savings.append({"user_id": u["id"], "savings": savings})
    
    all_users_savings.sort(key=lambda x: x["savings"], reverse=True)
    
    savings_position = next(
        (i + 1 for i, u in enumerate(all_users_savings) if u["user_id"] == user_id),
        None
    )
    
    # Wins leaderboard
    pipeline = [
        {"$group": {"_id": "$user_id", "wins": {"$sum": 1}}},
        {"$sort": {"wins": -1}}
    ]
    wins_ranking = await db.won_auctions.aggregate(pipeline).to_list(10000)
    wins_position = next(
        (i + 1 for i, u in enumerate(wins_ranking) if u["_id"] == user_id),
        None
    )
    
    return {
        "savings_rank": savings_position,
        "wins_rank": wins_position,
        "total_users": len(users)
    }


# ==================== DAILY REWARDS ====================

@router.get("/daily-reward-status")
async def get_daily_reward_status(user: dict = Depends(get_current_user)):
    """Check if daily reward is available"""
    user_id = user["id"]
    
    gamification = user.get("gamification", {})
    last_claim = gamification.get("last_daily_claim")
    login_streak = gamification.get("login_streak", 0)
    
    now = datetime.now(timezone.utc)
    today = now.date()
    
    can_claim = True
    if last_claim:
        if isinstance(last_claim, str):
            last_claim = datetime.fromisoformat(last_claim.replace('Z', '+00:00'))
        last_claim_date = last_claim.date()
        can_claim = last_claim_date != today
    
    # Calculate potential reward
    streak_for_calc = login_streak + 1 if can_claim else login_streak
    base_reward = 2
    streak_bonus = min(streak_for_calc, 7)
    
    # Next milestone
    milestones = [7, 14, 30, 60, 90]
    next_milestone = None
    for m in milestones:
        if login_streak < m:
            next_milestone = {"days": m, "remaining": m - login_streak}
            break
    
    return {
        "can_claim": can_claim,
        "current_streak": login_streak,
        "potential_reward": base_reward + streak_bonus,
        "next_milestone": next_milestone
    }


@router.post("/claim-daily-reward")
async def claim_daily_reward(user: dict = Depends(get_current_user)):
    """Claim daily login reward"""
    user_id = user["id"]
    
    gamification = user.get("gamification", {})
    last_claim = gamification.get("last_daily_claim")
    login_streak = gamification.get("login_streak", 0)
    
    now = datetime.now(timezone.utc)
    today = now.date()
    
    # Check if already claimed today
    if last_claim:
        if isinstance(last_claim, str):
            last_claim = datetime.fromisoformat(last_claim.replace('Z', '+00:00'))
        last_claim_date = last_claim.date()
        if last_claim_date == today:
            return {
                "success": False,
                "message": "Du hast deine tägliche Belohnung bereits abgeholt!",
                "next_claim": (datetime.combine(today + timedelta(days=1), datetime.min.time())).isoformat()
            }
        
        # Check if streak continues
        yesterday = today - timedelta(days=1)
        if last_claim_date == yesterday:
            login_streak += 1
        else:
            login_streak = 1
    else:
        login_streak = 1
    
    # Calculate reward based on streak
    base_reward = 2
    streak_bonus = min(login_streak, 7)
    xp_reward = 10 + (login_streak * 5)
    
    total_bids = base_reward + streak_bonus
    
    # Special rewards for milestones
    milestone_bonus = 0
    milestone_message = None
    if login_streak == 7:
        milestone_bonus = 10
        milestone_message = "🎉 7-Tage-Streak! +10 Bonus-Gebote!"
    elif login_streak == 14:
        milestone_bonus = 20
        milestone_message = "🔥 14-Tage-Streak! +20 Bonus-Gebote!"
    elif login_streak == 30:
        milestone_bonus = 50
        milestone_message = "💪 30-Tage-Streak! +50 Bonus-Gebote!"
    elif login_streak == 60:
        milestone_bonus = 100
        milestone_message = "🌟 60-Tage-Streak! +100 Bonus-Gebote!"
    elif login_streak == 90:
        milestone_bonus = 200
        milestone_message = "👑 90-Tage-Streak! +200 Bonus-Gebote!"
    
    total_bids += milestone_bonus
    
    # Update user
    current_xp = gamification.get("xp", 0)
    current_bids = user.get("bids_balance", user.get("bid_balance", 0))
    max_streak = max(user.get("max_login_streak", 0), login_streak)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "gamification.last_daily_claim": now,
            "gamification.login_streak": login_streak,
            "gamification.xp": current_xp + xp_reward,
            "login_streak": login_streak,
            "max_login_streak": max_streak,
            "bids_balance": current_bids + total_bids,
            "bid_balance": current_bids + total_bids
        }}
    )
    
    # Log the reward
    await db.daily_rewards_log.insert_one({
        "user_id": user_id,
        "claimed_at": now,
        "streak": login_streak,
        "bids_awarded": total_bids,
        "xp_awarded": xp_reward
    })
    
    return {
        "success": True,
        "message": f"Tägliche Belohnung abgeholt!",
        "reward": {
            "bids": total_bids,
            "xp": xp_reward,
            "streak": login_streak,
            "milestone_message": milestone_message
        },
        "new_balance": current_bids + total_bids,
        "next_claim": (datetime.combine(today + timedelta(days=1), datetime.min.time())).isoformat()
    }


# ==================== LEADERBOARDS ====================

@router.get("/leaderboard")
async def get_leaderboard(type: str = "weekly", limit: int = 10):
    """Get leaderboard by wins"""
    now = datetime.now(timezone.utc)
    
    if type == "weekly":
        start_date = now - timedelta(days=7)
    elif type == "monthly":
        start_date = now - timedelta(days=30)
    else:
        start_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
    
    # Get wins in period
    pipeline = [
        {"$match": {
            "won_at": {"$gte": start_date.isoformat()}
        }},
        {"$group": {
            "_id": "$user_id",
            "wins": {"$sum": 1},
            "total_savings": {"$sum": {"$subtract": ["$retail_price", "$final_price"]}}
        }},
        {"$sort": {"wins": -1}},
        {"$limit": limit}
    ]
    
    results = await db.won_auctions.aggregate(pipeline).to_list(length=limit)
    
    # Get user details
    leaderboard = []
    for i, result in enumerate(results):
        user = await db.users.find_one(
            {"id": result["_id"]},
            {"_id": 0, "name": 1, "gamification": 1, "avatar_url": 1}
        )
        if user:
            gamification = user.get("gamification", {})
            xp = gamification.get("xp", 0)
            leaderboard.append({
                "rank": i + 1,
                "user_id": result["_id"],
                "username": user.get("name", "Anonym"),
                "avatar_url": user.get("avatar_url"),
                "wins": result["wins"],
                "total_savings": round(result.get("total_savings", 0), 2),
                "xp": xp
            })
    
    return {
        "type": type,
        "period": {
            "start": start_date.isoformat(),
            "end": now.isoformat()
        },
        "leaderboard": leaderboard
    }


@router.get("/leaderboard/xp")
async def get_xp_leaderboard(limit: int = 10):
    """Get leaderboard by XP"""
    pipeline = [
        {"$match": {"gamification.xp": {"$gt": 0}}},
        {"$sort": {"gamification.xp": -1}},
        {"$limit": limit},
        {"$project": {
            "_id": 0,
            "id": 1,
            "name": 1,
            "avatar_url": 1,
            "gamification": 1
        }}
    ]
    
    users = await db.users.aggregate(pipeline).to_list(length=limit)
    
    leaderboard = []
    for i, user in enumerate(users):
        gamification = user.get("gamification", {})
        leaderboard.append({
            "rank": i + 1,
            "user_id": user.get("id"),
            "username": user.get("name", "Anonym"),
            "avatar_url": user.get("avatar_url"),
            "xp": gamification.get("xp", 0),
            "login_streak": gamification.get("login_streak", 0)
        })
    
    return {"leaderboard": leaderboard}
