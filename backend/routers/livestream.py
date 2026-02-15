"""Live Streaming Auctions - Video stream with live commentary"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/livestream", tags=["Live Streaming"])

@router.get("/active")
async def get_active_streams():
    """Get all currently active live streams"""
    streams = await db.livestreams.find(
        {"status": "live"},
        {"_id": 0}
    ).to_list(10)
    
    result = []
    for stream in streams:
        auction = await db.auctions.find_one(
            {"id": stream.get("auction_id")},
            {"_id": 0, "product_id": 1, "current_price": 1, "end_time": 1, "total_bids": 1}
        )
        product = None
        if auction:
            product = await db.products.find_one(
                {"id": auction.get("product_id")},
                {"_id": 0, "name": 1, "image_url": 1, "retail_price": 1}
            )
        
        result.append({
            **stream,
            "auction": auction,
            "product": product,
            "viewer_count": stream.get("viewer_count", 0)
        })
    
    return {"streams": result}

@router.get("/stream/{stream_id}")
async def get_stream_details(stream_id: str):
    """Get details of a specific live stream"""
    stream = await db.livestreams.find_one({"id": stream_id}, {"_id": 0})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream nicht gefunden")
    
    auction = await db.auctions.find_one(
        {"id": stream.get("auction_id")},
        {"_id": 0}
    )
    
    product = None
    if auction:
        product = await db.products.find_one(
            {"id": auction.get("product_id")},
            {"_id": 0}
        )
    
    # Get recent chat messages
    chat = await db.stream_chat.find(
        {"stream_id": stream_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    return {
        "stream": stream,
        "auction": auction,
        "product": product,
        "chat": list(reversed(chat))
    }

@router.post("/stream/{stream_id}/join")
async def join_stream(stream_id: str, user: dict = Depends(get_current_user)):
    """Join a live stream as viewer"""
    stream = await db.livestreams.find_one({"id": stream_id})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream nicht gefunden")
    
    # Increment viewer count
    await db.livestreams.update_one(
        {"id": stream_id},
        {"$inc": {"viewer_count": 1}}
    )
    
    # Track viewer
    await db.stream_viewers.update_one(
        {"stream_id": stream_id, "user_id": user["id"]},
        {
            "$set": {
                "user_name": user.get("name", "Anonym"),
                "joined_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"success": True, "message": "Stream beigetreten"}

@router.post("/stream/{stream_id}/leave")
async def leave_stream(stream_id: str, user: dict = Depends(get_current_user)):
    """Leave a live stream"""
    await db.livestreams.update_one(
        {"id": stream_id, "viewer_count": {"$gt": 0}},
        {"$inc": {"viewer_count": -1}}
    )
    
    await db.stream_viewers.delete_one({
        "stream_id": stream_id,
        "user_id": user["id"]
    })
    
    return {"success": True}

@router.post("/stream/{stream_id}/chat")
async def send_chat_message(
    stream_id: str,
    message: str,
    user: dict = Depends(get_current_user)
):
    """Send a chat message in the stream"""
    stream = await db.livestreams.find_one({"id": stream_id, "status": "live"})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream nicht aktiv")
    
    if len(message) > 200:
        raise HTTPException(status_code=400, detail="Nachricht zu lang (max 200 Zeichen)")
    
    chat_msg = {
        "id": str(uuid.uuid4()),
        "stream_id": stream_id,
        "user_id": user["id"],
        "user_name": user.get("name", "Anonym"),
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "user"
    }
    
    await db.stream_chat.insert_one(chat_msg)
    
    del chat_msg["_id"]
    return chat_msg

@router.get("/stream/{stream_id}/chat")
async def get_chat_messages(stream_id: str, limit: int = 50, since: str = None):
    """Get chat messages for a stream"""
    query = {"stream_id": stream_id}
    if since:
        query["timestamp"] = {"$gt": since}
    
    messages = await db.stream_chat.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"messages": list(reversed(messages))}

# Admin/Moderator endpoints
@router.post("/admin/start")
async def start_stream(
    auction_id: str,
    title: str,
    description: str = "",
    moderator_name: str = "bidblitz.ae Team",
    admin: dict = Depends(get_admin_user)
):
    """Start a new live stream for an auction"""
    auction = await db.auctions.find_one({"id": auction_id, "status": "active"})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden oder nicht aktiv")
    
    stream_id = str(uuid.uuid4())
    
    stream = {
        "id": stream_id,
        "auction_id": auction_id,
        "title": title,
        "description": description,
        "moderator_name": moderator_name,
        "moderator_id": admin["id"],
        "status": "live",
        "viewer_count": 0,
        "started_at": datetime.now(timezone.utc).isoformat(),
        # Placeholder for actual stream URL - would need video streaming service
        "stream_url": f"https://stream.bidblitz.ae/{stream_id}",
        "embed_code": f'<iframe src="https://stream.bidblitz.ae/embed/{stream_id}" width="100%" height="400"></iframe>'
    }
    
    await db.livestreams.insert_one(stream)
    
    # Add system message to chat
    await db.stream_chat.insert_one({
        "id": str(uuid.uuid4()),
        "stream_id": stream_id,
        "user_name": "System",
        "message": f"🔴 Livestream gestartet: {title}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "system"
    })
    
    del stream["_id"]
    return {"stream": stream}

@router.post("/admin/end/{stream_id}")
async def end_stream(stream_id: str, admin: dict = Depends(get_admin_user)):
    """End a live stream"""
    result = await db.livestreams.update_one(
        {"id": stream_id},
        {
            "$set": {
                "status": "ended",
                "ended_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Stream nicht gefunden")
    
    # Add system message
    await db.stream_chat.insert_one({
        "id": str(uuid.uuid4()),
        "stream_id": stream_id,
        "user_name": "System",
        "message": "🔴 Livestream beendet. Danke fürs Zuschauen!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "system"
    })
    
    # Clear viewers
    await db.stream_viewers.delete_many({"stream_id": stream_id})
    
    return {"success": True, "message": "Stream beendet"}

@router.post("/admin/announcement/{stream_id}")
async def send_announcement(
    stream_id: str,
    message: str,
    admin: dict = Depends(get_admin_user)
):
    """Send an announcement in the stream chat"""
    stream = await db.livestreams.find_one({"id": stream_id, "status": "live"})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream nicht aktiv")
    
    announcement = {
        "id": str(uuid.uuid4()),
        "stream_id": stream_id,
        "user_name": stream.get("moderator_name", "Moderator"),
        "message": f"📢 {message}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "announcement"
    }
    
    await db.stream_chat.insert_one(announcement)
    
    del announcement["_id"]
    return announcement

@router.get("/upcoming")
async def get_upcoming_streams():
    """Get scheduled upcoming streams"""
    streams = await db.livestreams.find(
        {"status": "scheduled"},
        {"_id": 0}
    ).sort("scheduled_at", 1).to_list(10)
    
    return {"upcoming_streams": streams}

@router.post("/admin/schedule")
async def schedule_stream(
    auction_id: str,
    title: str,
    scheduled_at: str,
    description: str = "",
    admin: dict = Depends(get_admin_user)
):
    """Schedule a future live stream"""
    stream_id = str(uuid.uuid4())
    
    stream = {
        "id": stream_id,
        "auction_id": auction_id,
        "title": title,
        "description": description,
        "scheduled_at": scheduled_at,
        "status": "scheduled",
        "created_by": admin["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.livestreams.insert_one(stream)
    
    del stream["_id"]
    return {"scheduled_stream": stream}
