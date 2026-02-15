#!/usr/bin/env python3
"""Script to add 100 new diverse auctions to bidblitz.ae"""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import random

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'penny_auction')

# 100 verschiedene Produkte in verschiedenen Kategorien
NEW_PRODUCTS = [
    # Smartphones (10)
    {"name": "iPhone 15 Pro Max 256GB", "category": "Smartphones", "retail_price": 1449.00, "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"},
    {"name": "Samsung Galaxy S24 Ultra", "category": "Smartphones", "retail_price": 1399.00, "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400"},
    {"name": "Google Pixel 8 Pro", "category": "Smartphones", "retail_price": 999.00, "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400"},
    {"name": "OnePlus 12 Pro", "category": "Smartphones", "retail_price": 899.00, "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"},
    {"name": "Xiaomi 14 Ultra", "category": "Smartphones", "retail_price": 1199.00, "image_url": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400"},
    {"name": "iPhone 14 128GB", "category": "Smartphones", "retail_price": 799.00, "image_url": "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400"},
    {"name": "Samsung Galaxy Z Fold 5", "category": "Smartphones", "retail_price": 1799.00, "image_url": "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=400"},
    {"name": "Nothing Phone 2", "category": "Smartphones", "retail_price": 649.00, "image_url": "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400"},
    {"name": "ASUS ROG Phone 8", "category": "Smartphones", "retail_price": 1099.00, "image_url": "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400"},
    {"name": "Sony Xperia 1 V", "category": "Smartphones", "retail_price": 1299.00, "image_url": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400"},
    
    # Laptops (10)
    {"name": "MacBook Pro 14\" M3 Pro", "category": "Laptops", "retail_price": 2499.00, "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"},
    {"name": "Dell XPS 15 OLED", "category": "Laptops", "retail_price": 1899.00, "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400"},
    {"name": "Lenovo ThinkPad X1 Carbon", "category": "Laptops", "retail_price": 1699.00, "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"},
    {"name": "HP Spectre x360 14", "category": "Laptops", "retail_price": 1599.00, "image_url": "https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=400"},
    {"name": "ASUS ZenBook Pro 16X", "category": "Laptops", "retail_price": 2299.00, "image_url": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400"},
    {"name": "Microsoft Surface Laptop 5", "category": "Laptops", "retail_price": 1299.00, "image_url": "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=400"},
    {"name": "Razer Blade 15 Gaming", "category": "Laptops", "retail_price": 2499.00, "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400"},
    {"name": "Acer Swift 5 Intel Evo", "category": "Laptops", "retail_price": 1199.00, "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"},
    {"name": "MacBook Air 15\" M2", "category": "Laptops", "retail_price": 1499.00, "image_url": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400"},
    {"name": "LG Gram 17 Ultralight", "category": "Laptops", "retail_price": 1799.00, "image_url": "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400"},
    
    # Audio (10)
    {"name": "Sony WH-1000XM5", "category": "Audio", "retail_price": 379.00, "image_url": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400"},
    {"name": "Apple AirPods Pro 2", "category": "Audio", "retail_price": 279.00, "image_url": "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400"},
    {"name": "Bose QuietComfort Ultra", "category": "Audio", "retail_price": 429.00, "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400"},
    {"name": "Sennheiser Momentum 4", "category": "Audio", "retail_price": 349.00, "image_url": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400"},
    {"name": "Bang & Olufsen H95", "category": "Audio", "retail_price": 899.00, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"},
    {"name": "Marshall Major IV", "category": "Audio", "retail_price": 149.00, "image_url": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400"},
    {"name": "JBL Flip 6 Speaker", "category": "Audio", "retail_price": 129.00, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"},
    {"name": "Sonos Era 300", "category": "Audio", "retail_price": 449.00, "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400"},
    {"name": "Audio-Technica ATH-M50x", "category": "Audio", "retail_price": 149.00, "image_url": "https://images.unsplash.com/photo-1599669454699-248893623440?w=400"},
    {"name": "Beats Studio Pro", "category": "Audio", "retail_price": 349.00, "image_url": "https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=400"},
    
    # Gaming (10)
    {"name": "PlayStation 5 Slim", "category": "Gaming", "retail_price": 549.00, "image_url": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400"},
    {"name": "Xbox Series X", "category": "Gaming", "retail_price": 499.00, "image_url": "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400"},
    {"name": "Nintendo Switch OLED", "category": "Gaming", "retail_price": 349.00, "image_url": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400"},
    {"name": "Steam Deck OLED 512GB", "category": "Gaming", "retail_price": 569.00, "image_url": "https://images.unsplash.com/photo-1640955014216-75201056c829?w=400"},
    {"name": "Razer Huntsman V3 Pro", "category": "Gaming", "retail_price": 249.00, "image_url": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400"},
    {"name": "Logitech G Pro X Superlight", "category": "Gaming", "retail_price": 159.00, "image_url": "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400"},
    {"name": "SteelSeries Arctis Nova Pro", "category": "Gaming", "retail_price": 349.00, "image_url": "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400"},
    {"name": "ASUS ROG Swift 27\" 4K", "category": "Gaming", "retail_price": 799.00, "image_url": "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400"},
    {"name": "Elgato Stream Deck MK.2", "category": "Gaming", "retail_price": 149.00, "image_url": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400"},
    {"name": "Secretlab TITAN Evo 2024", "category": "Gaming", "retail_price": 549.00, "image_url": "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400"},
    
    # Smart Home (10)
    {"name": "Apple HomePod 2. Gen", "category": "Smart Home", "retail_price": 299.00, "image_url": "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400"},
    {"name": "Google Nest Hub Max", "category": "Smart Home", "retail_price": 229.00, "image_url": "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400"},
    {"name": "Amazon Echo Show 15", "category": "Smart Home", "retail_price": 279.00, "image_url": "https://images.unsplash.com/photo-1544428571-cee682582e2e?w=400"},
    {"name": "Philips Hue Starter Kit", "category": "Smart Home", "retail_price": 189.00, "image_url": "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400"},
    {"name": "Ring Video Doorbell Pro 2", "category": "Smart Home", "retail_price": 269.00, "image_url": "https://images.unsplash.com/photo-1558002038-1055907df827?w=400"},
    {"name": "Dyson Pure Cool TP07", "category": "Smart Home", "retail_price": 549.00, "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400"},
    {"name": "iRobot Roomba j9+", "category": "Smart Home", "retail_price": 899.00, "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"},
    {"name": "Arlo Pro 5S 2K Kamera", "category": "Smart Home", "retail_price": 249.00, "image_url": "https://images.unsplash.com/photo-1558002038-bb0237bb4468?w=400"},
    {"name": "Ecobee Smart Thermostat", "category": "Smart Home", "retail_price": 219.00, "image_url": "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=400"},
    {"name": "Nanoleaf Shapes Hexagons", "category": "Smart Home", "retail_price": 199.00, "image_url": "https://images.unsplash.com/photo-1633264859825-19b2b77e4b0c?w=400"},
    
    # Kameras (10)
    {"name": "Sony Alpha 7 IV", "category": "Kameras", "retail_price": 2499.00, "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400"},
    {"name": "Canon EOS R6 Mark II", "category": "Kameras", "retail_price": 2799.00, "image_url": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400"},
    {"name": "Nikon Z8", "category": "Kameras", "retail_price": 3999.00, "image_url": "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400"},
    {"name": "Fujifilm X-T5", "category": "Kameras", "retail_price": 1699.00, "image_url": "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400"},
    {"name": "GoPro HERO 12 Black", "category": "Kameras", "retail_price": 449.00, "image_url": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400"},
    {"name": "DJI Osmo Pocket 3", "category": "Kameras", "retail_price": 519.00, "image_url": "https://images.unsplash.com/photo-1589824783253-a8a88c44a042?w=400"},
    {"name": "Panasonic Lumix GH6", "category": "Kameras", "retail_price": 1999.00, "image_url": "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=400"},
    {"name": "Leica Q3", "category": "Kameras", "retail_price": 5995.00, "image_url": "https://images.unsplash.com/photo-1606986628253-e3a5c5f24dd7?w=400"},
    {"name": "Insta360 X4", "category": "Kameras", "retail_price": 499.00, "image_url": "https://images.unsplash.com/photo-1542751371-9533dcff6ed3?w=400"},
    {"name": "Sony ZV-E1 Vlogging", "category": "Kameras", "retail_price": 2199.00, "image_url": "https://images.unsplash.com/photo-1613274554329-70f997f5789f?w=400"},
    
    # TVs (10)
    {"name": "LG OLED C3 65\"", "category": "TVs", "retail_price": 1799.00, "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"},
    {"name": "Samsung QN90C Neo QLED 55\"", "category": "TVs", "retail_price": 1499.00, "image_url": "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400"},
    {"name": "Sony Bravia XR A95L 65\"", "category": "TVs", "retail_price": 2999.00, "image_url": "https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=400"},
    {"name": "TCL 6-Series 75\"", "category": "TVs", "retail_price": 1099.00, "image_url": "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=400"},
    {"name": "Hisense U8K 65\"", "category": "TVs", "retail_price": 1199.00, "image_url": "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400"},
    {"name": "Philips Ambilight 55\" OLED", "category": "TVs", "retail_price": 1599.00, "image_url": "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400"},
    {"name": "Vizio P-Series 75\"", "category": "TVs", "retail_price": 1299.00, "image_url": "https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=400"},
    {"name": "Samsung The Frame 55\"", "category": "TVs", "retail_price": 1499.00, "image_url": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400"},
    {"name": "LG G3 Gallery 77\" OLED", "category": "TVs", "retail_price": 3499.00, "image_url": "https://images.unsplash.com/photo-1547119957-637f8679db1e?w=400"},
    {"name": "Sony X90L 50\" 4K", "category": "TVs", "retail_price": 999.00, "image_url": "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400"},
    
    # Uhren (10)
    {"name": "Apple Watch Ultra 2", "category": "Uhren", "retail_price": 899.00, "image_url": "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400"},
    {"name": "Samsung Galaxy Watch 6 Classic", "category": "Uhren", "retail_price": 399.00, "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"},
    {"name": "Garmin Fenix 8", "category": "Uhren", "retail_price": 999.00, "image_url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400"},
    {"name": "TAG Heuer Connected", "category": "Uhren", "retail_price": 1799.00, "image_url": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400"},
    {"name": "Fitbit Sense 2", "category": "Uhren", "retail_price": 299.00, "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400"},
    {"name": "Withings ScanWatch 2", "category": "Uhren", "retail_price": 349.00, "image_url": "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400"},
    {"name": "Amazfit GTR 4", "category": "Uhren", "retail_price": 199.00, "image_url": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400"},
    {"name": "Polar Vantage V3", "category": "Uhren", "retail_price": 599.00, "image_url": "https://images.unsplash.com/photo-1558126319-c9feecbf57ee?w=400"},
    {"name": "Suunto 9 Peak Pro", "category": "Uhren", "retail_price": 549.00, "image_url": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400"},
    {"name": "Oura Ring Gen 3", "category": "Uhren", "retail_price": 349.00, "image_url": "https://images.unsplash.com/photo-1585442245477-e31f6bdf3a97?w=400"},
    
    # Tablets (10)
    {"name": "iPad Pro 12.9\" M2", "category": "Tablets", "retail_price": 1449.00, "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"},
    {"name": "Samsung Galaxy Tab S9 Ultra", "category": "Tablets", "retail_price": 1199.00, "image_url": "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400"},
    {"name": "Microsoft Surface Pro 9", "category": "Tablets", "retail_price": 1599.00, "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400"},
    {"name": "Lenovo Tab P12 Pro", "category": "Tablets", "retail_price": 699.00, "image_url": "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400"},
    {"name": "iPad Air 5. Gen M1", "category": "Tablets", "retail_price": 769.00, "image_url": "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=400"},
    {"name": "OnePlus Pad", "category": "Tablets", "retail_price": 479.00, "image_url": "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400"},
    {"name": "Xiaomi Pad 6 Pro", "category": "Tablets", "retail_price": 449.00, "image_url": "https://images.unsplash.com/photo-1623126908029-58cb08a2b272?w=400"},
    {"name": "Amazon Fire Max 11", "category": "Tablets", "retail_price": 279.00, "image_url": "https://images.unsplash.com/photo-1632882765546-1ee75f53becb?w=400"},
    {"name": "reMarkable 2 E-Ink", "category": "Tablets", "retail_price": 449.00, "image_url": "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400"},
    {"name": "Huawei MatePad Pro 12.6", "category": "Tablets", "retail_price": 799.00, "image_url": "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=400"},
    
    # Drohnen & Zubehör (10)
    {"name": "DJI Mavic 3 Pro", "category": "Drohnen", "retail_price": 2199.00, "image_url": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400"},
    {"name": "DJI Mini 4 Pro", "category": "Drohnen", "retail_price": 999.00, "image_url": "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=400"},
    {"name": "DJI Air 3", "category": "Drohnen", "retail_price": 1099.00, "image_url": "https://images.unsplash.com/photo-1508614999368-9260051292e5?w=400"},
    {"name": "Autel EVO Lite+", "category": "Drohnen", "retail_price": 1149.00, "image_url": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=400"},
    {"name": "Skydio 2+ Starter Kit", "category": "Drohnen", "retail_price": 1099.00, "image_url": "https://images.unsplash.com/photo-1504548840739-580b10ae7715?w=400"},
    {"name": "DJI FPV Combo", "category": "Drohnen", "retail_price": 1299.00, "image_url": "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?w=400"},
    {"name": "Parrot Anafi Ai", "category": "Drohnen", "retail_price": 1899.00, "image_url": "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=400"},
    {"name": "DJI Avata Pro-View", "category": "Drohnen", "retail_price": 1388.00, "image_url": "https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400"},
    {"name": "PowerVision PowerEgg X", "category": "Drohnen", "retail_price": 899.00, "image_url": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400"},
    {"name": "Hubsan Zino Mini Pro", "category": "Drohnen", "retail_price": 449.00, "image_url": "https://images.unsplash.com/photo-1506947411487-a56738267384?w=400"},
]

async def main():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    products_added = 0
    auctions_added = 0
    
    print("🚀 Starte Erstellung von 100 neuen Auktionen...")
    
    for product_data in NEW_PRODUCTS:
        # Create product
        product_id = str(uuid.uuid4())
        product = {
            "id": product_id,
            "name": product_data["name"],
            "description": f"{product_data['name']} - Premium-Qualität, originalverpackt mit Herstellergarantie.",
            "image_url": product_data["image_url"],
            "retail_price": product_data["retail_price"],
            "category": product_data["category"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if product already exists
        existing = await db.products.find_one({"name": product_data["name"]})
        if existing:
            product_id = existing["id"]
            print(f"  ⚡ Produkt existiert: {product_data['name']}")
        else:
            await db.products.insert_one(product)
            products_added += 1
            print(f"  ✅ Produkt erstellt: {product_data['name']}")
        
        # Create auction for this product
        auction_id = str(uuid.uuid4())
        
        # Random duration between 5-60 minutes
        duration_minutes = random.randint(5, 60)
        start_time = datetime.now(timezone.utc)
        end_time = start_time + timedelta(minutes=duration_minutes)
        
        # Random starting price between 0.01 and 0.10
        starting_price = round(random.uniform(0.01, 0.10), 2)
        
        # Random bot target price (30-70% of retail)
        bot_target = round(product_data["retail_price"] * random.uniform(0.01, 0.05), 2)
        
        auction = {
            "id": auction_id,
            "product_id": product_id,
            "starting_price": starting_price,
            "current_price": starting_price,
            "bid_increment": 0.01,
            "duration_seconds": duration_minutes * 60,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "status": "active",
            "last_bidder_id": None,
            "last_bidder_name": None,
            "winner_id": None,
            "total_bids": 0,
            "bot_target_price": bot_target,
            "is_featured": False,
            "is_vip_only": False,
            "is_beginner_only": False,
            "is_free_auction": False,
            "is_night_auction": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.auctions.insert_one(auction)
        auctions_added += 1
    
    print(f"\n✨ Fertig!")
    print(f"   📦 {products_added} neue Produkte erstellt")
    print(f"   🎯 {auctions_added} neue Auktionen erstellt")
    
    # Get total counts
    total_products = await db.products.count_documents({})
    total_auctions = await db.auctions.count_documents({})
    active_auctions = await db.auctions.count_documents({"status": "active"})
    
    print(f"\n📊 Gesamt:")
    print(f"   Produkte: {total_products}")
    print(f"   Auktionen: {total_auctions}")
    print(f"   Aktive Auktionen: {active_auctions}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
