"""
Watchlist System - Auktionen beobachten und Benachrichtigungen erhalten
Features: Watchlist, Push-Benachrichtigungen, Auktions-Alerts
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


# ==================== SCHEMAS ====================

class WatchlistAdd(BaseModel):
    auction_id: str
    notify_before_end: Optional[int] = 5  # Minutes before end
    notify_on_outbid: Optional[bool] = True
    notify_on_price_drop: Optional[bool] = False


class NotificationSettings(BaseModel):
    email_enabled: Optional[bool] = True
    push_enabled: Optional[bool] = True
    sms_enabled: Optional[bool] = False
    notify_minutes_before: Optional[int] = 5


# ==================== WATCHLIST ENDPOINTS ====================

@router.post("/add")
async def add_to_watchlist(data: WatchlistAdd, user: dict = Depends(get_current_user)):
    """Füge eine Auktion zur Watchlist hinzu"""
    user_id = user["id"]
    
    # Check if auction exists
    auction = await db.auctions.find_one({"id": data.auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    # Check if already in watchlist
    existing = await db.watchlist.find_one({
        "user_id": user_id,
        "auction_id": data.auction_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Auktion ist bereits auf der Watchlist")
    
    watchlist_item = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "auction_id": data.auction_id,
        "notify_before_end": data.notify_before_end or 5,
        "notify_on_outbid": data.notify_on_outbid if data.notify_on_outbid is not None else True,
        "notify_on_price_drop": data.notify_on_price_drop or False,
        "added_at": datetime.now(timezone.utc).isoformat(),
        "notified_ending": False,
        "price_at_add": auction.get("current_price", 0)
    }
    
    await db.watchlist.insert_one(watchlist_item)
    
    # Update watchlist count on auction
    await db.auctions.update_one(
        {"id": data.auction_id},
        {"$inc": {"watchlist_count": 1}}
    )
    
    logger.info(f"User {user_id} added auction {data.auction_id} to watchlist")
    
    return {
        "success": True,
        "message": "Zur Watchlist hinzugefügt",
        "watchlist_item": {
            "id": watchlist_item["id"],
            "auction_id": data.auction_id,
            "auction_title": auction.get("title"),
            "notify_before_end": watchlist_item["notify_before_end"]
        }
    }


@router.delete("/remove/{auction_id}")
async def remove_from_watchlist(auction_id: str, user: dict = Depends(get_current_user)):
    """Entferne eine Auktion von der Watchlist"""
    result = await db.watchlist.delete_one({
        "user_id": user["id"],
        "auction_id": auction_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nicht auf der Watchlist")
    
    # Update watchlist count on auction
    await db.auctions.update_one(
        {"id": auction_id},
        {"$inc": {"watchlist_count": -1}}
    )
    
    return {
        "success": True,
        "message": "Von Watchlist entfernt"
    }


@router.get("/my-watchlist")
async def get_my_watchlist(
    status: Optional[str] = None,  # active, ended, all
    user: dict = Depends(get_current_user)
):
    """Hole meine komplette Watchlist"""
    user_id = user["id"]
    
    watchlist = await db.watchlist.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("added_at", -1).to_list(100)
    
    result = []
    for item in watchlist:
        auction = await db.auctions.find_one(
            {"id": item["auction_id"]},
            {"_id": 0}
        )
        
        if not auction:
            continue
        
        # Filter by status if requested
        auction_status = auction.get("status", "unknown")
        if status and status != "all":
            if status == "active" and auction_status != "active":
                continue
            if status == "ended" and auction_status == "active":
                continue
        
        # Calculate time remaining
        end_time = auction.get("end_time")
        time_remaining = None
        ending_soon = False
        
        if end_time:
            try:
                end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                if end_dt > now:
                    delta = end_dt - now
                    time_remaining = int(delta.total_seconds())
                    ending_soon = delta.total_seconds() < item.get("notify_before_end", 5) * 60
            except:
                pass
        
        result.append({
            "id": item["id"],
            "auction_id": item["auction_id"],
            "added_at": item["added_at"],
            "notify_before_end": item.get("notify_before_end", 5),
            "notify_on_outbid": item.get("notify_on_outbid", True),
            "price_at_add": item.get("price_at_add", 0),
            "auction": {
                "title": auction.get("title"),
                "current_price": auction.get("current_price", 0),
                "status": auction_status,
                "image_url": auction.get("image_url"),
                "end_time": end_time,
                "time_remaining": time_remaining,
                "ending_soon": ending_soon,
                "bid_count": auction.get("bid_count", 0),
                "retail_price": auction.get("retail_price", 0)
            }
        })
    
    # Sort by ending soon first
    result.sort(key=lambda x: (
        not x["auction"]["ending_soon"],
        x["auction"]["time_remaining"] or float('inf')
    ))
    
    return {
        "watchlist": result,
        "total": len(result),
        "ending_soon": len([x for x in result if x["auction"]["ending_soon"]])
    }


@router.get("/check/{auction_id}")
async def check_watchlist_status(auction_id: str, user: dict = Depends(get_current_user)):
    """Prüfe ob eine Auktion auf der Watchlist ist"""
    item = await db.watchlist.find_one({
        "user_id": user["id"],
        "auction_id": auction_id
    })
    
    return {
        "on_watchlist": item is not None,
        "watchlist_item": {
            "id": item["id"],
            "notify_before_end": item.get("notify_before_end", 5),
            "notify_on_outbid": item.get("notify_on_outbid", True)
        } if item else None
    }


@router.put("/settings/{auction_id}")
async def update_watchlist_settings(
    auction_id: str,
    settings: NotificationSettings,
    user: dict = Depends(get_current_user)
):
    """Aktualisiere Benachrichtigungseinstellungen für einen Watchlist-Eintrag"""
    result = await db.watchlist.update_one(
        {
            "user_id": user["id"],
            "auction_id": auction_id
        },
        {
            "$set": {
                "notify_before_end": settings.notify_minutes_before,
                "email_enabled": settings.email_enabled,
                "push_enabled": settings.push_enabled,
                "sms_enabled": settings.sms_enabled,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Watchlist-Eintrag nicht gefunden")
    
    return {
        "success": True,
        "message": "Einstellungen aktualisiert"
    }


# ==================== NOTIFICATION ENDPOINTS ====================

@router.get("/notifications")
async def get_watchlist_notifications(
    unread_only: bool = False,
    user: dict = Depends(get_current_user)
):
    """Hole Watchlist-Benachrichtigungen"""
    query = {"user_id": user["id"], "type": {"$regex": "^watchlist_"}}
    
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {
        "notifications": notifications,
        "unread_count": len([n for n in notifications if not n.get("read", True)])
    }


@router.post("/mark-read/{notification_id}")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Markiere eine Benachrichtigung als gelesen"""
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}


