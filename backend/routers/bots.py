"""Bots router - Bot management for admin"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import uuid
import random
import asyncio

from config import db, logger
from dependencies import get_admin_user
from schemas import BotCreate, BotBidRequest, MultiBotBidRequest

router = APIRouter(prefix="/admin/bots", tags=["Bots"])

# ==================== BOT CRUD ====================

@router.post("")
async def create_bot(bot: BotCreate, admin: dict = Depends(get_admin_user)):
    """Create a new bot"""
    bot_id = str(uuid.uuid4())
    doc = {
        "id": bot_id,
        "name": bot.name,
        "bids_placed": 0,
        "wins": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bots.insert_one(doc)
    return doc

@router.get("")
async def get_bots(admin: dict = Depends(get_admin_user)):
    """Get all bots"""
    bots = await db.bots.find({}, {"_id": 0}).to_list(100)
    return bots

@router.delete("/{bot_id}")
async def delete_bot(bot_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a bot"""
    result = await db.bots.delete_one({"id": bot_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bot not found")
    return {"message": "Bot deleted"}

# ==================== BOT BIDDING ====================

@router.post("/execute-bids")
async def execute_bot_bids(auction_id: str, num_bids: int = 1, admin: dict = Depends(get_admin_user)):
    """Execute a specific number of bot bids on an auction"""
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    if auction["status"] != "active":
        raise HTTPException(status_code=400, detail="Auction is not active")
    
    # Get all bots
    bots = await db.bots.find({}, {"_id": 0}).to_list(100)
    if not bots:
        raise HTTPException(status_code=400, detail="No bots available. Create some first.")
    
    current_price = auction.get("current_price", 0.01)
    bid_increment = auction.get("bid_increment", 0.01)
    bids_placed = 0
    
    for i in range(num_bids):
        bot = random.choice(bots)
        new_price = round(current_price + bid_increment, 2)
        
        # Update auction
        await db.auctions.update_one(
            {"id": auction_id},
            {
                "$set": {
                    "current_price": new_price,
                    "last_bidder_id": f"bot_{bot['id']}",
                    "last_bidder_name": bot["name"],
                    "end_time": (datetime.now(timezone.utc) + timedelta(seconds=15)).isoformat()
                },
                "$inc": {"total_bids": 1}
            }
        )
        
        # Update bot stats
        await db.bots.update_one(
            {"id": bot["id"]},
            {"$inc": {"total_bids_placed": 1, "bids_placed": 1}}
        )
        
        current_price = new_price
        bids_placed += 1
    
    return {
        "success": True,
        "bids_placed": bids_placed,
        "new_price": current_price
    }

@router.post("/bid")
async def bot_bid(request: BotBidRequest, admin: dict = Depends(get_admin_user)):
    """Make a bot place a single bid"""
    bot = await db.bots.find_one({"id": request.bot_id}, {"_id": 0})
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    auction = await db.auctions.find_one({"id": request.auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    if auction["status"] != "active":
        raise HTTPException(status_code=400, detail="Auction is not active")
    
    # Place bid
    new_price = round(auction["current_price"] + auction["bid_increment"], 2)
    new_end_time = datetime.now(timezone.utc) + timedelta(seconds=15)
    
    await db.auctions.update_one(
        {"id": request.auction_id},
        {
            "$set": {
                "current_price": new_price,
                "last_bidder_id": f"bot_{bot['id']}",
                "last_bidder_name": bot["name"],
                "end_time": new_end_time.isoformat()
            },
            "$inc": {"total_bids": 1},
            "$push": {
                "bid_history": {
                    "bidder_id": f"bot_{bot['id']}",
                    "bidder_name": bot["name"],
                    "price": new_price,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "is_bot": True
                }
            }
        }
    )
    
    # Update bot stats
    await db.bots.update_one({"id": bot["id"]}, {"$inc": {"bids_placed": 1}})
    
    return {
        "success": True,
        "new_price": new_price,
        "bot_name": bot["name"]
    }

@router.post("/multi-bid")
async def multi_bot_bid(request: MultiBotBidRequest, admin: dict = Depends(get_admin_user)):
    """Start multiple bots bidding against each other until target price"""
    auction = await db.auctions.find_one({"id": request.auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    if auction["status"] != "active":
        raise HTTPException(status_code=400, detail="Auction is not active")
    
    # Get all bots
    bots = await db.bots.find({}, {"_id": 0}).to_list(100)
    if len(bots) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 bots")
    
    # Update auction with target price for background task
    await db.auctions.update_one(
        {"id": request.auction_id},
        {"$set": {"bot_target_price": request.target_price}}
    )
    
    return {
        "success": True,
        "message": f"Bots will bid until €{request.target_price:.2f}",
        "auction_id": request.auction_id
    }

@router.post("/bid-to-price")
async def bid_to_target_price(auction_id: str, target_price: float, admin: dict = Depends(get_admin_user)):
    """Set bot target price for an auction. If auction is active, immediately place bids."""
    import random
    from datetime import datetime, timezone, timedelta
    
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    # Always save the bot_target_price for later use by the bot system
    await db.auctions.update_one(
        {"id": auction_id},
        {"$set": {"bot_target_price": target_price}}
    )
    
    # If auction is not active (e.g., scheduled), just save the target and return success
    if auction["status"] not in ["active", "day_paused", "night_paused"]:
        return {
            "success": True,
            "bids_placed": 0,
            "final_price": auction.get("current_price", 0.01),
            "message": f"Bot target price (€{target_price:.2f}) saved. Bots will bid when auction becomes active."
        }
    
    # Get all bots
    bots = await db.bots.find({}, {"_id": 0}).to_list(100)
    if len(bots) < 2:
        # Still save the target, but warn about bots
        return {
            "success": True,
            "bids_placed": 0,
            "final_price": auction.get("current_price", 0.01),
            "message": f"Bot target price saved, but need at least 2 bots to start bidding."
        }
    
    current_price = auction.get("current_price", 0.01)
    bid_increment = auction.get("bid_increment", 0.01)
    
    if current_price >= target_price:
        return {
            "success": True,
            "bids_placed": 0,
            "final_price": current_price,
            "message": "Target price already reached"
        }
    
    # Calculate number of bids needed
    bids_needed = int((target_price - current_price) / bid_increment)
    bids_placed = 0
    
    # Place bids up to target price
    for i in range(bids_needed):
        bot = random.choice(bots)
        new_price = round(current_price + bid_increment, 2)
        
        if new_price > target_price:
            break
        
        # Update auction price
        await db.auctions.update_one(
            {"id": auction_id},
            {
                "$set": {
                    "current_price": new_price,
                    "last_bidder_id": f"bot_{bot['id']}",
                    "last_bidder_name": bot["name"],
                    "end_time": (datetime.now(timezone.utc) + timedelta(seconds=15)).isoformat()
                },
                "$inc": {"total_bids": 1}
            }
        )
        
        # Update bot stats
        await db.bots.update_one(
            {"id": bot["id"]},
            {"$inc": {"total_bids_placed": 1}}
        )
        
        current_price = new_price
        bids_placed += 1
    
    # Also set target price for future reference
    await db.auctions.update_one(
        {"id": auction_id},
        {"$set": {"bot_target_price": target_price}}
    )
    
    return {
        "success": True,
        "bids_placed": bids_placed,
        "final_price": current_price,
        "message": f"Bot bids placed successfully"
    }

@router.put("/target-price/{auction_id}")
async def update_bot_target_price(auction_id: str, target_price: float, admin: dict = Depends(get_admin_user)):
    """Update the bot target price for an existing auction.
    
    WICHTIG: Der Bot-Mindestpreis ist der Preis, bis zu dem Bots automatisch bieten.
    Sobald dieser Preis erreicht ist, hören Bots auf und nur echte Kunden können bieten.
    
    - Setze target_price auf 0 um Bots zu deaktivieren
    - Setze target_price auf einen Wert > 0 um Bots bis zu diesem Preis bieten zu lassen
    """
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    old_target = auction.get("bot_target_price", 0)
    current_price = auction.get("current_price", 0)
    
    await db.auctions.update_one(
        {"id": auction_id},
        {"$set": {"bot_target_price": target_price}}
    )
    
    # Determine status message
    if target_price <= 0:
        status_msg = "Bot-Bieten deaktiviert - nur echte Kunden können bieten"
    elif current_price >= target_price:
        status_msg = f"Zielpreis bereits erreicht (€{current_price:.2f}) - nur echte Kunden bieten"
    else:
        status_msg = f"Bots werden bis €{target_price:.2f} bieten (aktuell: €{current_price:.2f})"
    
    return {
        "success": True,
        "message": status_msg,
        "auction_id": auction_id,
        "old_target_price": old_target,
        "new_target_price": target_price,
        "current_price": current_price,
        "bot_active": target_price > 0 and current_price < target_price
    }

@router.get("/status/{auction_id}")
async def get_bot_status(auction_id: str, admin: dict = Depends(get_admin_user)):
    """Get the bot bidding status for an auction"""
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    target_price = auction.get("bot_target_price", 0)
    current_price = auction.get("current_price", 0)
    
    # Count bot vs customer bids
    bid_history = auction.get("bid_history", [])
    bot_bids = len([b for b in bid_history if b.get("is_bot", False)])
    customer_bids = len([b for b in bid_history if not b.get("is_bot", False)])
    
    return {
        "auction_id": auction_id,
        "bot_target_price": target_price,
        "current_price": current_price,
        "target_reached": current_price >= target_price if target_price > 0 else True,
        "bot_bids_count": bot_bids,
        "customer_bids_count": customer_bids,
        "total_bids": auction.get("total_bids", 0),
        "bot_active": target_price > 0 and current_price < target_price and auction.get("status") == "active",
        "status": auction.get("status")
    }


# ==================== MERCHANT VOUCHER BOT SYSTEM ====================

@router.post("/configure-voucher-bots")
async def configure_voucher_bots(
    min_percent: float = 10,
    max_percent: float = 30,
    admin: dict = Depends(get_admin_user)
):
    """
    Konfiguriere Bots für alle Händler-Gutschein-Auktionen.
    Bots bieten zwischen 10-30% des Gutscheinwerts.
    
    Args:
        min_percent: Minimum Prozent des Gutscheinwerts (Standard: 10%)
        max_percent: Maximum Prozent des Gutscheinwerts (Standard: 30%)
    """
    import random
    
    # Validate percentages
    if min_percent < 5 or max_percent > 50:
        raise HTTPException(status_code=400, detail="Prozent muss zwischen 5% und 50% liegen")
    if min_percent > max_percent:
        raise HTTPException(status_code=400, detail="min_percent muss kleiner als max_percent sein")
    
    # Get all active merchant voucher auctions
    voucher_auctions = await db.auctions.find({
        "auction_type": "merchant_voucher",
        "status": {"$in": ["active", "scheduled", "day_paused", "night_paused"]}
    }).to_list(200)
    
    if not voucher_auctions:
        return {
            "success": True,
            "message": "Keine Händler-Gutschein-Auktionen gefunden",
            "configured": 0
        }
    
    configured = 0
    results = []
    
    for auction in voucher_auctions:
        # Get voucher value from product_details or title
        voucher_value = auction.get("product_details", {}).get("value", 0)
        
        # Try to extract from title if not in product_details
        if voucher_value == 0:
            title = auction.get("product_name", "")
            # Extract number from title like "€50 Gutschein"
            import re
            match = re.search(r'€?(\d+(?:\.\d+)?)', title)
            if match:
                voucher_value = float(match.group(1))
        
        if voucher_value <= 0:
            continue
        
        # Calculate random target price between min and max percent
        target_percent = random.uniform(min_percent, max_percent)
        target_price = round(voucher_value * (target_percent / 100), 2)
        
        # Ensure minimum target price
        target_price = max(target_price, 0.50)
        
        # Update auction with bot target
        await db.auctions.update_one(
            {"id": auction["id"]},
            {"$set": {
                "bot_target_price": target_price,
                "bot_target_percent": target_percent
            }}
        )
        
        configured += 1
        results.append({
            "auction_id": auction["id"],
            "voucher_value": voucher_value,
            "target_price": target_price,
            "target_percent": round(target_percent, 1)
        })
    
    logger.info(f"Configured bots for {configured} merchant voucher auctions")
    
    return {
        "success": True,
        "message": f"Bots für {configured} Gutschein-Auktionen konfiguriert",
        "configured": configured,
        "min_percent": min_percent,
        "max_percent": max_percent,
        "auctions": results
    }


@router.get("/voucher-bot-status")
async def get_voucher_bot_status(admin: dict = Depends(get_admin_user)):
    """Übersicht aller Händler-Gutschein-Auktionen mit Bot-Status"""
    voucher_auctions = await db.auctions.find({
        "auction_type": "merchant_voucher"
    }, {"_id": 0}).to_list(200)
    
    active_bots = 0
    auctions_info = []
    
    for auction in voucher_auctions:
        target_price = auction.get("bot_target_price", 0)
        current_price = auction.get("current_price", 0)
        is_active = target_price > 0 and current_price < target_price and auction.get("status") == "active"
        
        if is_active:
            active_bots += 1
        
        auctions_info.append({
            "auction_id": auction["id"],
            "title": auction.get("product_name", ""),
            "voucher_value": auction.get("product_details", {}).get("value", 0),
            "current_price": current_price,
            "bot_target_price": target_price,
            "bot_target_percent": auction.get("bot_target_percent", 0),
            "bot_active": is_active,
            "status": auction.get("status")
        })
    
    return {
        "total_voucher_auctions": len(voucher_auctions),
        "active_bots": active_bots,
        "auctions": auctions_info
    }
