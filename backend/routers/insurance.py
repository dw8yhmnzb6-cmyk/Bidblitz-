"""Auction Insurance Router - Bid insurance for auction losses"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/insurance", tags=["Auction Insurance"])

# ==================== CONFIGURATION ====================

# Insurance pricing
INSURANCE_PRICE = 0.50  # €0.50 per auction
REFUND_RATE = 0.50  # 50% of bids back on loss

# ==================== SCHEMAS ====================

class InsurancePurchase(BaseModel):
    auction_id: str

class InsuranceClaim(BaseModel):
    auction_id: str

# ==================== ENDPOINTS ====================

@router.get("/status/{auction_id}")
async def get_insurance_status(auction_id: str, user: dict = Depends(get_current_user)):
    """Check if user has insurance for an auction"""
    insurance = await db.auction_insurance.find_one({
        "user_id": user["id"],
        "auction_id": auction_id
    }, {"_id": 0})
    
    if not insurance:
        return {
            "has_insurance": False,
            "price": INSURANCE_PRICE,
            "refund_rate": int(REFUND_RATE * 100),
            "message": f"Sichere deine Gebote ab! Bei Verlust erhältst du {int(REFUND_RATE * 100)}% zurück."
        }
    
    return {
        "has_insurance": True,
        "insurance": insurance,
        "claimed": insurance.get("claimed", False)
    }

@router.post("/purchase")
async def purchase_insurance(data: InsurancePurchase, user: dict = Depends(get_current_user)):
    """Purchase insurance for an auction"""
    user_id = user["id"]
    
    # Check if auction exists and is active
    auction = await db.auctions.find_one({
        "id": data.auction_id,
        "status": "active"
    }, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden oder nicht aktiv")
    
    # Check if already has insurance
    existing = await db.auction_insurance.find_one({
        "user_id": user_id,
        "auction_id": data.auction_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du hast bereits eine Versicherung für diese Auktion")
    
    # Check user balance (simplified - in production would use Stripe)
    # For now, we'll just record the insurance
    
    insurance = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "auction_id": data.auction_id,
        "product_name": auction.get("product_name"),
        "price_paid": INSURANCE_PRICE,
        "refund_rate": REFUND_RATE,
        "claimed": False,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.auction_insurance.insert_one(insurance)
    
    logger.info(f"Insurance purchased: {user_id} for auction {data.auction_id}")
    
    return {
        "success": True,
        "message": f"Versicherung abgeschlossen! Bei Verlust erhältst du {int(REFUND_RATE * 100)}% deiner Gebote zurück.",
        "insurance_id": insurance["id"]
    }

@router.post("/claim")
async def claim_insurance(data: InsuranceClaim, user: dict = Depends(get_current_user)):
    """Claim insurance refund for a lost auction"""
    user_id = user["id"]
    
    # Check insurance exists
    insurance = await db.auction_insurance.find_one({
        "user_id": user_id,
        "auction_id": data.auction_id
    }, {"_id": 0})
    
    if not insurance:
        raise HTTPException(status_code=404, detail="Keine Versicherung für diese Auktion gefunden")
    
    if insurance.get("claimed"):
        raise HTTPException(status_code=400, detail="Versicherung bereits beansprucht")
    
    # Check auction is ended and user lost
    auction = await db.auctions.find_one({"id": data.auction_id}, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    if auction.get("status") != "ended":
        raise HTTPException(status_code=400, detail="Auktion ist noch nicht beendet")
    
    if auction.get("winner_id") == user_id:
        raise HTTPException(status_code=400, detail="Du hast gewonnen! Keine Versicherung nötig.")
    
    # Calculate refund
    user_bids = await db.bids.count_documents({
        "auction_id": data.auction_id,
        "user_id": user_id
    })
    
    if user_bids == 0:
        raise HTTPException(status_code=400, detail="Du hast keine Gebote in dieser Auktion platziert")
    
    refund_bids = int(user_bids * REFUND_RATE)
    if refund_bids < 1:
        refund_bids = 1  # Minimum 1 bid
    
    # Process refund
    await db.auction_insurance.update_one(
        {"id": insurance["id"]},
        {"$set": {
            "claimed": True,
            "claimed_at": datetime.now(timezone.utc).isoformat(),
            "bids_spent": user_bids,
            "bids_refunded": refund_bids
        }}
    )
    
    # Add bids to user
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids": refund_bids}}
    )
    
    logger.info(f"Insurance claimed: {user_id} got {refund_bids} bids back for auction {data.auction_id}")
    
    return {
        "success": True,
        "message": f"🛡️ Versicherung eingelöst! {refund_bids} Gebote zurückerstattet.",
        "bids_spent": user_bids,
        "bids_refunded": refund_bids
    }

@router.get("/my-insurance")
async def get_my_insurance(user: dict = Depends(get_current_user)):
    """Get all user's insurance policies"""
    policies = await db.auction_insurance.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Enrich with auction status
    for policy in policies:
        auction = await db.auctions.find_one(
            {"id": policy["auction_id"]},
            {"_id": 0, "status": 1, "winner_id": 1}
        )
        if auction:
            policy["auction_status"] = auction.get("status")
            policy["user_won"] = auction.get("winner_id") == user["id"]
            policy["can_claim"] = (
                auction.get("status") == "ended" and 
                auction.get("winner_id") != user["id"] and 
                not policy.get("claimed")
            )
    
    total_spent = sum(p.get("price_paid", 0) for p in policies)
    total_refunded = sum(p.get("bids_refunded", 0) for p in policies if p.get("claimed"))
    
    return {
        "policies": policies,
        "total_policies": len(policies),
        "total_spent": total_spent,
        "total_bids_refunded": total_refunded
    }

@router.get("/stats")
async def get_insurance_stats(user: dict = Depends(get_current_user)):
    """Get insurance statistics"""
    policies = await db.auction_insurance.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    claimed = [p for p in policies if p.get("claimed")]
    
    return {
        "total_policies": len(policies),
        "claims_made": len(claimed),
        "total_bids_recovered": sum(p.get("bids_refunded", 0) for p in claimed),
        "total_spent_on_insurance": sum(p.get("price_paid", 0) for p in policies),
        "insurance_price": INSURANCE_PRICE,
        "refund_rate": int(REFUND_RATE * 100)
    }


insurance_router = router
