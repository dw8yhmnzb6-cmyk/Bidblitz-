# BidBlitz Penny Auction Platform - PRD

## Letztes Update: 22. Januar 2026

## Original-Anforderung
Der Benutzer hat eine Penny-Auktions-Website nach dem Vorbild von `dealdash.com` und `snipster.de` angefordert.

## Aktuelle Session - 22. Januar 2026

### Behobene Probleme dieser Session:

1. **Admin-Login "Ungültige Anmeldedaten"** ✅ BEHOBEN
   - Problem: `is_admin` Feld war `None` in MongoDB
   - Lösung: Feld auf `True` aktualisiert
   - Zugangsdaten: `admin@bidblitz.de` / `Admin123!`

2. **Timer bei 00:00:00 stehen geblieben** ✅ BEHOBEN
   - Problem: Geschäftszeiten-Logik blockierte Auktionen (Berlin nach Mitternacht)
   - Lösung: Geschäftszeiten auf 0:00-24:00 erweitert (24/7 für Entwicklung)

3. **Zahlungsübersicht zeigte €0.00** ✅ BEHOBEN
   - Problem: Code las aus falscher Collection (`payment_transactions` statt `transactions`)
   - Lösung: Collection in `routers/admin.py` korrigiert

4. **E-Mail Marketing zeigte 0 Benutzer** ✅ BEHOBEN
   - Problem: Fehlender API-Endpoint `/admin/email/user-stats`
   - Lösung: Neuen Endpoint hinzugefügt mit allen Segmentierungen

### Neue Features implementiert:

1. **Buy It Now (Sofort Kaufen)** ✅ NEU
   - Backend API Endpoints:
     - `GET /api/auctions/{auction_id}/buy-now-price` - Preis berechnen
     - `POST /api/auctions/{auction_id}/buy-now` - Kauf ausführen
   - Funktionen:
     - Festpreis = UVP - (platzierte Gebote × €0.15)
     - Minimum 50% vom UVP
     - Auktion wird sofort beendet
     - Benutzer erhält Produkt

2. **Bestellverwaltung** ✅ NEU
   - `GET /api/orders/my` - Benutzer-Bestellungen abrufen
   - Speichert: Buy Now Käufe, Rabatt, finale Preise

### Bestehendes aus vorherigen Sessions:

- **Push-Benachrichtigungen bei Überbieten** ✅
- **Wunschliste (Wishlist)** ✅  
- **Auktion des Tages** ✅
- **Autobidder System** ✅
- **i18n für alle Hauptseiten** ✅

## Zugangsdaten

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@bidblitz.de | Admin123! |
| Kunde | kunde@bidblitz.de | Kunde123! |
| Test | afrimk@me.com | Test123! |

## Kommende Features (Benutzer-Priorität)

### 🔴 Hohe Priorität
1. **Bid Buddy / Auto-Bieter verbessern**
   - Max. Preis-Limit setzen
   - Automatisch in letzten Sekunden bieten
   - UI: "Bid Buddy aktiv (noch X Gebote)"

2. **Push-Benachrichtigungen erweitern**
   - Browser-Notifications optimieren
   - "Auktion endet in 5 Min" Erinnerung
   - E-Mail Fallback

3. **PayPal Integration**
   - Als dritte Zahlungsoption

### 🟡 Mittlere Priorität
4. **Auktions-Typen**
   - Beginner-Auktionen (max. 10 Gewinne)
   - Nacht-Auktionen (50% weniger Gebote)
   - Gratis-Auktionen

5. **Achievements & Gamification**
   - Badges: "Erster Gewinn", "10 Auktionen gewonnen"
   - Tägliche Login-Belohnungen
   - Streak-System

6. **Live-Chat Support**

### 🟢 Niedrige Priorität
7. Benutzer-Statistiken
8. Social Features
9. Leaderboards

## Architektur
```
/app/
├── backend/
│   ├── server.py              # FastAPI + WebSocket + Background Tasks
│   ├── routers/
│   │   ├── auctions.py        # + Buy Now, Wishlist, AOTD
│   │   ├── admin.py           # + Email User Stats
│   │   ├── auth.py
│   │   ├── checkout.py
│   │   └── notifications.py
│   └── services/
│       └── websocket.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auctions.js    # Hauptseite mit Timer
│   │   │   ├── AuctionDetail.js # + Buy Now Modal
│   │   │   ├── Admin.js
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useAuctionWebSocket.js
│   │   └── i18n/
│   │       └── translations.js
```

## Key API Endpoints

### Auktionen
- `GET /api/auctions` - Alle Auktionen
- `GET /api/auctions/{id}` - Detail
- `POST /api/auctions/{id}/bid` - Bieten
- `GET /api/auctions/{id}/buy-now-price` - Buy Now Preis
- `POST /api/auctions/{id}/buy-now` - Sofort Kaufen

### Admin
- `GET /api/admin/stats` - Dashboard Stats
- `GET /api/admin/stats/detailed` - Detaillierte Stats
- `GET /api/admin/email/user-stats` - E-Mail Segmente
- `POST /api/admin/email/send-campaign` - E-Mail senden

### Benutzer
- `GET /api/wishlist` - Wunschliste
- `GET /api/orders/my` - Bestellungen
- `GET /api/autobidder/my` - Auto-Bieter

## Bekannte Probleme / Tech Debt

1. **Resend Email Sandbox** - Nur Test-E-Mails möglich
2. **Coinbase Commerce** - Deaktiviert (Placeholder Key)
3. **In-Memory State** - Einige Daten nicht persistent in MongoDB

## Mocked Services
- Resend E-Mails (Sandbox)
- Coinbase Commerce (deaktiviert)
