"""Web Push Notifications Router"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import os
import json

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/push", tags=["Push Notifications"])

# VAPID Configuration
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY_FILE = os.environ.get("VAPID_PRIVATE_KEY_FILE", "/app/backend/vapid_private.pem")
VAPID_CLAIMS_EMAIL = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:support@bidblitz.ae")

# ==================== SCHEMAS ====================

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # p256dh and auth keys

class PushNotificationCreate(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    url: Optional[str] = None
    user_ids: Optional[list] = None  # None = all users

# ==================== ENDPOINTS ====================

@router.get("/vapid-key")
async def get_vapid_public_key():
    """Get the VAPID public key for push subscription"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=500, detail="Push notifications not configured")
    
    return {"public_key": VAPID_PUBLIC_KEY}


@router.post("/subscribe")
async def subscribe_to_push(subscription: PushSubscription, user: dict = Depends(get_current_user)):
    """Subscribe user to push notifications"""
    user_id = user["id"]
    
    # Check if subscription already exists
    existing = await db.push_subscriptions.find_one({
        "user_id": user_id,
        "endpoint": subscription.endpoint
    })
    
    if existing:
        # Update existing subscription
        await db.push_subscriptions.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "keys": subscription.keys,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": True, "message": "Subscription aktualisiert"}
    
    # Create new subscription
    sub_doc = {
        "user_id": user_id,
        "user_email": user.get("email"),
        "endpoint": subscription.endpoint,
        "keys": subscription.keys,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.push_subscriptions.insert_one(sub_doc)
    
    logger.info(f"📲 Push subscription created for user {user_id}")
    
    return {"success": True, "message": "Push-Benachrichtigungen aktiviert"}


@router.delete("/unsubscribe")
async def unsubscribe_from_push(user: dict = Depends(get_current_user)):
    """Unsubscribe user from push notifications"""
    user_id = user["id"]
    
    result = await db.push_subscriptions.delete_many({"user_id": user_id})
    
    logger.info(f"📲 Push subscriptions removed for user {user_id}: {result.deleted_count}")
    
    return {"success": True, "message": "Push-Benachrichtigungen deaktiviert"}


@router.get("/status")
async def get_push_status(user: dict = Depends(get_current_user)):
    """Check if user has an active push subscription"""
    user_id = user["id"]
    
    subscription = await db.push_subscriptions.find_one(
        {"user_id": user_id, "active": True},
        {"_id": 0, "endpoint": 1, "created_at": 1}
    )
    
    return {
        "subscribed": subscription is not None,
        "subscription_date": subscription.get("created_at") if subscription else None
    }


@router.get("/settings")
async def get_notification_settings(user: dict = Depends(get_current_user)):
    """Get user's notification preferences"""
    settings = await db.notification_settings.find_one(
        {"user_id": user["id"]},
        {"_id": 0}
    )
    
    # Default settings
    default_settings = {
        "auction_ending": True,
        "outbid": True,
        "won": True,
        "new_auctions": True,
        "promotions": True,
        "daily_reward": True
    }
    
    if settings:
        return {**default_settings, **settings}
    
    return default_settings


@router.put("/settings")
async def update_notification_settings(settings: dict, user: dict = Depends(get_current_user)):
    """Update user's notification preferences"""
    user_id = user["id"]
    
    allowed_keys = ["auction_ending", "outbid", "won", "new_auctions", "promotions", "daily_reward"]
    filtered_settings = {k: v for k, v in settings.items() if k in allowed_keys}
    
    await db.notification_settings.update_one(
        {"user_id": user_id},
        {
            "$set": {
                **filtered_settings,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"success": True, "message": "Einstellungen gespeichert"}


# ==================== ADMIN ENDPOINTS ====================

@router.post("/admin/send")
async def send_push_notification(notification: PushNotificationCreate, admin: dict = Depends(get_admin_user)):
    """Send push notification to users (admin only)"""
    try:
        from pywebpush import webpush, WebPushException
        
        # Load private key
        with open(VAPID_PRIVATE_KEY_FILE, 'r') as f:
            vapid_private_key = f.read().strip()
        
        # Get target subscriptions
        query = {"active": True}
        if notification.user_ids:
            query["user_id"] = {"$in": notification.user_ids}
        
        subscriptions = await db.push_subscriptions.find(query).to_list(1000)
        
        if not subscriptions:
            return {"success": False, "message": "Keine Abonnenten gefunden", "sent": 0}
        
        # Prepare notification payload
        payload = json.dumps({
            "title": notification.title,
            "body": notification.body,
            "icon": notification.icon or "/favicon.ico",
            "url": notification.url or "/",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        sent_count = 0
        failed_count = 0
        
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub["endpoint"],
                        "keys": sub["keys"]
                    },
                    data=payload,
                    vapid_private_key=vapid_private_key,
                    vapid_claims={"sub": VAPID_CLAIMS_EMAIL}
                )
                sent_count += 1
            except WebPushException as e:
                failed_count += 1
                # If subscription expired, mark as inactive
                if e.response and e.response.status_code in [404, 410]:
                    await db.push_subscriptions.update_one(
                        {"_id": sub["_id"]},
                        {"$set": {"active": False}}
                    )
            except Exception as e:
                failed_count += 1
                logger.error(f"Push notification failed: {e}")
        
        logger.info(f"📲 Push notifications sent: {sent_count} success, {failed_count} failed")
        
        # Log the notification
        await db.push_notification_log.insert_one({
            "title": notification.title,
            "body": notification.body,
            "sent_by": admin["id"],
            "sent_count": sent_count,
            "failed_count": failed_count,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "message": f"Benachrichtigung gesendet",
            "sent": sent_count,
            "failed": failed_count
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="VAPID private key not found")
    except Exception as e:
        logger.error(f"Push notification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/stats")
async def get_push_stats(admin: dict = Depends(get_admin_user)):
    """Get push notification statistics (admin only)"""
    total_subscriptions = await db.push_subscriptions.count_documents({"active": True})
    
    # Recent notifications
    recent = await db.push_notification_log.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "total_subscribers": total_subscriptions,
        "recent_notifications": recent
    }


# ==================== HELPER FUNCTIONS ====================

async def send_push_to_user(user_id: str, title: str, body: str, url: str = "/", icon: str = None):
    """Helper function to send push notification to a specific user"""
    try:
        from pywebpush import webpush, WebPushException
        
        subscriptions = await db.push_subscriptions.find({
            "user_id": user_id,
            "active": True
        }).to_list(10)
        
        if not subscriptions:
            return False
        
        # Check user's notification settings
        settings = await db.notification_settings.find_one({"user_id": user_id})
        
        with open(VAPID_PRIVATE_KEY_FILE, 'r') as f:
            vapid_private_key = f.read().strip()
        
        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": icon or "/favicon.ico",
            "url": url,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub["endpoint"],
                        "keys": sub["keys"]
                    },
                    data=payload,
                    vapid_private_key=vapid_private_key,
                    vapid_claims={"sub": VAPID_CLAIMS_EMAIL}
                )
            except WebPushException as e:
                if e.response and e.response.status_code in [404, 410]:
                    await db.push_subscriptions.update_one(
                        {"_id": sub["_id"]},
                        {"$set": {"active": False}}
                    )
            except:
                pass
        
        return True
    except:
        return False
