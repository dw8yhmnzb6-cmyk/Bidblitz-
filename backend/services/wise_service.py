"""
Wise API Integration Service
Handles automated payouts to merchants and payment notifications
"""
import os
import httpx
import hmac
import hashlib
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel

from config import db, logger

# Wise Configuration
WISE_API_URL = os.environ.get("WISE_API_URL", "https://api.wise-sandbox.com")
WISE_API_KEY = os.environ.get("WISE_API_KEY", "")
WISE_PROFILE_ID = os.environ.get("WISE_PROFILE_ID", "")
WISE_WEBHOOK_SECRET = os.environ.get("WISE_WEBHOOK_SECRET", "")


class WiseService:
    """Service for interacting with Wise API"""
    
    def __init__(self):
        self.api_url = WISE_API_URL
        self.api_key = WISE_API_KEY
        self.profile_id = WISE_PROFILE_ID
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def is_configured(self) -> bool:
        """Check if Wise API is properly configured"""
        return bool(self.api_key and self.profile_id)
    
    async def get_profiles(self) -> Dict[str, Any]:
        """Get Wise profiles for the authenticated user"""
        if not self.is_configured():
            return {"error": "Wise API not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/v2/profiles",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Wise get_profiles error: {e}")
            return {"error": str(e)}
    
    async def create_recipient(
        self,
        merchant_name: str,
        iban: str,
        currency: str = "EUR"
    ) -> Dict[str, Any]:
        """Create a recipient account for payout"""
        if not self.is_configured():
            return {"error": "Wise API not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "profile": int(self.profile_id),
                    "accountHolderName": merchant_name,
                    "currency": currency,
                    "type": "iban",
                    "details": {
                        "iban": iban
                    }
                }
                
                response = await client.post(
                    f"{self.api_url}/v1/accounts",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Wise create_recipient error: {e}")
            return {"error": str(e)}
    
    async def get_quote(
        self,
        target_amount: float,
        source_currency: str = "EUR",
        target_currency: str = "EUR"
    ) -> Dict[str, Any]:
        """Create a quote for transfer"""
        if not self.is_configured():
            return {"error": "Wise API not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "sourceCurrency": source_currency,
                    "targetCurrency": target_currency,
                    "targetAmount": target_amount
                }
                
                response = await client.post(
                    f"{self.api_url}/v3/profiles/{self.profile_id}/quotes",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Wise get_quote error: {e}")
            return {"error": str(e)}
    
    async def create_transfer(
        self,
        quote_id: str,
        recipient_id: int,
        reference: str
    ) -> Dict[str, Any]:
        """Create a transfer using quote and recipient"""
        if not self.is_configured():
            return {"error": "Wise API not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "quoteUuid": quote_id,
                    "targetAccount": recipient_id,
                    "customerTransactionId": str(uuid.uuid4()),
                    "details": {
                        "reference": reference
                    }
                }
                
                response = await client.post(
                    f"{self.api_url}/v1/transfers",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Wise create_transfer error: {e}")
            return {"error": str(e)}
    
    async def fund_transfer(self, transfer_id: int) -> Dict[str, Any]:
        """Fund a transfer using platform balance"""
        if not self.is_configured():
            return {"error": "Wise API not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {"type": "BALANCE"}
                
                response = await client.post(
                    f"{self.api_url}/v1/transfers/{transfer_id}/payments",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Wise fund_transfer error: {e}")
            return {"error": str(e)}
    
    async def get_transfer_status(self, transfer_id: int) -> Dict[str, Any]:
        """Get current transfer status"""
        if not self.is_configured():
            return {"error": "Wise API not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/v1/transfers/{transfer_id}",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Wise get_transfer_status error: {e}")
            return {"error": str(e)}
    
    async def send_payout(
        self,
        merchant_name: str,
        iban: str,
        amount: float,
        reference: str,
        currency: str = "EUR"
    ) -> Dict[str, Any]:
        """
        Complete payout flow: create recipient, quote, transfer, and fund
        Returns transfer details or error
        """
        if not self.is_configured():
            logger.warning("Wise API not configured - simulating payout")
            # Return simulated success for development
            return {
                "simulated": True,
                "transfer_id": f"SIM-{uuid.uuid4().hex[:8].upper()}",
                "status": "processing",
                "amount": amount,
                "currency": currency,
                "recipient": merchant_name,
                "reference": reference
            }
        
        try:
            # Step 1: Create or get recipient
            recipient = await self.create_recipient(merchant_name, iban, currency)
            if "error" in recipient:
                return recipient
            
            recipient_id = recipient.get("id")
            
            # Step 2: Get quote
            quote = await self.get_quote(amount, currency, currency)
            if "error" in quote:
                return quote
            
            quote_id = quote.get("id")
            
            # Step 3: Create transfer
            transfer = await self.create_transfer(quote_id, recipient_id, reference)
            if "error" in transfer:
                return transfer
            
            transfer_id = transfer.get("id")
            
            # Step 4: Fund transfer
            funding = await self.fund_transfer(transfer_id)
            if "error" in funding:
                return {"error": funding["error"], "transfer_id": transfer_id}
            
            return {
                "success": True,
                "transfer_id": transfer_id,
                "status": transfer.get("status", "processing"),
                "amount": amount,
                "currency": currency,
                "recipient": merchant_name,
                "reference": reference,
                "quote_rate": quote.get("rate", 1.0)
            }
            
        except Exception as e:
            logger.error(f"Wise send_payout error: {e}")
            return {"error": str(e)}
    
    def verify_webhook_signature(self, request_body: bytes, signature: str) -> bool:
        """Verify webhook signature from Wise"""
        if not WISE_WEBHOOK_SECRET:
            logger.warning("Wise webhook secret not configured")
            return True  # Allow in development
        
        computed_signature = hmac.new(
            WISE_WEBHOOK_SECRET.encode(),
            request_body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)


# Global service instance
wise_service = WiseService()


async def process_merchant_payout(partner_id: str, amount: float, reference: str) -> Dict[str, Any]:
    """
    Process a payout to a merchant
    Returns payout result
    """
    # Get partner and budget info
    partner = await db.partner_accounts.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        partner = await db.restaurant_accounts.find_one({"id": partner_id}, {"_id": 0})
    
    if not partner:
        return {"error": "Partner not found"}
    
    budget = await db.partner_budgets.find_one({"partner_id": partner_id}, {"_id": 0})
    if not budget:
        return {"error": "Partner budget not found"}
    
    # Check if partner has bank details
    iban = budget.get("bank_iban") or partner.get("iban")
    holder_name = budget.get("bank_holder_name") or partner.get("business_name") or partner.get("company_name")
    
    if not iban:
        return {"error": "Partner has no bank details configured"}
    
    # Check available balance
    available = budget.get("earnings_balance", 0)
    if amount > available:
        return {"error": f"Insufficient balance. Available: €{available:.2f}"}
    
    # Send payout via Wise
    payout_result = await wise_service.send_payout(
        merchant_name=holder_name,
        iban=iban,
        amount=amount,
        reference=reference
    )
    
    if "error" in payout_result and payout_result.get("error"):
        return payout_result
    
    # Record payout
    payout_record = {
        "id": str(uuid.uuid4()),
        "partner_id": partner_id,
        "partner_name": holder_name,
        "amount": amount,
        "currency": "EUR",
        "reference": reference,
        "wise_transfer_id": payout_result.get("transfer_id"),
        "status": payout_result.get("status", "processing"),
        "simulated": payout_result.get("simulated", False),
        "created_at": datetime.now(timezone.utc)
    }
    await db.partner_payouts.insert_one(payout_record)
    
    # Update partner budget
    await db.partner_budgets.update_one(
        {"partner_id": partner_id},
        {
            "$inc": {
                "earnings_balance": -amount,
                "total_paid_out": amount
            },
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    logger.info(f"Payout processed: {amount} EUR to {holder_name} (Partner: {partner_id})")
    
    return {
        "success": True,
        "payout_id": payout_record["id"],
        **payout_result
    }


async def process_pending_payouts():
    """
    Scheduled task: Process automatic payouts for merchants
    Called by scheduler based on payout frequency settings
    """
    # Find partners with automatic payouts enabled
    budgets = await db.partner_budgets.find({
        "payout_frequency": {"$ne": "manual"},
        "earnings_balance": {"$gt": 0}
    }).to_list(100)
    
    results = []
    for budget in budgets:
        partner_id = budget["partner_id"]
        min_amount = budget.get("min_payout_amount", 50.0)
        balance = budget.get("earnings_balance", 0)
        
        # Check if balance meets minimum
        if balance < min_amount:
            continue
        
        # Check bank details
        if not budget.get("bank_iban"):
            continue
        
        # Process payout
        reference = f"BIDBLITZ-AUTO-{partner_id[:8].upper()}-{datetime.now().strftime('%Y%m%d')}"
        result = await process_merchant_payout(partner_id, balance, reference)
        results.append({
            "partner_id": partner_id,
            "amount": balance,
            "result": result
        })
    
    return results
