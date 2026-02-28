"""
Credit KYC - Extended verification for loans
Upload: 3 pay slips + ID front/back + Selfie with ID
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone
import uuid, os, shutil

from dependencies import get_current_user, get_admin_user
from config import db

router = APIRouter(prefix="/credit-kyc", tags=["Credit KYC"])

UPLOAD_DIR = "/var/www/bidblitz/backend/uploads/credit_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-document")
async def upload_credit_document(
    doc_type: str = Form(...),  # payslip_1, payslip_2, payslip_3, id_front, id_back, selfie
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload a document for credit verification"""
    valid_types = ["payslip_1", "payslip_2", "payslip_3", "id_front", "id_back", "selfie"]
    if doc_type not in valid_types:
        raise HTTPException(400, f"Ungültiger Dokumenttyp. Erlaubt: {valid_types}")

    if file.size > 10 * 1024 * 1024:
        raise HTTPException(400, "Datei zu groß (max 10MB)")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in ["jpg", "jpeg", "png", "pdf"]:
        raise HTTPException(400, "Nur JPG, PNG oder PDF erlaubt")

    # Save file
    file_id = str(uuid.uuid4())
    filename = f"{user['id']}_{doc_type}_{file_id}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    now = datetime.now(timezone.utc).isoformat()

    # Save document reference
    doc = {
        "id": file_id,
        "user_id": user["id"],
        "user_name": user.get("name"),
        "doc_type": doc_type,
        "filename": filename,
        "original_name": file.filename,
        "file_size": file.size,
        "status": "uploaded",
        "created_at": now
    }
    await db.credit_documents.insert_one(doc)

    # Update user's credit_kyc status
    existing = await db.credit_kyc.find_one({"user_id": user["id"]})
    if not existing:
        await db.credit_kyc.insert_one({
            "user_id": user["id"],
            "user_name": user.get("name"),
            "status": "incomplete",
            "documents": {doc_type: file_id},
            "created_at": now,
            "updated_at": now
        })
    else:
        await db.credit_kyc.update_one(
            {"user_id": user["id"]},
            {"$set": {f"documents.{doc_type}": file_id, "updated_at": now}}
        )

    # Check if all documents are uploaded
    kyc = await db.credit_kyc.find_one({"user_id": user["id"]})
    docs = kyc.get("documents", {}) if kyc else {}
    required = ["payslip_1", "payslip_2", "payslip_3", "id_front", "id_back", "selfie"]
    all_uploaded = all(docs.get(r) for r in required)

    doc.pop("_id", None)
    return {
        "success": True,
        "document": doc,
        "all_uploaded": all_uploaded,
        "uploaded_count": sum(1 for r in required if docs.get(r)),
        "total_required": len(required),
        "message": f"{doc_type} hochgeladen. {'Alle Dokumente vollständig!' if all_uploaded else f'{sum(1 for r in required if docs.get(r))}/{len(required)} Dokumente hochgeladen.'}"
    }


@router.post("/submit")
async def submit_credit_kyc(user: dict = Depends(get_current_user)):
    """Submit credit KYC for review"""
    kyc = await db.credit_kyc.find_one({"user_id": user["id"]})
    if not kyc:
        raise HTTPException(400, "Keine Dokumente hochgeladen")

    docs = kyc.get("documents", {})
    required = ["payslip_1", "payslip_2", "payslip_3", "id_front", "id_back", "selfie"]
    missing = [r for r in required if not docs.get(r)]

    if missing:
        raise HTTPException(400, f"Fehlende Dokumente: {', '.join(missing)}")

    await db.credit_kyc.update_one(
        {"user_id": user["id"]},
        {"$set": {"status": "submitted", "submitted_at": datetime.now(timezone.utc).isoformat()}}
    )

    return {"success": True, "message": "Kreditprüfung eingereicht. Wird innerhalb von 5 Minuten bearbeitet."}


@router.get("/status")
async def get_credit_kyc_status(user: dict = Depends(get_current_user)):
    """Get credit KYC verification status"""
    kyc = await db.credit_kyc.find_one({"user_id": user["id"]}, {"_id": 0})
    if not kyc:
        return {"status": "not_started", "documents": {}, "uploaded_count": 0, "total_required": 6}

    docs = kyc.get("documents", {})
    required = ["payslip_1", "payslip_2", "payslip_3", "id_front", "id_back", "selfie"]

    return {
        "status": kyc.get("status", "incomplete"),
        "documents": {r: bool(docs.get(r)) for r in required},
        "uploaded_count": sum(1 for r in required if docs.get(r)),
        "total_required": len(required),
        "rejection_reason": kyc.get("rejection_reason")
    }


@router.get("/admin/pending")
async def admin_get_pending(admin: dict = Depends(get_admin_user)):
    """Admin: Get pending credit KYC submissions"""
    pending = await db.credit_kyc.find(
        {"status": "submitted"}, {"_id": 0}
    ).to_list(100)
    return {"pending": pending}


@router.post("/admin/approve/{user_id}")
async def admin_approve(user_id: str, admin: dict = Depends(get_admin_user)):
    """Admin: Approve credit KYC"""
    now = datetime.now(timezone.utc).isoformat()
    await db.credit_kyc.update_one(
        {"user_id": user_id},
        {"$set": {"status": "approved", "approved_at": now, "approved_by": admin["id"]}}
    )
    await db.users.update_one({"id": user_id}, {"$set": {"credit_kyc_status": "approved"}})
    return {"success": True, "message": "Kredit-KYC genehmigt"}


@router.post("/admin/reject/{user_id}")
async def admin_reject(user_id: str, reason: str = "Dokumente unvollständig", admin: dict = Depends(get_admin_user)):
    """Admin: Reject credit KYC"""
    await db.credit_kyc.update_one(
        {"user_id": user_id},
        {"$set": {"status": "rejected", "rejection_reason": reason}}
    )
    return {"success": True, "message": "Kredit-KYC abgelehnt"}
