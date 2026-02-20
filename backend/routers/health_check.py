"""
Automatisches Health Check System für BidBlitz
- Führt tägliche System-Tests durch
- Zeigt Probleme im Admin-Panel an
- Kann einfache Probleme automatisch beheben
"""

from fastapi import APIRouter, HTTPException, Header
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import asyncio
import hashlib
import secrets

from config import db

router = APIRouter(prefix="/api/health", tags=["Health Check"])


# ==================== HEALTH CHECK FUNCTIONS ====================

async def check_database_connection():
    """Test database connectivity."""
    try:
        await db.command('ping')
        return {"status": "ok", "message": "MongoDB verbunden"}
    except Exception as e:
        return {"status": "error", "message": f"MongoDB Fehler: {str(e)}"}


async def check_enterprise_logins():
    """Test enterprise login system."""
    issues = []
    
    # Check for enterprise accounts with missing required fields
    enterprises = await db.enterprise_accounts.find({}, {"_id": 0}).to_list(100)
    for ent in enterprises:
        if not ent.get("password"):
            issues.append({
                "type": "missing_password",
                "entity": "enterprise_accounts",
                "entity_id": ent.get("id"),
                "message": f"Enterprise '{ent.get('company_name')}' hat kein Passwort",
                "auto_fixable": False
            })
        if not ent.get("email"):
            issues.append({
                "type": "missing_email",
                "entity": "enterprise_accounts",
                "entity_id": ent.get("id"),
                "message": f"Enterprise '{ent.get('company_name')}' hat keine E-Mail",
                "auto_fixable": False
            })
    
    # Check for enterprise users with missing passwords
    users = await db.enterprise_users.find({}, {"_id": 0}).to_list(500)
    for user in users:
        if not user.get("password"):
            issues.append({
                "type": "missing_password",
                "entity": "enterprise_users",
                "entity_id": user.get("id"),
                "message": f"Benutzer '{user.get('email')}' hat kein Passwort",
                "auto_fixable": True,  # Can generate a new password
                "fix_action": "generate_password"
            })
        if not user.get("role"):
            issues.append({
                "type": "missing_role",
                "entity": "enterprise_users",
                "entity_id": user.get("id"),
                "message": f"Benutzer '{user.get('email')}' hat keine Rolle",
                "auto_fixable": True,
                "fix_action": "set_default_role"
            })
    
    return {
        "status": "ok" if not issues else "warning",
        "message": f"{len(issues)} Probleme gefunden" if issues else "Alle Logins OK",
        "issues": issues
    }


async def check_expired_sessions():
    """Check and clean up expired sessions."""
    now = datetime.now(timezone.utc).isoformat()
    
    # Count expired sessions
    expired_count = await db.enterprise_sessions.count_documents({
        "expires_at": {"$lt": now}
    })
    
    return {
        "status": "warning" if expired_count > 100 else "ok",
        "message": f"{expired_count} abgelaufene Sessions",
        "issues": [{
            "type": "expired_sessions",
            "entity": "enterprise_sessions",
            "count": expired_count,
            "message": f"{expired_count} abgelaufene Sessions können gelöscht werden",
            "auto_fixable": True,
            "fix_action": "cleanup_sessions"
        }] if expired_count > 0 else []
    }


async def check_orphaned_data():
    """Check for orphaned data (e.g., branches without enterprise)."""
    issues = []
    
    # Check branches without valid enterprise
    branches = await db.enterprise_branches.find({}, {"_id": 0}).to_list(500)
    enterprise_ids = set()
    enterprises = await db.enterprise_accounts.find({}, {"id": 1, "_id": 0}).to_list(500)
    for ent in enterprises:
        enterprise_ids.add(ent.get("id"))
    
    for branch in branches:
        if branch.get("enterprise_id") not in enterprise_ids:
            issues.append({
                "type": "orphaned_branch",
                "entity": "enterprise_branches",
                "entity_id": branch.get("id"),
                "message": f"Filiale '{branch.get('name')}' hat kein gültiges Enterprise",
                "auto_fixable": True,
                "fix_action": "delete_orphaned"
            })
    
    # Check API keys without valid enterprise
    api_keys = await db.enterprise_api_keys.find({}, {"_id": 0}).to_list(500)
    for key in api_keys:
        if key.get("enterprise_id") not in enterprise_ids:
            issues.append({
                "type": "orphaned_api_key",
                "entity": "enterprise_api_keys",
                "entity_id": key.get("id"),
                "message": f"API-Key '{key.get('name')}' hat kein gültiges Enterprise",
                "auto_fixable": True,
                "fix_action": "delete_orphaned"
            })
    
    return {
        "status": "ok" if not issues else "warning",
        "message": f"{len(issues)} verwaiste Datensätze" if issues else "Keine verwaisten Daten",
        "issues": issues
    }


async def check_pending_payouts():
    """Check for stuck payouts."""
    issues = []
    
    # Check for payouts stuck in processing for more than 1 hour
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    stuck_payouts = await db.enterprise_payouts.find({
        "status": "processing",
        "created_at": {"$lt": one_hour_ago}
    }, {"_id": 0}).to_list(100)
    
    for payout in stuck_payouts:
        issues.append({
            "type": "stuck_payout",
            "entity": "enterprise_payouts",
            "entity_id": payout.get("id"),
            "message": f"Auszahlung {payout.get('sepa_reference')} hängt im Status 'processing'",
            "auto_fixable": True,
            "fix_action": "reset_payout_status"
        })
    
    return {
        "status": "ok" if not issues else "warning",
        "message": f"{len(issues)} hängende Auszahlungen" if issues else "Auszahlungen OK",
        "issues": issues
    }


