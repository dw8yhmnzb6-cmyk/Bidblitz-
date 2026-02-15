"""Subscription Router - Monthly bid subscription plans"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid
import stripe
import os

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/subscription", tags=["Subscription"])

stripe.api_key = os.environ.get("STRIPE_API_KEY")

# ==================== SUBSCRIPTION PLANS ====================

SUBSCRIPTION_PLANS = {
    "basic": {
        "id": "basic",
        "name": "Basic",
        "name_de": "Basis",
        "price": 19.99,
        "bids_per_month": 50,
        "bonus_bids": 5,
        "vip_access": False,
        "priority_support": False,
        "exclusive_auctions": False,
        "stripe_price_id": os.environ.get("STRIPE_PRICE_BASIC", ""),
        "features_de": ["50 Gebote pro Monat", "5 Bonus-Gebote", "Monatlich kündbar"],
        "features_en": ["50 bids per month", "5 bonus bids", "Cancel anytime"]
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "name_de": "Pro",
        "price": 39.99,
        "bids_per_month": 120,
        "bonus_bids": 20,
        "vip_access": True,
        "priority_support": True,
        "exclusive_auctions": False,
        "stripe_price_id": os.environ.get("STRIPE_PRICE_PRO", ""),
        "features_de": ["120 Gebote pro Monat", "20 Bonus-Gebote", "VIP-Zugang", "Prioritäts-Support"],
        "features_en": ["120 bids per month", "20 bonus bids", "VIP access", "Priority support"],
        "popular": True
    },
    "elite": {
        "id": "elite",
        "name": "Elite",
        "name_de": "Elite",
        "price": 79.99,
        "bids_per_month": 300,
        "bonus_bids": 50,
        "vip_access": True,
        "priority_support": True,
        "exclusive_auctions": True,
        "stripe_price_id": os.environ.get("STRIPE_PRICE_ELITE", ""),
        "features_de": ["300 Gebote pro Monat", "50 Bonus-Gebote", "VIP-Zugang", "Exklusive Auktionen", "24/7 Support"],
        "features_en": ["300 bids per month", "50 bonus bids", "VIP access", "Exclusive auctions", "24/7 support"]
    }
}

# ==================== SCHEMAS ====================

class SubscriptionRequest(BaseModel):
    plan_id: str

# ==================== ENDPOINTS ====================

@router.get("/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    plans = []
    for plan_id, plan in SUBSCRIPTION_PLANS.items():
        plans.append({
            **plan,
            "total_bids": plan["bids_per_month"] + plan["bonus_bids"]
        })
    return {"plans": plans}

@router.get("/my-subscription")
async def get_my_subscription(user: dict = Depends(get_current_user)):
    """Get user's current subscription"""
    subscription = await db.user_subscriptions.find_one(
        {"user_id": user["id"], "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        return {"has_subscription": False, "subscription": None}
    
    # Calculate days until renewal
    next_renewal = datetime.fromisoformat(subscription.get("next_renewal", datetime.now(timezone.utc).isoformat()).replace('Z', '+00:00'))
    days_until_renewal = (next_renewal - datetime.now(timezone.utc)).days
    
    return {
        "has_subscription": True,
        "subscription": {
            **subscription,
            "days_until_renewal": max(0, days_until_renewal),
            "plan_details": SUBSCRIPTION_PLANS.get(subscription.get("plan_id"), {})
        }
    }

@router.post("/subscribe")
async def create_subscription(data: SubscriptionRequest, user: dict = Depends(get_current_user)):
    """Subscribe to a plan"""
    user_id = user["id"]
    
    # Validate plan
    plan = SUBSCRIPTION_PLANS.get(data.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Ungültiger Plan")
    
    # Check if already subscribed
    existing = await db.user_subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du hast bereits ein aktives Abo. Bitte kündige zuerst.")
    
    # Get user data
    user_data = await db.users.find_one({"id": user_id})
    
    try:
        # Create Stripe checkout session for subscription
        # Note: In production, you would use Stripe Price IDs
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f"bidblitz.ae {plan['name']} Abo",
                        'description': f"{plan['bids_per_month'] + plan['bonus_bids']} Gebote pro Monat",
                    },
                    'unit_amount': int(plan['price'] * 100),
                    'recurring': {
                        'interval': 'month',
                        'interval_count': 1
                    }
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{os.environ.get('FRONTEND_URL', 'https://bidblitz.ae')}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.environ.get('FRONTEND_URL', 'https://bidblitz.ae')}/subscription",
            customer_email=user_data.get("email") if user_data else None,
            metadata={
                'user_id': user_id,
                'plan_id': data.plan_id,
                'type': 'subscription'
            }
        )
        
        # Store pending subscription
        pending_sub = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "plan_id": data.plan_id,
            "stripe_session_id": session.id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.pending_subscriptions.insert_one(pending_sub)
        
        return {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except Exception as e:
        logger.error(f"Subscription Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Zahlungsfehler: {str(e)}")

@router.post("/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """Cancel active subscription"""
    user_id = user["id"]
    
    subscription = await db.user_subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Kein aktives Abo gefunden")
    
    # Cancel in Stripe if we have subscription ID
    stripe_sub_id = subscription.get("stripe_subscription_id")
    if stripe_sub_id:
        try:
            stripe.Subscription.modify(
                stripe_sub_id,
                cancel_at_period_end=True
            )
        except Exception as e:
            logger.error(f"Stripe cancel error: {e}")
    
    # Update local status
    await db.user_subscriptions.update_one(
        {"id": subscription["id"]},
        {"$set": {
            "status": "canceling",
            "canceled_at": datetime.now(timezone.utc).isoformat(),
            "cancel_at_period_end": True
        }}
    )
    
    logger.info(f"Subscription canceled: {user_id}")
    
    return {
        "success": True,
        "message": "Abo wird zum Ende der Laufzeit gekündigt",
        "active_until": subscription.get("next_renewal")
    }

@router.post("/reactivate")
async def reactivate_subscription(user: dict = Depends(get_current_user)):
    """Reactivate a canceled subscription"""
    user_id = user["id"]
    
    subscription = await db.user_subscriptions.find_one({
        "user_id": user_id,
        "status": "canceling"
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Kein zu reaktivierendes Abo gefunden")
    
    # Reactivate in Stripe
    stripe_sub_id = subscription.get("stripe_subscription_id")
    if stripe_sub_id:
        try:
            stripe.Subscription.modify(
                stripe_sub_id,
                cancel_at_period_end=False
            )
        except Exception as e:
            logger.error(f"Stripe reactivate error: {e}")
    
    # Update local status
    await db.user_subscriptions.update_one(
        {"id": subscription["id"]},
        {"$set": {
            "status": "active",
            "canceled_at": None,
            "cancel_at_period_end": False
        }}
    )
    
    return {"success": True, "message": "Abo reaktiviert!"}

# ==================== WEBHOOK HANDLER (called from main webhook) ====================

async def handle_subscription_payment(session_id: str, subscription_id: str = None):
    """Handle successful subscription payment"""
    pending = await db.pending_subscriptions.find_one({"stripe_session_id": session_id})
    
    if not pending:
        logger.warning(f"No pending subscription found for session {session_id}")
        return False
    
    plan = SUBSCRIPTION_PLANS.get(pending["plan_id"])
    if not plan:
        return False
    
    user_id = pending["user_id"]
    now = datetime.now(timezone.utc)
    
    # Create active subscription
    subscription = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "plan_id": pending["plan_id"],
        "plan_name": plan["name"],
        "stripe_subscription_id": subscription_id,
        "status": "active",
        "current_period_start": now.isoformat(),
        "next_renewal": (now + timedelta(days=30)).isoformat(),
        "bids_remaining": plan["bids_per_month"] + plan["bonus_bids"],
        "bids_this_period": plan["bids_per_month"] + plan["bonus_bids"],
        "created_at": now.isoformat()
    }
    
    await db.user_subscriptions.insert_one(subscription)
    
    # Add bids to user account
    total_bids = plan["bids_per_month"] + plan["bonus_bids"]
    await db.users.update_one(
        {"id": user_id},
        {
            "$inc": {"bids": total_bids},
            "$set": {
                "is_subscriber": True,
                "subscription_plan": pending["plan_id"],
                "vip_access": plan.get("vip_access", False)
            }
        }
    )
    
    # Delete pending
    await db.pending_subscriptions.delete_one({"id": pending["id"]})
    
    logger.info(f"Subscription activated: {user_id} - {plan['name']} - {total_bids} bids")
    
    return True

async def process_subscription_renewal(subscription_id: str):
    """Process monthly subscription renewal - add bids"""
    subscription = await db.user_subscriptions.find_one({
        "stripe_subscription_id": subscription_id,
        "status": "active"
    })
    
    if not subscription:
        return False
    
    plan = SUBSCRIPTION_PLANS.get(subscription["plan_id"])
    if not plan:
        return False
    
    # Add bids
    total_bids = plan["bids_per_month"] + plan["bonus_bids"]
    
    await db.users.update_one(
        {"id": subscription["user_id"]},
        {"$inc": {"bids": total_bids}}
    )
    
    # Update subscription
    now = datetime.now(timezone.utc)
    await db.user_subscriptions.update_one(
        {"id": subscription["id"]},
        {"$set": {
            "current_period_start": now.isoformat(),
            "next_renewal": (now + timedelta(days=30)).isoformat(),
            "bids_this_period": total_bids
        }}
    )
    
    logger.info(f"Subscription renewed: {subscription['user_id']} - {total_bids} bids added")
    
    return True


subscription_router = router
