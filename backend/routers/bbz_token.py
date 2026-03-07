"""
BidBlitz Coin (BBZ) - Blockchain Wallet System
Preparation for BNB Smart Chain Token Integration
"""
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from pymongo import MongoClient
from typing import Optional
import os
import re

router = APIRouter(prefix="/bbz", tags=["BBZ Token"])

# MongoDB Connection
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "bidblitz")
client = MongoClient(mongo_url)
db = client[db_name]

# Collections
wallets_col = db["wallets"]
blockchain_wallets_col = db["blockchain_wallets"]
withdrawals_col = db["bbz_withdrawals"]
transactions_col = db["bbz_transactions"]

# BBZ Token Configuration
BBZ_CONFIG = {
    "name": "BidBlitz Coin",
    "symbol": "BBZ",
    "network": "BNB Smart Chain",
    "chain_id": 56,
    "decimals": 18,
    "contract_address": None,  # Will be set after deployment
    "total_supply": 1_000_000_000,
    "exchange_rate": 1,  # 1 In-App Coin = 1 BBZ Token
    "min_withdraw": 100,
    "withdraw_fee_percent": 2,
    "min_withdraw_fee": 10
}


def get_user_id_from_token(authorization: str) -> str:
    if not authorization:
        return "demo_user"
    try:
        token = authorization.replace("Bearer ", "")
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("user_id", "demo_user")
    except:
        return "demo_user"


def is_valid_bsc_address(address: str) -> bool:
    """Validate BNB Smart Chain wallet address"""
    if not address:
        return False
    # BSC addresses start with 0x and are 42 characters
    pattern = r'^0x[a-fA-F0-9]{40}$'
    return bool(re.match(pattern, address))


# ======================== TOKEN INFO ========================

@router.get("/info")
async def get_token_info():
    """Get BBZ token information"""
    return {
        "token": BBZ_CONFIG,
        "phase": "1",  # Phase 1: In-App, Phase 2: Blockchain
        "status": "preparation",
        "features": [
            "In-App Wallet ✅",
            "Blockchain Wallet Connection",
            "Token Withdrawal",
            "P2P Trading"
        ]
    }


# ======================== BLOCKCHAIN WALLET ========================

class ConnectWalletRequest(BaseModel):
    wallet_address: str


@router.post("/wallet/connect")
async def connect_blockchain_wallet(request: ConnectWalletRequest, authorization: str = Header(None)):
    """Connect external blockchain wallet"""
    user_id = get_user_id_from_token(authorization)
    now = datetime.now(timezone.utc)
    
    if not is_valid_bsc_address(request.wallet_address):
        raise HTTPException(status_code=400, detail="Ungültige BSC Wallet-Adresse! Muss mit 0x beginnen.")
    
    # Check if wallet already connected to another user
    existing = blockchain_wallets_col.find_one({"wallet_address": request.wallet_address.lower()})
    if existing and existing.get("user_id") != user_id:
        raise HTTPException(status_code=400, detail="Diese Wallet ist bereits mit einem anderen Account verbunden!")
    
    blockchain_wallets_col.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "wallet_address": request.wallet_address.lower(),
                "network": "BSC",
                "connected_at": now.isoformat(),
                "verified": False
            },
            "$setOnInsert": {"created_at": now.isoformat()}
        },
        upsert=True
    )
    
    return {
        "success": True,
        "wallet_address": request.wallet_address.lower(),
        "network": "BNB Smart Chain",
        "message": "Wallet erfolgreich verbunden! 🔗"
    }


