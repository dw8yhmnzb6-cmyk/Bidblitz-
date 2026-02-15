"""Shared dependencies and authentication utilities"""
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Header, Request
from typing import Optional
import re
import uuid
import pyotp
import qrcode
import base64
import io
import httpx

from config import db, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, logger

# ==================== PASSWORD UTILITIES ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def validate_password_strength(password: str) -> tuple:
    """Validate password meets security requirements"""
    if len(password) < 8:
        return False, "Passwort muss mindestens 8 Zeichen lang sein"
    if len(password) > 128:
        return False, "Passwort darf maximal 128 Zeichen lang sein"
    if not re.search(r'[A-Z]', password):
        return False, "Passwort muss mindestens einen Großbuchstaben enthalten"
    if not re.search(r'[a-z]', password):
        return False, "Passwort muss mindestens einen Kleinbuchstaben enthalten"
    if not re.search(r'\d', password):
        return False, "Passwort muss mindestens eine Zahl enthalten"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]', password):
        return False, "Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*)"
    
    weak_passwords = ['password', 'passwort', '12345678', 'qwertyui', 'admin123', 'letmein', 'welcome']
    if password.lower() in weak_passwords or any(wp in password.lower() for wp in weak_passwords):
        return False, "Passwort ist zu schwach. Bitte wählen Sie ein sichereres Passwort"
    
    return True, "OK"

# ==================== JWT UTILITIES ====================

def create_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== 2FA UTILITIES ====================

def generate_2fa_secret() -> str:
    return pyotp.random_base32()

def generate_2fa_qr_code(email: str, secret: str) -> str:
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(email, issuer_name="bidblitz.ae")
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"

def verify_2fa_code(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

# ==================== SECURITY UTILITIES ====================

async def log_security_event(event_type: str, user_id: str, details: dict, ip_address: str = None):
    """Log security events to database"""
    event = {
        "id": str(uuid.uuid4()),
        "event_type": event_type,
        "user_id": user_id,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_agent": details.get("user_agent", "unknown")
    }
    await db.security_logs.insert_one(event)
    logger.info(f"Security event: {event_type} for user {user_id} from IP {ip_address}")
    return event

async def check_login_attempts(ip_address: str, email: str) -> tuple:
    """Check if too many failed login attempts"""
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
    
    failed_attempts = await db.security_logs.count_documents({
        "event_type": "login_failed",
        "$or": [
            {"ip_address": ip_address},
            {"details.email": email}
        ],
        "timestamp": {"$gte": cutoff}
    })
    
    if failed_attempts >= 5:
        return False, 15 - int((datetime.now(timezone.utc) - datetime.fromisoformat(cutoff.replace("Z", "+00:00"))).total_seconds() / 60)
    
    return True, 0

async def check_vpn_proxy(ip_address: str) -> dict:
    """Check if IP is a VPN, proxy, or datacenter IP"""
    if not ip_address or ip_address in ["unknown", "127.0.0.1", "localhost"]:
        return {"is_vpn": False, "is_proxy": False, "is_datacenter": False}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"http://ip-api.com/json/{ip_address}?fields=status,proxy,hosting")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    is_proxy = data.get("proxy", False)
                    is_hosting = data.get("hosting", False)
                    return {
                        "is_vpn": is_hosting,
                        "is_proxy": is_proxy,
                        "is_datacenter": is_hosting
                    }
    except Exception as e:
        logger.warning(f"VPN check failed for {ip_address}: {e}")
    
    return {"is_vpn": False, "is_proxy": False, "is_datacenter": False}

def get_client_ip(request: Request) -> str:
    """Extract client IP from request headers"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
