"""
BidBlitz Weekly League & Missions System
Tracks user progress, weekly rankings, and daily missions
MongoDB-persistent storage
"""
from fastapi import APIRouter, Query
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
import os
import random

router = APIRouter(prefix="/league", tags=["Weekly League & Missions"])

# MongoDB Connection
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "bidblitz")
client = MongoClient(mongo_url)
db = client[db_name]

# Collections
league_users_col = db["league_users"]
league_history_col = db["league_history"]
missions_col = db["user_missions"]
mission_defs_col = db["mission_definitions"]

# Weekly League Tiers
LEAGUE_TIERS = {
    "bronze": {"min_points": 0, "max_points": 99, "reward": 50},
    "silver": {"min_points": 100, "max_points": 299, "reward": 150},
    "gold": {"min_points": 300, "max_points": 599, "reward": 300},
    "platinum": {"min_points": 600, "max_points": 999, "reward": 500},
    "diamond": {"min_points": 1000, "max_points": float('inf'), "reward": 1000}
}

# Default Missions
DEFAULT_MISSIONS = [
    {"id": "daily_login", "name": "Täglicher Login", "description": "Logge dich heute ein", "reward": 10, "type": "daily", "icon": "🔑", "target": 1},
    {"id": "play_3_games", "name": "Spieler", "description": "Spiele 3 Spiele", "reward": 25, "type": "daily", "icon": "🎮", "target": 3},
    {"id": "win_50_coins", "name": "Sammler", "description": "Gewinne 50 Coins", "reward": 15, "type": "daily", "icon": "🪙", "target": 50},
    {"id": "spin_wheel", "name": "Glücksrad", "description": "Drehe das Glücksrad", "reward": 20, "type": "daily", "icon": "🎰", "target": 1},
    {"id": "scratch_card", "name": "Rubbler", "description": "Nutze eine Rubbelkarte", "reward": 15, "type": "daily", "icon": "💳", "target": 1},
    {"id": "weekly_100_games", "name": "Marathonläufer", "description": "Spiele 100 Spiele diese Woche", "reward": 200, "type": "weekly", "icon": "🏃", "target": 100},
    {"id": "weekly_1000_coins", "name": "Großverdiener", "description": "Verdiene 1000 Coins diese Woche", "reward": 150, "type": "weekly", "icon": "💰", "target": 1000},
    {"id": "invite_friend", "name": "Botschafter", "description": "Lade einen Freund ein", "reward": 100, "type": "special", "icon": "👥", "target": 1},
]


def get_current_week():
    """Get the current week number and year"""
    now = datetime.now(timezone.utc)
    return f"{now.year}-W{now.isocalendar()[1]}"


def get_league_tier(points: int) -> str:
    """Determine league tier based on points"""
    for tier, data in LEAGUE_TIERS.items():
        if data["min_points"] <= points <= data["max_points"]:
            return tier
    return "diamond"


