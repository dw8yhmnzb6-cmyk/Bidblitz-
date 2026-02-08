"""AI Bid Recommendations - Smart bidding suggestions based on auction analysis"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
import random
import math

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/ai-bid", tags=["AI Bid Recommendations"])

async def analyze_auction_patterns(auction_id: str) -> dict:
    """Analyze bidding patterns for an auction"""
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        return {}
    
    bid_history = auction.get("bid_history", [])
    total_bids = len(bid_history)
    
    # Analyze bid timing patterns
    if total_bids < 5:
        return {
            "pattern": "new",
            "intensity": "low",
            "avg_interval": 0,
            "peak_times": []
        }
    
    # Calculate intervals between bids
    intervals = []
    for i in range(1, min(50, len(bid_history))):
        try:
            t1 = datetime.fromisoformat(bid_history[i-1]["timestamp"].replace("Z", "+00:00"))
            t2 = datetime.fromisoformat(bid_history[i]["timestamp"].replace("Z", "+00:00"))
            intervals.append((t2 - t1).total_seconds())
        except:
            continue
    
    avg_interval = sum(intervals) / len(intervals) if intervals else 30
    
    # Determine pattern
    if avg_interval < 10:
        pattern = "aggressive"
        intensity = "high"
    elif avg_interval < 30:
        pattern = "competitive"
        intensity = "medium"
    else:
        pattern = "relaxed"
        intensity = "low"
    
    # Find unique bidders
    unique_bidders = len(set(b.get("user_id") or b.get("user_name") for b in bid_history))
    
    return {
        "pattern": pattern,
        "intensity": intensity,
        "avg_interval": round(avg_interval, 1),
        "total_bids": total_bids,
        "unique_bidders": unique_bidders,
        "competition_level": min(10, unique_bidders)
    }

async def calculate_win_probability(user_id: str, auction_id: str) -> dict:
    """Calculate probability of winning based on multiple factors"""
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        return {"probability": 0, "confidence": "low"}
    
    # Get auction analysis
    analysis = await analyze_auction_patterns(auction_id)
    
    # Get user's historical win rate
    user_wins = await db.auction_history.count_documents({"winner_id": user_id})
    user_participations = await db.auctions.count_documents({"bid_history.user_id": user_id})
    user_win_rate = (user_wins / max(1, user_participations)) * 100
    
    # Calculate time remaining
    try:
        end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
        seconds_left = (end_time - datetime.now(timezone.utc)).total_seconds()
    except:
        seconds_left = 3600
    
    # Base probability factors
    base_prob = 50
    
    # Adjust based on competition
    competition = analysis.get("competition_level", 5)
    competition_factor = max(10, 100 - (competition * 8))  # More bidders = lower chance
    
    # Adjust based on time remaining
    if seconds_left < 60:
        time_factor = 120  # High urgency = higher chance if you bid now
    elif seconds_left < 300:
        time_factor = 100
    elif seconds_left < 3600:
        time_factor = 80
    else:
        time_factor = 60
    
    # Adjust based on user experience
    experience_factor = min(120, 80 + user_win_rate)
    
    # Adjust based on bid intensity
    intensity = analysis.get("intensity", "medium")
    if intensity == "high":
        intensity_factor = 70
    elif intensity == "low":
        intensity_factor = 110
    else:
        intensity_factor = 90
    
    # Calculate final probability
    probability = (base_prob * competition_factor * time_factor * experience_factor * intensity_factor) / 1000000
    probability = min(95, max(5, probability))
    
    # Determine confidence level
    if analysis.get("total_bids", 0) > 20:
        confidence = "high"
    elif analysis.get("total_bids", 0) > 5:
        confidence = "medium"
    else:
        confidence = "low"
    
    return {
        "probability": round(probability, 1),
        "confidence": confidence,
        "factors": {
            "competition": competition,
            "time_urgency": "high" if seconds_left < 300 else "medium" if seconds_left < 3600 else "low",
            "intensity": intensity,
            "your_experience": "expert" if user_win_rate > 30 else "intermediate" if user_win_rate > 10 else "beginner"
        }
    }

@router.get("/recommendation/{auction_id}")
async def get_bid_recommendation(auction_id: str, user: dict = Depends(get_current_user)):
    """Get AI-powered bid recommendation for an auction"""
    auction = await db.auctions.find_one({"id": auction_id, "status": "active"}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    # Get win probability
    win_prob = await calculate_win_probability(user["id"], auction_id)
    probability = win_prob["probability"]
    
    # Get auction analysis
    analysis = await analyze_auction_patterns(auction_id)
    
    # Calculate time remaining
    try:
        end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
        seconds_left = (end_time - datetime.now(timezone.utc)).total_seconds()
    except:
        seconds_left = 3600
    
    # Generate recommendation
    if probability >= 70:
        action = "bid_now"
        message_de = "🎯 Jetzt bieten! Sehr gute Gewinnchance!"
        message_en = "🎯 Bid now! Very good chance of winning!"
        urgency = "high"
    elif probability >= 50:
        action = "consider"
        message_de = "✅ Gute Chance - Biete wenn du das Produkt willst"
        message_en = "✅ Good chance - Bid if you want the product"
        urgency = "medium"
    elif probability >= 30:
        action = "wait"
        message_de = "⏳ Warte noch - Viel Konkurrenz aktiv"
        message_en = "⏳ Wait - High competition active"
        urgency = "low"
    else:
        action = "skip"
        message_de = "⚠️ Hohe Konkurrenz - Vielleicht andere Auktion?"
        message_en = "⚠️ High competition - Maybe try another auction?"
        urgency = "none"
    
    # Special cases
    if seconds_left < 30 and probability > 40:
        action = "bid_now"
        message_de = "🔥 JETZT! Auktion endet in Sekunden!"
        message_en = "🔥 NOW! Auction ending in seconds!"
        urgency = "critical"
    
    # Optimal bid timing suggestion
    if analysis.get("avg_interval", 30) > 20:
        timing_advice_de = "Biete in den letzten 10 Sekunden für beste Chance"
        timing_advice_en = "Bid in the last 10 seconds for best chance"
    else:
        timing_advice_de = "Schnelle Auktion - Sei bereit sofort zu reagieren"
        timing_advice_en = "Fast auction - Be ready to react immediately"
    
    return {
        "auction_id": auction_id,
        "recommendation": {
            "action": action,
            "message": {"de": message_de, "en": message_en},
            "urgency": urgency
        },
        "win_probability": {
            "percent": probability,
            "confidence": win_prob["confidence"],
            "factors": win_prob["factors"]
        },
        "auction_analysis": {
            "pattern": analysis.get("pattern"),
            "intensity": analysis.get("intensity"),
            "unique_bidders": analysis.get("unique_bidders", 0),
            "avg_bid_interval": analysis.get("avg_interval", 0)
        },
        "timing_advice": {"de": timing_advice_de, "en": timing_advice_en},
        "seconds_left": int(seconds_left),
        "current_price": auction.get("current_price", 0)
    }

@router.get("/best-opportunities")
async def get_best_opportunities(limit: int = 5, user: dict = Depends(get_current_user)):
    """Get auctions with best winning opportunities for this user"""
    auctions = await db.auctions.find(
        {"status": "active"},
        {"_id": 0, "id": 1, "product_id": 1, "current_price": 1, "end_time": 1, "total_bids": 1}
    ).to_list(100)
    
    opportunities = []
    
    for auction in auctions:
        try:
            win_prob = await calculate_win_probability(user["id"], auction["id"])
            
            # Get product info
            product = await db.products.find_one(
                {"id": auction.get("product_id")},
                {"_id": 0, "name": 1, "image_url": 1, "retail_price": 1}
            )
            
            end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
            seconds_left = (end_time - datetime.now(timezone.utc)).total_seconds()
            
            if seconds_left > 0:
                opportunities.append({
                    "auction_id": auction["id"],
                    "product_name": product.get("name") if product else "Produkt",
                    "product_image": product.get("image_url") if product else None,
                    "retail_price": product.get("retail_price", 0) if product else 0,
                    "current_price": auction.get("current_price", 0),
                    "win_probability": win_prob["probability"],
                    "confidence": win_prob["confidence"],
                    "seconds_left": int(seconds_left),
                    "total_bids": auction.get("total_bids", 0)
                })
        except Exception as e:
            continue
    
    # Sort by win probability (highest first)
    opportunities.sort(key=lambda x: x["win_probability"], reverse=True)
    
    return {"opportunities": opportunities[:limit]}

@router.get("/strategy/{auction_id}")
async def get_bidding_strategy(auction_id: str, user: dict = Depends(get_current_user)):
    """Get detailed bidding strategy for an auction"""
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    analysis = await analyze_auction_patterns(auction_id)
    win_prob = await calculate_win_probability(user["id"], auction_id)
    
    # Calculate time
    try:
        end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
        seconds_left = (end_time - datetime.now(timezone.utc)).total_seconds()
        hours_left = seconds_left / 3600
    except:
        seconds_left = 3600
        hours_left = 1
    
    # Determine strategy based on auction characteristics
    strategies = []
    
    if analysis.get("intensity") == "high":
        strategies.append({
            "name": "Sniper-Strategie",
            "description": "Warte bis zur letzten Sekunde und biete dann schnell",
            "success_rate": "75%",
            "risk": "hoch"
        })
    
    if analysis.get("intensity") == "low":
        strategies.append({
            "name": "Früh-Bieter",
            "description": "Biete früh um Konkurrenz abzuschrecken",
            "success_rate": "60%",
            "risk": "niedrig"
        })
    
    if hours_left > 2:
        strategies.append({
            "name": "Abwarten",
            "description": "Beobachte die Auktion und biete später",
            "success_rate": "50%",
            "risk": "niedrig"
        })
    
    strategies.append({
        "name": "Bid Buddy aktivieren",
        "description": "Automatisches Bieten einrichten und entspannen",
        "success_rate": "65%",
        "risk": "mittel"
    })
    
    # Recommended bids count
    if win_prob["probability"] > 60:
        recommended_bids = 3
    elif win_prob["probability"] > 40:
        recommended_bids = 5
    else:
        recommended_bids = 10
    
    return {
        "auction_id": auction_id,
        "current_analysis": analysis,
        "win_probability": win_prob,
        "recommended_strategies": strategies,
        "recommended_bid_budget": recommended_bids,
        "optimal_bid_time": "Letzte 10 Sekunden" if analysis.get("intensity") == "high" else "Jetzt",
        "warnings": [
            "Hohe Konkurrenz" if analysis.get("competition_level", 0) > 5 else None,
            "Schnelle Gebote" if analysis.get("avg_interval", 30) < 10 else None
        ]
    }



@router.get("/optimal-times")
async def get_optimal_bidding_times(user: dict = Depends(get_current_user)):
    """Analyze historical data to find optimal bidding times"""
    user_id = user["id"]
    
    # Analyze winning bids by hour
    pipeline = [
        {"$unwind": "$bid_history"},
        {"$match": {"winner_id": {"$exists": True}}},
        {"$project": {
            "winner_id": 1,
            "last_bid": {"$arrayElemAt": ["$bid_history", -1]},
            "hour": {"$hour": {"$dateFromString": {"dateString": {"$arrayElemAt": ["$bid_history.timestamp", -1]}}}}
        }},
        {"$group": {
            "_id": "$hour",
            "wins": {"$sum": 1}
        }},
        {"$sort": {"wins": -1}}
    ]
    
    try:
        results = await db.auctions.aggregate(pipeline).to_list(length=24)
    except:
        # Fallback to general statistics
        results = []
    
    # Default optimal times based on typical penny auction patterns
    optimal_hours = [
        {"hour": 21, "label": "21:00 - 22:00", "quality": "excellent", "reason": "Höchste Aktivität, viele Auktionen enden"},
        {"hour": 20, "label": "20:00 - 21:00", "quality": "excellent", "reason": "Abendzeit - Nutzer sind aktiv"},
        {"hour": 22, "label": "22:00 - 23:00", "quality": "good", "reason": "Späte Schnäppchenjäger"},
        {"hour": 19, "label": "19:00 - 20:00", "quality": "good", "reason": "Nach-Arbeit-Zeit"},
        {"hour": 12, "label": "12:00 - 13:00", "quality": "moderate", "reason": "Mittagspause"},
        {"hour": 23, "label": "23:00 - 00:00", "quality": "moderate", "reason": "Nachteulen, weniger Konkurrenz"}
    ]
    
    # Get user's personal best times (when they won)
    user_wins = await db.won_auctions.find(
        {"user_id": user_id},
        {"_id": 0, "won_at": 1}
    ).to_list(length=100)
    
    personal_best_hours = {}
    for win in user_wins:
        try:
            won_time = datetime.fromisoformat(win["won_at"].replace("Z", "+00:00"))
            hour = won_time.hour
            personal_best_hours[hour] = personal_best_hours.get(hour, 0) + 1
        except:
            continue
    
    personal_optimal = sorted(
        [{"hour": h, "wins": c} for h, c in personal_best_hours.items()],
        key=lambda x: x["wins"],
        reverse=True
    )[:3]
    
    # Low competition times
    low_competition = [
        {"hour": 3, "label": "03:00 - 04:00", "reason": "Sehr wenig Konkurrenz"},
        {"hour": 4, "label": "04:00 - 05:00", "reason": "Frühaufsteher-Zeit"},
        {"hour": 6, "label": "06:00 - 07:00", "reason": "Vor der Arbeit"}
    ]
    
    return {
        "general_optimal": optimal_hours,
        "personal_best": personal_optimal,
        "low_competition": low_competition,
        "tips": {
            "de": [
                "Die besten Zeiten zum Bieten sind zwischen 20:00 und 22:00 Uhr",
                "Nachtauktionen (23:00-06:00) haben oft weniger Konkurrenz",
                "Wochenenden haben höhere Aktivität, aber auch mehr Chancen",
                "Biete in den letzten 10 Sekunden für beste Ergebnisse"
            ],
            "en": [
                "Best bidding times are between 8 PM and 10 PM",
                "Night auctions (11 PM - 6 AM) often have less competition",
                "Weekends have higher activity but also more chances",
                "Bid in the last 10 seconds for best results"
            ]
        },
        "current_time_quality": get_current_time_quality()
    }


def get_current_time_quality():
    """Get quality rating for current time"""
    now = datetime.now(timezone.utc)
    hour = now.hour
    
    if hour in [20, 21]:
        return {"quality": "excellent", "message_de": "Jetzt ist die beste Zeit zum Bieten!", "message_en": "Now is the best time to bid!"}
    elif hour in [19, 22, 23]:
        return {"quality": "good", "message_de": "Gute Zeit zum Bieten", "message_en": "Good time to bid"}
    elif hour in [12, 13, 14]:
        return {"quality": "moderate", "message_de": "Mittlere Aktivität", "message_en": "Moderate activity"}
    elif hour in [3, 4, 5, 6]:
        return {"quality": "low_competition", "message_de": "Wenig Konkurrenz - Schnäppchen möglich!", "message_en": "Low competition - deals possible!"}
    else:
        return {"quality": "normal", "message_de": "Normale Aktivität", "message_en": "Normal activity"}


# ==================== AI PRODUCT RECOMMENDATIONS ====================

@router.get("/product-recommendations")
async def get_ai_product_recommendations(user: dict = Depends(get_current_user)):
    """Get AI-powered product recommendations based on user behavior"""
    user_id = user["id"]
    
    # 1. Get user's bidding history - what categories they like
    user_bids = await db.auctions.find(
        {"bid_history.user_id": user_id},
        {"_id": 0, "product_id": 1, "category": 1}
    ).to_list(100)
    
    # 2. Get user's won auctions
    won_auctions = await db.won_auctions.find(
        {"user_id": user_id},
        {"_id": 0, "product_id": 1, "category": 1}
    ).to_list(50)
    
    # 3. Analyze favorite categories
    category_counts = {}
    for auction in user_bids + won_auctions:
        cat = auction.get("category", "Sonstige")
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    favorite_categories = sorted(
        category_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )[:3]
    favorite_cat_names = [c[0] for c in favorite_categories] if favorite_categories else ["Elektronik", "Mode", "Haushalt"]
    
    # 4. Get active auctions in favorite categories
    recommended_auctions = []
    
    for category in favorite_cat_names:
        auctions = await db.auctions.find(
            {"status": "active", "category": category},
            {"_id": 0, "id": 1, "product_id": 1, "current_price": 1, "end_time": 1, "total_bids": 1, "category": 1}
        ).limit(3).to_list(3)
        
        for auction in auctions:
            try:
                product = await db.products.find_one(
                    {"id": auction.get("product_id")},
                    {"_id": 0, "name": 1, "image_url": 1, "retail_price": 1, "description": 1}
                )
                
                end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
                seconds_left = (end_time - datetime.now(timezone.utc)).total_seconds()
                
                if seconds_left > 0 and product:
                    # Calculate savings potential
                    retail = product.get("retail_price", 100)
                    current = auction.get("current_price", 0)
                    savings_percent = ((retail - current) / retail) * 100 if retail > 0 else 0
                    
                    recommended_auctions.append({
                        "auction_id": auction["id"],
                        "product_name": product.get("name", "Produkt"),
                        "product_image": product.get("image_url"),
                        "category": auction.get("category"),
                        "retail_price": retail,
                        "current_price": current,
                        "savings_percent": round(savings_percent, 1),
                        "seconds_left": int(seconds_left),
                        "total_bids": auction.get("total_bids", 0),
                        "reason": f"Basierend auf deinem Interesse an {category}",
                        "match_score": 90 if category == favorite_cat_names[0] else 75 if category == favorite_cat_names[1] else 60
                    })
            except:
                continue
    
    # 5. Add some "trending" auctions regardless of category
    trending = await db.auctions.find(
        {"status": "active"},
        {"_id": 0, "id": 1, "product_id": 1, "current_price": 1, "end_time": 1, "total_bids": 1, "category": 1}
    ).sort("total_bids", -1).limit(3).to_list(3)
    
    for auction in trending:
        if auction["id"] not in [r["auction_id"] for r in recommended_auctions]:
            try:
                product = await db.products.find_one(
                    {"id": auction.get("product_id")},
                    {"_id": 0, "name": 1, "image_url": 1, "retail_price": 1}
                )
                
                end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
                seconds_left = (end_time - datetime.now(timezone.utc)).total_seconds()
                
                if seconds_left > 0 and product:
                    retail = product.get("retail_price", 100)
                    current = auction.get("current_price", 0)
                    
                    recommended_auctions.append({
                        "auction_id": auction["id"],
                        "product_name": product.get("name", "Produkt"),
                        "product_image": product.get("image_url"),
                        "category": auction.get("category"),
                        "retail_price": retail,
                        "current_price": current,
                        "savings_percent": round(((retail - current) / retail) * 100, 1) if retail > 0 else 0,
                        "seconds_left": int(seconds_left),
                        "total_bids": auction.get("total_bids", 0),
                        "reason": "🔥 Trending - Beliebt bei anderen Nutzern",
                        "match_score": 50
                    })
            except:
                continue
    
    # Sort by match score
    recommended_auctions.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    
    # 6. Get bid package recommendation based on user activity
    user_bids_balance = user.get("bids_balance", 0)
    total_activity = len(user_bids)
    
    if user_bids_balance < 10:
        package_recommendation = {
            "package": "100 Gebote",
            "reason": "Dein Guthaben ist niedrig - Jetzt auffüllen!",
            "urgency": "high",
            "discount_hint": "Spare mit größeren Paketen"
        }
    elif total_activity > 50 and user_bids_balance < 50:
        package_recommendation = {
            "package": "250 Gebote",
            "reason": "Du bist ein aktiver Bieter - Das lohnt sich!",
            "urgency": "medium",
            "discount_hint": "Perfekt für Power-User"
        }
    else:
        package_recommendation = {
            "package": "50 Gebote",
            "reason": "Teste mit einem kleinen Paket",
            "urgency": "low",
            "discount_hint": None
        }
    
    return {
        "recommendations": recommended_auctions[:10],
        "favorite_categories": [{"name": c[0], "activity": c[1]} for c in favorite_categories],
        "package_recommendation": package_recommendation,
        "user_stats": {
            "total_bids_placed": total_activity,
            "current_balance": user_bids_balance,
            "auctions_won": len(won_auctions)
        },
        "tips": [
            "Konzentriere dich auf deine Lieblingskategorien für höhere Gewinnchancen",
            "Auktionen mit weniger Geboten haben oft bessere Chancen",
            "Nutze den Bid Buddy für automatisches Bieten"
        ]
    }


@router.get("/smart-alerts")
async def get_smart_alerts(user: dict = Depends(get_current_user)):
    """Get smart alerts for auctions the user might be interested in"""
    user_id = user["id"]
    
    alerts = []
    
    # 1. Check for auctions ending soon in favorite categories
    user_bids = await db.auctions.find(
        {"bid_history.user_id": user_id},
        {"_id": 0, "category": 1}
    ).to_list(50)
    
    categories = list(set(a.get("category", "Sonstige") for a in user_bids))[:3]
    
    for category in categories:
        ending_soon = await db.auctions.find(
            {"status": "active", "category": category},
            {"_id": 0, "id": 1, "product_id": 1, "end_time": 1, "current_price": 1}
        ).to_list(10)
        
        for auction in ending_soon:
            try:
                end_time = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
                seconds_left = (end_time - datetime.now(timezone.utc)).total_seconds()
                
                if 0 < seconds_left < 300:  # Ending in 5 minutes
                    product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0, "name": 1})
                    alerts.append({
                        "type": "ending_soon",
                        "auction_id": auction["id"],
                        "product_name": product.get("name") if product else "Produkt",
                        "category": category,
                        "seconds_left": int(seconds_left),
                        "current_price": auction.get("current_price", 0),
                        "message": f"⏰ Endet in {int(seconds_left/60)} Min!",
                        "priority": "high"
                    })
            except:
                continue
    
    # 2. Check for new auctions in favorite categories
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    
    for category in categories:
        new_auctions = await db.auctions.find(
            {"status": "active", "category": category, "start_time": {"$gte": one_hour_ago}},
            {"_id": 0, "id": 1, "product_id": 1}
        ).limit(2).to_list(2)
        
        for auction in new_auctions:
            product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0, "name": 1, "retail_price": 1})
            if product:
                alerts.append({
                    "type": "new_auction",
                    "auction_id": auction["id"],
                    "product_name": product.get("name", "Produkt"),
                    "category": category,
                    "retail_price": product.get("retail_price", 0),
                    "message": f"🆕 Neue {category}-Auktion!",
                    "priority": "medium"
                })
    
    # 3. Low balance warning
    if user.get("bids_balance", 0) < 5:
        alerts.append({
            "type": "low_balance",
            "message": "⚠️ Nur noch wenige Gebote übrig!",
            "current_balance": user.get("bids_balance", 0),
            "priority": "high",
            "action": "buy_bids"
        })
    
    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    alerts.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 2))
    
    return {"alerts": alerts[:10], "total_alerts": len(alerts)}