# ==================== AUTO-FIX FUNCTIONS ====================

async def auto_fix_issue(issue: dict) -> dict:
    """Automatically fix an issue if possible."""
    fix_action = issue.get("fix_action")
    entity = issue.get("entity")
    entity_id = issue.get("entity_id")
    
    if fix_action == "generate_password":
        # Generate a new password for user
        new_password = secrets.token_urlsafe(12)
        hashed = hashlib.sha256(new_password.encode()).hexdigest()
        await db[entity].update_one(
            {"id": entity_id},
            {"$set": {"password": hashed}}
        )
        return {
            "success": True,
            "message": f"Neues Passwort generiert: {new_password}",
            "new_password": new_password
        }
    
    elif fix_action == "set_default_role":
        await db[entity].update_one(
            {"id": entity_id},
            {"$set": {"role": "cashier"}}
        )
        return {"success": True, "message": "Rolle auf 'cashier' gesetzt"}
    
    elif fix_action == "cleanup_sessions":
        now = datetime.now(timezone.utc).isoformat()
        result = await db.enterprise_sessions.delete_many({
            "expires_at": {"$lt": now}
        })
        return {"success": True, "message": f"{result.deleted_count} Sessions gelöscht"}
    
    elif fix_action == "delete_orphaned":
        result = await db[entity].delete_one({"id": entity_id})
        return {"success": True, "message": "Verwaisten Datensatz gelöscht"}
    
    elif fix_action == "reset_payout_status":
        await db[entity].update_one(
            {"id": entity_id},
            {"$set": {"status": "pending_manual"}}
        )
        return {"success": True, "message": "Auszahlungsstatus zurückgesetzt"}
    
    return {"success": False, "message": "Keine automatische Lösung verfügbar"}


# ==================== API ENDPOINTS ====================

@router.get("/run")
async def run_health_check():
    """Run all health checks and return results."""
    
    checks = {
        "database": await check_database_connection(),
        "enterprise_logins": await check_enterprise_logins(),
        "expired_sessions": await check_expired_sessions(),
        "orphaned_data": await check_orphaned_data(),
        "pending_payouts": await check_pending_payouts()
    }
    
    # Collect all issues
    all_issues = []
    for check_name, result in checks.items():
        for issue in result.get("issues", []):
            issue["check"] = check_name
            all_issues.append(issue)
    
    # Calculate overall status
    statuses = [r["status"] for r in checks.values()]
    if "error" in statuses:
        overall = "error"
    elif "warning" in statuses:
        overall = "warning"
    else:
        overall = "ok"
    
    # Save report to database
    report = {
        "id": f"report_{secrets.token_hex(8)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overall_status": overall,
        "checks": checks,
        "issues": all_issues,
        "issue_count": len(all_issues),
        "auto_fixable_count": len([i for i in all_issues if i.get("auto_fixable")])
    }
    
    await db.health_reports.insert_one(report)
    
    # Clean up report for response
    report.pop("_id", None)
    
    return report


@router.get("/reports")
async def get_health_reports(limit: int = 10):
    """Get recent health check reports."""
    reports = await db.health_reports.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Stats
    total = await db.health_reports.count_documents({})
    
    return {
        "reports": reports,
        "total": total
    }


@router.get("/reports/{report_id}")
async def get_report_detail(report_id: str):
    """Get detailed health report."""
    report = await db.health_reports.find_one(
        {"id": report_id},
        {"_id": 0}
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report nicht gefunden")
    return report


@router.post("/fix/{report_id}")
async def auto_fix_report_issues(report_id: str, fix_all: bool = False):
    """Auto-fix issues from a health report."""
    report = await db.health_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report nicht gefunden")
    
    results = []
    for issue in report.get("issues", []):
        if issue.get("auto_fixable"):
            result = await auto_fix_issue(issue)
            results.append({
                "issue": issue.get("message"),
                "fix_result": result
            })
    
    return {
        "success": True,
        "fixes_applied": len(results),
        "results": results
    }


@router.post("/fix-issue")
async def fix_single_issue(issue: dict):
    """Fix a single issue."""
    if not issue.get("auto_fixable"):
        raise HTTPException(status_code=400, detail="Problem nicht automatisch behebbar")
    
    result = await auto_fix_issue(issue)
    return result


@router.delete("/reports/cleanup")
async def cleanup_old_reports(days: int = 30):
    """Delete health reports older than specified days."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    result = await db.health_reports.delete_many({
        "timestamp": {"$lt": cutoff}
    })
    return {
        "success": True,
        "deleted_count": result.deleted_count
    }


# ==================== STATS ENDPOINT ====================

@router.get("/stats")
async def get_health_stats():
    """Get overall health statistics."""
    
    # Get latest report
    latest = await db.health_reports.find_one(
        {},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    # Count by severity
    pipeline = [
        {"$group": {
            "_id": "$overall_status",
            "count": {"$sum": 1}
        }}
    ]
    severity_counts = {}
    async for doc in db.health_reports.aggregate(pipeline):
        severity_counts[doc["_id"]] = doc["count"]
    
    # Count total issues in last 24h
    yesterday = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    recent_reports = await db.health_reports.find(
        {"timestamp": {"$gte": yesterday}},
        {"issue_count": 1, "_id": 0}
    ).to_list(100)
    total_issues_24h = sum(r.get("issue_count", 0) for r in recent_reports)
    
    return {
        "latest_report": latest,
        "reports_by_status": severity_counts,
        "total_issues_24h": total_issues_24h,
        "total_reports": await db.health_reports.count_documents({})
    }
