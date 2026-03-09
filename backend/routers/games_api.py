"""
BidBlitz Game API Router
Full game management system with categories, scores, and leaderboards
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
import json

router = APIRouter(prefix="/api/games", tags=["games"])

# Import database
import sys
sys.path.append('/app/backend')
from server import db

# Models
class GameCreate(BaseModel):
    name: str
    slug: str
    category: str  # puzzle, strategy, tycoon, arcade, 3d
    description: str = ""
    thumbnail: str = ""
    min_score: int = 0
    max_reward: int = 100
    cost_to_play: int = 0
    is_active: bool = True

class GameUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    min_score: Optional[int] = None
    max_reward: Optional[int] = None
    cost_to_play: Optional[int] = None
    is_active: Optional[bool] = None

class ScoreSubmit(BaseModel):
    user_id: str
    game_id: str
    score: int

class GameResponse(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    description: str
    thumbnail: str
    min_score: int
    max_reward: int
    cost_to_play: int
    is_active: bool
    play_count: int
    created_at: str

# Helper to convert MongoDB doc
def game_to_dict(game):
    return {
        "id": str(game["_id"]),
        "name": game.get("name", ""),
        "slug": game.get("slug", ""),
        "category": game.get("category", "arcade"),
        "description": game.get("description", ""),
        "thumbnail": game.get("thumbnail", ""),
        "min_score": game.get("min_score", 0),
        "max_reward": game.get("max_reward", 100),
        "cost_to_play": game.get("cost_to_play", 0),
        "is_active": game.get("is_active", True),
        "play_count": game.get("play_count", 0),
        "created_at": game.get("created_at", datetime.utcnow()).isoformat() if game.get("created_at") else datetime.utcnow().isoformat()
    }

# ==================== GAME ENDPOINTS ====================

@router.get("")
async def get_all_games(category: Optional[str] = None, active_only: bool = True):
    """Get all games, optionally filtered by category"""
    query = {}
    if category:
        query["category"] = category
    if active_only:
        query["is_active"] = True
    
    games = await db.games.find(query).sort("play_count", -1).to_list(1000)
    return [game_to_dict(g) for g in games]

@router.get("/categories")
async def get_categories():
    """Get all game categories with counts"""
    categories = ["puzzle", "strategy", "tycoon", "arcade", "3d"]
    result = []
    for cat in categories:
        count = await db.games.count_documents({"category": cat, "is_active": True})
        result.append({"name": cat, "count": count})
    return result

@router.get("/{game_id}")
async def get_game(game_id: str):
    """Get a specific game by ID or slug"""
    # Try by ID first
    try:
        game = await db.games.find_one({"_id": ObjectId(game_id)})
    except:
        game = None
    
    # Try by slug
    if not game:
        game = await db.games.find_one({"slug": game_id})
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return game_to_dict(game)

@router.post("")
async def create_game(game: GameCreate):
    """Create a new game (Admin only)"""
    # Check if slug exists
    existing = await db.games.find_one({"slug": game.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Game with this slug already exists")
    
    game_doc = {
        **game.dict(),
        "play_count": 0,
        "total_score": 0,
        "created_at": datetime.utcnow()
    }
    
    result = await db.games.insert_one(game_doc)
    game_doc["_id"] = result.inserted_id
    
    return game_to_dict(game_doc)

@router.put("/{game_id}")
async def update_game(game_id: str, game: GameUpdate):
    """Update a game (Admin only)"""
    update_data = {k: v for k, v in game.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.games.update_one(
        {"_id": ObjectId(game_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    
    updated = await db.games.find_one({"_id": ObjectId(game_id)})
    return game_to_dict(updated)

@router.delete("/{game_id}")
async def delete_game(game_id: str):
    """Delete a game (Admin only)"""
    result = await db.games.delete_one({"_id": ObjectId(game_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return {"message": "Game deleted successfully"}

# ==================== SCORE ENDPOINTS ====================

@router.post("/score")
async def submit_score(score_data: ScoreSubmit):
    """Submit a game score and earn rewards"""
    # Get game
    try:
        game = await db.games.find_one({"_id": ObjectId(score_data.game_id)})
    except:
        game = await db.games.find_one({"slug": score_data.game_id})
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Calculate reward based on score
    max_reward = game.get("max_reward", 100)
    min_score = game.get("min_score", 0)
    
    # Simple reward calculation: score percentage of max reward
    if score_data.score >= min_score:
        reward = min(max_reward, int(score_data.score * 0.1))
    else:
        reward = 0
    
    # Save score
    score_doc = {
        "user_id": score_data.user_id,
        "game_id": str(game["_id"]),
        "game_slug": game.get("slug", ""),
        "score": score_data.score,
        "reward": reward,
        "created_at": datetime.utcnow()
    }
    await db.game_scores.insert_one(score_doc)
    
    # Update game play count
    await db.games.update_one(
        {"_id": game["_id"]},
        {
            "$inc": {"play_count": 1, "total_score": score_data.score}
        }
    )
    
    # Add coins to user wallet
    if reward > 0:
        await db.wallets.update_one(
            {"user_id": score_data.user_id},
            {"$inc": {"coins": reward}},
            upsert=True
        )
    
    return {
        "score": score_data.score,
        "reward": reward,
        "message": f"Score submitted! You earned {reward} coins."
    }

@router.get("/leaderboard/{game_id}")
async def get_game_leaderboard(game_id: str, limit: int = 10):
    """Get leaderboard for a specific game"""
    pipeline = [
        {"$match": {"game_id": game_id}},
        {"$group": {
            "_id": "$user_id",
            "best_score": {"$max": "$score"},
            "total_plays": {"$sum": 1},
            "total_earned": {"$sum": "$reward"}
        }},
        {"$sort": {"best_score": -1}},
        {"$limit": limit}
    ]
    
    scores = await db.game_scores.aggregate(pipeline).to_list(limit)
    
    # Get user names
    result = []
    for i, entry in enumerate(scores):
        user = await db.users.find_one({"_id": ObjectId(entry["_id"])}) if ObjectId.is_valid(entry["_id"]) else None
        result.append({
            "rank": i + 1,
            "user_id": entry["_id"],
            "user_name": user.get("name", "Anonymous") if user else "Anonymous",
            "best_score": entry["best_score"],
            "total_plays": entry["total_plays"],
            "total_earned": entry["total_earned"]
        })
    
    return result

@router.get("/leaderboard/global/top")
async def get_global_leaderboard(limit: int = 20):
    """Get global leaderboard across all games"""
    pipeline = [
        {"$group": {
            "_id": "$user_id",
            "total_score": {"$sum": "$score"},
            "total_plays": {"$sum": 1},
            "total_earned": {"$sum": "$reward"},
            "games_played": {"$addToSet": "$game_slug"}
        }},
        {"$sort": {"total_score": -1}},
        {"$limit": limit}
    ]
    
    scores = await db.game_scores.aggregate(pipeline).to_list(limit)
    
    result = []
    for i, entry in enumerate(scores):
        user = await db.users.find_one({"_id": ObjectId(entry["_id"])}) if ObjectId.is_valid(entry["_id"]) else None
        result.append({
            "rank": i + 1,
            "user_id": entry["_id"],
            "user_name": user.get("name", "Anonymous") if user else "Anonymous",
            "total_score": entry["total_score"],
            "total_plays": entry["total_plays"],
            "total_earned": entry["total_earned"],
            "games_played": len(entry.get("games_played", []))
        })
    
    return result

# ==================== STATS ENDPOINTS ====================

@router.get("/stats/overview")
async def get_game_stats():
    """Get overall game statistics"""
    total_games = await db.games.count_documents({"is_active": True})
    total_plays = await db.game_scores.count_documents({})
    
    # Category breakdown
    categories = {}
    for cat in ["puzzle", "strategy", "tycoon", "arcade", "3d"]:
        categories[cat] = await db.games.count_documents({"category": cat, "is_active": True})
    
    # Top games
    top_games = await db.games.find({"is_active": True}).sort("play_count", -1).limit(5).to_list(5)
    
    return {
        "total_games": total_games,
        "total_plays": total_plays,
        "categories": categories,
        "top_games": [{"name": g["name"], "plays": g.get("play_count", 0)} for g in top_games]
    }
