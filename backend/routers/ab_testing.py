"""A/B Testing System for prices and features"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import random

from config import db, logger
from dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/ab-testing", tags=["A/B Testing"])

class ABTestCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    variants: List[Dict[str, Any]]  # [{"name": "A", "value": 10}, {"name": "B", "value": 15}]
    traffic_split: Optional[List[int]] = None  # [50, 50] = 50% each

class ABTestResult(BaseModel):
    test_id: str
    variant: str
    converted: bool
    revenue: Optional[float] = 0

@router.post("/create")
async def create_ab_test(test: ABTestCreate, admin: dict = Depends(get_admin_user)):
    """Create a new A/B test"""
    now = datetime.now(timezone.utc)
    
    if not test.traffic_split:
        # Equal split
        test.traffic_split = [100 // len(test.variants)] * len(test.variants)
    
    test_doc = {
        "id": str(uuid.uuid4()),
        "name": test.name,
        "description": test.description,
        "variants": test.variants,
        "traffic_split": test.traffic_split,
        "status": "active",
        "created_by": admin.get("id"),
        "created_at": now.isoformat(),
        "results": {v["name"]: {"views": 0, "conversions": 0, "revenue": 0} for v in test.variants}
    }
    
    await db.ab_tests.insert_one(test_doc)
    del test_doc["_id"]
    
    return {"success": True, "test": test_doc}

@router.get("/assign/{test_name}")
async def get_test_assignment(test_name: str, user: dict = Depends(get_current_user)):
    """Get user's assigned variant for a test"""
    user_id = user["id"]
    
    # Check if user already assigned
    assignment = await db.ab_assignments.find_one({
        "user_id": user_id,
        "test_name": test_name
    }, {"_id": 0})
    
    if assignment:
        return {"variant": assignment["variant"], "value": assignment.get("value")}
    
    # Get test
    test = await db.ab_tests.find_one({"name": test_name, "status": "active"}, {"_id": 0})
    if not test:
        return {"variant": None, "message": "Test nicht gefunden"}
    
    # Assign variant based on traffic split
    rand = random.randint(1, 100)
    cumulative = 0
    selected_variant = test["variants"][0]
    
    for i, split in enumerate(test["traffic_split"]):
        cumulative += split
        if rand <= cumulative:
            selected_variant = test["variants"][i]
            break
    
    # Save assignment
    assignment = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "test_id": test["id"],
        "test_name": test_name,
        "variant": selected_variant["name"],
        "value": selected_variant.get("value"),
        "assigned_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ab_assignments.insert_one(assignment)
    
    # Increment view count
    await db.ab_tests.update_one(
        {"id": test["id"]},
        {"$inc": {f"results.{selected_variant['name']}.views": 1}}
    )
    
    return {"variant": selected_variant["name"], "value": selected_variant.get("value")}

@router.post("/convert")
async def record_conversion(result: ABTestResult, user: dict = Depends(get_current_user)):
    """Record a conversion for an A/B test"""
    
    await db.ab_tests.update_one(
        {"id": result.test_id},
        {
            "$inc": {
                f"results.{result.variant}.conversions": 1 if result.converted else 0,
                f"results.{result.variant}.revenue": result.revenue
            }
        }
    )
    
    return {"success": True}

@router.get("/results/{test_id}")
async def get_test_results(test_id: str, admin: dict = Depends(get_admin_user)):
    """Get A/B test results"""
    test = await db.ab_tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test nicht gefunden")
    
    # Calculate conversion rates
    for variant_name, data in test.get("results", {}).items():
        views = data.get("views", 0)
        conversions = data.get("conversions", 0)
        data["conversion_rate"] = round((conversions / views * 100), 2) if views > 0 else 0
        data["avg_revenue"] = round(data.get("revenue", 0) / conversions, 2) if conversions > 0 else 0
    
    return {"test": test}

@router.get("/all")
async def get_all_tests(admin: dict = Depends(get_admin_user)):
    """Get all A/B tests"""
    tests = await db.ab_tests.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"tests": tests}

@router.post("/{test_id}/end")
async def end_test(test_id: str, admin: dict = Depends(get_admin_user)):
    """End an A/B test"""
    result = await db.ab_tests.update_one(
        {"id": test_id},
        {"$set": {
            "status": "completed",
            "ended_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Test nicht gefunden")
    
    return {"success": True}

ab_testing_router = router
