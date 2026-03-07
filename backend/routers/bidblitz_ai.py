"""
BidBlitz AI Analytics
Track user activity, popular features, active users
"""
from fastapi import APIRouter
import time

router = APIRouter(prefix="/ai", tags=["AI Analytics"])

activity_log = []
feature_usage = {}


# Aktivität speichern
@router.post("/log")
def log_activity(user_id: str, feature: str):
    activity_log.append({
        "user": user_id,
        "feature": feature,
        "time": time.time()
    })
    
    feature_usage[feature] = feature_usage.get(feature, 0) + 1
    
    return {"status": "logged"}


# Beliebteste Features
@router.get("/popular")
def popular_features():
    ranking = sorted(
        feature_usage.items(),
        key=lambda x: x[1],
        reverse=True
    )
    return ranking


# Aktivste Nutzer
@router.get("/active-users")
def active_users():
    user_count = {}
    
    for a in activity_log:
        user = a["user"]
        user_count[user] = user_count.get(user, 0) + 1
    
    ranking = sorted(
        user_count.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    return ranking[:10]


# Nutzung nach Feature
@router.get("/feature-stats")
def feature_stats():
    return feature_usage


# Recent Activity
@router.get("/recent")
def recent_activity():
    return activity_log[-20:]