@router.get("/wallet/status")
async def get_wallet_status(authorization: str = Header(None)):
    """Get user's blockchain wallet status"""
    user_id = get_user_id_from_token(authorization)
    
    # Get in-app wallet
    app_wallet = wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get blockchain wallet
    blockchain_wallet = blockchain_wallets_col.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get pending withdrawals
    pending = withdrawals_col.count_documents({"user_id": user_id, "status": "pending"})
    
    return {
        "app_wallet": {
            "coins": app_wallet.get("coins", 0) if app_wallet else 0,
            "total_earned": app_wallet.get("total_earned", 0) if app_wallet else 0
        },
        "blockchain_wallet": {
            "connected": blockchain_wallet is not None,
            "address": blockchain_wallet.get("wallet_address") if blockchain_wallet else None,
            "network": blockchain_wallet.get("network") if blockchain_wallet else None,
            "verified": blockchain_wallet.get("verified", False) if blockchain_wallet else False
        },
        "pending_withdrawals": pending,
        "exchange_rate": BBZ_CONFIG["exchange_rate"],
        "min_withdraw": BBZ_CONFIG["min_withdraw"]
    }


@router.delete("/wallet/disconnect")
async def disconnect_wallet(authorization: str = Header(None)):
    """Disconnect blockchain wallet"""
    user_id = get_user_id_from_token(authorization)
    
    result = blockchain_wallets_col.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Keine Wallet verbunden")
    
    return {
        "success": True,
        "message": "Wallet getrennt"
    }


# ======================== WITHDRAWALS ========================

class WithdrawRequest(BaseModel):
    amount: int


@router.post("/withdraw")
async def withdraw_to_blockchain(request: WithdrawRequest, authorization: str = Header(None)):
    """Withdraw coins to blockchain wallet as BBZ tokens"""
    user_id = get_user_id_from_token(authorization)
    now = datetime.now(timezone.utc)
    
    # Check blockchain wallet connected
    blockchain_wallet = blockchain_wallets_col.find_one({"user_id": user_id})
    if not blockchain_wallet:
        raise HTTPException(status_code=400, detail="Bitte zuerst eine Blockchain-Wallet verbinden!")
    
    # Check minimum
    if request.amount < BBZ_CONFIG["min_withdraw"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum Auszahlung: {BBZ_CONFIG['min_withdraw']} Coins"
        )
    
    # Check balance
    wallet = wallets_col.find_one({"user_id": user_id})
    current_coins = wallet.get("coins", 0) if wallet else 0
    
    # Calculate fee
    fee = max(
        BBZ_CONFIG["min_withdraw_fee"],
        int(request.amount * BBZ_CONFIG["withdraw_fee_percent"] / 100)
    )
    total_deduct = request.amount + fee
    
    if current_coins < total_deduct:
        raise HTTPException(
            status_code=400, 
            detail=f"Nicht genug Coins! Benötigt: {total_deduct} (inkl. {fee} Gebühr)"
        )
    
    # Deduct from wallet
    wallets_col.update_one(
        {"user_id": user_id},
        {"$inc": {"coins": -total_deduct, "total_withdrawn": request.amount}}
    )
    
    # Create withdrawal record
    withdrawal = {
        "user_id": user_id,
        "amount": request.amount,
        "fee": fee,
        "bbz_amount": request.amount * BBZ_CONFIG["exchange_rate"],
        "wallet_address": blockchain_wallet.get("wallet_address"),
        "network": "BSC",
        "status": "pending",
        "created_at": now.isoformat(),
        "tx_hash": None
    }
    result = withdrawals_col.insert_one(withdrawal)
    
    new_balance = current_coins - total_deduct
    
    return {
        "success": True,
        "withdrawal_id": str(result.inserted_id),
        "amount": request.amount,
        "fee": fee,
        "bbz_tokens": request.amount * BBZ_CONFIG["exchange_rate"],
        "wallet_address": blockchain_wallet.get("wallet_address"),
        "status": "pending",
        "new_balance": new_balance,
        "message": f"Auszahlung von {request.amount} BBZ beantragt! ⏳"
    }


