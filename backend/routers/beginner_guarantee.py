"""Beginner Win Guarantee System
Ensures new users win their first auction to improve conversion
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/beginner-guarantee", tags=["Beginner Guarantee"])

# Configuration
MAX_RETAIL_PRICE_FOR_GUARANTEE = 50.0  # Only for products under €50
MAX_AUCTIONS_FOR_GUARANTEE = 3  # Max 3 guaranteed wins per user
GUARANTEE_EXPIRY_DAYS = 7  # Guarantee expires 7 days after registration

async def is_user_eligible_for_guarantee(user_id: str) -> dict:
    """Check if user is eligible for beginner win guarantee"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return {"eligible": False, "reason": "User not found"}
    
    # Check if user has won any auction yet
    wins = await db.auction_history.count_documents({"winner_id": user_id})
    if wins >= MAX_AUCTIONS_FOR_GUARANTEE:
        return {"eligible": False, "reason": "Already won enough auctions", "wins": wins}
    
    # Check registration date (only within first 7 days)
    created_at = user.get("created_at")
    if created_at:
        try:
            if isinstance(created_at, str):
                reg_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            else:
                reg_date = created_at
            
            days_since_reg = (datetime.now(timezone.utc) - reg_date).days
            if days_since_reg > GUARANTEE_EXPIRY_DAYS:
                return {"eligible": False, "reason": "Registration too old", "days": days_since_reg}
        except:
            pass
    
    # Check if guarantee was already used
    guarantee_record = await db.beginner_guarantees.find_one({"user_id": user_id}, {"_id": 0})
    if guarantee_record:
        used = guarantee_record.get("guarantees_used", 0)
        if used >= MAX_AUCTIONS_FOR_GUARANTEE:
            return {"eligible": False, "reason": "All guarantees used", "used": used}
    
    return {
        "eligible": True,
        "wins": wins,
        "guarantees_remaining": MAX_AUCTIONS_FOR_GUARANTEE - wins,
        "max_price": MAX_RETAIL_PRICE_FOR_GUARANTEE
    }

