"""Abandoned Cart System - Remind users about unpurchased bids"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/abandoned-cart", tags=["Abandoned Cart"])

class CartItem(BaseModel):
    product_type: str  # "bid_pack", "vip", "gift_card"
    product_id: str
    quantity: int = 1
    price: float

@router.post("/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    """Add item to cart (for tracking abandonment)"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    cart = await db.shopping_carts.find_one({"user_id": user_id, "status": "active"})
    
    if cart:
        # Add to existing cart
        await db.shopping_carts.update_one(
            {"id": cart["id"]},
            {
                "$push": {"items": item.dict()},
                "$set": {"updated_at": now.isoformat()},
                "$inc": {"total": item.price * item.quantity}
            }
        )
    else:
        # Create new cart
        cart = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "items": [item.dict()],
            "total": item.price * item.quantity,
            "status": "active",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "reminder_sent": False
        }
        await db.shopping_carts.insert_one(cart)
    
    return {"success": True}

@router.get("/my-cart")
async def get_my_cart(user: dict = Depends(get_current_user)):
    """Get user's current cart"""
    cart = await db.shopping_carts.find_one(
        {"user_id": user["id"], "status": "active"},
        {"_id": 0}
    )
    
    return {"cart": cart}

@router.delete("/clear")
async def clear_cart(user: dict = Depends(get_current_user)):
    """Clear user's cart"""
    await db.shopping_carts.update_one(
        {"user_id": user["id"], "status": "active"},
        {"$set": {"status": "cleared", "cleared_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}

@router.post("/checkout-complete")
async def mark_checkout_complete(user: dict = Depends(get_current_user)):
    """Mark cart as purchased"""
    await db.shopping_carts.update_one(
        {"user_id": user["id"], "status": "active"},
        {"$set": {"status": "purchased", "purchased_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}

@router.get("/admin/abandoned")
async def get_abandoned_carts(admin: dict = Depends(get_admin_user)):
    """Get all abandoned carts (Admin only)"""
    # Carts older than 1 hour that haven't been purchased
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    
    carts = await db.shopping_carts.find({
        "status": "active",
        "updated_at": {"$lt": cutoff}
    }, {"_id": 0}).to_list(100)
    
    # Enrich with user info
    for cart in carts:
        user = await db.users.find_one({"id": cart["user_id"]}, {"email": 1, "username": 1})
        cart["user_email"] = user.get("email") if user else "Unknown"
        cart["username"] = user.get("username") if user else "Unknown"
    
    return {"abandoned_carts": carts, "count": len(carts)}

@router.post("/admin/send-reminders")
async def send_cart_reminders(admin: dict = Depends(get_admin_user)):
    """Send reminder emails for abandoned carts (Admin only)"""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    now = datetime.now(timezone.utc)
    
    carts = await db.shopping_carts.find({
        "status": "active",
        "updated_at": {"$lt": cutoff},
        "reminder_sent": False
    }).to_list(100)
    
    sent_count = 0
    for cart in carts:
        # In production, send actual email here
        # For now, just mark as sent
        await db.shopping_carts.update_one(
            {"id": cart["id"]},
            {"$set": {"reminder_sent": True, "reminder_sent_at": now.isoformat()}}
        )
        sent_count += 1
        logger.info(f"Abandoned cart reminder sent for cart {cart['id']}")
    
    return {"success": True, "reminders_sent": sent_count}

abandoned_cart_router = router
