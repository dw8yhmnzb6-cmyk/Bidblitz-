"""Deal Radar & Price History - Schnäppchen-Finder"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/deal-radar", tags=["Deal Radar"])

# ==================== PRICE HISTORY ====================

@router.get("/price-history/{product_id}")
async def get_price_history(product_id: str):
    """Get price history for a product - how much it typically sells for"""
    # Get completed auctions for this product from history
    history = await db.auction_history.find(
        {"product_id": product_id},
        {"_id": 0, "final_price": 1, "ended_at": 1, "total_bids": 1, "winner_name": 1}
    ).sort("ended_at", -1).limit(20).to_list(20)
    
    if not history:
        return {
            "product_id": product_id,
            "avg_price": 0,
            "min_price": 0,
            "max_price": 0,
            "total_sold": 0,
            "history": []
        }
    
    prices = [h.get("final_price", 0) for h in history if h.get("final_price")]
    
    return {
        "product_id": product_id,
        "avg_price": round(sum(prices) / len(prices), 2) if prices else 0,
        "min_price": round(min(prices), 2) if prices else 0,
        "max_price": round(max(prices), 2) if prices else 0,
        "total_sold": len(prices),
        "history": history
    }

# ==================== SCHNÄPPCHEN RADAR ====================

@router.get("/bargains")
async def get_bargain_auctions(limit: int = 10):
    """Get auctions that are potential bargains - low activity, time running out"""
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Find active auctions
    auctions = await db.auctions.find({
        "status": "active"
    }, {"_id": 0}).to_list(200)
    
    bargains = []
    
    for auction in auctions:
        try:
            end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
            seconds_left = (end_time - now).total_seconds()
            
            # Skip if too much time left (more than 2 hours) or already ended
            if seconds_left <= 0 or seconds_left > 7200:
                continue
            
            # Calculate bargain score
            # Lower is better: low bids, low price, short time
            current_price = auction.get("current_price", 0)
            total_bids = auction.get("total_bids", 0)
            retail_price = auction.get("retail_price", 100)
            
            # Get product info
            product = await db.products.find_one(
                {"id": auction.get("product_id")}, 
                {"_id": 0, "name": 1, "retail_price": 1, "image_url": 1, "category": 1}
            )
            if product:
                retail_price = product.get("retail_price", retail_price)
            
            # Bargain indicators
            price_ratio = current_price / retail_price if retail_price > 0 else 1
            bid_intensity = total_bids / max(1, (7200 - seconds_left) / 60)  # bids per minute that passed
            
            # Score: lower is better bargain
            # Good bargains: low price ratio, low bid intensity, less time remaining
            bargain_score = (price_ratio * 100) + (bid_intensity * 10) + (seconds_left / 100)
            
            # Only include if it's actually a good deal potential
            if price_ratio < 0.05 and total_bids < 50:  # Under 5% of retail and less than 50 bids
                bargains.append({
                    "auction_id": auction["id"],
                    "product_id": auction.get("product_id"),
                    "product_name": product.get("name") if product else "Produkt",
                    "product_image": product.get("image_url") if product else None,
                    "category": product.get("category") if product else None,
                    "current_price": current_price,
                    "retail_price": retail_price,
                    "discount_percent": round((1 - price_ratio) * 100, 1),
                    "total_bids": total_bids,
                    "seconds_left": int(seconds_left),
                    "minutes_left": round(seconds_left / 60, 1),
                    "bargain_score": round(bargain_score, 2),
                    "end_time": auction["end_time"],
                    "last_bidder": auction.get("last_bidder_name"),
                    "is_low_activity": bid_intensity < 0.5,  # Less than 0.5 bids per minute
                    "is_ending_soon": seconds_left < 300,  # Less than 5 minutes
                })
        except Exception as e:
            logger.error(f"Error processing auction {auction.get('id')}: {e}")
            continue
    
    # Sort by bargain score (lower = better deal)
    bargains.sort(key=lambda x: x["bargain_score"])
    
    return {
        "bargains": bargains[:limit],
        "total_found": len(bargains),
        "checked_at": now_iso
    }

@router.get("/low-activity")
async def get_low_activity_auctions(limit: int = 10):
    """Get auctions with low bidding activity - good opportunities"""
    now = datetime.now(timezone.utc)
    
    auctions = await db.auctions.find({
        "status": "active",
        "total_bids": {"$lt": 30}  # Less than 30 total bids
    }, {"_id": 0}).sort("total_bids", 1).limit(limit * 2).to_list(limit * 2)
    
    results = []
    for auction in auctions:
        product = await db.products.find_one(
            {"id": auction.get("product_id")}, 
            {"_id": 0, "name": 1, "retail_price": 1, "image_url": 1}
        )
        
        end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
        seconds_left = max(0, (end_time - now).total_seconds())
        
        results.append({
            "auction_id": auction["id"],
            "product_name": product.get("name") if product else "Produkt",
            "product_image": product.get("image_url") if product else None,
            "current_price": auction.get("current_price", 0),
            "retail_price": product.get("retail_price", 0) if product else 0,
            "total_bids": auction.get("total_bids", 0),
            "seconds_left": int(seconds_left),
            "last_bidder": auction.get("last_bidder_name"),
            "end_time": auction["end_time"]
        })
    
    return {"auctions": results[:limit]}

@router.get("/ending-soon")
async def get_ending_soon_auctions(minutes: int = 30, limit: int = 10):
    """Get auctions ending within specified minutes"""
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(minutes=minutes)
    
    auctions = await db.auctions.find({
        "status": "active",
        "end_time": {"$lte": cutoff.isoformat(), "$gte": now.isoformat()}
    }, {"_id": 0}).to_list(limit * 2)
    
    results = []
    for auction in auctions:
        product = await db.products.find_one(
            {"id": auction.get("product_id")}, 
            {"_id": 0, "name": 1, "retail_price": 1, "image_url": 1}
        )
        
        end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
        seconds_left = max(0, (end_time - now).total_seconds())
        
        results.append({
            "auction_id": auction["id"],
            "product_name": product.get("name") if product else "Produkt",
            "product_image": product.get("image_url") if product else None,
            "current_price": auction.get("current_price", 0),
            "retail_price": product.get("retail_price", 0) if product else 0,
            "total_bids": auction.get("total_bids", 0),
            "seconds_left": int(seconds_left),
            "last_bidder": auction.get("last_bidder_name"),
            "end_time": auction["end_time"]
        })
    
    # Sort by seconds left
    results.sort(key=lambda x: x["seconds_left"])
    
    return {"auctions": results[:limit], "within_minutes": minutes}

# ==================== USER DEAL PREFERENCES ====================

@router.get("/my-preferences")
async def get_deal_preferences(user: dict = Depends(get_current_user)):
    """Get user's deal notification preferences"""
    prefs = await db.deal_preferences.find_one(
        {"user_id": user["id"]},
        {"_id": 0}
    )
    
    if not prefs:
        # Return default preferences
        return {
            "user_id": user["id"],
            "notify_bargains": True,
            "notify_ending_soon": True,
            "notify_low_activity": True,
            "min_discount_percent": 90,
            "max_price": 50.0,
            "categories": [],
            "telegram_enabled": True,
            "push_enabled": True
        }
    
    return prefs

@router.put("/my-preferences")
async def update_deal_preferences(
    notify_bargains: bool = True,
    notify_ending_soon: bool = True,
    notify_low_activity: bool = True,
    min_discount_percent: int = 90,
    max_price: float = 50.0,
    categories: list = [],
    telegram_enabled: bool = True,
    push_enabled: bool = True,
    user: dict = Depends(get_current_user)
):
    """Update user's deal notification preferences"""
    prefs = {
        "user_id": user["id"],
        "notify_bargains": notify_bargains,
        "notify_ending_soon": notify_ending_soon,
        "notify_low_activity": notify_low_activity,
        "min_discount_percent": min_discount_percent,
        "max_price": max_price,
        "categories": categories,
        "telegram_enabled": telegram_enabled,
        "push_enabled": push_enabled,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.deal_preferences.update_one(
        {"user_id": user["id"]},
        {"$set": prefs},
        upsert=True
    )
    
    return {"message": "Einstellungen gespeichert", "preferences": prefs}
