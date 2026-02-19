"""
Referral Program & Deposit Notifications
- Referral system ("Refer a friend, both get €10")
- Email notifications for deposit maturity
- Partner commission dashboard data
- Time-limited bonus promotions
"""

from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import uuid
import os
from config import db
from utils.auth import get_current_user

router = APIRouter(prefix="/referral", tags=["Referral & Notifications"])

# ==================== MODELS ====================

class ReferralCreate(BaseModel):
    """Create referral code for user"""
    referrer_id: str = Field(..., description="User who refers")

class ReferralUse(BaseModel):
    """Use a referral code"""
    referral_code: str = Field(..., description="Referral code to use")

class BonusPromotion(BaseModel):
    """Time-limited bonus promotion"""
    name: str = Field(..., description="Promotion name")
    bonus_percentage: int = Field(..., ge=10, le=100, description="Extra bonus %")
    valid_hours: int = Field(24, ge=1, le=168, description="Hours valid")
    min_deposit: float = Field(10, ge=5, description="Minimum deposit")
    target_users: str = Field("all", description="'all', 'new', 'inactive'")


# ==================== REFERRAL SYSTEM ====================

REFERRAL_REWARD = 10.0  # €10 for both referrer and referee

@router.get("/my-code")
async def get_my_referral_code(user: dict = Depends(get_current_user)):
    """Get user's unique referral code"""
    user_id = user.get("id")
    
    # Check if user already has a referral code
    existing = await db.referral_codes.find_one({"user_id": user_id}, {"_id": 0})
    
    if existing:
        return existing
    
    # Generate new referral code
    customer_number = user.get("customer_number", "")
    code = f"REF-{customer_number[-6:]}" if customer_number else f"REF-{str(uuid.uuid4())[:8].upper()}"
    
    referral_doc = {
        "id": f"ref-{str(uuid.uuid4())[:8]}",
        "user_id": user_id,
        "code": code,
        "uses": 0,
        "total_earned": 0,
        "referrals": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.referral_codes.insert_one(referral_doc)
    
    return {
        "code": code,
        "reward": REFERRAL_REWARD,
        "uses": 0,
        "total_earned": 0,
        "share_text": {
            "de": f"Melde dich bei BidBlitz an mit meinem Code {code} und wir beide erhalten €{REFERRAL_REWARD} Bonus!",
            "en": f"Sign up at BidBlitz with my code {code} and we both get €{REFERRAL_REWARD} bonus!",
            "sq": f"Regjistrohu në BidBlitz me kodin tim {code} dhe të dy marrim €{REFERRAL_REWARD} bonus!",
            "tr": f"BidBlitz'e {code} koduyla kaydol ve ikimiz de €{REFERRAL_REWARD} bonus kazanalım!"
        }
    }


@router.post("/use")
async def use_referral_code(
    data: ReferralUse,
    user: dict = Depends(get_current_user)
):
    """Use a referral code (new users only)"""
    user_id = user.get("id")
    
    # Check if user already used a referral
    existing_use = await db.referral_uses.find_one({"referee_id": user_id})
    if existing_use:
        raise HTTPException(status_code=400, detail="Du hast bereits einen Empfehlungscode verwendet")
    
    # Check if user is new (registered within last 7 days)
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "created_at": 1})
    if user_data:
        created = datetime.fromisoformat(user_data.get("created_at", "").replace("Z", "+00:00"))
        days_since_registration = (datetime.now(timezone.utc) - created).days
        if days_since_registration > 7:
            raise HTTPException(status_code=400, detail="Empfehlungscodes nur für neue Nutzer (innerhalb 7 Tage)")
    
    # Find referral code
    referral = await db.referral_codes.find_one({"code": data.referral_code.upper()}, {"_id": 0})
    if not referral:
        raise HTTPException(status_code=404, detail="Ungültiger Empfehlungscode")
    
    # Can't refer yourself
    if referral.get("user_id") == user_id:
        raise HTTPException(status_code=400, detail="Du kannst deinen eigenen Code nicht verwenden")
    
    # Credit both users
    now = datetime.now(timezone.utc).isoformat()
    
    # Credit referee (new user)
    await db.users.update_one(
        {"id": user_id},
        {
            "$inc": {"balance": REFERRAL_REWARD},
            "$set": {"referred_by": referral.get("user_id")}
        }
    )
    
    # Credit referrer
    await db.users.update_one(
        {"id": referral.get("user_id")},
        {"$inc": {"balance": REFERRAL_REWARD}}
    )
    
    # Update referral stats
    await db.referral_codes.update_one(
        {"code": data.referral_code.upper()},
        {
            "$inc": {"uses": 1, "total_earned": REFERRAL_REWARD},
            "$push": {
                "referrals": {
                    "referee_id": user_id,
                    "reward": REFERRAL_REWARD,
                    "date": now
                }
            }
        }
    )
    
    # Record the use
    await db.referral_uses.insert_one({
        "referee_id": user_id,
        "referrer_id": referral.get("user_id"),
        "code": data.referral_code.upper(),
        "reward": REFERRAL_REWARD,
        "date": now
    })
    
    return {
        "success": True,
        "reward": REFERRAL_REWARD,
        "message_de": f"€{REFERRAL_REWARD} Bonus gutgeschrieben! Willkommen bei BidBlitz!",
        "message_en": f"€{REFERRAL_REWARD} bonus credited! Welcome to BidBlitz!"
    }


