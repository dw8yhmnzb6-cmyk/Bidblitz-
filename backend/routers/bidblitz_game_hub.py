"""
BidBlitz Game Hub - 20 Games
MongoDB-persistent wallet and game history
"""
from fastapi import APIRouter
from datetime import datetime, timezone
from pymongo import MongoClient
import random
import os

router = APIRouter(prefix="/hub", tags=["BidBlitz Game Hub"])

# MongoDB Connection
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "bidblitz")
client = MongoClient(mongo_url)
db = client[db_name]

# Collections
wallets_col = db["wallets"]
game_history_col = db["hub_game_history"]

# Static game data
GAME_NAMES = [
    "Puzzle Blocks", "Car Jam", "Idle Miner", "Fruit Match", "Space Battle",
    "Zombie Attack", "Speed Racer", "Treasure Hunter", "Dragon Quest", "City Builder",
    "Tower Defense", "Monster Battle", "Sky Adventure", "Island Escape", "Gold Rush",
    "Alien Invaders", "Rocket Escape", "Maze Runner", "Ocean Quest", "Farm Builder"
]

GAMES = [{"id": i+1, "name": name, "reward": random.randint(5, 20)} for i, name in enumerate(GAME_NAMES)]


def get_or_create_wallet(user_id: str) -> dict:
    """Get or create a wallet for user"""
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        now = datetime.now(timezone.utc)
        wallet = {
            "user_id": user_id,
            "coins": 50,  # Starting balance
            "created_at": now.isoformat()
        }
        wallets_col.insert_one(wallet)
    return wallet


# Wallet erstellen
@router.post("/wallet/create")
def wallet_create(user_id: str):
    wallet = get_or_create_wallet(user_id)
    return {"coins": wallet.get("coins", 0)}


# Wallet anzeigen
@router.get("/wallet")
def wallet_balance(user_id: str):
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    return {"coins": wallet.get("coins", 0) if wallet else 0}


# Spiele anzeigen
@router.get("/games")
def games_list():
    return GAMES


# Spiel starten
@router.post("/games/play")
def play_game(user_id: str, game_id: int):
    game = next((g for g in GAMES if g["id"] == game_id), None)
    
    if not game:
        return {"error": "game not found"}
    
    # Ensure wallet exists
    get_or_create_wallet(user_id)
    
    reward = game["reward"] + random.randint(0, 5)
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
        "game_id": game_id,
        "reward": reward,
        "timestamp": now.isoformat()
    })
    
    # Get updated balance
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "game": game["name"],
        "reward": reward,
        "wallet": wallet.get("coins", 0)
    }


# Ranking
@router.get("/games/leaderboard")
def leaderboard():
    # Get top 10 users by coins
    top_users = list(wallets_col.find({}, {"_id": 0, "user_id": 1, "coins": 1}).sort("coins", -1).limit(10))
    return [[u["user_id"], u.get("coins", 0)] for u in top_users]


# History
@router.get("/history")
def get_history(user_id: str):
    history = game_history_col.find_one(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    return history or {}
