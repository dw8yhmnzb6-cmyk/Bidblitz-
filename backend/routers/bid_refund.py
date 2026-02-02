"""Bid Refund Router - Partial bid refund for VIP+ members"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/bid-refund", tags=["Bid Refund"])

# ==================== CONFIGURATION ====================

# Refund rates by VIP level
REFUND_RATES = {
    "vip": 0.10,      # 10% refund
    "vip_gold": 0.15, # 15% refund
    "vip_platinum": 0.20,  # 20% refund
    "vip_diamond": 0.25    # 25% refund (special tier)
}

# Minimum bids spent to qualify for refund
MIN_BIDS_FOR_REFUND = 5

# ==================== SCHEMAS ====================

class RefundRequest(BaseModel):
    auction_id: str

# ==================== ENDPOINTS ====================

@router.get("/eligibility/{auction_id}")
async def check_refund_eligibility(auction_id: str, user: dict = Depends(get_current_user)):
    """Check if user is eligible for bid refund on a lost auction"""
    user_id = user["id"]
    
    # Get user data with VIP status
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Check VIP status
    vip_level = user_data.get("vip_level") or user_data.get("vip_tier")
    is_vip = user_data.get("is_vip", False) or user_data.get("vip_active", False)
    
    if not is_vip:
        return {
            "eligible": False,
            "reason": "Bid-Zurück ist nur für VIP-Mitglieder verfügbar",
            "upgrade_hint": "Werde VIP und erhalte bis zu 25% deiner Gebote zurück bei Verlust!"
        }
    
    # Check auction
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    if auction.get("status") != "ended":
        return {
            "eligible": False,
            "reason": "Auktion ist noch nicht beendet"
        }
    
    if auction.get("winner_id") == user_id:
        return {
            "eligible": False,
            "reason": "Du hast diese Auktion gewonnen!"
        }
    
    # Count user's bids in this auction
    user_bids = await db.bids.count_documents({
        "auction_id": auction_id,
        "user_id": user_id
    })
    
    if user_bids < MIN_BIDS_FOR_REFUND:
        return {
            "eligible": False,
            "reason": f"Mindestens {MIN_BIDS_FOR_REFUND} Gebote erforderlich (du hast {user_bids} platziert)"
        }
    
    # Check if already claimed
    existing_refund = await db.bid_refunds.find_one({
        "user_id": user_id,
        "auction_id": auction_id
    })
    
    if existing_refund:
        return {
            "eligible": False,
            "reason": "Rückerstattung bereits beantragt",
            "refund": existing_refund
        }
    
    # Calculate refund
    refund_rate = REFUND_RATES.get(vip_level, REFUND_RATES.get("vip", 0.10))
    refund_bids = int(user_bids * refund_rate)
    
    if refund_bids < 1:
        refund_bids = 1  # Minimum 1 bid refund
    
    return {
        "eligible": True,
        "bids_spent": user_bids,
        "refund_rate": refund_rate,
        "refund_rate_percent": int(refund_rate * 100),
        "refund_bids": refund_bids,
        "vip_level": vip_level,
        "auction_name": auction.get("product_name", "Auktion")
    }

@router.post("/claim")
async def claim_refund(data: RefundRequest, user: dict = Depends(get_current_user)):
    """Claim bid refund for a lost auction"""
    user_id = user["id"]
    
    # Re-check eligibility
    eligibility = await check_refund_eligibility(data.auction_id, user)
    
    if not eligibility.get("eligible"):
        raise HTTPException(status_code=400, detail=eligibility.get("reason", "Nicht berechtigt"))
    
    refund_bids = eligibility["refund_bids"]
    
    # Create refund record
    refund = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "auction_id": data.auction_id,
        "bids_spent": eligibility["bids_spent"],
        "refund_rate": eligibility["refund_rate"],
        "refund_bids": refund_bids,
        "vip_level": eligibility["vip_level"],
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bid_refunds.insert_one(refund)
    
    # Add bids to user
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids": refund_bids}}
    )
    
    logger.info(f"Bid refund claimed: {user_id} got {refund_bids} bids back for auction {data.auction_id}")
    
    return {
        "success": True,
        "message": f"🎉 {refund_bids} Gebote zurückerstattet!",
        "refund_bids": refund_bids,
        "refund_id": refund["id"]
    }

@router.get("/my-refunds")
async def get_my_refunds(user: dict = Depends(get_current_user)):
    """Get user's refund history"""
    refunds = await db.bid_refunds.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    total_refunded = sum(r.get("refund_bids", 0) for r in refunds)
    
    return {
        "refunds": refunds,
        "total_refunds": len(refunds),
        "total_bids_refunded": total_refunded
    }

@router.get("/stats")
async def get_refund_stats(user: dict = Depends(get_current_user)):
    """Get user's refund statistics"""
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    
    vip_level = user_data.get("vip_level") or user_data.get("vip_tier") if user_data else None
    is_vip = user_data.get("is_vip", False) or user_data.get("vip_active", False) if user_data else False
    
    refunds = await db.bid_refunds.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    total_refunded = sum(r.get("refund_bids", 0) for r in refunds)
    total_spent = sum(r.get("bids_spent", 0) for r in refunds)
    
    return {
        "is_vip": is_vip,
        "vip_level": vip_level,
        "current_refund_rate": REFUND_RATES.get(vip_level, 0) if is_vip else 0,
        "total_refunds_claimed": len(refunds),
        "total_bids_refunded": total_refunded,
        "total_bids_spent_in_losses": total_spent,
        "refund_rates": REFUND_RATES,
        "min_bids_required": MIN_BIDS_FOR_REFUND
    }


bid_refund_router = router
