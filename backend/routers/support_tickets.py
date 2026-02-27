"""
Support Ticket System for BidBlitz
Allows users to create tickets, agents to respond
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

from dependencies import get_current_user, get_admin_user
from config import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tickets", tags=["Support Tickets"])


# ==================== SCHEMAS ====================

class TicketCreate(BaseModel):
    subject: str
    message: str
    device_id: Optional[str] = None
    priority: Optional[str] = "normal"  # low, normal, high, urgent
    category: Optional[str] = "general"  # general, billing, device, account, other

class TicketMessage(BaseModel):
    message: str

class TicketUpdate(BaseModel):
    status: Optional[str] = None  # open, in_progress, waiting, resolved, closed
    priority: Optional[str] = None
    assigned_to: Optional[str] = None


# ==================== USER ENDPOINTS ====================

@router.post("")
async def create_ticket(data: TicketCreate, user: dict = Depends(get_current_user)):
    """User creates a new support ticket"""
    ticket_id = str(uuid.uuid4())
    ticket_number = f"TKT-{ticket_id[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    ticket = {
        "id": ticket_id,
        "ticket_number": ticket_number,
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "device_id": data.device_id,
        "subject": data.subject,
        "category": data.category,
        "status": "open",
        "priority": data.priority,
        "assigned_to": None,
        "created_at": now,
        "updated_at": now,
        "resolved_at": None
    }
    
    await db.tickets.insert_one(ticket)
    
    # Add first message
    first_message = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "sender": "user",
        "sender_id": user["id"],
        "sender_name": user.get("name"),
        "message": data.message,
        "created_at": now
    }
    await db.ticket_messages.insert_one(first_message)
    
    logger.info(f"🎫 Ticket created: {ticket_number} by {user.get('email')}")
    
    return {
        "success": True,
        "ticket": {k: v for k, v in ticket.items() if k != '_id'},
        "message": f"Ticket {ticket_number} erstellt. Wir melden uns bald!"
    }


@router.get("")
async def get_my_tickets(user: dict = Depends(get_current_user)):
    """User gets their tickets"""
    tickets = await db.tickets.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"tickets": tickets}


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    """Get ticket details with messages"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    # Check access (user owns ticket or is admin)
    if ticket["user_id"] != user["id"] and not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Nicht autorisiert")
    
    messages = await db.ticket_messages.find(
        {"ticket_id": ticket_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {"ticket": ticket, "messages": messages}


@router.post("/{ticket_id}/messages")
async def add_message(ticket_id: str, data: TicketMessage, user: dict = Depends(get_current_user)):
    """Add message to ticket"""
    ticket = await db.tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    # Check access
    is_agent = user.get("is_admin") or user.get("is_support_agent")
    if ticket["user_id"] != user["id"] and not is_agent:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")
    
    if ticket["status"] == "closed":
        raise HTTPException(status_code=409, detail="Ticket ist geschlossen")
    
    now = datetime.now(timezone.utc).isoformat()
    message = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "sender": "agent" if is_agent else "user",
        "sender_id": user["id"],
        "sender_name": user.get("name"),
        "message": data.message,
        "created_at": now
    }
    
    await db.ticket_messages.insert_one(message)
    
    # Update ticket
    new_status = "waiting" if is_agent else "open"
    await db.tickets.update_one(
        {"id": ticket_id},
        {"": {"updated_at": now, "status": new_status}}
    )
    
    logger.info(f"💬 Message added to ticket {ticket['ticket_number']} by {user.get('email')}")
    
    return {"success": True, "message": {k: v for k, v in message.items() if k != '_id'}}


# ==================== ADMIN/AGENT ENDPOINTS ====================

@router.get("/admin/all")
async def get_all_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Admin gets all tickets"""
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Get counts by status
    stats = {
        "open": await db.tickets.count_documents({"status": "open"}),
        "in_progress": await db.tickets.count_documents({"status": "in_progress"}),
        "waiting": await db.tickets.count_documents({"status": "waiting"}),
        "resolved": await db.tickets.count_documents({"status": "resolved"}),
        "closed": await db.tickets.count_documents({"status": "closed"})
    }
    
    return {"tickets": tickets, "stats": stats}


@router.patch("/admin/{ticket_id}")
async def update_ticket(ticket_id: str, data: TicketUpdate, admin: dict = Depends(get_admin_user)):
    """Admin updates ticket status/priority/assignment"""
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Keine Änderungen angegeben")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if data.status == "resolved":
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tickets.update_one({"id": ticket_id}, {"": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    logger.info(f"🎫 Ticket {ticket['ticket_number']} updated by admin {admin.get('email')}")
    
    return {"success": True, "ticket": ticket}


@router.post("/admin/{ticket_id}/system-message")
async def add_system_message(ticket_id: str, data: TicketMessage, admin: dict = Depends(get_admin_user)):
    """Add system message to ticket"""
    ticket = await db.tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    now = datetime.now(timezone.utc).isoformat()
    message = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "sender": "system",
        "sender_id": None,
        "sender_name": "BidBlitz System",
        "message": data.message,
        "created_at": now
    }
    
    await db.ticket_messages.insert_one(message)
    await db.tickets.update_one({"id": ticket_id}, {"": {"updated_at": now}})
    
    return {"success": True, "message": {k: v for k, v in message.items() if k != '_id'}}
