"""Bid Alarm Router - Countdown notifications when auctions are about to end"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/bid-alarm", tags=["Bid Alarm"])

# ==================== SCHEMAS ====================

class BidAlarmCreate(BaseModel):
    auction_id: str
    notify_at_seconds: int = 10  # Notify when X seconds remaining

class BidAlarmUpdate(BaseModel):
    notify_at_seconds: Optional[int] = None
    is_active: Optional[bool] = None

# ==================== ENDPOINTS ====================

@router.get("/my-alarms")
async def get_my_alarms(user: dict = Depends(get_current_user)):
    """Get all active bid alarms for current user"""
    alarms = await db.bid_alarms.find(
        {"user_id": user["id"], "is_active": True},
        {"_id": 0}
    ).to_list(50)
    
    # Enrich with auction data
    enriched = []
    for alarm in alarms:
        auction = await db.auctions.find_one(
            {"id": alarm["auction_id"]},
            {"_id": 0, "product_name": 1, "product_image": 1, "current_price": 1, "end_time": 1, "status": 1}
        )
        if auction and auction.get("status") == "active":
            enriched.append({
                **alarm,
                "auction": auction
            })
    
    return {"alarms": enriched, "count": len(enriched)}

@router.post("/create")
async def create_bid_alarm(data: BidAlarmCreate, user: dict = Depends(get_current_user)):
    """Create a new bid alarm for an auction"""
    user_id = user["id"]
    
    # Check if auction exists and is active
    auction = await db.auctions.find_one({"id": data.auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    if auction.get("status") != "active":
        raise HTTPException(status_code=400, detail="Auktion ist nicht mehr aktiv")
    
    # Check if alarm already exists
    existing = await db.bid_alarms.find_one({
        "user_id": user_id,
        "auction_id": data.auction_id
    })
    
    if existing:
        # Update existing alarm
        await db.bid_alarms.update_one(
            {"id": existing["id"]},
            {"$set": {
                "notify_at_seconds": data.notify_at_seconds,
                "is_active": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"message": "Alarm aktualisiert", "alarm_id": existing["id"]}
    
    # Create new alarm
    alarm_id = str(uuid.uuid4())
    alarm = {
        "id": alarm_id,
        "user_id": user_id,
        "auction_id": data.auction_id,
        "notify_at_seconds": data.notify_at_seconds,
        "is_active": True,
        "notified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bid_alarms.insert_one(alarm)
    logger.info(f"Bid alarm created: {user_id} for auction {data.auction_id}")
    
    return {
        "message": f"Alarm gesetzt! Du wirst benachrichtigt wenn nur noch {data.notify_at_seconds} Sekunden übrig sind.",
        "alarm_id": alarm_id
    }

@router.delete("/{alarm_id}")
async def delete_bid_alarm(alarm_id: str, user: dict = Depends(get_current_user)):
    """Delete a bid alarm"""
    result = await db.bid_alarms.delete_one({
        "id": alarm_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alarm nicht gefunden")
    
    return {"message": "Alarm gelöscht"}

@router.post("/toggle/{auction_id}")
async def toggle_bid_alarm(auction_id: str, user: dict = Depends(get_current_user)):
    """Toggle bid alarm for an auction (quick on/off)"""
    existing = await db.bid_alarms.find_one({
        "user_id": user["id"],
        "auction_id": auction_id
    })
    
    if existing:
        new_status = not existing.get("is_active", True)
        await db.bid_alarms.update_one(
            {"id": existing["id"]},
            {"$set": {"is_active": new_status}}
        )
        return {"is_active": new_status, "message": "Alarm aktiviert" if new_status else "Alarm deaktiviert"}
    
    # Create new alarm with default settings
    alarm_id = str(uuid.uuid4())
    await db.bid_alarms.insert_one({
        "id": alarm_id,
        "user_id": user["id"],
        "auction_id": auction_id,
        "notify_at_seconds": 10,
        "is_active": True,
        "notified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"is_active": True, "alarm_id": alarm_id, "message": "Alarm aktiviert"}

@router.get("/check-triggers")
async def check_alarm_triggers():
    """Internal endpoint to check which alarms should trigger (called by background job)"""
    now = datetime.now(timezone.utc)
    
    # Get all active auctions
    active_auctions = await db.auctions.find(
        {"status": "active"},
        {"_id": 0, "id": 1, "end_time": 1}
    ).to_list(100)
    
    triggered = []
    for auction in active_auctions:
        end_time = datetime.fromisoformat(auction["end_time"].replace('Z', '+00:00'))
        seconds_remaining = (end_time - now).total_seconds()
        
        if seconds_remaining <= 0:
            continue
        
        # Find alarms that should trigger
        alarms = await db.bid_alarms.find({
            "auction_id": auction["id"],
            "is_active": True,
            "notified": False,
            "notify_at_seconds": {"$gte": seconds_remaining}
        }).to_list(100)
        
        for alarm in alarms:
            triggered.append({
                "alarm_id": alarm["id"],
                "user_id": alarm["user_id"],
                "auction_id": auction["id"],
                "seconds_remaining": int(seconds_remaining)
            })
            
            # Mark as notified
            await db.bid_alarms.update_one(
                {"id": alarm["id"]},
                {"$set": {"notified": True, "notified_at": now.isoformat()}}
            )
    
    return {"triggered_alarms": triggered, "count": len(triggered)}


bid_alarm_router = router
