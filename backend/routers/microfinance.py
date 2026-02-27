"""
Microfinance/Loans System for BidBlitz
Technical layer for loan requests, approval, disbursement and repayment
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import logging

from dependencies import get_current_user, get_admin_user
from config import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/loans", tags=["Microfinance & Loans"])


# ==================== SCHEMAS ====================

class LoanRequest(BaseModel):
    principal_cents: int  # Loan amount in cents
    term_days: int  # Loan term in days
    purpose: Optional[str] = None

class LoanApproval(BaseModel):
    apr_bps: int = 1500  # APR in basis points (1500 = 15.00%)
    notes: Optional[str] = None

class LoanRepayment(BaseModel):
    amount_cents: int
    method: str = "wallet"  # wallet, card, bank_transfer, cash


# ==================== USER ENDPOINTS ====================

@router.post("/request")
async def request_loan(data: LoanRequest, user: dict = Depends(get_current_user)):
    """User requests a loan"""
    # Check KYC status
    if user.get("kyc_status") != "approved":
        raise HTTPException(status_code=403, detail="KYC-Verifizierung erforderlich für Kredite")
    
    # Check if user has pending/active loan
    active_loan = await db.loans.find_one({
        "user_id": user["id"],
        "status": {"": ["requested", "approved", "disbursed", "repaying"]}
    })
    if active_loan:
        raise HTTPException(status_code=409, detail="Sie haben bereits einen aktiven Kredit")
    
    # Validate loan parameters
    if data.principal_cents < 5000:  # Min 50€
        raise HTTPException(status_code=400, detail="Mindestbetrag: €50")
    if data.principal_cents > 500000:  # Max 5000€
        raise HTTPException(status_code=400, detail="Maximalbetrag: €5.000")
    if data.term_days < 7:
        raise HTTPException(status_code=400, detail="Mindestlaufzeit: 7 Tage")
    if data.term_days > 365:
        raise HTTPException(status_code=400, detail="Maximale Laufzeit: 365 Tage")
    
    loan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    loan = {
        "id": loan_id,
        "loan_number": f"LOAN-{loan_id[:8].upper()}",
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "principal_cents": data.principal_cents,
        "currency": "EUR",
        "term_days": data.term_days,
        "purpose": data.purpose,
        "status": "requested",
        "apr_bps": None,
        "interest_cents": None,
        "total_due_cents": None,
        "repaid_cents": 0,
        "created_at": now.isoformat(),
        "approved_at": None,
        "disbursed_at": None,
        "due_date": None,
        "closed_at": None,
        "rejection_reason": None
    }
    
    await db.loans.insert_one(loan)
    logger.info(f"💰 Loan requested: {loan['loan_number']} by {user.get('email')} for €{data.principal_cents/100:.2f}")
    
    return {
        "success": True,
        "loan": {k: v for k, v in loan.items() if k != '_id'},
        "message": "Kreditantrag eingereicht. Wir prüfen Ihren Antrag."
    }


@router.get("/my-loans")
async def get_my_loans(user: dict = Depends(get_current_user)):
    """User gets their loans"""
    loans = await db.loans.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"loans": loans}


@router.get("/{loan_id}")
async def get_loan(loan_id: str, user: dict = Depends(get_current_user)):
    """Get loan details"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Kredit nicht gefunden")
    
    if loan["user_id"] != user["id"] and not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Nicht autorisiert")
    
    # Get repayment history
    payments = await db.loan_payments.find(
        {"loan_id": loan_id},
        {"_id": 0}
    ).sort("paid_at", -1).to_list(100)
    
    return {"loan": loan, "payments": payments}


