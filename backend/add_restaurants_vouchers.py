"""
Script to add Restaurant and Voucher products and auctions
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

# Restaurant products with translations
RESTAURANT_PRODUCTS = [
    {
        "id": "rest-dubai-marina",
        "name": "Dubai Marina Dinner für 2",
        "category": "Restaurants",
        "retail_price": 250,
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
        "description": "Romantisches 5-Gänge-Dinner für 2 Personen im Dubai Marina",
        "name_translations": {
            "de": "Dubai Marina Dinner für 2",
            "en": "Dubai Marina Dinner for 2",
            "sq": "Darkë Dubai Marina për 2",
            "tr": "Dubai Marina 2 Kişilik Akşam Yemeği",
            "fr": "Dîner Dubai Marina pour 2",
            "ar": "عشاء دبي مارينا لشخصين"
        },
        "description_translations": {
            "de": "Romantisches 5-Gänge-Dinner für 2 Personen im Dubai Marina",
            "en": "Romantic 5-course dinner for 2 at Dubai Marina",
            "sq": "Darkë romantike 5-pjatë për 2 persona në Dubai Marina",
            "tr": "Dubai Marina'da 2 kişilik romantik 5 çeşit akşam yemeği",
            "fr": "Dîner romantique 5 plats pour 2 à Dubai Marina",
            "ar": "عشاء رومانسي من 5 أطباق لشخصين في دبي مارينا"
        }
    },
    {
        "id": "rest-burj-khalifa",
        "name": "At.mosphere Burj Khalifa Dinner",
        "category": "Restaurants",
        "retail_price": 500,
        "image_url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
        "description": "Exklusives Dinner im höchsten Restaurant der Welt - At.mosphere im Burj Khalifa",
        "name_translations": {
            "de": "At.mosphere Burj Khalifa Dinner",
            "en": "At.mosphere Burj Khalifa Dinner",
            "sq": "Darkë At.mosphere Burj Khalifa",
            "tr": "At.mosphere Burj Khalifa Akşam Yemeği",
            "fr": "Dîner At.mosphere Burj Khalifa",
            "ar": "عشاء أتموسفير برج خليفة"
        },
        "description_translations": {
            "de": "Exklusives Dinner im höchsten Restaurant der Welt - At.mosphere im Burj Khalifa",
            "en": "Exclusive dinner at the world's highest restaurant - At.mosphere in Burj Khalifa",
            "sq": "Darkë ekskluzive në restorantin më të lartë në botë - At.mosphere në Burj Khalifa",
            "tr": "Dünyanın en yüksek restoranında özel akşam yemeği - Burj Khalifa'da At.mosphere",
            "fr": "Dîner exclusif dans le restaurant le plus haut du monde - At.mosphere au Burj Khalifa",
            "ar": "عشاء حصري في أعلى مطعم في العالم - أتموسفير في برج خليفة"
        }
    },
    {
        "id": "rest-palm-jumeirah",
        "name": "Palm Jumeirah Beach Club",
        "category": "Restaurants",
        "retail_price": 350,
        "image_url": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400",
        "description": "Tagespass + Dinner für 2 im exklusiven Beach Club auf Palm Jumeirah",
        "name_translations": {
            "de": "Palm Jumeirah Beach Club",
            "en": "Palm Jumeirah Beach Club",
            "sq": "Palm Jumeirah Beach Club",
            "tr": "Palm Jumeirah Beach Club",
            "fr": "Palm Jumeirah Beach Club",
            "ar": "نادي شاطئ نخلة جميرا"
        },
        "description_translations": {
            "de": "Tagespass + Dinner für 2 im exklusiven Beach Club auf Palm Jumeirah",
            "en": "Day pass + dinner for 2 at exclusive Beach Club on Palm Jumeirah",
            "sq": "Biletë ditore + darkë për 2 në Beach Club ekskluziv në Palm Jumeirah",
            "tr": "Palm Jumeirah'daki özel Beach Club'da 2 kişilik günlük geçiş + akşam yemeği",
            "fr": "Pass journée + dîner pour 2 au Beach Club exclusif de Palm Jumeirah",
            "ar": "تذكرة يومية + عشاء لشخصين في نادي الشاطئ الحصري في نخلة جميرا"
        }
    },
    {
        "id": "rest-arabian-nights",
        "name": "Arabian Nights Desert Safari + Dinner",
        "category": "Restaurants",
        "retail_price": 400,
        "image_url": "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=400",
        "description": "Wüstensafari mit traditionellem arabischem BBQ-Dinner unter den Sternen",
        "name_translations": {
            "de": "Arabian Nights Desert Safari + Dinner",
            "en": "Arabian Nights Desert Safari + Dinner",
            "sq": "Arabian Nights Desert Safari + Darkë",
            "tr": "Arabian Nights Çöl Safarisi + Akşam Yemeği",
            "fr": "Arabian Nights Safari Désert + Dîner",
            "ar": "ليالي عربية سفاري صحراوي + عشاء"
        },
        "description_translations": {
            "de": "Wüstensafari mit traditionellem arabischem BBQ-Dinner unter den Sternen",
            "en": "Desert safari with traditional Arabian BBQ dinner under the stars",
            "sq": "Safari shkretëtire me darkë tradicionale arabe BBQ nën yje",
            "tr": "Yıldızların altında geleneksel Arap BBQ yemeği ile çöl safarisi",
            "fr": "Safari dans le désert avec dîner BBQ arabe traditionnel sous les étoiles",
            "ar": "سفاري صحراوي مع عشاء شواء عربي تقليدي تحت النجوم"
        }
    },
    {
        "id": "rest-brunch-atlantis",
        "name": "Atlantis The Palm Brunch für 2",
        "category": "Restaurants",
        "retail_price": 300,
        "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
        "description": "Premium Friday Brunch für 2 im legendären Atlantis The Palm",
        "name_translations": {
            "de": "Atlantis The Palm Brunch für 2",
            "en": "Atlantis The Palm Brunch for 2",
            "sq": "Atlantis The Palm Brunch për 2",
            "tr": "Atlantis The Palm 2 Kişilik Brunch",
            "fr": "Brunch Atlantis The Palm pour 2",
            "ar": "برانش أتلانتس النخلة لشخصين"
        },
        "description_translations": {
            "de": "Premium Friday Brunch für 2 im legendären Atlantis The Palm",
            "en": "Premium Friday Brunch for 2 at the legendary Atlantis The Palm",
            "sq": "Premium Friday Brunch për 2 në legjendarin Atlantis The Palm",
            "tr": "Efsanevi Atlantis The Palm'da 2 kişilik Premium Cuma Brunchı",
            "fr": "Brunch Premium du vendredi pour 2 au légendaire Atlantis The Palm",
            "ar": "برانش الجمعة المميز لشخصين في أتلانتس النخلة الأسطوري"
        }
    }
]

# Additional voucher products
VOUCHER_PRODUCTS = [
    {
        "id": "vouch-amazon-100",
        "name": "Amazon Gutschein €100",
        "category": "Gutscheine",
        "retail_price": 100,
        "image_url": "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400",
        "description": "Amazon.ae Geschenkgutschein im Wert von €100",
        "name_translations": {
            "de": "Amazon Gutschein €100",
            "en": "Amazon Gift Card €100",
            "sq": "Kartë Dhuratë Amazon €100",
            "tr": "Amazon Hediye Kartı €100",
            "fr": "Carte Cadeau Amazon €100",
            "ar": "بطاقة هدايا أمازون 100 يورو"
        }
    },
    {
        "id": "vouch-noon-200",
        "name": "Noon.com Gutschein €200",
        "category": "Gutscheine",
        "retail_price": 200,
        "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
        "description": "Noon.com Geschenkgutschein im Wert von €200",
        "name_translations": {
            "de": "Noon.com Gutschein €200",
            "en": "Noon.com Gift Card €200",
            "sq": "Kartë Dhuratë Noon.com €200",
            "tr": "Noon.com Hediye Kartı €200",
            "fr": "Carte Cadeau Noon.com €200",
            "ar": "بطاقة هدايا نون 200 يورو"
        }
    },
    {
        "id": "vouch-apple-150",
        "name": "Apple Store Gutschein €150",
        "category": "Gutscheine",
        "retail_price": 150,
        "image_url": "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=400",
        "description": "Apple Store Geschenkgutschein im Wert von €150",
        "name_translations": {
            "de": "Apple Store Gutschein €150",
            "en": "Apple Store Gift Card €150",
            "sq": "Kartë Dhuratë Apple Store €150",
            "tr": "Apple Store Hediye Kartı €150",
            "fr": "Carte Cadeau Apple Store €150",
            "ar": "بطاقة هدايا متجر آبل 150 يورو"
        }
    },
    {
        "id": "vouch-dubai-mall-300",
        "name": "Dubai Mall Gutschein €300",
        "category": "Gutscheine",
        "retail_price": 300,
        "image_url": "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400",
        "description": "Dubai Mall Einkaufsgutschein im Wert von €300",
        "name_translations": {
            "de": "Dubai Mall Gutschein €300",
            "en": "Dubai Mall Gift Card €300",
            "sq": "Kartë Dhuratë Dubai Mall €300",
            "tr": "Dubai Mall Hediye Kartı €300",
            "fr": "Carte Cadeau Dubai Mall €300",
            "ar": "بطاقة هدايا دبي مول 300 يورو"
        }
    },
    {
        "id": "vouch-spa-wellness-250",
        "name": "Spa & Wellness Gutschein €250",
        "category": "Gutscheine",
        "retail_price": 250,
        "image_url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400",
        "description": "Premium Spa & Wellness Gutschein für führende Hotels in Dubai",
        "name_translations": {
            "de": "Spa & Wellness Gutschein €250",
            "en": "Spa & Wellness Gift Card €250",
            "sq": "Kartë Dhuratë Spa & Wellness €250",
            "tr": "Spa & Wellness Hediye Kartı €250",
            "fr": "Carte Cadeau Spa & Wellness €250",
            "ar": "بطاقة هدايا سبا وعافية 250 يورو"
        }
    }
]

async def add_products_and_auctions():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=" * 60)
    print("ADDING RESTAURANT & VOUCHER AUCTIONS")
    print("=" * 60)
    
    now = datetime.now(timezone.utc)
    
    # 1. Add Restaurant products
    print("\n1. Adding Restaurant products...")
    for product in RESTAURANT_PRODUCTS:
        product["created_at"] = now.isoformat()
        await db.products.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
        print(f"   ✓ {product['name']}")
    
    # 2. Add Voucher products
    print("\n2. Adding Voucher products...")
    for product in VOUCHER_PRODUCTS:
        product["created_at"] = now.isoformat()
        await db.products.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
        print(f"   ✓ {product['name']}")
    
    # 3. Create auctions for these products
    print("\n3. Creating auctions...")
    
    all_new_products = RESTAURANT_PRODUCTS + VOUCHER_PRODUCTS
    
    for product in all_new_products:
        # Random end time between 2-3 days
        hours = random.randint(48, 72)
        mins = random.randint(0, 59)
        end_time = now + timedelta(hours=hours, minutes=mins)
        
        auction = {
            "id": str(uuid.uuid4()),
            "product_id": product["id"],
            "start_price": 0.0,
            "current_price": round(random.uniform(0.10, 0.80), 2),
            "price_increment": 0.01,
            "time_increment": 10,
            "status": "active",
            "start_time": now.isoformat(),
            "end_time": end_time.isoformat(),
            "total_bids": random.randint(5, 25),
            "unique_bidders": random.randint(2, 8),
            "winner_id": None,
            "final_price": None,
            "last_bidder_id": None,
            "last_bidder_name": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "auto_restart": False,
            "is_beginner_only": False,
            "is_night_auction": False,
            "is_vip_only": False,
            # Mark restaurant and voucher categories
            "is_restaurant": product["category"] == "Restaurants",
            "is_voucher": product["category"] == "Gutscheine"
        }
        
        await db.auctions.insert_one(auction)
        cat_icon = "🍽️" if product["category"] == "Restaurants" else "🎫"
        print(f"   {cat_icon} {product['name'][:40]:<40} -> {end_time.strftime('%d.%m. %H:%M')}")
    
    # 4. Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    restaurant_count = await db.auctions.count_documents({"is_restaurant": True, "status": "active"})
    voucher_count = await db.products.count_documents({"category": "Gutscheine"})
    total_active = await db.auctions.count_documents({"status": "active"})
    
    print(f"Restaurant Auctions: {restaurant_count}")
    print(f"Voucher Products: {voucher_count}")
    print(f"Total Active Auctions: {total_active}")
    
    print("\n✅ Done!")
    client.close()

if __name__ == "__main__":
    asyncio.run(add_products_and_auctions())
