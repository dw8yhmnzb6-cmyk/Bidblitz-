"""Friends Duel System - 1v1 Bidding Battles"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid
import random

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/duels", tags=["Friends Duel"])

class DuelCreate(BaseModel):
    opponent_id: Optional[str] = None  # None = random matchmaking
    bet_bids: int = 10  # Bids wagered
    auction_category: Optional[str] = None

class DuelAction(BaseModel):
    action: str  # "accept", "decline", "bid"

@router.post("/create")
async def create_duel(duel: DuelCreate, user: dict = Depends(get_current_user)):
    """Create a new duel challenge"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    # Check if user has enough bids (support both 'bids' and 'bids_balance' fields)
    user_data = await db.users.find_one({"id": user_id}, {"bids": 1, "bids_balance": 1})
    user_bids = user_data.get("bids", 0) or user_data.get("bids_balance", 0) if user_data else 0
    if user_bids < duel.bet_bids:
        raise HTTPException(status_code=400, detail="Nicht genug Gebote")
    
    # Reserve bids (update both fields for consistency)
    await db.users.update_one(
        {"id": user_id}, 
        {"$inc": {"bids": -duel.bet_bids, "bids_balance": -duel.bet_bids}}
    )
    
    duel_doc = {
        "id": str(uuid.uuid4()),
        "challenger_id": user_id,
        "opponent_id": duel.opponent_id,
        "bet_bids": duel.bet_bids,
        "total_pot": duel.bet_bids * 2,
        "category": duel.auction_category,
        "challenger_score": 0,
        "opponent_score": 0,
        "status": "pending" if duel.opponent_id else "matchmaking",
        "winner_id": None,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=10)).isoformat()
    }
    
    await db.duels.insert_one(duel_doc)
    del duel_doc["_id"]
    
    return {"success": True, "duel": duel_doc}

@router.post("/{duel_id}/respond")
async def respond_to_duel(duel_id: str, action: DuelAction, user: dict = Depends(get_current_user)):
    """Accept or decline a duel"""
    user_id = user["id"]
    
    duel = await db.duels.find_one({"id": duel_id})
    if not duel:
        raise HTTPException(status_code=404, detail="Duell nicht gefunden")
    
    if duel["opponent_id"] != user_id:
        raise HTTPException(status_code=403, detail="Du bist nicht der Herausgeforderte")
    
    if duel["status"] != "pending":
        raise HTTPException(status_code=400, detail="Duell kann nicht mehr angenommen werden")
    
    now = datetime.now(timezone.utc)
    
    if action.action == "accept":
        # Check bids
        user_data = await db.users.find_one({"id": user_id}, {"bids": 1})
        if not user_data or user_data.get("bids", 0) < duel["bet_bids"]:
            raise HTTPException(status_code=400, detail="Nicht genug Gebote")
        
        # Reserve bids
        await db.users.update_one({"id": user_id}, {"$inc": {"bids": -duel["bet_bids"]}})
        
        # Start duel
        await db.duels.update_one(
            {"id": duel_id},
            {"$set": {
                "status": "active",
                "started_at": now.isoformat(),
                "ends_at": (now + timedelta(minutes=5)).isoformat()
            }}
        )
        
        return {"success": True, "message": "Duell gestartet!", "status": "active"}
    
    elif action.action == "decline":
        # Refund challenger
        await db.users.update_one(
            {"id": duel["challenger_id"]},
            {"$inc": {"bids": duel["bet_bids"]}}
        )
        
        await db.duels.update_one(
            {"id": duel_id},
            {"$set": {"status": "declined"}}
        )
        
        return {"success": True, "message": "Duell abgelehnt"}
    
    raise HTTPException(status_code=400, detail="Ungültige Aktion")

@router.get("/my-duels")
async def get_my_duels(user: dict = Depends(get_current_user)):
    """Get user's active and past duels"""
    user_id = user["id"]
    
    duels = await db.duels.find({
        "$or": [
            {"challenger_id": user_id},
            {"opponent_id": user_id}
        ]
    }, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    
    # Enrich with usernames
    for duel in duels:
        challenger = await db.users.find_one({"id": duel["challenger_id"]}, {"username": 1})
        duel["challenger_name"] = challenger.get("username", "User") if challenger else "User"
        
        if duel.get("opponent_id"):
            opponent = await db.users.find_one({"id": duel["opponent_id"]}, {"username": 1})
            duel["opponent_name"] = opponent.get("username", "User") if opponent else "User"
    
    return {"duels": duels}

@router.get("/challenges")
async def get_challenges(user: dict = Depends(get_current_user)):
    """Get pending duel challenges for the user"""
    user_id = user["id"]
    
    # Find duels where user is the opponent and status is pending
    challenges = await db.duels.find({
        "opponent_id": user_id,
        "status": "pending"
    }, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Enrich with challenger usernames
    for challenge in challenges:
        challenger = await db.users.find_one({"id": challenge["challenger_id"]}, {"username": 1})
        challenge["challenger_name"] = challenger.get("username", "Spieler") if challenger else "Spieler"
    
    return {"challenges": challenges}

@router.get("/matchmaking")
async def find_match(user: dict = Depends(get_current_user)):
    """Find an available duel to join"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    # Find open duels
    available = await db.duels.find_one({
        "status": "matchmaking",
        "challenger_id": {"$ne": user_id},
        "expires_at": {"$gt": now.isoformat()}
    }, {"_id": 0})
    
    if available:
        # Join the duel
        await db.duels.update_one(
            {"id": available["id"]},
            {"$set": {"opponent_id": user_id, "status": "pending"}}
        )
        available["opponent_id"] = user_id
        available["status"] = "pending"
        return {"found": True, "duel": available}
    
    return {"found": False, "message": "Keine Duelle verfügbar. Erstelle ein eigenes!"}

duels_router = router
