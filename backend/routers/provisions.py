"""
Ride Provision System - Platform Commission, Partner Ledger, Split Payments
All integrated into existing MongoDB + FastAPI
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
import uuid

from dependencies import get_current_user, get_admin_user
from config import db

router = APIRouter(prefix="/provisions", tags=["Provisions & Fees"])

# ==================== FEE CONFIGURATION (Admin-configurable) ====================

DEFAULT_FEES = {
    "topup_fee_percent": 2.5,
    "ride_commission_percent": 15.0,
    "merchant_fee_percent": 1.5,
    "payout_fixed_fee_cents": 100,  # 1 EUR
    "payout_fee_percent": 1.0,
}

PLATFORM_EMAIL = "platform@bidblitz.ae"


def money(x) -> Decimal:
    return Decimal(str(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calc_percent(amount_cents: int, rate_percent: float) -> int:
    """Calculate percentage fee in cents"""
    return int(money(Decimal(str(amount_cents)) * Decimal(str(rate_percent)) / Decimal("100")))


async def get_fee_config():
    """Get current fee configuration (admin can change)"""
    config = await db.platform_config.find_one({"key": "fees"}, {"_id": 0})
    if config:
        return config.get("value", DEFAULT_FEES)
    return DEFAULT_FEES


async def get_platform_wallet_id():
    """Get or create platform system user"""
    platform = await db.users.find_one({"email": PLATFORM_EMAIL})
    if not platform:
        pid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": pid, "name": "BidBlitz Platform", "email": PLATFORM_EMAIL,
            "password": "SYSTEM_ACCOUNT_NO_LOGIN", "is_admin": True, "is_bot": False,
            "role": "platform", "wallet_balance_cents": 0, "bids_balance": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return pid
    return platform["id"]


# ==================== SPLIT PAYMENT (Core Function) ====================

async def split_payment(payer_user_id: str, partner_user_id: Optional[str],
                        gross_cents: int, commission_percent: float,
                        reference: str, note: str):
    """
    Split a payment: User pays gross, Platform gets commission, Partner gets rest.
    Creates ledger entries for all parties.
    """
    fees = await get_fee_config()
    platform_id = await get_platform_wallet_id()
    
    commission_cents = calc_percent(gross_cents, commission_percent)
    partner_share_cents = gross_cents - commission_cents
    now = datetime.now(timezone.utc).isoformat()

    # 1) Debit payer wallet
    payer = await db.users.find_one({"id": payer_user_id})
    if not payer or payer.get("wallet_balance_cents", 0) < gross_cents:
        raise HTTPException(402, f"Nicht genug Guthaben. Benötigt: {gross_cents/100:.2f} EUR")

    await db.users.update_one({"id": payer_user_id}, {"$inc": {"wallet_balance_cents": -gross_cents}})
    await db.wallet_ledger.insert_one({
        "id": str(uuid.uuid4()), "user_id": payer_user_id, "type": "debit",
        "amount_cents": gross_cents, "category": "payment",
        "description": note, "reference_id": reference, "created_at": now
    })

    # 2) Credit platform commission
    if commission_cents > 0:
        await db.users.update_one({"id": platform_id}, {"$inc": {"wallet_balance_cents": commission_cents}})
        await db.wallet_ledger.insert_one({
            "id": str(uuid.uuid4()), "user_id": platform_id, "type": "credit",
            "amount_cents": commission_cents, "category": "commission",
            "description": f"Provision {commission_percent}% - {note}", "reference_id": reference, "created_at": now
        })

    # 3) Credit partner balance (if partner exists)
    if partner_user_id and partner_share_cents > 0:
        # Partner ledger entry
        await db.partner_ledger.insert_one({
            "id": str(uuid.uuid4()), "partner_id": partner_user_id, "type": "settlement",
            "amount_cents": partner_share_cents, "reference": reference,
            "note": f"Partner-Anteil {100-commission_percent}% - {note}", "created_at": now
        })
        # Update partner balance
        await db.partner_balances.update_one(
            {"partner_id": partner_user_id},
            {"$inc": {"balance_cents": partner_share_cents}, "$set": {"updated_at": now}},
            upsert=True
        )

    # 4) Record the split transaction
    await db.split_transactions.insert_one({
        "id": str(uuid.uuid4()), "reference": reference,
        "payer_id": payer_user_id, "platform_id": platform_id, "partner_id": partner_user_id,
        "gross_cents": gross_cents, "commission_cents": commission_cents,
        "commission_percent": commission_percent, "partner_share_cents": partner_share_cents,
        "note": note, "created_at": now
    })

    return {
        "gross_cents": gross_cents, "commission_cents": commission_cents,
        "partner_share_cents": partner_share_cents,
        "commission_percent": commission_percent
    }


# ==================== FEE CONFIGURATION ENDPOINTS ====================

class FeeConfig(BaseModel):
    topup_fee_percent: Optional[float] = None
    ride_commission_percent: Optional[float] = None
    merchant_fee_percent: Optional[float] = None
    payout_fixed_fee_cents: Optional[int] = None
    payout_fee_percent: Optional[float] = None


@router.get("/fees")
async def get_fees():
    """Get current fee configuration"""
    return await get_fee_config()


@router.put("/fees")
async def update_fees(data: FeeConfig, admin: dict = Depends(get_admin_user)):
    """Admin: Update fee configuration (1-20% range)"""
    current = await get_fee_config()
    updates = {}

    if data.topup_fee_percent is not None:
        if not 0 <= data.topup_fee_percent <= 20:
            raise HTTPException(400, "Topup Fee muss zwischen 0-20% sein")
        updates["topup_fee_percent"] = data.topup_fee_percent

    if data.ride_commission_percent is not None:
        if not 1 <= data.ride_commission_percent <= 20:
            raise HTTPException(400, "Ride Commission muss zwischen 1-20% sein")
        updates["ride_commission_percent"] = data.ride_commission_percent

    if data.merchant_fee_percent is not None:
        if not 0 <= data.merchant_fee_percent <= 20:
            raise HTTPException(400, "Merchant Fee muss zwischen 0-20% sein")
        updates["merchant_fee_percent"] = data.merchant_fee_percent

    if data.payout_fixed_fee_cents is not None:
        updates["payout_fixed_fee_cents"] = data.payout_fixed_fee_cents

    if data.payout_fee_percent is not None:
        if not 0 <= data.payout_fee_percent <= 10:
            raise HTTPException(400, "Payout Fee muss zwischen 0-10% sein")
        updates["payout_fee_percent"] = data.payout_fee_percent

    new_config = {**current, **updates}
    await db.platform_config.update_one(
        {"key": "fees"}, {"$set": {"value": new_config}}, upsert=True
    )
    return {"success": True, "fees": new_config}


# ==================== PLATFORM WALLET ====================

@router.get("/platform/balance")
async def get_platform_balance(admin: dict = Depends(get_admin_user)):
    """Admin: Get platform wallet balance (total commissions)"""
    platform_id = await get_platform_wallet_id()
    platform = await db.users.find_one({"id": platform_id}, {"_id": 0, "wallet_balance_cents": 1})
    
    # Get total commissions
    pipeline = [
        {"$match": {"user_id": platform_id, "category": "commission"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_cents"}, "count": {"$sum": 1}}}
    ]
    result = await db.wallet_ledger.aggregate(pipeline).to_list(1)
    total_commissions = result[0]["total"] if result else 0
    commission_count = result[0]["count"] if result else 0

    return {
        "balance_cents": platform.get("wallet_balance_cents", 0) if platform else 0,
        "total_commissions_cents": total_commissions,
        "total_transactions": commission_count,
        "balance_eur": round((platform.get("wallet_balance_cents", 0) if platform else 0) / 100, 2)
    }


@router.get("/platform/transactions")
async def get_platform_transactions(limit: int = 50, admin: dict = Depends(get_admin_user)):
    """Admin: Get platform commission transactions"""
    platform_id = await get_platform_wallet_id()
    entries = await db.wallet_ledger.find(
        {"user_id": platform_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return {"transactions": entries}


# ==================== PARTNER LEDGER ====================

@router.get("/partners/balances")
async def get_partner_balances(admin: dict = Depends(get_admin_user)):
    """Admin: Get all partner balances"""
    balances = await db.partner_balances.find({}, {"_id": 0}).to_list(100)

    # Enrich with partner names
    for b in balances:
        partner = await db.users.find_one({"id": b["partner_id"]}, {"_id": 0, "name": 1, "email": 1})
        if partner:
            b["partner_name"] = partner.get("name")
            b["partner_email"] = partner.get("email")

    return {"balances": balances}


@router.get("/partners/{partner_id}/ledger")
async def get_partner_ledger(partner_id: str, limit: int = 50, admin: dict = Depends(get_admin_user)):
    """Admin: Get a partner's ledger entries"""
    entries = await db.partner_ledger.find(
        {"partner_id": partner_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)

    balance = await db.partner_balances.find_one({"partner_id": partner_id}, {"_id": 0})

    return {
        "partner_id": partner_id,
        "balance_cents": balance.get("balance_cents", 0) if balance else 0,
        "entries": entries
    }


# ==================== PARTNER PAYOUT ====================

class PayoutRequest(BaseModel):
    partner_id: str
    amount_cents: int
    destination: str  # IBAN or description
    note: Optional[str] = None


@router.post("/partners/payout")
async def process_partner_payout(data: PayoutRequest, admin: dict = Depends(get_admin_user)):
    """Admin: Process a payout to a partner"""
    balance = await db.partner_balances.find_one({"partner_id": data.partner_id})
    if not balance or balance.get("balance_cents", 0) < data.amount_cents:
        raise HTTPException(400, "Partner hat nicht genug Guthaben")

    fees = await get_fee_config()
    payout_fee = fees.get("payout_fixed_fee_cents", 100) + calc_percent(data.amount_cents, fees.get("payout_fee_percent", 1.0))
    net_payout = data.amount_cents - payout_fee
    now = datetime.now(timezone.utc).isoformat()
    ref = f"payout-{str(uuid.uuid4())[:8]}"

    # Debit partner balance
    await db.partner_balances.update_one(
        {"partner_id": data.partner_id},
        {"$inc": {"balance_cents": -data.amount_cents}, "$set": {"updated_at": now}}
    )

    # Partner ledger entry
    await db.partner_ledger.insert_one({
        "id": str(uuid.uuid4()), "partner_id": data.partner_id, "type": "payout",
        "amount_cents": -data.amount_cents, "reference": ref,
        "note": f"Auszahlung an {data.destination} (Netto: {net_payout/100:.2f} EUR, Fee: {payout_fee/100:.2f} EUR)",
        "created_at": now
    })

    # Platform gets payout fee
    platform_id = await get_platform_wallet_id()
    await db.users.update_one({"id": platform_id}, {"$inc": {"wallet_balance_cents": payout_fee}})
    await db.wallet_ledger.insert_one({
        "id": str(uuid.uuid4()), "user_id": platform_id, "type": "credit",
        "amount_cents": payout_fee, "category": "commission",
        "description": f"Payout Fee - Partner {data.partner_id}", "reference_id": ref, "created_at": now
    })

    # Record payout
    await db.partner_payouts.insert_one({
        "id": str(uuid.uuid4()), "partner_id": data.partner_id,
        "gross_cents": data.amount_cents, "fee_cents": payout_fee, "net_cents": net_payout,
        "destination": data.destination, "note": data.note,
        "status": "pending", "created_at": now, "processed_by": admin["id"]
    })

    return {
        "success": True,
        "gross_cents": data.amount_cents, "fee_cents": payout_fee, "net_cents": net_payout,
        "message": f"Auszahlung: {net_payout/100:.2f} EUR an {data.destination} (Fee: {payout_fee/100:.2f} EUR)"
    }


# ==================== REPORTS ====================

@router.get("/reports/summary")
async def get_provision_summary(days: int = Query(default=30, ge=1, le=365), admin: dict = Depends(get_admin_user)):
    """Admin: Get provision summary report"""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Total ride revenue
    ride_pipeline = [
        {"$match": {"created_at": {"$gte": since}, "category": "commission"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_cents"}, "count": {"$sum": 1}}}
    ]
    platform_id = await get_platform_wallet_id()
    ride_result = await db.wallet_ledger.aggregate([
        {"$match": {"user_id": platform_id, "created_at": {"$gte": since}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_cents"}, "count": {"$sum": 1}}}
    ]).to_list(1)

    # Total partner settlements
    partner_result = await db.partner_ledger.aggregate([
        {"$match": {"type": "settlement", "created_at": {"$gte": since}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_cents"}, "count": {"$sum": 1}}}
    ]).to_list(1)

    # Total split transactions
    splits = await db.split_transactions.aggregate([
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": None,
            "total_gross": {"$sum": "$gross_cents"},
            "total_commission": {"$sum": "$commission_cents"},
            "total_partner": {"$sum": "$partner_share_cents"},
            "count": {"$sum": 1}
        }}
    ]).to_list(1)

    # Partner payouts
    payouts = await db.partner_payouts.aggregate([
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": None, "total": {"$sum": "$net_cents"}, "count": {"$sum": 1}}}
    ]).to_list(1)

    s = splits[0] if splits else {}
    return {
        "period_days": days,
        "total_gross_cents": s.get("total_gross", 0),
        "total_commission_cents": s.get("total_commission", 0),
        "total_partner_share_cents": s.get("total_partner", 0),
        "transaction_count": s.get("count", 0),
        "total_payouts_cents": payouts[0]["total"] if payouts else 0,
        "payout_count": payouts[0]["count"] if payouts else 0,
        "platform_balance_cents": (ride_result[0]["total"] if ride_result else 0),
    }


@router.get("/reports/by-partner")
async def get_report_by_partner(days: int = Query(default=30), admin: dict = Depends(get_admin_user)):
    """Admin: Revenue report grouped by partner"""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {
            "_id": "$partner_id",
            "total_gross": {"$sum": "$gross_cents"},
            "total_commission": {"$sum": "$commission_cents"},
            "total_partner": {"$sum": "$partner_share_cents"},
            "rides": {"$sum": 1}
        }},
        {"$sort": {"total_gross": -1}}
    ]
    results = await db.split_transactions.aggregate(pipeline).to_list(100)

    # Enrich with partner names
    for r in results:
        if r["_id"]:
            partner = await db.users.find_one({"id": r["_id"]}, {"_id": 0, "name": 1})
            r["partner_name"] = partner.get("name", "Unbekannt") if partner else "Kein Partner"
        else:
            r["partner_name"] = "Ohne Partner"
        r["partner_id"] = r.pop("_id")

    return {"period_days": days, "partners": results}
