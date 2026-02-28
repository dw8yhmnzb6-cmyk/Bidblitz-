"""
Bill Payment System - Pay utility bills (Strom, Wasser, Internet, Telefon)
With platform commission on every payment
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from decimal import Decimal
import uuid, random

from dependencies import get_current_user, get_admin_user
from config import db

router = APIRouter(prefix="/bills", tags=["Bill Payments"])

# Bill providers (expandable via admin)
PROVIDERS = {
    "strom": [
        {"id": "dewa-strom", "name": "DEWA Strom", "country": "UAE", "icon": "zap", "color": "#F59E0B"},
        {"id": "fewa-strom", "name": "FEWA Strom", "country": "UAE", "icon": "zap", "color": "#EAB308"},
        {"id": "keds-strom", "name": "KEDS Kosovo", "country": "Kosovo", "icon": "zap", "color": "#F97316"},
        {"id": "eon-strom", "name": "E.ON Strom", "country": "Deutschland", "icon": "zap", "color": "#DC2626"},
        {"id": "vattenfall", "name": "Vattenfall", "country": "Deutschland", "icon": "zap", "color": "#2563EB"},
    ],
    "wasser": [
        {"id": "dewa-wasser", "name": "DEWA Wasser", "country": "UAE", "icon": "droplets", "color": "#0EA5E9"},
        {"id": "kur-wasser", "name": "KUR Wasser", "country": "Kosovo", "icon": "droplets", "color": "#06B6D4"},
        {"id": "berliner-wasser", "name": "Berliner Wasserbetriebe", "country": "Deutschland", "icon": "droplets", "color": "#0284C7"},
    ],
    "internet": [
        {"id": "du-internet", "name": "du Internet", "country": "UAE", "icon": "wifi", "color": "#10B981"},
        {"id": "etisalat-internet", "name": "Etisalat Internet", "country": "UAE", "icon": "wifi", "color": "#059669"},
        {"id": "ipko-internet", "name": "IPKO Internet", "country": "Kosovo", "icon": "wifi", "color": "#EF4444"},
        {"id": "telekom-internet", "name": "Telekom Internet", "country": "Deutschland", "icon": "wifi", "color": "#EC4899"},
        {"id": "vodafone-internet", "name": "Vodafone Internet", "country": "Deutschland", "icon": "wifi", "color": "#DC2626"},
    ],
    "telefon": [
        {"id": "du-telefon", "name": "du Telefon", "country": "UAE", "icon": "phone", "color": "#10B981"},
        {"id": "etisalat-telefon", "name": "Etisalat Telefon", "country": "UAE", "icon": "phone", "color": "#059669"},
        {"id": "vala-telefon", "name": "Vala Telefon", "country": "Kosovo", "icon": "phone", "color": "#3B82F6"},
        {"id": "ipko-telefon", "name": "IPKO Telefon", "country": "Kosovo", "icon": "phone", "color": "#EF4444"},
    ],
    "tv": [
        {"id": "artmotion", "name": "Artmotion TV", "country": "Kosovo", "icon": "tv", "color": "#8B5CF6"},
        {"id": "kujtesa", "name": "Kujtesa TV", "country": "Kosovo", "icon": "tv", "color": "#6366F1"},
        {"id": "sky-tv", "name": "Sky TV", "country": "Deutschland", "icon": "tv", "color": "#1E40AF"},
    ],
}

BILL_COMMISSION_PERCENT = 2.0  # Platform takes 2% per bill payment


class BillLookup(BaseModel):
    provider_id: str
    customer_number: str

class BillPayment(BaseModel):
    provider_id: str
    customer_number: str
    amount_cents: int
    payment_method: str = "wallet"  # wallet, card


@router.get("/providers")
async def get_bill_providers():
    """Get all bill payment providers grouped by category"""
    return {"providers": PROVIDERS, "categories": list(PROVIDERS.keys())}


@router.get("/providers/{category}")
async def get_category_providers(category: str):
    """Get providers for a specific category"""
    if category not in PROVIDERS:
        raise HTTPException(404, "Kategorie nicht gefunden")
    return {"category": category, "providers": PROVIDERS[category]}


@router.post("/lookup")
async def lookup_bill(data: BillLookup, user: dict = Depends(get_current_user)):
    """Look up a bill by provider and customer number"""
    # Find provider
    provider = None
    category = None
    for cat, providers in PROVIDERS.items():
        for p in providers:
            if p["id"] == data.provider_id:
                provider = p
                category = cat
                break

    if not provider:
        raise HTTPException(404, "Anbieter nicht gefunden")

    # Simulate bill lookup (in production: call provider API)
    amount_cents = random.randint(2000, 25000)  # 20-250 EUR
    due_date = "2026-03-15"

    bill = {
        "provider": provider,
        "category": category,
        "customer_number": data.customer_number,
        "amount_cents": amount_cents,
        "amount_eur": round(amount_cents / 100, 2),
        "due_date": due_date,
        "status": "unpaid",
        "details": f"{provider['name']} - Rechnung für Kundennr. {data.customer_number}"
    }

    return {"bill": bill}


@router.post("/pay")
async def pay_bill(data: BillPayment, user: dict = Depends(get_current_user)):
    """Pay a bill - deducts from wallet, platform gets commission"""
    # Find provider
    provider = None
    for cat, providers in PROVIDERS.items():
        for p in providers:
            if p["id"] == data.provider_id:
                provider = p
                break

    if not provider:
        raise HTTPException(404, "Anbieter nicht gefunden")

    # Calculate commission
    commission_cents = int(data.amount_cents * BILL_COMMISSION_PERCENT / 100)
    total_cents = data.amount_cents

    now = datetime.now(timezone.utc).isoformat()
    payment_id = str(uuid.uuid4())
    ref = f"bill-{payment_id[:8]}"

    if data.payment_method == "wallet":
        # Check wallet balance
        balance = user.get("wallet_balance_cents", 0)
        if balance < total_cents:
            raise HTTPException(402, f"Nicht genug Guthaben. Benötigt: {total_cents/100:.2f} EUR")

        # Deduct from wallet
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"wallet_balance_cents": -total_cents}}
        )

        # Ledger entry for user
        await db.wallet_ledger.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"], "type": "debit",
            "amount_cents": total_cents, "category": "bill_payment",
            "description": f"Rechnung: {provider['name']} - {data.customer_number}",
            "reference_id": ref, "created_at": now
        })

    # Platform commission
    platform = await db.users.find_one({"email": "platform@bidblitz.ae"})
    if platform:
        await db.users.update_one(
            {"id": platform["id"]},
            {"$inc": {"wallet_balance_cents": commission_cents}}
        )
        await db.wallet_ledger.insert_one({
            "id": str(uuid.uuid4()), "user_id": platform["id"], "type": "credit",
            "amount_cents": commission_cents, "category": "commission",
            "description": f"Bill Commission {BILL_COMMISSION_PERCENT}% - {provider['name']}",
            "reference_id": ref, "created_at": now
        })

    # Save payment record
    payment = {
        "id": payment_id, "user_id": user["id"], "user_name": user.get("name"),
        "provider_id": data.provider_id, "provider_name": provider["name"],
        "customer_number": data.customer_number,
        "amount_cents": data.amount_cents, "commission_cents": commission_cents,
        "payment_method": data.payment_method, "status": "completed",
        "reference": ref, "created_at": now
    }
    await db.bill_payments.insert_one(payment)

    payment.pop("_id", None)
    return {
        "success": True,
        "payment": payment,
        "message": f"Rechnung bezahlt! {data.amount_cents/100:.2f} EUR an {provider['name']}"
    }


@router.get("/history")
async def get_bill_history(user: dict = Depends(get_current_user)):
    """Get user's bill payment history"""
    payments = await db.bill_payments.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"payments": payments}


@router.get("/admin/stats")
async def get_bill_stats(admin: dict = Depends(get_admin_user)):
    """Admin: Get bill payment statistics"""
    pipeline = [
        {"$group": {
            "_id": None,
            "total_amount": {"$sum": "$amount_cents"},
            "total_commission": {"$sum": "$commission_cents"},
            "count": {"$sum": 1}
        }}
    ]
    result = await db.bill_payments.aggregate(pipeline).to_list(1)
    s = result[0] if result else {}
    return {
        "total_payments": s.get("count", 0),
        "total_amount_cents": s.get("total_amount", 0),
        "total_commission_cents": s.get("total_commission", 0),
        "commission_rate": BILL_COMMISSION_PERCENT
    }