# ==================== BULK OPERATIONS ====================

@router.post("/add-bulk")
async def add_bulk_to_watchlist(
    auction_ids: List[str],
    user: dict = Depends(get_current_user)
):
    """Füge mehrere Auktionen zur Watchlist hinzu"""
    added = 0
    skipped = 0
    
    for auction_id in auction_ids[:20]:  # Max 20 at once
        auction = await db.auctions.find_one({"id": auction_id})
        if not auction:
            skipped += 1
            continue
        
        existing = await db.watchlist.find_one({
            "user_id": user["id"],
            "auction_id": auction_id
        })
        
        if existing:
            skipped += 1
            continue
        
        await db.watchlist.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "auction_id": auction_id,
            "notify_before_end": 5,
            "notify_on_outbid": True,
            "added_at": datetime.now(timezone.utc).isoformat(),
            "price_at_add": auction.get("current_price", 0)
        })
        
        await db.auctions.update_one(
            {"id": auction_id},
            {"$inc": {"watchlist_count": 1}}
        )
        
        added += 1
    
    return {
        "success": True,
        "added": added,
        "skipped": skipped,
        "message": f"{added} Auktionen zur Watchlist hinzugefügt"
    }


@router.delete("/clear")
async def clear_watchlist(user: dict = Depends(get_current_user)):
    """Lösche die komplette Watchlist"""
    watchlist = await db.watchlist.find(
        {"user_id": user["id"]},
        {"auction_id": 1}
    ).to_list(100)
    
    # Update auction counts
    for item in watchlist:
        await db.auctions.update_one(
            {"id": item["auction_id"]},
            {"$inc": {"watchlist_count": -1}}
        )
    
    result = await db.watchlist.delete_many({"user_id": user["id"]})
    
    return {
        "success": True,
        "deleted": result.deleted_count,
        "message": f"{result.deleted_count} Einträge gelöscht"
    }


watchlist_router = router
