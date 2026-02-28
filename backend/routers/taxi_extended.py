"""
Taxi Extended Features:
1. Book for others (family/friends)
2. Scheduled rides (future booking)
3. Business accounts (company billing)
4. Post-ride rating popup
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid

from dependencies import get_current_user, get_admin_user
from config import db

router = APIRouter(prefix="/taxi/extended", tags=["Taxi Extended"])


# ==================== 1. BOOK FOR OTHERS ====================

class BookForOther(BaseModel):
    name: str
    phone: str
    note: Optional[str] = None

@router.post("/contacts/save")
async def save_contact(data: BookForOther, user: dict = Depends(get_current_user)):
    await db.taxi_contacts.update_one(
        {"user_id": user["id"], "phone": data.phone},
        {"$set": {"user_id": user["id"], "name": data.name, "phone": data.phone, "note": data.note, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"success": True, "message": f"Kontakt '{data.name}' gespeichert"}

@router.get("/contacts")
async def get_contacts(user: dict = Depends(get_current_user)):
    contacts = await db.taxi_contacts.find({"user_id": user["id"]}, {"_id": 0}).to_list(20)
    return {"contacts": contacts}

@router.delete("/contacts/{phone}")
async def delete_contact(phone: str, user: dict = Depends(get_current_user)):
    await db.taxi_contacts.delete_one({"user_id": user["id"], "phone": phone})
    return {"success": True}


# ==================== 2. SCHEDULED RIDES ====================

class ScheduleRide(BaseModel):
    pickup_lat: float
    pickup_lng: float
    pickup_address: str
    dropoff_lat: float
    dropoff_lng: float
    dropoff_address: str
    vehicle_type: str = "standard"
    scheduled_at: str  # ISO datetime
    for_name: Optional[str] = None
    for_phone: Optional[str] = None
    note: Optional[str] = None

@router.post("/schedule")
async def schedule_ride(data: ScheduleRide, user: dict = Depends(get_current_user)):
    scheduled = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
    if scheduled < datetime.now(timezone.utc) + timedelta(minutes=15):
        raise HTTPException(400, "Terminfahrt muss mindestens 15 Minuten in der Zukunft liegen")
    if scheduled > datetime.now(timezone.utc) + timedelta(days=7):
        raise HTTPException(400, "Maximale Vorausbuchung: 7 Tage")

    ride = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "type": "scheduled",
        "status": "scheduled",
        "pickup": {"address": data.pickup_address, "lat": data.pickup_lat, "lng": data.pickup_lng},
        "dropoff": {"address": data.dropoff_address, "lat": data.dropoff_lat, "lng": data.dropoff_lng},
        "vehicle_type": data.vehicle_type,
        "scheduled_at": scheduled.isoformat(),
        "for_name": data.for_name,
        "for_phone": data.for_phone,
        "note": data.note,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.taxi_scheduled_rides.insert_one(ride)
    ride.pop("_id", None)
    return {"success": True, "ride": ride, "message": f"Terminfahrt für {scheduled.strftime('%d.%m.%Y %H:%M')} gebucht"}

@router.get("/scheduled")
async def get_scheduled_rides(user: dict = Depends(get_current_user)):
    rides = await db.taxi_scheduled_rides.find(
        {"user_id": user["id"], "status": {"$in": ["scheduled", "dispatched"]}},
        {"_id": 0}
    ).sort("scheduled_at", 1).to_list(20)
    return {"rides": rides}

@router.delete("/scheduled/{ride_id}")
async def cancel_scheduled(ride_id: str, user: dict = Depends(get_current_user)):
    result = await db.taxi_scheduled_rides.update_one(
        {"id": ride_id, "user_id": user["id"], "status": "scheduled"},
        {"$set": {"status": "cancelled"}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Nicht gefunden oder bereits gestartet")
    return {"success": True, "message": "Terminfahrt storniert"}


# ==================== 3. BUSINESS ACCOUNTS ====================

class BusinessAccount(BaseModel):
    company_name: str
    tax_id: Optional[str] = None
    billing_email: str
    billing_address: Optional[str] = None
    monthly_limit: float = 5000

@router.post("/business/register")
async def register_business(data: BusinessAccount, user: dict = Depends(get_current_user)):
    existing = await db.taxi_business_accounts.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(409, "Bereits ein Firmenkonto vorhanden")

    account = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "company_name": data.company_name,
        "tax_id": data.tax_id,
        "billing_email": data.billing_email,
        "billing_address": data.billing_address,
        "monthly_limit_cents": int(data.monthly_limit * 100),
        "current_month_spent_cents": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.taxi_business_accounts.insert_one(account)
    account.pop("_id", None)
    return {"success": True, "account": account, "message": f"Firmenkonto '{data.company_name}' erstellt"}

@router.get("/business/my")
async def get_business_account(user: dict = Depends(get_current_user)):
    account = await db.taxi_business_accounts.find_one({"user_id": user["id"]}, {"_id": 0})
    # Get monthly rides
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0).isoformat()
    rides = await db.taxi_rides.find(
        {"rider_user_id": user["id"], "status": "completed", "completed_at": {"$gte": month_start}},
        {"_id": 0, "id": 1, "final_fare": 1, "completed_at": 1, "pickup": 1, "dropoff": 1}
    ).to_list(100)
    return {"account": account, "monthly_rides": rides, "monthly_total": sum(r.get("final_fare", 0) for r in rides)}

@router.get("/business/invoice")
async def get_monthly_invoice(month: int = None, year: int = None, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    m = month or now.month
    y = year or now.year
    start = datetime(y, m, 1, tzinfo=timezone.utc).isoformat()
    if m == 12:
        end = datetime(y + 1, 1, 1, tzinfo=timezone.utc).isoformat()
    else:
        end = datetime(y, m + 1, 1, tzinfo=timezone.utc).isoformat()

    account = await db.taxi_business_accounts.find_one({"user_id": user["id"]}, {"_id": 0})
    rides = await db.taxi_rides.find(
        {"rider_user_id": user["id"], "status": "completed", "completed_at": {"$gte": start, "$lt": end}},
        {"_id": 0, "tracking": 0}
    ).to_list(500)

    total = sum(r.get("final_fare", 0) for r in rides)
    return {
        "invoice": {
            "company": account.get("company_name") if account else None,
            "tax_id": account.get("tax_id") if account else None,
            "month": m, "year": y,
            "total_rides": len(rides),
            "total_amount": round(total, 2),
            "rides": rides
        }
    }


# ==================== 4. POST-RIDE RATING ====================

class PostRideRating(BaseModel):
    ride_id: str
    driver_rating: int  # 1-5
    comment: Optional[str] = None
    tip_amount: Optional[float] = None

@router.post("/rate-ride")
async def rate_ride(data: PostRideRating, user: dict = Depends(get_current_user)):
    if not 1 <= data.driver_rating <= 5:
        raise HTTPException(400, "Bewertung muss 1-5 sein")

    ride = await db.taxi_rides.find_one({"id": data.ride_id, "rider_user_id": user["id"], "status": "completed"})
    if not ride:
        raise HTTPException(404, "Fahrt nicht gefunden")
    if ride.get("rating_driver") is not None:
        raise HTTPException(409, "Bereits bewertet")

    now = datetime.now(timezone.utc).isoformat()
    await db.taxi_rides.update_one({"id": data.ride_id}, {"$set": {"rating_driver": data.driver_rating}})

    await db.taxi_ride_ratings.insert_one({
        "id": str(uuid.uuid4()), "ride_id": data.ride_id,
        "from_user_id": user["id"], "to_user_id": ride.get("driver_user_id"),
        "type": "rider_to_driver", "rating": data.driver_rating,
        "comment": data.comment, "created_at": now
    })

    # Update driver average
    if ride.get("driver_user_id"):
        pipeline = [{"$match": {"to_user_id": ride["driver_user_id"], "type": "rider_to_driver"}}, {"$group": {"_id": None, "avg": {"$avg": "$rating"}}}]
        result = await db.taxi_ride_ratings.aggregate(pipeline).to_list(1)
        if result:
            await db.taxi_driver_profiles.update_one({"user_id": ride["driver_user_id"]}, {"$set": {"rating_avg": round(result[0]["avg"], 1)}})

    # Tip
    if data.tip_amount and data.tip_amount > 0:
        tip_cents = int(data.tip_amount * 100)
        await db.users.update_one({"id": user["id"]}, {"$inc": {"wallet_balance_cents": -tip_cents}})
        await db.taxi_rides.update_one({"id": data.ride_id}, {"$inc": {"tip_amount": data.tip_amount}})
        if ride.get("driver_user_id"):
            await db.users.update_one({"id": ride["driver_user_id"]}, {"$inc": {"wallet_balance_cents": tip_cents}})
        await db.wallet_transactions.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "type": "tip", "amount_cents": tip_cents, "direction": "out", "related_ride_id": data.ride_id, "created_at": now})

    return {"success": True, "message": "Danke für Ihre Bewertung!" + (f" Trinkgeld: {data.tip_amount:.2f} EUR" if data.tip_amount else "")}

@router.get("/pending-rating")
async def get_pending_rating(user: dict = Depends(get_current_user)):
    ride = await db.taxi_rides.find_one(
        {"rider_user_id": user["id"], "status": "completed", "rating_driver": None},
        {"_id": 0, "tracking": 0}
    )
    return {"ride": ride}
