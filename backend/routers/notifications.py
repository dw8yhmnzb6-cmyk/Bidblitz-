"""Notifications router - Push notifications and in-app notifications"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import uuid
import json
import os
import httpx

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# VAPID Configuration
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY_FILE = os.environ.get("VAPID_PRIVATE_KEY_FILE", "/app/backend/vapid_private.pem")
VAPID_CLAIMS_EMAIL = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:support@bidblitz.ae")

# ==================== VAPID PUBLIC KEY ====================

@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Get VAPID public key for push subscription"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"publicKey": VAPID_PUBLIC_KEY}

# ==================== PUSH SUBSCRIPTIONS ====================

@router.post("/subscribe")
async def subscribe_push(
    subscription: dict,
    user: dict = Depends(get_current_user)
):
    """Subscribe to push notifications"""
    if not subscription.get("endpoint"):
        raise HTTPException(status_code=400, detail="Invalid subscription")
    
    # Store subscription
    sub_id = str(uuid.uuid4())
    await db.push_subscriptions.update_one(
        {"user_id": user["id"], "endpoint": subscription["endpoint"]},
        {
            "$set": {
                "id": sub_id,
                "user_id": user["id"],
                "subscription": subscription,
                "endpoint": subscription["endpoint"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "active": True
            }
        },
        upsert=True
    )
    
    logger.info(f"Push subscription added for user {user['id']}")
    return {"message": "Erfolgreich für Push-Benachrichtigungen angemeldet", "id": sub_id}


@router.delete("/unsubscribe")
async def unsubscribe_push(
    endpoint: str,
    user: dict = Depends(get_current_user)
):
    """Unsubscribe from push notifications"""
    result = await db.push_subscriptions.delete_one({
        "user_id": user["id"],
        "endpoint": endpoint
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Push-Benachrichtigungen deaktiviert"}


@router.get("/subscription-status")
async def get_subscription_status(user: dict = Depends(get_current_user)):
    """Check if user has active push subscription"""
    count = await db.push_subscriptions.count_documents({
        "user_id": user["id"],
        "active": True
    })
    
    return {
        "subscribed": count > 0,
        "subscription_count": count
    }


# ==================== IN-APP NOTIFICATIONS ====================

@router.get("")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    query = {"user_id": user["id"]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    unread_count = await db.notifications.count_documents({
        "user_id": user["id"],
        "read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Benachrichtigung als gelesen markiert"}


@router.put("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    result = await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"{result.modified_count} Benachrichtigungen als gelesen markiert"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    result = await db.notifications.delete_one({
        "id": notification_id,
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Benachrichtigung gelöscht"}


# ==================== NOTIFICATION PREFERENCES ====================

@router.get("/preferences")
async def get_notification_preferences(user: dict = Depends(get_current_user)):
    """Get user's notification preferences"""
    prefs = await db.notification_preferences.find_one(
        {"user_id": user["id"]},
        {"_id": 0}
    )
    
    if not prefs:
        # Default preferences
        prefs = {
            "user_id": user["id"],
            "push_enabled": True,
            "email_enabled": True,
            "auction_ending": True,
            "auction_won": True,
            "outbid": True,
            "daily_deals": True,
            "new_auctions": False,
            "marketing": False,
            "night_auction_start": True
        }
    
    return prefs


