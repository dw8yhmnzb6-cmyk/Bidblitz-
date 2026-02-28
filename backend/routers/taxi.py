"""
BidBlitz Taxi - Complete Ride-Hailing System
Booking, Driver Matching, Live Tracking, Auto-Payment with Commission
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid, random, math

from dependencies import get_current_user, get_admin_user
from config import db

router = APIRouter(prefix="/taxi", tags=["Taxi"])

# Pricing
BASE_FARE_CENTS = 300       # 3 EUR
PER_KM_CENTS = 150          # 1.50 EUR/km
PER_MIN_CENTS = 30           # 0.30 EUR/min
MIN_FARE_CENTS = 500         # 5 EUR minimum
PLATFORM_COMMISSION = 0.20   # 20%


def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2-lat1), math.radians(lng2-lng1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def estimate_fare(distance_km, duration_min):
    fare = BASE_FARE_CENTS + int(distance_km * PER_KM_CENTS) + int(duration_min * PER_MIN_CENTS)
    return max(fare, MIN_FARE_CENTS)


# ==================== SCHEMAS ====================

class RideRequest(BaseModel):
    pickup_lat: float
    pickup_lng: float
    pickup_address: str
    dropoff_lat: float
    dropoff_lng: float
    dropoff_address: str
    vehicle_type: str = "standard"  # standard, comfort, xl

class DriverRegister(BaseModel):
    vehicle_type: str = "standard"
    vehicle_make: str = ""
    vehicle_model: str = ""
    vehicle_color: str = ""
    license_plate: str = ""

class DriverLocation(BaseModel):
    lat: float
    lng: float

class RideAction(BaseModel):
    action: str  # accept, arrive, start, complete, cancel


# ==================== CUSTOMER ENDPOINTS ====================

@router.post("/request-ride")
async def request_ride(data: RideRequest, user: dict = Depends(get_current_user)):
    """Customer requests a ride"""
    # Check no active ride
    active = await db.taxi_rides.find_one({"customer_id": user["id"], "status": {"$in": ["requested", "accepted", "arrived", "in_progress"]}})
    if active:
        raise HTTPException(409, "Sie haben bereits eine aktive Fahrt")

    distance_km = round(haversine_km(data.pickup_lat, data.pickup_lng, data.dropoff_lat, data.dropoff_lng), 1)
    duration_min = round(distance_km * 2.5, 0)  # ~24 km/h average city speed
    fare_cents = estimate_fare(distance_km, duration_min)

    ride_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    ride = {
        "id": ride_id,
        "customer_id": user["id"],
        "customer_name": user.get("name"),
        "customer_phone": user.get("phone"),
        "driver_id": None,
        "driver_name": None,
        "pickup": {"lat": data.pickup_lat, "lng": data.pickup_lng, "address": data.pickup_address},
        "dropoff": {"lat": data.dropoff_lat, "lng": data.dropoff_lng, "address": data.dropoff_address},
        "vehicle_type": data.vehicle_type,
        "distance_km": distance_km,
        "estimated_duration_min": duration_min,
        "estimated_fare_cents": fare_cents,
        "final_fare_cents": None,
        "commission_cents": None,
        "driver_earnings_cents": None,
        "status": "requested",  # requested, accepted, arrived, in_progress, completed, cancelled
        "requested_at": now,
        "accepted_at": None,
        "arrived_at": None,
        "started_at": None,
        "completed_at": None,
        "cancelled_at": None,
        "cancel_reason": None,
        "rating_customer": None,
        "rating_driver": None,
        "tracking": []
    }

    await db.taxi_rides.insert_one(ride)
    ride.pop("_id", None)

    return {
        "success": True,
        "ride": ride,
        "estimate": {
            "distance_km": distance_km,
            "duration_min": duration_min,
            "fare_cents": fare_cents,
            "fare_eur": round(fare_cents / 100, 2)
        },
        "message": f"Fahrt angefragt! Geschätzt: {distance_km}km, ~{int(duration_min)} Min, {fare_cents/100:.2f} EUR"
    }


@router.get("/my-ride")
async def get_active_ride(user: dict = Depends(get_current_user)):
    """Get customer's active ride"""
    ride = await db.taxi_rides.find_one(
        {"customer_id": user["id"], "status": {"$in": ["requested", "accepted", "arrived", "in_progress"]}},
        {"_id": 0}
    )
    return {"ride": ride}


