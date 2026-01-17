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

## What's Been Implemented

### Authentifizierung & Benutzer
- [x] JWT-basierte Registrierung und Login
- [x] Admin- und Kundenrollen
- [x] Benutzer sperren/entsperren
- [x] Gebote-Guthaben System

### Produkt-Management
- [x] CRUD für Produkte
- [x] Kategorien-System
- [x] Bild-URLs
- [x] UVP-Tracking

### Auktions-System
- [x] Penny-Auktionen mit Timer
- [x] **Auktions-Terminplanung (NEU - 17.01.2026)**
  - Sofort starten (traditionell)
  - Geplanter Start mit Dauer
  - Benutzerdefinierte Start-/Endzeit
- [x] Live-Countdown
- [x] Automatische Status-Updates (scheduled → active → ended)
- [x] Bieten nur bei aktiven Auktionen möglich

### Admin-Panel
- [x] Dashboard mit Statistiken
- [x] Produkt-Verwaltung (Erstellen, Bearbeiten, Löschen)
- [x] Auktions-Verwaltung mit Scheduling
- [x] Benutzer-Verwaltung (Sperren, Gebote hinzufügen)
- [x] Voucher/Gutschein-System
- [x] Admin-Bot-System (Preiserhöhung)

### Kunden-Features
- [x] Bieten auf aktive Auktionen
- [x] Autobidder (automatisches Bieten bis Limit)
- [x] Gutschein einlösen
- [x] Gebotspaket-Kauf (Stripe-Integration)

### Internationalisierung
- [x] Deutsch (DE)
- [x] Englisch (EN)
- [x] Albanisch (SQ)
- [x] Sprachwechsler in Navbar

---

## Technical Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - Monolithische API
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
- `autobidders` - Auto-Bieter Konfigurationen
- `bots` - Admin-kontrollierte Bots
- `payment_transactions` - Zahlungen

---

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Auktions-Terminplanung

### P1 (High Priority)
- [ ] Gewinner-Benachrichtigungen (Email/Push)
- [ ] "Sofort Kaufen" Feature
- [ ] Gebotsverlauf auf Auktions-Seite
- [ ] MongoDB-Migration (In-Memory → MongoDB für alle Daten)

### P2 (Medium Priority)
- [ ] Admin-Statistiken & Berichte
- [ ] Kategorien-Filter auf Auktionsseite
- [ ] Gewinner-Galerie (Social Proof)
- [ ] Referral-System

### P3 (Low Priority)
- [ ] Impressum & AGB
- [ ] Two-Factor Authentication
- [ ] WebSocket für Echtzeit-Updates

---

## Test Credentials
- **Admin**: admin@bidblitz.de / Admin123!
- **Kunde**: kunde@bidblitz.de / Kunde123!

---

## API Endpoints Reference

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Products
- `GET /api/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/{id}`
- `DELETE /api/admin/products/{id}`

### Auctions
- `GET /api/auctions`
- `GET /api/auctions/{id}`
- `POST /api/admin/auctions` (mit start_time, end_time)
- `PUT /api/admin/auctions/{id}`
- `POST /api/auctions/{id}/bid`

### Admin
- `GET /api/admin/users`
- `PUT /api/admin/users/{id}/toggle-block`
- `POST /api/admin/vouchers`
- `POST /api/admin/bots`
- `POST /api/admin/bots/bid-to-price`

---

## Last Updated
17.01.2026 - Auktions-Terminplanung implementiert und getestet
