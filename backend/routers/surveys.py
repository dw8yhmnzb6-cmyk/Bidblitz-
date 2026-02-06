"""
User Surveys & Feedback Router
NPS scores, post-purchase surveys, and feedback collection
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/surveys", tags=["Surveys"])


# ==================== MODELS ====================

class SurveyResponse(BaseModel):
    survey_type: str  # nps, post_win, post_purchase, general
    rating: Optional[int] = None  # 1-10 for NPS, 1-5 for others
    answers: Optional[dict] = None
    feedback: Optional[str] = None
    context_id: Optional[str] = None  # auction_id, order_id, etc.


class NPSResponse(BaseModel):
    score: int  # 0-10
    reason: Optional[str] = None


# ==================== SURVEY SUBMISSION ====================

@router.post("/submit")
async def submit_survey(
    response: SurveyResponse,
    user: dict = Depends(get_current_user)
):
    """Submit a survey response"""
    user_id = user["id"]
    
    survey_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "survey_type": response.survey_type,
        "rating": response.rating,
        "answers": response.answers or {},
        "feedback": response.feedback,
        "context_id": response.context_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.survey_responses.insert_one(survey_doc)
    
    # Award XP for feedback
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"gamification.xp": 10}}
    )
    
    return {
        "success": True,
        "message": "Danke für dein Feedback! +10 XP",
        "id": survey_doc["id"]
    }


@router.post("/nps")
async def submit_nps(
    response: NPSResponse,
    user: dict = Depends(get_current_user)
):
    """Submit NPS (Net Promoter Score) response"""
    user_id = user["id"]
    
    # Validate score
    if not 0 <= response.score <= 10:
        raise HTTPException(status_code=400, detail="Score must be 0-10")
    
    # Determine category
    if response.score >= 9:
        category = "promoter"
    elif response.score >= 7:
        category = "passive"
    else:
        category = "detractor"
    
    nps_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "score": response.score,
        "category": category,
        "reason": response.reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.nps_responses.insert_one(nps_doc)
    
    # Award XP
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"gamification.xp": 15}}
    )
    
    return {
        "success": True,
        "message": "Danke für deine Bewertung! +15 XP",
        "category": category
    }


# ==================== SURVEY TRIGGERS ====================

@router.get("/pending")
async def get_pending_surveys(user: dict = Depends(get_current_user)):
    """Get surveys that user should complete"""
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    
    pending = []
    
    # Check if NPS is due (every 30 days)
    last_nps = await db.nps_responses.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    if not last_nps or (now - datetime.fromisoformat(last_nps["created_at"].replace("Z", "+00:00"))).days >= 30:
        pending.append({
            "type": "nps",
            "title": "Wie wahrscheinlich empfiehlst du BidBlitz?",
            "description": "Deine Meinung hilft uns, besser zu werden!",
            "reward": "+15 XP"
        })
    
    # Check for unrated wins (last 7 days)
    recent_wins = await db.won_auctions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("won_at", -1).limit(5).to_list(length=5)
    
    for win in recent_wins:
        # Check if already rated
        existing_survey = await db.survey_responses.find_one({
            "user_id": user_id,
            "survey_type": "post_win",
            "context_id": win.get("auction_id")
        })
        
        if not existing_survey:
            pending.append({
                "type": "post_win",
                "title": "Wie war dein Gewinn?",
                "description": f"Bewerte deinen Gewinn",
                "context_id": win.get("auction_id"),
                "reward": "+10 XP"
            })
            break  # Only show one at a time
    
    # Check for unrated purchases (last 7 days)
    recent_purchases = await db.payments.find(
        {"user_id": user_id, "status": "completed"},
        {"_id": 0}
    ).sort("created_at", -1).limit(3).to_list(length=3)
    
    for purchase in recent_purchases:
        existing_survey = await db.survey_responses.find_one({
            "user_id": user_id,
            "survey_type": "post_purchase",
            "context_id": purchase.get("id")
        })
        
        if not existing_survey:
            pending.append({
                "type": "post_purchase",
                "title": "Wie war dein Kauferlebnis?",
                "description": "Hilf uns, den Kaufprozess zu verbessern",
                "context_id": purchase.get("id"),
                "reward": "+10 XP"
            })
            break
    
    return {"pending_surveys": pending}


# ==================== ADMIN ANALYTICS ====================

@router.get("/analytics")
async def get_survey_analytics(
    days: int = 30,
    user: dict = Depends(get_current_user)
):
    """Get survey analytics (Admin only)"""
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # NPS calculation
    nps_responses = await db.nps_responses.find(
        {"created_at": {"$gte": start_date}},
        {"_id": 0}
    ).to_list(length=1000)
    
    promoters = len([r for r in nps_responses if r.get("category") == "promoter"])
    passives = len([r for r in nps_responses if r.get("category") == "passive"])
    detractors = len([r for r in nps_responses if r.get("category") == "detractor"])
    total_nps = len(nps_responses)
    
    nps_score = 0
    if total_nps > 0:
        nps_score = round((promoters - detractors) / total_nps * 100)
    
    # Average ratings by survey type
    survey_stats_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}, "rating": {"$exists": True}}},
        {"$group": {
            "_id": "$survey_type",
            "avg_rating": {"$avg": "$rating"},
            "count": {"$sum": 1}
        }}
    ]
    survey_stats = await db.survey_responses.aggregate(survey_stats_pipeline).to_list(length=10)
    
    # Recent feedback
    recent_feedback = await db.survey_responses.find(
        {"created_at": {"$gte": start_date}, "feedback": {"$exists": True, "$ne": ""}},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(length=20)
    
    # NPS trend (weekly)
    nps_trend = []
    for i in range(4):
        week_start = datetime.now(timezone.utc) - timedelta(days=(i+1)*7)
        week_end = datetime.now(timezone.utc) - timedelta(days=i*7)
        
        week_responses = [r for r in nps_responses 
                        if week_start.isoformat() <= r.get("created_at", "") < week_end.isoformat()]
        
        if week_responses:
            week_promoters = len([r for r in week_responses if r.get("category") == "promoter"])
            week_detractors = len([r for r in week_responses if r.get("category") == "detractor"])
            week_nps = round((week_promoters - week_detractors) / len(week_responses) * 100)
        else:
            week_nps = 0
        
        nps_trend.append({
            "week": f"Woche -{i+1}",
            "nps": week_nps,
            "responses": len(week_responses)
        })
    
    return {
        "nps": {
            "score": nps_score,
            "promoters": promoters,
            "passives": passives,
            "detractors": detractors,
            "total_responses": total_nps,
            "trend": list(reversed(nps_trend))
        },
        "surveys": {
            "by_type": [{"type": s["_id"], "avg_rating": round(s["avg_rating"], 1), "count": s["count"]} 
                       for s in survey_stats]
        },
        "recent_feedback": recent_feedback
    }


# ==================== SURVEY QUESTIONS ====================

@router.get("/questions/{survey_type}")
async def get_survey_questions(survey_type: str):
    """Get questions for a specific survey type"""
    
    questions = {
        "nps": {
            "title": "Net Promoter Score",
            "questions": [
                {
                    "id": "score",
                    "type": "scale",
                    "text": "Wie wahrscheinlich ist es, dass du BidBlitz einem Freund empfiehlst?",
                    "min": 0,
                    "max": 10,
                    "labels": {"0": "Sehr unwahrscheinlich", "10": "Sehr wahrscheinlich"}
                },
                {
                    "id": "reason",
                    "type": "text",
                    "text": "Was ist der Hauptgrund für deine Bewertung?",
                    "optional": True
                }
            ]
        },
        "post_win": {
            "title": "Gewinn-Feedback",
            "questions": [
                {
                    "id": "satisfaction",
                    "type": "rating",
                    "text": "Wie zufrieden bist du mit deinem Gewinn?",
                    "max": 5
                },
                {
                    "id": "experience",
                    "type": "choice",
                    "text": "Wie war dein Auktionserlebnis?",
                    "options": ["Aufregend", "Okay", "Stressig", "Frustrierend"]
                },
                {
                    "id": "feedback",
                    "type": "text",
                    "text": "Möchtest du uns noch etwas mitteilen?",
                    "optional": True
                }
            ]
        },
        "post_purchase": {
            "title": "Kauf-Feedback",
            "questions": [
                {
                    "id": "ease",
                    "type": "rating",
                    "text": "Wie einfach war der Kaufprozess?",
                    "max": 5
                },
                {
                    "id": "value",
                    "type": "rating",
                    "text": "Wie bewertest du das Preis-Leistungs-Verhältnis?",
                    "max": 5
                },
                {
                    "id": "improvement",
                    "type": "text",
                    "text": "Was können wir verbessern?",
                    "optional": True
                }
            ]
        }
    }
    
    if survey_type not in questions:
        raise HTTPException(status_code=404, detail="Survey type not found")
    
    return questions[survey_type]