@router.post("/cancel-ride/{ride_id}")
async def cancel_ride(ride_id: str, reason: str = "Kunde storniert", user: dict = Depends(get_current_user)):
    """Customer cancels a ride"""
    ride = await db.taxi_rides.find_one({"id": ride_id, "customer_id": user["id"]})
    if not ride:
        raise HTTPException(404, "Fahrt nicht gefunden")
    if ride["status"] not in ["requested", "accepted"]:
        raise HTTPException(409, "Fahrt kann nicht mehr storniert werden")

    await db.taxi_rides.update_one({"id": ride_id}, {"$set": {
        "status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat(), "cancel_reason": reason
    }})
    return {"success": True, "message": "Fahrt storniert"}


@router.get("/estimate")
async def get_fare_estimate(pickup_lat: float, pickup_lng: float, dropoff_lat: float, dropoff_lng: float):
    """Get fare estimate without booking"""
    dist = round(haversine_km(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng), 1)
    dur = round(dist * 2.5, 0)
    fare = estimate_fare(dist, dur)
    return {
        "distance_km": dist, "duration_min": dur,
        "fare_cents": fare, "fare_eur": round(fare / 100, 2),
        "breakdown": {"base": BASE_FARE_CENTS/100, "per_km": PER_KM_CENTS/100, "per_min": PER_MIN_CENTS/100}
    }


@router.get("/history")
async def get_ride_history(user: dict = Depends(get_current_user)):
    """Get ride history"""
    rides = await db.taxi_rides.find(
        {"$or": [{"customer_id": user["id"]}, {"driver_id": user["id"]}]},
        {"_id": 0, "tracking": 0}
    ).sort("requested_at", -1).to_list(50)
    return {"rides": rides}


# ==================== DRIVER ENDPOINTS ====================

@router.post("/driver/register")
async def register_as_driver(data: DriverRegister, user: dict = Depends(get_current_user)):
    """Register as a taxi driver"""
    existing = await db.taxi_drivers.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(409, "Bereits als Fahrer registriert")

    driver = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "vehicle_type": data.vehicle_type,
        "vehicle": {"make": data.vehicle_make, "model": data.vehicle_model, "color": data.vehicle_color, "plate": data.license_plate},
        "status": "offline",  # offline, available, busy
        "is_approved": False,
        "rating": 5.0,
        "total_rides": 0,
        "total_earnings_cents": 0,
        "current_lat": None,
        "current_lng": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.taxi_drivers.insert_one(driver)
    driver.pop("_id", None)

    # Update user role
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_driver": True}})

    return {"success": True, "driver": driver, "message": "Fahrerregistrierung eingereicht. Wartet auf Genehmigung."}


@router.post("/driver/go-online")
async def driver_go_online(data: DriverLocation, user: dict = Depends(get_current_user)):
    """Driver goes online to accept rides"""
    driver = await db.taxi_drivers.find_one({"user_id": user["id"]})
    if not driver:
        raise HTTPException(404, "Nicht als Fahrer registriert")
    if not driver.get("is_approved"):
        raise HTTPException(403, "Fahrer noch nicht genehmigt")

    await db.taxi_drivers.update_one({"user_id": user["id"]}, {"$set": {
        "status": "available", "current_lat": data.lat, "current_lng": data.lng
    }})
    return {"success": True, "status": "available"}


