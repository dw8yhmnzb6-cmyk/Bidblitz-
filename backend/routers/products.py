"""Products router - CRUD operations for products"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List
import uuid

from config import db
from dependencies import get_admin_user
from schemas import ProductCreate, ProductUpdate

router = APIRouter(tags=["Products"])

# ==================== RESPONSE MODEL ====================

class ProductResponse:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

# ==================== PUBLIC ENDPOINTS ====================

@router.get("/products")
async def get_products():
    """Get all products"""
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return products

@router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# ==================== ADMIN ENDPOINTS ====================

@router.post("/admin/products")
async def create_product(product: ProductCreate, admin: dict = Depends(get_admin_user)):
    """Create a new product (admin only)"""
    product_id = str(uuid.uuid4())
    doc = {
        "id": product_id,
        **product.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(doc)
    return doc

@router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, admin: dict = Depends(get_admin_user)):
    """Update a product (admin only)"""
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updates = {k: v for k, v in product.model_dump().items() if v is not None}
    if updates:
        await db.products.update_one({"id": product_id}, {"$set": updates})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a product (admin only)"""
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}
