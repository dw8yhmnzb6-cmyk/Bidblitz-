"""
BidBlitz Transport & Taxi System
Real-time ride tracking, driver ratings, saved routes
MongoDB-persistent storage
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from pydantic import BaseModel
from typing import Optional, List
import os
import random
import math

router = APIRouter(prefix="/transport", tags=["Transport & Taxi"])

# MongoDB Connection
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "bidblitz")
client = MongoClient(mongo_url)
db = client[db_name]

# Collections
rides_col = db["transport_rides"]
drivers_col = db["transport_drivers"]
ratings_col = db["transport_ratings"]
saved_routes_col = db["transport_saved_routes"]
ride_tracking_col = db["transport_tracking"]

# Pydantic Models
class RideRequest(BaseModel):
    pickup_lat: float
    pickup_lng: float
    pickup_address: str
    dropoff_lat: float
    dropoff_lng: float
    dropoff_address: str
    vehicle_type: str = "standard"  # standard, comfort, premium

class RatingRequest(BaseModel):
    ride_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    tip_amount: Optional[int] = 0

class SavedRoute(BaseModel):
    name: str
    pickup_lat: float
    pickup_lng: float
    pickup_address: str
    dropoff_lat: float
    dropoff_lng: float
    dropoff_address: str


# Helper Functions
def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance in km using Haversine formula"""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def calculate_price(distance_km: float, vehicle_type: str) -> dict:
    """Calculate ride price based on distance and vehicle type"""
    base_prices = {"standard": 3.0, "comfort": 5.0, "premium": 8.0}
    per_km_prices = {"standard": 1.2, "comfort": 1.8, "premium": 2.5}
    
    base = base_prices.get(vehicle_type, 3.0)
    per_km = per_km_prices.get(vehicle_type, 1.2)
    
    price = base + (distance_km * per_km)
    return {
        "base_fare": base,
        "distance_fare": round(distance_km * per_km, 2),
        "total": round(price, 2),
        "currency": "EUR"
    }

def generate_driver():
    """Generate a mock driver"""
    first_names = ["Max", "Anna", "Peter", "Maria", "Thomas", "Julia", "Michael", "Sarah"]
    last_names = ["Müller", "Schmidt", "Weber", "Fischer", "Meyer", "Wagner", "Becker", "Hoffmann"]
    
    return {
        "id": f"driver_{random.randint(10000, 99999)}",
        "name": f"{random.choice(first_names)} {random.choice(last_names)[0]}.",
        "rating": round(random.uniform(4.5, 5.0), 1),
        "total_rides": random.randint(100, 5000),
        "vehicle": {
            "model": random.choice(["VW Passat", "Mercedes C-Klasse", "BMW 3er", "Audi A4", "Toyota Camry"]),
            "color": random.choice(["Schwarz", "Weiß", "Silber", "Grau", "Blau"]),
            "plate": f"K-{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')} {random.randint(100, 9999)}"
        },
        "eta_minutes": random.randint(2, 8)
    }


# =====================
# RIDE ENDPOINTS
# =====================

@router.post("/ride/request")
def request_ride(user_id: str, ride: RideRequest):
    """Request a new ride"""
    now = datetime.now(timezone.utc)
    
    # Calculate distance and price
    distance = calculate_distance(
        ride.pickup_lat, ride.pickup_lng,
        ride.dropoff_lat, ride.dropoff_lng
    )
    price = calculate_price(distance, ride.vehicle_type)
    
    # Generate driver
    driver = generate_driver()
    
    # Create ride
    ride_data = {
        "ride_id": f"ride_{now.strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}",
        "user_id": user_id,
        "status": "confirmed",  # requested -> confirmed -> in_progress -> completed
        "pickup": {
            "lat": ride.pickup_lat,
            "lng": ride.pickup_lng,
            "address": ride.pickup_address
        },
        "dropoff": {
            "lat": ride.dropoff_lat,
            "lng": ride.dropoff_lng,
            "address": ride.dropoff_address
        },
        "vehicle_type": ride.vehicle_type,
        "distance_km": round(distance, 2),
        "estimated_duration_min": max(5, int(distance * 2.5)),
        "price": price,
        "driver": driver,
        "created_at": now.isoformat(),
        "estimated_pickup": (now + timedelta(minutes=driver["eta_minutes"])).isoformat()
    }
    
    rides_col.insert_one(ride_data)
    
    # Remove _id for response
    ride_data.pop("_id", None)
    
    return ride_data


