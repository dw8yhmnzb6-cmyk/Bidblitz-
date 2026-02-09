"""Digital Wallet Router - Apple/Google Wallet integration for won products"""
from fastapi import APIRouter, HTTPException, Depends, Response
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel
import uuid
import json
import base64

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/wallet", tags=["Digital Wallet"])

# ==================== ENDPOINTS ====================

@router.get("/my-passes")
async def get_my_wallet_passes(user: dict = Depends(get_current_user)):
    """Get all wallet passes for won auctions"""
    user_id = user["id"]
    
    # Get won auctions
    won_auctions = await db.auctions.find(
        {"winner_id": user_id, "status": "ended"},
        {"_id": 0}
    ).sort("ended_at", -1).to_list(50)
    
    passes = []
    for auction in won_auctions:
        # Check if pass was already generated
        existing_pass = await db.wallet_passes.find_one({
            "auction_id": auction["id"],
            "user_id": user_id
        })
        
        pass_data = {
            "auction_id": auction["id"],
            "product_name": auction.get("product_name", "Produkt"),
            "product_image": auction.get("product_image"),
            "won_price": auction.get("current_price", 0),
            "retail_price": auction.get("product_retail_price", 0),
            "won_at": auction.get("ended_at"),
            "pass_generated": existing_pass is not None,
            "pass_id": existing_pass.get("id") if existing_pass else None,
            "shipping_status": existing_pass.get("shipping_status", "pending") if existing_pass else "pending"
        }
        
        passes.append(pass_data)
    
    return {"passes": passes, "total": len(passes)}

