"""Vouchers router - Voucher management with bulk creation and euro values"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
import uuid
import random
import string

from config import db, logger
from dependencies import get_admin_user, get_current_user

router = APIRouter(tags=["Vouchers"])

# ==================== SCHEMAS ====================

class VoucherCreate(BaseModel):
    code: Optional[str] = None  # Auto-generate if empty
    type: str = "bids"  # bids, discount, euro
    value: int = 10
    max_uses: int = 1
    expires_days: Optional[int] = 30

class BulkVoucherCreate(BaseModel):
    count: int = 10  # How many vouchers to create
    type: str = "bids"  # bids, discount, euro
    value: int = 10
    max_uses: int = 1
    expires_days: Optional[int] = 30
    prefix: str = ""  # Optional prefix like "NEUJAHR"

class VoucherRedeemRequest(BaseModel):
    code: str

# ==================== HELPER FUNCTIONS ====================

def generate_voucher_code(prefix: str = "", length: int = 8) -> str:
    """Generate a random voucher code"""
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=length))
    if prefix:
        return f"{prefix.upper()}-{random_part}"
    return random_part

# Euro to Bids conversion rate (configurable)
EURO_TO_BIDS_RATE = 5  # 1€ = 5 bids

def euro_to_bids(euro: int) -> int:
    """Convert euro value to bids"""
    return euro * EURO_TO_BIDS_RATE

# ==================== ADMIN ENDPOINTS ====================

@router.post("/admin/vouchers")
async def create_voucher(voucher: VoucherCreate, admin: dict = Depends(get_admin_user)):
    """Create a new voucher (admin only)"""
    # Generate code if not provided
    code = voucher.code.upper() if voucher.code else generate_voucher_code()
    
    # Check if code already exists
    existing = await db.vouchers.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Gutscheincode existiert bereits")
    
    # Calculate bids based on type
    if voucher.type == "euro":
        bids_value = euro_to_bids(voucher.value)
    elif voucher.type == "bids":
        bids_value = voucher.value
    else:
        bids_value = 0  # For discount type
    
    # Calculate expiry date
    expires_at = None
    if voucher.expires_days:
        expires_at = (datetime.now(timezone.utc) + timedelta(days=voucher.expires_days)).isoformat()
    
    voucher_id = str(uuid.uuid4())
    doc = {
        "id": voucher_id,
        "code": code,
        "type": voucher.type,
        "value": voucher.value,
        "bids": bids_value,
        "max_uses": voucher.max_uses,
        "used_count": 0,
        "used_by": [],
        "is_active": True,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin.get("email", "admin")
    }
    await db.vouchers.insert_one(doc)
    
    logger.info(f"Voucher {code} created: {voucher.type} = {voucher.value}")
    
    # Return without _id
    doc.pop("_id", None)
    return doc


@router.post("/admin/vouchers/bulk")
async def create_bulk_vouchers(bulk: BulkVoucherCreate, admin: dict = Depends(get_admin_user)):
    """Create multiple vouchers at once (admin only)"""
    if bulk.count < 1 or bulk.count > 100:
        raise HTTPException(status_code=400, detail="Anzahl muss zwischen 1 und 100 sein")
    
    # Calculate bids based on type
    if bulk.type == "euro":
        bids_value = euro_to_bids(bulk.value)
    elif bulk.type == "bids":
        bids_value = bulk.value
    else:
        bids_value = 0  # For discount type
    
    # Calculate expiry date
    expires_at = None
    if bulk.expires_days:
        expires_at = (datetime.now(timezone.utc) + timedelta(days=bulk.expires_days)).isoformat()
    
    created_vouchers = []
    created_codes = []
    
    for _ in range(bulk.count):
        # Generate unique code
        attempts = 0
        while attempts < 10:
            code = generate_voucher_code(bulk.prefix)
            existing = await db.vouchers.find_one({"code": code})
            if not existing and code not in created_codes:
                break
            attempts += 1
        
        if attempts >= 10:
            continue  # Skip if can't generate unique code
        
        voucher_id = str(uuid.uuid4())
        doc = {
            "id": voucher_id,
            "code": code,
            "type": bulk.type,
            "value": bulk.value,
            "bids": bids_value,
            "max_uses": bulk.max_uses,
            "used_count": 0,
            "used_by": [],
            "is_active": True,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": admin.get("email", "admin")
        }
        
        await db.vouchers.insert_one(doc)
        created_codes.append(code)
        doc.pop("_id", None)
        created_vouchers.append(doc)
    
    logger.info(f"Bulk vouchers created: {len(created_vouchers)} x {bulk.type}={bulk.value}")
    
    return {
        "message": f"{len(created_vouchers)} Gutscheine erstellt!",
        "count": len(created_vouchers),
        "vouchers": created_vouchers,
        "codes": created_codes
    }


@router.get("/admin/vouchers")
async def get_vouchers(admin: dict = Depends(get_admin_user)):
    """Get all vouchers (admin only)"""
    vouchers = await db.vouchers.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return vouchers


@router.put("/admin/vouchers/{voucher_id}/toggle")
async def toggle_voucher(voucher_id: str, admin: dict = Depends(get_admin_user)):
    """Toggle voucher active status (admin only)"""
    voucher = await db.vouchers.find_one({"id": voucher_id})
    if not voucher:
        raise HTTPException(status_code=404, detail="Gutschein nicht gefunden")
    
    new_status = not voucher.get("is_active", True)
    await db.vouchers.update_one(
        {"id": voucher_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"message": "Status geändert", "is_active": new_status}


@router.delete("/admin/vouchers/{voucher_id}")
async def delete_voucher(voucher_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a voucher (admin only)"""
    result = await db.vouchers.delete_one({"id": voucher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gutschein nicht gefunden")
    return {"message": "Gutschein gelöscht"}


@router.delete("/admin/vouchers/bulk/unused")
async def delete_unused_vouchers(admin: dict = Depends(get_admin_user)):
    """Delete all unused vouchers (admin only)"""
    result = await db.vouchers.delete_many({"used_count": 0})
    return {"message": f"{result.deleted_count} unbenutzte Gutscheine gelöscht"}


# ==================== USER ENDPOINTS ====================

@router.post("/vouchers/redeem")
async def redeem_voucher(request: VoucherRedeemRequest, user: dict = Depends(get_current_user)):
    """Redeem a voucher code"""
    code = request.code.upper().strip()
    voucher = await db.vouchers.find_one({"code": code}, {"_id": 0})
    
    if not voucher:
        raise HTTPException(status_code=404, detail="Ungültiger Gutscheincode")
    
    # Check if active
    if not voucher.get("is_active", True):
        raise HTTPException(status_code=400, detail="Gutschein ist deaktiviert")
    
    # Check if already used by this user
    if user["id"] in voucher.get("used_by", []):
        raise HTTPException(status_code=400, detail="Gutschein bereits eingelöst")
    
    # Check max uses
    if voucher.get("used_count", 0) >= voucher.get("max_uses", 1):
        raise HTTPException(status_code=400, detail="Gutschein ist ausgeschöpft")
    
    # Check expiry
    if voucher.get("expires_at"):
        try:
            expires = datetime.fromisoformat(voucher["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires:
                raise HTTPException(status_code=400, detail="Gutschein ist abgelaufen")
        except:
            pass
    
    # Process based on type
    voucher_type = voucher.get("type", "bids")
    value = voucher.get("value", 0)
    bids = voucher.get("bids", value)
    
    result_message = ""
    
    if voucher_type == "bids" or voucher_type == "euro":
        # Credit bids
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"bids_balance": bids}}
        )
        if voucher_type == "euro":
            result_message = f"€{value} Gutschein eingelöst! {bids} Gebote gutgeschrieben!"
        else:
            result_message = f"{bids} Gebote gutgeschrieben!"
    
    elif voucher_type == "discount":
        # Store discount for next purchase
        discount_code = f"VDISC{user['id'][:8].upper()}{random.randint(100, 999)}"
        await db.discount_codes.insert_one({
            "code": discount_code,
            "user_id": user["id"],
            "discount_percent": value,
            "valid_until": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "used": False,
            "from_voucher": voucher["code"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        result_message = f"{value}% Rabatt aktiviert! Code: {discount_code}"
    
    # Update voucher usage
    await db.vouchers.update_one(
        {"id": voucher["id"]},
        {
            "$inc": {"used_count": 1},
            "$push": {"used_by": user["id"]}
        }
    )
    
    logger.info(f"User {user['email']} redeemed voucher {code} ({voucher_type}={value})")
    
    return {
        "message": result_message,
        "type": voucher_type,
        "value": value,
        "bids_added": bids if voucher_type in ["bids", "euro"] else 0
    }