@router.get("/ride/{ride_id}")
def get_ride(ride_id: str):
    """Get ride details"""
    ride = rides_col.find_one({"ride_id": ride_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride


@router.post("/ride/{ride_id}/start")
def start_ride(ride_id: str):
    """Start the ride (driver picked up passenger)"""
    now = datetime.now(timezone.utc)
    
    result = rides_col.update_one(
        {"ride_id": ride_id},
        {"$set": {
            "status": "in_progress",
            "started_at": now.isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    return {"status": "in_progress", "started_at": now.isoformat()}


@router.post("/ride/{ride_id}/complete")
def complete_ride(ride_id: str):
    """Complete the ride"""
    now = datetime.now(timezone.utc)
    
    ride = rides_col.find_one({"ride_id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    rides_col.update_one(
        {"ride_id": ride_id},
        {"$set": {
            "status": "completed",
            "completed_at": now.isoformat()
        }}
    )
    
    return {
        "status": "completed",
        "completed_at": now.isoformat(),
        "total_price": ride["price"]["total"],
        "message": "Fahrt abgeschlossen! Bitte bewerten Sie Ihren Fahrer."
    }


@router.post("/ride/{ride_id}/cancel")
def cancel_ride(ride_id: str, reason: str = "user_cancelled"):
    """Cancel a ride"""
    now = datetime.now(timezone.utc)
    
    result = rides_col.update_one(
        {"ride_id": ride_id, "status": {"$in": ["requested", "confirmed"]}},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": now.isoformat(),
            "cancel_reason": reason
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot cancel this ride")
    
    return {"status": "cancelled", "reason": reason}


@router.get("/rides/history")
def ride_history(user_id: str, limit: int = 20):
    """Get user's ride history"""
    rides = list(rides_col.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit))
    
    return {"rides": rides, "count": len(rides)}


# =====================
# TRACKING ENDPOINTS
# =====================

@router.get("/ride/{ride_id}/track")
def track_ride(ride_id: str):
    """Get real-time tracking data for a ride"""
    ride = rides_col.find_one({"ride_id": ride_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    # Simulate driver position based on ride status
    if ride["status"] == "confirmed":
        # Driver is coming to pickup
        progress = random.uniform(0.3, 0.8)
        current_lat = ride["pickup"]["lat"] + (random.uniform(-0.01, 0.01))
        current_lng = ride["pickup"]["lng"] + (random.uniform(-0.01, 0.01))
        eta_minutes = max(1, int(ride["driver"]["eta_minutes"] * (1 - progress)))
    elif ride["status"] == "in_progress":
        # Driver is on the way to dropoff
        progress = random.uniform(0.2, 0.9)
        current_lat = ride["pickup"]["lat"] + (ride["dropoff"]["lat"] - ride["pickup"]["lat"]) * progress
        current_lng = ride["pickup"]["lng"] + (ride["dropoff"]["lng"] - ride["pickup"]["lng"]) * progress
        eta_minutes = max(1, int(ride["estimated_duration_min"] * (1 - progress)))
    else:
        current_lat = ride["dropoff"]["lat"]
        current_lng = ride["dropoff"]["lng"]
        eta_minutes = 0
        progress = 1.0
    
    return {
        "ride_id": ride_id,
        "status": ride["status"],
        "driver": ride["driver"],
        "current_position": {
            "lat": round(current_lat, 6),
            "lng": round(current_lng, 6)
        },
        "progress_percent": round(progress * 100),
        "eta_minutes": eta_minutes,
        "pickup": ride["pickup"],
        "dropoff": ride["dropoff"]
    }


# =====================
# RATING ENDPOINTS
# =====================

@router.post("/ride/{ride_id}/rate")
def rate_ride(ride_id: str, rating: RatingRequest):
    """Rate a completed ride"""
    ride = rides_col.find_one({"ride_id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    if ride["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed rides")
    
    now = datetime.now(timezone.utc)
    
    rating_data = {
        "ride_id": ride_id,
        "user_id": ride["user_id"],
        "driver_id": ride["driver"]["id"],
        "rating": min(5, max(1, rating.rating)),
        "comment": rating.comment,
        "tip_amount": rating.tip_amount,
        "created_at": now.isoformat()
    }
    
    ratings_col.insert_one(rating_data)
    
    # Update ride with rating
    rides_col.update_one(
        {"ride_id": ride_id},
        {"$set": {"user_rating": rating.rating, "user_tip": rating.tip_amount}}
    )
    
    return {
        "success": True,
        "message": "Danke für Ihre Bewertung!",
        "coins_earned": rating.rating * 2  # Bonus coins for rating
    }


@router.get("/driver/{driver_id}/ratings")
def get_driver_ratings(driver_id: str, limit: int = 10):
    """Get ratings for a driver"""
    ratings = list(ratings_col.find(
        {"driver_id": driver_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit))
    
    # Calculate average
    if ratings:
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
    else:
        avg_rating = 5.0
    
    return {
        "driver_id": driver_id,
        "average_rating": round(avg_rating, 1),
        "total_ratings": len(ratings),
        "recent_ratings": ratings
    }


# =====================
# SAVED ROUTES
# =====================

@router.post("/routes/save")
def save_route(user_id: str, route: SavedRoute):
    """Save a favorite route"""
    now = datetime.now(timezone.utc)
    
    route_data = {
        "user_id": user_id,
        "name": route.name,
        "pickup": {
            "lat": route.pickup_lat,
            "lng": route.pickup_lng,
            "address": route.pickup_address
        },
        "dropoff": {
            "lat": route.dropoff_lat,
            "lng": route.dropoff_lng,
            "address": route.dropoff_address
        },
        "created_at": now.isoformat(),
        "use_count": 0
    }
    
    saved_routes_col.insert_one(route_data)
    
    return {"success": True, "message": f"Route '{route.name}' gespeichert!"}


@router.get("/routes/saved")
def get_saved_routes(user_id: str):
    """Get user's saved routes"""
    routes = list(saved_routes_col.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("use_count", -1))
    
    return {"routes": routes, "count": len(routes)}


@router.delete("/routes/{route_name}")
def delete_route(user_id: str, route_name: str):
    """Delete a saved route"""
    result = saved_routes_col.delete_one({"user_id": user_id, "name": route_name})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Route not found")
    
    return {"success": True, "message": "Route gelöscht"}


# =====================
# PRICE ESTIMATION
# =====================

@router.get("/estimate")
def estimate_price(
    pickup_lat: float,
    pickup_lng: float,
    dropoff_lat: float,
    dropoff_lng: float
):
    """Estimate price for a ride"""
    distance = calculate_distance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    duration = max(5, int(distance * 2.5))
    
    return {
        "distance_km": round(distance, 2),
        "estimated_duration_min": duration,
        "prices": {
            "standard": calculate_price(distance, "standard"),
            "comfort": calculate_price(distance, "comfort"),
            "premium": calculate_price(distance, "premium")
        }
    }


# =====================
# STATS
# =====================

@router.get("/stats")
def transport_stats(user_id: str):
    """Get user's transport statistics"""
    rides = list(rides_col.find({"user_id": user_id, "status": "completed"}))
    
    total_rides = len(rides)
    total_distance = sum(r.get("distance_km", 0) for r in rides)
    total_spent = sum(r.get("price", {}).get("total", 0) for r in rides)
    
    # Average rating given
    user_ratings = list(ratings_col.find({"user_id": user_id}))
    avg_given = sum(r["rating"] for r in user_ratings) / len(user_ratings) if user_ratings else 0
    
    return {
        "total_rides": total_rides,
        "total_distance_km": round(total_distance, 1),
        "total_spent_eur": round(total_spent, 2),
        "average_rating_given": round(avg_given, 1),
        "co2_saved_kg": round(total_distance * 0.12, 1)  # Assuming shared rides
    }
