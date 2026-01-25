"""Pages router - Manage editable page content with multi-language support"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel

from config import db, logger
from dependencies import get_admin_user

router = APIRouter(tags=["Pages"])

class PageContentUpdate(BaseModel):
    content: str
    title: Optional[str] = None
    lang: Optional[str] = "de"

# Default content for pages - Dubai/UAE - BidBlitz FZCO - CEO: Afrim Krasniqi
# Multi-language support: de (German), en (English), and fallback
DEFAULT_PAGES = {
    "impressum": {
        "de": {
            "title": "Impressum",
            "content": """
<h2>Anbieter</h2>
<p><strong>BidBlitz FZCO</strong><br/>
Dubai Silicon Oasis<br/>
DDP, Building A1<br/>
Dubai, Vereinigte Arabische Emirate</p>

<h3>Geschäftsführung</h3>
<p><strong>Afrim Krasniqi</strong><br/>
Chief Executive Officer (CEO)</p>

<h3>Kontakt</h3>
<p>Telefon: +971 4 501 2345<br/>
E-Mail: info@bidblitz.ae</p>

<h3>Handelsregister</h3>
<p>Dubai Silicon Oasis Authority (DSOA)<br/>
Lizenz-Nr.: DSO-FZCO-12345</p>

<h3>Umsatzsteuer-ID</h3>
<p>VAT Registration Number (TRN): 100123456700003</p>

<h3>Aufsichtsbehörde</h3>
<p>Diese Plattform unterliegt den Gesetzen der Vereinigten Arabischen Emirate und den Vorschriften des Dubai Department of Economy and Tourism (DET).</p>

<h3>Verantwortlich für den Inhalt</h3>
<p><strong>Afrim Krasniqi</strong><br/>
BidBlitz FZCO<br/>
Dubai Silicon Oasis, DDP Building A1<br/>
Dubai, VAE</p>

<h3>Streitbeilegung</h3>
<p>Alle Streitigkeiten aus der Nutzung dieser Plattform werden nach UAE Federal Law und unter der Gerichtsbarkeit der Dubai Courts beigelegt.</p>

<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank">https://ec.europa.eu/consumers/odr</a></p>

<p><em>Diese Website wird aus Dubai, Vereinigte Arabische Emirate, betrieben.</em></p>
"""
        },
        "en": {
            "title": "Legal Notice",
            "content": """
<h2>Company Information</h2>
<p><strong>BidBlitz FZCO</strong><br/>
Dubai Silicon Oasis<br/>
DDP, Building A1<br/>
Dubai, United Arab Emirates</p>

<h3>Management</h3>
<p><strong>Afrim Krasniqi</strong><br/>
Chief Executive Officer (CEO)</p>

<h3>Contact</h3>
<p>Phone: +971 4 501 2345<br/>
Email: info@bidblitz.ae</p>

<h3>Trade License</h3>
<p>Dubai Silicon Oasis Authority (DSOA)<br/>
License No.: DSO-FZCO-12345</p>

<h3>VAT Registration</h3>
<p>VAT Registration Number (TRN): 100123456700003</p>

<h3>Regulatory Authority</h3>
<p>This platform is subject to the laws of the United Arab Emirates and the regulations of the Dubai Department of Economy and Tourism (DET).</p>

<h3>Responsible for Content</h3>
<p><strong>Afrim Krasniqi</strong><br/>
BidBlitz FZCO<br/>
Dubai Silicon Oasis, DDP Building A1<br/>
Dubai, UAE</p>

<h3>Dispute Resolution</h3>
<p>All disputes arising from the use of this platform will be settled under UAE Federal Law and the jurisdiction of the Dubai Courts.</p>

<p>The European Commission provides an online dispute resolution platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank">https://ec.europa.eu/consumers/odr</a></p>

<p><em>This website is operated from Dubai, United Arab Emirates.</em></p>
"""
        }
    },
    "datenschutz": {
        "de": {
            "title": "Datenschutzerklärung",
            "content": """
<h2>1. Verantwortlicher</h2>
<p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
<p><strong>BidBlitz FZCO</strong><br/>
Dubai Silicon Oasis, DDP Building A1<br/>
Dubai, Vereinigte Arabische Emirate<br/>
CEO: Afrim Krasniqi<br/>
E-Mail: datenschutz@bidblitz.ae</p>

<h2>2. Datenschutz auf einen Blick</h2>
<p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.</p>

<h3>Datenerfassung auf dieser Website</h3>
<p><strong>Wer ist verantwortlich?</strong><br/>
Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber BidBlitz FZCO, vertreten durch Geschäftsführer Afrim Krasniqi.</p>

<h3>Wie erfassen wir Ihre Daten?</h3>
<ul>
<li>Daten, die Sie uns mitteilen (z.B. bei Registrierung, Bestellung)</li>
<li>Automatisch erfasste technische Daten (z.B. IP-Adresse, Browser, Betriebssystem)</li>
<li>Daten durch Cookies und Analyse-Tools</li>
</ul>

