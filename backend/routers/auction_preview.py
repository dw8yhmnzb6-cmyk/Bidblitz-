"""Auction Preview - Upcoming auctions with countdown and pre-registration"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/auction-preview", tags=["Auction Preview"])

@router.get("/upcoming")
async def get_upcoming_auctions(limit: int = 10):
    """Get upcoming auctions that haven't started yet"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Find auctions with status 'scheduled' or start_time in future
    auctions = await db.auctions.find({
        "$or": [
            {"status": "scheduled"},
            {"start_time": {"$gt": now}}
        ]
    }, {"_id": 0}).sort("start_time", 1).limit(limit).to_list(limit)
    
    # Also check scheduled_auctions collection
    scheduled = await db.scheduled_auctions.find(
        {"status": {"$in": ["scheduled", "pending"]}},
        {"_id": 0}
    ).sort("start_time", 1).limit(limit).to_list(limit)
    
    result = []
    
    for auction in auctions + scheduled:
        product = await db.products.find_one(
            {"id": auction.get("product_id")},
            {"_id": 0, "name": 1, "image_url": 1, "retail_price": 1, "description": 1}
        )
        
        # Calculate time until start
        start_time = auction.get("start_time")
        if start_time:
            try:
                start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                seconds_until = (start_dt - datetime.now(timezone.utc)).total_seconds()
            except:
                seconds_until = 0
        else:
            seconds_until = 0
        
        if seconds_until > 0:
            # Get pre-registration count
            registrations = await db.auction_preregistrations.count_documents({
                "auction_id": auction.get("id")
            })
            
            result.append({
                "auction_id": auction.get("id"),
                "product_id": auction.get("product_id"),
                "product_name": product.get("name") if product else "Produkt",
                "product_image": product.get("image_url") if product else None,
                "product_description": product.get("description") if product else None,
                "retail_price": product.get("retail_price", 0) if product else 0,
                "start_time": start_time,
                "seconds_until_start": int(seconds_until),
                "starting_price": auction.get("starting_price", 0.01),
                "is_vip_only": auction.get("is_vip_only", False),
                "is_exclusive": auction.get("is_exclusive", False),
                "preregistrations": registrations,
                "expected_interest": "high" if registrations > 10 else "medium" if registrations > 3 else "low"
            })
    
    return {"upcoming_auctions": result}

@router.post("/preregister/{auction_id}")
async def preregister_for_auction(
    auction_id: str,
    notify_email: bool = True,
    notify_push: bool = True,
    notify_telegram: bool = False,
    user: dict = Depends(get_current_user)
):
    """Pre-register for an upcoming auction to get notified when it starts"""
    # Check if auction exists and is scheduled
    auction = await db.auctions.find_one({
        "id": auction_id,
        "$or": [{"status": "scheduled"}, {"start_time": {"$gt": datetime.now(timezone.utc).isoformat()}}]
    })
    
    if not auction:
        auction = await db.scheduled_auctions.find_one({"id": auction_id})
    
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden oder bereits gestartet")
    
    # Check if already registered
    existing = await db.auction_preregistrations.find_one({
        "auction_id": auction_id,
        "user_id": user["id"]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du bist bereits vorregistriert")
    
    registration = {
        "id": str(uuid.uuid4()),
        "auction_id": auction_id,
        "user_id": user["id"],
        "user_email": user.get("email"),
        "user_name": user.get("name"),
        "notify_email": notify_email,
        "notify_push": notify_push,
        "notify_telegram": notify_telegram,
        "registered_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.auction_preregistrations.insert_one(registration)
    
    # Get current count
    count = await db.auction_preregistrations.count_documents({"auction_id": auction_id})
    
    return {
        "success": True,
        "message": "Du wirst benachrichtigt wenn die Auktion startet!",
        "total_preregistrations": count
    }

@router.delete("/preregister/{auction_id}")
async def cancel_preregistration(auction_id: str, user: dict = Depends(get_current_user)):
    """Cancel pre-registration for an auction"""
    result = await db.auction_preregistrations.delete_one({
        "auction_id": auction_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Keine Vorregistrierung gefunden")
    
    return {"success": True, "message": "Vorregistrierung storniert"}

@router.get("/my-preregistrations")
async def get_my_preregistrations(user: dict = Depends(get_current_user)):
    """Get all auctions the user has pre-registered for"""
    registrations = await db.auction_preregistrations.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(50)
    
    result = []
    for reg in registrations:
        auction = await db.auctions.find_one({"id": reg["auction_id"]}, {"_id": 0})
        if not auction:
            auction = await db.scheduled_auctions.find_one({"id": reg["auction_id"]}, {"_id": 0})
        
        if auction:
            product = await db.products.find_one(
                {"id": auction.get("product_id")},
                {"_id": 0, "name": 1, "image_url": 1}
            )
            
            result.append({
                **reg,
                "product_name": product.get("name") if product else "Produkt",
                "product_image": product.get("image_url") if product else None,
                "start_time": auction.get("start_time"),
                "status": auction.get("status")
            })
    
    return {"preregistrations": result}

# Admin endpoints
@router.post("/admin/schedule")
async def schedule_auction(
    product_id: str,
    start_time: str,
    starting_price: float = 0.01,
    duration_minutes: int = 720,
    is_vip_only: bool = False,
    is_exclusive: bool = False,
    admin: dict = Depends(get_admin_user)
):
    """Schedule a new auction for the future"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    auction_id = str(uuid.uuid4())
    
    scheduled = {
        "id": auction_id,
        "product_id": product_id,
        "start_time": start_time,
        "starting_price": starting_price,
        "duration_minutes": duration_minutes,
        "is_vip_only": is_vip_only,
        "is_exclusive": is_exclusive,
        "status": "scheduled",
        "created_by": admin["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.scheduled_auctions.insert_one(scheduled)
    
    del scheduled["_id"]
    return {"success": True, "scheduled_auction": scheduled}

@router.get("/admin/scheduled")
async def get_all_scheduled(admin: dict = Depends(get_admin_user)):
    """Get all scheduled auctions"""
    scheduled = await db.scheduled_auctions.find(
        {},
        {"_id": 0}
    ).sort("start_time", 1).to_list(100)
    
    return {"scheduled_auctions": scheduled}
