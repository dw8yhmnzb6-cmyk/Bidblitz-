"""
BidBlitz Game System - Simple & Fast
15 Games, Wallet, Leaderboard
MongoDB-persistent storage
"""
from fastapi import APIRouter
from datetime import datetime, timezone
from pymongo import MongoClient
import random
import os

router = APIRouter(prefix="/games", tags=["BidBlitz Games"])

# MongoDB Connection
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "bidblitz")
client = MongoClient(mongo_url)
db = client[db_name]

# Collections
wallets_col = db["wallets"]
game_history_col = db["simple_game_history"]

GAMES = [
    {"id": 1, "name": "Puzzle Blocks", "icon": "🧩", "reward": 5},
    {"id": 2, "name": "Car Jam", "icon": "🚗", "reward": 6},
    {"id": 3, "name": "Idle Miner", "icon": "⛏", "reward": 10},
    {"id": 4, "name": "Fruit Match", "icon": "🍓", "reward": 7},
    {"id": 5, "name": "Space Battle", "icon": "🚀", "reward": 12},
    {"id": 6, "name": "Zombie Attack", "icon": "🧟", "reward": 9},
    {"id": 7, "name": "Speed Racer", "icon": "🏎", "reward": 8},
    {"id": 8, "name": "Treasure Hunter", "icon": "💎", "reward": 11},
    {"id": 9, "name": "Dragon Quest", "icon": "🐉", "reward": 15},
    {"id": 10, "name": "City Builder", "icon": "🏙", "reward": 13},
    {"id": 11, "name": "Tower Defense", "icon": "🏰", "reward": 14},
    {"id": 12, "name": "Monster Battle", "icon": "👾", "reward": 16},
    {"id": 13, "name": "Sky Adventure", "icon": "✈️", "reward": 10},
    {"id": 14, "name": "Island Escape", "icon": "🏝", "reward": 12},
    {"id": 15, "name": "Gold Rush", "icon": "💰", "reward": 18}
]


def get_or_create_wallet(user_id: str) -> dict:
    """Get or create a wallet for user"""
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        now = datetime.now(timezone.utc)
        wallet = {
            "user_id": user_id,
            "coins": 50,
            "created_at": now.isoformat()
        }
        wallets_col.insert_one(wallet)
    return wallet


# Wallet erstellen
@router.post("/wallet/create")
def create_wallet(user_id: str):
    wallet = get_or_create_wallet(user_id)
    return {"coins": wallet.get("coins", 0)}


# Wallet anzeigen
@router.get("/wallet")
def wallet(user_id: str):
    wallet_doc = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    return {"coins": wallet_doc.get("coins", 0) if wallet_doc else 0}


# Spieleliste
@router.get("/list")
def list_games():
    return GAMES


# Spiel starten
@router.post("/play")
def play(user_id: str, game_id: int):
    game = next((g for g in GAMES if g["id"] == game_id), None)
    
    if not game:
        return {"error": "game not found"}
    
    # Ensure wallet exists
    get_or_create_wallet(user_id)
    
    reward = game["reward"] + random.randint(1, 5)
    now = datetime.now(timezone.utc)
    
    # Update wallet
    wallets_col.update_one(
        {"user_id": user_id},
        {"$inc": {"coins": reward}}
    )
    
    # Log game play
    game_history_col.insert_one({
        "user_id": user_id,
        "game_name": game["name"],
        "game_icon": game["icon"],
        "game_id": game_id,
        "reward": reward,
        "timestamp": now.isoformat()
    })
    
    wallet_doc = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "game": game["name"],
        "icon": game["icon"],
        "reward": reward,
        "wallet": wallet_doc.get("coins", 0)
    }


# Ranking
@router.get("/leaderboard")
def leaderboard():
    top_users = list(wallets_col.find({}, {"_id": 0, "user_id": 1, "coins": 1}).sort("coins", -1).limit(10))
    return [[u["user_id"], u.get("coins", 0)] for u in top_users]


# User History
@router.get("/history")
def history(user_id: str):
    hist = game_history_col.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    return hist or {}
