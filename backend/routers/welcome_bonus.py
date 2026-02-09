"""Welcome Bonus Router - New user bonuses and guarantees"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/welcome-bonus", tags=["Welcome Bonus"])

# Configuration
WELCOME_BIDS = 15  # Free bids for new users
FIRST_WIN_GUARANTEE_HOURS = 72  # Time window for first win guarantee
FIRST_WIN_REFUND_PERCENT = 100  # Refund percentage if first auction lost

# ==================== SCHEMAS ====================

class ClaimBonusRequest(BaseModel):
    bonus_type: str  # "welcome_bids", "first_win_refund"

# ==================== ENDPOINTS ====================

@router.get("/status")
async def get_welcome_bonus_status(user: dict = Depends(get_current_user)):
    """Get current user's welcome bonus status"""
    user_id = user["id"]
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Check if welcome bids were claimed
    welcome_claimed = await db.welcome_bonuses.find_one({
        "user_id": user_id,
        "bonus_type": "welcome_bids"
    })
    
    # Check first win guarantee status
    created_at = user_data.get("created_at", datetime.now(timezone.utc).isoformat())
    created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    guarantee_expires = created_date + timedelta(hours=FIRST_WIN_GUARANTEE_HOURS)
    guarantee_active = datetime.now(timezone.utc) < guarantee_expires
    
    # Count user's auction wins
    wins = await db.auctions.count_documents({"winner_id": user_id})
    
    # Check if first win refund was used
    refund_used = await db.welcome_bonuses.find_one({
        "user_id": user_id,
        "bonus_type": "first_win_refund"
    })
    
    # Calculate bids spent in first auction (if any)
    first_auction_bids = 0
    if wins == 0 and guarantee_active:
        # Get user's bid history
        first_bid = await db.bids.find_one(
            {"user_id": user_id, "is_bot": {"$ne": True}},
            sort=[("created_at", 1)]
        )
        if first_bid:
            first_auction_id = first_bid.get("auction_id")
            first_auction_bids = await db.bids.count_documents({
                "user_id": user_id,
                "auction_id": first_auction_id,
                "is_bot": {"$ne": True}
            })
    
    return {
        "welcome_bids": {
            "amount": WELCOME_BIDS,
            "claimed": welcome_claimed is not None,
            "claimed_at": welcome_claimed.get("claimed_at") if welcome_claimed else None
        },
        "first_win_guarantee": {
            "active": guarantee_active and wins == 0 and not refund_used,
            "expires_at": guarantee_expires.isoformat(),
            "hours_remaining": max(0, int((guarantee_expires - datetime.now(timezone.utc)).total_seconds() / 3600)),
            "refund_percent": FIRST_WIN_REFUND_PERCENT,
            "bids_to_refund": first_auction_bids,
            "already_won": wins > 0,
            "refund_used": refund_used is not None
        },
        "is_new_user": (datetime.now(timezone.utc) - created_date).days < 7
    }

@router.post("/claim-welcome-bids")
async def claim_welcome_bids(user: dict = Depends(get_current_user)):
    """Claim free welcome bids for new users"""
    user_id = user["id"]
    
    # Check if already claimed
    existing = await db.welcome_bonuses.find_one({
        "user_id": user_id,
        "bonus_type": "welcome_bids"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Willkommens-Gebote bereits erhalten")
    
    # Award bids
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids_balance": WELCOME_BIDS}}
    )
    
    # Record claim
    await db.welcome_bonuses.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "bonus_type": "welcome_bids",
        "amount": WELCOME_BIDS,
        "claimed_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"Welcome bids claimed: {user_id} received {WELCOME_BIDS} bids")
    
    return {
        "success": True,
        "message": f"🎉 Du hast {WELCOME_BIDS} Gratis-Gebote erhalten!",
        "bids_awarded": WELCOME_BIDS
    }

@router.post("/claim-first-win-refund")
async def claim_first_win_refund(user: dict = Depends(get_current_user)):
    """Claim bid refund if first auction was lost within guarantee period"""
    user_id = user["id"]
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Check if already claimed
    existing = await db.welcome_bonuses.find_one({
        "user_id": user_id,
        "bonus_type": "first_win_refund"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Erstattung bereits erhalten")
    
    # Check if user has won any auctions
    wins = await db.auctions.count_documents({"winner_id": user_id})
    if wins > 0:
        raise HTTPException(status_code=400, detail="Du hast bereits eine Auktion gewonnen!")
    
    # Check guarantee period
    created_at = user_data.get("created_at", datetime.now(timezone.utc).isoformat())
    created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    guarantee_expires = created_date + timedelta(hours=FIRST_WIN_GUARANTEE_HOURS)
    
    if datetime.now(timezone.utc) > guarantee_expires:
        raise HTTPException(status_code=400, detail="Garantie-Zeitraum abgelaufen")
    
    # Find first auction where user participated
    first_bid = await db.bids.find_one(
        {"user_id": user_id, "is_bot": {"$ne": True}},
        sort=[("created_at", 1)]
    )
    
    if not first_bid:
        raise HTTPException(status_code=400, detail="Keine Gebote gefunden")
    
    first_auction_id = first_bid.get("auction_id")
    
    # Check if that auction has ended
    auction = await db.auctions.find_one({"id": first_auction_id}, {"_id": 0})
    if not auction or auction.get("status") != "ended":
        raise HTTPException(status_code=400, detail="Auktion ist noch nicht beendet")
    
    # Count bids in first auction
    bids_spent = await db.bids.count_documents({
        "user_id": user_id,
        "auction_id": first_auction_id,
        "is_bot": {"$ne": True}
    })
    
    refund_amount = int(bids_spent * (FIRST_WIN_REFUND_PERCENT / 100))
    
    if refund_amount == 0:
        raise HTTPException(status_code=400, detail="Keine Gebote zum Erstatten")
    
    # Award refund
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids_balance": refund_amount}}
    )
    
    # Record claim
    await db.welcome_bonuses.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "bonus_type": "first_win_refund",
        "auction_id": first_auction_id,
        "bids_spent": bids_spent,
        "amount": refund_amount,
        "claimed_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"First win refund claimed: {user_id} received {refund_amount} bids")
    
    return {
        "success": True,
        "message": f"💰 {refund_amount} Gebote wurden dir erstattet!",
        "bids_refunded": refund_amount,
        "auction_id": first_auction_id
    }

@router.get("/available-bonuses")
async def get_available_bonuses(user: dict = Depends(get_current_user)):
    """Get list of available bonuses for user"""
    status = await get_welcome_bonus_status(user)
    
    bonuses = []
    
    if not status["welcome_bids"]["claimed"]:
        bonuses.append({
            "type": "welcome_bids",
            "title": "🎁 Willkommens-Geschenk",
            "description": f"{WELCOME_BIDS} Gratis-Gebote für deinen Start!",
            "value": WELCOME_BIDS,
            "action": "claim-welcome-bids"
        })
    
    if status["first_win_guarantee"]["active"]:
        bonuses.append({
            "type": "first_win_refund",
            "title": "🛡️ Erstauktions-Garantie",
            "description": f"Verlierst du deine erste Auktion? Wir erstatten {FIRST_WIN_REFUND_PERCENT}% deiner Gebote!",
            "value": status["first_win_guarantee"]["bids_to_refund"],
            "expires_in_hours": status["first_win_guarantee"]["hours_remaining"],
            "action": "claim-first-win-refund"
        })
    
    return {"bonuses": bonuses, "count": len(bonuses)}


welcome_bonus_router = router