async def mark_auction_as_guaranteed(auction_id: str, user_id: str):
    """Mark an auction for guaranteed win by beginner"""
    await db.auctions.update_one(
        {"id": auction_id},
        {"$set": {
            "guaranteed_winner_id": user_id,
            "guaranteed_winner_bidding": user_id,  # Bots will let this user win
            "is_guaranteed_auction": True
        }}
    )
    
    # Update user's guarantee record
    await db.beginner_guarantees.update_one(
        {"user_id": user_id},
        {
            "$inc": {"guarantees_used": 1},
            "$push": {"guaranteed_auctions": auction_id},
            "$set": {"last_used": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    logger.info(f"🎓 Marked auction {auction_id} for guaranteed win by user {user_id}")

@router.get("/eligibility")
async def check_eligibility(user: dict = Depends(get_current_user)):
    """Check if current user is eligible for beginner guarantee"""
    return await is_user_eligible_for_guarantee(user["id"])

@router.get("/eligible-auctions")
async def get_eligible_auctions(user: dict = Depends(get_current_user)):
    """Get auctions eligible for beginner guarantee (under €50 retail)"""
    eligibility = await is_user_eligible_for_guarantee(user["id"])
    
    if not eligibility["eligible"]:
        return {"eligible": False, "auctions": [], "reason": eligibility.get("reason")}
    
    # Find auctions with retail price under threshold
    auctions = await db.auctions.find({
        "status": "active",
        "retail_price": {"$lte": MAX_RETAIL_PRICE_FOR_GUARANTEE},
        "guaranteed_winner_id": {"$exists": False}  # Not already guaranteed
    }, {"_id": 0, "id": 1, "product_id": 1, "current_price": 1, "retail_price": 1, "end_time": 1}).limit(10).to_list(10)
    
    # Enrich with product info
    result = []
    for auction in auctions:
        product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0, "name": 1, "image_url": 1})
        result.append({
            **auction,
            "product_name": product.get("name") if product else "Produkt",
            "product_image": product.get("image_url") if product else None
        })
    
    return {
        "eligible": True,
        "guarantees_remaining": eligibility["guarantees_remaining"],
        "auctions": result
    }

@router.post("/activate/{auction_id}")
async def activate_guarantee(auction_id: str, user: dict = Depends(get_current_user)):
    """Activate beginner guarantee for an auction"""
    eligibility = await is_user_eligible_for_guarantee(user["id"])
    
    if not eligibility["eligible"]:
        raise HTTPException(status_code=400, detail=eligibility.get("reason", "Not eligible"))
    
    # Check auction exists and is valid
    auction = await db.auctions.find_one({"id": auction_id, "status": "active"}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    retail_price = auction.get("retail_price", 100)
    if retail_price > MAX_RETAIL_PRICE_FOR_GUARANTEE:
        raise HTTPException(status_code=400, detail=f"Product too expensive. Max: €{MAX_RETAIL_PRICE_FOR_GUARANTEE}")
    
    if auction.get("guaranteed_winner_id"):
        raise HTTPException(status_code=400, detail="Auction already has a guaranteed winner")
    
    # Activate guarantee
    await mark_auction_as_guaranteed(auction_id, user["id"])
    
    return {
        "success": True,
        "message": "Anfänger-Garantie aktiviert! Biete jetzt auf diese Auktion.",
        "auction_id": auction_id,
        "guarantees_remaining": eligibility["guarantees_remaining"] - 1
    }

@router.get("/my-guarantees")
async def get_my_guarantees(user: dict = Depends(get_current_user)):
    """Get user's guarantee history"""
    record = await db.beginner_guarantees.find_one({"user_id": user["id"]}, {"_id": 0})
    
    if not record:
        eligibility = await is_user_eligible_for_guarantee(user["id"])
        return {
            "guarantees_used": 0,
            "guarantees_remaining": MAX_AUCTIONS_FOR_GUARANTEE if eligibility["eligible"] else 0,
            "guaranteed_auctions": [],
            "eligible": eligibility["eligible"]
        }
    
    return {
        "guarantees_used": record.get("guarantees_used", 0),
        "guarantees_remaining": max(0, MAX_AUCTIONS_FOR_GUARANTEE - record.get("guarantees_used", 0)),
        "guaranteed_auctions": record.get("guaranteed_auctions", []),
        "eligible": record.get("guarantees_used", 0) < MAX_AUCTIONS_FOR_GUARANTEE
    }

# Admin endpoints
@router.get("/admin/stats")
async def get_guarantee_stats(admin: dict = Depends(get_admin_user)):
    """Get beginner guarantee usage statistics"""
    total_guarantees = await db.beginner_guarantees.count_documents({})
    total_used = await db.beginner_guarantees.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$guarantees_used"}}}
    ]).to_list(1)
    
    # Recent guaranteed auctions
    recent = await db.auctions.find(
        {"is_guaranteed_auction": True},
        {"_id": 0, "id": 1, "guaranteed_winner_id": 1, "status": 1, "current_price": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "total_users_with_guarantees": total_guarantees,
        "total_guarantees_used": total_used[0]["total"] if total_used else 0,
        "max_per_user": MAX_AUCTIONS_FOR_GUARANTEE,
        "max_retail_price": MAX_RETAIL_PRICE_FOR_GUARANTEE,
        "recent_guaranteed_auctions": recent
    }

@router.put("/admin/config")
async def update_config(
    max_price: float = None,
    max_guarantees: int = None,
    expiry_days: int = None,
    admin: dict = Depends(get_admin_user)
):
    """Update beginner guarantee configuration"""
    global MAX_RETAIL_PRICE_FOR_GUARANTEE, MAX_AUCTIONS_FOR_GUARANTEE, GUARANTEE_EXPIRY_DAYS
    
    if max_price is not None:
        MAX_RETAIL_PRICE_FOR_GUARANTEE = max_price
    if max_guarantees is not None:
        MAX_AUCTIONS_FOR_GUARANTEE = max_guarantees
    if expiry_days is not None:
        GUARANTEE_EXPIRY_DAYS = expiry_days
    
    return {
        "max_retail_price": MAX_RETAIL_PRICE_FOR_GUARANTEE,
        "max_guarantees_per_user": MAX_AUCTIONS_FOR_GUARANTEE,
        "expiry_days": GUARANTEE_EXPIRY_DAYS
    }
