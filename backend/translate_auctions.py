"""
Auction Product Translation Script
Translates product descriptions embedded in auctions
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "bidblitz")
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-8AbDaF677837231285")

TARGET_LANGUAGES = {
    "en": "English",
    "sq": "Albanian", 
    "tr": "Turkish",
    "fr": "French",
    "es": "Spanish",
    "ar": "Arabic",
    "it": "Italian",
    "pt": "Portuguese",
    "nl": "Dutch",
    "pl": "Polish"
}

async def translate_text(text: str, target_lang: str, target_lang_name: str) -> str:
    if not text or not text.strip():
        return text
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"translate-auction-{target_lang}",
        system_message=f"""You are a professional translator. Translate the given German text to {target_lang_name}.
Rules:
- Keep product names (brands, model numbers) unchanged
- Keep emojis unchanged
- Only return the translated text, nothing else
- Keep the same tone and style"""
    ).with_model("openai", "gpt-4o")
    
    user_message = UserMessage(text=f"Translate to {target_lang_name}: {text}")
    
    try:
        response = await chat.send_message(user_message)
        return response.strip()
    except Exception as e:
        print(f"  ⚠️ Translation error: {e}")
        return text

async def main():
    print("🌍 Starting Auction Product Translation")
    print(f"📊 Target languages: {', '.join(TARGET_LANGUAGES.values())}")
    print("-" * 50)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get auctions with products that don't have translations
    auctions = await db.auctions.find(
        {"product": {"$exists": True}},
        {"_id": 0, "id": 1, "product": 1}
    ).to_list(500)
    
    print(f"\n📦 Found {len(auctions)} auctions to check")
    
    translated_count = 0
    
    for i, auction in enumerate(auctions, 1):
        auction_id = auction.get("id")
        product = auction.get("product", {})
        
        if not product:
            continue
        
        name = product.get("name", "")
        description = product.get("description", "")
        
        # Skip if already has translations
        if product.get("name_translations") and len(product.get("name_translations", {})) >= 5:
            continue
        
        print(f"\n[{i}/{len(auctions)}] {name[:40]}...")
        
        name_translations = product.get("name_translations", {}) or {}
        description_translations = product.get("description_translations", {}) or {}
        
        name_translations["de"] = name
        if description:
            description_translations["de"] = description
        
        for lang_code, lang_name in TARGET_LANGUAGES.items():
            if lang_code in name_translations and name_translations[lang_code]:
                continue
            
            print(f"  → {lang_name}...")
            
            if name:
                name_translations[lang_code] = await translate_text(name, lang_code, lang_name)
            
            if description:
                description_translations[lang_code] = await translate_text(description, lang_code, lang_name)
            
            await asyncio.sleep(0.3)
        
        # Update auction
        await db.auctions.update_one(
            {"id": auction_id},
            {"$set": {
                "product.name_translations": name_translations,
                "product.description_translations": description_translations
            }}
        )
        
        translated_count += 1
        print(f"  ✅ Updated")
    
    print("\n" + "=" * 50)
    print(f"✅ Complete! Translated {translated_count} auction products")
    print("=" * 50)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
