# BidBlitz Penny Auction Platform - PRD

## Letztes Update: 21. Januar 2026

## Original-Anforderung
Der Benutzer hat eine Penny-Auktions-Website nach dem Vorbild von `dealdash.com` und `snipster.de` angefordert.

## Aktuelle Session - 21. Januar 2026

### Behobene Probleme:
1. **Timer-Bug behoben** - Timer zeigten "00:00:00" und aktualisierten sich nicht
   - Ursache: Bot-System bietete zu aggressiv, Timer waren immer nur wenige Sekunden
   - Lösung: Auktions-Timer auf 10 Minuten zurückgesetzt
   - Status: ✅ BEHOBEN - Timer zählen jetzt automatisch herunter

### Neue Features implementiert:

1. **Push-Benachrichtigungen bei Überbieten** ✅
   - Backend: `/app/backend/routers/auctions.py` 
   - Wenn ein Benutzer überboten wird, erhält der vorherige Bieter:
     - Push-Benachrichtigung (Browser)
     - In-App Benachrichtigung
   - Benachrichtigung enthält: Produktname, neuer Preis, Link zur Auktion

2. **Wunschliste (Wishlist)** ✅
   - Backend API Endpoints:
     - `POST /api/wishlist/{auction_id}` - Zur Wunschliste hinzufügen
     - `DELETE /api/wishlist/{auction_id}` - Von Wunschliste entfernen
     - `GET /api/wishlist` - Wunschliste abrufen
     - `GET /api/wishlist/check/{auction_id}` - Prüfen ob in Wunschliste

3. **Auktion des Tages** ✅
   - Backend API Endpoints:
     - `GET /api/auction-of-the-day` - Auktion des Tages abrufen
     - `POST /api/admin/auction-of-the-day/{auction_id}` - AOTD setzen (Admin)
   - Automatische Auswahl: Höchstwertiges aktives Produkt wird ausgewählt
   - Manuelle Auswahl: Admin kann AOTD manuell setzen

### i18n-Migration (vollständig)
Alle wichtigen Seiten in 5 Sprachen (DE, EN, SQ, TR, FR):
- Auctions.js, Login.js, Register.js, Contact.js
- FAQ.js, BuyBids.js, Winners.js, Dashboard.js, HowItWorks.js

## Architektur
```
/app/
├── backend/
│   ├── server.py              # FastAPI mit Background Tasks
│   ├── routers/
│   │   ├── auctions.py        # + Wishlist & AOTD Endpoints
│   │   └── notifications.py   # Push Notifications
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/             # React-Seiten mit i18n
│   │   └── i18n/              # Übersetzungsdateien
│   └── .env
└── memory/PRD.md
```

## Noch zu erledigen (Backlog)

### P1 - Hoch
- [ ] Wishlist Frontend UI (Heart-Button auf Auction Cards)
- [ ] Auktion des Tages im Frontend anzeigen
- [ ] PayPal-Integration

### P2 - Mittel
- [ ] VIP.js, Profile.js, InviteFriends.js i18n
- [ ] Admin-Panel Internationalisierung
- [ ] Mehr Auktionen erstellen (~100)

### P3 - Niedrig
- [ ] E-Mail Production-Konfiguration
- [ ] Datenpersistenz-Audit

## Test-Zugangsdaten
- **Admin:** admin@bidblitz.de / Admin123!
- **Kunde:** kunde@bidblitz.de / Kunde123!
- **Test:** afrimk@me.com / Test123!

## Bekannte Einschränkungen
- Resend E-Mail ist im Sandbox-Modus
- Coinbase Commerce ist deaktiviert (Platzhalter-API-Key)
