"""
BidBlitz BBZ Token Wallet
Create wallet, check balance, send tokens, view transactions
"""
from fastapi import APIRouter
import time

router = APIRouter(tags=["BBZ Token Wallet"])

bbz_wallets = {}
transactions = []


# Wallet erstellen
@router.post("/bbz/create")
def create_wallet(user_id: str):
    if user_id not in bbz_wallets:
        bbz_wallets[user_id] = 100
    
    return {
        "user": user_id,
        "bbz_balance": bbz_wallets[user_id]
    }


# Balance anzeigen
@router.get("/bbz/balance")
def balance(user_id: str):
    return {
        "user": user_id,
        "bbz_balance": bbz_wallets.get(user_id, 0)
    }


# Coins senden
@router.post("/bbz/send")
def send(from_user: str, to_user: str, amount: int):
    if bbz_wallets.get(from_user, 0) < amount:
        return {"error": "not enough BBZ"}
    
    bbz_wallets[from_user] -= amount
    bbz_wallets[to_user] = bbz_wallets.get(to_user, 0) + amount
    
    transactions.append({
        "from": from_user,
        "to": to_user,
        "amount": amount,
        "time": time.time()
    })
    
    return {
        "from": from_user,
        "to": to_user,
        "amount": amount
    }


# Transaktionen anzeigen
@router.get("/bbz/transactions")
def tx():
    return transactions