@router.post("/generate/{auction_id}")
async def generate_wallet_pass(auction_id: str, user: dict = Depends(get_current_user)):
    """Generate a digital wallet pass for a won auction"""
    user_id = user["id"]
    
    # Verify user won this auction
    auction = await db.auctions.find_one({
        "id": auction_id,
        "winner_id": user_id,
        "status": "ended"
    }, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=403, detail="Du hast diese Auktion nicht gewonnen")
    
    # Check if pass already exists
    existing = await db.wallet_passes.find_one({
        "auction_id": auction_id,
        "user_id": user_id
    })
    
    if existing:
        return {
            "message": "Pass bereits generiert",
            "pass_id": existing["id"],
            "pass_data": existing
        }
    
    # Generate pass data
    pass_id = str(uuid.uuid4())
    tracking_code = f"BB{auction_id[:8].upper()}"
    
    pass_data = {
        "id": pass_id,
        "user_id": user_id,
        "auction_id": auction_id,
        "product_name": auction.get("product_name", "Produkt"),
        "product_image": auction.get("product_image"),
        "won_price": auction.get("current_price", 0),
        "retail_price": auction.get("product_retail_price", 0),
        "savings_percent": round(
            (1 - auction.get("current_price", 0) / auction.get("product_retail_price", 1)) * 100
        ) if auction.get("product_retail_price", 0) > 0 else 0,
        "tracking_code": tracking_code,
        "barcode_data": f"BIDBLITZ-{pass_id[:12].upper()}",
        "shipping_status": "processing",
        "shipping_updates": [
            {
                "status": "won",
                "message": "Auktion gewonnen!",
                "timestamp": auction.get("ended_at")
            },
            {
                "status": "processing",
                "message": "Bestellung wird bearbeitet",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ],
        "won_at": auction.get("ended_at"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.wallet_passes.insert_one(pass_data)
    
    logger.info(f"Wallet pass generated: {pass_id} for user {user_id}")
    
    return {
        "message": "Pass erfolgreich erstellt!",
        "pass_id": pass_id,
        "pass_data": {k: v for k, v in pass_data.items() if k != "_id"},
        "add_to_wallet_available": True
    }

@router.get("/pass/{pass_id}")
async def get_wallet_pass(pass_id: str, user: dict = Depends(get_current_user)):
    """Get details of a specific wallet pass"""
    pass_data = await db.wallet_passes.find_one(
        {"id": pass_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not pass_data:
        raise HTTPException(status_code=404, detail="Pass nicht gefunden")
    
    return {"pass": pass_data}

@router.get("/pass/{pass_id}/apple")
async def get_apple_wallet_pass(pass_id: str, user: dict = Depends(get_current_user)):
    """Generate Apple Wallet .pkpass file (simplified version)"""
    pass_data = await db.wallet_passes.find_one(
        {"id": pass_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not pass_data:
        raise HTTPException(status_code=404, detail="Pass nicht gefunden")
    
    # Note: Full Apple Wallet integration requires:
    # 1. Apple Developer account
    # 2. Pass Type ID certificate
    # 3. Signing the .pkpass file
    
    # Return pass JSON structure (would be packaged into .pkpass)
    apple_pass = {
        "formatVersion": 1,
        "passTypeIdentifier": "pass.de.bidblitz.winner",
        "serialNumber": pass_id,
        "teamIdentifier": "BIDBLITZ",
        "organizationName": "BidBlitz",
        "description": f"Gewonnen: {pass_data['product_name']}",
        "logoText": "BidBlitz",
        "foregroundColor": "rgb(255, 255, 255)",
        "backgroundColor": "rgb(139, 92, 246)",
        "generic": {
            "primaryFields": [
                {
                    "key": "product",
                    "label": "PRODUKT",
                    "value": pass_data["product_name"]
                }
            ],
            "secondaryFields": [
                {
                    "key": "price",
                    "label": "GEWONNEN FÜR",
                    "value": f"€{pass_data['won_price']:.2f}"
                },
                {
                    "key": "savings",
                    "label": "ERSPARNIS",
                    "value": f"{pass_data['savings_percent']}%"
                }
            ],
            "auxiliaryFields": [
                {
                    "key": "status",
                    "label": "STATUS",
                    "value": pass_data["shipping_status"].upper()
                }
            ],
            "backFields": [
                {
                    "key": "tracking",
                    "label": "Tracking-Code",
                    "value": pass_data["tracking_code"]
                },
                {
                    "key": "support",
                    "label": "Support",
                    "value": "support@bidblitz.de"
                }
            ]
        },
        "barcode": {
            "message": pass_data["barcode_data"],
            "format": "PKBarcodeFormatQR",
            "messageEncoding": "iso-8859-1"
        }
    }
    
    return {
        "pass_json": apple_pass,
        "note": "Vollständige Apple Wallet Integration erfordert Entwickler-Zertifikat",
        "download_ready": False
    }

@router.get("/pass/{pass_id}/google")
async def get_google_wallet_pass(pass_id: str, user: dict = Depends(get_current_user)):
    """Generate Google Wallet pass URL"""
    pass_data = await db.wallet_passes.find_one(
        {"id": pass_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not pass_data:
        raise HTTPException(status_code=404, detail="Pass nicht gefunden")
    
    # Google Wallet pass object (would be sent to Google Pay API)
    google_pass = {
        "id": f"bidblitz.{pass_id}",
        "classId": "bidblitz.winner_pass",
        "state": "ACTIVE",
        "heroImage": {
            "sourceUri": {
                "uri": pass_data.get("product_image", "")
            }
        },
        "textModulesData": [
            {
                "header": "Produkt",
                "body": pass_data["product_name"]
            },
            {
                "header": "Gewonnen für",
                "body": f"€{pass_data['won_price']:.2f}"
            },
            {
                "header": "Ersparnis",
                "body": f"{pass_data['savings_percent']}%"
            }
        ],
        "barcode": {
            "type": "QR_CODE",
            "value": pass_data["barcode_data"]
        }
    }
    
    return {
        "pass_object": google_pass,
        "note": "Vollständige Google Wallet Integration erfordert API-Zugang",
        "download_ready": False
    }

@router.put("/pass/{pass_id}/shipping")
async def update_shipping_status(
    pass_id: str,
    status: str,
    message: Optional[str] = None
):
    """Update shipping status for a wallet pass (admin/internal use)"""
    valid_statuses = ["processing", "shipped", "in_transit", "out_for_delivery", "delivered"]
    
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Ungültiger Status. Erlaubt: {valid_statuses}")
    
    # Update pass
    update = {
        "$set": {"shipping_status": status},
        "$push": {
            "shipping_updates": {
                "status": status,
                "message": message or status.replace("_", " ").title(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    }
    
    result = await db.wallet_passes.update_one({"id": pass_id}, update)
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pass nicht gefunden")
    
    return {"message": "Status aktualisiert", "new_status": status}


wallet_router = router