<h2>3. Ihre Rechte</h2>
<p>Sie haben jederzeit das Recht auf:</p>
<ul>
<li><strong>Auskunft</strong> über Ihre gespeicherten Daten</li>
<li><strong>Berichtigung</strong> unrichtiger Daten</li>
<li><strong>Löschung</strong> Ihrer Daten</li>
<li><strong>Einschränkung</strong> der Verarbeitung</li>
<li><strong>Datenübertragbarkeit</strong></li>
<li><strong>Widerspruch</strong> gegen die Verarbeitung</li>
</ul>
<p>Zur Ausübung dieser Rechte kontaktieren Sie uns unter: datenschutz@bidblitz.ae</p>

<h2>4. Cookies</h2>
<p>Diese Website verwendet Cookies:</p>
<ul>
<li><strong>Notwendige Cookies:</strong> Für den Betrieb der Website</li>
<li><strong>Funktionale Cookies:</strong> Für bessere Nutzererfahrung</li>
<li><strong>Analyse-Cookies:</strong> Zur Verbesserung unserer Dienste</li>
</ul>

<h2>5. Datensicherheit</h2>
<p>Wir verwenden SSL/TLS-Verschlüsselung für die sichere Datenübertragung. Ihre Daten werden auf geschützten Servern gespeichert.</p>

<p><em>Stand: Januar 2026 | BidBlitz FZCO, Dubai, VAE | CEO: Afrim Krasniqi</em></p>
"""
        },
        "en": {
            "title": "Privacy Policy",
            "content": """
<h2>1. Data Controller</h2>
<p>The data controller responsible for data processing on this website is:</p>
<p><strong>BidBlitz FZCO</strong><br/>
Dubai Silicon Oasis, DDP Building A1<br/>
Dubai, United Arab Emirates<br/>
CEO: Afrim Krasniqi<br/>
Email: privacy@bidblitz.ae</p>

<h2>2. Privacy at a Glance</h2>
<p>The following information provides a simple overview of what happens to your personal data when you visit this website.</p>

<h3>Data Collection on this Website</h3>
<p><strong>Who is responsible?</strong><br/>
Data processing on this website is carried out by the website operator BidBlitz FZCO, represented by CEO Afrim Krasniqi.</p>

<h3>How do we collect your data?</h3>
<ul>
<li>Data you provide to us (e.g., during registration, orders)</li>
<li>Automatically collected technical data (e.g., IP address, browser, operating system)</li>
<li>Data through cookies and analytics tools</li>
</ul>

<h2>3. Your Rights</h2>
<p>You have the right to:</p>
<ul>
<li><strong>Access</strong> your stored data</li>
<li><strong>Rectification</strong> of incorrect data</li>
<li><strong>Erasure</strong> of your data</li>
<li><strong>Restriction</strong> of processing</li>
<li><strong>Data portability</strong></li>
<li><strong>Object</strong> to processing</li>
</ul>
<p>To exercise these rights, contact us at: privacy@bidblitz.ae</p>

<h2>4. Cookies</h2>
<p>This website uses cookies:</p>
<ul>
<li><strong>Necessary Cookies:</strong> For website operation</li>
<li><strong>Functional Cookies:</strong> For better user experience</li>
<li><strong>Analytics Cookies:</strong> To improve our services</li>
</ul>

<h2>5. Data Security</h2>
<p>We use SSL/TLS encryption for secure data transmission. Your data is stored on protected servers.</p>

<p><em>Last updated: January 2026 | BidBlitz FZCO, Dubai, UAE | CEO: Afrim Krasniqi</em></p>
"""
        }
    },
    "agb": {
        "de": {
            "title": "Allgemeine Geschäftsbedingungen (AGB)",
            "content": """
<h2>§ 1 Geltungsbereich</h2>
<p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle über die Plattform BidBlitz geschlossenen Verträge zwischen dem Anbieter und dem Kunden.</p>
<p><strong>Anbieter:</strong><br/>
BidBlitz FZCO<br/>
Dubai Silicon Oasis, DDP Building A1<br/>
Dubai, Vereinigte Arabische Emirate<br/>
CEO: Afrim Krasniqi</p>

<h2>§ 2 Vertragsgegenstand</h2>
<p>BidBlitz betreibt eine Penny-Auktion-Plattform, bei der registrierte Nutzer auf Produkte bieten können. Jedes Gebot erhöht den Preis um einen Cent (0,01 €) und verlängert die Auktionszeit.</p>

<h2>§ 3 Registrierung und Nutzerkonto</h2>
<ul>
<li>Die Nutzung der Plattform erfordert eine Registrierung.</li>
<li>Nutzer müssen mindestens 18 Jahre alt sein.</li>
<li>Die angegebenen Daten müssen wahrheitsgemäß und vollständig sein.</li>
<li>Jeder Nutzer darf nur ein Konto führen.</li>
</ul>

<h2>§ 4 Gebote und Gebotspaket</h2>
<ul>
<li>Gebote werden in Paketen erworben und sind kostenpflichtig.</li>
<li>Einmal erworbene Gebote können nicht zurückgegeben werden.</li>
<li>Pro Gebotsabgabe wird ein Gebot vom Nutzerkonto abgezogen.</li>
</ul>

