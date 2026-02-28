"""
Taxi Offer System - ActionToken for Push Accept/Reject + 15s Timeout + Cascade
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import uuid, secrets, asyncio

from dependencies import get_current_user
from config import db, logger

router = APIRouter(prefix="/taxi/offers", tags=["Taxi Offers"])

OFFER_TIMEOUT_SECONDS = 15


class OfferAction(BaseModel):
    rideId: str
    actionToken: str


async def create_offer_token(ride_id: str, driver_user_id: str) -> str:
    """Create a one-time action token for push accept/reject"""
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    await db.offer_action_tokens.insert_one({
        "id": str(uuid.uuid4()),
        "ride_id": ride_id,
        "driver_user_id": driver_user_id,
        "token": token,
        "expires_at": (now + timedelta(seconds=OFFER_TIMEOUT_SECONDS)).isoformat(),
        "created_at": now.isoformat(),
        "used_at": None
    })
    return token


async def validate_offer_token(ride_id: str, token: str) -> dict:
    """Validate and consume an action token"""
    doc = await db.offer_action_tokens.find_one({
        "ride_id": ride_id, "token": token, "used_at": None
    })
    if not doc:
        raise HTTPException(401, "Ungültiger oder abgelaufener Token")

    expires = datetime.fromisoformat(doc["expires_at"])
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(410, "Token abgelaufen (15s Timeout)")

    # Mark as used
    await db.offer_action_tokens.update_one(
        {"token": token},
        {"$set": {"used_at": datetime.now(timezone.utc).isoformat()}}
    )
    return doc


async def send_offer_to_driver(ride, driver, distance_km):
    """Send ride offer via push notification with action token"""
    token = await create_offer_token(ride["id"], driver["user_id"])

    # Build push payload
    payload = {
        "rideId": ride["id"],
        "title": "BidBlitz Driver",
        "body": f"Neue Fahrt | Pickup {distance_km:.1f} km | {ride['vehicle_type'].capitalize()} | 15s",
        "actionToken": token,
        "type": "new_ride"
    }

    # Try to send push
    subs = await db.push_subscriptions.find(
        {"user_id": driver["user_id"], "is_active": True}
    ).to_list(5)

    push_sent = False
    if subs:
        try:
            import json
            from pywebpush import webpush
            import os
            vapid_private = os.environ.get("VAPID_PRIVATE_KEY_FILE", "")
            vapid_claims = {"sub": os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:admin@bidblitz.ae")}

            for sub in subs:
                sub_info = sub.get("subscription", {})
                if sub_info.get("endpoint"):
                    try:
                        webpush(sub_info, json.dumps(payload), vapid_private_key=vapid_private, vapid_claims=vapid_claims)
                        push_sent = True
                        logger.info(f"Push sent to driver {driver['user_id'][:8]} for ride {ride['id'][:8]}")
                    except Exception as e:
                        logger.warning(f"Push error: {e}")
        except ImportError:
            logger.warning("pywebpush not installed")

    # Also send via WebSocket if connected
    try:
        from routers.taxi_websocket import notify_driver_new_ride
        await notify_driver_new_ride(driver["user_id"], {**payload, "ride": {
            "id": ride["id"],
            "pickup": ride.get("pickup", {}),
            "dropoff": ride.get("dropoff", {}),
            "estimated_fare": ride.get("estimated_fare"),
            "vehicle_type": ride.get("vehicle_type"),
            "distance_km": distance_km
        }})
    except:
        pass

    return token, push_sent


async def offer_ride_to_drivers(ride_id: str):
    """Cascade offer to nearest drivers with 15s timeout each"""
    ride = await db.taxi_rides.find_one({"id": ride_id})
    if not ride or ride["status"] != "searching":
        return

    pickup_lat = ride["pickup"]["lat"]
    pickup_lng = ride["pickup"]["lng"]

    # Get all available drivers sorted by distance
    from routers.taxi_pro import haversine_km
    drivers = await db.taxi_driver_profiles.find(
        {"is_online": True, "status": "approved"},
        {"_id": 0}
    ).to_list(50)

    for d in drivers:
        if d.get("last_location"):
            d["_dist"] = haversine_km(pickup_lat, pickup_lng, d["last_location"]["lat"], d["last_location"]["lng"])
        else:
            d["_dist"] = 9999
    drivers.sort(key=lambda x: x["_dist"])
    drivers = [d for d in drivers if d["_dist"] < 30]  # Within 30km

    if not drivers:
        await db.taxi_rides.update_one({"id": ride_id}, {"$set": {"status": "expired"}})
        logger.info(f"Ride {ride_id[:8]}: No drivers available, expired")
        return

    # Try up to 3 drivers
    for i, driver in enumerate(drivers[:3]):
        # Check ride still searching
        current = await db.taxi_rides.find_one({"id": ride_id}, {"status": 1})
        if not current or current["status"] != "searching":
            return

        # Assign to this driver
        await db.taxi_rides.update_one({"id": ride_id}, {"$set": {
            "status": "assigned",
            "driver_user_id": driver["user_id"],
            "driver_name": driver.get("name"),
            "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=OFFER_TIMEOUT_SECONDS)).isoformat()
        }})

        # Send offer
        token, push_sent = await send_offer_to_driver(ride, driver, driver["_dist"])
        logger.info(f"Ride {ride_id[:8]}: Offered to driver {driver['user_id'][:8]} (#{i+1}, {driver['_dist']:.1f}km, push={push_sent})")

        # Wait for response (15 seconds)
        await asyncio.sleep(OFFER_TIMEOUT_SECONDS)

        # Check if driver accepted
        updated = await db.taxi_rides.find_one({"id": ride_id}, {"status": 1})
        if updated and updated["status"] == "accepted":
            logger.info(f"Ride {ride_id[:8]}: Accepted by driver {driver['user_id'][:8]}")
            return

        # Not accepted - reset and try next
        if updated and updated["status"] == "assigned":
            await db.taxi_rides.update_one({"id": ride_id}, {"$set": {
                "status": "searching", "driver_user_id": None, "driver_name": None
            }})
            logger.info(f"Ride {ride_id[:8]}: Driver {driver['user_id'][:8]} timeout, trying next")

    # All drivers tried, expire
    current = await db.taxi_rides.find_one({"id": ride_id}, {"status": 1})
    if current and current["status"] == "searching":
        await db.taxi_rides.update_one({"id": ride_id}, {"$set": {"status": "expired"}})
        logger.info(f"Ride {ride_id[:8]}: All drivers tried, expired")


# ==================== ENDPOINTS ====================

@router.post("/accept")
async def accept_offer(data: OfferAction):
    """Accept a ride offer (called from push notification - no auth needed, uses actionToken)"""
    doc = await validate_offer_token(data.rideId, data.actionToken)

    ride = await db.taxi_rides.find_one({"id": data.rideId})
    if not ride:
        raise HTTPException(404, "Fahrt nicht gefunden")
    if ride["status"] != "assigned" or ride.get("driver_user_id") != doc["driver_user_id"]:
        raise HTTPException(409, "Fahrt nicht mehr verfügbar")

    now = datetime.now(timezone.utc).isoformat()
    await db.taxi_rides.update_one({"id": data.rideId}, {"$set": {
        "status": "accepted", "accepted_at": now
    }})

    logger.info(f"Ride {data.rideId[:8]}: ACCEPTED via push token by {doc['driver_user_id'][:8]}")

    # Notify rider via WebSocket
    try:
        from routers.taxi_websocket import notify_rider_update
        await notify_rider_update(ride["rider_user_id"], {
            "type": "ride_status", "status": "accepted",
            "driver_name": ride.get("driver_name"), "ride_id": data.rideId
        })
    except:
        pass

    return {"success": True, "message": "Fahrt angenommen!"}


@router.post("/reject")
async def reject_offer(data: OfferAction):
    """Reject a ride offer (called from push notification)"""
    doc = await validate_offer_token(data.rideId, data.actionToken)

    ride = await db.taxi_rides.find_one({"id": data.rideId})
    if ride and ride["status"] == "assigned" and ride.get("driver_user_id") == doc["driver_user_id"]:
        await db.taxi_rides.update_one({"id": data.rideId}, {"$set": {
            "status": "searching", "driver_user_id": None, "driver_name": None
        }})
        logger.info(f"Ride {data.rideId[:8]}: REJECTED via push token by {doc['driver_user_id'][:8]}")

    return {"success": True, "message": "Abgelehnt"}


# ==================== DRIVER PUSH SUBSCRIBE ====================

class PushSubscribeRequest(BaseModel):
    subscription: dict  # {endpoint, keys: {p256dh, auth}}


@router.post("/push/subscribe")
async def subscribe_driver_push(data: PushSubscribeRequest, user: dict = Depends(get_current_user)):
    """Driver subscribes for push notifications"""
    # Upsert subscription
    await db.push_subscriptions.update_one(
        {"user_id": user["id"], "endpoint": data.subscription.get("endpoint")},
        {"$set": {
            "user_id": user["id"],
            "subscription": data.subscription,
            "endpoint": data.subscription.get("endpoint"),
            "p256dh": data.subscription.get("keys", {}).get("p256dh"),
            "auth": data.subscription.get("keys", {}).get("auth"),
            "is_active": True,
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    logger.info(f"Push subscription registered for driver {user['id'][:8]}")
    return {"success": True, "message": "Push-Benachrichtigungen aktiviert"}
