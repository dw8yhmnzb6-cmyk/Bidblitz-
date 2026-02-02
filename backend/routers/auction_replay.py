"""Auction Replay Router - Auction history and statistics"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/auction-replay", tags=["Auction Replay"])

# ==================== ENDPOINTS ====================

@router.get("/history/{auction_id}")
async def get_auction_history(auction_id: str):
    """Get complete bid history for an ended auction"""
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    # Get all bids for this auction
    bids = await db.bids.find(
        {"auction_id": auction_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Anonymize bidder names
    for bid in bids:
        name = bid.get("bidder_name", "Bieter")
        if len(name) > 2:
            bid["bidder_name"] = f"{name[0]}***{name[-1]}"
        bid.pop("user_id", None)  # Remove user_id for privacy
    
    # Get product info
    product = await db.products.find_one({"id": auction.get("product_id")}, {"_id": 0})
    
    # Calculate statistics
    total_bids = len(bids)
    unique_bidders = len(set(b.get("bidder_name") for b in bids))
    
    # Time analysis
    if bids and len(bids) > 1:
        first_bid_time = datetime.fromisoformat(bids[0]["created_at"].replace("Z", "+00:00"))
        last_bid_time = datetime.fromisoformat(bids[-1]["created_at"].replace("Z", "+00:00"))
        duration_minutes = (last_bid_time - first_bid_time).total_seconds() / 60
    else:
        duration_minutes = 0
    
    return {
        "auction": {
            "id": auction["id"],
            "product_name": product.get("name") if product else auction.get("product_name"),
            "product_image": product.get("image_url") if product else auction.get("product_image"),
            "retail_price": product.get("retail_price", 0) if product else 0,
            "final_price": auction.get("final_price", auction.get("current_price", 0)),
            "winner_name": auction.get("winner_name", "").replace(auction.get("winner_name", "")[1:-1] if auction.get("winner_name") else "", "***") if auction.get("winner_name") else None,
            "status": auction.get("status"),
            "ended_at": auction.get("ended_at")
        },
        "statistics": {
            "total_bids": total_bids,
            "unique_bidders": unique_bidders,
            "duration_minutes": round(duration_minutes, 1),
            "avg_bids_per_minute": round(total_bids / max(duration_minutes, 1), 1),
            "savings_percent": round(((product.get("retail_price", 100) - auction.get("final_price", 0)) / max(product.get("retail_price", 100), 1)) * 100, 1) if product else 0
        },
        "bid_history": bids[:100],  # Limit to last 100 for performance
        "bid_timeline": _create_timeline(bids)
    }

def _create_timeline(bids):
    """Create a simplified timeline for visualization"""
    if not bids:
        return []
    
    timeline = []
    for i, bid in enumerate(bids[::max(1, len(bids)//20)]):  # Sample ~20 points
        timeline.append({
            "index": i,
            "price": bid.get("price", 0),
            "time": bid.get("created_at")
        })
    return timeline

@router.get("/category-stats/{category}")
async def get_category_statistics(category: str):
    """Get average statistics for a product category"""
    # Get ended auctions in this category
    auctions = await db.auctions.find(
        {"category": category, "status": "ended"},
        {"_id": 0}
    ).sort("ended_at", -1).to_list(100)
    
    if not auctions:
        return {
            "category": category,
            "total_auctions": 0,
            "avg_final_price": 0,
            "avg_savings_percent": 0,
            "avg_bids": 0
        }
    
    total_final_price = sum(a.get("final_price", a.get("current_price", 0)) for a in auctions)
    total_bids = sum(a.get("total_bids", 0) for a in auctions)
    
    # Calculate savings
    savings_list = []
    for a in auctions:
        product = await db.products.find_one({"id": a.get("product_id")}, {"_id": 0})
        if product and product.get("retail_price"):
            savings = ((product["retail_price"] - a.get("final_price", 0)) / product["retail_price"]) * 100
            savings_list.append(savings)
    
    return {
        "category": category,
        "total_auctions": len(auctions),
        "avg_final_price": round(total_final_price / len(auctions), 2),
        "avg_savings_percent": round(sum(savings_list) / len(savings_list), 1) if savings_list else 0,
        "avg_bids": round(total_bids / len(auctions), 0),
        "recent_auctions": auctions[:5]
    }

@router.get("/best-times")
async def get_best_bidding_times():
    """Analyze when auctions are typically won"""
    # Get ended auctions from last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    auctions = await db.auctions.find(
        {"status": "ended", "ended_at": {"$gte": thirty_days_ago}},
        {"_id": 0, "ended_at": 1, "final_price": 1}
    ).to_list(500)
    
    # Analyze by hour
    hour_stats = {}
    for a in auctions:
        try:
            ended = datetime.fromisoformat(a["ended_at"].replace("Z", "+00:00"))
            hour = ended.hour
            if hour not in hour_stats:
                hour_stats[hour] = {"count": 0, "total_price": 0}
            hour_stats[hour]["count"] += 1
            hour_stats[hour]["total_price"] += a.get("final_price", 0)
        except:
            pass
    
    # Find best hours (lowest average prices)
    best_hours = []
    for hour, stats in hour_stats.items():
        avg_price = stats["total_price"] / stats["count"] if stats["count"] > 0 else 0
        best_hours.append({
            "hour": hour,
            "hour_formatted": f"{hour:02d}:00 - {hour:02d}:59",
            "auctions_won": stats["count"],
            "avg_final_price": round(avg_price, 2)
        })
    
    best_hours.sort(key=lambda x: x["avg_final_price"])
    
    # Analyze by day of week
    day_stats = {}
    day_names = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    
    for a in auctions:
        try:
            ended = datetime.fromisoformat(a["ended_at"].replace("Z", "+00:00"))
            day = ended.weekday()
            if day not in day_stats:
                day_stats[day] = {"count": 0, "total_price": 0}
            day_stats[day]["count"] += 1
            day_stats[day]["total_price"] += a.get("final_price", 0)
        except:
            pass
    
    best_days = []
    for day, stats in day_stats.items():
        avg_price = stats["total_price"] / stats["count"] if stats["count"] > 0 else 0
        best_days.append({
            "day": day,
            "day_name": day_names[day],
            "auctions_won": stats["count"],
            "avg_final_price": round(avg_price, 2)
        })
    
    best_days.sort(key=lambda x: x["avg_final_price"])
    
    return {
        "best_hours": best_hours[:5],  # Top 5 cheapest hours
        "worst_hours": best_hours[-3:] if len(best_hours) > 3 else [],  # 3 most expensive hours
        "best_days": best_days[:3],
        "total_analyzed": len(auctions),
        "tip": "Die besten Zeiten zum Bieten sind früh morgens (6-8 Uhr) und spät abends (22-24 Uhr)."
    }

@router.get("/my-replay-stats")
async def get_my_replay_stats(user: dict = Depends(get_current_user)):
    """Get personal auction statistics"""
    user_id = user["id"]
    
    # Get user's won auctions
    won_auctions = await db.auctions.find(
        {"winner_id": user_id, "status": "ended"},
        {"_id": 0}
    ).to_list(100)
    
    # Get user's bids
    total_bids = await db.bids.count_documents({"user_id": user_id})
    
    # Calculate stats
    total_savings = 0
    total_spent = 0
    
    for a in won_auctions:
        product = await db.products.find_one({"id": a.get("product_id")}, {"_id": 0})
        if product:
            total_savings += product.get("retail_price", 0) - a.get("final_price", 0)
            total_spent += a.get("final_price", 0)
    
    # Win rate calculation
    participated_auctions = await db.bids.distinct("auction_id", {"user_id": user_id})
    win_rate = (len(won_auctions) / len(participated_auctions) * 100) if participated_auctions else 0
    
    return {
        "total_wins": len(won_auctions),
        "total_bids_placed": total_bids,
        "auctions_participated": len(participated_auctions),
        "win_rate": round(win_rate, 1),
        "total_savings": round(total_savings, 2),
        "total_spent": round(total_spent, 2),
        "avg_win_price": round(total_spent / len(won_auctions), 2) if won_auctions else 0
    }


auction_replay_router = router
