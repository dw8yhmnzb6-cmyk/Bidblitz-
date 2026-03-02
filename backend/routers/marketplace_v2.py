"""
Marketplace v2 + Chat + Media + Stats + Moderation + Expire/Renew
All adapted for BidBlitz: Motor async, config.db, dependencies.py
"""
from __future__ import annotations
import os, uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, Body, UploadFile, File

from dependencies import get_current_user, get_admin_user
from config import db

router = APIRouter(prefix="/market", tags=["Marketplace v2"])

UTC = timezone.utc
def _now(): return datetime.now(UTC)
def _id(p): return f"{p}-{uuid.uuid4().hex[:12].upper()}"

COUNTRIES = {"XK": "Kosovo", "DE": "Deutschland", "AE": "UAE"}
CITIES = {
    "XK": ["Pristina","Prizren","Peja","Ferizaj","Mitrovica","Gjilan","Gjakova","Podujeva","Vushtrri","Suhareka","Drenas","Skenderaj","Lipjan","Fushë Kosovë"],
    "DE": ["Berlin","Hamburg","München","Köln","Frankfurt","Stuttgart","Düsseldorf","Dortmund","Leipzig","Dresden","Hannover","Nürnberg"],
    "AE": ["Dubai","Abu Dhabi","Sharjah"],
}
PLANS = [
    {"plan_id":"free","name":"Kostenlos","days":3650,"prices":{"XK":0,"DE":0,"AE":0},"limits":{"max_active":3,"max_photos":10,"boosts":0}},
    {"plan_id":"premium","name":"Premium","days":30,"prices":{"XK":499,"DE":499,"AE":1900},"limits":{"max_active":20,"max_photos":30,"boosts":2}},
    {"plan_id":"pro","name":"Pro","days":30,"prices":{"XK":999,"DE":999,"AE":3900},"limits":{"max_active":80,"max_photos":50,"boosts":6}},
]
BOOSTS = {
    "top24":{"hours":24,"prices":{"XK":149,"DE":149,"AE":900}},
    "top7":{"hours":168,"prices":{"XK":699,"DE":699,"AE":3500}},
    "highlight":{"hours":168,"prices":{"XK":249,"DE":249,"AE":1200}},
}
UPLOAD_DIR = "/var/www/bidblitz/backend/storage/market_uploads"

# ==================== GEO ====================
@router.get("/geo/cities")
async def geo_cities(country_code: str = Query(...)):
    cc = country_code.upper()
    return {"cities": CITIES.get(cc, []), "country": COUNTRIES.get(cc, cc)}

# ==================== PLANS ====================
@router.get("/seller/plans")
async def list_plans():
    return {"plans": PLANS}

@router.get("/seller/plan")
async def my_plan(country_code: str = Query("XK"), user: dict = Depends(get_current_user)):
    p = await db.market_seller_plans.find_one({"user_id": user["id"], "cc": country_code.upper()}, {"_id": 0})
    if not p or (p.get("until") and datetime.fromisoformat(p["until"]) < _now()):
        return {"plan": {"plan_id": "free", "name": "Kostenlos", "limits": PLANS[0]["limits"]}}
    return {"plan": p}

@router.post("/seller/plan/buy")
async def buy_plan(country_code: str = Query(...), plan_id: str = Query(...), user: dict = Depends(get_current_user)):
    cc = country_code.upper()
    plan = next((p for p in PLANS if p["plan_id"] == plan_id), None)
    if not plan: raise HTTPException(404, "Plan nicht gefunden")
    price = plan["prices"].get(cc, 0)
    if price > 0:
        bal = user.get("wallet_balance_cents", 0)
        if bal < price: raise HTTPException(402, f"Nicht genug Guthaben ({price/100:.2f} EUR)")
        await db.users.update_one({"id": user["id"]}, {"$inc": {"wallet_balance_cents": -price}})
        platform = await db.users.find_one({"email": "platform@bidblitz.ae"})
        if platform: await db.users.update_one({"id": platform["id"]}, {"$inc": {"wallet_balance_cents": price}})
    until = (_now() + timedelta(days=plan["days"])).isoformat()
    await db.market_seller_plans.update_one({"user_id": user["id"], "cc": cc}, {"$set": {"plan_id": plan_id, "name": plan["name"], "limits": plan["limits"], "until": until, "user_id": user["id"], "cc": cc}}, upsert=True)
    return {"ok": True, "plan_id": plan_id, "until": until}

