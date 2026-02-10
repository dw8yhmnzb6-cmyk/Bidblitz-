"""Fraud Detection System - Detect suspicious activity"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional, List
import uuid

from config import db, logger
from dependencies import get_admin_user

router = APIRouter(prefix="/fraud-detection", tags=["Fraud Detection"])

# Risk thresholds
RISK_THRESHOLDS = {
    "rapid_bidding": {"count": 50, "window_minutes": 5, "risk": "high"},
    "multiple_ips": {"count": 5, "window_hours": 24, "risk": "medium"},
    "unusual_hours": {"start": 2, "end": 5, "risk": "low"},  # 2-5 AM
    "always_last_bid": {"percent": 80, "min_wins": 5, "risk": "high"},
    "new_account_high_spend": {"days": 7, "amount": 500, "risk": "medium"}
}

@router.get("/scan")
async def scan_for_fraud(admin: dict = Depends(get_admin_user)):
    """Scan all users for suspicious activity"""
    now = datetime.now(timezone.utc)
    alerts = []
    
    # 1. Rapid bidding detection
    five_min_ago = (now - timedelta(minutes=5)).isoformat()
    rapid_bidders = await db.bids.aggregate([
        {"$match": {"created_at": {"$gt": five_min_ago}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": RISK_THRESHOLDS["rapid_bidding"]["count"]}}}
    ]).to_list(100)
    
    for bidder in rapid_bidders:
        user = await db.users.find_one({"id": bidder["_id"]}, {"username": 1, "email": 1})
        alerts.append({
            "type": "rapid_bidding",
            "user_id": bidder["_id"],
            "username": user.get("username") if user else "Unknown",
            "email": user.get("email") if user else "Unknown",
            "detail": f"{bidder['count']} Gebote in 5 Minuten",
            "risk": "high"
        })
    
    # 2. New accounts with high spending
    week_ago = (now - timedelta(days=7)).isoformat()
    new_users = await db.users.find(
        {"created_at": {"$gt": week_ago}},
        {"id": 1, "username": 1, "email": 1, "total_spent": 1}
    ).to_list(1000)
    
    for user in new_users:
        if user.get("total_spent", 0) > RISK_THRESHOLDS["new_account_high_spend"]["amount"]:
            alerts.append({
                "type": "new_account_high_spend",
                "user_id": user["id"],
                "username": user.get("username"),
                "email": user.get("email"),
                "detail": f"€{user['total_spent']} in erster Woche",
                "risk": "medium"
            })
    
    # 3. Always winning detection (sniping)
    winners = await db.won_auctions.aggregate([
        {"$group": {"_id": "$winner_id", "wins": {"$sum": 1}}}
    ]).to_list(100)
    
    for winner in winners:
        if winner["wins"] >= RISK_THRESHOLDS["always_last_bid"]["min_wins"]:
            # Check if they always bid last
            user_bids = await db.bids.find(
                {"user_id": winner["_id"]},
                {"auction_id": 1, "created_at": 1}
            ).to_list(1000)
            
            # Complex analysis would go here
            # Simplified: flag users with many wins
            if winner["wins"] > 20:
                user = await db.users.find_one({"id": winner["_id"]}, {"username": 1})
                alerts.append({
                    "type": "high_win_rate",
                    "user_id": winner["_id"],
                    "username": user.get("username") if user else "Unknown",
                    "detail": f"{winner['wins']} Auktionen gewonnen",
                    "risk": "low"
                })
    
    # Save alerts
    for alert in alerts:
        alert["id"] = str(uuid.uuid4())
        alert["detected_at"] = now.isoformat()
        alert["status"] = "new"
        await db.fraud_alerts.update_one(
            {"user_id": alert["user_id"], "type": alert["type"], "status": "new"},
            {"$set": alert},
            upsert=True
        )
    
    return {
        "scan_time": now.isoformat(),
        "alerts_found": len(alerts),
        "alerts": alerts
    }

@router.get("/alerts")
async def get_fraud_alerts(admin: dict = Depends(get_admin_user)):
    """Get all fraud alerts"""
    alerts = await db.fraud_alerts.find(
        {},
        {"_id": 0}
    ).sort("detected_at", -1).limit(100).to_list(100)
    
    return {"alerts": alerts}

@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, admin: dict = Depends(get_admin_user)):
    """Mark an alert as resolved"""
    result = await db.fraud_alerts.update_one(
        {"id": alert_id},
        {"$set": {
            "status": "resolved",
            "resolved_by": admin.get("id"),
            "resolved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert nicht gefunden")
    
    return {"success": True}

@router.post("/ban-user/{user_id}")
async def ban_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Ban a user for fraud"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "status": "banned",
            "banned_at": datetime.now(timezone.utc).isoformat(),
            "banned_by": admin.get("id"),
            "ban_reason": "Fraud detection"
        }}
    )
    
    logger.warning(f"User banned for fraud: {user_id} by {admin.get('id')}")
    
    return {"success": True, "message": "Benutzer gesperrt"}

fraud_detection_router = router
