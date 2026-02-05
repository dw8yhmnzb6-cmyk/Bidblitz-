# Loyalty Points & Rewards System
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter(prefix="/api/loyalty", tags=["Loyalty"])

# Loyalty Tiers
LOYALTY_TIERS = [
    {"tier": "bronze", "name": "Bronze", "min_points": 0, "color": "#CD7F32", "perks": ["Basis-Zugang"], "multiplier": 1.0},
    {"tier": "silver", "name": "Silber", "min_points": 500, "color": "#C0C0C0", "perks": ["5% Bonus-Gebote", "Früher Zugang zu Auktionen"], "multiplier": 1.05},
    {"tier": "gold", "name": "Gold", "min_points": 2000, "color": "#FFD700", "perks": ["10% Bonus-Gebote", "Exklusive Auktionen", "Priority Support"], "multiplier": 1.10},
    {"tier": "platinum", "name": "Platin", "min_points": 5000, "color": "#E5E4E2", "perks": ["15% Bonus-Gebote", "VIP-Auktionen", "Persönlicher Berater", "Gratis Versand"], "multiplier": 1.15},
    {"tier": "diamond", "name": "Diamant", "min_points": 15000, "color": "#B9F2FF", "perks": ["20% Bonus-Gebote", "Alle Features", "Exklusivste Deals", "Meet & Greet Events"], "multiplier": 1.20},
]

# Rewards Catalog
REWARDS_CATALOG = [
    {"id": "bids_10", "name": "10 Gebote", "points_required": 100, "type": "bids", "value": 10},
    {"id": "bids_25", "name": "25 Gebote", "points_required": 225, "type": "bids", "value": 25},
    {"id": "bids_50", "name": "50 Gebote", "points_required": 400, "type": "bids", "value": 50},
    {"id": "bids_100", "name": "100 Gebote", "points_required": 750, "type": "bids", "value": 100},
    {"id": "discount_5", "name": "5% Rabatt-Code", "points_required": 200, "type": "discount", "value": 5},
    {"id": "discount_10", "name": "10% Rabatt-Code", "points_required": 350, "type": "discount", "value": 10},
    {"id": "discount_20", "name": "20% Rabatt-Code", "points_required": 600, "type": "discount", "value": 20},
    {"id": "free_shipping", "name": "Gratis Versand", "points_required": 150, "type": "shipping", "value": 1},
    {"id": "vip_day", "name": "1 Tag VIP-Status", "points_required": 500, "type": "vip", "value": 1},
    {"id": "vip_week", "name": "1 Woche VIP-Status", "points_required": 2000, "type": "vip", "value": 7},
    {"id": "mystery_box", "name": "Mystery Box", "points_required": 1000, "type": "mystery", "value": 1},
    {"id": "exclusive_auction", "name": "Exklusive Auktion Zugang", "points_required": 1500, "type": "access", "value": 1},
]

class RedeemRequest(BaseModel):
    reward_id: str

