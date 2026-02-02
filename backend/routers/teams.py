"""Team Auctions Router - Group bidding feature"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional, List
import uuid
import random
import string

from config import db, logger
from dependencies import get_current_user

router = APIRouter(prefix="/teams", tags=["Team Auctions"])

# ==================== SCHEMAS ====================

class TeamCreate(BaseModel):
    name: str
    max_members: int = 3  # 2-3 members

class TeamInvite(BaseModel):
    team_id: str
    user_email: Optional[str] = None
    user_id: Optional[str] = None

class TeamBid(BaseModel):
    auction_id: str
    bid_count: int = 1

# ==================== HELPERS ====================

def generate_team_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# ==================== ENDPOINTS ====================

@router.post("/create")
async def create_team(data: TeamCreate, user: dict = Depends(get_current_user)):
    """Create a new bidding team"""
    user_id = user["id"]
    
    # Check if user is already in a team
    existing_team = await db.teams.find_one({
        "members.user_id": user_id,
        "status": "active"
    })
    
    if existing_team:
        raise HTTPException(status_code=400, detail="Du bist bereits in einem Team")
    
    if data.max_members < 2 or data.max_members > 3:
        data.max_members = 3
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    team = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "code": generate_team_code(),
        "leader_id": user_id,
        "max_members": data.max_members,
        "members": [{
            "user_id": user_id,
            "username": user_data.get("username", user_data.get("email", "").split("@")[0]) if user_data else "Leader",
            "joined_at": datetime.now(timezone.utc).isoformat(),
            "contributed_bids": 0,
            "is_leader": True
        }],
        "shared_bids": 0,  # Pool of team bids
        "total_wins": 0,
        "total_savings": 0,
        "active_auctions": [],  # Auctions team is currently bidding on
        "won_auctions": [],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.teams.insert_one(team)
    
    logger.info(f"Team created: {team['name']} by {user_id}")
    
    return {
        "success": True,
        "message": f"Team '{data.name}' erstellt! Teile den Code: {team['code']}",
        "team": {
            "id": team["id"],
            "name": team["name"],
            "code": team["code"]
        }
    }

@router.post("/join/{code}")
async def join_team(code: str, user: dict = Depends(get_current_user)):
    """Join a team using invite code"""
    user_id = user["id"]
    
    # Check if user is already in a team
    existing = await db.teams.find_one({
        "members.user_id": user_id,
        "status": "active"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Du bist bereits in einem Team")
    
    team = await db.teams.find_one({"code": code.upper(), "status": "active"}, {"_id": 0})
    
    if not team:
        raise HTTPException(status_code=404, detail="Team nicht gefunden")
    
    if len(team["members"]) >= team["max_members"]:
        raise HTTPException(status_code=400, detail="Team ist voll")
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    new_member = {
        "user_id": user_id,
        "username": user_data.get("username", user_data.get("email", "").split("@")[0]) if user_data else "Member",
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "contributed_bids": 0,
        "is_leader": False
    }
    
    await db.teams.update_one(
        {"id": team["id"]},
        {"$push": {"members": new_member}}
    )
    
    logger.info(f"User {user_id} joined team {team['name']}")
    
    return {
        "success": True,
        "message": f"Du bist Team '{team['name']}' beigetreten!",
        "team_id": team["id"]
    }

@router.post("/leave")
async def leave_team(user: dict = Depends(get_current_user)):
    """Leave current team"""
    user_id = user["id"]
    
    team = await db.teams.find_one({
        "members.user_id": user_id,
        "status": "active"
    }, {"_id": 0})
    
    if not team:
        raise HTTPException(status_code=404, detail="Du bist in keinem Team")
    
    if team["leader_id"] == user_id:
        # If leader leaves, disband team or transfer leadership
        if len(team["members"]) > 1:
            # Transfer to next member
            next_leader = [m for m in team["members"] if m["user_id"] != user_id][0]
            await db.teams.update_one(
                {"id": team["id"]},
                {
                    "$set": {"leader_id": next_leader["user_id"]},
                    "$pull": {"members": {"user_id": user_id}}
                }
            )
            # Update is_leader flag
            await db.teams.update_one(
                {"id": team["id"], "members.user_id": next_leader["user_id"]},
                {"$set": {"members.$.is_leader": True}}
            )
        else:
            # Disband team
            await db.teams.update_one(
                {"id": team["id"]},
                {"$set": {"status": "disbanded"}}
            )
    else:
        await db.teams.update_one(
            {"id": team["id"]},
            {"$pull": {"members": {"user_id": user_id}}}
        )
    
    return {"success": True, "message": "Team verlassen"}

@router.get("/my-team")
async def get_my_team(user: dict = Depends(get_current_user)):
    """Get current user's team"""
    team = await db.teams.find_one({
        "members.user_id": user["id"],
        "status": "active"
    }, {"_id": 0})
    
    if not team:
        return {"has_team": False, "team": None}
    
    return {"has_team": True, "team": team}

