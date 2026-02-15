"""
Script to reset all auctions and create new ones with varied end times (2-3 days)
"""
import asyncio
import random
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "bidblitz")

async def reset_auctions():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=" * 60)
    print("AUCTION RESET SCRIPT")
    print("=" * 60)
    
    # 1. Delete all existing auctions
    print("\n1. Deleting all existing auctions...")
    result = await db.auctions.delete_many({})
    print(f"   Deleted {result.deleted_count} auctions")
    
    # Also delete auction history
    result = await db.auction_history.delete_many({})
    print(f"   Deleted {result.deleted_count} auction history entries")
    
    # 2. Get all products
    print("\n2. Fetching products...")
    products = await db.products.find({}).to_list(100)
    print(f"   Found {len(products)} products")
    
    if not products:
        print("   ERROR: No products found! Cannot create auctions.")
        return
    
    # 3. Create new auctions with varied end times
    print("\n3. Creating new auctions with varied end times (2-3 days)...")
    
    now = datetime.now(timezone.utc)
    auctions_created = 0
    
    # Shuffle products to randomize
    random.shuffle(products)
    
    # Create auctions for the first 25 products with different times
    for i, product in enumerate(products[:25]):
        # Random end time between 2 and 3 days from now
        # Add variety: some hours, some minutes different
        hours_offset = random.randint(48, 72)  # 2-3 days in hours
        minutes_offset = random.randint(0, 59)
        seconds_offset = random.randint(10, 50)
        
        end_time = now + timedelta(
            hours=hours_offset,
            minutes=minutes_offset,
            seconds=seconds_offset
        )
        
        # Determine auction type randomly
        auction_types = [
            {"is_beginner_only": False, "is_night_auction": False, "is_vip_only": False},  # Normal
            {"is_beginner_only": False, "is_night_auction": False, "is_vip_only": False},  # Normal
            {"is_beginner_only": False, "is_night_auction": False, "is_vip_only": False},  # Normal
            {"is_beginner_only": True, "is_night_auction": False, "is_vip_only": False},   # Beginner
            {"is_beginner_only": False, "is_night_auction": True, "is_vip_only": False},   # Night
            {"is_beginner_only": False, "is_night_auction": False, "is_vip_only": True},   # VIP
        ]
        
        auction_type = random.choice(auction_types)
        
        auction = {
            "id": str(uuid.uuid4()),
            "product_id": product["id"],
            "start_price": 0.0,
            "current_price": round(random.uniform(0.01, 0.50), 2),  # Start with small random price
            "price_increment": 0.01,
            "time_increment": 10,  # 10 seconds added per bid
            "status": "active",
            "start_time": now.isoformat(),
            "end_time": end_time.isoformat(),
            "total_bids": random.randint(1, 20),  # Some initial bids
            "unique_bidders": random.randint(1, 5),
            "winner_id": None,
            "final_price": None,
            "last_bidder_id": None,
            "last_bidder_name": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            **auction_type
        }
        
        await db.auctions.insert_one(auction)
        auctions_created += 1
        
        time_str = end_time.strftime("%d.%m.%Y %H:%M:%S")
        auction_label = "NORMAL"
        if auction_type.get("is_beginner_only"):
            auction_label = "BEGINNER 🎓"
        elif auction_type.get("is_night_auction"):
            auction_label = "NIGHT 🌙"
        elif auction_type.get("is_vip_only"):
            auction_label = "VIP ⭐"
            
        print(f"   [{auctions_created:02d}] {product['name'][:40]:<40} -> {time_str} ({auction_label})")
    
    # 4. Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total auctions created: {auctions_created}")
    print(f"End times range: {(now + timedelta(hours=48)).strftime('%d.%m.%Y %H:%M')} - {(now + timedelta(hours=72)).strftime('%d.%m.%Y %H:%M')}")
    print("\nAuction types distribution:")
    
    # Count by type
    normal = await db.auctions.count_documents({"is_beginner_only": False, "is_night_auction": False, "is_vip_only": False})
    beginner = await db.auctions.count_documents({"is_beginner_only": True})
    night = await db.auctions.count_documents({"is_night_auction": True})
    vip = await db.auctions.count_documents({"is_vip_only": True})
    
    print(f"  - Normal: {normal}")
    print(f"  - Beginner: {beginner}")
    print(f"  - Night: {night}")
    print(f"  - VIP: {vip}")
    
    print("\n✅ Done! Auctions have been reset.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_auctions())
