"""
Saved Places + Ride History Detail
Zuhause, Arbeit, Favoriten - gespeicherte Adressen für schnelles Buchen
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from dependencies import get_current_user
from config import db

router = APIRouter(prefix="/taxi/places", tags=["Saved Places"])


class SavedPlace(BaseModel):
    label: str  # Zuhause, Arbeit, or custom
    address: str
    lat: float
    lng: float
    icon: Optional[str] = None  # home, work, star


@router.get("/my")
async def get_saved_places(user: dict = Depends(get_current_user)):
    """Get user's saved places"""
    places = await db.saved_places.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("label", 1).to_list(20)
    return {"places": places}


@router.post("/save")
async def save_place(data: SavedPlace, user: dict = Depends(get_current_user)):
    """Save a favorite place"""
    # Upsert by label (only one "Zuhause", one "Arbeit")
    if data.label in ["Zuhause", "Arbeit"]:
        await db.saved_places.update_one(
            {"user_id": user["id"], "label": data.label},
            {"$set": {
                "user_id": user["id"], "label": data.label,
                "address": data.address, "lat": data.lat, "lng": data.lng,
                "icon": data.icon or ("home" if data.label == "Zuhause" else "work"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
    else:
        await db.saved_places.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"],
            "label": data.label, "address": data.address,
            "lat": data.lat, "lng": data.lng,
            "icon": data.icon or "star",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    return {"success": True, "message": f"'{data.label}' gespeichert"}


@router.delete("/{label}")
async def delete_place(label: str, user: dict = Depends(get_current_user)):
    """Delete a saved place"""
    await db.saved_places.delete_one({"user_id": user["id"], "label": label})
    return {"success": True}
