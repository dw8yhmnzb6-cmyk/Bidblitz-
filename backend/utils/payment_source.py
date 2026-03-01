"""
Payment Source - Angepasst an BidBlitz DB-Schema
Personal: db.users.wallet_balance_cents (int, cents)
Business: db.business_accounts.wallet_balance_cents (int, cents)
"""
from fastapi import HTTPException

MIN_WALLET_CENTS = 500  # 5 EUR

async def resolve_payment_wallet(db, user_id: str, payment_source: str, business_id: str | None):
    payment_source = (payment_source or "personal").lower()

    if payment_source == "personal":
        u = await db.users.find_one({"id": user_id}, {"wallet_balance_cents": 1})
        balance = int(u.get("wallet_balance_cents", 0)) if u else 0

        if balance < MIN_WALLET_CENTS:
            raise HTTPException(402, detail="INSUFFICIENT_WALLET_BALANCE")

        return {
            "source": "personal",
            "wallet_user_id": user_id,
            "business_id": None,
            "balance_cents": balance
        }

    elif payment_source == "business":
        if not business_id:
            raise HTTPException(400, detail="BUSINESS_ID_REQUIRED")

        member = await db.business_members.find_one({
            "business_id": business_id,
            "user_id": user_id,
            "status": "active"
        })
        if not member:
            raise HTTPException(403, detail="NOT_BUSINESS_MEMBER")

        # Check monthly limit
        limits = member.get("limits", {})
        cap = limits.get("monthly_cap_eur")
        spent = limits.get("monthly_spent_eur", 0)
        if cap is not None and spent >= cap:
            raise HTTPException(402, detail="MONTHLY_LIMIT_REACHED")

        business = await db.business_accounts.find_one({"business_id": business_id})
        if not business or business.get("status") != "active":
            raise HTTPException(403, detail="BUSINESS_NOT_ACTIVE")

        balance = int(business.get("wallet_balance_cents", 0))

        if balance < MIN_WALLET_CENTS:
            raise HTTPException(402, detail="INSUFFICIENT_BUSINESS_BALANCE")

        return {
            "source": "business",
            "wallet_user_id": None,
            "business_id": business_id,
            "balance_cents": balance
        }

    else:
        raise HTTPException(400, detail="INVALID_PAYMENT_SOURCE")


async def debit_payment(db, pay: dict, amount_cents: int, user_id: str = None):
    """Debit the resolved wallet atomically"""
    if amount_cents <= 0:
        return

    if pay["source"] == "personal":
        r = await db.users.update_one(
            {"id": pay["wallet_user_id"], "wallet_balance_cents": {"$gte": amount_cents}},
            {"$inc": {"wallet_balance_cents": -amount_cents}}
        )
        if r.matched_count == 0:
            raise HTTPException(402, detail="INSUFFICIENT_WALLET_BALANCE")

    else:  # business
        r = await db.business_accounts.update_one(
            {"business_id": pay["business_id"], "wallet_balance_cents": {"$gte": amount_cents}},
            {"$inc": {"wallet_balance_cents": -amount_cents}}
        )
        if r.matched_count == 0:
            raise HTTPException(402, detail="INSUFFICIENT_BUSINESS_BALANCE")

        # Update monthly spent
        if user_id:
            await db.business_members.update_one(
                {"business_id": pay["business_id"], "user_id": user_id},
                {"$inc": {"limits.monthly_spent_eur": amount_cents / 100}}
            )