@router.post("/driver/go-offline")
async def driver_go_offline(user: dict = Depends(get_current_user)):
    """Driver goes offline"""
    await db.taxi_drivers.update_one({"user_id": user["id"]}, {"$set": {"status": "offline"}})
    return {"success": True, "status": "offline"}


@router.post("/driver/update-location")
async def update_driver_location(data: DriverLocation, user: dict = Depends(get_current_user)):
    """Update driver's current location"""
    await db.taxi_drivers.update_one({"user_id": user["id"]}, {"$set": {
        "current_lat": data.lat, "current_lng": data.lng
    }})

    # If in active ride, add tracking point
    active_ride = await db.taxi_rides.find_one({"driver_id": user["id"], "status": "in_progress"})
    if active_ride:
        await db.taxi_rides.update_one({"id": active_ride["id"]}, {"$push": {"tracking": {
            "lat": data.lat, "lng": data.lng, "timestamp": datetime.now(timezone.utc).isoformat()
        }}})

    return {"success": True}


@router.get("/driver/available-rides")
async def get_available_rides(user: dict = Depends(get_current_user)):
    """Get rides waiting for a driver"""
    driver = await db.taxi_drivers.find_one({"user_id": user["id"]})
    if not driver or driver["status"] != "available":
        return {"rides": []}

    rides = await db.taxi_rides.find(
        {"status": "requested", "vehicle_type": driver.get("vehicle_type", "standard")},
        {"_id": 0, "tracking": 0}
    ).sort("requested_at", 1).to_list(10)

    return {"rides": rides}


@router.post("/driver/ride-action/{ride_id}")
async def driver_ride_action(ride_id: str, data: RideAction, user: dict = Depends(get_current_user)):
    """Driver performs action on a ride"""
    ride = await db.taxi_rides.find_one({"id": ride_id})
    if not ride:
        raise HTTPException(404, "Fahrt nicht gefunden")

    now = datetime.now(timezone.utc).isoformat()
    driver = await db.taxi_drivers.find_one({"user_id": user["id"]})

    if data.action == "accept":
        if ride["status"] != "requested":
            raise HTTPException(409, "Fahrt bereits vergeben")
        await db.taxi_rides.update_one({"id": ride_id}, {"$set": {
            "status": "accepted", "driver_id": user["id"], "driver_name": user.get("name"),
            "accepted_at": now
        }})
        await db.taxi_drivers.update_one({"user_id": user["id"]}, {"$set": {"status": "busy"}})
        return {"success": True, "message": "Fahrt angenommen! Fahren Sie zum Abholort."}

    elif data.action == "arrive":
        if ride["status"] != "accepted" or ride["driver_id"] != user["id"]:
            raise HTTPException(409, "Ungültig")
        await db.taxi_rides.update_one({"id": ride_id}, {"$set": {"status": "arrived", "arrived_at": now}})
        return {"success": True, "message": "Am Abholort angekommen. Warten auf Fahrgast."}

    elif data.action == "start":
        if ride["status"] != "arrived" or ride["driver_id"] != user["id"]:
            raise HTTPException(409, "Ungültig")
        await db.taxi_rides.update_one({"id": ride_id}, {"$set": {"status": "in_progress", "started_at": now}})
        return {"success": True, "message": "Fahrt gestartet!"}

    elif data.action == "complete":
        if ride["status"] != "in_progress" or ride["driver_id"] != user["id"]:
            raise HTTPException(409, "Ungültig")

        # Calculate final fare
        final_fare = ride["estimated_fare_cents"]
        commission = int(final_fare * PLATFORM_COMMISSION)
        driver_earnings = final_fare - commission

        await db.taxi_rides.update_one({"id": ride_id}, {"$set": {
            "status": "completed", "completed_at": now,
            "final_fare_cents": final_fare, "commission_cents": commission,
            "driver_earnings_cents": driver_earnings
        }})

        # Pay: deduct from customer wallet
        await db.users.update_one({"id": ride["customer_id"]}, {"$inc": {"wallet_balance_cents": -final_fare}})
        await db.wallet_ledger.insert_one({"id": str(uuid.uuid4()), "user_id": ride["customer_id"], "type": "debit", "amount_cents": final_fare, "category": "taxi_ride", "description": f"Taxi: {ride['pickup']['address']} -> {ride['dropoff']['address']}", "reference_id": f"taxi:{ride_id}", "created_at": now})

        # Platform commission
        platform = await db.users.find_one({"email": "platform@bidblitz.ae"})
        if platform:
            await db.users.update_one({"id": platform["id"]}, {"$inc": {"wallet_balance_cents": commission}})
            await db.wallet_ledger.insert_one({"id": str(uuid.uuid4()), "user_id": platform["id"], "type": "credit", "amount_cents": commission, "category": "commission", "description": f"Taxi Commission 20% - Ride {ride_id[:8]}", "reference_id": f"taxi:{ride_id}", "created_at": now})

        # Driver earnings
        await db.taxi_drivers.update_one({"user_id": user["id"]}, {"$inc": {"total_rides": 1, "total_earnings_cents": driver_earnings}, "$set": {"status": "available"}})

        return {"success": True, "fare_cents": final_fare, "commission_cents": commission, "driver_earnings_cents": driver_earnings, "message": f"Fahrt abgeschlossen! Verdienst: {driver_earnings/100:.2f} EUR"}

    elif data.action == "cancel":
        await db.taxi_rides.update_one({"id": ride_id}, {"$set": {"status": "cancelled", "cancelled_at": now, "cancel_reason": "Fahrer storniert"}})
        await db.taxi_drivers.update_one({"user_id": user["id"]}, {"$set": {"status": "available"}})
        return {"success": True, "message": "Fahrt storniert"}

    raise HTTPException(400, "Ungültige Aktion")


