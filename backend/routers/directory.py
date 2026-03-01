"""
Business Directory - Ärzte, Apotheken, Handwerker etc.
Businesses pay to be listed (revenue for platform)
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from dependencies import get_current_user, get_admin_user
from config import db

router = APIRouter(prefix="/directory", tags=["Business Directory"])

CATEGORIES = ["Arzt", "Zahnarzt", "Apotheke", "Handwerker", "Elektriker", "Klempner", "Friseur", "Anwalt", "Steuerberater", "Immobilienmakler", "Autowerkstatt", "Reinigung", "Umzug", "Fotograf", "Sonstiges"]
LISTING_PRICES = {"basic": 0, "standard": 990, "premium": 2990, "featured": 4990}  # cents/month


class DirectoryListing(BaseModel):
    business_name: str
    category: str
    description: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    region: str = "Kosovo"
    listing_type: str = "basic"


@router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES, "listing_types": [
        {"id": "basic", "name": "Kostenlos", "price_cents": 0, "features": ["Name + Telefon"]},
        {"id": "standard", "name": "Standard", "price_cents": 990, "features": ["+ Website + Beschreibung", "30 Tage"]},
        {"id": "premium", "name": "Premium", "price_cents": 2990, "features": ["+ Hervorhebung + Top-Position", "30 Tage"]},
        {"id": "featured", "name": "Featured", "price_cents": 4990, "features": ["+ Banner + Mehr Sichtbarkeit", "60 Tage"]},
    ]}


@router.get("/listings")
async def get_listings(category: str = None, region: str = None, search: str = None):
    query = {"status": "active"}
    if category: query["category"] = category
    if region: query["region"] = region
    if search: query["business_name"] = {"$regex": search, "$options": "i"}
    listings = await db.directory_listings.find(query, {"_id": 0}).sort([("listing_rank", -1), ("created_at", -1)]).to_list(100)
    return {"listings": listings}


@router.post("/listings")
async def create_listing(data: DirectoryListing, user: dict = Depends(get_current_user)):
    cost = LISTING_PRICES.get(data.listing_type, 0)
    if cost > 0:
        bal = user.get("wallet_balance_cents", 0)
        if bal < cost:
            raise HTTPException(402, f"Nicht genug Guthaben ({cost/100:.2f} EUR)")
        await db.users.update_one({"id": user["id"]}, {"$inc": {"wallet_balance_cents": -cost}})
        platform = await db.users.find_one({"email": "platform@bidblitz.ae"})
        if platform:
            await db.users.update_one({"id": platform["id"]}, {"$inc": {"wallet_balance_cents": cost}})

    rank = {"basic": 0, "standard": 1, "premium": 2, "featured": 3}.get(data.listing_type, 0)
    listing = {
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "business_name": data.business_name, "category": data.category,
        "description": data.description, "phone": data.phone, "email": data.email,
        "website": data.website, "address": data.address, "region": data.region,
        "listing_type": data.listing_type, "listing_rank": rank, "cost_cents": cost,
        "status": "active", "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.directory_listings.insert_one(listing)
    listing.pop("_id", None)
    return {"success": True, "listing": listing}


@router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin_user)):
    total = await db.directory_listings.count_documents({})
    active = await db.directory_listings.count_documents({"status": "active"})
    pipeline = [{"$match": {"cost_cents": {"$gt": 0}}}, {"$group": {"_id": None, "rev": {"$sum": "$cost_cents"}, "count": {"$sum": 1}}}]
    r = await db.directory_listings.aggregate(pipeline).to_list(1)
    return {"total": total, "active": active, "revenue_cents": r[0]["rev"] if r else 0, "paid": r[0]["count"] if r else 0}
