"""
Script to add 50 new diverse auctions with various products
"""
import asyncio
import random
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta

# Diverse product categories and items
NEW_PRODUCTS = [
    # Luxus-Uhren
    {"name": "Rolex Submariner", "category": "Uhren", "retail_price": 9500, "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"},
    {"name": "Omega Speedmaster", "category": "Uhren", "retail_price": 6500, "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400"},
    {"name": "Tag Heuer Carrera", "category": "Uhren", "retail_price": 4200, "image_url": "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400"},
    {"name": "Breitling Navitimer", "category": "Uhren", "retail_price": 7800, "image_url": "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400"},
    
    # Designer-Taschen
    {"name": "Louis Vuitton Neverfull", "category": "Mode", "retail_price": 1800, "image_url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400"},
    {"name": "Gucci Marmont Tasche", "category": "Mode", "retail_price": 2200, "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400"},
    {"name": "Chanel Classic Flap", "category": "Mode", "retail_price": 8500, "image_url": "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400"},
    {"name": "Hermès Birkin 25", "category": "Mode", "retail_price": 12000, "image_url": "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400"},
    
    # High-End Elektronik
    {"name": "Apple Vision Pro", "category": "Elektronik", "retail_price": 3999, "image_url": "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400"},
    {"name": "Samsung Galaxy Z Fold 5", "category": "Elektronik", "retail_price": 1899, "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400"},
    {"name": "Sony A7 IV Kamera", "category": "Elektronik", "retail_price": 2799, "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400"},
    {"name": "Canon EOS R5", "category": "Elektronik", "retail_price": 4299, "image_url": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400"},
    {"name": "GoPro Hero 12 Black", "category": "Elektronik", "retail_price": 449, "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400"},
    {"name": "DJI Osmo Pocket 3", "category": "Elektronik", "retail_price": 519, "image_url": "https://images.unsplash.com/photo-1533310266094-8898a03807dd?w=400"},
    
    # Gaming
    {"name": "Xbox Series X", "category": "Gaming", "retail_price": 499, "image_url": "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400"},
    {"name": "Nintendo Switch OLED", "category": "Gaming", "retail_price": 349, "image_url": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400"},
    {"name": "Steam Deck OLED 512GB", "category": "Gaming", "retail_price": 569, "image_url": "https://images.unsplash.com/photo-1640955014216-75201056c829?w=400"},
    {"name": "Razer Blade 16 Gaming Laptop", "category": "Gaming", "retail_price": 2999, "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400"},
    {"name": "ASUS ROG Ally", "category": "Gaming", "retail_price": 699, "image_url": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400"},
    
    # Smart Home
    {"name": "Philips Hue Starter Kit", "category": "Smart Home", "retail_price": 199, "image_url": "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400"},
    {"name": "Ring Video Doorbell Pro 2", "category": "Smart Home", "retail_price": 249, "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"},
    {"name": "Sonos Arc Soundbar", "category": "Smart Home", "retail_price": 899, "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400"},
    {"name": "Google Nest Hub Max", "category": "Smart Home", "retail_price": 229, "image_url": "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400"},
    {"name": "ecobee Smart Thermostat", "category": "Smart Home", "retail_price": 249, "image_url": "https://images.unsplash.com/photo-1567925086983-a8ae99bdd6f2?w=400"},
    
    # Sport & Fitness
    {"name": "Peloton Bike+", "category": "Sport", "retail_price": 2495, "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"},
    {"name": "Garmin Fenix 7X", "category": "Sport", "retail_price": 899, "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400"},
    {"name": "Theragun Pro", "category": "Sport", "retail_price": 599, "image_url": "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400"},
    {"name": "NordicTrack Laufband", "category": "Sport", "retail_price": 1999, "image_url": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400"},
    {"name": "Bowflex SelectTech Hanteln", "category": "Sport", "retail_price": 549, "image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"},
    
    # Küche
    {"name": "KitchenAid Artisan", "category": "Küche", "retail_price": 699, "image_url": "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=400"},
    {"name": "Nespresso Vertuo Next", "category": "Küche", "retail_price": 199, "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400"},
    {"name": "Ninja Foodi Max", "category": "Küche", "retail_price": 299, "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"},
    {"name": "Sage Barista Express", "category": "Küche", "retail_price": 679, "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"},
    {"name": "Vitamix A3500", "category": "Küche", "retail_price": 849, "image_url": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400"},
    
    # Outdoor & Reisen
    {"name": "Rimowa Original Cabin", "category": "Reisen", "retail_price": 1100, "image_url": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400"},
    {"name": "Yeti Tundra 45 Kühlbox", "category": "Outdoor", "retail_price": 349, "image_url": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400"},
    {"name": "Jackery Explorer 1000", "category": "Outdoor", "retail_price": 999, "image_url": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400"},
    {"name": "Osprey Atmos AG 65", "category": "Outdoor", "retail_price": 320, "image_url": "https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=400"},
    {"name": "Weber Genesis E-335", "category": "Outdoor", "retail_price": 1299, "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"},
    
    # Beauty & Wellness
    {"name": "Dyson Airwrap Complete", "category": "Beauty", "retail_price": 599, "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400"},
    {"name": "NuFace Trinity Pro", "category": "Beauty", "retail_price": 425, "image_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"},
    {"name": "Foreo Luna 4", "category": "Beauty", "retail_price": 399, "image_url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400"},
    {"name": "ghd Platinum+ Styler", "category": "Beauty", "retail_price": 279, "image_url": "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400"},
    
    # Audio
    {"name": "Bang & Olufsen Beoplay H95", "category": "Audio", "retail_price": 899, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"},
    {"name": "Focal Utopia Kopfhörer", "category": "Audio", "retail_price": 4299, "image_url": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400"},
    {"name": "Devialet Phantom I", "category": "Audio", "retail_price": 2390, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"},
    {"name": "Bowers & Wilkins PX8", "category": "Audio", "retail_price": 699, "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400"},
    
    # Geschenkkarten & Gutscheine
    {"name": "Amazon Gutschein €500", "category": "Gutscheine", "retail_price": 500, "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400"},
    {"name": "Apple Store Gutschein €300", "category": "Gutscheine", "retail_price": 300, "image_url": "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=400"},
]

async def add_50_auctions():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client["bidblitz"]
    
    now = datetime.now(timezone.utc)
    auctions_created = 0
    products_created = 0
    
    # Shuffle products to get variety
    products_to_use = NEW_PRODUCTS.copy()
    random.shuffle(products_to_use)
    
    for i, product_data in enumerate(products_to_use[:50]):
        # Create product if not exists
        product_id = str(uuid.uuid4())
        product = {
            "id": product_id,
            "name": product_data["name"],
            "description": f"Premium {product_data['name']} - Originalverpackt mit Garantie",
            "category": product_data["category"],
            "retail_price": product_data["retail_price"],
            "image_url": product_data["image_url"],
            "created_at": now.isoformat()
        }
        
        await db.products.insert_one(product)
        products_created += 1
        
        # Create auction with varied timer (10 seconds to 5 minutes)
        timer_seconds = random.randint(10, 300)
        end_time = now + timedelta(seconds=timer_seconds)
        
        # Random starting price between 0.01 and 0.50
        start_price = round(random.uniform(0.01, 0.50), 2)
        
        auction = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "status": "active",
            "current_price": start_price,
            "start_price": start_price,
            "bid_increment": 0.01,
            "timer_seconds": random.choice([10, 12, 15]),
            "end_time": end_time.isoformat(),
            "total_bids": int(start_price / 0.01),
            "last_bidder_id": None,
            "last_bidder_name": None,
            "bid_history": [],
            "created_at": now.isoformat(),
            "is_vip_only": random.random() < 0.1,  # 10% VIP
            "is_beginner_only": random.random() < 0.15,  # 15% Anfänger
            "is_free_auction": random.random() < 0.1,  # 10% Gratis
            "is_night_auction": random.random() < 0.05,  # 5% Nacht
            "auto_restart": random.random() < 0.3,  # 30% Auto-Restart
        }
        
        await db.auctions.insert_one(auction)
        auctions_created += 1
        
        print(f"  {i+1}. {product_data['name']} - €{product_data['retail_price']} - Timer: {timer_seconds}s")
    
    print(f"\n✅ {auctions_created} neue Auktionen erstellt!")
    print(f"✅ {products_created} neue Produkte erstellt!")
    
    # Count total active auctions
    total_active = await db.auctions.count_documents({"status": "active"})
    print(f"📊 Gesamt aktive Auktionen: {total_active}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_50_auctions())
