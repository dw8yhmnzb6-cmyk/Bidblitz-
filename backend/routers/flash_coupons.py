"""Flash Coupons Router - Time-limited coupons during auctions"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid
import random

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/flash-coupons", tags=["Flash Coupons"])

# ==================== CONFIGURATION ====================

COUPON_TYPES = [
    {"type": "percent", "value": 10, "label": "10% Rabatt auf Gebote", "weight": 40},
    {"type": "percent", "value": 15, "label": "15% Rabatt auf Gebote", "weight": 25},
    {"type": "percent", "value": 20, "label": "20% Rabatt auf Gebote", "weight": 15},
    {"type": "percent", "value": 25, "label": "25% Rabatt auf Gebote", "weight": 10},
    {"type": "fixed", "value": 5, "label": "€5 Rabatt", "weight": 5},
    {"type": "bids", "value": 5, "label": "5 Gratis-Gebote", "weight": 5},
]

# ==================== SCHEMAS ====================

class CouponCreate(BaseModel):
    type: str = "percent"  # percent, fixed, bids
    value: int
    duration_seconds: int = 60
    min_purchase: Optional[float] = None
    max_uses: int = 100
    auction_id: Optional[str] = None  # If tied to specific auction

class CouponRedeem(BaseModel):
    code: str

# ==================== HELPERS ====================

def generate_coupon_code():
    """Generate a memorable coupon code"""
    prefixes = ["FLASH", "BLITZ", "QUICK", "SPEED", "NOW"]
    return f"{random.choice(prefixes)}{random.randint(100, 999)}"

def select_random_coupon():
    """Select a random coupon type based on weights"""
    total_weight = sum(c["weight"] for c in COUPON_TYPES)
    r = random.randint(1, total_weight)
    
    current = 0
    for coupon in COUPON_TYPES:
        current += coupon["weight"]
        if r <= current:
            return coupon
    return COUPON_TYPES[0]

# ==================== ENDPOINTS ====================

@router.get("/active")
async def get_active_coupons(user: dict = Depends(get_current_user)):
    """Get currently active flash coupons"""
    now = datetime.now(timezone.utc).isoformat()
    
    coupons = await db.flash_coupons.find({
        "status": "active",
        "expires_at": {"$gt": now},
        "uses_remaining": {"$gt": 0}
    }, {"_id": 0}).to_list(10)
    
    # Check if user already redeemed
    for coupon in coupons:
        user_redeemed = await db.coupon_redemptions.find_one({
            "user_id": user["id"],
            "coupon_id": coupon["id"]
        })
        coupon["already_redeemed"] = user_redeemed is not None
        
        # Calculate time remaining
        expires = datetime.fromisoformat(coupon["expires_at"].replace("Z", "+00:00"))
        coupon["seconds_remaining"] = max(0, int((expires - datetime.now(timezone.utc)).total_seconds()))
    
    return {"coupons": coupons}

@router.post("/redeem")
async def redeem_coupon(data: CouponRedeem, user: dict = Depends(get_current_user)):
    """Redeem a flash coupon"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    coupon = await db.flash_coupons.find_one({
        "code": data.code.upper(),
        "status": "active",
        "expires_at": {"$gt": now.isoformat()},
        "uses_remaining": {"$gt": 0}
    }, {"_id": 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Gutschein nicht gefunden oder abgelaufen")
    
    # Check if already redeemed
    existing = await db.coupon_redemptions.find_one({
        "user_id": user_id,
        "coupon_id": coupon["id"]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du hast diesen Gutschein bereits eingelöst")
    
    # Record redemption
    redemption = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "coupon_id": coupon["id"],
        "coupon_code": coupon["code"],
        "coupon_type": coupon["type"],
        "coupon_value": coupon["value"],
        "created_at": now.isoformat()
    }
    
    await db.coupon_redemptions.insert_one(redemption)
    
    # Decrease uses remaining
    await db.flash_coupons.update_one(
        {"id": coupon["id"]},
        {"$inc": {"uses_remaining": -1, "times_used": 1}}
    )
    
    # Apply coupon benefit
    if coupon["type"] == "bids":
        # Add free bids
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"bids": coupon["value"]}}
        )
        message = f"🎉 {coupon['value']} Gratis-Gebote gutgeschrieben!"
    elif coupon["type"] == "percent":
        # Store discount for next purchase
        await db.user_discounts.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "percent",
            "value": coupon["value"],
            "coupon_id": coupon["id"],
            "used": False,
            "expires_at": (now + timedelta(hours=24)).isoformat(),
            "created_at": now.isoformat()
        })
        message = f"🎉 {coupon['value']}% Rabatt für deinen nächsten Kauf aktiviert!"
    else:  # fixed
        await db.user_discounts.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "fixed",
            "value": coupon["value"],
            "coupon_id": coupon["id"],
            "used": False,
            "expires_at": (now + timedelta(hours=24)).isoformat(),
            "created_at": now.isoformat()
        })
        message = f"🎉 €{coupon['value']} Rabatt für deinen nächsten Kauf aktiviert!"
    
    logger.info(f"Flash coupon redeemed: {user_id} - {coupon['code']}")
    
    return {
        "success": True,
        "message": message,
        "coupon_type": coupon["type"],
        "coupon_value": coupon["value"]
    }

