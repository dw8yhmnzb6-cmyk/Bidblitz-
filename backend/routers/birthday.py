"""Birthday Bonus Router - Automatic birthday rewards"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta, date
from pydantic import BaseModel
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/birthday", tags=["Birthday Bonus"])

# ==================== CONFIGURATION ====================

# Birthday bonus amounts by VIP level
BIRTHDAY_BONUSES = {
    "standard": 10,      # 10 free bids
    "vip": 15,           # 15 free bids
    "vip_gold": 20,      # 20 free bids
    "vip_platinum": 25,  # 25 free bids
    "vip_diamond": 30    # 30 free bids
}

# ==================== SCHEMAS ====================

class BirthdayUpdate(BaseModel):
    birthday: str  # Format: YYYY-MM-DD

# ==================== ENDPOINTS ====================

@router.post("/set")
async def set_birthday(data: BirthdayUpdate, user: dict = Depends(get_current_user)):
    """Set or update user's birthday (can only be set once per year)"""
    user_id = user["id"]
    
    try:
        birthday = datetime.strptime(data.birthday, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Ungültiges Datumsformat. Verwende YYYY-MM-DD")
    
    # Validate birthday is in the past
    if birthday >= date.today():
        raise HTTPException(status_code=400, detail="Geburtstag muss in der Vergangenheit liegen")
    
    # Check if user already set birthday this year
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if user_data and user_data.get("birthday_set_at"):
        set_date = datetime.fromisoformat(user_data["birthday_set_at"].replace("Z", "+00:00"))
        if set_date.year == datetime.now().year:
            raise HTTPException(
                status_code=400, 
                detail="Du hast deinen Geburtstag dieses Jahr bereits gesetzt"
            )
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "birthday": data.birthday,
            "birthday_set_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    logger.info(f"Birthday set for user {user_id}: {data.birthday}")
    
    return {
        "success": True,
        "message": "Geburtstag gespeichert! Du erhältst an deinem Geburtstag Gratis-Gebote.",
        "birthday": data.birthday
    }

@router.get("/status")
async def get_birthday_status(user: dict = Depends(get_current_user)):
    """Check birthday status and bonus eligibility"""
    user_id = user["id"]
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    birthday_str = user_data.get("birthday")
    
    if not birthday_str:
        return {
            "has_birthday": False,
            "message": "Setze deinen Geburtstag um Gratis-Gebote zu erhalten!"
        }
    
    # Check VIP level for bonus amount
    vip_level = user_data.get("vip_level") or user_data.get("vip_tier") or "standard"
    bonus_amount = BIRTHDAY_BONUSES.get(vip_level, BIRTHDAY_BONUSES["standard"])
    
    # Check if today is birthday
    today = date.today()
    birthday = datetime.strptime(birthday_str, "%Y-%m-%d").date()
    is_birthday = (today.month == birthday.month and today.day == birthday.day)
    
    # Calculate days until next birthday
    next_birthday = birthday.replace(year=today.year)
    if next_birthday < today:
        next_birthday = next_birthday.replace(year=today.year + 1)
    days_until = (next_birthday - today).days
    
    # Check if bonus was already claimed this year
    current_year = today.year
    claimed = await db.birthday_bonuses.find_one({
        "user_id": user_id,
        "year": current_year
    })
    
    return {
        "has_birthday": True,
        "birthday": birthday_str,
        "is_birthday_today": is_birthday,
        "days_until_birthday": days_until,
        "bonus_amount": bonus_amount,
        "vip_level": vip_level,
        "already_claimed": claimed is not None,
        "can_claim": is_birthday and claimed is None
    }

@router.post("/claim")
async def claim_birthday_bonus(user: dict = Depends(get_current_user)):
    """Claim birthday bonus (only on birthday)"""
    user_id = user["id"]
    
    status = await get_birthday_status(user)
    
    if not status.get("has_birthday"):
        raise HTTPException(status_code=400, detail="Bitte setze zuerst deinen Geburtstag")
    
    if not status.get("is_birthday_today"):
        raise HTTPException(
            status_code=400, 
            detail=f"Du kannst deinen Bonus nur an deinem Geburtstag abholen. Noch {status['days_until_birthday']} Tage!"
        )
    
    if status.get("already_claimed"):
        raise HTTPException(status_code=400, detail="Du hast deinen Geburtstags-Bonus dieses Jahr bereits abgeholt")
    
    bonus_amount = status["bonus_amount"]
    current_year = date.today().year
    
    # Record claim
    bonus_record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "year": current_year,
        "bonus_amount": bonus_amount,
        "vip_level": status["vip_level"],
        "claimed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.birthday_bonuses.insert_one(bonus_record)
    
    # Add bids to user
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids": bonus_amount}}
    )
    
    logger.info(f"Birthday bonus claimed: {user_id} got {bonus_amount} bids")
    
    return {
        "success": True,
        "message": f"🎂 Happy Birthday! {bonus_amount} Gratis-Gebote gutgeschrieben!",
        "bonus_amount": bonus_amount
    }

@router.get("/upcoming")
async def get_upcoming_birthdays(admin: dict = Depends(get_admin_user)):
    """Get upcoming birthdays (admin only, for sending wishes)"""
    today = date.today()
    
    # Get users with birthdays in next 7 days
    users = await db.users.find(
        {"birthday": {"$exists": True, "$ne": None}},
        {"_id": 0, "id": 1, "email": 1, "username": 1, "birthday": 1}
    ).to_list(1000)
    
    upcoming = []
    for user in users:
        try:
            birthday = datetime.strptime(user["birthday"], "%Y-%m-%d").date()
            next_bd = birthday.replace(year=today.year)
            if next_bd < today:
                next_bd = next_bd.replace(year=today.year + 1)
            
            days_until = (next_bd - today).days
            
            if 0 <= days_until <= 7:
                upcoming.append({
                    "user_id": user["id"],
                    "email": user.get("email"),
                    "username": user.get("username"),
                    "birthday": user["birthday"],
                    "days_until": days_until,
                    "is_today": days_until == 0
                })
        except:
            pass
    
    upcoming.sort(key=lambda x: x["days_until"])
    
    return {"upcoming_birthdays": upcoming}


birthday_router = router
