"""Winner Reviews - Verified reviews from auction winners"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# ==================== PUBLIC ENDPOINTS ====================

@router.get("/")
async def get_reviews(
    product_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    sort: str = "recent"  # recent, rating, helpful
):
    """Get approved reviews"""
    query = {"status": "approved"}
    
    if product_id:
        query["product_id"] = product_id
    
    sort_field = {
        "recent": ("created_at", -1),
        "rating": ("rating", -1),
        "helpful": ("helpful_count", -1)
    }.get(sort, ("created_at", -1))
    
    reviews = await db.reviews.find(
        query,
        {"_id": 0}
    ).sort(sort_field[0], sort_field[1]).skip(offset).limit(limit).to_list(limit)
    
    # Get average rating
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "total": {"$sum": 1}
        }}
    ]
    stats = await db.reviews.aggregate(pipeline).to_list(1)
    stats = stats[0] if stats else {"avg_rating": 0, "total": 0}
    
    return {
        "reviews": reviews,
        "average_rating": round(stats.get("avg_rating", 0), 1),
        "total_reviews": stats.get("total", 0),
        "has_more": offset + limit < stats.get("total", 0)
    }

@router.get("/product/{product_id}")
async def get_product_reviews(product_id: str, limit: int = 10):
    """Get reviews for a specific product"""
    reviews = await db.reviews.find(
        {"product_id": product_id, "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Calculate stats
    total = await db.reviews.count_documents({"product_id": product_id, "status": "approved"})
    
    if total > 0:
        pipeline = [
            {"$match": {"product_id": product_id, "status": "approved"}},
            {"$group": {"_id": None, "avg": {"$avg": "$rating"}}}
        ]
        avg_result = await db.reviews.aggregate(pipeline).to_list(1)
        avg_rating = avg_result[0]["avg"] if avg_result else 0
    else:
        avg_rating = 0
    
    return {
        "reviews": reviews,
        "total": total,
        "average_rating": round(avg_rating, 1)
    }

@router.get("/featured")
async def get_featured_reviews(limit: int = 6):
    """Get featured/highlighted reviews for homepage"""
    reviews = await db.reviews.find(
        {"status": "approved", "featured": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # If not enough featured, get highest rated
    if len(reviews) < limit:
        additional = await db.reviews.find(
            {"status": "approved", "featured": {"$ne": True}, "rating": {"$gte": 4}},
            {"_id": 0}
        ).sort("rating", -1).limit(limit - len(reviews)).to_list(limit - len(reviews))
        reviews.extend(additional)
    
    return {"reviews": reviews}

# ==================== USER ENDPOINTS ====================

@router.post("/submit/{auction_id}")
async def submit_review(
    auction_id: str,
    rating: int,
    title: str,
    comment: str,
    would_recommend: bool = True,
    image_url: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Submit a review for a won auction"""
    user_id = user["id"]
    
    # Validate rating
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Bewertung muss zwischen 1 und 5 sein")
    
    # Check if user won this auction
    won_auction = await db.won_auctions.find_one({
        "auction_id": auction_id,
        "user_id": user_id
    })
    
    if not won_auction:
        raise HTTPException(status_code=403, detail="Du hast diese Auktion nicht gewonnen")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({
        "auction_id": auction_id,
        "user_id": user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du hast diese Auktion bereits bewertet")
    
    # Get product info
    product = await db.products.find_one(
        {"id": won_auction.get("product_id")},
        {"_id": 0, "name": 1, "image_url": 1}
    )
    
    review = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": user.get("name", "Anonym"),
        "auction_id": auction_id,
        "product_id": won_auction.get("product_id"),
        "product_name": product.get("name") if product else "Unbekannt",
        "product_image": product.get("image_url") if product else None,
        "rating": rating,
        "title": title,
        "comment": comment,
        "would_recommend": would_recommend,
        "image_url": image_url,
        "savings": won_auction.get("retail_price", 0) - won_auction.get("final_price", 0),
        "verified_purchase": True,
        "helpful_count": 0,
        "featured": False,
        "status": "pending",  # pending, approved, rejected
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review)
    
    # Award bonus for review
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids_balance": 3}}  # 3 bonus bids for leaving a review
    )
    
    logger.info(f"Review submitted by {user_id} for auction {auction_id}")
    
    return {
        "message": "Bewertung eingereicht! Du erhältst 3 Bonus-Gebote nach Freigabe.",
        "review_id": review["id"]
    }

