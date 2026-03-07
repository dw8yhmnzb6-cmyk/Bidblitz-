"""
BidBlitz BBZ Token Wallet
Create wallet, check balance, send tokens, view transactions
"""
from fastapi import APIRouter
import time

router = APIRouter(prefix="/bbz", tags=["BBZ Token Wallet"])

bbz_wallets = {}
transactions = []


# Wallet erstellen
@router.post("/create")
def create_wallet(user_id: str):
    if user_id not in bbz_wallets:
        bbz_wallets[user_id] = 100
    
    return {
        "user": user_id,
        "bbz_balance": bbz_wallets[user_id]
    }


# Balance anzeigen
@router.get("/balance")
def balance(user_id: str):
    return {
        "user": user_id,
        "bbz_balance": bbz_wallets.get(user_id, 0)
    }


# Coins senden
@router.post("/send")
def send(from_user: str, to_user: str, amount: int):
    if bbz_wallets.get(from_user, 0) < amount:
        return {"error": "not enough BBZ"}
    
    if amount <= 0:
        return {"error": "invalid amount"}
    
    if from_user == to_user:
        return {"error": "cannot send to yourself"}
    
    bbz_wallets[from_user] -= amount
    bbz_wallets[to_user] = bbz_wallets.get(to_user, 0) + amount
    
    transactions.append({
        "from": from_user,
        "to": to_user,
        "amount": amount,
        "time": time.time()
    })
    
    return {
        "success": True,
        "from": from_user,
        "to": to_user,
        "amount": amount,
        "new_balance": bbz_wallets[from_user]
    }


# Transaktionen anzeigen
@router.get("/transactions")
def tx():
    return {"transactions": transactions[-50:]}


# User Transaktionen
@router.get("/transactions/user")
def user_tx(user_id: str):
    user_transactions = [
        t for t in transactions 
        if t["from"] == user_id or t["to"] == user_id
    ]
    return {"transactions": user_transactions[-20:]}


# Wallet Info
@router.get("/wallet")
def wallet_info(user_id: str):
    balance = bbz_wallets.get(user_id, 0)
    user_txs = [t for t in transactions if t["from"] == user_id or t["to"] == user_id]
    
    return {
        "user": user_id,
        "bbz_balance": balance,
        "total_sent": sum(t["amount"] for t in user_txs if t["from"] == user_id),
        "total_received": sum(t["amount"] for t in user_txs if t["to"] == user_id),
        "transaction_count": len(user_txs)
    }
