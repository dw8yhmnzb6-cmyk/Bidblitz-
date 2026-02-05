"""Phone Verification Router - SMS verification for user accounts"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid
import random
import os

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/phone", tags=["Phone Verification"])

# ==================== SCHEMAS ====================

class PhoneVerificationRequest(BaseModel):
    phone_number: str  # Format: +49123456789

class VerifyCodeRequest(BaseModel):
    phone_number: str
    code: str

# ==================== HELPER FUNCTIONS ====================

def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def normalize_phone_number(phone: str) -> str:
    """Normalize phone number to standard format"""
    # Remove spaces, dashes, parentheses
    phone = ''.join(c for c in phone if c.isdigit() or c == '+')
    
    # Add + if missing
    if not phone.startswith('+'):
        # Assume German number if no country code
        if phone.startswith('0'):
            phone = '+49' + phone[1:]
        else:
            phone = '+' + phone
    
    return phone

async def send_sms(phone_number: str, message: str) -> bool:
    """Send SMS via Twilio (if configured) or mock"""
    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')
    
    if twilio_sid and twilio_token and twilio_from:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            client.messages.create(
                body=message,
                from_=twilio_from,
                to=phone_number
            )
            logger.info(f"SMS sent to {phone_number}")
            return True
        except Exception as e:
            logger.error(f"Twilio SMS error: {e}")
            return False
    else:
        # Mock mode - just log
        logger.info(f"[MOCK SMS] To: {phone_number}, Message: {message}")
        return True

# ==================== ENDPOINTS ====================

@router.post("/send-code")
async def send_verification_code(data: PhoneVerificationRequest, user: dict = Depends(get_current_user)):
    """Send a verification code to phone number"""
    user_id = user["id"]
    phone = normalize_phone_number(data.phone_number)
    
    # Validate phone number format
    if len(phone) < 10 or len(phone) > 15:
        raise HTTPException(status_code=400, detail="Ungültige Telefonnummer")
    
    # Check if phone already verified by another user
    existing = await db.users.find_one({
        "phone_number": phone,
        "phone_verified": True,
        "id": {"$ne": user_id}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Diese Telefonnummer ist bereits bei einem anderen Konto verifiziert")
    
    # Rate limiting - max 3 codes per hour
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    recent_codes = await db.phone_verification.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": one_hour_ago}
    })
    if recent_codes >= 3:
        raise HTTPException(status_code=429, detail="Zu viele Anfragen. Bitte warten Sie eine Stunde.")
    
    # Generate code
    code = generate_verification_code()
    
    # Store verification attempt
    verification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "phone_number": phone,
        "code": code,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        "verified": False
    }
    await db.phone_verification.insert_one(verification)
    
    # Send SMS
    message = f"Ihr BidBlitz Verifizierungscode: {code}\n\nDieser Code ist 10 Minuten gültig."
    sent = await send_sms(phone, message)
    
    if not sent:
        raise HTTPException(status_code=500, detail="SMS konnte nicht gesendet werden")
    
    # Check if Twilio is configured
    is_mock = not os.environ.get('TWILIO_ACCOUNT_SID')
    
    return {
        "success": True,
        "message": "Verifizierungscode gesendet",
        "phone_number": phone[:4] + "****" + phone[-2:],  # Mask phone
        "expires_in_minutes": 10,
        "mock_mode": is_mock,
        "mock_code": code if is_mock else None  # Only show code in mock mode for testing
    }

@router.post("/verify")
async def verify_code(data: VerifyCodeRequest, user: dict = Depends(get_current_user)):
    """Verify the code and mark phone as verified"""
    user_id = user["id"]
    phone = normalize_phone_number(data.phone_number)
    
    # Find valid verification
    now = datetime.now(timezone.utc).isoformat()
    verification = await db.phone_verification.find_one({
        "user_id": user_id,
        "phone_number": phone,
        "code": data.code,
        "expires_at": {"$gte": now},
        "verified": False
    })
    
    if not verification:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Code")
    
    # Mark as verified
    await db.phone_verification.update_one(
        {"id": verification["id"]},
        {"$set": {"verified": True}}
    )
    
    # Update user profile
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "phone_number": phone,
            "phone_verified": True,
            "phone_verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Award bonus for phone verification (5 bids)
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids_balance": 5}}
    )
    
    logger.info(f"Phone verified for user {user_id}: {phone}")
    
    return {
        "success": True,
        "message": "Telefonnummer verifiziert! +5 Gebote als Bonus.",
        "bonus_bids": 5
    }

@router.get("/status")
async def get_verification_status(user: dict = Depends(get_current_user)):
    """Get phone verification status"""
    user_id = user["id"]
    
    user_data = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "phone_number": 1, "phone_verified": 1, "phone_verified_at": 1}
    )
    
    if not user_data:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    phone = user_data.get("phone_number")
    verified = user_data.get("phone_verified", False)
    
    return {
        "has_phone": bool(phone),
        "phone_masked": phone[:4] + "****" + phone[-2:] if phone else None,
        "verified": verified,
        "verified_at": user_data.get("phone_verified_at")
    }