@router.get("/withdrawals")
async def get_withdrawals(authorization: str = Header(None)):
    """Get user's withdrawal history"""
    user_id = get_user_id_from_token(authorization)
    
    withdrawals = list(withdrawals_col.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20))
    
    # Add ID from _id
    for i, w in enumerate(withdrawals):
        w["id"] = i + 1
    
    return {
        "withdrawals": withdrawals,
        "count": len(withdrawals)
    }


# ======================== P2P TRANSFERS ========================

class TransferRequest(BaseModel):
    to_address: str
    amount: int


@router.post("/transfer")
async def transfer_bbz(request: TransferRequest, authorization: str = Header(None)):
    """Transfer BBZ to another wallet (P2P)"""
    user_id = get_user_id_from_token(authorization)
    now = datetime.now(timezone.utc)
    
    if not is_valid_bsc_address(request.to_address):
        raise HTTPException(status_code=400, detail="Ungültige Empfänger-Adresse!")
    
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Ungültiger Betrag")
    
    # Check balance
    wallet = wallets_col.find_one({"user_id": user_id})
    current_coins = wallet.get("coins", 0) if wallet else 0
    
    if current_coins < request.amount:
        raise HTTPException(status_code=400, detail="Nicht genug Coins!")
    
    # Find recipient by wallet address
    recipient = blockchain_wallets_col.find_one({"wallet_address": request.to_address.lower()})
    
    # Deduct from sender
    wallets_col.update_one(
        {"user_id": user_id},
        {"$inc": {"coins": -request.amount, "total_sent": request.amount}}
    )
    
    # Add to recipient if they exist in system
    if recipient:
        wallets_col.update_one(
            {"user_id": recipient["user_id"]},
            {
                "$inc": {"coins": request.amount, "total_received": request.amount},
                "$setOnInsert": {"created_at": now.isoformat()}
            },
            upsert=True
        )
    
    # Record transaction
    transactions_col.insert_one({
        "from_user": user_id,
        "to_address": request.to_address.lower(),
        "to_user": recipient["user_id"] if recipient else None,
        "amount": request.amount,
        "type": "p2p_transfer",
        "status": "completed",
        "created_at": now.isoformat()
    })
    
    new_balance = current_coins - request.amount
    
    return {
        "success": True,
        "amount": request.amount,
        "to_address": request.to_address,
        "new_balance": new_balance,
        "message": f"{request.amount} BBZ gesendet! ✅"
    }


# ======================== TRANSACTION HISTORY ========================

@router.get("/transactions")
async def get_transactions(authorization: str = Header(None)):
    """Get user's BBZ transaction history"""
    user_id = get_user_id_from_token(authorization)
    
    # Get sent and received
    sent = list(transactions_col.find(
        {"from_user": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10))
    
    received = list(transactions_col.find(
        {"to_user": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10))
    
    # Mark direction
    for t in sent:
        t["direction"] = "out"
    for t in received:
        t["direction"] = "in"
    
    # Combine and sort
    all_transactions = sorted(
        sent + received,
        key=lambda x: x.get("created_at", ""),
        reverse=True
    )[:20]
    
    return {
        "transactions": all_transactions,
        "count": len(all_transactions)
    }


# ======================== ADMIN ENDPOINTS ========================

@router.post("/admin/process-withdrawal")
async def process_withdrawal(withdrawal_id: str, tx_hash: str, status: str = "completed"):
    """Admin: Process a withdrawal request"""
    now = datetime.now(timezone.utc)
    
    from bson import ObjectId
    
    result = withdrawals_col.update_one(
        {"_id": ObjectId(withdrawal_id)},
        {
            "$set": {
                "status": status,
                "tx_hash": tx_hash,
                "processed_at": now.isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    return {
        "success": True,
        "message": f"Withdrawal {status}"
    }


@router.get("/admin/pending-withdrawals")
async def get_pending_withdrawals():
    """Admin: Get all pending withdrawals"""
    pending = list(withdrawals_col.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", 1))
    
    return {
        "pending": pending,
        "count": len(pending)
    }
