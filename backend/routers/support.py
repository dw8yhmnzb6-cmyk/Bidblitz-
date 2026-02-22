"""
Support System Router
- Tickets erstellen, abrufen, beantworten
- Chat-Nachrichten
- Support-Einstellungen (Hotline etc.)
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(tags=["Support"])

# ==================== MODELS ====================

class CreateTicketRequest(BaseModel):
    subject: str
    message: str
    category: Optional[str] = "general"  # general, payment, technical, account

class TicketReplyRequest(BaseModel):
    message: str

class ChatMessageRequest(BaseModel):
    message: str

class SupportSettingsRequest(BaseModel):
    hotline: Optional[str] = None
    email: Optional[str] = None
    chat_enabled: Optional[bool] = None
    ticket_enabled: Optional[bool] = None

# ==================== SUPPORT SETTINGS ====================

@router.get("/settings")
async def get_support_settings():
    """Get public support settings (hotline, email, etc.)"""
    settings = await db.settings.find_one({"type": "support_settings"}, {"_id": 0})
    if not settings:
        return {
            "hotline": "+49 123 456789",
            "email": "support@bidblitz.ae",
            "chat_enabled": True,
            "ticket_enabled": True
        }
    return {
        "hotline": settings.get("hotline", "+49 123 456789"),
        "email": settings.get("email", "support@bidblitz.ae"),
        "chat_enabled": settings.get("chat_enabled", True),
        "ticket_enabled": settings.get("ticket_enabled", True)
    }

@router.put("/settings")
async def update_support_settings(
    data: SupportSettingsRequest,
    admin: dict = Depends(get_admin_user)
):
    """Update support settings (admin only)"""
    update_data = {"type": "support_settings", "updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.hotline is not None:
        update_data["hotline"] = data.hotline
    if data.email is not None:
        update_data["email"] = data.email
    if data.chat_enabled is not None:
        update_data["chat_enabled"] = data.chat_enabled
    if data.ticket_enabled is not None:
        update_data["ticket_enabled"] = data.ticket_enabled
    
    await db.settings.update_one(
        {"type": "support_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Support-Einstellungen gespeichert"}

# ==================== TICKETS ====================

@router.post("/tickets")
async def create_ticket(
    data: CreateTicketRequest,
    user: dict = Depends(get_current_user)
):
    """Create a new support ticket"""
    ticket_id = str(uuid.uuid4())[:8].upper()
    
    ticket = {
        "id": ticket_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "subject": data.subject,
        "category": data.category,
        "status": "open",  # open, in_progress, resolved, closed
        "messages": [{
            "id": str(uuid.uuid4()),
            "sender": "user",
            "sender_name": user.get("name", "Kunde"),
            "message": data.message,
            "created_at": datetime.now(timezone.utc).isoformat()
        }],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_tickets.insert_one(ticket)
    
    return {
        "message": "Ticket erstellt",
        "ticket_id": ticket_id,
        "ticket": {
            "id": ticket_id,
            "subject": data.subject,
            "status": "open",
            "created_at": ticket["created_at"]
        }
    }

@router.get("/tickets")
async def get_user_tickets(
    user: dict = Depends(get_current_user),
    status: Optional[str] = None
):
    """Get tickets for current user"""
    query = {"user_id": user["id"]}
    if status:
        query["status"] = status
    
    tickets = await db.support_tickets.find(
        query,
        {"_id": 0}
    ).sort("updated_at", -1).limit(50).to_list(50)
    
    return {"tickets": tickets}

@router.get("/tickets/{ticket_id}")
async def get_ticket_detail(
    ticket_id: str,
    user: dict = Depends(get_current_user)
):
    """Get ticket details"""
    ticket = await db.support_tickets.find_one(
        {"id": ticket_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    return ticket

@router.post("/tickets/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    data: TicketReplyRequest,
    user: dict = Depends(get_current_user)
):
    """Add reply to ticket (user)"""
    ticket = await db.support_tickets.find_one({"id": ticket_id, "user_id": user["id"]})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    if ticket["status"] == "closed":
        raise HTTPException(status_code=400, detail="Ticket ist geschlossen")
    
    new_message = {
        "id": str(uuid.uuid4()),
        "sender": "user",
        "sender_name": user.get("name", "Kunde"),
        "message": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_tickets.update_one(
        {"id": ticket_id},
        {
            "$push": {"messages": new_message},
            "$set": {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "status": "open"  # Reopen if was resolved
            }
        }
    )
    
    return {"message": "Antwort gesendet", "new_message": new_message}

# ==================== ADMIN TICKET MANAGEMENT ====================

@router.get("/admin/tickets")
async def admin_get_all_tickets(
    admin: dict = Depends(get_admin_user),
    status: Optional[str] = None,
    limit: int = Query(default=50, le=200)
):
    """Get all tickets (admin)"""
    query = {}
    if status:
        query["status"] = status
    
    tickets = await db.support_tickets.find(
        query,
        {"_id": 0}
    ).sort("updated_at", -1).limit(limit).to_list(limit)
    
    # Get stats
    total = await db.support_tickets.count_documents({})
    open_count = await db.support_tickets.count_documents({"status": "open"})
    in_progress = await db.support_tickets.count_documents({"status": "in_progress"})
    resolved = await db.support_tickets.count_documents({"status": "resolved"})
    
    return {
        "tickets": tickets,
        "stats": {
            "total": total,
            "open": open_count,
            "in_progress": in_progress,
            "resolved": resolved
        }
    }

@router.get("/admin/tickets/{ticket_id}")
async def admin_get_ticket(
    ticket_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Get ticket details (admin)"""
    ticket = await db.support_tickets.find_one({"id": ticket_id}, {"_id": 0})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    return ticket