@router.get("/my-referrals")
async def get_my_referrals(user: dict = Depends(get_current_user)):
    """Get list of users referred by current user"""
    user_id = user.get("id")
    
    referral = await db.referral_codes.find_one({"user_id": user_id}, {"_id": 0})
    
    if not referral:
        return {
            "code": None,
            "referrals": [],
            "total_earned": 0,
            "uses": 0
        }
    
    return {
        "code": referral.get("code"),
        "referrals": referral.get("referrals", []),
        "total_earned": referral.get("total_earned", 0),
        "uses": referral.get("uses", 0)
    }


# ==================== BONUS PROMOTIONS ====================

@router.get("/active-promotions")
async def get_active_promotions(language: str = Query("de")):
    """Get currently active bonus promotions"""
    now = datetime.now(timezone.utc)
    
    promotions = await db.bonus_promotions.find(
        {
            "is_active": True,
            "valid_until": {"$gt": now.isoformat()}
        },
        {"_id": 0}
    ).to_list(10)
    
    # Add default flash promotion if none exist
    if not promotions:
        # Create a sample promotion
        flash_promo = {
            "id": f"promo-flash-{now.strftime('%Y%m%d')}",
            "name_de": "Flash Bonus!",
            "name_en": "Flash Bonus!",
            "name_sq": "Bonus Flash!",
            "name_tr": "Flash Bonus!",
            "description_de": "Nur heute: 25% Extra-Bonus auf alle Einzahlungen!",
            "description_en": "Today only: 25% extra bonus on all deposits!",
            "description_sq": "Vetëm sot: 25% bonus shtesë në të gjitha depozitat!",
            "description_tr": "Sadece bugün: Tüm yatırımlarda %25 ekstra bonus!",
            "bonus_percentage": 25,
            "min_deposit": 20,
            "valid_until": (now + timedelta(hours=24)).isoformat(),
            "is_active": True,
            "badge": "🔥 FLASH",
            "badge_color": "red"
        }
        promotions = [flash_promo]
    
    # Localize
    for promo in promotions:
        promo["name"] = promo.get(f"name_{language}", promo.get("name_de", ""))
        promo["description"] = promo.get(f"description_{language}", promo.get("description_de", ""))
        
        # Calculate time remaining
        valid_until = datetime.fromisoformat(promo.get("valid_until", now.isoformat()).replace("Z", "+00:00"))
        remaining = valid_until - now
        promo["hours_remaining"] = max(0, int(remaining.total_seconds() / 3600))
        promo["minutes_remaining"] = max(0, int((remaining.total_seconds() % 3600) / 60))
    
    return {"promotions": promotions}


