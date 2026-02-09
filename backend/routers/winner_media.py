"""Winner Media Gallery Router - Photos/Videos from real winners"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid
import os
import base64

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/winner-media", tags=["Winner Media Gallery"])

# ==================== SCHEMAS ====================

class MediaUpload(BaseModel):
    auction_id: str
    caption: Optional[str] = None
    media_type: str = "photo"  # photo, video

class MediaReview(BaseModel):
    status: str  # approved, rejected
    rejection_reason: Optional[str] = None

# ==================== USER ENDPOINTS ====================

@router.get("/my-wins-pending")
async def get_wins_pending_media(user: dict = Depends(get_current_user)):
    """Get user's wins that don't have media uploaded yet"""
    user_id = user["id"]
    
    # Get all won auctions
    won_auctions = await db.auctions.find(
        {"winner_id": user_id, "status": "ended"},
        {"_id": 0}
    ).to_list(50)
    
    # Filter out ones that already have media
    pending = []
    for auction in won_auctions:
        existing_media = await db.winner_media.find_one({
            "auction_id": auction["id"],
            "user_id": user_id
        })
        
        if not existing_media:
            # Get product info
            product = await db.products.find_one(
                {"id": auction.get("product_id")},
                {"_id": 0, "name": 1, "image_url": 1}
            )
            
            pending.append({
                "auction_id": auction["id"],
                "product_name": product.get("name") if product else auction.get("title", "Produkt"),
                "product_image": product.get("image_url") if product else None,
                "won_price": auction.get("current_price", 0),
                "won_at": auction.get("ended_at")
            })
    
    return {"pending_uploads": pending, "count": len(pending)}

@router.post("/upload")
async def upload_winner_media(
    auction_id: str,
    caption: Optional[str] = None,
    media_url: str = None,
    user: dict = Depends(get_current_user)
):
    """Upload media for a won auction"""
    user_id = user["id"]
    
    # Verify user won this auction
    auction = await db.auctions.find_one({
        "id": auction_id,
        "winner_id": user_id,
        "status": "ended"
    }, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=403, detail="Du hast diese Auktion nicht gewonnen")
    
    # Check if already uploaded
    existing = await db.winner_media.find_one({
        "auction_id": auction_id,
        "user_id": user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Media bereits hochgeladen")
    
    # Get product info
    product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
    
    # Create media entry
    media_id = str(uuid.uuid4())
    media_doc = {
        "id": media_id,
        "user_id": user_id,
        "user_name": user.get("name", user.get("username", "Gewinner")),
        "auction_id": auction_id,
        "product_id": auction.get("product_id"),
        "product_name": product.get("name") if product else auction.get("title", "Produkt"),
        "product_image": product.get("image_url") if product else None,
        "media_url": media_url,
        "media_type": "photo",  # Default to photo
        "caption": caption,
        "won_price": auction.get("current_price", 0),
        "retail_price": product.get("retail_price", 0) if product else 0,
        "status": "pending",  # pending, approved, rejected, featured
        "likes": 0,
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.winner_media.insert_one(media_doc)
    
    # Award bonus bids for uploading
    UPLOAD_BONUS = 5
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids_balance": UPLOAD_BONUS}}
    )
    
    logger.info(f"📸 Winner media uploaded by {user_id} for auction {auction_id}")
    
    return {
        "success": True,
        "message": f"Danke! Du hast {UPLOAD_BONUS} Bonus-Gebote erhalten!",
        "media_id": media_id,
        "bonus_bids": UPLOAD_BONUS
    }

@router.get("/my-uploads")
async def get_my_uploads(user: dict = Depends(get_current_user)):
    """Get user's uploaded media"""
    uploads = await db.winner_media.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"uploads": uploads}

# ==================== PUBLIC ENDPOINTS ====================

@router.get("/gallery")
async def get_winner_gallery(
    limit: int = 20,
    offset: int = 0,
    featured_only: bool = False
):
    """Get public winner gallery"""
    query = {"status": {"$in": ["approved", "featured"]}}
    if featured_only:
        query["status"] = "featured"
    
    media = await db.winner_media.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.winner_media.count_documents(query)
    
    return {
        "gallery": media,
        "total": total,
        "has_more": offset + limit < total
    }

@router.get("/featured")
async def get_featured_media(limit: int = 5):
    """Get featured winner media for homepage"""
    media = await db.winner_media.find(
        {"status": "featured"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"featured": media}

@router.post("/{media_id}/like")
async def like_media(media_id: str, user: dict = Depends(get_current_user)):
    """Like a winner media post"""
    # Check if already liked
    existing = await db.media_likes.find_one({
        "media_id": media_id,
        "user_id": user["id"]
    })
    
    if existing:
        # Unlike
        await db.media_likes.delete_one({"_id": existing["_id"]})
        await db.winner_media.update_one(
            {"id": media_id},
            {"$inc": {"likes": -1}}
        )
        return {"liked": False}
    
    # Like
    await db.media_likes.insert_one({
        "media_id": media_id,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.winner_media.update_one(
        {"id": media_id},
        {"$inc": {"likes": 1}}
    )
    
    return {"liked": True}

@router.post("/{media_id}/view")
async def record_view(media_id: str):
    """Record a view on media (public)"""
    await db.winner_media.update_one(
        {"id": media_id},
        {"$inc": {"views": 1}}
    )
    return {"success": True}

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/pending")
async def get_pending_media(admin: dict = Depends(get_admin_user)):
    """Get media pending review"""
    pending = await db.winner_media.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {"pending": pending, "count": len(pending)}

@router.put("/admin/{media_id}/review")
async def review_media(media_id: str, review: MediaReview, admin: dict = Depends(get_admin_user)):
    """Approve or reject media"""
    result = await db.winner_media.update_one(
        {"id": media_id},
        {"$set": {
            "status": review.status,
            "rejection_reason": review.rejection_reason,
            "reviewed_by": admin["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Media nicht gefunden")
    
    return {"success": True, "status": review.status}

@router.put("/admin/{media_id}/feature")
async def feature_media(media_id: str, admin: dict = Depends(get_admin_user)):
    """Feature/unfeature media on homepage"""
    media = await db.winner_media.find_one({"id": media_id})
    if not media:
        raise HTTPException(status_code=404, detail="Media nicht gefunden")
    
    new_status = "approved" if media.get("status") == "featured" else "featured"
    
    await db.winner_media.update_one(
        {"id": media_id},
        {"$set": {"status": new_status}}
    )
    
    return {"success": True, "featured": new_status == "featured"}

@router.get("/admin/stats")
async def get_media_stats(admin: dict = Depends(get_admin_user)):
    """Get media gallery statistics"""
    total = await db.winner_media.count_documents({})
    pending = await db.winner_media.count_documents({"status": "pending"})
    approved = await db.winner_media.count_documents({"status": "approved"})
    featured = await db.winner_media.count_documents({"status": "featured"})
    rejected = await db.winner_media.count_documents({"status": "rejected"})
    
    # Total likes and views
    pipeline = [
        {"$group": {
            "_id": None,
            "total_likes": {"$sum": "$likes"},
            "total_views": {"$sum": "$views"}
        }}
    ]
    stats = await db.winner_media.aggregate(pipeline).to_list(1)
    
    return {
        "total": total,
        "by_status": {
            "pending": pending,
            "approved": approved,
            "featured": featured,
            "rejected": rejected
        },
        "engagement": {
            "total_likes": stats[0]["total_likes"] if stats else 0,
            "total_views": stats[0]["total_views"] if stats else 0
        }
    }


winner_media_router = router
