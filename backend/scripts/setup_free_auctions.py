"""Script to create 100 Gebote Gutschein free auctions and remove other free auctions"""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import random

async def setup_free_auctions():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client["bidblitz_production"]
    
    # 1. Remove is_free_auction from all existing auctions (except our new ones)
    await db.auctions.update_many(
        {"is_free_auction": True},
        {"$set": {"is_free_auction": False}}
    )
    print("✓ Removed free status from all existing auctions")
    
    # 2. Create the 100 Gebote Gutschein product
    product_id = "100-gebote-gutschein"
    
    gutschein_product = {
        "id": product_id,
        "name": "100 Gebote Gutschein",
        "description": "Gewinnen Sie 100 kostenlose Gebote! Bieten Sie GRATIS mit - der Gewinner erhält 100 Gebote auf sein Konto gutgeschrieben.",
        "category": "Gutscheine",
        "retail_price": 50.00,  # Value of 100 bids at €0.50 each
        "image_url": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400",
        "is_bid_voucher": True,
        "bid_amount": 100,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if product exists
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        await db.products.insert_one(gutschein_product)
        print("✓ Created 100 Gebote Gutschein product")
    else:
        await db.products.update_one({"id": product_id}, {"$set": gutschein_product})
        print("✓ Updated 100 Gebote Gutschein product")
    
    # 3. Create 5 free auctions for 100 Gebote Gutschein
    for i in range(5):
        auction_id = str(uuid.uuid4())
        duration_minutes = random.choice([10, 15, 20])
        end_time = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)
        
        auction = {
            "id": auction_id,
            "product_id": product_id,
            "status": "active",
            "current_price": 0.01,
            "start_price": 0.01,
            "bid_increment": 0.01,
            "end_time": end_time.isoformat(),
            "start_time": datetime.now(timezone.utc).isoformat(),
            "total_bids": 0,
            "last_bidder_id": None,
            "last_bidder_name": None,
            "is_featured": False,
            "is_vip_only": False,
            "is_beginner_only": False,
            "is_free_auction": True,  # This is the key flag
            "is_night_auction": False,
            "bot_target_price": random.uniform(0.3, 1.0),  # Low target for free auctions
            "auto_restart": {
                "enabled": True,
                "duration_minutes": duration_minutes,
                "max_restarts": 100,
                "current_restarts": 0
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.auctions.insert_one(auction)
        print(f"✓ Created free auction #{i+1}: 100 Gebote Gutschein")
    
    # 4. Update the old Gutscheine products to NOT be free auctions
    # (Amazon, MediaMarkt, etc. should be regular auctions)
    old_gutscheine = ["Amazon Gutschein", "MediaMarkt Gutschein", "IKEA Gutschein", 
                      "Steam Wallet", "PlayStation Store", "Netflix", "Spotify"]
    
    for name_part in old_gutscheine:
        await db.auctions.update_many(
            {"product_id": {"$regex": name_part, "$options": "i"}},
            {"$set": {"is_free_auction": False}}
        )
    
    # Also update by product name lookup
    products = await db.products.find(
        {"name": {"$regex": "Gutschein|Store|Netflix|Spotify", "$options": "i"}}
    ).to_list(100)
    
    for product in products:
        if product["id"] != product_id:  # Don't update our 100 Gebote Gutschein
            await db.auctions.update_many(
                {"product_id": product["id"]},
                {"$set": {"is_free_auction": False}}
            )
    
    print("✓ Removed free status from other Gutscheine")
    
    # Count final state
    free_count = await db.auctions.count_documents({"is_free_auction": True, "status": "active"})
    total_count = await db.auctions.count_documents({"status": "active"})
    
    print(f"\n✅ Fertig! {free_count} Gratis-Auktionen (nur 100 Gebote Gutschein)")
    print(f"📊 Gesamt: {total_count} aktive Auktionen")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_free_auctions())
