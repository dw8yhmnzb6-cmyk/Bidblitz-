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

# Default content for pages
DEFAULT_PAGES = {
    "impressum": {
        "title": "Impressum",
        "content": """
<h2>Angaben gemäß § 5 TMG</h2>
<p><strong>BidBlitz GmbH</strong><br/>
Musterstraße 123<br/>
12345 Musterstadt<br/>
Deutschland</p>

<h3>Vertreten durch:</h3>
<p>Max Mustermann (Geschäftsführer)</p>

<h3>Kontakt:</h3>
<p>Telefon: +49 (0) 123 456789<br/>
E-Mail: info@bidblitz.de</p>

<h3>Registereintrag:</h3>
<p>Eintragung im Handelsregister.<br/>
Registergericht: Amtsgericht Musterstadt<br/>
Registernummer: HRB 12345</p>

<h3>Umsatzsteuer-ID:</h3>
<p>Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br/>
DE 123456789</p>

<h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h3>
<p>Max Mustermann<br/>
Musterstraße 123<br/>
12345 Musterstadt</p>

<h3>Streitschlichtung</h3>
<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
<a href="https://ec.europa.eu/consumers/odr" target="_blank">https://ec.europa.eu/consumers/odr</a>.<br/>
Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
"""
    },
    "datenschutz": {
        "title": "Datenschutzerklärung",
        "content": """
<h2>1. Datenschutz auf einen Blick</h2>

<h3>Allgemeine Hinweise</h3>
<p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>

<h3>Datenerfassung auf dieser Website</h3>
<p><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br/>
Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</p>

<h3>Wie erfassen wir Ihre Daten?</h3>
<p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p>
<p>Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</p>

<h3>Wofür nutzen wir Ihre Daten?</h3>
<p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.</p>

<h3>Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
<p>Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.</p>

<h2>2. Hosting</h2>
<p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
<p>Die Server unseres Hosters befinden sich in Deutschland. Die Verarbeitung erfolgt zur Erfüllung unserer vertraglichen Pflichten gegenüber unseren potenziellen und bestehenden Kunden.</p>

<h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>

<h3>Datenschutz</h3>
<p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
"""
    },
    "agb": {
        "title": "Allgemeine Geschäftsbedingungen",
        "content": """
<h2>§ 1 Geltungsbereich</h2>
<p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Geschäftsbeziehungen zwischen der BidBlitz GmbH (nachfolgend "Anbieter") und dem Kunden (nachfolgend "Nutzer").</p>

<h2>§ 2 Vertragsgegenstand</h2>
<p>Gegenstand des Vertrages ist die Teilnahme an Penny-Auktionen auf der Plattform bidblitz.de. Bei Penny-Auktionen handelt es sich um Auktionen, bei denen jedes Gebot den Preis um einen festen Betrag (0,01 €) erhöht und die Auktionszeit verlängert.</p>

<h2>§ 3 Registrierung</h2>
<p>(1) Die Nutzung der Auktionsplattform setzt eine Registrierung voraus.<br/>
(2) Mit der Registrierung erklärt der Nutzer, dass er mindestens 18 Jahre alt ist.<br/>
(3) Der Nutzer ist verpflichtet, seine Daten wahrheitsgemäß anzugeben.</p>

<h2>§ 4 Gebotspakete</h2>
<p>(1) Zur Teilnahme an Auktionen müssen Gebote erworben werden.<br/>
(2) Gebote können in verschiedenen Paketen erworben werden.<br/>
(3) Bereits erworbene Gebote können nicht zurückgegeben werden.</p>

<h2>§ 5 Auktionsablauf</h2>
<p>(1) Jedes Gebot erhöht den Auktionspreis um 0,01 €.<br/>
(2) Jedes Gebot verlängert die Auktionslaufzeit.<br/>
(3) Der Nutzer, der bei Ablauf der Auktionszeit das letzte Gebot abgegeben hat, gewinnt die Auktion.</p>

<h2>§ 6 Zahlung</h2>
<p>(1) Die Zahlung erfolgt über die angebotenen Zahlungsmethoden.<br/>
(2) Der Gewinner einer Auktion ist verpflichtet, den Endpreis zuzüglich Versandkosten zu zahlen.</p>

<h2>§ 7 Haftung</h2>
<p>Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit. Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten.</p>

<h2>§ 8 Schlussbestimmungen</h2>
<p>(1) Es gilt das Recht der Bundesrepublik Deutschland.<br/>
(2) Gerichtsstand ist der Sitz des Anbieters.</p>
"""
    },
    "faq": {
        "title": "Häufig gestellte Fragen",
        "content": ""
    },
    "contact": {
        "title": "Kontakt",
        "content": ""
    },
    "how-it-works": {
        "title": "So funktioniert's",
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
