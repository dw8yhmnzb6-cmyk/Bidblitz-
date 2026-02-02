"""Subscription Router - Bid subscriptions and VIP+ premium tier"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import os
import stripe

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Stripe configuration
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://bidblitz.de")

# ==================== SUBSCRIPTION PLANS ====================

SUBSCRIPTION_PLANS = {
    "starter": {
        "id": "starter",
        "name": "Starter",
        "bids_per_month": 50,
        "price": 19.99,
        "savings_percent": 20,
        "features": ["50 Gebote/Monat", "20% Ersparnis", "E-Mail Support"]
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "bids_per_month": 100,
        "price": 34.99,
        "savings_percent": 30,
        "features": ["100 Gebote/Monat", "30% Ersparnis", "Priority Support", "Keine Werbung"]
    },
    "vip_plus": {
        "id": "vip_plus",
        "name": "VIP+",
        "bids_per_month": 200,
        "price": 59.99,
        "savings_percent": 40,
        "is_premium": True,
        "features": [
            "200 Gebote/Monat",
            "40% Ersparnis",
            "VIP-Status inklusive",
            "3x Glücksrad pro Tag",
            "15% Sofortkauf-Rabatt",
            "Exklusive VIP+ Auktionen",
            "Persönlicher Support",
            "Frühzugang zu Flash-Auktionen"
        ]
    }
}

# ==================== VIP+ BENEFITS ====================

VIP_PLUS_BENEFITS = {
    "wheel_spins_per_day": 3,
    "buy_now_discount_percent": 15,
    "exclusive_auctions": True,
    "early_flash_access_minutes": 5,
    "priority_support": True
}


async def check_vip_plus_status(user_id: str) -> dict:
    """Check if user has active VIP+ subscription"""
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "plan_id": "vip_plus",
        "status": "active"
    })
    
    if not subscription:
        return {"is_vip_plus": False}
    
    # Check if not expired
    current_period_end = subscription.get("current_period_end")
    if current_period_end:
        try:
            end_date = datetime.fromisoformat(current_period_end.replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > end_date:
                return {"is_vip_plus": False, "expired": True}
        except:
            pass
    
    return {
        "is_vip_plus": True,
        "benefits": VIP_PLUS_BENEFITS,
        "current_period_end": current_period_end
    }


# ==================== USER ENDPOINTS ====================

@router.get("/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {"plans": list(SUBSCRIPTION_PLANS.values())}


@router.get("/my-subscription")
async def get_my_subscription(user: dict = Depends(get_current_user)):
    """Get user's current subscription"""
    user_id = user["id"]
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        return {"has_subscription": False, "subscription": None}
    
    plan = SUBSCRIPTION_PLANS.get(subscription.get("plan_id"))
    
    return {
        "has_subscription": True,
        "subscription": subscription,
        "plan": plan,
        "is_vip_plus": subscription.get("plan_id") == "vip_plus"
    }


@router.post("/subscribe/{plan_id}")
async def create_subscription(plan_id: str, user: dict = Depends(get_current_user)):
    """Create a new subscription"""
    if plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Ungültiger Plan")
    
    plan = SUBSCRIPTION_PLANS[plan_id]
    user_id = user["id"]
    
    # Check for existing active subscription
    existing = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du hast bereits ein aktives Abo")
    
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Zahlungsdienst nicht verfügbar")
    
    try:
        # Create Stripe checkout session for subscription
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "unit_amount": int(plan["price"] * 100),
                    "recurring": {"interval": "month"},
                    "product_data": {
                        "name": f"BidBlitz {plan['name']} Abo",
                        "description": f"{plan['bids_per_month']} Gebote/Monat"
                    }
                },
                "quantity": 1
            }],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/subscription?canceled=true",
            metadata={
                "user_id": user_id,
                "plan_id": plan_id
            }
        )
        
        # Create pending subscription record
        await db.subscriptions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "plan_id": plan_id,
            "stripe_session_id": session.id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except Exception as e:
        logger.error(f"Stripe subscription error: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Erstellen des Abos")


