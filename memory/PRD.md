# BidBlitz - Penny Auction Platform PRD

## Original Problem Statement
Penny-Auktion-Website ähnlich dealdash.com mit Kunden-App und Admin-Panel.

## User Personas
1. **Kunden**: Registrierte Benutzer, die Gebote kaufen und auf Produkte bieten
2. **Admin**: Verwalter der Plattform mit voller Kontrolle über Produkte, Auktionen, Benutzer

## Core Requirements
- Penny-Auktionssystem wo Benutzer auf Produkte bieten
- Admin-Panel für vollständige Verwaltung
- Multi-Sprachen-Unterstützung (DE, EN, AL)
- Zahlungsintegration (Stripe)

---

## What's Been Implemented (17.01.2026)

### Authentifizierung & Benutzer
- [x] JWT-basierte Registrierung und Login
- [x] Admin- und Kundenrollen
- [x] Benutzer sperren/entsperren
- [x] Gebote-Guthaben System
- [x] **Passwort vergessen (3-Schritt-Prozess)**
- [x] **Profilverwaltung (Name, Email ändern)**
- [x] **Passwort ändern**

### Öffentliche Seiten (2.1)
- [x] **Startseite** (Hero, Live-Auktionen, Countdown, Call-to-Action)
- [x] **Auktionsübersicht** mit Filter, Sortierung, Kategorien (snipster-Stil)
- [x] **Auktionsdetailseite** mit Timer und Bieten
- [x] **Login / Registrierung**
- [x] **Passwort vergessen**
- [x] **Impressum / Datenschutz / AGB**

### Nutzerbereich (2.2)
- [x] **Dashboard** (Aktive Auktionen, Guthaben, Historie, Autobidder)
- [x] **Profilverwaltung**
- [x] **Gebots-Historie**
- [x] **Gekaufte Gebotspakete**

### Produkt-Management
- [x] CRUD für Produkte
- [x] Kategorien-System
- [x] Bild-URLs
- [x] UVP-Tracking

### Auktions-System
- [x] Penny-Auktionen mit Timer
- [x] Auktions-Terminplanung (3 Modi)
- [x] Live-Countdown
- [x] Automatische Status-Updates
- [x] Bieten nur bei aktiven Auktionen

### Admin-Panel
- [x] Dashboard mit Statistiken
- [x] Produkt-Verwaltung
- [x] Auktions-Verwaltung mit Scheduling
- [x] Benutzer-Verwaltung
- [x] Voucher/Gutschein-System
- [x] Admin-Bot-System
- [x] **Zahlungsübersicht (Umsatz, Transaktionen)**
- [x] **Systemlogs (Aktivitäten-Tracking)**

### Kunden-Features
- [x] Bieten auf aktive Auktionen
- [x] Autobidder
- [x] Gutschein einlösen
- [x] Gebotspaket-Kauf
- [x] **Gebots-Historie**
- [x] **Gekaufte Gebotspakete**

### Öffentliche Seiten
- [x] **Impressum** (§ 5 TMG, Kontakt, Register)
- [x] **Datenschutz** (DSGVO, Cookies, Stripe)
- [x] **AGB** (Auktionsregeln, Widerrufsrecht)

### UI/UX
- [x] **Cookie-Consent Banner**
- [x] **Footer mit rechtlichen Links**
- [x] **Neues Farbschema** (Gold #FFD700, Rot #FF4D4D)
- [x] **Inter/Poppins Fonts**
- [x] Multi-Sprachen (DE, EN, AL)

### Internationalisierung
- [x] Deutsch (DE)
- [x] Englisch (EN)
- [x] Albanisch (SQ)

---

## Technical Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - API-Endpoints
- MongoDB für Datenpersistenz
- JWT für Authentifizierung

### Frontend (React)
- `/app/frontend/src/` - React-App
- Tailwind CSS + shadcn/ui
- React Context für Auth & Language

### Database Collections
- `users` - Benutzer mit Guthaben
- `products` - Produktkatalog
- `auctions` - Auktionen mit Scheduling
- `vouchers` - Gutscheincodes
- `autobidders` - Auto-Bieter
- `bots` - Admin-Bots
- `payment_transactions` - Zahlungen
- `password_resets` - Reset-Codes

---

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-code`
- `POST /api/auth/reset-password`

### User
- `PUT /api/user/profile`
- `PUT /api/user/change-password`
- `GET /api/user/bid-history`
- `GET /api/user/purchases`

### Auctions
- `GET /api/auctions`
- `GET /api/auctions/{id}`
- `POST /api/auctions/{id}/bid`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/payments`
- `GET /api/admin/logs`
- `POST /api/admin/products`
- `POST /api/admin/auctions`
- `POST /api/admin/vouchers`
- `POST /api/admin/bots`

---

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- [x] Auktions-Terminplanung
- [x] Öffentliche Seiten (Impressum, Datenschutz, AGB)
- [x] Passwort vergessen
- [x] Profilverwaltung
- [x] Gebots-Historie & Käufe
- [x] Admin Zahlungsübersicht & Logs
- [x] Cookie-Consent
- [x] Design-Anpassung
- [x] **Admin Dashboard Charts (17.01.2026)** - Recharts: Umsatz, Gebote, Nutzer, Auktionsstatus, Top-Produkte
- [x] **Sicherheitsfix: API-Key in .env** (17.01.2026)
- [x] **Datenpersistenz: In-Memory → MongoDB** (17.01.2026)

### P1 (High Priority)
- [x] E-Mail-Benachrichtigungen (Gewinner, Passwort-Reset) - Resend Integration
- [x] **WebSockets für Echtzeit-Updates (17.01.2026)** - Live-Gebote, Viewer-Zähler, Toast-Benachrichtigungen
- [x] **Mobile-Optimierung (17.01.2026)** - Responsive Navigation, Touch-optimierte UI, Sticky Bid-Button
- [ ] "Sofort Kaufen" Feature
- [ ] Gebotsverlauf auf Auktionsseite

### P2 (Medium Priority)
- [x] Admin-Statistiken & Berichte (Charts) ✅
- [ ] Kategorien-Filter auf Auktionsseite
- [ ] Gewinner-Galerie (Social Proof)
- [ ] Referral-System
- [ ] PayPal Integration

### P3 (Low Priority)
- [ ] Two-Factor Authentication
- [ ] PDF-Rechnungen

---

## Test Credentials
- **Admin**: admin@bidblitz.de / Admin123!
- **Kunde**: kunde@bidblitz.de / Kunde123!

---

## Test Reports
- `/app/test_reports/iteration_1.json` - Neue Features Tests (22 bestanden)
- `/app/test_reports/iteration_2.json` - Admin Dashboard Charts Tests (11 bestanden)
- `/app/test_reports/iteration_3.json` - WebSocket Real-time Tests (13 bestanden)
- `/app/test_reports/pytest/pytest_results.xml` - Auktions-Scheduling Tests
- `/app/tests/test_new_features.py` - Test-Suite für neue Features
- `/app/tests/test_auction_scheduling.py` - Test-Suite für Scheduling
- `/app/tests/test_admin_dashboard_charts.py` - Test-Suite für Admin Charts
- `/app/tests/test_websocket_realtime.py` - Test-Suite für WebSocket-Echtzeit

---

## Mocked APIs
- **E-Mail-Versand**: Passwort-Reset-Code wird in API-Response (demo_code) zurückgegeben
- **Stripe**: Test-Key vorhanden, Platzhalter-Endpoints
- **Admin Payments/Logs**: Mock-Daten für Demo

---

## Last Updated
17.01.2026 - Vollständige Implementation aller Seiten und Features aus Spezifikation
