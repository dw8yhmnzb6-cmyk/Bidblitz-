"""
Ratenzahlung System - "Jetzt kaufen, später bezahlen"
Buy Now Pay Later (BNPL) für BidBlitz

Features:
- 3, 6 oder 12 Raten
- Nur für verifizierte Kunden
- Bonitätsprüfung basierend auf Kaufhistorie
- Für Gebote-Pakete und gewonnene Auktionen
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from config import db, logger
import uuid

router = APIRouter(prefix="/api/bnpl", tags=["Buy Now Pay Later"])

# ============== MODELS ==============

class InstallmentPlanRequest(BaseModel):
    """Anfrage für Ratenzahlung"""
    item_type: str  # 'bid_package' oder 'auction_win'
    item_id: str
    total_amount: float
    installments: int  # 3, 6 oder 12 Raten
    
class PayInstallmentRequest(BaseModel):
    """Rate bezahlen"""
    plan_id: str
    payment_method: str  # 'balance', 'card', 'paypal'

# ============== HELPER FUNCTIONS ==============

async def get_current_user(token: str):
    """Get user from token"""
    from routers.auth import get_current_user as auth_get_user
    return await auth_get_user(token)

async def check_customer_eligibility(user_id: str) -> dict:
    """
    Prüft ob Kunde für Ratenzahlung berechtigt ist
    Basiert auf: Verifizierung, Kaufhistorie, offene Raten
    """
    user = await db.users.find_one({"id": user_id})
    if not user:
        return {"eligible": False, "reason": "Benutzer nicht gefunden"}
    
    # 1. Email muss verifiziert sein
    if not user.get("email_verified", False):
        return {"eligible": False, "reason": "E-Mail nicht verifiziert", "max_amount": 0}
    
    # 2. Konto muss mindestens 7 Tage alt sein
    created_at = user.get("created_at")
    if created_at:
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        account_age = (datetime.now(timezone.utc) - created_at).days
        if account_age < 7:
            return {"eligible": False, "reason": "Konto muss mindestens 7 Tage alt sein", "max_amount": 0}
    
    # 3. Prüfe offene Ratenzahlungen
    open_plans = await db.installment_plans.count_documents({
        "user_id": user_id,
        "status": "active"
    })
    
    if open_plans >= 3:
        return {"eligible": False, "reason": "Maximale Anzahl offener Ratenzahlungen erreicht (3)", "max_amount": 0}
    
    # 4. Berechne Kreditlimit basierend auf Kaufhistorie
    total_purchases = await db.transactions.count_documents({
        "user_id": user_id,
        "type": {"$in": ["purchase", "bid_purchase"]},
        "status": "completed"
    })
    
    # Basis-Limit + Bonus für Kaufhistorie
    base_limit = 100  # €100 Basis
    history_bonus = min(total_purchases * 50, 500)  # Max €500 Bonus
    
    # Abzug für offene Raten
    open_amount = 0
    open_plans_data = await db.installment_plans.find({
        "user_id": user_id,
        "status": "active"
    }).to_list(10)
    
    for plan in open_plans_data:
        remaining = plan.get("remaining_amount", 0)
        open_amount += remaining
    
    max_amount = base_limit + history_bonus - open_amount
    max_amount = max(0, max_amount)
    
    # VIP-Kunden bekommen höheres Limit
    if user.get("is_vip") or user.get("vip_level", 0) > 0:
        max_amount *= 2
    
    return {
        "eligible": max_amount > 50,  # Mindestens €50 verfügbar
        "reason": "Berechtigt" if max_amount > 50 else "Kreditlimit zu niedrig",
        "max_amount": round(max_amount, 2),
        "open_plans": open_plans,
        "credit_score": min(100, 50 + total_purchases * 5)  # 50-100 Score
    }

# ============== ENDPOINTS ==============

@router.get("/eligibility")
async def check_eligibility(token: str):
    """
    Prüft ob der aktuelle Benutzer für Ratenzahlung berechtigt ist
    """
    try:
        # Token validieren
        from jose import jwt
        from config import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        
        eligibility = await check_customer_eligibility(user_id)
        
        return {
            "eligible": eligibility["eligible"],
            "reason": eligibility["reason"],
            "max_amount": eligibility.get("max_amount", 0),
            "open_plans": eligibility.get("open_plans", 0),
            "credit_score": eligibility.get("credit_score", 50),
            "installment_options": [
                {"months": 3, "interest": 0, "label": "3 Raten (0% Zinsen)"},
                {"months": 6, "interest": 2.9, "label": "6 Raten (2.9% Zinsen)"},
                {"months": 12, "interest": 5.9, "label": "12 Raten (5.9% Zinsen)"}
            ]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token abgelaufen")
    except jwt.JWTError as e:
        logger.error(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Ungültiger Token")
    except Exception as e:
        logger.error(f"Eligibility check error: {e}")
        raise HTTPException(status_code=500, detail="Fehler bei der Berechtigungsprüfung")

@router.post("/create-plan")
async def create_installment_plan(request: InstallmentPlanRequest, token: str):
    """
    Erstellt einen neuen Ratenzahlungsplan
    """
    try:
        from jose import jwt
        from config import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        
        # Berechtigung prüfen
        eligibility = await check_customer_eligibility(user_id)
        if not eligibility["eligible"]:
            raise HTTPException(status_code=403, detail=eligibility["reason"])
        
        if request.total_amount > eligibility["max_amount"]:
            raise HTTPException(
                status_code=403, 
                detail=f"Betrag übersteigt Ihr Limit von €{eligibility['max_amount']:.2f}"
            )
        
        # Installments validieren
        if request.installments not in [3, 6, 12]:
            raise HTTPException(status_code=400, detail="Ungültige Ratenanzahl (3, 6 oder 12)")
        
        # Zinsen berechnen
        interest_rates = {3: 0, 6: 2.9, 12: 5.9}
        interest_rate = interest_rates[request.installments]
        interest_amount = request.total_amount * (interest_rate / 100)
        total_with_interest = request.total_amount + interest_amount
        
        # Rate berechnen
        monthly_payment = round(total_with_interest / request.installments, 2)
        
        # Zahlungsplan erstellen
        now = datetime.now(timezone.utc)
        plan_id = str(uuid.uuid4())
        
        installments = []
        for i in range(request.installments):
            due_date = now + timedelta(days=30 * (i + 1))
            installments.append({
                "number": i + 1,
                "amount": monthly_payment,
                "due_date": due_date.isoformat(),
                "status": "pending",
                "paid_at": None
            })
        
        plan = {
            "id": plan_id,
            "user_id": user_id,
            "item_type": request.item_type,
            "item_id": request.item_id,
            "original_amount": request.total_amount,
            "interest_rate": interest_rate,
            "interest_amount": interest_amount,
            "total_amount": total_with_interest,
            "installment_count": request.installments,
            "monthly_payment": monthly_payment,
            "remaining_amount": total_with_interest,
            "paid_amount": 0,
            "installments": installments,
            "status": "active",
            "created_at": now.isoformat(),
            "next_due_date": installments[0]["due_date"]
        }
        
        await db.installment_plans.insert_one(plan)
        
        # Item als "gekauft mit Ratenzahlung" markieren
        if request.item_type == "bid_package":
            # Gebote dem Benutzer gutschreiben
            # (Die tatsächliche Gutschrift erfolgt hier)
            pass
        elif request.item_type == "auction_win":
            # Auktion als bezahlt markieren
            await db.auction_wins.update_one(
                {"id": request.item_id},
                {"$set": {"payment_status": "installment", "installment_plan_id": plan_id}}
            )
        
        logger.info(f"Installment plan created: {plan_id} for user {user_id}, €{total_with_interest:.2f} in {request.installments} rates")
        
        return {
            "success": True,
            "plan_id": plan_id,
            "message": f"Ratenzahlung erstellt: {request.installments}x €{monthly_payment:.2f}",
            "plan": {
                "id": plan_id,
                "total_amount": total_with_interest,
                "monthly_payment": monthly_payment,
                "installments": request.installments,
                "interest_rate": interest_rate,
                "first_due_date": installments[0]["due_date"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create plan error: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Erstellen des Ratenzahlungsplans")

@router.get("/my-plans")
async def get_my_plans(token: str):
    """
    Gibt alle Ratenzahlungspläne des Benutzers zurück
    """
    try:
        from jose import jwt
        from config import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        
        plans = await db.installment_plans.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        
        # Statistiken
        active_plans = [p for p in plans if p.get("status") == "active"]
        total_remaining = sum(p.get("remaining_amount", 0) for p in active_plans)
        
        return {
            "plans": plans,
            "stats": {
                "total_plans": len(plans),
                "active_plans": len(active_plans),
                "total_remaining": round(total_remaining, 2),
                "completed_plans": len([p for p in plans if p.get("status") == "completed"])
            }
        }
        
    except Exception as e:
        logger.error(f"Get plans error: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Ratenzahlungspläne")

@router.post("/pay-installment")
async def pay_installment(request: PayInstallmentRequest, token: str):
    """
    Bezahlt eine Rate
    """
    try:
        from jose import jwt
        from config import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        
        # Plan laden
        plan = await db.installment_plans.find_one({
            "id": request.plan_id,
            "user_id": user_id
        })
        
        if not plan:
            raise HTTPException(status_code=404, detail="Ratenzahlungsplan nicht gefunden")
        
        if plan.get("status") != "active":
            raise HTTPException(status_code=400, detail="Dieser Plan ist nicht mehr aktiv")
        
        # Nächste offene Rate finden
        installments = plan.get("installments", [])
        next_installment = None
        next_index = -1
        
        for i, inst in enumerate(installments):
            if inst.get("status") == "pending":
                next_installment = inst
                next_index = i
                break
        
        if not next_installment:
            raise HTTPException(status_code=400, detail="Keine offenen Raten")
        
        amount = next_installment["amount"]
        
        # Zahlung verarbeiten
        if request.payment_method == "balance":
            # Vom Guthaben abziehen
            user = await db.users.find_one({"id": user_id})
            balance = user.get("balance", 0)
            
            if balance < amount:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Nicht genug Guthaben. Verfügbar: €{balance:.2f}, Benötigt: €{amount:.2f}"
                )
            
            # Guthaben abziehen
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"balance": -amount}}
            )
        
        # Rate als bezahlt markieren
        now = datetime.now(timezone.utc)
        installments[next_index]["status"] = "paid"
        installments[next_index]["paid_at"] = now.isoformat()
        
        # Plan aktualisieren
        new_paid = plan.get("paid_amount", 0) + amount
        new_remaining = plan.get("remaining_amount", 0) - amount
        
        # Nächstes Fälligkeitsdatum
        next_due = None
        for inst in installments:
            if inst.get("status") == "pending":
                next_due = inst["due_date"]
                break
        
        # Status prüfen
        new_status = "active"
        if new_remaining <= 0.01:  # Floating point tolerance
            new_status = "completed"
        
        await db.installment_plans.update_one(
            {"id": request.plan_id},
            {
                "$set": {
                    "installments": installments,
                    "paid_amount": new_paid,
                    "remaining_amount": max(0, new_remaining),
                    "status": new_status,
                    "next_due_date": next_due,
                    "last_payment_at": now.isoformat()
                }
            }
        )
        
        logger.info(f"Installment paid: Plan {request.plan_id}, Rate {next_index + 1}, €{amount:.2f}")
        
        return {
            "success": True,
            "message": f"Rate {next_index + 1} bezahlt: €{amount:.2f}",
            "paid_installment": next_index + 1,
            "amount_paid": amount,
            "remaining_amount": max(0, new_remaining),
            "plan_status": new_status,
            "next_due_date": next_due
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pay installment error: {e}")
        raise HTTPException(status_code=500, detail="Fehler bei der Ratenzahlung")

@router.get("/calculate")
async def calculate_installments(amount: float, installments: int = 3):
    """
    Berechnet die Raten für einen Betrag (öffentlich)
    """
    if installments not in [3, 6, 12]:
        raise HTTPException(status_code=400, detail="Ungültige Ratenanzahl (3, 6 oder 12)")
    
    if amount < 50:
        raise HTTPException(status_code=400, detail="Mindestbetrag: €50")
    
    interest_rates = {3: 0, 6: 2.9, 12: 5.9}
    interest_rate = interest_rates[installments]
    interest_amount = amount * (interest_rate / 100)
    total = amount + interest_amount
    monthly = round(total / installments, 2)
    
    return {
        "original_amount": amount,
        "interest_rate": interest_rate,
        "interest_amount": round(interest_amount, 2),
        "total_amount": round(total, 2),
        "installments": installments,
        "monthly_payment": monthly,
        "label": f"{installments}x €{monthly:.2f}" + (f" ({interest_rate}% Zinsen)" if interest_rate > 0 else " (0% Zinsen)")
    }



# ============== ADMIN ENDPOINTS ==============

@router.get("/admin/overview")
async def admin_bnpl_overview(token: str):
    """
    Admin-Übersicht aller Ratenzahlungspläne
    """
    try:
        from jose import jwt
        from config import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        # Check if user is admin
        user = await db.users.find_one({"id": user_id})
        if not user or not user.get("is_admin"):
            raise HTTPException(status_code=403, detail="Nur für Administratoren")
        
        # Get all plans with user info
        pipeline = [
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "id",
                    "as": "user_info"
                }
            },
            {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
            {"$sort": {"created_at": -1}},
            {"$limit": 100}
        ]
        
        plans = await db.installment_plans.aggregate(pipeline).to_list(100)
        
        # Calculate statistics
        all_plans = await db.installment_plans.find({}).to_list(1000)
        
        total_plans = len(all_plans)
        active_plans = len([p for p in all_plans if p.get("status") == "active"])
        completed_plans = len([p for p in all_plans if p.get("status") == "completed"])
        overdue_plans = 0
        
        total_volume = sum(p.get("total_amount", 0) for p in all_plans)
        total_outstanding = sum(p.get("remaining_amount", 0) for p in all_plans if p.get("status") == "active")
        total_collected = sum(p.get("paid_amount", 0) for p in all_plans)
        
        # Check for overdue payments
        now = datetime.now(timezone.utc)
        for plan in all_plans:
            if plan.get("status") == "active" and plan.get("next_due_date"):
                try:
                    due_date = datetime.fromisoformat(plan["next_due_date"].replace("Z", "+00:00"))
                    if due_date < now:
                        overdue_plans += 1
                except:
                    pass
        
        # Format plans for response
        formatted_plans = []
        for plan in plans:
            user_info = plan.get("user_info", {})
            formatted_plans.append({
                "id": plan.get("id"),
                "user_id": plan.get("user_id"),
                "user_email": user_info.get("email", "Unbekannt"),
                "user_name": user_info.get("name", user_info.get("email", "Unbekannt")),
                "item_type": plan.get("item_type"),
                "original_amount": plan.get("original_amount"),
                "total_amount": plan.get("total_amount"),
                "remaining_amount": plan.get("remaining_amount"),
                "paid_amount": plan.get("paid_amount"),
                "monthly_payment": plan.get("monthly_payment"),
                "installment_count": plan.get("installment_count"),
                "interest_rate": plan.get("interest_rate"),
                "status": plan.get("status"),
                "created_at": plan.get("created_at"),
                "next_due_date": plan.get("next_due_date"),
                "is_overdue": False
            })
            
            # Check if overdue
            if plan.get("status") == "active" and plan.get("next_due_date"):
                try:
                    due_date = datetime.fromisoformat(plan["next_due_date"].replace("Z", "+00:00"))
                    if due_date < now:
                        formatted_plans[-1]["is_overdue"] = True
                except:
                    pass
        
        return {
            "plans": formatted_plans,
            "stats": {
                "total_plans": total_plans,
                "active_plans": active_plans,
                "completed_plans": completed_plans,
                "overdue_plans": overdue_plans,
                "total_volume": round(total_volume, 2),
                "total_outstanding": round(total_outstanding, 2),
                "total_collected": round(total_collected, 2)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin BNPL overview error: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Übersicht")

@router.get("/admin/plan/{plan_id}")
async def admin_get_plan_details(plan_id: str, token: str):
    """
    Admin: Detaillierte Ansicht eines Ratenzahlungsplans
    """
    try:
        from jose import jwt
        from config import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        user = await db.users.find_one({"id": user_id})
        if not user or not user.get("is_admin"):
            raise HTTPException(status_code=403, detail="Nur für Administratoren")
        
        plan = await db.installment_plans.find_one({"id": plan_id}, {"_id": 0})
        if not plan:
            raise HTTPException(status_code=404, detail="Plan nicht gefunden")
        
        # Get user info
        plan_user = await db.users.find_one({"id": plan.get("user_id")}, {"_id": 0, "password": 0})
        
        return {
            "plan": plan,
            "user": plan_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin get plan error: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden des Plans")

@router.post("/admin/send-reminder")
async def admin_send_payment_reminder(plan_id: str, token: str):
    """
    Admin: Zahlungserinnerung an Benutzer senden
    """
    try:
        from jose import jwt
        from config import JWT_SECRET, JWT_ALGORITHM
        from utils.email import send_email
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        user = await db.users.find_one({"id": user_id})
        if not user or not user.get("is_admin"):
            raise HTTPException(status_code=403, detail="Nur für Administratoren")
        
        plan = await db.installment_plans.find_one({"id": plan_id})
        if not plan:
            raise HTTPException(status_code=404, detail="Plan nicht gefunden")
        
        plan_user = await db.users.find_one({"id": plan.get("user_id")})
        if not plan_user:
            raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
        
        # Format the due date
        next_due = plan.get("next_due_date", "")
        try:
            due_date = datetime.fromisoformat(next_due.replace("Z", "+00:00"))
            formatted_due = due_date.strftime("%d.%m.%Y")
        except:
            formatted_due = next_due[:10] if next_due else "Demnächst"
        
        # Send email notification
        email_subject = "BidBlitz - Zahlungserinnerung für Ihren Ratenzahlungsplan"
        email_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10B981, #06B6D4); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Zahlungserinnerung</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="color: #374151; font-size: 16px;">Hallo {plan_user.get('name', 'Kunde')},</p>
                
                <p style="color: #374151; font-size: 16px;">
                    Wir möchten Sie daran erinnern, dass eine Rate für Ihren Ratenzahlungsplan fällig ist.
                </p>
                
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Fälligkeitsdatum:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right;">{formatted_due}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Monatliche Rate:</td>
                            <td style="color: #10B981; font-weight: bold; text-align: right;">€{plan.get('monthly_payment', 0):.2f}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Ausstehender Betrag:</td>
                            <td style="color: #f59e0b; font-weight: bold; text-align: right;">€{plan.get('remaining_amount', 0):.2f}</td>
                        </tr>
                    </table>
                </div>
                
                <p style="color: #374151; font-size: 16px;">
                    Bitte begleichen Sie die fällige Rate, um Ihren Ratenzahlungsplan aktiv zu halten.
                </p>
                
                <a href="https://bidblitz.ae/meine-ratenzahlungen" 
                   style="display: inline-block; background: linear-gradient(135deg, #10B981, #06B6D4); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
                    Jetzt bezahlen
                </a>
                
                <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
                    Bei Fragen kontaktieren Sie uns unter support@bidblitz.ae
                </p>
            </div>
        </div>
        """
        
        # Send the email
        email_sent = await send_email(
            to_email=plan_user.get('email'),
            subject=email_subject,
            html_content=email_html
        )
        
        logger.info(f"Payment reminder sent to {plan_user.get('email')} for plan {plan_id}, success: {email_sent}")
        
        # Update plan with reminder timestamp
        await db.installment_plans.update_one(
            {"id": plan_id},
            {"$set": {"last_reminder_sent": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "success": True,
            "message": f"Erinnerung an {plan_user.get('email')} gesendet"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send reminder error: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Senden der Erinnerung")
