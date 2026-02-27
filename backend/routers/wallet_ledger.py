"""
Wallet Ledger System - Tracks all financial transactions
Extends existing wallet with proper double-entry bookkeeping for scooter rides
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from dependencies import get_current_user
from config import db

router = APIRouter(prefix="/wallet-ledger", tags=["Wallet Ledger"])


class WalletTopup(BaseModel):
    amount_cents: int
    method: str = "card"  # card, bank_transfer, cash

class WalletTransfer(BaseModel):
    to_user_id: str
    amount_cents: int
    note: Optional[str] = None


async def get_wallet_balance(user_id: str) -> int:
    """Calculate balance from ledger entries (sum of all credits minus debits)"""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "total_credit": {"$sum": {"$cond": [{"$eq": ["$type", "credit"]}, "$amount_cents", 0]}},
            "total_debit": {"$sum": {"$cond": [{"$eq": ["$type", "debit"]}, "$amount_cents", 0]}}
        }}
    ]
    result = await db.wallet_ledger.aggregate(pipeline).to_list(1)
    if result:
        return result[0]["total_credit"] - result[0]["total_debit"]
    return 0


async def create_ledger_entry(user_id: str, entry_type: str, amount_cents: int, 
                               category: str, description: str, reference_id: str = None):
    """Create a wallet ledger entry"""
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": entry_type,  # credit or debit
        "amount_cents": abs(amount_cents),
        "category": category,  # topup, ride_fee, ride_unlock, loan, repayment, transfer, refund, bid_purchase
        "description": description,
        "reference_id": reference_id,
        "balance_after_cents": None,  # Will be calculated
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Calculate new balance
    current_balance = await get_wallet_balance(user_id)
    if entry_type == "credit":
        entry["balance_after_cents"] = current_balance + abs(amount_cents)
    else:
        entry["balance_after_cents"] = current_balance - abs(amount_cents)
    
    await db.wallet_ledger.insert_one(entry)
    entry.pop("_id", None)
    return entry


@router.get("/balance")
async def get_balance(user: dict = Depends(get_current_user)):
    """Get wallet balance from ledger"""
    balance = await get_wallet_balance(user["id"])
    return {
        "user_id": user["id"],
        "balance_cents": balance,
        "balance_eur": round(balance / 100, 2),
        "currency": "EUR"
    }


@router.get("/transactions")
async def get_transactions(limit: int = 50, user: dict = Depends(get_current_user)):
    """Get transaction history"""
    entries = await db.wallet_ledger.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return {
        "transactions": entries,
        "total": len(entries)
    }


@router.post("/topup")
async def topup_wallet(data: WalletTopup, user: dict = Depends(get_current_user)):
    """Add funds to wallet"""
    if data.amount_cents < 100:  # Min 1€
        raise HTTPException(400, "Mindestbetrag: €1.00")
    if data.amount_cents > 50000:  # Max 500€
        raise HTTPException(400, "Maximalbetrag: €500.00")
    
    entry = await create_ledger_entry(
        user_id=user["id"],
        entry_type="credit",
        amount_cents=data.amount_cents,
        category="topup",
        description=f"Einzahlung via {data.method}"
    )
    
    return {
        "success": True,
        "entry": entry,
        "new_balance_cents": entry["balance_after_cents"],
        "message": f"€{data.amount_cents/100:.2f} eingezahlt"
    }