@router.get("/driver/my-stats")
async def get_driver_stats(user: dict = Depends(get_current_user)):
    """Get driver statistics"""
    driver = await db.taxi_drivers.find_one({"user_id": user["id"]}, {"_id": 0})
    if not driver:
        raise HTTPException(404, "Nicht als Fahrer registriert")
    return {"driver": driver}


# ==================== ADMIN ====================

@router.get("/admin/drivers")
async def admin_list_drivers(admin: dict = Depends(get_admin_user)):
    drivers = await db.taxi_drivers.find({}, {"_id": 0}).to_list(200)
    return {"drivers": drivers}

@router.post("/admin/approve-driver/{driver_id}")
async def admin_approve_driver(driver_id: str, admin: dict = Depends(get_admin_user)):
    await db.taxi_drivers.update_one({"id": driver_id}, {"$set": {"is_approved": True}})
    return {"success": True, "message": "Fahrer genehmigt"}

@router.get("/admin/rides")
async def admin_list_rides(limit: int = 50, admin: dict = Depends(get_admin_user)):
    rides = await db.taxi_rides.find({}, {"_id": 0, "tracking": 0}).sort("requested_at", -1).to_list(limit)
    return {"rides": rides}

@router.get("/admin/stats")
async def admin_taxi_stats(admin: dict = Depends(get_admin_user)):
    pipeline = [{"$match": {"status": "completed"}}, {"$group": {"_id": None, "total_fare": {"$sum": "$final_fare_cents"}, "total_commission": {"$sum": "$commission_cents"}, "count": {"$sum": 1}}}]
    result = await db.taxi_rides.aggregate(pipeline).to_list(1)
    s = result[0] if result else {}
    drivers = await db.taxi_drivers.count_documents({})
    online = await db.taxi_drivers.count_documents({"status": "available"})
    return {"total_rides": s.get("count", 0), "total_fare_cents": s.get("total_fare", 0), "total_commission_cents": s.get("total_commission", 0), "total_drivers": drivers, "online_drivers": online}
