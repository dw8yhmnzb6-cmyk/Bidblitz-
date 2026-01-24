"""Script to add 50 new auctions with various products"""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import random

# New products to add
NEW_PRODUCTS = [
    # Electronics
    {"name": "Samsung Galaxy S24 Ultra", "category": "Smartphones", "retail_price": 1449, "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400"},
    {"name": "iPhone 15 Pro Max 256GB", "category": "Smartphones", "retail_price": 1479, "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"},
    {"name": "Google Pixel 8 Pro", "category": "Smartphones", "retail_price": 999, "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400"},
    {"name": "OnePlus 12", "category": "Smartphones", "retail_price": 899, "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"},
    {"name": "Xiaomi 14 Pro", "category": "Smartphones", "retail_price": 799, "image_url": "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400"},
    
    # Laptops
    {"name": "MacBook Air M3 15\"", "category": "Laptops", "retail_price": 1599, "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"},
    {"name": "Dell XPS 15 2024", "category": "Laptops", "retail_price": 1799, "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400"},
    {"name": "ASUS ROG Zephyrus G16", "category": "Laptops", "retail_price": 2199, "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400"},
    {"name": "Lenovo ThinkPad X1 Carbon", "category": "Laptops", "retail_price": 1899, "image_url": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400"},
    {"name": "HP Spectre x360 14", "category": "Laptops", "retail_price": 1499, "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"},
    
    # Gaming
    {"name": "PlayStation 5 Pro", "category": "Gaming", "retail_price": 799, "image_url": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400"},
    {"name": "Xbox Series X", "category": "Gaming", "retail_price": 499, "image_url": "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400"},
    {"name": "Nintendo Switch OLED", "category": "Gaming", "retail_price": 349, "image_url": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400"},
    {"name": "Steam Deck OLED 512GB", "category": "Gaming", "retail_price": 549, "image_url": "https://images.unsplash.com/photo-1640955014216-75201056c829?w=400"},
    {"name": "Razer Blade 16 Gaming", "category": "Gaming", "retail_price": 2999, "image_url": "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=400"},
    
    # Audio
    {"name": "Apple AirPods Pro 2", "category": "Audio", "retail_price": 279, "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400"},
    {"name": "Sony WH-1000XM5", "category": "Audio", "retail_price": 399, "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400"},
    {"name": "Bose QuietComfort Ultra", "category": "Audio", "retail_price": 429, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"},
    {"name": "Sennheiser Momentum 4", "category": "Audio", "retail_price": 349, "image_url": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400"},
    {"name": "Bang & Olufsen Beoplay H95", "category": "Audio", "retail_price": 899, "image_url": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400"},
    
    # TVs
    {"name": "LG OLED C4 65\"", "category": "TV", "retail_price": 1999, "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"},
    {"name": "Samsung QN90C 55\"", "category": "TV", "retail_price": 1499, "image_url": "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400"},
    {"name": "Sony Bravia XR A95L 65\"", "category": "TV", "retail_price": 2999, "image_url": "https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=400"},
    {"name": "TCL 85\" Mini LED", "category": "TV", "retail_price": 1799, "image_url": "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400"},
    
    # Cameras
    {"name": "Sony A7 IV", "category": "Kameras", "retail_price": 2499, "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400"},
    {"name": "Canon EOS R8", "category": "Kameras", "retail_price": 1499, "image_url": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400"},
    {"name": "Nikon Z8", "category": "Kameras", "retail_price": 3999, "image_url": "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=400"},
    {"name": "Fujifilm X-T5", "category": "Kameras", "retail_price": 1699, "image_url": "https://images.unsplash.com/photo-1606986628226-3e56fd56e7ff?w=400"},
    {"name": "DJI Mavic 3 Pro", "category": "Drohnen", "retail_price": 2199, "image_url": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400"},
    
    # Smart Home
    {"name": "Dyson V15 Detect", "category": "Haushalt", "retail_price": 749, "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400"},
    {"name": "iRobot Roomba j9+", "category": "Haushalt", "retail_price": 999, "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"},
    {"name": "Thermomix TM6", "category": "Haushalt", "retail_price": 1499, "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"},
    {"name": "Philips Hue Starter Kit", "category": "Smart Home", "retail_price": 199, "image_url": "https://images.unsplash.com/photo-1558002038-1055907df827?w=400"},
    
    # Watches
    {"name": "Apple Watch Ultra 2", "category": "Smartwatch", "retail_price": 899, "image_url": "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400"},
    {"name": "Samsung Galaxy Watch 6 Classic", "category": "Smartwatch", "retail_price": 449, "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"},
    {"name": "Garmin Fenix 7X", "category": "Smartwatch", "retail_price": 899, "image_url": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400"},
    {"name": "Rolex Submariner", "category": "Uhren", "retail_price": 9999, "image_url": "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400"},
    {"name": "Omega Speedmaster", "category": "Uhren", "retail_price": 6999, "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400"},
    
    # Gutscheine (Gift Cards) - These are FREE to bid but winner pays end price
    {"name": "Amazon Gutschein €500", "category": "Gutscheine", "retail_price": 500, "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400", "is_free_auction": True},
    {"name": "MediaMarkt Gutschein €300", "category": "Gutscheine", "retail_price": 300, "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400", "is_free_auction": True},
    {"name": "IKEA Gutschein €250", "category": "Gutscheine", "retail_price": 250, "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400", "is_free_auction": True},
    {"name": "Steam Wallet €100", "category": "Gutscheine", "retail_price": 100, "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400", "is_free_auction": True},
    {"name": "PlayStation Store €75", "category": "Gutscheine", "retail_price": 75, "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400", "is_free_auction": True},
    {"name": "Netflix 1 Jahr Premium", "category": "Gutscheine", "retail_price": 215, "image_url": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400", "is_free_auction": True},
    {"name": "Spotify 1 Jahr Familie", "category": "Gutscheine", "retail_price": 179, "image_url": "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400", "is_free_auction": True},
    
    # Beauty & Fashion
    {"name": "Louis Vuitton Tasche", "category": "Mode", "retail_price": 1890, "image_url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400"},
    {"name": "Ray-Ban Wayfarer", "category": "Accessoires", "retail_price": 159, "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400"},
    {"name": "Nike Air Jordan 1 Retro", "category": "Schuhe", "retail_price": 180, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},
    {"name": "Adidas Yeezy Boost 350", "category": "Schuhe", "retail_price": 230, "image_url": "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400"},
    
    # Sports
    {"name": "Peloton Bike+", "category": "Sport", "retail_price": 2495, "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"},
    {"name": "Bowflex Adjustable Dumbbells", "category": "Sport", "retail_price": 549, "image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"},
]

async def add_products_and_auctions():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client["bidblitz_production"]
    
    products_added = 0
    auctions_added = 0
    
    for i, product_data in enumerate(NEW_PRODUCTS):
        # Create product
        product_id = str(uuid.uuid4())
        is_free = product_data.get("is_free_auction", False)
        
        product = {
            "id": product_id,
            "name": product_data["name"],
            "description": f"Original {product_data['name']} - Neuware mit Garantie",
            "category": product_data["category"],
            "retail_price": product_data["retail_price"],
            "image_url": product_data["image_url"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if product already exists
        existing = await db.products.find_one({"name": product_data["name"]})
        if not existing:
            await db.products.insert_one(product)
            products_added += 1
        else:
            product_id = existing["id"]
        
        # Create auction for this product
        auction_id = str(uuid.uuid4())
        
        # Determine auction type
        is_night_auction = i % 10 == 0  # Every 10th auction is night auction
        
        # Set duration based on type
        if is_night_auction:
            # Night auctions only run from 23:30 to 06:00
            duration_minutes = 15
        else:
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
            "is_free_auction": is_free,
            "is_night_auction": is_night_auction,
            "bot_target_price": random.uniform(1.5, 5.0) if not is_free else random.uniform(0.5, 2.0),
            "auto_restart": {
                "enabled": True,
                "duration_minutes": duration_minutes,
                "max_restarts": 100,
                "current_restarts": 0
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.auctions.insert_one(auction)
        auctions_added += 1
        print(f"Added: {product_data['name']} ({'GRATIS' if is_free else 'Normal'}, {'NACHT' if is_night_auction else 'Tag'})")
    
    print(f"\n✅ Fertig! {products_added} Produkte und {auctions_added} Auktionen hinzugefügt.")
    client.close()

if __name__ == "__main__":
    asyncio.run(add_products_and_auctions())