@router.get("/my-discounts")
async def get_my_discounts(user: dict = Depends(get_current_user)):
    """Get user's available discounts from redeemed coupons"""
    now = datetime.now(timezone.utc).isoformat()
    
    discounts = await db.user_discounts.find({
        "user_id": user["id"],
        "used": False,
        "expires_at": {"$gt": now}
    }, {"_id": 0}).to_list(10)
    
    return {"discounts": discounts}

# ==================== ADMIN ENDPOINTS ====================

@router.post("/admin/create")
async def create_flash_coupon(data: CouponCreate, admin: dict = Depends(get_admin_user)):
    """Create a new flash coupon (admin only)"""
    now = datetime.now(timezone.utc)
    
    coupon = {
        "id": str(uuid.uuid4()),
        "code": generate_coupon_code(),
        "type": data.type,
        "value": data.value,
        "label": f"{data.value}{'%' if data.type == 'percent' else ' Gebote' if data.type == 'bids' else '€'} Rabatt",
        "duration_seconds": data.duration_seconds,
        "min_purchase": data.min_purchase,
        "max_uses": data.max_uses,
        "uses_remaining": data.max_uses,
        "times_used": 0,
        "auction_id": data.auction_id,
        "status": "active",
        "created_by": admin["id"],
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(seconds=data.duration_seconds)).isoformat()
    }
    
    await db.flash_coupons.insert_one(coupon)
    
    logger.info(f"Flash coupon created: {coupon['code']} by admin {admin['id']}")
    
    return {
        "success": True,
        "coupon": {
            "id": coupon["id"],
            "code": coupon["code"],
            "expires_at": coupon["expires_at"]
        }
    }

@router.post("/admin/trigger-random")
async def trigger_random_coupon(
    duration_seconds: int = 60,
    max_uses: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Trigger a random flash coupon (admin only)"""
    selected = select_random_coupon()
    now = datetime.now(timezone.utc)
    
    coupon = {
        "id": str(uuid.uuid4()),
        "code": generate_coupon_code(),
        "type": selected["type"],
        "value": selected["value"],
        "label": selected["label"],
        "duration_seconds": duration_seconds,
        "max_uses": max_uses,
        "uses_remaining": max_uses,
        "times_used": 0,
        "status": "active",
        "created_by": admin["id"],
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(seconds=duration_seconds)).isoformat()
    }
    
    await db.flash_coupons.insert_one(coupon)
    
    # TODO: Broadcast to all active users via WebSocket
    
    logger.info(f"Random flash coupon triggered: {coupon['code']}")
    
    return {
        "success": True,
        "message": f"Flash-Gutschein '{coupon['code']}' aktiviert!",
        "coupon": coupon
    }

@router.get("/admin/history")
async def get_coupon_history(limit: int = 50, admin: dict = Depends(get_admin_user)):
    """Get flash coupon history (admin only)"""
    coupons = await db.flash_coupons.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return {"coupons": coupons}


flash_coupons_router = router
