"""Telegram Bot Router - Auction alerts and notifications via Telegram"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
import uuid
import os
import httpx
from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/telegram", tags=["telegram"])

# Telegram Bot Configuration
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

# ==================== SUBSCRIPTION MANAGEMENT ====================

@router.get("/link-code")
async def get_telegram_link_code(user: dict = Depends(get_current_user)):
    """Generate a unique code for linking Telegram account"""
    user_id = user["id"]
    
    # Check for existing code
    existing = await db.telegram_link_codes.find_one({"user_id": user_id})
    
    if existing:
        # Check if code is still valid (less than 10 minutes old)
        created_at = existing.get("created_at", "")
        if created_at:
            try:
                created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                if (datetime.now(timezone.utc) - created).total_seconds() < 600:
                    return {
                        "code": existing["code"],
                        "expires_in": 600 - int((datetime.now(timezone.utc) - created).total_seconds()),
                        "bot_username": "bidblitz.aeBot"  # Replace with your bot username
                    }
            except:
                pass
    
    # Generate new code
    import random
    import string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    await db.telegram_link_codes.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "code": code,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "used": False
            }
        },
        upsert=True
    )
    
    return {
        "code": code,
        "expires_in": 600,
        "bot_username": "bidblitz.aeBot",
        "instructions": [
            "1. Öffne Telegram und suche nach @bidblitz.aeBot",
            "2. Starte den Bot mit /start",
            f"3. Sende den Code: /link {code}",
            "4. Fertig! Du erhältst nun Auktions-Benachrichtigungen."
        ]
    }


@router.post("/verify-link")
async def verify_telegram_link(code: str, chat_id: int, telegram_username: Optional[str] = None):
    """Called by the bot to verify a link code (internal endpoint)"""
    link_code = await db.telegram_link_codes.find_one({"code": code, "used": False})
    
    if not link_code:
        return {"success": False, "message": "Ungültiger oder abgelaufener Code"}
    
    # Check expiry
    created_at = link_code.get("created_at", "")
    if created_at:
        try:
            created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            if (datetime.now(timezone.utc) - created).total_seconds() > 600:
                return {"success": False, "message": "Code ist abgelaufen. Bitte neuen Code anfordern."}
        except:
            pass
    
    user_id = link_code["user_id"]
    
    # Link the Telegram account
    await db.telegram_accounts.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "chat_id": chat_id,
                "telegram_username": telegram_username,
                "linked_at": datetime.now(timezone.utc).isoformat(),
                "active": True,
                "preferences": {
                    "auction_ending": True,
                    "outbid": True,
                    "won": True,
                    "deals": True
                }
            }
        },
        upsert=True
    )
    
    # Mark code as used
    await db.telegram_link_codes.update_one(
        {"code": code},
        {"$set": {"used": True}}
    )
    
    # Get user name
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
    
    logger.info(f"📱 Telegram linked: User {user_id} -> Chat {chat_id}")
    
    return {
        "success": True,
        "message": f"✅ Erfolgreich verknüpft! Hallo {user.get('name', 'Bieter')}!",
        "user_name": user.get("name", "")
    }


@router.get("/status")
async def get_telegram_status(user: dict = Depends(get_current_user)):
    """Check if user has linked Telegram account"""
    telegram_account = await db.telegram_accounts.find_one(
        {"user_id": user["id"]},
        {"_id": 0}
    )
    
    if not telegram_account:
        return {"linked": False, "preferences": None}
    
    return {
        "linked": telegram_account.get("active", False),
        "telegram_username": telegram_account.get("telegram_username"),
        "linked_at": telegram_account.get("linked_at"),
        "preferences": telegram_account.get("preferences", {})
    }


@router.put("/preferences")
async def update_telegram_preferences(
    auction_ending: Optional[bool] = None,
    outbid: Optional[bool] = None,
    won: Optional[bool] = None,
    deals: Optional[bool] = None,
    user: dict = Depends(get_current_user)
):
    """Update notification preferences"""
    telegram_account = await db.telegram_accounts.find_one({"user_id": user["id"]})
    
    if not telegram_account:
        raise HTTPException(status_code=404, detail="Telegram nicht verknüpft")
    
    preferences = telegram_account.get("preferences", {})
    
    if auction_ending is not None:
        preferences["auction_ending"] = auction_ending
    if outbid is not None:
        preferences["outbid"] = outbid
    if won is not None:
        preferences["won"] = won
    if deals is not None:
        preferences["deals"] = deals
    
    await db.telegram_accounts.update_one(
        {"user_id": user["id"]},
        {"$set": {"preferences": preferences}}
    )
    
    return {"message": "Einstellungen aktualisiert", "preferences": preferences}


@router.delete("/unlink")
async def unlink_telegram(user: dict = Depends(get_current_user)):
    """Unlink Telegram account"""
    result = await db.telegram_accounts.update_one(
        {"user_id": user["id"]},
        {"$set": {"active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Telegram nicht verknüpft")
    
    return {"message": "Telegram-Konto getrennt"}


# ==================== SENDING MESSAGES ====================

async def send_telegram_message(chat_id: int, text: str, parse_mode: str = "HTML") -> bool:
    """Send a message to a Telegram chat"""
    if not TELEGRAM_TOKEN:
        logger.warning("Telegram token not configured")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TELEGRAM_API_URL}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": parse_mode,
                    "disable_web_page_preview": True
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                logger.info(f"📱 Telegram message sent to {chat_id}")
                return True
            else:
                logger.error(f"Telegram send failed: {response.status_code} - {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")
        return False


async def send_auction_alert(user_id: str, alert_type: str, auction_data: dict):
    """Send auction alert to user via Telegram"""
    telegram_account = await db.telegram_accounts.find_one({
        "user_id": user_id,
        "active": True
    })
    
    if not telegram_account:
        return False
    
    # Check preferences
    preferences = telegram_account.get("preferences", {})
    if not preferences.get(alert_type, True):
        return False
    
    chat_id = telegram_account.get("chat_id")
    if not chat_id:
        return False
    
    # Build message based on alert type
    product_name = auction_data.get("product_name", "Produkt")
    current_price = auction_data.get("current_price", 0)
    auction_url = auction_data.get("url", "")
    
    if alert_type == "auction_ending":
        message = f"""