@router.post("/contribute-bids")
async def contribute_bids(bid_count: int, user: dict = Depends(get_current_user)):
    """Contribute personal bids to team pool"""
    user_id = user["id"]
    
    team = await db.teams.find_one({
        "members.user_id": user_id,
        "status": "active"
    }, {"_id": 0})
    
    if not team:
        raise HTTPException(status_code=404, detail="Du bist in keinem Team")
    
    # Check user's bids
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_data or user_data.get("bids", 0) < bid_count:
        raise HTTPException(status_code=400, detail="Nicht genug Gebote")
    
    # Transfer bids
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"bids": -bid_count}}
    )
    
    await db.teams.update_one(
        {"id": team["id"]},
        {"$inc": {"shared_bids": bid_count}}
    )
    
    # Update member's contribution
    await db.teams.update_one(
        {"id": team["id"], "members.user_id": user_id},
        {"$inc": {"members.$.contributed_bids": bid_count}}
    )
    
    logger.info(f"User {user_id} contributed {bid_count} bids to team {team['id']}")
    
    return {
        "success": True,
        "message": f"{bid_count} Gebote zum Team-Pool hinzugefügt!",
        "new_pool": team["shared_bids"] + bid_count
    }

@router.post("/bid")
async def team_bid(data: TeamBid, user: dict = Depends(get_current_user)):
    """Place a bid using team's shared bids"""
    user_id = user["id"]
    
    team = await db.teams.find_one({
        "members.user_id": user_id,
        "status": "active"
    }, {"_id": 0})
    
    if not team:
        raise HTTPException(status_code=404, detail="Du bist in keinem Team")
    
    if team["shared_bids"] < data.bid_count:
        raise HTTPException(status_code=400, detail="Nicht genug Team-Gebote")
    
    # Check auction
    auction = await db.auctions.find_one({
        "id": data.auction_id,
        "status": "active"
    }, {"_id": 0})
    
    if not auction:
        raise HTTPException(status_code=404, detail="Auktion nicht gefunden")
    
    # Deduct from team pool
    await db.teams.update_one(
        {"id": team["id"]},
        {
            "$inc": {"shared_bids": -data.bid_count},
            "$addToSet": {"active_auctions": data.auction_id}
        }
    )
    
    # Place bid (simplified - in production would integrate with main bid system)
    new_price = auction.get("current_price", 0) + 0.01
    
    await db.auctions.update_one(
        {"id": data.auction_id},
        {
            "$set": {
                "current_price": round(new_price, 2),
                "current_bidder_id": f"team:{team['id']}",
                "current_bidder_name": f"Team {team['name']}",
                "last_bid_time": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {"total_bids": 1}
        }
    )
    
    # Record team bid
    team_bid_record = {
        "id": str(uuid.uuid4()),
        "team_id": team["id"],
        "auction_id": data.auction_id,
        "bidder_id": user_id,
        "price": round(new_price, 2),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.team_bids.insert_one(team_bid_record)
    
    return {
        "success": True,
        "message": "Team-Gebot platziert!",
        "new_price": round(new_price, 2),
        "remaining_bids": team["shared_bids"] - data.bid_count
    }

@router.get("/leaderboard")
async def get_team_leaderboard(limit: int = 10):
    """Get top teams by wins"""
    teams = await db.teams.find(
        {"status": "active"},
        {"_id": 0, "id": 1, "name": 1, "total_wins": 1, "total_savings": 1, "members": 1}
    ).sort("total_wins", -1).to_list(limit)
    
    leaderboard = []
    for i, team in enumerate(teams):
        leaderboard.append({
            "rank": i + 1,
            "team_id": team["id"],
            "name": team["name"],
            "wins": team.get("total_wins", 0),
            "savings": team.get("total_savings", 0),
            "member_count": len(team.get("members", []))
        })
    
    return {"leaderboard": leaderboard}


teams_router = router