<h2>§ 5 Auktionsablauf</h2>
<ul>
<li>Jedes Gebot erhöht den Auktionspreis um 0,01 €.</li>
<li>Jedes Gebot setzt den Countdown zurück (8-15 Sekunden).</li>
<li>Der Nutzer, dessen Gebot bei Ablauf des Countdowns aktiv ist, gewinnt.</li>
</ul>

<h2>§ 6 Preise und Zahlung</h2>
<ul>
<li>Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.</li>
<li>Zahlungen erfolgen per Kreditkarte, PayPal oder anderen Zahlungsmethoden.</li>
</ul>

<h2>§ 7 Anwendbares Recht</h2>
<p>Es gilt das Recht der Vereinigten Arabischen Emirate. Gerichtsstand ist Dubai, VAE.</p>

<p><em>Stand: Januar 2026 | BidBlitz FZCO, Dubai, VAE | CEO: Afrim Krasniqi</em></p>
"""
        },
        "en": {
            "title": "Terms and Conditions",
            "content": """
<h2>§ 1 Scope</h2>
<p>These Terms and Conditions apply to all contracts concluded between the provider and the customer via the BidBlitz platform.</p>
<p><strong>Provider:</strong><br/>
BidBlitz FZCO<br/>
Dubai Silicon Oasis, DDP Building A1<br/>
Dubai, United Arab Emirates<br/>
CEO: Afrim Krasniqi</p>

<h2>§ 2 Subject of Contract</h2>
<p>BidBlitz operates a penny auction platform where registered users can bid on products. Each bid increases the price by one cent (€0.01) and extends the auction time.</p>

<h2>§ 3 Registration and User Account</h2>
<ul>
<li>Use of the platform requires registration.</li>
<li>Users must be at least 18 years old.</li>
<li>The provided data must be truthful and complete.</li>
<li>Each user may only have one account.</li>
</ul>

<h2>§ 4 Bids and Bid Packages</h2>
<ul>
<li>Bids are purchased in packages and are chargeable.</li>
<li>Once purchased, bids cannot be returned.</li>
<li>One bid is deducted from the user account per bid placed.</li>
</ul>

<h2>§ 5 Auction Process</h2>
<ul>
<li>Each bid increases the auction price by €0.01.</li>
<li>Each bid resets the countdown (8-15 seconds).</li>
<li>The user whose bid is active when the countdown expires wins.</li>
</ul>

<h2>§ 6 Prices and Payment</h2>
<ul>
<li>All prices include applicable VAT.</li>
<li>Payments are made via credit card, PayPal, or other payment methods.</li>
</ul>

<h2>§ 7 Applicable Law</h2>
<p>The laws of the United Arab Emirates apply. Place of jurisdiction is Dubai, UAE.</p>

<p><em>Last updated: January 2026 | BidBlitz FZCO, Dubai, UAE | CEO: Afrim Krasniqi</em></p>
"""
        }
    },
    "faq": {
        "de": {"title": "Häufig gestellte Fragen", "content": ""},
        "en": {"title": "Frequently Asked Questions", "content": ""}
    },
    "contact": {
        "de": {"title": "Kontakt", "content": ""},
        "en": {"title": "Contact", "content": ""}
    },
    "how-it-works": {
        "de": {"title": "So funktioniert's", "content": ""},
        "en": {"title": "How It Works", "content": ""}
    }
}

def get_page_content(page_id: str, lang: str = "de"):
    """Get page content for specific language with fallback"""
    if page_id not in DEFAULT_PAGES:
        return None
    
    page_data = DEFAULT_PAGES[page_id]
    
    # Try requested language, then German, then English
    if lang in page_data:
        return page_data[lang]
    elif "de" in page_data:
        return page_data["de"]
    elif "en" in page_data:
        return page_data["en"]
    
    return None

@router.get("/pages")
async def get_all_pages(lang: str = Query(default="de")):
    """Get all editable pages for a specific language"""
    pages = await db.pages.find({}, {"_id": 0}).to_list(100)
    
    result = []
    for page_id in DEFAULT_PAGES.keys():
        # Check for language-specific content in DB
        existing = next((p for p in pages if p.get("page_id") == page_id and p.get("lang") == lang), None)
        
        if existing:
            result.append(existing)
        else:
            # Fall back to default content
            default_content = get_page_content(page_id, lang)
            if default_content:
                result.append({
                    "page_id": page_id,
                    "title": default_content["title"],
                    "content": default_content["content"],
                    "lang": lang,
                    "is_default": True
                })
    
    return result

@router.get("/pages/{page_id}")
async def get_page(page_id: str, lang: str = Query(default="de")):
    """Get a specific page content for a language"""
    # First check database for custom content
    page = await db.pages.find_one({"page_id": page_id, "lang": lang}, {"_id": 0})
    
    if page:
        return page
    
    # Fall back to default content
    default_content = get_page_content(page_id, lang)
    if default_content:
        return {
            "page_id": page_id,
            "title": default_content["title"],
            "content": default_content["content"],
            "lang": lang,
            "is_default": True
        }
    
    raise HTTPException(status_code=404, detail="Seite nicht gefunden / Page not found")

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
