"""Countdown Email Notifications - Alert users when favorite auctions are ending"""
from fastapi import APIRouter, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
import asyncio

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/countdown-emails", tags=["Countdown Emails"])

# Email templates (for Resend integration)
EMAIL_TEMPLATES = {
    "auction_ending_1h": {
        "subject": "⏰ {product_name} endet in 1 Stunde!",
        "body": """
Hallo {user_name}!

Deine Wunsch-Auktion endet bald:

🎯 {product_name}
💰 Aktueller Preis: €{current_price}
⏰ Endet in: ~1 Stunde

Verpasse nicht deine Chance!

👉 Jetzt bieten: {auction_url}

Viel Erfolg! 🍀
Dein BidBlitz Team
        """
    },
    "auction_ending_30m": {
        "subject": "🔥 Nur noch 30 Minuten: {product_name}!",
        "body": """
ACHTUNG {user_name}!

Deine Auktion endet in 30 Minuten:

🎯 {product_name}
💰 Aktueller Preis: €{current_price}
⏰ Endet in: ~30 Minuten

Letzte Chance! Biete jetzt!

👉 {auction_url}

BidBlitz Team
        """
    },
    "outbid_alert": {
        "subject": "😱 Du wurdest überboten bei {product_name}!",
        "body": """
Oh nein {user_name}!

Du wurdest gerade überboten:

🎯 {product_name}
💰 Neuer Preis: €{current_price}
🥊 Neuer Höchstbieter: {last_bidder}

Hole dir den Sieg zurück!

👉 Jetzt bieten: {auction_url}

BidBlitz Team
        """
    }
}

async def send_countdown_email(user_email: str, template_key: str, params: dict):
    """Send countdown email via Resend API"""
    try:
        from routers.email import send_email  # Use existing email router
        
        template = EMAIL_TEMPLATES.get(template_key)
        if not template:
            logger.error(f"Unknown email template: {template_key}")
            return False
        
        subject = template["subject"].format(**params)
        body = template["body"].format(**params)
        
        await send_email(
            to_email=user_email,
            subject=subject,
            body=body
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send countdown email: {e}")
        return False

# ==================== SUBSCRIPTION ENDPOINTS ====================

@router.post("/subscribe/{auction_id}")
async def subscribe_to_countdown(
    auction_id: str,
    notify_1h: bool = True,
    notify_30m: bool = True,
    notify_outbid: bool = True,
    user: dict = Depends(get_current_user)
):
    """Subscribe to countdown notifications for an auction"""
    auction = await db.auctions.find_one({"id": auction_id, "status": "active"}, {"_id": 0})
    if not auction:
        return {"success": False, "error": "Auktion nicht gefunden"}
    
    subscription = {
        "user_id": user["id"],
        "user_email": user.get("email"),
        "user_name": user.get("name", "Nutzer"),
        "auction_id": auction_id,
        "notify_1h": notify_1h,
        "notify_30m": notify_30m,
        "notify_outbid": notify_outbid,
        "notified_1h": False,
        "notified_30m": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.countdown_subscriptions.update_one(
        {"user_id": user["id"], "auction_id": auction_id},
        {"$set": subscription},
        upsert=True
    )
    
    return {"success": True, "message": "Benachrichtigung aktiviert"}

@router.delete("/unsubscribe/{auction_id}")
async def unsubscribe_from_countdown(auction_id: str, user: dict = Depends(get_current_user)):
    """Unsubscribe from countdown notifications"""
    await db.countdown_subscriptions.delete_one({
        "user_id": user["id"],
        "auction_id": auction_id
    })
    return {"success": True, "message": "Benachrichtigung deaktiviert"}

@router.get("/my-subscriptions")
async def get_my_subscriptions(user: dict = Depends(get_current_user)):
    """Get user's countdown subscriptions"""
    subs = await db.countdown_subscriptions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(50)
    
    # Enrich with auction info
    result = []
    for sub in subs:
        auction = await db.auctions.find_one(
            {"id": sub["auction_id"]},
            {"_id": 0, "product_id": 1, "current_price": 1, "end_time": 1, "status": 1}
        )
        if auction and auction.get("status") == "active":
            product = await db.products.find_one(
                {"id": auction.get("product_id")},
                {"_id": 0, "name": 1, "image_url": 1}
            )
            result.append({
                **sub,
                "product_name": product.get("name") if product else "Produkt",
                "product_image": product.get("image_url") if product else None,
                "current_price": auction.get("current_price"),
                "end_time": auction.get("end_time")
            })
    
    return {"subscriptions": result}

# ==================== BACKGROUND TASK ====================

async def check_and_send_countdown_emails():
    """Background task to check subscriptions and send emails"""
    now = datetime.now(timezone.utc)
    
    # Get all active subscriptions
    subs = await db.countdown_subscriptions.find({}).to_list(1000)
    
    for sub in subs:
        auction_id = sub.get("auction_id")
        auction = await db.auctions.find_one({"id": auction_id, "status": "active"}, {"_id": 0})
        
        if not auction:
            continue
        
        try:
            end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
            time_left = (end_time - now).total_seconds()
            
            # Get product info
            product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0, "name": 1})
            product_name = product.get("name", "Produkt") if product else "Produkt"
            
            base_url = "https://bidblitz.de"  # Replace with actual URL
            
            params = {
                "user_name": sub.get("user_name", "Nutzer"),
                "product_name": product_name,
                "current_price": f"{auction.get('current_price', 0):.2f}",
                "auction_url": f"{base_url}/auctions/{auction_id}",
                "last_bidder": auction.get("last_bidder_name", "Jemand")
            }
            
            # Check 1 hour notification
            if sub.get("notify_1h") and not sub.get("notified_1h") and 3000 < time_left <= 3600:
                if await send_countdown_email(sub.get("user_email"), "auction_ending_1h", params):
                    await db.countdown_subscriptions.update_one(
                        {"_id": sub["_id"]},
                        {"$set": {"notified_1h": True}}
                    )
                    logger.info(f"Sent 1h countdown email for auction {auction_id}")
            
            # Check 30 minute notification
            if sub.get("notify_30m") and not sub.get("notified_30m") and 1500 < time_left <= 1800:
                if await send_countdown_email(sub.get("user_email"), "auction_ending_30m", params):
                    await db.countdown_subscriptions.update_one(
                        {"_id": sub["_id"]},
                        {"$set": {"notified_30m": True}}
                    )
                    logger.info(f"Sent 30m countdown email for auction {auction_id}")
        
        except Exception as e:
            logger.error(f"Error processing countdown for auction {auction_id}: {e}")

# Function to start background task
async def start_countdown_checker():
    """Start the countdown email checker as a background task"""
    while True:
        try:
            await check_and_send_countdown_emails()
        except Exception as e:
            logger.error(f"Countdown checker error: {e}")
        await asyncio.sleep(60)  # Check every minute
