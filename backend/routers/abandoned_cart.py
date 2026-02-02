"""Abandoned Cart Recovery - Email reminders for unpurchased items"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import os

from config import db, logger
from dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/cart", tags=["Cart"])

# Email configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')

# ==================== CART ENDPOINTS ====================

@router.get("/")
async def get_cart(user: dict = Depends(get_current_user)):
    """Get user's cart items"""
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    
    if not cart:
        return {"items": [], "total": 0}
    
    return {
        "items": cart.get("items", []),
        "total": sum(item.get("price", 0) for item in cart.get("items", [])),
        "created_at": cart.get("created_at"),
        "updated_at": cart.get("updated_at")
    }

@router.post("/add")
async def add_to_cart(
    package_id: str,
    package_name: str,
    bids: int,
    price: float,
    user: dict = Depends(get_current_user)
):
    """Add a bid package to cart"""
    user_id = user["id"]
    now = datetime.now(timezone.utc).isoformat()
    
    item = {
        "id": str(uuid.uuid4()),
        "package_id": package_id,
        "name": package_name,
        "bids": bids,
        "price": price,
        "added_at": now
    }
    
    # Upsert cart
    result = await db.carts.update_one(
        {"user_id": user_id},
        {
            "$push": {"items": item},
            "$set": {"updated_at": now},
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "created_at": now,
                "reminder_sent": False
            }
        },
        upsert=True
    )
    
    return {"message": "Zum Warenkorb hinzugefügt", "item": item}

@router.delete("/remove/{item_id}")
async def remove_from_cart(item_id: str, user: dict = Depends(get_current_user)):
    """Remove an item from cart"""
    result = await db.carts.update_one(
        {"user_id": user["id"]},
        {
            "$pull": {"items": {"id": item_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Aus Warenkorb entfernt"}

@router.delete("/clear")
async def clear_cart(user: dict = Depends(get_current_user)):
    """Clear the entire cart"""
    await db.carts.delete_one({"user_id": user["id"]})
    return {"message": "Warenkorb geleert"}

# ==================== ABANDONED CART RECOVERY ====================

async def check_abandoned_carts():
    """Check for abandoned carts and send reminders"""
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured, skipping abandoned cart emails")
        return
    
    # Find carts older than 1 hour that haven't received a reminder
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    
    abandoned = await db.carts.find({
        "updated_at": {"$lt": one_hour_ago},
        "reminder_sent": False,
        "items": {"$exists": True, "$ne": []}
    }).to_list(100)
    
    for cart in abandoned:
        user = await db.users.find_one({"id": cart["user_id"]}, {"_id": 0, "email": 1, "name": 1})
        if not user or not user.get("email"):
            continue
        
        await send_abandoned_cart_email(user, cart)
        
        # Mark as reminded
        await db.carts.update_one(
            {"id": cart["id"]},
            {"$set": {"reminder_sent": True, "reminder_sent_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    logger.info(f"Processed {len(abandoned)} abandoned carts")

async def send_abandoned_cart_email(user: dict, cart: dict):
    """Send abandoned cart reminder email"""
    import resend
    resend.api_key = RESEND_API_KEY
    
    items = cart.get("items", [])
    total_bids = sum(item.get("bids", 0) for item in items)
    total_price = sum(item.get("price", 0) for item in items)
    
    items_html = "".join([
        f"<tr><td style='padding:10px;border-bottom:1px solid #eee;'>{item['name']}</td>"
        f"<td style='padding:10px;border-bottom:1px solid #eee;text-align:center;'>{item['bids']}</td>"
        f"<td style='padding:10px;border-bottom:1px solid #eee;text-align:right;'>€{item['price']:.2f}</td></tr>"
        for item in items
    ])
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚡ BidBlitz</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Hallo {user.get('name', 'Bieter')}! 👋</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
                Du hast noch Gebote in deinem Warenkorb! Schließe deinen Einkauf ab und verpasse keine Auktion.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin-top: 0;">Dein Warenkorb:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 10px; text-align: left;">Paket</th>
                            <th style="padding: 10px; text-align: center;">Gebote</th>
                            <th style="padding: 10px; text-align: right;">Preis</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; background: #f3f4f6;">
                            <td style="padding: 10px;">Gesamt</td>
                            <td style="padding: 10px; text-align: center;">{total_bids} Gebote</td>
                            <td style="padding: 10px; text-align: right;">€{total_price:.2f}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://bidblitz.de/checkout" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          display: inline-block;">
                    Jetzt Einkauf abschließen →
                </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                💡 Tipp: Mit mehr Geboten erhöhst du deine Gewinnchancen!
            </p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2026 BidBlitz. Alle Rechte vorbehalten.
            </p>
        </div>
    </div>
    """
    
    try:
        resend.Emails.send({
            "from": "BidBlitz <noreply@bidblitz.de>",
            "to": user["email"],
            "subject": "🛒 Du hast noch Gebote im Warenkorb!",
            "html": html_content
        })
        logger.info(f"Abandoned cart email sent to {user['email']}")
    except Exception as e:
        logger.error(f"Failed to send abandoned cart email: {e}")

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/abandoned")
async def get_abandoned_carts(admin: dict = Depends(get_current_admin)):
    """Get list of abandoned carts (admin)"""
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    
    abandoned = await db.carts.find({
        "updated_at": {"$lt": one_hour_ago},
        "items": {"$exists": True, "$ne": []}
    }, {"_id": 0}).to_list(100)
    
    # Enrich with user info
    enriched = []
    for cart in abandoned:
        user = await db.users.find_one({"id": cart["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        enriched.append({
            **cart,
            "user": user,
            "total_value": sum(item.get("price", 0) for item in cart.get("items", []))
        })
    
    return {"carts": enriched, "count": len(enriched)}

@router.post("/admin/send-reminders")
async def trigger_abandoned_cart_reminders(
    background_tasks: BackgroundTasks,
    admin: dict = Depends(get_current_admin)
):
    """Manually trigger abandoned cart reminder emails"""
    background_tasks.add_task(check_abandoned_carts)
    return {"message": "Erinnerungen werden gesendet..."}

__all__ = ['check_abandoned_carts', 'send_abandoned_cart_email']
