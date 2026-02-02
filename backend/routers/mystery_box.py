"""Mystery Box Auctions - Hidden product auctions for excitement"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import random

from config import db, logger
from dependencies import get_current_user, get_admin_user as get_current_admin

router = APIRouter(prefix="/mystery-box", tags=["Mystery Box"])

# Mystery box tiers
MYSTERY_TIERS = {
    "bronze": {
        "name": "Bronze Mystery Box",
        "min_value": 50,
        "max_value": 150,
        "icon": "🥉",
        "color": "#CD7F32"
    },
    "silver": {
        "name": "Silber Mystery Box",
        "min_value": 150,
        "max_value": 400,
        "icon": "🥈",
        "color": "#C0C0C0"
    },
    "gold": {
        "name": "Gold Mystery Box",
        "min_value": 400,
        "max_value": 1000,
        "icon": "🥇",
        "color": "#FFD700"
    },
    "diamond": {
        "name": "Diamant Mystery Box",
        "min_value": 1000,
        "max_value": 5000,
        "icon": "💎",
        "color": "#B9F2FF"
    }
}

# ==================== PUBLIC ENDPOINTS ====================

@router.get("/active")
async def get_active_mystery_auctions():
    """Get active mystery box auctions"""
    now = datetime.now(timezone.utc).isoformat()
    
    auctions = await db.auctions.find({
        "is_mystery": True,
        "status": "active",
        "end_time": {"$gt": now}
    }, {"_id": 0}).to_list(50)
    
    # Hide actual product, show only tier info
    sanitized = []
    for auction in auctions:
        tier = MYSTERY_TIERS.get(auction.get("mystery_tier", "bronze"))
        sanitized.append({
            "id": auction["id"],
            "tier": auction.get("mystery_tier", "bronze"),
            "tier_info": tier,
            "hint": auction.get("mystery_hint", "Ein spannendes Produkt erwartet dich!"),
            "value_range": f"€{tier['min_value']} - €{tier['max_value']}",
            "current_price": auction.get("current_price", 0),
            "end_time": auction.get("end_time"),
            "bid_count": auction.get("bid_count", 0),
            "highest_bidder_name": auction.get("highest_bidder_name")
        })
    
    return {"auctions": sanitized, "tiers": MYSTERY_TIERS}

@router.get("/{auction_id}")
async def get_mystery_auction_detail(auction_id: str, user: dict = Depends(get_current_user)):
    """Get mystery auction details (product hidden until won)"""
    auction = await db.auctions.find_one({"id": auction_id, "is_mystery": True}, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=404, detail="Mystery Auktion nicht gefunden")
    
    tier = MYSTERY_TIERS.get(auction.get("mystery_tier", "bronze"))
    
    # Check if user won this auction
    is_winner = auction.get("winner_id") == user["id"] and auction.get("status") == "ended"
    
    response = {
        "id": auction["id"],
        "tier": auction.get("mystery_tier"),
        "tier_info": tier,
        "hint": auction.get("mystery_hint"),
        "hints": auction.get("mystery_hints", []),  # Additional hints released over time
        "current_price": auction.get("current_price", 0),
        "end_time": auction.get("end_time"),
        "status": auction.get("status"),
        "bid_count": auction.get("bid_count", 0),
        "is_winner": is_winner
    }
    
    # Only reveal product if user won or auction ended
    if is_winner or auction.get("status") == "ended":
        product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
        response["revealed_product"] = product
        response["retail_value"] = product.get("retail_price") if product else 0
    
    return response

@router.get("/tiers")
async def get_mystery_tiers():
    """Get available mystery box tiers"""
    return {"tiers": MYSTERY_TIERS}

# ==================== ADMIN ENDPOINTS ====================

@router.post("/admin/create")
async def create_mystery_auction(
    product_id: str,
    tier: str,
    hint: str,
    duration_hours: int = 24,
    starting_price: float = 0.01,
    admin: dict = Depends(get_current_admin)
):
    """Create a mystery box auction"""
    if tier not in MYSTERY_TIERS:
        raise HTTPException(status_code=400, detail="Ungültige Mystery-Stufe")
    
    # Verify product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    # Check product value matches tier
    tier_info = MYSTERY_TIERS[tier]
    if not (tier_info["min_value"] <= product.get("retail_price", 0) <= tier_info["max_value"]):
        raise HTTPException(
            status_code=400, 
            detail=f"Produktwert (€{product.get('retail_price')}) passt nicht zur {tier} Stufe"
        )
    
    now = datetime.now(timezone.utc)
    end_time = now + timedelta(hours=duration_hours)
    
    auction = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "is_mystery": True,
        "mystery_tier": tier,
        "mystery_hint": hint,
        "mystery_hints": [],  # Additional hints can be added
        "current_price": starting_price,
        "starting_price": starting_price,
        "bid_count": 0,
        "status": "active",
        "start_time": now.isoformat(),
        "end_time": end_time.isoformat(),
        "created_by": admin["id"],
        "created_at": now.isoformat()
    }
    
    await db.auctions.insert_one(auction)
    
    logger.info(f"Mystery auction created: {tier} tier by {admin.get('name')}")
    
    return {"auction": auction, "message": "Mystery Auktion erstellt!"}

@router.post("/admin/{auction_id}/add-hint")
async def add_mystery_hint(
    auction_id: str,
    hint: str,
    admin: dict = Depends(get_current_admin)
):
    """Add an additional hint to a mystery auction"""
    result = await db.auctions.update_one(
        {"id": auction_id, "is_mystery": True},
        {"$push": {"mystery_hints": {
            "hint": hint,
            "added_at": datetime.now(timezone.utc).isoformat()
        }}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mystery Auktion nicht gefunden")
    
    return {"message": "Hinweis hinzugefügt!"}

@router.get("/admin/list")
async def list_mystery_auctions(admin: dict = Depends(get_current_admin)):
    """List all mystery auctions (admin view with full details)"""
    auctions = await db.auctions.find(
        {"is_mystery": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    # Enrich with product details
    enriched = []
    for auction in auctions:
        product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
        enriched.append({
            **auction,
            "product": product
        })
    
    return {"auctions": enriched}
