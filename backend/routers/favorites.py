"""Auction Favorites Router - Smart alerts for favorite products"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, List
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])

# ==================== SCHEMAS ====================

class FavoriteCreate(BaseModel):
    product_id: Optional[str] = None
    category: Optional[str] = None
    price_alert: Optional[float] = None  # Alert when auction ends below this price

class AlertSettings(BaseModel):
    push_enabled: bool = True
    email_enabled: bool = False
    alert_before_minutes: int = 5  # Alert X minutes before auction starts

# ==================== ENDPOINTS ====================

@router.post("/add")
async def add_favorite(data: FavoriteCreate, user: dict = Depends(get_current_user)):
    """Add a product or category to favorites"""
    user_id = user["id"]
    
    if not data.product_id and not data.category:
        raise HTTPException(status_code=400, detail="Produkt-ID oder Kategorie erforderlich")
    
    # Check for existing favorite
    query = {"user_id": user_id}
    if data.product_id:
        query["product_id"] = data.product_id
    if data.category:
        query["category"] = data.category
    
    existing = await db.favorites.find_one(query)
    if existing:
        # Update price alert if provided
        if data.price_alert:
            await db.favorites.update_one(
                {"id": existing["id"]},
                {"$set": {"price_alert": data.price_alert, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {"success": True, "message": "Preisalarm aktualisiert", "favorite_id": existing["id"]}
        raise HTTPException(status_code=400, detail="Bereits in Favoriten")
    
    # Get product info if product_id provided
    product_info = None
    if data.product_id:
        product = await db.products.find_one({"id": data.product_id}, {"_id": 0})
        if product:
            product_info = {
                "name": product.get("name"),
                "image_url": product.get("image_url"),
                "retail_price": product.get("retail_price")
            }
    
    favorite = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "product_id": data.product_id,
        "category": data.category,
        "product_info": product_info,
        "price_alert": data.price_alert,
        "alert_settings": {
            "push_enabled": True,
            "email_enabled": False,
            "alert_before_minutes": 5
        },
        "notified_auctions": [],  # Track which auctions we've notified about
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.favorites.insert_one(favorite)
    
    logger.info(f"Favorite added: {user_id} - product:{data.product_id} category:{data.category}")
    
    return {
        "success": True,
        "message": "Zu Favoriten hinzugefügt! Du wirst benachrichtigt wenn eine Auktion startet.",
        "favorite_id": favorite["id"]
    }

@router.delete("/remove/{favorite_id}")
async def remove_favorite(favorite_id: str, user: dict = Depends(get_current_user)):
    """Remove from favorites"""
    result = await db.favorites.delete_one({
        "id": favorite_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorit nicht gefunden")
    
    return {"success": True, "message": "Aus Favoriten entfernt"}

@router.delete("/remove-product/{product_id}")
async def remove_favorite_by_product(product_id: str, user: dict = Depends(get_current_user)):
    """Remove a product from favorites"""
    result = await db.favorites.delete_one({
        "product_id": product_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorit nicht gefunden")
    
    return {"success": True, "message": "Aus Favoriten entfernt"}

@router.get("/my-favorites")
async def get_my_favorites(user: dict = Depends(get_current_user)):
    """Get all user favorites"""
    favorites = await db.favorites.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with current auction info
    for fav in favorites:
        if fav.get("product_id"):
            # Check for active auctions with this product
            active_auction = await db.auctions.find_one({
                "product_id": fav["product_id"],
                "status": "active"
            }, {"_id": 0, "id": 1, "current_price": 1, "end_time": 1})
            
            fav["active_auction"] = active_auction
    
    return {"favorites": favorites, "count": len(favorites)}

@router.get("/check/{product_id}")
async def check_favorite(product_id: str, user: dict = Depends(get_current_user)):
    """Check if a product is favorited"""
    favorite = await db.favorites.find_one({
        "user_id": user["id"],
        "product_id": product_id
    }, {"_id": 0})
    
    return {
        "is_favorite": favorite is not None,
        "favorite": favorite
    }

@router.put("/settings/{favorite_id}")
async def update_alert_settings(
    favorite_id: str,
    settings: AlertSettings,
    user: dict = Depends(get_current_user)
):
    """Update notification settings for a favorite"""
    result = await db.favorites.update_one(
        {"id": favorite_id, "user_id": user["id"]},
        {"$set": {
            "alert_settings": settings.dict(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Favorit nicht gefunden")
    
    return {"success": True, "message": "Einstellungen aktualisiert"}

@router.get("/live-alerts")
async def get_live_alerts(user: dict = Depends(get_current_user)):
    """Get alerts for favorites that have active auctions"""
    favorites = await db.favorites.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    alerts = []
    
    for fav in favorites:
        if fav.get("product_id"):
            # Find active auctions for this product
            auctions = await db.auctions.find({
                "product_id": fav["product_id"],
                "status": "active"
            }, {"_id": 0}).to_list(10)
            
            for auction in auctions:
                if auction["id"] not in fav.get("notified_auctions", []):
                    alerts.append({
                        "favorite_id": fav["id"],
                        "product_name": fav.get("product_info", {}).get("name", "Produkt"),
                        "product_image": fav.get("product_info", {}).get("image_url"),
                        "auction_id": auction["id"],
                        "current_price": auction.get("current_price"),
                        "message": f"Dein Favorit '{fav.get('product_info', {}).get('name', 'Produkt')}' ist jetzt live!"
                    })
        
        elif fav.get("category"):
            # Find active auctions in this category
            auctions = await db.auctions.find({
                "category": fav["category"],
                "status": "active"
            }, {"_id": 0}).to_list(10)
            
            for auction in auctions:
                if auction["id"] not in fav.get("notified_auctions", []):
                    product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
                    alerts.append({
                        "favorite_id": fav["id"],
                        "category": fav["category"],
                        "product_name": product.get("name") if product else "Produkt",
                        "product_image": product.get("image_url") if product else None,
                        "auction_id": auction["id"],
                        "current_price": auction.get("current_price"),
                        "message": f"Neue Auktion in deiner Lieblingskategorie '{fav['category']}'!"
                    })
    
    return {"alerts": alerts, "count": len(alerts)}


favorites_router = router
