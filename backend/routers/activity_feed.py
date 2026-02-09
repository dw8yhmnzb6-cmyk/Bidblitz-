"""Activity Feed Router - Live activity stream for social proof"""
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import uuid
import asyncio
import json

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/activity-feed", tags=["Activity Feed"])

# WebSocket connections for live updates
active_connections: List[WebSocket] = []

# ==================== ENDPOINTS ====================

@router.get("/recent")
async def get_recent_activity(limit: int = 20, activity_type: Optional[str] = None):
    """Get recent platform activity for social proof"""
    query = {}
    if activity_type:
        query["type"] = activity_type
    
    # Get recent activities
    activities = await db.activity_feed.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"activities": activities, "count": len(activities)}

@router.get("/wins")
async def get_recent_wins(limit: int = 10):
    """Get recent auction wins for displaying on homepage"""
    # Get recently ended auctions with winners
    recent_wins = await db.auctions.find(
        {
            "status": "ended",
            "winner_id": {"$exists": True, "$ne": None}
        },
        {"_id": 0}
    ).sort("ended_at", -1).limit(limit).to_list(limit)
    
    wins = []
    for auction in recent_wins:
        # Get winner info (anonymized)
        winner = await db.users.find_one(
            {"id": auction["winner_id"]},
            {"_id": 0, "name": 1, "username": 1}
        )
        
        if winner:
            # Anonymize name (first letter + ***)
            name = winner.get("name") or winner.get("username", "Benutzer")
            if len(name) > 1:
                display_name = name[0] + "***" + (name[-1] if len(name) > 2 else "")
            else:
                display_name = name + "***"
            
            wins.append({
                "id": auction["id"],
                "winner_name": display_name,
                "product_name": auction.get("product_name", "Produkt"),
                "product_image": auction.get("product_image"),
                "final_price": auction.get("current_price", 0),
                "retail_price": auction.get("product_retail_price", 0),
                "savings_percent": round(
                    (1 - auction.get("current_price", 0) / auction.get("product_retail_price", 1)) * 100
                ) if auction.get("product_retail_price", 0) > 0 else 0,
                "won_at": auction.get("ended_at")
            })
    
    return {"wins": wins}

@router.get("/live-bids")
async def get_live_bids(limit: int = 15):
    """Get recent bids across all auctions (live feed)"""
    # Get recent human bids
    recent_bids = await db.bids.find(
        {"is_bot": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    bids = []
    for bid in recent_bids:
        # Get user info (anonymized)
        user = await db.users.find_one(
            {"id": bid["user_id"]},
            {"_id": 0, "name": 1, "username": 1}
        )
        
        # Get auction info
        auction = await db.auctions.find_one(
            {"id": bid["auction_id"]},
            {"_id": 0, "product_name": 1}
        )
        
        if user and auction:
            name = user.get("name") or user.get("username", "Benutzer")
            if len(name) > 1:
                display_name = name[0] + "***"
            else:
                display_name = name
            
            bids.append({
                "user_name": display_name,
                "product_name": auction.get("product_name", "Produkt"),
                "auction_id": bid["auction_id"],
                "bid_amount": bid.get("amount", 0.01),
                "created_at": bid.get("created_at")
            })
    
    return {"bids": bids}

@router.get("/stats")
async def get_platform_stats():
    """Get live platform statistics"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Count various stats
    active_auctions = await db.auctions.count_documents({"status": "active"})
    
    # Today's stats
    wins_today = await db.auctions.count_documents({
        "status": "ended",
        "ended_at": {"$gte": today_start.isoformat()}
    })
    
    bids_today = await db.bids.count_documents({
        "created_at": {"$gte": today_start.isoformat()},
        "is_bot": {"$ne": True}
    })
    
    # Total savings calculation
    pipeline = [
        {"$match": {"status": "ended", "winner_id": {"$exists": True}}},
        {"$group": {
            "_id": None,
            "total_savings": {
                "$sum": {"$subtract": ["$product_retail_price", "$current_price"]}
            }
        }}
    ]
    savings_result = await db.auctions.aggregate(pipeline).to_list(1)
    total_savings = savings_result[0]["total_savings"] if savings_result else 0
    
    # Active users (users who bid in last hour)
    hour_ago = (now - timedelta(hours=1)).isoformat()
    active_bidders = await db.bids.distinct("user_id", {
        "created_at": {"$gte": hour_ago},
        "is_bot": {"$ne": True}
    })
    
    return {
        "active_auctions": active_auctions,
        "wins_today": wins_today,
        "bids_today": bids_today,
        "total_savings": round(total_savings, 2),
        "active_users": len(active_bidders),
        "updated_at": now.isoformat()
    }

@router.post("/log")
async def log_activity(
    activity_type: str,
    message: str,
    metadata: Optional[dict] = None
):
    """Log a new activity (internal use)"""
    activity = {
        "id": str(uuid.uuid4()),
        "type": activity_type,
        "message": message,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.activity_feed.insert_one(activity)
    
    # Broadcast to WebSocket clients
    await broadcast_activity(activity)
    
    return {"success": True}

@router.websocket("/ws")
async def activity_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time activity updates"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive, wait for messages
            data = await websocket.receive_text()
            # Could handle client messages here if needed
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def broadcast_activity(activity: dict):
    """Broadcast activity to all connected WebSocket clients"""
    for connection in active_connections:
        try:
            await connection.send_json(activity)
        except:
            pass


activity_feed_router = router
