"""VIP Subscription Plans Router - Monthly/Yearly subscription options"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/vip-plans", tags=["VIP Plans"])

# VIP Plans Configuration
VIP_PLANS = [
    {
        "id": "vip_monthly",
        "name": "VIP Monatlich",
        "name_translations": {
            "de": "VIP Monatlich",
            "en": "VIP Monthly",
            "xk": "VIP Mujore"
        },
        "interval": "monthly",
        "price": 9.99,
        "bids_per_month": 50,
        "benefits": [
            "50 Gebote/Monat",
            "10% Rabatt auf alle Gebote-Pakete",
            "Zugang zu VIP-Auktionen",
            "Prioritäts-Support",
            "Exklusive Rabattcodes"
        ],
        "benefits_translations": {
            "en": [
                "50 bids/month",
                "10% discount on all bid packages",
                "Access to VIP auctions",
                "Priority support",
                "Exclusive discount codes"
            ],
            "xk": [
                "50 oferta/muaj",
                "10% zbritje në të gjitha paketat",
                "Qasje në ankandet VIP",
                "Mbështetje prioritare",
                "Kode ekskluzive zbritjesh"
            ]
        },
        "badge": "VIP",
        "badge_color": "#8B5CF6",
        "active": True
    },
    {
        "id": "vip_yearly",
        "name": "VIP Jährlich",
        "name_translations": {
            "de": "VIP Jährlich",
            "en": "VIP Yearly",
            "xk": "VIP Vjetore"
        },
        "interval": "yearly",
        "price": 89.99,
        "monthly_equivalent": 7.50,
        "savings_vs_monthly": 30,
        "bids_per_year": 700,
        "benefits": [
            "700 Gebote/Jahr (58/Monat)",
            "15% Rabatt auf alle Gebote-Pakete",
            "Zugang zu VIP-Auktionen",
            "Prioritäts-Support",
            "Exklusive Rabattcodes",
            "2 Monate GRATIS",
            "Frühzeitiger Zugang zu neuen Features"
        ],
        "benefits_translations": {
            "en": [
                "700 bids/year (58/month)",
                "15% discount on all bid packages",
                "Access to VIP auctions",
                "Priority support",
                "Exclusive discount codes",
                "2 months FREE",
                "Early access to new features"
            ],
            "xk": [
                "700 oferta/vit (58/muaj)",
                "15% zbritje në të gjitha paketat",
                "Qasje në ankandet VIP",
                "Mbështetje prioritare",
                "Kode ekskluzive zbritjesh",
                "2 muaj FALAS",
                "Qasje e hershme në veçori të reja"
            ]
        },
        "badge": "⭐ VIP GOLD",
        "badge_color": "#F59E0B",
        "highlighted": True,
        "active": True
    },
    {
        "id": "vip_premium",
        "name": "VIP Premium",
        "name_translations": {
            "de": "VIP Premium",
            "en": "VIP Premium",
            "xk": "VIP Premium"
        },
        "interval": "yearly",
        "price": 199.99,
        "monthly_equivalent": 16.67,
        "bids_per_year": 2000,
        "benefits": [
            "2000 Gebote/Jahr (167/Monat)",
            "20% Rabatt auf alle Gebote-Pakete",
            "Exklusive Premium-Auktionen",
            "Persönlicher Account Manager",
            "24/7 VIP-Support",
            "Kostenloser Versand",
            "Geburtstags-Bonus: 100 Gebote",
            "Beta-Zugang zu allen Features"
        ],
        "badge": "👑 PREMIUM",
        "badge_color": "#EC4899",
        "active": True
    }
]

# ==================== SCHEMAS ====================

class SubscriptionCreate(BaseModel):
    plan_id: str
    payment_method: Optional[str] = "stripe"

# ==================== PUBLIC ENDPOINTS ====================

@router.get("/available")
async def get_available_plans(language: str = "de"):
    """Get all available VIP subscription plans"""
    plans = []
    
    for plan in VIP_PLANS:
        if not plan.get("active"):
            continue
        
        plan_data = {
            "id": plan["id"],
            "name": plan.get("name_translations", {}).get(language, plan["name"]),
            "interval": plan["interval"],
            "price": plan["price"],
            "benefits": plan.get("benefits_translations", {}).get(language, plan.get("benefits", [])),
            "badge": plan.get("badge"),
            "badge_color": plan.get("badge_color"),
            "highlighted": plan.get("highlighted", False)
        }
        
        if plan.get("monthly_equivalent"):
            plan_data["monthly_equivalent"] = plan["monthly_equivalent"]
        if plan.get("savings_vs_monthly"):
            plan_data["savings_vs_monthly"] = plan["savings_vs_monthly"]
        if plan.get("bids_per_month"):
            plan_data["bids_included"] = plan["bids_per_month"]
        if plan.get("bids_per_year"):
            plan_data["bids_included"] = plan["bids_per_year"]
        
        plans.append(plan_data)
    
    return {"plans": plans}

@router.get("/my-subscription")
async def get_my_subscription(user: dict = Depends(get_current_user)):
    """Get current user's VIP subscription status"""
    subscription = await db.vip_subscriptions.find_one(
        {"user_id": user["id"], "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        return {
            "has_subscription": False,
            "is_vip": False
        }
    
    # Get plan details
    plan = next((p for p in VIP_PLANS if p["id"] == subscription.get("plan_id")), None)
    
    # Calculate remaining days
    expires_at = subscription.get("expires_at")
    if expires_at:
        expires_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        days_left = (expires_date - datetime.now(timezone.utc)).days
    else:
        days_left = None
    
    return {
        "has_subscription": True,
        "is_vip": True,
        "subscription": subscription,
        "plan": plan,
        "days_remaining": max(0, days_left) if days_left else None,
        "bids_received_this_period": subscription.get("bids_received", 0),
        "discount_rate": plan.get("discount_rate", 0.10) if plan else 0.10
    }

@router.post("/subscribe")
async def subscribe_to_plan(data: SubscriptionCreate, user: dict = Depends(get_current_user)):
    """Subscribe to a VIP plan"""
    # Find the plan
    plan = next((p for p in VIP_PLANS if p["id"] == data.plan_id and p.get("active")), None)
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan nicht gefunden")
    
    # Check for existing subscription
    existing = await db.vip_subscriptions.find_one({
        "user_id": user["id"],
        "status": "active"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du hast bereits ein aktives Abonnement")
    
    # Calculate subscription dates
    now = datetime.now(timezone.utc)
    if plan["interval"] == "monthly":
        expires_at = now + timedelta(days=30)
        bids_to_add = plan.get("bids_per_month", 50)
    else:  # yearly
        expires_at = now + timedelta(days=365)
        bids_to_add = plan.get("bids_per_year", 700)
    
    # Create subscription record
    subscription_id = str(uuid.uuid4())
    subscription = {
        "id": subscription_id,
        "user_id": user["id"],
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "interval": plan["interval"],
        "price": plan["price"],
        "status": "pending",  # Will be activated after payment
        "bids_included": bids_to_add,
        "bids_received": 0,
        "discount_rate": 0.10 if plan["interval"] == "monthly" else 0.15,
        "started_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "created_at": now.isoformat()
    }
    
    await db.vip_subscriptions.insert_one(subscription)
    
    # Note: In production, this would create Stripe subscription
    return {
        "subscription_id": subscription_id,
        "plan": plan,
        "bids_to_receive": bids_to_add,
        "expires_at": expires_at.isoformat(),
        "checkout_url": f"/checkout/subscription/{subscription_id}"
    }

@router.post("/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """Cancel VIP subscription"""
    result = await db.vip_subscriptions.update_one(
        {"user_id": user["id"], "status": "active"},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancel_at_period_end": True
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Kein aktives Abonnement gefunden")
    
    return {
        "success": True,
        "message": "Abonnement wird zum Ende der Laufzeit gekündigt"
    }

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/subscribers")
async def get_all_subscribers(
    status: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Get all VIP subscribers"""
    query = {}
    if status:
        query["status"] = status
    
    subscriptions = await db.vip_subscriptions.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    return {"subscriptions": subscriptions, "count": len(subscriptions)}

@router.get("/admin/stats")
async def get_subscription_stats(admin: dict = Depends(get_admin_user)):
    """Get VIP subscription statistics"""
    active = await db.vip_subscriptions.count_documents({"status": "active"})
    cancelled = await db.vip_subscriptions.count_documents({"status": "cancelled"})
    
    # Revenue
    pipeline = [
        {"$match": {"status": {"$in": ["active", "completed"]}}},
        {"$group": {
            "_id": "$plan_id",
            "count": {"$sum": 1},
            "revenue": {"$sum": "$price"}
        }}
    ]
    revenue_by_plan = await db.vip_subscriptions.aggregate(pipeline).to_list(10)
    
    total_revenue = sum(r["revenue"] for r in revenue_by_plan)
    
    # MRR (Monthly Recurring Revenue)
    monthly_active = await db.vip_subscriptions.count_documents({
        "status": "active",
        "interval": "monthly"
    })
    yearly_active = await db.vip_subscriptions.count_documents({
        "status": "active",
        "interval": "yearly"
    })
    
    mrr = (monthly_active * 9.99) + (yearly_active * 89.99 / 12)
    
    return {
        "subscribers": {
            "active": active,
            "cancelled": cancelled,
            "total": active + cancelled
        },
        "revenue": {
            "total": round(total_revenue, 2),
            "mrr": round(mrr, 2),
            "by_plan": revenue_by_plan
        },
        "churn_rate": round((cancelled / (active + cancelled)) * 100, 1) if (active + cancelled) > 0 else 0
    }


vip_plans_router = router