# ==================== LISTINGS ====================
@router.post("/listings/create")
async def create_listing(payload: dict = Body(...), user: dict = Depends(get_current_user)):
    cc = (payload.get("country_code") or "XK").upper()
    listing = {
        "listing_id": _id("LIST"), "seller_user_id": user["id"],
        "country_code": cc, "city": payload.get("city", ""), "category": (payload.get("category") or "").lower(),
        "title": payload.get("title", ""), "description": payload.get("description", ""),
        "price_cents": int(payload.get("price_cents") or 0), "currency": "AED" if cc == "AE" else "EUR",
        "images": payload.get("images") or [], "attributes": payload.get("attributes") or {},
        "status": "active", "boost_rank": 0,
        "published_at": _now().isoformat(), "expires_at": (_now() + timedelta(days=21)).isoformat(),
        "created_at": _now().isoformat()
    }
    if not listing["title"]: raise HTTPException(400, "Titel erforderlich")
    await db.market_listings.insert_one(listing)
    listing.pop("_id", None)
    return {"ok": True, "listing": listing}

@router.get("/search")
async def search(country_code: str = Query("XK"), city: str = None, category: str = None, q: str = None, limit: int = 30, skip: int = 0):
    query = {"country_code": country_code.upper(), "status": "active"}
    if city: query["city"] = city
    if category: query["category"] = category.lower()
    if q: query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]
    items = await db.market_listings.find(query, {"_id": 0}).sort([("boost_rank", -1), ("created_at", -1)]).skip(skip).to_list(min(limit, 100))
    return {"items": items, "count": len(items)}

@router.post("/listings/boost")
async def boost(listing_id: str = Query(...), boost_type: str = Query(...), user: dict = Depends(get_current_user)):
    if boost_type not in BOOSTS: raise HTTPException(400, "Ungültiger Boost")
    l = await db.market_listings.find_one({"listing_id": listing_id, "seller_user_id": user["id"]})
    if not l: raise HTTPException(404, "Nicht gefunden")
    cc = l.get("country_code", "XK")
    price = BOOSTS[boost_type]["prices"].get(cc, 0)
    if price > 0:
        bal = user.get("wallet_balance_cents", 0)
        if bal < price: raise HTTPException(402, "Nicht genug Guthaben")
        await db.users.update_one({"id": user["id"]}, {"$inc": {"wallet_balance_cents": -price}})
    rank = {"top7": 4, "top24": 3, "highlight": 2}.get(boost_type, 1)
    await db.market_listings.update_one({"listing_id": listing_id}, {"$set": {"boost_rank": rank}})
    return {"ok": True, "boost_type": boost_type, "charged": price}

@router.post("/listings/renew")
async def renew(listing_id: str = Query(...), user: dict = Depends(get_current_user)):
    l = await db.market_listings.find_one({"listing_id": listing_id, "seller_user_id": user["id"]})
    if not l: raise HTTPException(404, "Nicht gefunden")
    price = 99  # 0.99 EUR
    await db.users.update_one({"id": user["id"]}, {"$inc": {"wallet_balance_cents": -price}})
    new_exp = (_now() + timedelta(days=21)).isoformat()
    await db.market_listings.update_one({"listing_id": listing_id}, {"$set": {"status": "active", "expires_at": new_exp}})
    return {"ok": True, "expires_at": new_exp}

