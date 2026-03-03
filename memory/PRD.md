# BidBlitz Super App - Product Requirements Document

## Original Problem Statement
Migration und Weiterentwicklung der BidBlitz Auktionsplattform zu einer vollständigen "Super App" mit umfangreichen Funktionen für den E-Commerce-Markt in Dubai und Europa.

## Core Requirements
1. **Auction Platform** - Live-Auktionen, VIP-Auktionen, Gebote-System ✅
2. **Admin Panel** - Vollständiges Management-Dashboard ✅
3. **Marketplace** - Produktlisten, Kategorien, Filter ✅
4. **Multi-Language Support** - DE, EN, TR, SQ, AR, FR ✅
5. **Mobility Module** - Taxi, Scooter, Transport
6. **Services Hub** - Hotels, Versicherung, Krypto, Parken ✅
7. **Food Delivery** - Restaurantbestellungen ✅
8. **Events** - Dubai Events & Tickets ✅
9. **Partner Portal** - Partner-Management ✅
10. **BidBlitz Pay** - Wallet & Zahlungen ✅

## Completed Work (March 3, 2026)

### BidBlitz Genius Level-System ✅
**Status: COMPLETED (March 3, 2026)**

Implemented a 3-tier loyalty program for hotels and Super-App:

**Backend:**
- `/var/www/bidblitz/backend/utils/genius.py` - Level calculation logic
- `/var/www/bidblitz/backend/routers/genius.py` - API endpoints
- Hook added in `/var/www/bidblitz/backend/routers/extended_services.py` (line 41)

**API Endpoints:**
- `GET /api/genius/me` - Get user's genius status
- `GET /api/genius/benefits` - Get current level benefits
- `POST /api/genius/_internal/add_activity` - Admin: add activity
- `POST /api/genius/_internal/recalc_all` - Admin: recalculate all levels

**Level Requirements:**
- Level 1 (Starter): Default - 10% Hotel-Rabatt
- Level 2 (Gold): 1.000€ OR 5 Buchungen OR 1.000 Punkte - 10-15% Rabatt + Upgrade
- Level 3 (Platinum): 5.000€ OR 15 Buchungen OR 5.000 Punkte - 10-20% Rabatt + VIP

**Frontend:**
- `/var/www/bidblitz/frontend/src/pages/GeniusProgramPage.jsx`
- Route: `/genius`

### Location Selection & Bids Display Fix ✅
**Status: COMPLETED**

1. **Dynamic Location Selector** - Users can now select from:
   - 🇦🇪 Dubai (VAE)
   - 🇽🇰 Kosovo
   - 🇩🇪 Deutschland
   - 🇦🇹 Österreich
   - 🇨🇭 Schweiz
   
   The selection is persisted in localStorage and dynamically updates the "Explore" section title and images.

2. **Bids Balance Display** - Wallet card now shows real-time bids_balance from user API (e.g., "992 Gebote")

### Full-Site Translation Implementation ✅
**Status: COMPLETED**

All pages now fully support multi-language translation:

1. **Dubai Events (DubaiEvents.jsx)** ✅
   - Title, subtitle, categories, prices all translated
   - Languages: DE, EN, SQ, AR, TR, FR

2. **Services Hub (ServicesHub.jsx)** ✅
   - All tabs (Hotels, Insurance, Crypto, Marketplace, Parking, Transfer) translated
   - All button labels, messages, placeholders translated
   - Languages: DE, EN, SQ, AR, TR, FR

3. **Food Delivery (FoodDelivery.jsx)** ✅
   - Menu items, buttons, status messages translated
   - Languages: DE, EN, SQ, AR, TR, FR

4. **Partner Landing (PartnerLanding.js)** ✅
   - All UI elements, business types, action buttons translated
   - Languages: DE, EN, SQ, AR, TR, FR

5. **VIP Auctions (VIPAuctions.js)** ✅
   - Already connected to translation system

6. **Buy Bids (BuyBids.js)** ✅
   - Has inline translations already implemented

7. **pageTranslations.js** - Added `usePageTranslations` hook

### Previous Session Completions
- Marketplace overhaul with working listings, detail pages, and create page
- Country/city filtering (VAE structure)
- Admin panel accessibility fix
- SuperApp home page translations
- Mobile language selector fix

## Technical Architecture

### Frontend
- React 18 with React Router
- Tailwind CSS + Shadcn/UI components
- i18n system using `LanguageContext` and translation files
- Location: `/var/www/bidblitz/frontend/`

### Backend
- FastAPI (Python)
- MongoDB database
- Location: `/var/www/bidblitz/backend/`

### Translation System
- `/var/www/bidblitz/frontend/src/i18n/pageTranslations.js`
- `/var/www/bidblitz/frontend/src/i18n/marketplaceTranslations.js`
- `/var/www/bidblitz/frontend/src/i18n/superAppTranslations.js`
- `/var/www/bidblitz/frontend/src/context/LanguageContext.js`

### Deployment
- Server: IONOS (212.227.20.190)
- Frontend: Nginx serving React build
- Backend: PM2/Gunicorn

## Supported Languages
1. 🇩🇪 German (de) - Default
2. 🇬🇧 English (en)
3. 🇹🇷 Turkish (tr)
4. 🇽🇰 Albanian/Kosovo (sq/xk)
5. 🇦🇪 Arabic (ar/ae)
6. 🇫🇷 French (fr)

## Upcoming Tasks (P2)
- [ ] In-App Chat (Rider-Driver)
- [ ] SOS Button in Taxi App
- [ ] Taxi Fare Splitting
- [ ] App-wide Dark Mode Toggle

## Future Tasks (P3)
- [ ] Sync production server with GitHub repository
- [ ] App Store submission preparation
- [ ] KI-powered support chatbot
- [ ] Hotel Booking Module
- [ ] Insurance Module
- [ ] Parking Finder Module

## Mocked Features
- Crypto Wallet (placeholder implementation)
- OEM Scooter Hardware integration

## 3rd Party Integrations
- Resend (Email)
- Google Maps
- Tawk.to (Chat)
- Stripe (Payments)

## Credentials
- **Server:** root@212.227.20.190
- **Admin:** admin@bidblitz.ae / AfrimKrasniqi123

---
*Last Updated: March 3, 2026*
