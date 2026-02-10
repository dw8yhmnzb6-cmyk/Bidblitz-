"""Win-Back Campaign System - Reactivate inactive users"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional, List
import uuid

from config import db, logger
from dependencies import get_admin_user

router = APIRouter(prefix="/win-back", tags=["Win-Back Campaigns"])

class CampaignCreate(BaseModel):
    name: str
    inactive_days: int = 30  # Users inactive for X days
    bonus_bids: int = 20
    expires_in_days: int = 7
    message: str = "Wir vermissen dich! Hier sind {bonus} Gratis-Gebote!"

@router.get("/inactive-users")
async def get_inactive_users(days: int = 30, admin: dict = Depends(get_admin_user)):
    """Get users who haven't been active for X days"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    users = await db.users.find({
        "last_activity": {"$lt": cutoff},
        "status": {"$ne": "banned"}
    }, {"_id": 0, "id": 1, "email": 1, "username": 1, "last_activity": 1}).to_list(500)
    
    return {"inactive_users": users, "count": len(users)}

@router.post("/create-campaign")
async def create_campaign(campaign: CampaignCreate, admin: dict = Depends(get_admin_user)):
    """Create a win-back campaign"""
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=campaign.inactive_days)).isoformat()
    
    # Get inactive users
    inactive = await db.users.find({
        "last_activity": {"$lt": cutoff},
        "status": {"$ne": "banned"}
    }, {"id": 1, "email": 1}).to_list(500)
    
    campaign_doc = {
        "id": str(uuid.uuid4()),
        "name": campaign.name,
        "inactive_days": campaign.inactive_days,
        "bonus_bids": campaign.bonus_bids,
        "message": campaign.message.replace("{bonus}", str(campaign.bonus_bids)),
        "target_users": len(inactive),
        "claimed_count": 0,
        "expires_at": (now + timedelta(days=campaign.expires_in_days)).isoformat(),
        "status": "active",
        "created_by": admin.get("id"),
        "created_at": now.isoformat()
    }
    
    await db.winback_campaigns.insert_one(campaign_doc)
    
    # Create offers for each user
    for user in inactive:
        offer = {
            "id": str(uuid.uuid4()),
            "campaign_id": campaign_doc["id"],
            "user_id": user["id"],
            "bonus_bids": campaign.bonus_bids,
            "status": "pending",
            "expires_at": campaign_doc["expires_at"],
            "created_at": now.isoformat()
        }
        await db.winback_offers.insert_one(offer)
    
    del campaign_doc["_id"]
    
    logger.info(f"Win-back campaign created: {campaign.name} for {len(inactive)} users")
    
    return {"success": True, "campaign": campaign_doc, "users_targeted": len(inactive)}

@router.get("/my-offer")
async def get_my_winback_offer(user_id: str):
    """Check if user has a win-back offer"""
    now = datetime.now(timezone.utc)
    
    offer = await db.winback_offers.find_one({
        "user_id": user_id,
        "status": "pending",
        "expires_at": {"$gt": now.isoformat()}
    }, {"_id": 0})
    
    if not offer:
        return {"has_offer": False}
    
    campaign = await db.winback_campaigns.find_one({"id": offer["campaign_id"]}, {"message": 1})
    
    return {
        "has_offer": True,
        "offer": offer,
        "message": campaign.get("message") if campaign else "Willkommen zurück!"
    }

@router.post("/claim/{offer_id}")
async def claim_winback_offer(offer_id: str):
    """Claim a win-back offer"""
    now = datetime.now(timezone.utc)
    
    offer = await db.winback_offers.find_one({"id": offer_id, "status": "pending"})
    if not offer:
        raise HTTPException(status_code=404, detail="Angebot nicht gefunden")
    
    if datetime.fromisoformat(offer["expires_at"].replace('Z', '+00:00')) < now:
        raise HTTPException(status_code=400, detail="Angebot abgelaufen")
    
    # Mark as claimed
    await db.winback_offers.update_one(
        {"id": offer_id},
        {"$set": {"status": "claimed", "claimed_at": now.isoformat()}}
    )
    
    # Award bids
    await db.users.update_one(
        {"id": offer["user_id"]},
        {"$inc": {"bids": offer["bonus_bids"]}}
    )
    
    # Update campaign stats
    await db.winback_campaigns.update_one(
        {"id": offer["campaign_id"]},
        {"$inc": {"claimed_count": 1}}
    )
    
    return {"success": True, "bids_awarded": offer["bonus_bids"]}

@router.get("/campaigns")
async def get_all_campaigns(admin: dict = Depends(get_admin_user)):
    """Get all win-back campaigns"""
    campaigns = await db.winback_campaigns.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"campaigns": campaigns}

winback_router = router