@router.post("/admin/tickets/{ticket_id}/reply")
async def admin_reply_to_ticket(
    ticket_id: str,
    data: TicketReplyRequest,
    admin: dict = Depends(get_admin_user)
):
    """Admin reply to ticket"""
    ticket = await db.support_tickets.find_one({"id": ticket_id})
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    new_message = {
        "id": str(uuid.uuid4()),
        "sender": "admin",
        "sender_name": admin.get("name", "Support-Team"),
        "message": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_tickets.update_one(
        {"id": ticket_id},
        {
            "$push": {"messages": new_message},
            "$set": {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "status": "in_progress"
            }
        }
    )
    
    return {"message": "Antwort gesendet", "new_message": new_message}

@router.put("/admin/tickets/{ticket_id}/status")
async def admin_update_ticket_status(
    ticket_id: str,
    status: str = Query(..., regex="^(open|in_progress|resolved|closed)$"),
    admin: dict = Depends(get_admin_user)
):
    """Update ticket status (admin)"""
    result = await db.support_tickets.update_one(
        {"id": ticket_id},
        {"$set": {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    return {"message": f"Status auf '{status}' gesetzt"}

# ==================== LIVE CHAT ====================

@router.post("/chat/message")
async def send_chat_message(
    data: ChatMessageRequest,
    user: dict = Depends(get_current_user)
):
    """Send a chat message"""
    # Find or create chat session
    chat = await db.support_chats.find_one({"user_id": user["id"], "status": "active"})
    
    if not chat:
        chat_id = str(uuid.uuid4())[:8].upper()
        chat = {
            "id": chat_id,
            "user_id": user["id"],
            "user_name": user.get("name", ""),
            "user_email": user.get("email", ""),
            "status": "active",
            "messages": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.support_chats.insert_one(chat)
    
    new_message = {
        "id": str(uuid.uuid4()),
        "sender": "user",
        "sender_name": user.get("name", "Kunde"),
        "message": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_chats.update_one(
        {"id": chat["id"]},
        {
            "$push": {"messages": new_message},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Nachricht gesendet", "chat_id": chat["id"]}

@router.get("/chat/messages")
async def get_chat_messages(
    user: dict = Depends(get_current_user)
):
    """Get chat messages for current user"""
    chat = await db.support_chats.find_one(
        {"user_id": user["id"], "status": "active"},
        {"_id": 0}
    )
    
    if not chat:
        return {"messages": [], "chat_id": None}
    
    return {"messages": chat.get("messages", []), "chat_id": chat["id"]}

@router.get("/admin/chats")
async def admin_get_chats(
    admin: dict = Depends(get_admin_user)
):
    """Get all active chats (admin)"""
    chats = await db.support_chats.find(
        {"status": "active"},
        {"_id": 0}
    ).sort("updated_at", -1).limit(50).to_list(50)
    
    return {"chats": chats}

@router.post("/admin/chats/{chat_id}/reply")
async def admin_chat_reply(
    chat_id: str,
    data: ChatMessageRequest,
    admin: dict = Depends(get_admin_user)
):
    """Admin reply to chat"""
    chat = await db.support_chats.find_one({"id": chat_id})
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat nicht gefunden")
    
    new_message = {
        "id": str(uuid.uuid4()),
        "sender": "admin",
        "sender_name": admin.get("name", "Support"),
        "message": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_chats.update_one(
        {"id": chat_id},
        {
            "$push": {"messages": new_message},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Antwort gesendet"}
