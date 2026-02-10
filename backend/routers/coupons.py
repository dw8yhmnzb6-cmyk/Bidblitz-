"""Coupon Codes Router - Discount codes with expiry"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/coupons", tags=["Coupons"])

class CouponCreate(BaseModel):
    code: str
    discount_type: str  # "percent" or "fixed"
    discount_value: float  # 10 = 10% or 10€
    min_purchase: Optional[float] = 0
    max_uses: Optional[int] = None
    expires_in_days: Optional[int] = 30
    description: Optional[str] = ""

class CouponRedeem(BaseModel):
    code: str

@router.post("/create")
async def create_coupon(coupon: CouponCreate, admin: dict = Depends(get_admin_user)):
    """Create a new coupon code (Admin only)"""
    now = datetime.now(timezone.utc)
    
    # Check if code exists
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Code existiert bereits")
    
    coupon_doc = {
        "id": str(uuid.uuid4()),
        "code": coupon.code.upper(),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_purchase": coupon.min_purchase,
        "max_uses": coupon.max_uses,
        "current_uses": 0,
        "expires_at": (now + timedelta(days=coupon.expires_in_days)).isoformat() if coupon.expires_in_days else None,
        "description": coupon.description,
        "status": "active",
        "created_by": admin.get("id"),
        "created_at": now.isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    del coupon_doc["_id"]
    
    logger.info(f"Coupon created: {coupon.code.upper()}")
    
    return {"success": True, "coupon": coupon_doc}

@router.post("/validate")
async def validate_coupon(data: CouponRedeem, user: dict = Depends(get_current_user)):
    """Validate a coupon code"""
    code = data.code.upper()
    
    coupon = await db.coupons.find_one({"code": code, "status": "active"}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Ungültiger Gutscheincode")
    
    now = datetime.now(timezone.utc)
    
    # Check expiry
    if coupon.get("expires_at"):
        expires = datetime.fromisoformat(coupon["expires_at"].replace('Z', '+00:00'))
        if now > expires:
            raise HTTPException(status_code=400, detail="Gutschein ist abgelaufen")
    
    # Check max uses
    if coupon.get("max_uses") and coupon.get("current_uses", 0) >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="Gutschein wurde bereits zu oft verwendet")
    
    # Check if user already used
    used = await db.coupon_uses.find_one({"coupon_id": coupon["id"], "user_id": user["id"]})
    if used:
        raise HTTPException(status_code=400, detail="Du hast diesen Gutschein bereits verwendet")
    
    return {
        "valid": True,
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "min_purchase": coupon.get("min_purchase", 0),
        "description": coupon.get("description", "")
    }

@router.post("/redeem")
async def redeem_coupon(data: CouponRedeem, user: dict = Depends(get_current_user)):
    """Redeem a coupon code"""
    code = data.code.upper()
    
    # Validate first
    coupon = await db.coupons.find_one({"code": code, "status": "active"}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Ungültiger Gutscheincode")
    
    now = datetime.now(timezone.utc)
    
    # Record usage
    await db.coupon_uses.insert_one({
        "id": str(uuid.uuid4()),
        "coupon_id": coupon["id"],
        "user_id": user["id"],
        "used_at": now.isoformat()
    })
    
    # Increment usage count
    await db.coupons.update_one(
        {"id": coupon["id"]},
        {"$inc": {"current_uses": 1}}
    )
    
    # Apply discount - add bids if it's a bid coupon
    if coupon["discount_type"] == "bids":
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"bids": int(coupon["discount_value"])}}
        )
        return {"success": True, "message": f"+{int(coupon['discount_value'])} Gebote gutgeschrieben!"}
    
    return {
        "success": True,
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "message": f"Gutschein eingelöst: {coupon['discount_value']}{'%' if coupon['discount_type'] == 'percent' else '€'} Rabatt"
    }

@router.get("/my-coupons")
async def get_my_coupons(user: dict = Depends(get_current_user)):
    """Get user's available and used coupons"""
    used_ids = await db.coupon_uses.find({"user_id": user["id"]}, {"coupon_id": 1}).to_list(100)
    used_coupon_ids = [u["coupon_id"] for u in used_ids]
    
    now = datetime.now(timezone.utc)
    
    # Get available coupons (public ones user hasn't used)
    available = await db.coupons.find({
        "status": "active",
        "id": {"$nin": used_coupon_ids},
        "$or": [
            {"expires_at": {"$gt": now.isoformat()}},
            {"expires_at": None}
        ]
    }, {"_id": 0}).to_list(20)
    
    return {"available_coupons": available}

@router.get("/admin/all")
async def get_all_coupons(admin: dict = Depends(get_admin_user)):
    """Get all coupons (Admin only)"""
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"coupons": coupons}

coupons_router = router