⏰ <b>Auktion endet bald!</b>

🏷️ {product_name}
💰 Aktueller Preis: <b>€{current_price:.2f}</b>
⏱️ Endet in wenigen Minuten!

<a href="{auction_url}">👉 Jetzt bieten!</a>
"""
    
    elif alert_type == "outbid":
        new_bidder = auction_data.get("new_bidder", "Jemand")
        message = f"""
⚡ <b>Überboten!</b>

🏷️ {product_name}
💰 Neuer Preis: <b>€{current_price:.2f}</b>
👤 Von: {new_bidder}

<a href="{auction_url}">👉 Jetzt zurückbieten!</a>
"""
    
    elif alert_type == "won":
        final_price = auction_data.get("final_price", current_price)
        retail_price = auction_data.get("retail_price", 0)
        savings = retail_price - final_price
        message = f"""
🏆 <b>GEWONNEN!</b>

🎉 Herzlichen Glückwunsch!

🏷️ {product_name}
💰 Gewinnpreis: <b>€{final_price:.2f}</b>
💵 Ersparnis: <b>€{savings:.2f}</b>

<a href="{auction_url}">👉 Zur Zahlung</a>
"""
    
    elif alert_type == "deals":
        retail_price = auction_data.get("retail_price", 0)
        message = f"""
🔥 <b>Neuer Deal!</b>

🏷️ {product_name}
💵 Wert: <b>€{retail_price:.2f}</b>
💰 Startpreis: <b>€0.01</b>

<a href="{auction_url}">👉 Jetzt bieten!</a>
"""
    
    else:
        return False
    
    return await send_telegram_message(chat_id, message)


# ==================== ADMIN ENDPOINTS ====================

@router.post("/admin/broadcast")
async def broadcast_telegram(
    message: str,
    target: str = "all",
    admin: dict = Depends(get_admin_user)
):
    """Broadcast a message to all linked Telegram users (Admin only)"""
    query = {"active": True}
    
    if target == "vip":
        # Get VIP user IDs
        vip_users = await db.vip_subscriptions.find(
            {"status": "active"},
            {"_id": 0, "user_id": 1}
        ).to_list(10000)
        vip_ids = [u["user_id"] for u in vip_users]
        query["user_id"] = {"$in": vip_ids}
    
    telegram_accounts = await db.telegram_accounts.find(
        query,
        {"_id": 0, "chat_id": 1}
    ).to_list(10000)
    
    sent_count = 0
    for account in telegram_accounts:
        chat_id = account.get("chat_id")
        if chat_id and await send_telegram_message(chat_id, message):
            sent_count += 1
    
    logger.info(f"📢 Telegram broadcast sent to {sent_count} users")
    
    return {
        "message": f"Nachricht an {sent_count} Nutzer gesendet",
        "sent": sent_count,
        "total": len(telegram_accounts)
    }


@router.get("/admin/stats")
async def get_telegram_stats(admin: dict = Depends(get_admin_user)):
    """Get Telegram integration statistics (Admin only)"""
    total_linked = await db.telegram_accounts.count_documents({"active": True})
    total_inactive = await db.telegram_accounts.count_documents({"active": False})
    
    # Preference stats
    prefs = await db.telegram_accounts.find(
        {"active": True},
        {"_id": 0, "preferences": 1}
    ).to_list(10000)
    
    pref_counts = {
        "auction_ending": sum(1 for p in prefs if p.get("preferences", {}).get("auction_ending", True)),
        "outbid": sum(1 for p in prefs if p.get("preferences", {}).get("outbid", True)),
        "won": sum(1 for p in prefs if p.get("preferences", {}).get("won", True)),
        "deals": sum(1 for p in prefs if p.get("preferences", {}).get("deals", True))
    }
    
    return {
        "total_linked": total_linked,
        "total_inactive": total_inactive,
        "preference_stats": pref_counts
    }


# Export helper for use in other modules
__all__ = ['send_auction_alert', 'send_telegram_message']
