# BidBlitz Penny Auction - Product Requirements Document

## Original Problem Statement
Create a penny auction website modeled after `dealdash.com` and `snipster.de` with complete visual and functional overhaul.

## Completion Status (February 3, 2026)

### ✅ LATEST: Update 4 - Auktions-Sichtbarkeit + Promo-Code-System (Feb 3)

**Implementiert:**

1. ✅ **"Ende" Tab repariert - Beendete Auktionen sichtbar:**
   - Neue `auction_history` Collection speichert beendete Auktionen vor Auto-Restart
   - Neuer API-Endpoint: `GET /api/auctions/ended` 
   - Frontend zeigt Gewinner, Endpreis und Zeit seit Beendigung
   - Funktioniert trotz Auto-Restart-System

2. ✅ **Nacht-Auktionen immer sichtbar:**
   - Nacht-Auktionen werden NICHT mehr versteckt wenn es Tag ist
   - Filter zeigt alle 4 Nacht-Auktionen mit "🌙 NACHT" Badge
   - Timer zeigt "00:00:00" (pausiert) wenn nicht Nachtzeit
   - Klare visuelle Unterscheidung mit indigo/purple Farben

3. ✅ **Promo-Code-System fertiggestellt:**
   - Backend: `/api/promo-codes/redeem` + `/api/promo-codes/check/{code}`
   - Admin-UI: Codes erstellen, verwalten, deaktivieren
   - Benutzer-UI: Neue Sektion im Profil zum Einlösen
   - Validierung: Zeigt Code-Name, Belohnung und "Gültiger Code" Status
   - Einlösung: Toast-Nachricht "X Gratis-Gebote gutgeschrieben!"
   - Test-Code erstellt: "WELCOME2026" → 50 Gebote

### ✅ Update 3 - Jackpot Toggle + BidBlitz Gutscheine + Übersetzungen (Feb 3)

**Implementiert:**

1. ✅ **Admin Jackpot Ein/Aus-Schalter:**
   - Toggle-Button im Admin Panel (🏆 Jackpot Tab)
   - API: `POST /api/excitement/global-jackpot/toggle`
   - Status wird in global_jackpot.is_active gespeichert

2. ✅ **BidBlitz-eigene Gutscheine:**
   - Neue Produkte erstellt (nur unsere eigenen):
     - BidBlitz 50 Gratis-Gebote
     - BidBlitz 100 Gratis-Gebote  
     - BidBlitz 200 Gratis-Gebote
     - BidBlitz VIP 1 Monat GRATIS
   - Alte Drittanbieter-Gutscheine entfernt aus Auktionen

3. ✅ **Übersetzungen aktualisiert:**
   - "Gutscheine" statt "Gratis/Free" in allen Sprachen

### ✅ Update 2 - Investor Portal + Gutschein-System (Feb 3)

**Verbesserungen:**

1. ✅ **Investor Portal - Klare Vorteile:**
   - Neue "Vision" Sektion mit Zielen (€5M+ Umsatz, 100K+ Nutzer, 10+ Länder)
   - "Was Sie als Investor erhalten" mit 4 Kategorien

2. ✅ **Gutschein-Auktionen (Gratis → Gutscheine):**
   - Umbenannt von "Gratis" zu "Gutscheine" (🎫)
   - Klarstellung: Gebote kosten Geld, Gutschein ist GRATIS bei Gewinn

### ✅ Stripe Integration + Tag/Nacht Logik (Feb 3, 2026)

**Neu implementiert:**

1. ✅ **Investor Portal mit Stripe-Zahlung:**
   - 4 Investment-Pakete: Starter (€500), Standard (€2.500), Premium (€10.000), Partner (€50.000)
   - Automatische Stripe-Checkout Integration

2. ✅ **Tag/Nacht-Auktionen Logik:**
   - Tag-Auktionen: Nur sichtbar 06:00-23:30 Uhr
   - Nacht-Auktionen: Immer sichtbar mit Timer/Status

## Test Credentials

### Funktionierend:
- **Admin:** admin@bidblitz.de / Admin123!
- **Customer:** kunde@bidblitz.de / Kunde123!
- **Manager Prishtina:** manager.prishtina@bidblitz.de / Manager123!
- **Manager Berlin:** manager.berlin@bidblitz.de / Manager123!
- **Promo Code:** WELCOME2026 (50 Gebote)

## Key API Endpoints - New

### Promo Codes
- `POST /api/promo-codes/admin/create` - Code erstellen (Admin)
- `GET /api/promo-codes/admin/list` - Alle Codes (Admin)
- `GET /api/promo-codes/check/{code}` - Code prüfen (öffentlich)
- `POST /api/promo-codes/redeem` - Code einlösen (User)

### Auction History
- `GET /api/auctions/ended` - Beendete Auktionen aus History

### Manager (Admin)
- `GET /api/manager/admin/{manager_id}/influencers` - Influencer eines Managers

## Pending Items (Priority Order)

1. ~~**P0: Auktions-Sichtbarkeit (Ende/Nacht)**~~ ✅ Behoben
2. ~~**P1: Promo-Code-System**~~ ✅ Fertig
3. **P1: Alle Übersetzungen vervollständigen** - Site-weiter Audit
4. **P2: Apple Login finalisieren** - Apple Developer Account erforderlich
5. **P2: Auktionsdauer-Bug** - Admin-Formular Berechnung
6. **P3: "Not Found" Toast** - Wiederkehrendes Problem

## Key Files Modified

### Backend
- `/app/backend/server.py` - Auto-Restart speichert jetzt in auction_history
- `/app/backend/routers/auctions.py` - Neuer `/auctions/ended` Endpoint
- `/app/backend/routers/promo_codes.py` - Vollständiges Promo-Code-System

### Frontend
- `/app/frontend/src/pages/Auctions.js` - Ende/Nacht Filter repariert
- `/app/frontend/src/pages/Profile.js` - Promo-Code Einlösung UI

## Test Reports
- `/app/test_reports/iteration_31.json`

## Last Updated
February 3, 2026

## Changelog

### February 3, 2026 - Auktions-Sichtbarkeit + Promo-Codes
- ✅ "Ende" Tab zeigt beendete Auktionen (via auction_history)
- ✅ Nacht-Auktionen immer sichtbar (nicht mehr versteckt bei Tag)
- ✅ Promo-Code-System fertig (Admin + Benutzer-UI)
- ✅ Test-Code "WELCOME2026" erstellt

### February 3, 2026 - Jackpot Toggle + Gutscheine
- ✅ Admin Jackpot Ein/Aus-Schalter
- ✅ BidBlitz-eigene Gutschein-Produkte
- ✅ Übersetzungen aktualisiert

### February 2, 2026 - Investor Portal + Stripe
- ✅ Investor Portal mit Stripe-Integration
- ✅ Tag/Nacht-Auktionen System