@router.get("/my-reviews")
async def get_my_reviews(user: dict = Depends(get_current_user)):
    """Get user's own reviews"""
    reviews = await db.reviews.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"reviews": reviews}

@router.get("/pending")
async def get_pending_reviews(user: dict = Depends(get_current_user)):
    """Get auctions that can be reviewed"""
    user_id = user["id"]
    
    # Get won auctions
    won_auctions = await db.won_auctions.find(
        {"user_id": user_id},
        {"_id": 0, "auction_id": 1, "product_id": 1}
    ).to_list(100)
    
    # Filter out already reviewed
    pending = []
    for wa in won_auctions:
        existing_review = await db.reviews.find_one({
            "auction_id": wa["auction_id"],
            "user_id": user_id
        })
        
        if not existing_review:
            product = await db.products.find_one(
                {"id": wa.get("product_id")},
                {"_id": 0, "name": 1, "image_url": 1}
            )
            pending.append({
                **wa,
                "product": product
            })
    
    return {"pending_reviews": pending}

@router.post("/{review_id}/helpful")
async def mark_helpful(review_id: str, user: dict = Depends(get_current_user)):
    """Mark a review as helpful"""
    # Check if already marked
    existing = await db.review_helpful.find_one({
        "review_id": review_id,
        "user_id": user["id"]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du hast diese Bewertung bereits als hilfreich markiert")
    
    await db.review_helpful.insert_one({
        "id": str(uuid.uuid4()),
        "review_id": review_id,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.reviews.update_one(
        {"id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    
    return {"message": "Als hilfreich markiert"}

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/pending")
async def get_pending_reviews_admin(admin: dict = Depends(get_current_admin)):
    """Get reviews pending approval"""
    reviews = await db.reviews.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"reviews": reviews, "count": len(reviews)}

@router.post("/admin/{review_id}/approve")
async def approve_review(
    review_id: str,
    featured: bool = False,
    admin: dict = Depends(get_current_admin)
):
    """Approve a review"""
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {
            "status": "approved",
            "featured": featured,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": admin["id"]
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bewertung nicht gefunden")
    
    # Award bonus bids to reviewer
    review = await db.reviews.find_one({"id": review_id})
    if review:
        await db.users.update_one(
            {"id": review["user_id"]},
            {"$inc": {"bids_balance": 2}}  # Additional 2 bids for approved review
        )
        
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": review["user_id"],
            "type": "review_approved",
            "title": "⭐ Bewertung freigegeben!",
            "message": "Deine Bewertung wurde veröffentlicht! Du erhältst 5 Bonus-Gebote.",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    logger.info(f"Review {review_id} approved by {admin.get('name')}")
    
    return {"message": "Bewertung freigegeben"}

@router.post("/admin/{review_id}/reject")
async def reject_review(
    review_id: str,
    reason: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Reject a review"""
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {
            "status": "rejected",
            "rejection_reason": reason,
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejected_by": admin["id"]
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bewertung nicht gefunden")
    
    return {"message": "Bewertung abgelehnt"}

@router.post("/admin/{review_id}/feature")
async def toggle_featured(review_id: str, admin: dict = Depends(get_current_admin)):
    """Toggle featured status of a review"""
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Bewertung nicht gefunden")
    
    new_status = not review.get("featured", False)
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"featured": new_status}}
    )
    
    return {"message": f"Featured {'aktiviert' if new_status else 'deaktiviert'}"}