def get_or_create_league_user(user_id: str) -> dict:
    """Get or create league profile for user"""
    week = get_current_week()
    user = league_users_col.find_one({"user_id": user_id, "week": week}, {"_id": 0})
    
    if not user:
        user = {
            "user_id": user_id,
            "week": week,
            "points": 0,
            "tier": "bronze",
            "games_played": 0,
            "coins_earned": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        league_users_col.insert_one(user)
    
    return user


# =====================
# LEAGUE ENDPOINTS
# =====================

@router.get("/status")
def league_status(user_id: str):
    """Get user's current league status"""
    user = get_or_create_league_user(user_id)
    week = get_current_week()
    
    # Get rank
    higher_count = league_users_col.count_documents({
        "week": week,
        "points": {"$gt": user["points"]}
    })
    rank = higher_count + 1
    
    return {
        "user_id": user_id,
        "week": week,
        "points": user["points"],
        "tier": user["tier"],
        "rank": rank,
        "games_played": user.get("games_played", 0),
        "coins_earned": user.get("coins_earned", 0),
        "tier_reward": LEAGUE_TIERS.get(user["tier"], {}).get("reward", 0)
    }


@router.post("/add-points")
def add_points(user_id: str, points: int = Query(ge=1), source: str = "game"):
    """Add points to user's weekly total"""
    week = get_current_week()
    get_or_create_league_user(user_id)
    
    # Update points
    result = league_users_col.find_one_and_update(
        {"user_id": user_id, "week": week},
        {
            "$inc": {"points": points, "games_played": 1 if source == "game" else 0},
            "$set": {"last_activity": datetime.now(timezone.utc).isoformat()}
        },
        return_document=True
    )
    
    # Update tier
    new_tier = get_league_tier(result["points"])
    if new_tier != result.get("tier"):
        league_users_col.update_one(
            {"user_id": user_id, "week": week},
            {"$set": {"tier": new_tier}}
        )
    
    return {
        "points": result["points"],
        "tier": new_tier,
        "added": points
    }


@router.get("/leaderboard")
def leaderboard(limit: int = 20):
    """Get weekly leaderboard"""
    week = get_current_week()
    
    users = list(league_users_col.find(
        {"week": week},
        {"_id": 0, "user_id": 1, "points": 1, "tier": 1, "games_played": 1}
    ).sort("points", -1).limit(limit))
    
    # Add ranks
    for i, user in enumerate(users):
        user["rank"] = i + 1
    
    return {
        "week": week,
        "leaderboard": users
    }


@router.get("/tiers")
def get_tiers():
    """Get all league tiers"""
    return LEAGUE_TIERS


# =====================
# MISSIONS ENDPOINTS
# =====================

@router.get("/missions")
def get_missions(user_id: str):
    """Get user's daily and weekly missions"""
    today = datetime.now(timezone.utc).date().isoformat()
    week = get_current_week()
    
    # Get user's mission progress
    user_missions = missions_col.find_one(
        {"user_id": user_id, "date": today},
        {"_id": 0}
    )
    
    if not user_missions:
        # Initialize missions for today
        user_missions = {
            "user_id": user_id,
            "date": today,
            "week": week,
            "missions": {}
        }
        
        # Set initial progress for each mission
        for mission in DEFAULT_MISSIONS:
            user_missions["missions"][mission["id"]] = {
                "progress": 0,
                "completed": False,
                "claimed": False
            }
        
        missions_col.insert_one(user_missions)
    
    # Build response with mission definitions
    missions_list = []
    for mission in DEFAULT_MISSIONS:
        progress_data = user_missions.get("missions", {}).get(mission["id"], {})
        missions_list.append({
            **mission,
            "progress": progress_data.get("progress", 0),
            "completed": progress_data.get("completed", False),
            "claimed": progress_data.get("claimed", False)
        })
    
    return {
        "date": today,
        "daily": [m for m in missions_list if m["type"] == "daily"],
        "weekly": [m for m in missions_list if m["type"] == "weekly"],
        "special": [m for m in missions_list if m["type"] == "special"]
    }


@router.post("/missions/progress")
def update_mission_progress(user_id: str, mission_id: str, amount: int = 1):
    """Update progress on a mission"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Find mission definition
    mission_def = next((m for m in DEFAULT_MISSIONS if m["id"] == mission_id), None)
    if not mission_def:
        return {"error": "Mission not found"}
    
    # Get current progress
    user_missions = missions_col.find_one({"user_id": user_id, "date": today})
    
    if not user_missions:
        # Initialize
        get_missions(user_id)
        user_missions = missions_col.find_one({"user_id": user_id, "date": today})
    
    current_progress = user_missions.get("missions", {}).get(mission_id, {}).get("progress", 0)
    new_progress = min(current_progress + amount, mission_def["target"])
    completed = new_progress >= mission_def["target"]
    
    # Update
    missions_col.update_one(
        {"user_id": user_id, "date": today},
        {"$set": {
            f"missions.{mission_id}.progress": new_progress,
            f"missions.{mission_id}.completed": completed
        }}
    )
    
    return {
        "mission_id": mission_id,
        "progress": new_progress,
        "target": mission_def["target"],
        "completed": completed,
        "reward": mission_def["reward"] if completed else 0
    }


@router.post("/missions/claim")
def claim_mission(user_id: str, mission_id: str):
    """Claim reward for completed mission"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    mission_def = next((m for m in DEFAULT_MISSIONS if m["id"] == mission_id), None)
    if not mission_def:
        return {"error": "Mission not found"}
    
    user_missions = missions_col.find_one({"user_id": user_id, "date": today})
    if not user_missions:
        return {"error": "No missions found"}
    
    mission_progress = user_missions.get("missions", {}).get(mission_id, {})
    
    if not mission_progress.get("completed"):
        return {"error": "Mission not completed"}
    
    if mission_progress.get("claimed"):
        return {"error": "Already claimed"}
    
    # Mark as claimed
    missions_col.update_one(
        {"user_id": user_id, "date": today},
        {"$set": {f"missions.{mission_id}.claimed": True}}
    )
    
    # Add league points for completing mission
    add_points(user_id, mission_def["reward"] // 2, source="mission")
    
    return {
        "success": True,
        "reward": mission_def["reward"],
        "league_points": mission_def["reward"] // 2
    }


@router.get("/missions/summary")
def missions_summary(user_id: str):
    """Get summary of mission completion"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    user_missions = missions_col.find_one({"user_id": user_id, "date": today}, {"_id": 0})
    
    if not user_missions:
        return {
            "completed": 0,
            "total": len([m for m in DEFAULT_MISSIONS if m["type"] == "daily"]),
            "unclaimed": 0
        }
    
    daily_missions = [m for m in DEFAULT_MISSIONS if m["type"] == "daily"]
    completed = sum(1 for m in daily_missions if user_missions.get("missions", {}).get(m["id"], {}).get("completed", False))
    unclaimed = sum(1 for m in daily_missions if user_missions.get("missions", {}).get(m["id"], {}).get("completed", False) and not user_missions.get("missions", {}).get(m["id"], {}).get("claimed", False))
    
    return {
        "completed": completed,
        "total": len(daily_missions),
        "unclaimed": unclaimed
    }
