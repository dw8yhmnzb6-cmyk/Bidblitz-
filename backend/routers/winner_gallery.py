"""
Winner Gallery Router
Display winners with their products and photos
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional, List
import uuid
import base64

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/winner-gallery", tags=["Winner Gallery"])


class WinnerPhotoUpload(BaseModel):
    auction_id: str
    caption: Optional[str] = ""


@router.get("/")
async def get_winner_gallery(
    limit: int = 20,
    skip: int = 0,
    featured_only: bool = False
):
    """Get winner gallery with photos"""
    query = {"photo_url": {"$exists": True, "$ne": None}}
    
    if featured_only:
        query["is_featured"] = True
    
    winners = await db.winner_gallery.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    # Enrich with product info
    enriched = []
    for winner in winners:
        product = await db.products.find_one(
            {"id": winner.get("product_id")},
            {"_id": 0, "name": 1, "image_url": 1, "retail_price": 1}
        )
        
        user = await db.users.find_one(
            {"id": winner.get("user_id")},
            {"_id": 0, "name": 1, "avatar_url": 1}
        )
        
        enriched.append({
            **winner,
            "product": product,
            "username": user.get("name", "Anonym") if user else "Anonym",
            "user_avatar": user.get("avatar_url") if user else None
        })
    
    total = await db.winner_gallery.count_documents(query)
    
    return {
        "winners": enriched,
        "total": total,
        "has_more": skip + limit < total
    }


@router.get("/recent")
async def get_recent_winners(limit: int = 10):
    """Get most recent winners for homepage display"""
    pipeline = [
        {"$sort": {"won_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "id",
            "as": "product"
        }},
        {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "id",
            "as": "user"
        }},
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "auction_id": 1,
            "product_id": 1,
            "won_at": 1,
            "final_price": 1,
            "savings": {"$subtract": [
                {"$ifNull": ["$product.retail_price", 0]},
                {"$ifNull": ["$final_price", 0]}
            ]},
            "product_name": "$product.name",
            "product_image": "$product.image_url",
            "retail_price": "$product.retail_price",
            "username": {"$ifNull": ["$user.name", "Anonym"]},
            "user_avatar": "$user.avatar_url",
            "has_photo": {"$cond": [{"$ifNull": ["$photo_url", False]}, True, False]}
        }}
    ]
    
    results = await db.won_auctions.aggregate(pipeline).to_list(length=limit)
    
    return {"winners": results}


@router.get("/stats")
async def get_gallery_stats():
    """Get statistics for winner gallery"""
    total_winners = await db.won_auctions.count_documents({})
    total_photos = await db.winner_gallery.count_documents({"photo_url": {"$exists": True}})
    
    # Calculate total savings
    pipeline = [
        {"$group": {
            "_id": None,
            "total_retail": {"$sum": "$retail_price"},
            "total_paid": {"$sum": "$final_price"}
        }}
    ]
    savings_result = await db.won_auctions.aggregate(pipeline).to_list(length=1)
    
    total_savings = 0
    if savings_result:
        total_savings = savings_result[0].get("total_retail", 0) - savings_result[0].get("total_paid", 0)
    
    return {
        "total_winners": total_winners,
        "total_photos": total_photos,
        "total_savings": round(max(0, total_savings), 2),
        "photo_rate": round(total_photos / max(1, total_winners) * 100, 1)
    }


@router.post("/upload-photo")
async def upload_winner_photo(
    auction_id: str,
    caption: str = "",
    photo: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload a winner photo for an auction win"""
    user_id = user["id"]
    
    # Verify user won this auction
    win = await db.won_auctions.find_one({
        "auction_id": auction_id,
        "user_id": user_id
    })
    
    if not win:
        raise HTTPException(status_code=403, detail="Du hast diese Auktion nicht gewonnen")
    
    # Check if photo already exists
    existing = await db.winner_gallery.find_one({
        "auction_id": auction_id,
        "user_id": user_id
    })
    
    # Read and encode photo
    content = await photo.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="Foto ist zu groß (max 5MB)")
    
    # Store as base64 (in production, use cloud storage)
    photo_b64 = base64.b64encode(content).decode()
    photo_url = f"data:{photo.content_type};base64,{photo_b64}"
    
    gallery_entry = {
        "id": str(uuid.uuid4()),
        "auction_id": auction_id,
        "user_id": user_id,
        "product_id": win.get("product_id"),
        "photo_url": photo_url,
        "caption": caption,
        "is_featured": False,
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.winner_gallery.update_one(
            {"id": existing["id"]},
            {"$set": {
                "photo_url": photo_url,
                "caption": caption,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": True, "message": "Foto aktualisiert!", "id": existing["id"]}
    else:
        await db.winner_gallery.insert_one(gallery_entry)
        
        # Award bonus XP for sharing
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"gamification.xp": 50}}
        )
        
        return {
            "success": True,
            "message": "Foto hochgeladen! +50 XP Bonus!",
            "id": gallery_entry["id"]
        }


@router.post("/{gallery_id}/like")
async def like_winner_photo(
    gallery_id: str,
    user: dict = Depends(get_current_user)
):
    """Like a winner photo"""
    user_id = user["id"]
    
    # Check if already liked
    existing_like = await db.gallery_likes.find_one({
        "gallery_id": gallery_id,
        "user_id": user_id
    })
    
    if existing_like:
        # Unlike
        await db.gallery_likes.delete_one({"_id": existing_like["_id"]})
        await db.winner_gallery.update_one(
            {"id": gallery_id},
            {"$inc": {"likes": -1}}
        )
        return {"liked": False, "message": "Like entfernt"}
    else:
        # Like
        await db.gallery_likes.insert_one({
            "gallery_id": gallery_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.winner_gallery.update_one(
            {"id": gallery_id},
            {"$inc": {"likes": 1}}
        )
        return {"liked": True, "message": "Gefällt mir!"}


@router.get("/my-photos")
async def get_my_winner_photos(user: dict = Depends(get_current_user)):
    """Get user's own winner photos"""
    user_id = user["id"]
    
    photos = await db.winner_gallery.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=50)
    
    # Enrich with product info
    enriched = []
    for photo in photos:
        product = await db.products.find_one(
            {"id": photo.get("product_id")},
            {"_id": 0, "name": 1, "image_url": 1}
        )
        enriched.append({
            **photo,
            "product": product
        })
    
    return {"photos": enriched}