@router.get("/status/{user_id}")
async def get_loyalty_status(user_id: str):
    """Get user's loyalty status and points"""
    import random
    
    # Simulate user data
    total_points = random.randint(100, 8000)
    lifetime_points = total_points + random.randint(500, 5000)
    
    # Determine tier
    current_tier = LOYALTY_TIERS[0]
    next_tier = LOYALTY_TIERS[1] if len(LOYALTY_TIERS) > 1 else None
    
    for i, tier in enumerate(LOYALTY_TIERS):
        if lifetime_points >= tier["min_points"]:
            current_tier = tier
            next_tier = LOYALTY_TIERS[i + 1] if i + 1 < len(LOYALTY_TIERS) else None
    
    return {
        "user_id": user_id,
        "current_points": total_points,
        "lifetime_points": lifetime_points,
        "current_tier": current_tier,
        "next_tier": next_tier,
        "points_to_next_tier": next_tier["min_points"] - lifetime_points if next_tier else 0,
        "points_history": [
            {"date": (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"), "points": random.randint(10, 100), "source": random.choice(["Gebot", "Kauf", "Login", "Mission"])}
            for i in range(7)
        ]
    }

@router.get("/tiers")
async def get_loyalty_tiers():
    """Get all loyalty tiers and benefits"""
    return {
        "tiers": LOYALTY_TIERS,
        "earning_rates": {
            "per_euro_spent": 10,
            "per_bid": 1,
            "per_win": 50,
            "daily_login": 5,
            "referral": 200,
            "review": 25
        }
    }

@router.get("/rewards")
async def get_rewards_catalog():
    """Get available rewards to redeem"""
    return {
        "rewards": REWARDS_CATALOG,
        "categories": {
            "bids": [r for r in REWARDS_CATALOG if r["type"] == "bids"],
            "discounts": [r for r in REWARDS_CATALOG if r["type"] == "discount"],
            "perks": [r for r in REWARDS_CATALOG if r["type"] in ["shipping", "vip", "access"]],
            "special": [r for r in REWARDS_CATALOG if r["type"] == "mystery"]
        }
    }

@router.post("/redeem")
async def redeem_reward(request: RedeemRequest, user_id: Optional[str] = None):
    """Redeem points for a reward"""
    reward = next((r for r in REWARDS_CATALOG if r["id"] == request.reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Belohnung nicht gefunden")
    
    # In production: Check user has enough points, deduct points, grant reward
    
    return {
        "success": True,
        "reward": reward,
        "message": f"Du hast {reward['name']} erfolgreich eingelöst!",
        "points_spent": reward["points_required"],
        "redemption_code": f"REWARD-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}" if reward["type"] == "discount" else None
    }

@router.get("/history/{user_id}")
async def get_points_history(user_id: str, days: int = 30):
    """Get user's points earning/spending history"""
    import random
    
    history = []
    for i in range(min(days, 50)):
        date = datetime.utcnow() - timedelta(days=i)
        # Random transactions
        for _ in range(random.randint(0, 3)):
            is_earning = random.choice([True, True, True, False])  # 75% earning
            history.append({
                "date": date.isoformat(),
                "type": "earn" if is_earning else "spend",
                "points": random.randint(5, 100) if is_earning else -random.randint(50, 500),
                "source": random.choice(["Gebot", "Kauf", "Login-Bonus", "Mission", "Achievement"]) if is_earning else "Einlösung",
                "description": "Punkte verdient" if is_earning else "Belohnung eingelöst"
            })
    
    history.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "user_id": user_id,
        "history": history[:50],
        "total_earned": sum(h["points"] for h in history if h["points"] > 0),
        "total_spent": abs(sum(h["points"] for h in history if h["points"] < 0))
    }

# ===== GIFT CARDS =====
@router.get("/giftcards")
async def get_available_giftcards():
    """Get available gift card options"""
    return {
        "giftcards": [
            {"id": "gc_25", "value": 25, "bids": 30, "price": 25.00, "bonus_bids": 5},
            {"id": "gc_50", "value": 50, "bids": 65, "price": 50.00, "bonus_bids": 15},
            {"id": "gc_100", "value": 100, "bids": 140, "price": 100.00, "bonus_bids": 40},
            {"id": "gc_200", "value": 200, "bids": 300, "price": 200.00, "bonus_bids": 100},
        ],
        "delivery_options": ["email", "print", "physical"],
        "customization": {
            "designs": ["birthday", "christmas", "thank_you", "congratulations", "general"],
            "personal_message": True,
            "max_message_length": 200
        }
    }

@router.post("/giftcards/purchase")
async def purchase_giftcard(
    card_id: str,
    recipient_email: str,
    sender_name: str,
    message: Optional[str] = None,
    design: str = "general"
):
    """Purchase a gift card"""
    cards = {
        "gc_25": {"value": 25, "bids": 35},
        "gc_50": {"value": 50, "bids": 80},
        "gc_100": {"value": 100, "bids": 180},
        "gc_200": {"value": 200, "bids": 400},
    }
    
    if card_id not in cards:
        raise HTTPException(status_code=404, detail="Geschenkkarte nicht gefunden")
    
    card = cards[card_id]
    code = f"GIFT-{datetime.utcnow().strftime('%Y%m%d')}-{''.join([str(ord(c) % 10) for c in recipient_email[:8]])}"
    
    return {
        "success": True,
        "giftcard": {
            "code": code,
            "value": card["value"],
            "bids": card["bids"],
            "recipient": recipient_email,
            "sender": sender_name,
            "message": message,
            "design": design,
            "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat()
        },
        "message": f"Geschenkkarte wurde an {recipient_email} gesendet!"
    }

@router.post("/giftcards/redeem")
async def redeem_giftcard(code: str, user_id: Optional[str] = None):
    """Redeem a gift card code"""
    # In production: Validate code, check not already used, add bids to user
    
    if not code.startswith("GIFT-"):
        raise HTTPException(status_code=400, detail="Ungültiger Geschenkkarten-Code")
    
    # Simulate redemption
    import random
    bids = random.choice([35, 80, 180, 400])
    
    return {
        "success": True,
        "bids_added": bids,
        "message": f"🎁 Geschenkkarte eingelöst! Du hast {bids} Gebote erhalten!"
    }
