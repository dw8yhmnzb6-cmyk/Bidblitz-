"""
Auto-Bid System - Automatisches Bieten für Benutzer
Features: Max-Preis setzen, automatische Gebote, Budget-Management
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid
import asyncio

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/auto-bid", tags=["Auto-Bid"])


# ==================== SCHEMAS ====================

class AutoBidConfig(BaseModel):
    auction_id: str
    max_price: float  # Maximum price willing to pay
    max_bids: Optional[int] = 50  # Max number of bids to place
    bid_delay: Optional[int] = 3  # Seconds to wait before placing bid


class AutoBidUpdate(BaseModel):
    max_price: Optional[float] = None
    max_bids: Optional[int] = None
    is_active: Optional[bool] = None


# ==================== ENDPOINTS ====================

@router.post("/configure")
async def configure_auto_bid(config: AutoBidConfig, user: dict = Depends(get_current_user)):
    """
    Konfiguriere Auto-Bid für eine Auktion
    
    - max_price: Maximaler Preis den du zahlen willst
    - max_bids: Maximale Anzahl Gebote (Standard: 50)
    - bid_delay: Verzögerung in Sekunden (Standard: 3)
    """
    user_id = user["id"]
    
    # Validate auction exists
    auction = await db.auctions.find_one({"id": config.auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    if auction.get("status") != "active":
        raise HTTPException(status_code=400, detail="Auktion ist nicht aktiv")
    
    if config.max_price <= 0:
        raise HTTPException(status_code=400, detail="Max-Preis muss positiv sein")
    
    # Check user's bid balance
    if user.get("bids_balance", 0) < 1:
        raise HTTPException(status_code=400, detail="Nicht genügend Gebote")
    
    # Check if auto-bid already exists
    existing = await db.auto_bids.find_one({
        "user_id": user_id,
        "auction_id": config.auction_id
    })
    
    auto_bid_id = existing.get("id") if existing else str(uuid.uuid4())
    
    auto_bid_data = {
        "id": auto_bid_id,
        "user_id": user_id,
        "auction_id": config.auction_id,
        "max_price": config.max_price,
        "max_bids": config.max_bids or 50,
        "bid_delay": config.bid_delay or 3,
        "bids_placed": existing.get("bids_placed", 0) if existing else 0,
        "is_active": True,
        "created_at": existing.get("created_at", datetime.now(timezone.utc).isoformat()) if existing else datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.auto_bids.update_one(
            {"id": auto_bid_id},
            {"$set": auto_bid_data}
        )
        message = "Auto-Bid aktualisiert"
    else:
        await db.auto_bids.insert_one(auto_bid_data)
        message = "Auto-Bid konfiguriert"
    
    logger.info(f"Auto-bid configured for user {user_id} on auction {config.auction_id}: max €{config.max_price}")
    
    return {
        "success": True,
        "message": message,
        "auto_bid": {
            "id": auto_bid_id,
            "auction_id": config.auction_id,
            "max_price": config.max_price,
            "max_bids": auto_bid_data["max_bids"],
            "bids_placed": auto_bid_data["bids_placed"],
            "is_active": True
        }
    }


@router.get("/my-auto-bids")
async def get_my_auto_bids(user: dict = Depends(get_current_user)):
    """Liste aller meiner Auto-Bid Konfigurationen"""
    user_id = user["id"]
    
    auto_bids = await db.auto_bids.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Enrich with auction info
    result = []
    for ab in auto_bids:
        auction = await db.auctions.find_one(
            {"id": ab["auction_id"]},
            {"_id": 0, "title": 1, "current_price": 1, "status": 1, "image_url": 1}
        )
        result.append({
            **ab,
            "auction_title": auction.get("title") if auction else "Gelöscht",
            "auction_current_price": auction.get("current_price", 0) if auction else 0,
            "auction_status": auction.get("status", "unknown") if auction else "deleted",
            "auction_image": auction.get("image_url") if auction else None
        })
    
    return {
        "auto_bids": result,
        "total": len(result)
    }


@router.put("/{auto_bid_id}")
async def update_auto_bid(
    auto_bid_id: str,
    update: AutoBidUpdate,
    user: dict = Depends(get_current_user)
):
    """Aktualisiere eine Auto-Bid Konfiguration"""
    auto_bid = await db.auto_bids.find_one({
        "id": auto_bid_id,
        "user_id": user["id"]
    })
    
    if not auto_bid:
        raise HTTPException(status_code=404, detail="Auto-Bid nicht gefunden")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if update.max_price is not None:
        if update.max_price <= 0:
            raise HTTPException(status_code=400, detail="Max-Preis muss positiv sein")
        update_data["max_price"] = update.max_price
    
    if update.max_bids is not None:
        update_data["max_bids"] = update.max_bids
    
    if update.is_active is not None:
        update_data["is_active"] = update.is_active
    
    await db.auto_bids.update_one(
        {"id": auto_bid_id},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "Auto-Bid aktualisiert"
    }


@router.delete("/{auto_bid_id}")
async def delete_auto_bid(auto_bid_id: str, user: dict = Depends(get_current_user)):
    """Lösche eine Auto-Bid Konfiguration"""
    result = await db.auto_bids.delete_one({
        "id": auto_bid_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Auto-Bid nicht gefunden")
    
    return {
        "success": True,
        "message": "Auto-Bid gelöscht"
    }


@router.post("/toggle/{auction_id}")
async def toggle_auto_bid(auction_id: str, user: dict = Depends(get_current_user)):
    """Toggle Auto-Bid an/aus für eine Auktion"""
    auto_bid = await db.auto_bids.find_one({
        "auction_id": auction_id,
        "user_id": user["id"]
    })
    
    if not auto_bid:
        raise HTTPException(status_code=404, detail="Kein Auto-Bid für diese Auktion konfiguriert")
    
    new_status = not auto_bid.get("is_active", False)
    
    await db.auto_bids.update_one(
        {"id": auto_bid["id"]},
        {
            "$set": {
                "is_active": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "success": True,
        "is_active": new_status,
        "message": "Auto-Bid aktiviert" if new_status else "Auto-Bid deaktiviert"
    }


# ==================== AUTO-BID PROCESSING ====================
# This would typically be called by a background task/cron job

@router.post("/process/{auction_id}")
async def process_auto_bids_for_auction(auction_id: str):
    """
    Verarbeite Auto-Bids für eine Auktion
    (Wird normalerweise von einem Hintergrund-Job aufgerufen)
    """
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction or auction.get("status") != "active":
        return {"processed": 0, "message": "Auktion nicht aktiv"}
    
    current_price = auction.get("current_price", 0)
    last_bidder_id = auction.get("last_bidder_id")
    
    # Find active auto-bids for this auction
    auto_bids = await db.auto_bids.find({
        "auction_id": auction_id,
        "is_active": True,
        "max_price": {"$gt": current_price}
    }).to_list(100)
    
    processed = 0
    for ab in auto_bids:
        user_id = ab["user_id"]
        
        # Skip if user is already the highest bidder
        if user_id == last_bidder_id:
            continue
        
        # Check if max_bids reached
        if ab.get("bids_placed", 0) >= ab.get("max_bids", 50):
            await db.auto_bids.update_one(
                {"id": ab["id"]},
                {"$set": {"is_active": False, "deactivation_reason": "max_bids_reached"}}
            )
            continue
        
        # Check user has bids
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "bids_balance": 1})
        if not user or user.get("bids_balance", 0) < 1:
            await db.auto_bids.update_one(
                {"id": ab["id"]},
                {"$set": {"is_active": False, "deactivation_reason": "no_bids"}}
            )
            continue
        
        # Place bid (simplified - would normally use the actual bid endpoint)
        new_price = current_price + 0.01  # Standard increment
        
        if new_price > ab["max_price"]:
            await db.auto_bids.update_one(
                {"id": ab["id"]},
                {"$set": {"is_active": False, "deactivation_reason": "max_price_reached"}}
            )
            continue
        
        # Update auto-bid stats
        await db.auto_bids.update_one(
            {"id": ab["id"]},
            {
                "$inc": {"bids_placed": 1},
                "$set": {"last_bid_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        processed += 1
        break  # Only one auto-bid per processing cycle
    
    return {
        "processed": processed,
        "auction_id": auction_id,
        "current_price": current_price
    }


auto_bid_router = router
