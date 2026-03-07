"""
BidBlitz Game System - Simple & Fast
15 Games, Wallet, Leaderboard
"""
from fastapi import APIRouter
import random
import time

router = APIRouter(prefix="/games", tags=["BidBlitz Games"])

wallets = {}
game_history = {}

games = [
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


# Wallet erstellen
@router.post("/wallet/create")
def create_wallet(user_id: str):
    if user_id not in wallets:
        wallets[user_id] = 50
    return {"coins": wallets[user_id]}


# Wallet anzeigen
@router.get("/wallet")
def wallet(user_id: str):
    return {"coins": wallets.get(user_id, 0)}


# Spieleliste
@router.get("/list")
def list_games():
    return games


# Spiel starten
@router.post("/play")
def play(user_id: str, game_id: int):
    game = next((g for g in games if g["id"] == game_id), None)
    
    if not game:
        return {"error": "game not found"}
    
    reward = game["reward"] + random.randint(1, 5)
    
    wallets[user_id] = wallets.get(user_id, 0) + reward
    
    game_history[user_id] = {
        "game": game["name"],
        "icon": game["icon"],
        "reward": reward,
        "time": time.time()
    }
    
    return {
        "game": game["name"],
        "icon": game["icon"],
        "reward": reward,
        "wallet": wallets[user_id]
    }


# Ranking
@router.get("/leaderboard")
def leaderboard():
    ranking = sorted(wallets.items(), key=lambda x: x[1], reverse=True)
    return ranking[:10]


# User History
@router.get("/history")
def history(user_id: str):
    return game_history.get(user_id, {})