@router.put("/preferences")
async def update_notification_preferences(
    preferences: dict,
    user: dict = Depends(get_current_user)
):
    """Update notification preferences"""
    allowed_keys = [
        "push_enabled", "email_enabled", "auction_ending",
        "auction_won", "outbid", "daily_deals", "new_auctions", "marketing",
        "night_auction_start"
    ]
    
    updates = {k: v for k, v in preferences.items() if k in allowed_keys}
    
    await db.notification_preferences.update_one(
        {"user_id": user["id"]},
        {"$set": {**updates, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Einstellungen aktualisiert", "preferences": updates}


# ==================== OUTBID NOTIFICATIONS ====================

@router.get("/outbids")
async def get_outbid_notifications(user: dict = Depends(get_current_user)):
    """Get recent outbid notifications for the user"""
    user_id = user["id"]
    
    # Get outbids from last 5 minutes that haven't been acknowledged
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    
    outbids = await db.outbid_notifications.find({
        "user_id": user_id,
        "created_at": {"$gte": cutoff},
        "acknowledged": {"$ne": True}
    }, {"_id": 0}).sort("created_at", -1).to_list(10)
    
    return {"outbids": outbids}


@router.post("/outbids/{notification_id}/acknowledge")
async def acknowledge_outbid(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark an outbid notification as acknowledged"""
    await db.outbid_notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"acknowledged": True}}
    )
    return {"message": "OK"}


# ==================== ADMIN: SEND NOTIFICATIONS ====================

@router.post("/admin/send")
async def send_notification_to_user(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    link: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Send notification to a specific user (admin only)"""
    notification_id = str(uuid.uuid4())
    
    notification = {
        "id": notification_id,
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,  # info, success, warning, auction, reward
        "link": link,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification)
    
    return {"message": "Benachrichtigung gesendet", "id": notification_id}


@router.post("/admin/broadcast")
async def broadcast_notification(
    title: str,
    message: str,
    notification_type: str = "info",
    target_group: str = "all",
    link: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Broadcast notification to all users (admin only)"""
    # Build query
    query = {"is_admin": {"$ne": True}, "is_bot": {"$ne": True}}
    
    if target_group == "active":
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        query["last_login"] = {"$gte": week_ago}
    elif target_group == "paying":
        query["total_deposits"] = {"$gt": 0}
    
    users = await db.users.find(query, {"_id": 0, "id": 1}).to_list(10000)
    
    if not users:
        return {"sent": 0, "message": "Keine Benutzer in der Zielgruppe"}
    
    # Create notifications
    now = datetime.now(timezone.utc).isoformat()
    notifications = []
    for user in users:
        notifications.append({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": title,
            "message": message,
            "type": notification_type,
            "link": link,
            "read": False,
            "created_at": now
        })
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    # Send push notifications to subscribed users
    push_sent = await send_push_to_users([u["id"] for u in users], title, message, link)
    
    return {
        "sent": len(notifications), 
        "push_sent": push_sent,
        "message": f"Benachrichtigung an {len(notifications)} Benutzer gesendet ({push_sent} Push)"
    }


# ==================== PUSH NOTIFICATION SENDING ====================

async def send_push_notification(subscription: dict, title: str, body: str, data: dict = None):
    """Send a push notification to a single subscription"""
    try:
        from py_vapid import Vapid
        import base64
        import time
        import jwt
        
        if not os.path.exists(VAPID_PRIVATE_KEY_FILE):
            logger.warning("VAPID private key file not found")
            return False
        
        # Load VAPID key
        vapid = Vapid.from_file(VAPID_PRIVATE_KEY_FILE)
        
        # Prepare payload
        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/logo192.png",
            "badge": "/logo192.png",
            "tag": f"bidblitz-{int(time.time())}",
            "data": data or {},
            "actions": [
                {"action": "view", "title": "Ansehen"}
            ],
            "vibrate": [200, 100, 200]
        })
        
        endpoint = subscription.get("endpoint", "")
        if not endpoint:
            return False
        
        # Get VAPID headers
        vapid_headers = vapid.sign({
            "sub": VAPID_CLAIMS_EMAIL,
            "aud": "/".join(endpoint.split("/")[:3]),
            "exp": int(time.time()) + 86400
        })
        
        # Prepare headers
        headers = {
            "Authorization": vapid_headers.get("Authorization", ""),
            "Crypto-Key": vapid_headers.get("Crypto-Key", ""),
            "Content-Type": "application/json",
            "TTL": "86400"
        }
        
        # Send push
        async with httpx.AsyncClient() as client:
            response = await client.post(
                endpoint,
                content=payload.encode(),
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"Push sent successfully to {endpoint[:50]}...")
                return True
            elif response.status_code == 410:
                # Subscription expired, mark as inactive
                await db.push_subscriptions.update_one(
                    {"endpoint": endpoint},
                    {"$set": {"active": False}}
                )
                logger.info(f"Push subscription expired: {endpoint[:50]}...")
                return False
            else:
                logger.warning(f"Push failed: {response.status_code} - {response.text[:100]}")
                return False
                
    except Exception as e:
        logger.error(f"Error sending push: {e}")
        return False


async def send_push_to_user(user_id: str, title: str, body: str, data: dict = None):
    """Send push notification to all subscriptions of a user"""
    subscriptions = await db.push_subscriptions.find({
        "user_id": user_id,
        "active": True
    }, {"_id": 0}).to_list(10)
    
    sent = 0
    for sub in subscriptions:
        if await send_push_notification(sub.get("subscription", {}), title, body, data):
            sent += 1
    
    return sent


async def send_push_to_users(user_ids: list, title: str, body: str, url: str = None):
    """Send push notification to multiple users"""
    subscriptions = await db.push_subscriptions.find({
        "user_id": {"$in": user_ids},
        "active": True
    }, {"_id": 0}).to_list(10000)
    
    sent = 0
    data = {"url": url} if url else {}
    
    for sub in subscriptions:
        if await send_push_notification(sub.get("subscription", {}), title, body, data):
            sent += 1
    
    return sent


@router.post("/test-push")
async def test_push_notification(user: dict = Depends(get_current_user)):
    """Send a test push notification to the current user"""
    sent = await send_push_to_user(
        user["id"],
        "🎉 Test erfolgreich!",
        "Push-Benachrichtigungen funktionieren!",
        {"url": "/notifications"}
    )
    
    if sent > 0:
        return {"message": f"Test-Push an {sent} Gerät(e) gesendet"}
    else:
        raise HTTPException(
            status_code=400, 
            detail="Keine aktive Push-Subscription gefunden. Bitte aktivieren Sie Push-Benachrichtigungen."
        )


# ==================== HELPER: CREATE NOTIFICATION ====================

async def create_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    link: Optional[str] = None
):
    """Helper function to create a notification"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,
        "link": link,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification)
    return notification


# ==================== AUCTION REMINDERS ====================

@router.post("/auction-reminder/{auction_id}")
async def set_auction_reminder(
    auction_id: str,
    minutes_before: int = 5,
    user: dict = Depends(get_current_user)
):
    """Set a reminder for an auction (will notify X minutes before end)"""
    # Check auction exists
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    if auction.get("status") == "ended":
        raise HTTPException(status_code=400, detail="Auktion ist bereits beendet")
    
    # Get product info for notification
    product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
    product_name = product.get("name", "Unbekanntes Produkt") if product else "Unbekanntes Produkt"
    
    # Calculate reminder time
    end_time = datetime.fromisoformat(auction["end_time"].replace('Z', '+00:00'))
    remind_at = end_time - timedelta(minutes=minutes_before)
    
    # Don't set reminder if it's already past
    if remind_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Auktion endet zu bald für Erinnerung")
    
    # Create or update reminder
    reminder_id = str(uuid.uuid4())
    await db.auction_reminders.update_one(
        {"user_id": user["id"], "auction_id": auction_id},
        {
            "$set": {
                "id": reminder_id,
                "user_id": user["id"],
                "auction_id": auction_id,
                "product_name": product_name,
                "remind_at": remind_at.isoformat(),
                "minutes_before": minutes_before,
                "sent": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {
        "message": f"Erinnerung gesetzt - {minutes_before} Min. vor Ende",
        "remind_at": remind_at.isoformat(),
        "product_name": product_name
    }


@router.delete("/auction-reminder/{auction_id}")
async def cancel_auction_reminder(
    auction_id: str,
    user: dict = Depends(get_current_user)
):
    """Cancel an auction reminder"""
    result = await db.auction_reminders.delete_one({
        "user_id": user["id"],
        "auction_id": auction_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Erinnerung nicht gefunden")
    
    return {"message": "Erinnerung gelöscht"}


@router.get("/auction-reminder/{auction_id}")
async def get_auction_reminder(
    auction_id: str,
    user: dict = Depends(get_current_user)
):
    """Check if user has a reminder set for an auction"""
    reminder = await db.auction_reminders.find_one({
        "user_id": user["id"],
        "auction_id": auction_id
    }, {"_id": 0})
    
    return {"has_reminder": reminder is not None, "reminder": reminder}


@router.get("/my-reminders")
async def get_my_reminders(user: dict = Depends(get_current_user)):
    """Get all active reminders for the current user"""
    reminders = await db.auction_reminders.find({
        "user_id": user["id"],
        "sent": False
    }, {"_id": 0}).sort("remind_at", 1).to_list(50)
    
    # Enrich with auction info
    for reminder in reminders:
        auction = await db.auctions.find_one(
            {"id": reminder["auction_id"]}, 
            {"_id": 0, "id": 1, "current_price": 1, "end_time": 1, "status": 1}
        )
        if auction:
            reminder["auction"] = auction
    
    return {"reminders": reminders, "count": len(reminders)}


async def process_auction_reminders():
    """Process due auction reminders and send notifications - called by background task"""
    now = datetime.now(timezone.utc)
    
    # ==================== USER-SET REMINDERS ====================
    # Find all due reminders
    due_reminders = await db.auction_reminders.find({
        "sent": False,
        "remind_at": {"$lte": now.isoformat()}
    }, {"_id": 0}).to_list(100)
    
    for reminder in due_reminders:
        try:
            user_id = reminder["user_id"]
            auction_id = reminder["auction_id"]
            product_name = reminder.get("product_name", "Auktion")
            
            # Check if auction is still active
            auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
            if not auction or auction.get("status") != "active":
                # Mark as sent since auction is no longer active
                await db.auction_reminders.update_one(
                    {"id": reminder["id"]},
                    {"$set": {"sent": True, "skipped": True}}
                )
                continue
            
            # Send push notification
            sent = await send_push_to_user(
                user_id,
                f"⏰ {product_name}",
                f"Auktion endet in wenigen Minuten! Aktueller Preis: €{auction.get('current_price', 0):.2f}",
                {"url": f"/auctions/{auction_id}", "auction_id": auction_id}
            )
            
            # Also create in-app notification
            await create_notification(
                user_id,
                f"⏰ Auktion endet bald: {product_name}",
                f"Die Auktion endet in wenigen Minuten! Aktueller Preis: €{auction.get('current_price', 0):.2f}",
                "auction",
                f"/auctions/{auction_id}"
            )
            
            # Mark reminder as sent
            await db.auction_reminders.update_one(
                {"id": reminder["id"]},
                {"$set": {"sent": True, "sent_at": now.isoformat(), "push_sent": sent > 0}}
            )
            
            logger.info(f"Reminder sent for auction {auction_id} to user {user_id}")
            
        except Exception as e:
            logger.error(f"Error processing reminder: {e}")

    # ==================== AUTO "5 MINUTES LEFT" NOTIFICATIONS ====================
    # Find auctions ending in 4-6 minutes that haven't been notified yet
    five_min_from_now = (now + timedelta(minutes=5)).isoformat()
    four_min_from_now = (now + timedelta(minutes=4)).isoformat()
    
    auctions_ending_soon = await db.auctions.find({
        "status": "active",
        "end_time": {"$gte": four_min_from_now, "$lte": five_min_from_now},
        "five_min_notification_sent": {"$ne": True}
    }, {"_id": 0}).to_list(50)
    
    for auction in auctions_ending_soon:
        try:
            auction_id = auction["id"]
            product_id = auction.get("product_id")
            
            # Get product name
            product = await db.products.find_one({"id": product_id}, {"_id": 0, "name": 1})
            product_name = product.get("name", "Produkt") if product else "Produkt"
            
            # Find users who have bid on this auction or have it in wishlist
            bid_history = auction.get("bid_history", [])
            bidder_ids = set(bid.get("user_id") for bid in bid_history if not bid.get("is_bot"))
            
            # Also get wishlist users
            wishlist_users = await db.users.find(
                {"wishlist": auction_id},
                {"_id": 0, "id": 1}
            ).to_list(1000)
            wishlist_ids = set(u["id"] for u in wishlist_users)
            
            # Combine and remove duplicates
            notify_users = bidder_ids.union(wishlist_ids)
            
            for user_id in notify_users:
                # Check user preferences
                prefs = await db.notification_preferences.find_one({"user_id": user_id}, {"_id": 0})
                if prefs and not prefs.get("auction_ending", True):
                    continue  # User disabled this notification type
                
                # Send push notification
                await send_push_to_user(
                    user_id,
                    f"⏰ Endet in 5 Minuten!",
                    f"{product_name} - Jetzt €{auction.get('current_price', 0):.2f}",
                    {"url": f"/auctions/{auction_id}", "auction_id": auction_id, "type": "auction_ending"}
                )
                
                # Create in-app notification
                await create_notification(
                    user_id,
                    f"⏰ Auktion endet in 5 Minuten",
                    f"{product_name} endet bald! Aktueller Preis: €{auction.get('current_price', 0):.2f}",
                    "auction",
                    f"/auctions/{auction_id}"
                )
            
            # Mark auction as notified
            await db.auctions.update_one(
                {"id": auction_id},
                {"$set": {"five_min_notification_sent": True}}
            )
            
            logger.info(f"5-minute notifications sent for auction {auction_id} to {len(notify_users)} users")
            
        except Exception as e:
            logger.error(f"Error sending 5-min notification: {e}")


# Export helper for use in other modules
__all__ = ['create_notification', 'send_push_to_user', 'process_auction_reminders']