@router.post("/{loan_id}/repay")
async def repay_loan(loan_id: str, data: LoanRepayment, user: dict = Depends(get_current_user)):
    """User makes a loan repayment"""
    loan = await db.loans.find_one({"id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Kredit nicht gefunden")
    
    if loan["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")
    
    if loan["status"] not in ["disbursed", "repaying"]:
        raise HTTPException(status_code=409, detail=f"Kredit kann nicht zurückgezahlt werden (Status: {loan['status']})")
    
    if data.amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Ungültiger Betrag")
    
    remaining = loan["total_due_cents"] - loan["repaid_cents"]
    if data.amount_cents > remaining:
        raise HTTPException(status_code=400, detail=f"Maximaler Rückzahlungsbetrag: €{remaining/100:.2f}")
    
    now = datetime.now(timezone.utc)
    payment_id = str(uuid.uuid4())
    
    # Record payment
    payment = {
        "id": payment_id,
        "loan_id": loan_id,
        "amount_cents": data.amount_cents,
        "method": data.method,
        "paid_at": now.isoformat()
    }
    await db.loan_payments.insert_one(payment)
    
    # Update loan
    new_repaid = loan["repaid_cents"] + data.amount_cents
    new_status = "closed" if new_repaid >= loan["total_due_cents"] else "repaying"
    
    update_data = {
        "repaid_cents": new_repaid,
        "status": new_status
    }
    if new_status == "closed":
        update_data["closed_at"] = now.isoformat()
    
    await db.loans.update_one({"id": loan_id}, {"": update_data})
    
    # Create ledger entry
    await db.ledger_entries.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "debit",
        "reason": "loan_repayment",
        "amount_cents": data.amount_cents,
        "currency": "EUR",
        "reference_id": loan_id,
        "description": f"Kreditrückzahlung: {loan['loan_number']}",
        "created_at": now.isoformat()
    })
    
    logger.info(f"💳 Loan repayment: {loan['loan_number']} - €{data.amount_cents/100:.2f}")
    
    return {
        "success": True,
        "payment_id": payment_id,
        "amount_paid": data.amount_cents,
        "total_repaid": new_repaid,
        "remaining": loan["total_due_cents"] - new_repaid,
        "status": new_status,
        "message": "Kredit vollständig zurückgezahlt!" if new_status == "closed" else f"€{data.amount_cents/100:.2f} zurückgezahlt"
    }


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/all")
async def get_all_loans(
    status: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Admin gets all loans"""
    query = {}
    if status:
        query["status"] = status
    
    loans = await db.loans.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    stats = {
        "requested": await db.loans.count_documents({"status": "requested"}),
        "approved": await db.loans.count_documents({"status": "approved"}),
        "disbursed": await db.loans.count_documents({"status": "disbursed"}),
        "repaying": await db.loans.count_documents({"status": "repaying"}),
        "closed": await db.loans.count_documents({"status": "closed"}),
        "rejected": await db.loans.count_documents({"status": "rejected"})
    }
    
    return {"loans": loans, "stats": stats}


@router.post("/admin/{loan_id}/approve")
async def approve_loan(loan_id: str, data: LoanApproval, admin: dict = Depends(get_admin_user)):
    """Admin approves a loan request"""
    loan = await db.loans.find_one({"id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Kredit nicht gefunden")
    
    if loan["status"] != "requested":
        raise HTTPException(status_code=409, detail=f"Kredit kann nicht genehmigt werden (Status: {loan['status']})")
    
    # Calculate interest
    # Simple interest: Principal * APR * (Days / 365)
    interest_cents = int(loan["principal_cents"] * (data.apr_bps / 10000) * (loan["term_days"] / 365))
    total_due = loan["principal_cents"] + interest_cents
    
    now = datetime.now(timezone.utc)
    
    await db.loans.update_one(
        {"id": loan_id},
        {"": {
            "status": "approved",
            "apr_bps": data.apr_bps,
            "interest_cents": interest_cents,
            "total_due_cents": total_due,
            "approved_at": now.isoformat(),
            "approved_by": admin.get("email"),
            "approval_notes": data.notes
        }}
    )
    
    logger.info(f"✅ Loan approved: {loan['loan_number']} by admin {admin.get('email')}")
    
    return {
        "success": True,
        "loan_id": loan_id,
        "status": "approved",
        "principal": loan["principal_cents"],
        "interest": interest_cents,
        "total_due": total_due,
        "apr": f"{data.apr_bps / 100:.2f}%",
        "message": "Kredit genehmigt. Bereit zur Auszahlung."
    }


@router.post("/admin/{loan_id}/reject")
async def reject_loan(loan_id: str, reason: str, admin: dict = Depends(get_admin_user)):
    """Admin rejects a loan request"""
    loan = await db.loans.find_one({"id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Kredit nicht gefunden")
    
    if loan["status"] != "requested":
        raise HTTPException(status_code=409, detail=f"Kredit kann nicht abgelehnt werden (Status: {loan['status']})")
    
    await db.loans.update_one(
        {"id": loan_id},
        {"": {
            "status": "rejected",
            "rejection_reason": reason,
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejected_by": admin.get("email")
        }}
    )
    
    logger.info(f"❌ Loan rejected: {loan['loan_number']} by admin {admin.get('email')}")
    
    return {"success": True, "loan_id": loan_id, "status": "rejected", "reason": reason}


@router.post("/admin/{loan_id}/disburse")
async def disburse_loan(loan_id: str, admin: dict = Depends(get_admin_user)):
    """Admin disburses an approved loan"""
    loan = await db.loans.find_one({"id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Kredit nicht gefunden")
    
    if loan["status"] != "approved":
        raise HTTPException(status_code=409, detail=f"Kredit muss zuerst genehmigt werden (Status: {loan['status']})")
    
    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=loan["term_days"])
    
    await db.loans.update_one(
        {"id": loan_id},
        {"": {
            "status": "disbursed",
            "disbursed_at": now.isoformat(),
            "disbursed_by": admin.get("email"),
            "due_date": due_date.isoformat()
        }}
    )
    
    # Create ledger entry for disbursement
    await db.ledger_entries.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": loan["user_id"],
        "type": "credit",
        "reason": "loan_disbursement",
        "amount_cents": loan["principal_cents"],
        "currency": "EUR",
        "reference_id": loan_id,
        "description": f"Kreditauszahlung: {loan['loan_number']}",
        "created_at": now.isoformat()
    })
    
    # TODO: Actually transfer money via payment provider
    # await payment_provider.transfer(loan["user_id"], loan["principal_cents"])
    
    logger.info(f"💸 Loan disbursed: {loan['loan_number']} - €{loan['principal_cents']/100:.2f}")
    
    return {
        "success": True,
        "loan_id": loan_id,
        "status": "disbursed",
        "amount": loan["principal_cents"],
        "due_date": due_date.isoformat(),
        "message": f"€{loan['principal_cents']/100:.2f} ausgezahlt. Fällig am {due_date.strftime('%d.%m.%Y')}"
    }
