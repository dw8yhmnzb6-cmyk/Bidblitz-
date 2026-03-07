"""
BidBlitz Miner Dashboard
Buy miners, view info, claim rewards
MongoDB-persistent storage
"""
from fastapi import APIRouter
from datetime import datetime, timezone
from pymongo import MongoClient
import os

router = APIRouter(prefix="/miner", tags=["Miner Dashboard"])

# MongoDB Connection
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "bidblitz")
client = MongoClient(mongo_url)
db = client[db_name]

# Collections
wallets_col = db["wallets"]
miners_col = db["user_miners_simple"]

MINER_TYPES = {
    "free": {"power": 0.5, "reward": 1, "price": 0},
    "starter": {"price": 500, "power": 5, "reward": 10},
    "pro": {"price": 2000, "power": 20, "reward": 50},
    "ultra": {"price": 5000, "power": 50, "reward": 200}
}


def get_or_create_wallet(user_id: str) -> dict:
    """Get or create a wallet for user"""
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        now = datetime.now(timezone.utc)
        wallet = {
            "user_id": user_id,
            "coins": 0,
            "created_at": now.isoformat()
        }
        wallets_col.insert_one(wallet)
    return wallet


# Miner-Typen anzeigen
@router.get("/types")
def get_miner_types():
    return MINER_TYPES


# Miner kaufen
@router.post("/buy")
def buy_miner(user_id: str, miner_type: str):
    miner_config = MINER_TYPES.get(miner_type)
    
    if not miner_config:
        return {"error": "miner not found"}
    
    price = miner_config.get("price", 0)
    wallet = get_or_create_wallet(user_id)
    
    if wallet.get("coins", 0) < price:
        return {"error": "not enough coins", "need": price, "have": wallet.get("coins", 0)}
    
    now = datetime.now(timezone.utc)
    
    # Deduct price
    if price > 0:
        wallets_col.update_one(
            {"user_id": user_id},
            {"$inc": {"coins": -price}}
        )
    
    # Create or update miner
    miner_data = {
        "user_id": user_id,
        "type": miner_type,
        "power": miner_config["power"],
        "reward_per_hour": miner_config["reward"],
        "last_claim": now.isoformat(),
        "purchased_at": now.isoformat()
    }
    
    miners_col.update_one(
        {"user_id": user_id},
        {"$set": miner_data},
        upsert=True
    )
    
    return {"success": True, "miner": miner_data}


# Miner anzeigen
@router.get("/info")
def miner_info(user_id: str):
    miner = miners_col.find_one({"user_id": user_id}, {"_id": 0})
    
    if not miner:
        return {"error": "no miner", "message": "Buy a miner first"}
    
    # Calculate pending reward
    now = datetime.now(timezone.utc)
    try:
        last_claim = datetime.fromisoformat(miner["last_claim"].replace("Z", "+00:00"))
        elapsed_seconds = (now - last_claim).total_seconds()
        hours = elapsed_seconds / 3600
        pending_reward = int(hours * miner.get("reward_per_hour", 0))
    except:
        pending_reward = 0
    
    return {
        "type": miner.get("type"),
        "power": miner.get("power"),
        "reward_per_hour": miner.get("reward_per_hour"),
        "pending_reward": pending_reward,
        "last_claim": miner.get("last_claim")
    }


# Reward holen
@router.get("/claim")
def claim_reward(user_id: str):
    miner = miners_col.find_one({"user_id": user_id})
    
    if not miner:
        return {"error": "no miner"}
    
    now = datetime.now(timezone.utc)
    
    try:
        last_claim = datetime.fromisoformat(miner["last_claim"].replace("Z", "+00:00"))
        elapsed_seconds = (now - last_claim).total_seconds()
        hours = elapsed_seconds / 3600
        reward = int(hours * miner.get("reward_per_hour", 0))
    except:
        return {"error": "calculation failed"}
    
    if reward < 1:
        remaining = (1 / miner.get("reward_per_hour", 1)) * 60 - (hours * 60)
        return {"error": "nothing to claim", "wait_minutes": max(1, int(remaining))}
    
    # Ensure wallet exists
    get_or_create_wallet(user_id)
    
    # Add reward to wallet
    wallets_col.update_one(
        {"user_id": user_id},
        {"$inc": {"coins": reward}}
    )
    
    # Update last claim time
    miners_col.update_one(
        {"user_id": user_id},
        {"$set": {"last_claim": now.isoformat()}}
    )
    
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "reward": reward,
        "wallet": wallet.get("coins", 0)
    }


# Wallet für Miner
@router.get("/wallet")
def miner_wallet(user_id: str):
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    return {"coins": wallet.get("coins", 0) if wallet else 0}


# Coins hinzufügen (für Tests)
@router.post("/wallet/add")
def add_to_wallet(user_id: str, amount: int):
    get_or_create_wallet(user_id)
    wallets_col.update_one(
        {"user_id": user_id},
        {"$inc": {"coins": amount}}
    )
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    return {"coins": wallet.get("coins", 0)}


# Dashboard-Übersicht
@router.get("/dashboard")
def miner_dashboard(user_id: str):
    miner = miners_col.find_one({"user_id": user_id}, {"_id": 0})
    wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    
    if not miner:
        return {
            "has_miner": False,
            "wallet": wallet.get("coins", 0) if wallet else 0,
            "available_miners": MINER_TYPES
        }
    
    now = datetime.now(timezone.utc)
    try:
        last_claim = datetime.fromisoformat(miner["last_claim"].replace("Z", "+00:00"))
        elapsed_seconds = (now - last_claim).total_seconds()
        hours = elapsed_seconds / 3600
        pending = int(hours * miner.get("reward_per_hour", 0))
    except:
        pending = 0
    
    return {
        "has_miner": True,
        "miner": {
            "type": miner.get("type"),
            "power": miner.get("power"),
            "reward_per_hour": miner.get("reward_per_hour")
        },
        "pending_reward": pending,
        "wallet": wallet.get("coins", 0) if wallet else 0
    }
