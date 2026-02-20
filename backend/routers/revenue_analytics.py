"""
Revenue Analytics System - Umsatz-Analyse
Trackt Einnahmen, Verkäufe, Gebotskäufe
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging

from config import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics/revenue", tags=["Revenue Analytics"])


@router.get("/overview")
async def get_revenue_overview():
    """Get overall revenue analytics overview."""
    
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Today's revenue from bid purchases
    today_bids_pipeline = [
        {"$match": {
            "created_at": {"$regex": f"^{today}"},
            "status": "completed"
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    today_bids = await db.payments.aggregate(today_bids_pipeline).to_list(1)
    revenue_today = today_bids[0]["total"] if today_bids else 0
    
    # Yesterday's revenue
    yesterday_pipeline = [
        {"$match": {
            "created_at": {"$regex": f"^{yesterday}"},
            "status": "completed"
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    yesterday_bids = await db.payments.aggregate(yesterday_pipeline).to_list(1)
    revenue_yesterday = yesterday_bids[0]["total"] if yesterday_bids else 0
    
    # This week's revenue
    week_pipeline = [
        {"$match": {
            "created_at": {"$gte": f"{week_ago}T00:00:00"},
            "status": "completed"
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    week_result = await db.payments.aggregate(week_pipeline).to_list(1)
    revenue_week = week_result[0]["total"] if week_result else 0
    
    # This month's revenue
    month_pipeline = [
        {"$match": {
            "created_at": {"$gte": f"{month_ago}T00:00:00"},
            "status": "completed"
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    month_result = await db.payments.aggregate(month_pipeline).to_list(1)
    revenue_month = month_result[0]["total"] if month_result else 0
    
    # Total revenue all time
    total_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    total_result = await db.payments.aggregate(total_pipeline).to_list(1)
    revenue_total = total_result[0]["total"] if total_result else 0
    
    # Auction revenue (Buy It Now)
    auction_revenue_pipeline = [
        {"$match": {
            "status": "ended",
            "payment_status": "paid",
            "created_at": {"$gte": f"{month_ago}T00:00:00"}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$current_price"}}}
    ]
    auction_result = await db.auctions.aggregate(auction_revenue_pipeline).to_list(1)
    auction_revenue_month = auction_result[0]["total"] if auction_result else 0
    
    # Calculate day change
    day_change = ((revenue_today - revenue_yesterday) / max(revenue_yesterday, 1)) * 100 if revenue_yesterday else 0
    
    # Transactions count
    transactions_today = await db.payments.count_documents({
        "created_at": {"$regex": f"^{today}"},
        "status": "completed"
    })
    
    return {
        "revenue_today": round(revenue_today, 2),
        "revenue_yesterday": round(revenue_yesterday, 2),
        "day_change_percent": round(day_change, 1),
        "revenue_this_week": round(revenue_week, 2),
        "revenue_this_month": round(revenue_month, 2),
        "revenue_total": round(revenue_total, 2),
        "auction_revenue_month": round(auction_revenue_month, 2),
        "transactions_today": transactions_today,
        "timestamp": now.isoformat()
    }


@router.get("/daily")
async def get_daily_revenue(period: str = "month"):
    """Get daily revenue breakdown."""
    
    now = datetime.now(timezone.utc)
    
    if period == "week":
        days = 7
    elif period == "month":
        days = 30
    else:
        days = 90
    
    daily_revenue = []
    
    for i in range(days):
        date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        
        # Bid purchases revenue
        pipeline = [
            {"$match": {
                "created_at": {"$regex": f"^{date}"},
                "status": "completed"
            }},
            {"$group": {
                "_id": None,
                "revenue": {"$sum": "$amount"},
                "transactions": {"$sum": 1}
            }}
        ]
        result = await db.payments.aggregate(pipeline).to_list(1)
        
        daily_revenue.append({
            "date": date,
            "revenue": round(result[0]["revenue"], 2) if result else 0,
            "transactions": result[0]["transactions"] if result else 0
        })
    
    daily_revenue.reverse()
    
    # Calculate totals and averages
    total_revenue = sum(d["revenue"] for d in daily_revenue)
    total_transactions = sum(d["transactions"] for d in daily_revenue)
    avg_daily = total_revenue / days if days > 0 else 0
    avg_transaction = total_revenue / total_transactions if total_transactions > 0 else 0
    
    return {
        "period": period,
        "daily_revenue": daily_revenue,
        "total_revenue": round(total_revenue, 2),
        "total_transactions": total_transactions,
        "daily_average": round(avg_daily, 2),
        "avg_transaction_value": round(avg_transaction, 2)
    }


@router.get("/by-package")
async def get_revenue_by_bid_package(period: str = "month"):
    """Get revenue breakdown by bid package."""
    
    now = datetime.now(timezone.utc)
    
    if period == "week":
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    else:
        start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Group by bid package
    pipeline = [
        {"$match": {
            "created_at": {"$gte": f"{start_date}T00:00:00"},
            "status": "completed"
        }},
        {"$group": {
            "_id": "$bids_purchased",
            "count": {"$sum": 1},
            "total_revenue": {"$sum": "$amount"}
        }},
        {"$sort": {"total_revenue": -1}}
    ]
    
    packages = await db.payments.aggregate(pipeline).to_list(20)
    
    # Format results
    package_stats = []
    for pkg in packages:
        bids = pkg["_id"] or 0
        package_stats.append({
            "bids": bids,
            "package_name": f"{bids} Gebote",
            "purchases": pkg["count"],
            "revenue": round(pkg["total_revenue"], 2),
            "avg_price": round(pkg["total_revenue"] / pkg["count"], 2) if pkg["count"] > 0 else 0
        })
    
    return {
        "period": period,
        "packages": package_stats,
        "total_packages_sold": sum(p["purchases"] for p in package_stats)
    }


@router.get("/auctions")
async def get_auction_revenue_stats(period: str = "month"):
    """Get auction-specific revenue statistics."""
    
    now = datetime.now(timezone.utc)
    
    if period == "week":
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    else:
        start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Completed auctions stats
    completed_pipeline = [
        {"$match": {
            "status": "ended",
            "end_time": {"$gte": f"{start_date}T00:00:00"}
        }},
        {"$group": {
            "_id": None,
            "total_auctions": {"$sum": 1},
            "total_final_price": {"$sum": "$current_price"},
            "total_retail_value": {"$sum": "$product.retail_price"},
            "avg_final_price": {"$avg": "$current_price"},
            "avg_bids_placed": {"$avg": "$bid_count"}
        }}
    ]
    
    completed = await db.auctions.aggregate(completed_pipeline).to_list(1)
    
    # Paid auctions (Buy It Now completed)
    paid_pipeline = [
        {"$match": {
            "status": "ended",
            "payment_status": "paid",
            "end_time": {"$gte": f"{start_date}T00:00:00"}
        }},
        {"$group": {
            "_id": None,
            "paid_count": {"$sum": 1},
            "paid_revenue": {"$sum": "$current_price"}
        }}
    ]
    
    paid = await db.auctions.aggregate(paid_pipeline).to_list(1)
    
    # Revenue from bids used in auctions
    bids_used_pipeline = [
        {"$match": {
            "created_at": {"$gte": f"{start_date}T00:00:00"}
        }},
        {"$group": {
            "_id": None,
            "total_bids_used": {"$sum": 1}
        }}
    ]
    bids_used = await db.bids.aggregate(bids_used_pipeline).to_list(1)
    
    # Assuming average bid cost is ~€0.15
    bid_value = 0.15
    
    stats = completed[0] if completed else {}
    paid_stats = paid[0] if paid else {}
    bids_stats = bids_used[0] if bids_used else {}
    
    return {
        "period": period,
        "completed_auctions": stats.get("total_auctions", 0),
        "total_final_prices": round(stats.get("total_final_price", 0), 2),
        "total_retail_value": round(stats.get("total_retail_value", 0), 2),
        "avg_final_price": round(stats.get("avg_final_price", 0), 2),
        "avg_bids_per_auction": round(stats.get("avg_bids_placed", 0), 1),
        "paid_auctions": paid_stats.get("paid_count", 0),
        "paid_revenue": round(paid_stats.get("paid_revenue", 0), 2),
        "total_bids_used": bids_stats.get("total_bids_used", 0),
        "estimated_bid_revenue": round(bids_stats.get("total_bids_used", 0) * bid_value, 2)
    }


@router.get("/top-spenders")
async def get_top_spenders(limit: int = 15):
    """Get users who spent the most on bid purchases."""
    
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": "$user_id",
            "total_spent": {"$sum": "$amount"},
            "purchases": {"$sum": 1},
            "total_bids": {"$sum": "$bids_purchased"}
        }},
        {"$sort": {"total_spent": -1}},
        {"$limit": limit}
    ]
    
    spenders = await db.payments.aggregate(pipeline).to_list(limit)
    
    # Enrich with user details
    for spender in spenders:
        user = await db.users.find_one(
            {"id": spender["_id"]},
            {"_id": 0, "name": 1, "email": 1, "avatar": 1, "bids_balance": 1}
        )
        if user:
            spender["user_name"] = user.get("name", "Unbekannt")
            spender["email"] = user.get("email", "")
            spender["avatar"] = user.get("avatar")
            spender["current_bids"] = user.get("bids_balance", 0)
        spender["total_spent"] = round(spender["total_spent"], 2)
    
    return {
        "top_spenders": spenders,
        "total_count": len(spenders)
    }


@router.get("/conversion")
async def get_conversion_stats():
    """Get conversion funnel statistics."""
    
    now = datetime.now(timezone.utc)
    month_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Total registered users (last 30 days)
    new_users = await db.users.count_documents({
        "created_at": {"$gte": f"{month_ago}T00:00:00"}
    })
    
    # Users who made at least one bid
    bidders_pipeline = [
        {"$match": {"created_at": {"$gte": f"{month_ago}T00:00:00"}}},
        {"$group": {"_id": "$user_id"}}
    ]
    bidders = len(await db.bids.aggregate(bidders_pipeline).to_list(100000))
    
    # Users who made at least one purchase
    buyers_pipeline = [
        {"$match": {
            "created_at": {"$gte": f"{month_ago}T00:00:00"},
            "status": "completed"
        }},
        {"$group": {"_id": "$user_id"}}
    ]
    buyers = len(await db.payments.aggregate(buyers_pipeline).to_list(100000))
    
    # Users who won at least one auction
    winners_pipeline = [
        {"$match": {
            "status": "ended",
            "end_time": {"$gte": f"{month_ago}T00:00:00"},
            "winner_id": {"$ne": None}
        }},
        {"$group": {"_id": "$winner_id"}}
    ]
    winners = len(await db.auctions.aggregate(winners_pipeline).to_list(100000))
    
    total_users = await db.users.count_documents({})
    
    return {
        "period": "last_30_days",
        "funnel": {
            "registered": new_users,
            "placed_bids": bidders,
            "made_purchase": buyers,
            "won_auction": winners
        },
        "conversion_rates": {
            "registration_to_bid": round((bidders / max(new_users, 1)) * 100, 1),
            "bid_to_purchase": round((buyers / max(bidders, 1)) * 100, 1),
            "purchase_to_win": round((winners / max(buyers, 1)) * 100, 1),
            "overall": round((winners / max(new_users, 1)) * 100, 1)
        },
        "total_users": total_users,
        "timestamp": now.isoformat()
    }


@router.get("/hourly")
async def get_hourly_revenue():
    """Get revenue by hour of day (to find peak times)."""
    
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Get all payments from last week
    payments = await db.payments.find({
        "created_at": {"$gte": f"{week_ago}T00:00:00"},
        "status": "completed"
    }, {"created_at": 1, "amount": 1, "_id": 0}).to_list(10000)
    
    # Group by hour
    hourly_data = {i: {"revenue": 0, "transactions": 0} for i in range(24)}
    
    for payment in payments:
        try:
            hour = int(payment["created_at"][11:13])
            hourly_data[hour]["revenue"] += payment.get("amount", 0)
            hourly_data[hour]["transactions"] += 1
        except:
            pass
    
    hourly_stats = [
        {
            "hour": f"{h:02d}:00",
            "revenue": round(hourly_data[h]["revenue"], 2),
            "transactions": hourly_data[h]["transactions"]
        }
        for h in range(24)
    ]
    
    # Find peak hour
    peak_hour = max(hourly_stats, key=lambda x: x["revenue"])
    
    return {
        "hourly_breakdown": hourly_stats,
        "peak_hour": peak_hour,
        "period": "last_7_days"
    }