# ==================== MEDIA ====================
@router.post("/listings/image/upload")
async def upload_image(listing_id: str = Query(...), file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    l = await db.market_listings.find_one({"listing_id": listing_id, "seller_user_id": user["id"]})
    if not l: raise HTTPException(404, "Nicht gefunden")
    os.makedirs(os.path.join(UPLOAD_DIR, l.get("country_code", "XK")), exist_ok=True)
    content = await file.read()
    if len(content) > 8 * 1024 * 1024: raise HTTPException(413, "Max 8MB")
    ext = (file.filename or "").split(".")[-1].lower() if "." in (file.filename or "") else "jpg"
    fn = f"{listing_id}_{_id('IMG')}.{ext}"
    path = os.path.join(UPLOAD_DIR, l.get("country_code", "XK"), fn)
    with open(path, "wb") as f: f.write(content)
    url = f"/uploads/market/{l.get('country_code','XK')}/{fn}"
    await db.market_listings.update_one({"listing_id": listing_id}, {"$push": {"images": url}})
    return {"ok": True, "url": url}

# ==================== CHAT ====================
@router.post("/chat/start")
async def chat_start(listing_id: str = Query(...), user: dict = Depends(get_current_user)):
    l = await db.market_listings.find_one({"listing_id": listing_id})
    if not l: raise HTTPException(404, "Nicht gefunden")
    if user["id"] == l["seller_user_id"]: raise HTTPException(400, "Eigene Anzeige")
    existing = await db.market_chats.find_one({"listing_id": listing_id, "buyer_id": user["id"]})
    if existing: return {"thread_id": existing["thread_id"]}
    tid = _id("THR")
    await db.market_chats.insert_one({"thread_id": tid, "listing_id": listing_id, "buyer_id": user["id"], "seller_id": l["seller_user_id"], "created_at": _now().isoformat()})
    return {"thread_id": tid}

@router.post("/chat/send")
async def chat_send(thread_id: str = Query(...), payload: dict = Body(...), user: dict = Depends(get_current_user)):
    t = await db.market_chats.find_one({"thread_id": thread_id})
    if not t or user["id"] not in [t["buyer_id"], t["seller_id"]]: raise HTTPException(403, "Nicht berechtigt")
    msg = {"id": _id("MSG"), "thread_id": thread_id, "sender_id": user["id"], "text": (payload.get("text") or "")[:2000], "created_at": _now().isoformat()}
    await db.market_messages.insert_one(msg)
    msg.pop("_id", None)
    return {"ok": True, "message": msg}

@router.get("/chat/messages")
async def chat_messages(thread_id: str = Query(...), user: dict = Depends(get_current_user)):
    t = await db.market_chats.find_one({"thread_id": thread_id})
    if not t or user["id"] not in [t["buyer_id"], t["seller_id"]]: raise HTTPException(403, "Nicht berechtigt")
    msgs = await db.market_messages.find({"thread_id": thread_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"messages": msgs}

@router.get("/chat/threads")
async def chat_threads(user: dict = Depends(get_current_user)):
    threads = await db.market_chats.find({"$or": [{"buyer_id": user["id"]}, {"seller_id": user["id"]}]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"threads": threads}

# ==================== STATS + REPORTS ====================
@router.post("/listings/view")
async def record_view(listing_id: str = Query(...)):
    await db.market_listings.update_one({"listing_id": listing_id}, {"$inc": {"views": 1}})
    return {"ok": True}

@router.post("/report")
async def report_listing(listing_id: str = Query(...), payload: dict = Body(...), user: dict = Depends(get_current_user)):
    await db.market_reports.insert_one({"id": _id("REP"), "listing_id": listing_id, "reporter_id": user["id"], "reason": payload.get("reason", ""), "created_at": _now().isoformat()})
    count = await db.market_reports.count_documents({"listing_id": listing_id})
    if count >= 5: await db.market_listings.update_one({"listing_id": listing_id}, {"$set": {"status": "blocked"}})
    return {"ok": True, "reports": count}

# ==================== ADMIN ====================
@router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin_user)):
    total = await db.market_listings.count_documents({})
    active = await db.market_listings.count_documents({"status": "active"})
    blocked = await db.market_listings.count_documents({"status": "blocked"})
    reports = await db.market_reports.count_documents({})
    return {"total": total, "active": active, "blocked": blocked, "reports": reports}

@router.post("/admin/block/{listing_id}")
async def admin_block(listing_id: str, admin: dict = Depends(get_admin_user)):
    await db.market_listings.update_one({"listing_id": listing_id}, {"$set": {"status": "blocked"}})
    return {"ok": True}

@router.post("/admin/unblock/{listing_id}")
async def admin_unblock(listing_id: str, admin: dict = Depends(get_admin_user)):
    await db.market_listings.update_one({"listing_id": listing_id}, {"$set": {"status": "active"}})
    return {"ok": True}
