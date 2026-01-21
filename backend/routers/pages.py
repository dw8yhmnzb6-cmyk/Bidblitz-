"""Pages router - Manage editable page content"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel

from config import db, logger
from dependencies import get_admin_user

router = APIRouter(tags=["Pages"])

class PageContentUpdate(BaseModel):
    content: str
    title: Optional[str] = None

# Default content for pages - Dubai/UAE
DEFAULT_PAGES = {
    "impressum": {
        "title": "Impressum / Legal Notice",
        "content": """
<h2>Company Information</h2>
<p><strong>BidBlitz FZ-LLC</strong><br/>
Dubai Internet City<br/>
Building 1, Office 305<br/>
Dubai, United Arab Emirates</p>

<h3>Represented by:</h3>
<p>Managing Director</p>

<h3>Contact:</h3>
<p>Phone: +971 4 XXX XXXX<br/>
E-Mail: info@bidblitz.ae</p>

<h3>Trade License:</h3>
<p>Dubai Economic Department<br/>
License Number: XXXXX</p>

<h3>VAT Registration:</h3>
<p>VAT Registration Number (TRN): XXXXXXXXXXXXXXX</p>

<h3>Regulatory Authority:</h3>
<p>This platform operates under the laws of the United Arab Emirates and is subject to the regulations of the Dubai Department of Economy and Tourism (DET).</p>

<h3>Dispute Resolution</h3>
<p>Any disputes arising from the use of this platform shall be resolved in accordance with UAE Federal Law and the jurisdiction of Dubai Courts.</p>

<p><em>Diese Website wird aus Dubai, Vereinigte Arabische Emirate, betrieben.</em></p>
"""
    },
    "datenschutz": {
        "title": "Privacy Policy / Datenschutzerklärung",
        "content": """
<h2>1. Data Protection Overview</h2>

<h3>General Information</h3>
<p>The following information provides a simple overview of what happens to your personal data when you visit this website. Personal data is any data that can be used to personally identify you.</p>

<h3>Data Controller</h3>
<p><strong>BidBlitz FZ-LLC</strong><br/>
Dubai Internet City, Building 1, Office 305<br/>
Dubai, United Arab Emirates<br/>
E-Mail: privacy@bidblitz.ae</p>

<h3>Data Collection on this Website</h3>
<p><strong>Who is responsible for data collection?</strong><br/>
Data processing on this website is carried out by the website operator. Contact details can be found in the Legal Notice section.</p>

<h3>How do we collect your data?</h3>
<p>Your data is collected when you provide it to us, such as data entered in a contact form or during registration. Other data is automatically collected by our IT systems when you visit the website, primarily technical data (e.g., internet browser, operating system, time of page access).</p>

<h3>What do we use your data for?</h3>
<p>Some data is collected to ensure error-free provision of the website. Other data may be used to analyze your user behavior and improve our services.</p>

<h3>Your Rights</h3>
<p>You have the right to receive information about the origin, recipients, and purpose of your stored personal data free of charge at any time. You also have the right to request correction or deletion of this data in accordance with UAE Federal Decree-Law No. 45/2021 on Personal Data Protection.</p>

<h2>2. Hosting</h2>
<p>We host our website content with providers whose servers are located in secure data centers. Data processing is carried out to fulfill our contractual obligations to our customers.</p>

<h2>3. Data Protection in the UAE</h2>
<p>This platform complies with the UAE Federal Decree-Law No. 45/2021 on Personal Data Protection and related regulations. We are committed to protecting your personal data in accordance with UAE law.</p>

<h3>International Data Transfers</h3>
<p>If data is transferred outside the UAE, we ensure appropriate safeguards are in place as required by UAE data protection law.</p>

<p><em>Stand / Last Updated: January 2026</em></p>
"""
    },
    "agb": {
        "title": "Terms & Conditions / AGB",
        "content": """
<h2>§ 1 Scope of Application</h2>
<p>These General Terms and Conditions (GTC) apply to all business relationships between BidBlitz FZ-LLC (hereinafter "Provider") and the customer (hereinafter "User").</p>

<h2>§ 2 Subject of Contract</h2>
<p>The subject of this contract is participation in penny auctions on the BidBlitz platform. Penny auctions are auctions where each bid increases the price by a fixed amount (AED 0.04 / €0.01) and extends the auction time.</p>

