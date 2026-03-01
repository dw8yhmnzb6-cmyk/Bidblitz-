"""
Payment Source - with business limits enforcement
"""
from fastapi import HTTPException
from datetime import datetime, timezone

MIN_WALLET_CENTS = 500  # 5 EUR

async def enforce_limits_and_budget(db, business_id, user_id, amount_cents):
    """Check employee monthly limit + business budget before allowing payment"""
    member = await db.business_members.find_one({"business_id": business_id, "user_id": user_id, "status": "active"})
    if not member:
        raise HTTPException(403, "NOT_BUSINESS_MEMBER")

    # Employee monthly limit
    limits = member.get("limits", {})
    cap_eur = limits.get("monthly_cap_eur")
    spent_eur = limits.get("monthly_spent_eur", 0)
    if cap_eur is not None and (spent_eur + amount_cents / 100) > cap_eur:
        raise HTTPException(402, f"Monatslimit erreicht ({spent_eur:.0f}/{cap_eur:.0f} EUR)")

    # Business budget
    biz = await db.business_accounts.find_one({"business_id": business_id})
    if not biz:
        raise HTTPException(404, "BUSINESS_NOT_FOUND")
    budget = (biz.get("billing") or {}).get("monthly_budget_cents")
    if budget and amount_cents > budget:
        raise HTTPException(402, "BUSINESS_BUDGET_EXCEEDED")


async def resolve_payment_wallet(db, user_id, payment_source, business_id=None):
    payment_source = (payment_source or "personal").lower()

    if payment_source == "personal":
        u = await db.users.find_one({"id": user_id}, {"wallet_balance_cents": 1})
        balance = int(u.get("wallet_balance_cents", 0)) if u else 0
        if balance < MIN_WALLET_CENTS:
            raise HTTPException(402, "INSUFFICIENT_WALLET_BALANCE")
        return {"source": "personal", "wallet_user_id": user_id, "business_id": None, "balance_cents": balance}

    elif payment_source == "business":
        if not business_id:
            raise HTTPException(400, "BUSINESS_ID_REQUIRED")
        member = await db.business_members.find_one({"business_id": business_id, "user_id": user_id, "status": "active"})
        if not member:
            raise HTTPException(403, "NOT_BUSINESS_MEMBER")
        business = await db.business_accounts.find_one({"business_id": business_id})
        if not business or business.get("status") != "active":
            raise HTTPException(403, "BUSINESS_NOT_ACTIVE")
        balance = int(business.get("wallet_balance_cents", 0))
        if balance < MIN_WALLET_CENTS:
            raise HTTPException(402, "INSUFFICIENT_BUSINESS_BALANCE")
        return {"source": "business", "wallet_user_id": None, "business_id": business_id, "balance_cents": balance}

    raise HTTPException(400, "INVALID_PAYMENT_SOURCE")


async def debit_payment(db, pay, amount_cents, user_id=None):
    """Debit wallet atomically with limits check for business"""
    if amount_cents <= 0:
        return {"ok": True}

    if pay["source"] == "personal":
        res = await db.users.update_one(
            {"id": pay["wallet_user_id"], "wallet_balance_cents": {"$gte": amount_cents}},
            {"$inc": {"wallet_balance_cents": -amount_cents}}
        )
        return {"ok": res.modified_count == 1}

    # BUSINESS WALLET
    if not user_id:
        return {"ok": False, "error": "USER_ID_REQUIRED"}

    await enforce_limits_and_budget(db, pay["business_id"], user_id, amount_cents)

    res = await db.business_accounts.update_one(
        {"business_id": pay["business_id"], "wallet_balance_cents": {"$gte": amount_cents}},
        {"$inc": {"wallet_balance_cents": -amount_cents}}
    )

    if res.modified_count == 1:
        # Update monthly spent
        await db.business_members.update_one(
            {"business_id": pay["business_id"], "user_id": user_id},
            {"$inc": {"limits.monthly_spent_eur": amount_cents / 100}}
        )

    return {"ok": res.modified_count == 1}
