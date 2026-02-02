"""VIP Lounge Chat Router - Exclusive chat for VIP members"""
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional, List
import uuid
import json

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/vip-lounge", tags=["VIP Lounge"])

# ==================== WEBSOCKET MANAGER ====================

class VIPChatManager:
    def __init__(self):
        self.active_connections: dict = {}  # user_id -> WebSocket
    
    async def connect(self, websocket: WebSocket, user_id: str, username: str):
        await websocket.accept()
        self.active_connections[user_id] = {
            "ws": websocket,
            "username": username,
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        # Broadcast user joined
        await self.broadcast({
            "type": "user_joined",
            "user_id": user_id,
            "username": username,
            "online_count": len(self.active_connections)
        })
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            username = self.active_connections[user_id].get("username", "VIP")
            del self.active_connections[user_id]
            return username
        return None
    
    async def broadcast(self, message: dict):
        for user_id, conn in list(self.active_connections.items()):
            try:
                await conn["ws"].send_json(message)
            except:
                self.disconnect(user_id)
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id]["ws"].send_json(message)
            except:
                self.disconnect(user_id)
    
    def get_online_users(self):
        return [
            {"user_id": uid, "username": conn["username"]}
            for uid, conn in self.active_connections.items()
        ]

vip_chat_manager = VIPChatManager()

# ==================== SCHEMAS ====================

class ChatMessage(BaseModel):
    content: str
    reply_to: Optional[str] = None  # Message ID to reply to

class ReportMessage(BaseModel):
    message_id: str
    reason: str

# ==================== ENDPOINTS ====================

@router.get("/access")
async def check_vip_access(user: dict = Depends(get_current_user)):
    """Check if user has VIP lounge access"""
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    
    if not user_data:
        return {"has_access": False, "reason": "Benutzer nicht gefunden"}
    
    is_vip = user_data.get("is_vip", False) or user_data.get("vip_active", False)
    vip_level = user_data.get("vip_level") or user_data.get("vip_tier")
    
    if not is_vip:
        return {
            "has_access": False,
            "reason": "VIP-Mitgliedschaft erforderlich",
            "upgrade_hint": "Werde VIP und erhalte Zugang zur exklusiven VIP-Lounge!"
        }
    
    return {
        "has_access": True,
        "vip_level": vip_level,
        "username": user_data.get("username", user_data.get("email", "").split("@")[0])
    }

@router.get("/messages")
async def get_recent_messages(limit: int = 50, user: dict = Depends(get_current_user)):
    """Get recent VIP lounge messages"""
    # Verify VIP access
    access = await check_vip_access(user)
    if not access.get("has_access"):
        raise HTTPException(status_code=403, detail="VIP-Zugang erforderlich")
    
    messages = await db.vip_chat_messages.find(
        {"deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    # Reverse to show oldest first
    messages.reverse()
    
    return {
        "messages": messages,
        "online_users": vip_chat_manager.get_online_users()
    }

@router.post("/send")
async def send_message(data: ChatMessage, user: dict = Depends(get_current_user)):
    """Send a message to VIP lounge"""
    # Verify VIP access
    access = await check_vip_access(user)
    if not access.get("has_access"):
        raise HTTPException(status_code=403, detail="VIP-Zugang erforderlich")
    
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Nachricht darf nicht leer sein")
    
    if len(data.content) > 500:
        raise HTTPException(status_code=400, detail="Nachricht zu lang (max 500 Zeichen)")
    
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    
    message = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "username": user_data.get("username", user_data.get("email", "").split("@")[0]) if user_data else "VIP",
        "vip_level": user_data.get("vip_level") or user_data.get("vip_tier") if user_data else "vip",
        "content": data.content.strip(),
        "reply_to": data.reply_to,
        "reactions": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vip_chat_messages.insert_one(message)
    
    # Broadcast to all connected VIP users
    await vip_chat_manager.broadcast({
        "type": "new_message",
        "message": message
    })
    
    return {"success": True, "message": message}

@router.post("/react/{message_id}")
async def react_to_message(message_id: str, emoji: str, user: dict = Depends(get_current_user)):
    """Add a reaction to a message"""
    access = await check_vip_access(user)
    if not access.get("has_access"):
        raise HTTPException(status_code=403, detail="VIP-Zugang erforderlich")
    
    # Validate emoji (simple check)
    allowed_emojis = ["👍", "❤️", "😂", "😮", "🎉", "🔥", "💎", "👑"]
    if emoji not in allowed_emojis:
        emoji = "👍"
    
    message = await db.vip_chat_messages.find_one({"id": message_id}, {"_id": 0})
    if not message:
        raise HTTPException(status_code=404, detail="Nachricht nicht gefunden")
    
    # Update reactions
    reactions = message.get("reactions", {})
    if emoji not in reactions:
        reactions[emoji] = []
    
    if user["id"] in reactions[emoji]:
        reactions[emoji].remove(user["id"])
    else:
        reactions[emoji].append(user["id"])
    
    # Remove empty reaction lists
    reactions = {k: v for k, v in reactions.items() if v}
    
    await db.vip_chat_messages.update_one(
        {"id": message_id},
        {"$set": {"reactions": reactions}}
    )
    
    # Broadcast reaction update
    await vip_chat_manager.broadcast({
        "type": "reaction_update",
        "message_id": message_id,
        "reactions": reactions
    })
    
    return {"success": True, "reactions": reactions}

@router.delete("/message/{message_id}")
async def delete_message(message_id: str, user: dict = Depends(get_current_user)):
    """Delete own message"""
    message = await db.vip_chat_messages.find_one({"id": message_id}, {"_id": 0})
    
    if not message:
        raise HTTPException(status_code=404, detail="Nachricht nicht gefunden")
    
    if message["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Du kannst nur deine eigenen Nachrichten löschen")
    
    await db.vip_chat_messages.update_one(
        {"id": message_id},
        {"$set": {"deleted": True, "content": "[Nachricht gelöscht]"}}
    )
    
    # Broadcast deletion
    await vip_chat_manager.broadcast({
        "type": "message_deleted",
        "message_id": message_id
    })
    
    return {"success": True}

@router.post("/report")
async def report_message(data: ReportMessage, user: dict = Depends(get_current_user)):
    """Report a message for moderation"""
    report = {
        "id": str(uuid.uuid4()),
        "message_id": data.message_id,
        "reporter_id": user["id"],
        "reason": data.reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chat_reports.insert_one(report)
    
    return {"success": True, "message": "Nachricht gemeldet. Unser Team wird sie überprüfen."}

@router.get("/online")
async def get_online_users(user: dict = Depends(get_current_user)):
    """Get list of online VIP users"""
    access = await check_vip_access(user)
    if not access.get("has_access"):
        raise HTTPException(status_code=403, detail="VIP-Zugang erforderlich")
    
    return {
        "online_users": vip_chat_manager.get_online_users(),
        "count": len(vip_chat_manager.active_connections)
    }


vip_lounge_router = router
