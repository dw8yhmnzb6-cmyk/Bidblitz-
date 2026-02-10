"""VIP Tiers System - Bronze, Silver, Gold, Platinum"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/vip-tiers", tags=["VIP Tiers"])

# VIP Tier definitions
VIP_TIERS = {
    "bronze": {
        "name": "Bronze",
        "min_spent": 0,
        "discount": 5,
        "daily_spins": 1,
        "priority_support": False,
        "exclusive_auctions": False,
        "cashback": 0,
        "color": "#CD7F32"
    },
    "silver": {
        "name": "Silber", 
        "min_spent": 100,
        "discount": 10,
        "daily_spins": 2,
        "priority_support": True,
        "exclusive_auctions": False,
        "cashback": 2,
        "color": "#C0C0C0"
    },
    "gold": {
        "name": "Gold",
        "min_spent": 500,
        "discount": 15,
        "daily_spins": 3,
        "priority_support": True,
        "exclusive_auctions": True,
        "cashback": 5,
        "color": "#FFD700"
    },
    "platinum": {
        "name": "Platin",
        "min_spent": 1000,
        "discount": 20,
        "daily_spins": 5,
        "priority_support": True,
        "exclusive_auctions": True,
        "cashback": 10,
        "color": "#E5E4E2"
    }
}

def calculate_tier(total_spent: float) -> str:
    """Calculate VIP tier based on total spent"""
    if total_spent >= 1000:
        return "platinum"
    elif total_spent >= 500:
        return "gold"
    elif total_spent >= 100:
        return "silver"
    return "bronze"

@router.get("/status")
async def get_vip_status(user: dict = Depends(get_current_user)):
    """Get user's VIP status and benefits"""
    user_id = user["id"]
    
    # Get user's total spent
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "total_spent": 1})
    total_spent = user_data.get("total_spent", 0) if user_data else 0
    
    current_tier = calculate_tier(total_spent)
    tier_info = VIP_TIERS[current_tier]
    
    # Calculate progress to next tier
    next_tier = None
    progress = 100
    amount_needed = 0
    
    if current_tier == "bronze":
        next_tier = "silver"
        amount_needed = 100 - total_spent
        progress = (total_spent / 100) * 100
    elif current_tier == "silver":
        next_tier = "gold"
        amount_needed = 500 - total_spent
        progress = ((total_spent - 100) / 400) * 100
    elif current_tier == "gold":
        next_tier = "platinum"
        amount_needed = 1000 - total_spent
        progress = ((total_spent - 500) / 500) * 100
    
    return {
        "current_tier": current_tier,
        "tier_name": tier_info["name"],
        "tier_color": tier_info["color"],
        "benefits": tier_info,
        "total_spent": total_spent,
        "next_tier": next_tier,
        "next_tier_name": VIP_TIERS.get(next_tier, {}).get("name") if next_tier else None,
        "amount_to_next_tier": max(0, amount_needed),
        "progress_percent": min(100, max(0, progress))
    }

@router.get("/all-tiers")
async def get_all_tiers():
    """Get all VIP tier information"""
    return {"tiers": VIP_TIERS}

@router.post("/upgrade")
async def upgrade_vip(user: dict = Depends(get_current_user)):
    """Recalculate and upgrade user's VIP tier"""
    user_id = user["id"]
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "total_spent": 1})
    total_spent = user_data.get("total_spent", 0) if user_data else 0
    
    new_tier = calculate_tier(total_spent)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"vip_tier": new_tier}}
    )
    
    return {"success": True, "new_tier": new_tier, "tier_info": VIP_TIERS[new_tier]}

vip_tiers_router = router
