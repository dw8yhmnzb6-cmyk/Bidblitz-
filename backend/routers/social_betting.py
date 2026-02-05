"""Social Betting - Bet on auction winners with virtual points"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/betting", tags=["Social Betting"])

# Virtual currency name
CURRENCY_NAME = "BidCoins"
STARTING_BALANCE = 1000
DAILY_BONUS = 50

@router.get("/balance")
async def get_betting_balance(user: dict = Depends(get_current_user)):
    """Get user's betting balance"""
    balance = await db.betting_balances.find_one({"user_id": user["id"]}, {"_id": 0})
    
    if not balance:
        # Create initial balance
        balance = {
            "user_id": user["id"],
            "balance": STARTING_BALANCE,
            "total_won": 0,
            "total_lost": 0,
            "total_bets": 0,
            "winning_bets": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.betting_balances.insert_one(balance)
        del balance["_id"]
    
    # Check for daily bonus
    last_bonus = balance.get("last_daily_bonus")
    can_claim_bonus = True
    
    if last_bonus:
        try:
            last_dt = datetime.fromisoformat(last_bonus.replace("Z", "+00:00"))
            if (datetime.now(timezone.utc) - last_dt).days < 1:
                can_claim_bonus = False
        except:
            pass
    
    return {
        "balance": balance.get("balance", STARTING_BALANCE),
        "currency": CURRENCY_NAME,
        "total_won": balance.get("total_won", 0),
        "total_lost": balance.get("total_lost", 0),
        "total_bets": balance.get("total_bets", 0),
        "win_rate": round((balance.get("winning_bets", 0) / max(1, balance.get("total_bets", 1))) * 100, 1),
        "can_claim_daily_bonus": can_claim_bonus,
        "daily_bonus_amount": DAILY_BONUS
    }

@router.post("/claim-daily-bonus")
async def claim_daily_bonus(user: dict = Depends(get_current_user)):
    """Claim daily betting bonus"""
    balance = await db.betting_balances.find_one({"user_id": user["id"]})
    
    if balance:
        last_bonus = balance.get("last_daily_bonus")
        if last_bonus:
            try:
                last_dt = datetime.fromisoformat(last_bonus.replace("Z", "+00:00"))
                if (datetime.now(timezone.utc) - last_dt).days < 1:
                    raise HTTPException(status_code=400, detail="Täglicher Bonus bereits abgeholt")
            except ValueError:
                pass
    
    await db.betting_balances.update_one(
        {"user_id": user["id"]},
        {
            "$inc": {"balance": DAILY_BONUS},
            "$set": {"last_daily_bonus": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"success": True, "bonus": DAILY_BONUS, "message": f"+{DAILY_BONUS} {CURRENCY_NAME}!"}

@router.post("/place-bet/{auction_id}")
async def place_bet(
    auction_id: str,
    predicted_winner: str,  # user_id or "bot"
    amount: int,
    user: dict = Depends(get_current_user)
):
    """Place a bet on who will win an auction"""
    if amount < 10:
        raise HTTPException(status_code=400, detail="Mindesteinsatz: 10 " + CURRENCY_NAME)
    if amount > 500:
        raise HTTPException(status_code=400, detail="Maximaleinsatz: 500 " + CURRENCY_NAME)
    
    # Check auction exists and is active
    auction = await db.auctions.find_one({"id": auction_id, "status": "active"}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden oder beendet")
    
    # Check user balance
    balance = await db.betting_balances.find_one({"user_id": user["id"]})
    current_balance = balance.get("balance", 0) if balance else STARTING_BALANCE
    
    if current_balance < amount:
        raise HTTPException(status_code=400, detail="Nicht genug " + CURRENCY_NAME)
    
    # Check if already bet on this auction
    existing_bet = await db.auction_bets.find_one({
        "auction_id": auction_id,
        "user_id": user["id"],
        "status": "active"
    })
    
    if existing_bet:
        raise HTTPException(status_code=400, detail="Du hast bereits auf diese Auktion gewettet")
    
    # Calculate odds based on current situation
    bid_history = auction.get("bid_history", [])
    total_bids = len(bid_history)
    
    # Get predicted winner info
    if predicted_winner == "bot":
        odds = 1.5  # Bots usually don't win
    else:
        # Check if predicted winner has bid recently
        recent_bids = [b for b in bid_history[-10:] if b.get("user_id") == predicted_winner]
        if len(recent_bids) > 0:
            odds = 2.0 + (10 - len(recent_bids)) * 0.2
        else:
            odds = 5.0  # Higher odds for someone not actively bidding
    
    odds = round(min(10.0, max(1.2, odds)), 2)
    
    # Create bet
    bet = {
        "id": str(uuid.uuid4()),
        "auction_id": auction_id,
        "user_id": user["id"],
        "user_name": user.get("name", "Anonym"),
        "predicted_winner": predicted_winner,
        "amount": amount,
        "odds": odds,
        "potential_win": int(amount * odds),
        "status": "active",
        "placed_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Deduct balance
    await db.betting_balances.update_one(
        {"user_id": user["id"]},
        {"$inc": {"balance": -amount, "total_bets": 1}},
        upsert=True
    )
    
    await db.auction_bets.insert_one(bet)
    
    del bet["_id"]
    return {
        "success": True,
        "bet": bet,
        "new_balance": current_balance - amount
    }

@router.get("/my-bets")
async def get_my_bets(status: str = "all", user: dict = Depends(get_current_user)):
    """Get user's betting history"""
    query = {"user_id": user["id"]}
    if status != "all":
        query["status"] = status
    
    bets = await db.auction_bets.find(query, {"_id": 0}).sort("placed_at", -1).limit(50).to_list(50)
    
    # Enrich with auction info
    result = []
    for bet in bets:
        auction = await db.auctions.find_one({"id": bet["auction_id"]}, {"_id": 0, "product_id": 1, "status": 1})
        product = None
        if auction:
            product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0, "name": 1})
        
        result.append({
            **bet,
            "product_name": product.get("name") if product else "Auktion",
            "auction_status": auction.get("status") if auction else "unknown"
        })
    
    return {"bets": result}

@router.get("/auction-bets/{auction_id}")
async def get_auction_bets(auction_id: str):
    """Get all bets on an auction (anonymized)"""
    bets = await db.auction_bets.find(
        {"auction_id": auction_id},
        {"_id": 0, "user_id": 0, "user_name": 0}  # Anonymize
    ).to_list(100)
    
    # Aggregate by predicted winner
    predictions = {}
    total_amount = 0
    
    for bet in bets:
        winner = bet.get("predicted_winner")
        if winner not in predictions:
            predictions[winner] = {"bets": 0, "total_amount": 0}
        predictions[winner]["bets"] += 1
        predictions[winner]["total_amount"] += bet.get("amount", 0)
        total_amount += bet.get("amount", 0)
    
    return {
        "auction_id": auction_id,
        "total_bets": len(bets),
        "total_amount": total_amount,
        "predictions": predictions
    }

@router.get("/leaderboard")
async def get_betting_leaderboard(limit: int = 20):
    """Get betting leaderboard"""
    pipeline = [
        {"$sort": {"total_won": -1}},
        {"$limit": limit},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "balance": 1,
            "total_won": 1,
            "total_bets": 1,
            "winning_bets": 1
        }}
    ]
    
    leaders = await db.betting_balances.aggregate(pipeline).to_list(limit)
    
    # Anonymize names
    result = []
    for i, leader in enumerate(leaders):
        user = await db.users.find_one({"id": leader["user_id"]}, {"_id": 0, "name": 1})
        name = user.get("name", "Anonym") if user else "Anonym"
        if len(name) > 2:
            name = name[0] + "*" * (len(name) - 2) + name[-1]
        
        win_rate = (leader.get("winning_bets", 0) / max(1, leader.get("total_bets", 1))) * 100
        
        result.append({
            "rank": i + 1,
            "name": name,
            "balance": leader.get("balance", 0),
            "total_won": leader.get("total_won", 0),
            "win_rate": round(win_rate, 1)
        })
    
    return {"leaderboard": result}

# Called when auction ends - settle all bets
async def settle_auction_bets(auction_id: str, winner_id: str):
    """Settle all bets for an ended auction"""
    bets = await db.auction_bets.find({
        "auction_id": auction_id,
        "status": "active"
    }).to_list(1000)
    
    for bet in bets:
        is_winner = bet.get("predicted_winner") == winner_id
        
        if is_winner:
            # Pay out winnings
            winnings = bet.get("potential_win", 0)
            await db.betting_balances.update_one(
                {"user_id": bet["user_id"]},
                {"$inc": {"balance": winnings, "total_won": winnings, "winning_bets": 1}}
            )
            status = "won"
        else:
            # Record loss
            await db.betting_balances.update_one(
                {"user_id": bet["user_id"]},
                {"$inc": {"total_lost": bet.get("amount", 0)}}
            )
            status = "lost"
        
        # Update bet status
        await db.auction_bets.update_one(
            {"id": bet["id"]},
            {"$set": {
                "status": status,
                "actual_winner": winner_id,
                "settled_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    logger.info(f"Settled {len(bets)} bets for auction {auction_id}")