@router.post("/admin/promotion")
async def create_promotion(
    promo: BonusPromotion,
    user: dict = Depends(get_current_user)
):
    """Admin: Create a new time-limited bonus promotion"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins")
    
    now = datetime.now(timezone.utc)
    valid_until = now + timedelta(hours=promo.valid_hours)
    
    promo_doc = {
        "id": f"promo-{str(uuid.uuid4())[:8]}",
        "name_de": promo.name,
        "name_en": promo.name,
        "description_de": f"{promo.bonus_percentage}% Extra-Bonus auf Einzahlungen ab €{promo.min_deposit}!",
        "description_en": f"{promo.bonus_percentage}% extra bonus on deposits from €{promo.min_deposit}!",
        "bonus_percentage": promo.bonus_percentage,
        "min_deposit": promo.min_deposit,
        "target_users": promo.target_users,
        "valid_until": valid_until.isoformat(),
        "is_active": True,
        "created_at": now.isoformat(),
        "created_by": user.get("id")
    }
    
    await db.bonus_promotions.insert_one(promo_doc)
    
    return {
        "success": True,
        "promotion_id": promo_doc["id"],
        "valid_until": valid_until.isoformat()
    }


# ==================== DEPOSIT MATURITY NOTIFICATIONS ====================

@router.post("/check-maturing-deposits")
async def check_maturing_deposits(
    admin_key: str = Query(...),
    background_tasks: BackgroundTasks = None
):
    """Check for deposits maturing soon and send notifications (CRON job)"""
    if admin_key != "bidblitz-deposit-cron-2026":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    in_three_days = now + timedelta(days=3)
    
    # Find deposits maturing in next 3 days
    maturing_deposits = await db.customer_deposits.find(
        {
            "status": "active",
            "unlock_date": {
                "$gte": now.isoformat(),
                "$lte": in_three_days.isoformat()
            },
            "maturity_notified": {"$ne": True}
        },
        {"_id": 0}
    ).to_list(1000)
    
    notifications_sent = 0
    
    for deposit in maturing_deposits:
        user_id = deposit.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1, "username": 1, "language": 1})
        
        if user and user.get("email"):
            # Calculate final interest
            created = datetime.fromisoformat(deposit.get("created_at").replace("Z", "+00:00"))
            unlock = datetime.fromisoformat(deposit.get("unlock_date").replace("Z", "+00:00"))
            days_total = (unlock - created).days
            annual_rate = deposit.get("interest_rate", 0) / 100
            final_interest = deposit.get("amount", 0) * annual_rate * (days_total / 365)
            
            days_remaining = (unlock - now).days
            
            # Create notification
            notification = {
                "id": f"notif-{str(uuid.uuid4())[:8]}",
                "user_id": user_id,
                "type": "deposit_maturity",
                "deposit_id": deposit.get("id"),
                "title_de": f"Deine Einlage ist in {days_remaining} Tag{'en' if days_remaining != 1 else ''} fällig!",
                "title_en": f"Your deposit matures in {days_remaining} day{'s' if days_remaining != 1 else ''}!",
                "message_de": f"Deine Einlage von €{deposit.get('amount'):.2f} + €{final_interest:.2f} Zinsen werden in Kürze verfügbar.",
                "message_en": f"Your deposit of €{deposit.get('amount'):.2f} + €{final_interest:.2f} interest will be available soon.",
                "amount": deposit.get("amount"),
                "interest": round(final_interest, 2),
                "unlock_date": deposit.get("unlock_date"),
                "is_read": False,
                "created_at": now.isoformat()
            }
            
            await db.notifications.insert_one(notification)
            
            # Mark deposit as notified
            await db.customer_deposits.update_one(
                {"id": deposit.get("id")},
                {"$set": {"maturity_notified": True}}
            )
            
            notifications_sent += 1
            
            # Send email notification (in production)
            if os.environ.get("RESEND_API_KEY"):
                try:
                    import resend
                    resend.api_key = os.environ.get("RESEND_API_KEY")
                    
                    lang = user.get("language", "de")
                    subject = notification.get(f"title_{lang}", notification.get("title_de"))
                    body = notification.get(f"message_{lang}", notification.get("message_de"))
                    
                    resend.Emails.send({
                        "from": "BidBlitz <noreply@bidblitz.ae>",
                        "to": user.get("email"),
                        "subject": f"💰 {subject}",
                        "html": f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #f59e0b;">💰 {subject}</h2>
                            <p>{body}</p>
                            <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <p><strong>Einzahlung:</strong> €{deposit.get('amount'):.2f}</p>
                                <p><strong>Zinsen:</strong> €{final_interest:.2f}</p>
                                <p><strong>Verfügbar ab:</strong> {unlock.strftime('%d.%m.%Y')}</p>
                            </div>
                            <a href="https://bidblitz.ae/pay" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Zum Wallet</a>
                        </div>
                        """
                    })
                except Exception as e:
                    print(f"Email error: {e}")
    
    # Also check for deposits that have matured but not yet withdrawn
    matured_deposits = await db.customer_deposits.find(
        {
            "status": "active",
            "unlock_date": {"$lt": now.isoformat()},
            "matured_notified": {"$ne": True}
        },
        {"_id": 0}
    ).to_list(1000)
    
    for deposit in matured_deposits:
        user_id = deposit.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1, "username": 1, "language": 1})
        
        if user:
            # Calculate final interest
            created = datetime.fromisoformat(deposit.get("created_at").replace("Z", "+00:00"))
            unlock = datetime.fromisoformat(deposit.get("unlock_date").replace("Z", "+00:00"))
            days_total = (unlock - created).days
            annual_rate = deposit.get("interest_rate", 0) / 100
            final_interest = deposit.get("amount", 0) * annual_rate * (days_total / 365)
            
            notification = {
                "id": f"notif-{str(uuid.uuid4())[:8]}",
                "user_id": user_id,
                "type": "deposit_matured",
                "deposit_id": deposit.get("id"),
                "title_de": "Deine Einlage ist jetzt verfügbar! 🎉",
                "title_en": "Your deposit is now available! 🎉",
                "message_de": f"€{deposit.get('amount'):.2f} + €{final_interest:.2f} Zinsen können jetzt abgehoben werden.",
                "message_en": f"€{deposit.get('amount'):.2f} + €{final_interest:.2f} interest can now be withdrawn.",
                "amount": deposit.get("amount"),
                "interest": round(final_interest, 2),
                "is_read": False,
                "created_at": now.isoformat()
            }
            
            await db.notifications.insert_one(notification)
            
            await db.customer_deposits.update_one(
                {"id": deposit.get("id")},
                {"$set": {"matured_notified": True}}
            )
            
            notifications_sent += 1
    
    return {
        "success": True,
        "notifications_sent": notifications_sent,
        "checked_at": now.isoformat()
    }


# ==================== USER NOTIFICATIONS ====================

@router.get("/notifications")
async def get_my_notifications(
    user: dict = Depends(get_current_user),
    limit: int = Query(20, le=100)
):
    """Get user's notifications"""
    user_id = user.get("id")
    
    notifications = await db.notifications.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    unread_count = await db.notifications.count_documents({
        "user_id": user_id,
        "is_read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    user_id = user.get("id")
    
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Benachrichtigung nicht gefunden")
    
    return {"success": True}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    user_id = user.get("id")
    
    await db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"success": True}