<h2>§ 3 Registration</h2>
<p>(1) Use of the auction platform requires registration.<br/>
(2) By registering, the user confirms that they are at least 18 years old.<br/>
(3) The user is obligated to provide truthful information.</p>

<h2>§ 4 Bid Packages</h2>
<p>(1) Participation in auctions requires the purchase of bids.<br/>
(2) Bids can be purchased in various packages.<br/>
(3) Already purchased bids cannot be returned.</p>

<h2>§ 5 Auction Process</h2>
<p>(1) Each bid increases the auction price by AED 0.04 / €0.01.<br/>
(2) Each bid extends the auction duration.<br/>
(3) The user who placed the last bid when the auction time expires wins the auction.</p>

<h2>§ 6 Payment</h2>
<p>(1) Payment is made via the offered payment methods.<br/>
(2) The auction winner is obligated to pay the final price plus shipping costs.<br/>
(3) All prices include applicable VAT where required.</p>

<h2>§ 7 Liability</h2>
<p>The Provider is liable without limitation for intent and gross negligence. For slight negligence, the Provider is only liable in case of breach of essential contractual obligations.</p>

<h2>§ 8 Governing Law</h2>
<p>(1) The laws of the United Arab Emirates shall apply.<br/>
(2) The exclusive jurisdiction for all disputes is Dubai, UAE.<br/>
(3) Consumers may also invoke the consumer protection laws of their country of residence.</p>

<h2>§ 9 Online Dispute Resolution</h2>
<p>For customers in the European Union, the European Commission provides an online dispute resolution platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank">https://ec.europa.eu/consumers/odr</a></p>

<p><em>BidBlitz FZ-LLC • Dubai, UAE • Stand / Last Updated: January 2026</em></p>
"""
    },
    "faq": {
        "title": "Häufig gestellte Fragen / FAQ",
        "content": ""
    },
    "contact": {
        "title": "Kontakt / Contact",
        "content": ""
    },
    "how-it-works": {
        "title": "So funktioniert's / How It Works",
        "content": ""
    }
}

@router.get("/pages")
async def get_all_pages():
    """Get all editable pages"""
    pages = await db.pages.find({}, {"_id": 0}).to_list(100)
    
    # Merge with defaults
    result = []
    for page_id, default in DEFAULT_PAGES.items():
        existing = next((p for p in pages if p.get("page_id") == page_id), None)
        if existing:
            result.append(existing)
        else:
            result.append({
                "page_id": page_id,
                "title": default["title"],
                "content": default["content"],
                "is_default": True
            })
    
    return result

@router.get("/pages/{page_id}")
async def get_page(page_id: str):
    """Get a specific page content"""
    page = await db.pages.find_one({"page_id": page_id}, {"_id": 0})
    
    if page:
        return page
    
    # Return default if exists
    if page_id in DEFAULT_PAGES:
        return {
            "page_id": page_id,
            "title": DEFAULT_PAGES[page_id]["title"],
            "content": DEFAULT_PAGES[page_id]["content"],
            "is_default": True
        }
    
    raise HTTPException(status_code=404, detail="Seite nicht gefunden")

@router.put("/admin/pages/{page_id}")
async def update_page(page_id: str, data: PageContentUpdate, admin: dict = Depends(get_admin_user)):
    """Update page content (admin only)"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if page exists
    existing = await db.pages.find_one({"page_id": page_id})
    
    update_data = {
        "page_id": page_id,
        "title": data.title or DEFAULT_PAGES.get(page_id, {}).get("title", page_id.title()),
        "content": data.content,
        "updated_at": now,
        "updated_by": admin["id"]
    }
    
    if existing:
        await db.pages.update_one(
            {"page_id": page_id},
            {"$set": update_data}
        )
    else:
        update_data["created_at"] = now
        await db.pages.insert_one(update_data)
    
    logger.info(f"Page '{page_id}' updated by admin {admin['id']}")
    
    return {
        "message": f"Seite '{data.title or page_id}' erfolgreich aktualisiert",
        "page_id": page_id
    }

@router.post("/admin/pages/{page_id}/reset")
async def reset_page(page_id: str, admin: dict = Depends(get_admin_user)):
    """Reset page to default content (admin only)"""
    if page_id not in DEFAULT_PAGES:
        raise HTTPException(status_code=404, detail="Keine Standardvorlage für diese Seite")
    
    await db.pages.delete_one({"page_id": page_id})
    
    return {
        "message": f"Seite '{page_id}' auf Standard zurückgesetzt",
        "page_id": page_id
    }