@router.post("/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """Cancel user's subscription"""
    user_id = user["id"]
    
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Kein aktives Abo gefunden")
    
    # Cancel in Stripe if applicable
    if subscription.get("stripe_subscription_id") and STRIPE_API_KEY:
        try:
            stripe.Subscription.modify(
                subscription["stripe_subscription_id"],
                cancel_at_period_end=True
            )
        except Exception as e:
            logger.error(f"Stripe cancel error: {e}")
    
    # Update local record
    await db.subscriptions.update_one(
        {"id": subscription["id"]},
        {"$set": {
            "status": "canceling",
            "cancel_at_period_end": True,
            "canceled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Abo wird zum Ende der Periode gekündigt"}


@router.get("/vip-plus/status")
async def get_vip_plus_status(user: dict = Depends(get_current_user)):
    """Get VIP+ status and benefits"""
    return await check_vip_plus_status(user["id"])


# ==================== WEBHOOK HANDLER ====================

@router.post("/webhook/stripe")
async def stripe_webhook(request_body: dict):
    """Handle Stripe webhook events for subscriptions"""
    event_type = request_body.get("type")
    data = request_body.get("data", {}).get("object", {})
    
    if event_type == "checkout.session.completed":
        # Subscription created successfully
        session_id = data.get("id")
        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id")
        plan_id = metadata.get("plan_id")
        
        if user_id and plan_id:
            plan = SUBSCRIPTION_PLANS.get(plan_id)
            
            # Update subscription record
            await db.subscriptions.update_one(
                {"stripe_session_id": session_id},
                {"$set": {
                    "status": "active",
                    "stripe_subscription_id": data.get("subscription"),
                    "current_period_start": datetime.now(timezone.utc).isoformat(),
                    "current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                    "activated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Credit initial bids
            if plan:
                await db.users.update_one(
                    {"id": user_id},
                    {"$inc": {"bids_balance": plan["bids_per_month"]}}
                )
                
                # If VIP+, grant VIP status
                if plan_id == "vip_plus":
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": {
                            "is_vip": True,
                            "is_vip_plus": True,
                            "vip_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                        }}
                    )
            
            # Process referral rewards for subscription purchase
            # VIP+ referrers get 20 bids, regular referrers get 15 bids for subscription referrals
            try:
                from routers.referral import process_referral_reward
                await process_referral_reward(user_id, is_subscription=True)
                logger.info(f"Subscription referral reward processed for {user_id}")
            except Exception as ref_err:
                logger.error(f"Error processing subscription referral: {ref_err}")
            
            logger.info(f"Subscription activated: {user_id} -> {plan_id}")
    
    elif event_type == "invoice.paid":
        # Monthly renewal
        subscription_id = data.get("subscription")
        
        subscription = await db.subscriptions.find_one({
            "stripe_subscription_id": subscription_id,
            "status": "active"
        })
        
        if subscription:
            plan = SUBSCRIPTION_PLANS.get(subscription.get("plan_id"))
            user_id = subscription.get("user_id")
            
            if plan and user_id:
                # Credit monthly bids
                await db.users.update_one(
                    {"id": user_id},
                    {"$inc": {"bids_balance": plan["bids_per_month"]}}
                )
                
                # Update period
                await db.subscriptions.update_one(
                    {"id": subscription["id"]},
                    {"$set": {
                        "current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                        "last_payment_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Extend VIP if VIP+
                if subscription.get("plan_id") == "vip_plus":
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": {
                            "vip_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                        }}
                    )
                
                logger.info(f"Subscription renewed: {user_id}")
    
    elif event_type == "customer.subscription.deleted":
        # Subscription cancelled/ended
        subscription_id = data.get("id")
        
        await db.subscriptions.update_one(
            {"stripe_subscription_id": subscription_id},
            {"$set": {"status": "cancelled", "ended_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"received": True}


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/stats")
async def get_subscription_stats(admin: dict = Depends(get_admin_user)):
    """Get subscription statistics"""
    active = await db.subscriptions.count_documents({"status": "active"})
    
    # By plan
    by_plan = {}
    for plan_id in SUBSCRIPTION_PLANS:
        count = await db.subscriptions.count_documents({
            "plan_id": plan_id,
            "status": "active"
        })
        by_plan[plan_id] = count
    
    # MRR calculation
    mrr = sum(
        SUBSCRIPTION_PLANS[plan_id]["price"] * count 
        for plan_id, count in by_plan.items()
    )
    
    return {
        "active_subscriptions": active,
        "by_plan": by_plan,
        "monthly_recurring_revenue": round(mrr, 2),
        "vip_plus_count": by_plan.get("vip_plus", 0)
    }


# Export for use in other modules
__all__ = ['check_vip_plus_status', 'VIP_PLUS_BENEFITS']
