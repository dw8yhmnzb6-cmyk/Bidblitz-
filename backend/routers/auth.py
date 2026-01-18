"""Authentication router - Login, Register, 2FA, Password Reset"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
import uuid
import random
import resend

from config import db, logger, RESEND_API_KEY, SENDER_EMAIL, REFERRAL_MIN_DEPOSIT, REFERRAL_REWARD_BIDS
from dependencies import (
    hash_password, verify_password, validate_password_strength, create_token,
    get_current_user, generate_2fa_secret, generate_2fa_qr_code, verify_2fa_code,
    log_security_event, check_login_attempts, check_vpn_proxy, get_client_ip
)
from schemas import (
    UserCreate, UserLogin, ForgotPasswordRequest, VerifyResetCodeRequest,
    ResetPasswordRequest, TwoFactorEnable, TwoFactorDisable
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

if RESEND_API_KEY and RESEND_API_KEY != 're_123_placeholder':
    resend.api_key = RESEND_API_KEY

# ==================== REGISTER ====================

@router.post("/register")
async def register(user: UserCreate, request: Request):
    client_ip = get_client_ip(request)
    
    # Check VPN/Proxy
    vpn_check = await check_vpn_proxy(client_ip)
    if vpn_check.get("is_vpn") or vpn_check.get("is_proxy") or vpn_check.get("is_datacenter"):
        await log_security_event("registration_blocked_vpn", "unknown", {
            "email": user.email,
            "vpn_check": vpn_check
        }, client_ip)
        raise HTTPException(
            status_code=403,
            detail="VPN, Proxy oder Datacenter-Verbindungen sind nicht erlaubt. Bitte deaktivieren Sie Ihren VPN und versuchen Sie es erneut."
        )
    
    # Check IP registration limit
    existing_from_ip = await db.users.count_documents({"registration_ip": client_ip})
    if existing_from_ip >= 2:
        await log_security_event("registration_blocked_ip_limit", "unknown", {
            "email": user.email,
            "existing_accounts": existing_from_ip
        }, client_ip)
        raise HTTPException(
            status_code=403,
            detail="Maximal 2 Konten pro Haushalt erlaubt. Kontaktieren Sie den Support bei Fragen."
        )
    
    # Check if email exists
    existing = await db.users.find_one({"email": user.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    
    # Validate password strength
    is_valid, message = validate_password_strength(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Handle referral
    referred_by = None
    if user.referral_code:
        referrer = await db.users.find_one({"referral_code": user.referral_code.upper()})
        if referrer:
            referred_by = referrer["id"]
    
    user_id = str(uuid.uuid4())
    referral_code = user_id[:8].upper()
    
    new_user = {
        "id": user_id,
        "email": user.email.lower(),
        "password": hash_password(user.password),
        "name": user.name,
        "bids_balance": 10,  # Welcome bids
        "is_admin": False,
        "is_blocked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "won_auctions": [],
        "total_bids_placed": 0,
        "source": user.source,
        "referral_code": referral_code,
        "referred_by": referred_by,
        "referral_reward_pending": referred_by is not None,  # Reward pending until €5 deposit
        "total_deposits": 0.0,
        "registration_ip": client_ip,
        "last_login_ip": None,
        "two_factor_secret": None,
        "two_factor_enabled": False
    }
    
    await db.users.insert_one(new_user)
    
    # Log successful registration
    await log_security_event("registration_success", user_id, {
        "email": user.email,
        "referred_by": referred_by
    }, client_ip)
    
    token = create_token(user_id)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": new_user["email"],
            "name": new_user["name"],
            "bids_balance": new_user["bids_balance"],
            "is_admin": False,
            "referral_code": referral_code
        }
    }

# ==================== LOGIN ====================

@router.post("/login")
async def login(credentials: UserLogin, request: Request):
    client_ip = get_client_ip(request)
    
    # Check login attempts
    can_login, wait_minutes = await check_login_attempts(client_ip, credentials.email)
    if not can_login:
        raise HTTPException(
            status_code=429,
            detail=f"Zu viele fehlgeschlagene Anmeldeversuche. Bitte warten Sie {wait_minutes} Minuten."
        )
    
    user = await db.users.find_one({"email": credentials.email.lower()}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user["password"]):
        await log_security_event("login_failed", user["id"] if user else "unknown", {
            "email": credentials.email,
            "reason": "invalid_credentials"
        }, client_ip)
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")
    
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Konto gesperrt. Kontaktieren Sie den Support.")
    
    # Check 2FA
    if user.get("two_factor_enabled") and user.get("two_factor_secret"):
        if not credentials.two_factor_code:
            return {"requires_2fa": True, "message": "Bitte geben Sie Ihren 2FA-Code ein"}
        
        if not verify_2fa_code(user["two_factor_secret"], credentials.two_factor_code):
            await log_security_event("login_failed_2fa", user["id"], {
                "email": credentials.email,
                "reason": "invalid_2fa_code"
            }, client_ip)
            raise HTTPException(status_code=401, detail="Ungültiger 2FA-Code")
    
    # Update last login IP
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login_ip": client_ip}}
    )
    
    await log_security_event("login_success", user["id"], {
        "email": credentials.email
    }, client_ip)
    
    token = create_token(user["id"], user.get("is_admin", False))
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "bids_balance": user["bids_balance"],
            "is_admin": user.get("is_admin", False),
            "two_factor_enabled": user.get("two_factor_enabled", False)
        }
    }

# ==================== GET CURRENT USER ====================

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "bids_balance": user["bids_balance"],
        "is_admin": user.get("is_admin", False),
        "referral_code": user.get("referral_code", user["id"][:8].upper()),
        "two_factor_enabled": user.get("two_factor_enabled", False)
    }

# ==================== PASSWORD RESET ====================

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = await db.users.find_one({"email": request.email.lower()})
    
    reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    await db.password_resets.delete_many({"email": request.email.lower()})
    await db.password_resets.insert_one({
        "email": request.email.lower(),
        "code": reset_code,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response = {"message": "Falls ein Konto existiert, wurde eine E-Mail gesendet"}
    
    if user and RESEND_API_KEY and RESEND_API_KEY != 're_123_placeholder':
        try:
            resend.Emails.send({
                "from": SENDER_EMAIL,
                "to": [request.email],
                "subject": f"Ihr Passwort-Reset-Code: {reset_code}",
                "html": f"""
                <h2>Passwort zurücksetzen</h2>
                <p>Ihr Code lautet: <strong>{reset_code}</strong></p>
                <p>Gültig für 15 Minuten.</p>
                """
            })
        except Exception as e:
            logger.error(f"Failed to send reset email: {e}")
    else:
        response["demo_code"] = reset_code
    
    return response

@router.post("/verify-reset-code")
async def verify_reset_code(request: VerifyResetCodeRequest):
    reset = await db.password_resets.find_one({
        "email": request.email.lower(),
        "code": request.code
    })
    
    if not reset:
        raise HTTPException(status_code=400, detail="Ungültiger Code")
    
    if datetime.fromisoformat(reset["expires_at"].replace("Z", "+00:00")) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code abgelaufen")
    
    return {"valid": True}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    reset = await db.password_resets.find_one({
        "email": request.email.lower(),
        "code": request.code
    })
    
    if not reset:
        raise HTTPException(status_code=400, detail="Ungültiger Code")
    
    if datetime.fromisoformat(reset["expires_at"].replace("Z", "+00:00")) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code abgelaufen")
    
    is_valid, message = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    await db.users.update_one(
        {"email": request.email.lower()},
        {"$set": {"password": hash_password(request.new_password)}}
    )
    
    await db.password_resets.delete_many({"email": request.email.lower()})
    
    return {"message": "Passwort erfolgreich geändert"}

# ==================== 2FA ENDPOINTS ====================

@router.post("/2fa/setup")
async def setup_2fa(user: dict = Depends(get_current_user)):
    if user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA ist bereits aktiviert")
    
    secret = generate_2fa_secret()
    qr_code = generate_2fa_qr_code(user["email"], secret)
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"two_factor_secret": secret}}
    )
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "message": "Scannen Sie den QR-Code mit Ihrer Authenticator-App"
    }

@router.post("/2fa/enable")
async def enable_2fa(request: TwoFactorEnable, user: dict = Depends(get_current_user)):
    if user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA ist bereits aktiviert")
    
    secret = user.get("two_factor_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="Bitte richten Sie zuerst 2FA ein")
    
    if not verify_2fa_code(secret, request.code):
        raise HTTPException(status_code=400, detail="Ungültiger Code")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"two_factor_enabled": True}}
    )
    
    await log_security_event("2fa_enabled", user["id"], {"email": user["email"]})
    
    return {"message": "2FA erfolgreich aktiviert"}

@router.post("/2fa/disable")
async def disable_2fa(request: TwoFactorDisable, user: dict = Depends(get_current_user)):
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA ist nicht aktiviert")
    
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Falsches Passwort")
    
    if not verify_2fa_code(user["two_factor_secret"], request.code):
        raise HTTPException(status_code=400, detail="Ungültiger 2FA-Code")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"two_factor_enabled": False, "two_factor_secret": None}}
    )
    
    await log_security_event("2fa_disabled", user["id"], {"email": user["email"]})
    
    return {"message": "2FA erfolgreich deaktiviert"}
