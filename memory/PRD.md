# BidBlitz Penny Auction - Product Requirements Document

## Original Problem Statement
Create a penny auction website modeled after `dealdash.com` and `snipster.de` with complete visual and functional features.

## Current Status (February 9, 2026)

### ✅ Session Update - February 9, 2026 (Session 3)

**Completed in this session:**

1. ✅ **P0 NATIVE MOBILE APP - FERTIG IMPLEMENTIERT**
   - Vollständige React Native / Expo Mobile App für iOS und Android
   - Projekt: `/app/mobile-app/BidBlitz/`
   - Tech Stack: React Native 0.81.5, Expo 54, React Navigation 7
   - Features implementiert:
     - **Login Screen** - E-Mail/Passwort Login mit Gradient-UI
     - **Register Screen** - Neue Kontoerstellung mit Bonus-Gebote Banner
     - **Home Screen** - Dashboard mit Willkommensbanner, Live-Auktionen, Jackpot, Quick Actions
     - **Auktionen Screen** - Auktionsliste mit Suche, Filtern (Alle/Nacht/VIP), Live-Countdown
     - **Auction Detail Screen** - Produktbilder, Countdown, Bieten-Button, Preis-Vergleich
     - **Buy Bids Screen** - Gebote-Pakete kaufen mit Stripe-Checkout-Integration
     - **Profile Screen** - Benutzerstatistiken, VIP-Badge, Referral-Code, Menu-Items
   - Navigation: Bottom Tab Navigator (Home, Auktionen, Gebote, Profil)
   - Styling: Dark Theme (#111827), Purple Gradients (#8B5CF6, #6366F1)
   - Auth: JWT Token-basiert mit localStorage (Web) / SecureStore (Native)
   - API: Verbunden mit bestehender Backend-API
   - Getestet: Login, Navigation, Auktionsliste funktioniert
   - Neue Dateien:
     - `/app/mobile-app/BidBlitz/App.js` - App Entry Point
     - `/app/mobile-app/BidBlitz/src/context/AuthContext.js` - Auth State Management
     - `/app/mobile-app/BidBlitz/src/navigation/AppNavigator.js` - Navigation Setup
     - `/app/mobile-app/BidBlitz/src/services/api.js` - API Client
     - `/app/mobile-app/BidBlitz/src/screens/*.js` - Alle 7 Screens
     - `/app/mobile-app/BidBlitz/README.md` - Dokumentation

---

### Mobile App Deployment (NÄCHSTE SCHRITTE)

Um die Mobile App für iOS/Android zu veröffentlichen:

**iOS (App Store):**
1. Apple Developer Account ($99/Jahr) erstellen
2. `eas build --platform ios` ausführen
3. App via App Store Connect hochladen
4. App Store Review abwarten

**Android (Play Store):**
1. Google Play Developer Account ($25 einmalig) erstellen
2. `eas build --platform android` ausführen
3. AAB-Datei in Google Play Console hochladen
4. Review abwarten

**Web Preview:**
- Die Mobile App kann auch im Web getestet werden: `cd /app/mobile-app/BidBlitz && yarn web`
- Läuft auf Port 3001

---

### ✅ Session Update - February 8, 2026 (Session 1)

**Completed in this session:**

1. ✅ **P0 Admin Panel Responsive Bug - BEHOBEN**
   - Problem: Admin Tabellen waren auf Mobile abgeschnitten
   - Ursache: `Admin.js` verwendete inline-Code statt der refactored Komponenten
   - Lösung: Payments, Users, Products Tabs verwenden jetzt die Komponenten mit responsive Card-View
   - Dateien: `/app/frontend/src/pages/Admin.js`

2. ✅ **Enhanced Affiliate Dashboard**
   - Real-time KPI-Cards: Konversionsrate, Ø Bestellwert, Ø Provision, Kundenwert
   - Interaktive Charts mit recharts: Einnahmen (30 Tage), Anmeldungen vs. Käufe
   - Performance-Zusammenfassung mit dynamischer Bewertung (Exzellent/Gut/Potenzial)
   - Vollständige DE/EN Übersetzungen
   - Datei: `/app/frontend/src/pages/InfluencerDashboard.js`

3. ✅ **B2B Kunden-Management für Großkunden**
   - Kunden über 8-stellige Kundennummer hinzufügen
   - Gebote an verknüpfte Kunden senden mit optionaler Nachricht
   - Transfer-Historie mit Datum, Empfänger, Betrag und Kosten
   - Stats: Verknüpfte Kunden, Gesendete Gebote, Kosten gesamt
   - Backend APIs: `/api/wholesale/auth/add-customer`, `/send-bids`, `/my-customers`, `/bid-transfers`
   - Datei: `/app/frontend/src/pages/WholesaleDashboard.js`
   - Datei: `/app/backend/routers/wholesale_auth.py`

4. ✅ **AI-Preisempfehlungen**
   - Produktempfehlungen basierend auf Benutzerverhalten und Lieblingskategorien
   - Smart Alerts für endende Auktionen und neue Produkte
   - Paket-Empfehlung basierend auf Guthaben und Aktivität
   - Frontend-Widget mit Produktkarten und Match-Score
   - Dateien: `/app/backend/routers/ai_bid_recommendations.py`, `/app/frontend/src/components/AIRecommendations.js`

5. ✅ **Push-Benachrichtigungen aktiviert**
   - VAPID-Keys verbunden
   - User-Toggle für Push-Subscriptions
   - Benachrichtigungstypen: Auktion endet, Überboten, Gewonnen, Neue Auktionen, Promotionen
   - Service Worker erweitert für Push-Events
   - Admin-Endpoint zum Senden von Benachrichtigungen
   - Dateien: `/app/backend/routers/push_notifications.py`, `/app/frontend/src/components/PushNotificationSettings.js`

6. ✅ **Admin.js Refactoring (Teil 1)**
   - Staff-Tab zu separater Komponente extrahiert
   - Responsive Mobile-Ansicht hinzugefügt
   - Datei von 3132 auf 2988 Zeilen reduziert
   - Neue Datei: `/app/frontend/src/components/admin/AdminStaff.js`

---

## Architecture

### Backend
- FastAPI with MongoDB
- WebSocket for real-time updates
- JWT Authentication
- RBAC with roles and permissions

### Frontend (74+ Pages)
- React with Tailwind CSS
- Shadcn/UI components
- Dynamic Light/Dark theme system
- Real-time WebSocket updates
- 24 language support including Albanian

---

## Key Features Implemented

### Gamification ✅
- Achievements & Badges
- Levels & XP system
- Daily Quests & Rewards
- Battle Pass
- Lucky Wheel
- Weekly Tournaments with Leaderboard Widget
- Winner Gallery

### Monetization ✅
- Stripe Payments
- Bid Packages
- VIP Subscription
- Gift Cards
- Crypto Payments

### Social ✅
- Friend Battle
- Team Auctions
- Referral System (with ReferFriendsPage)
- Social Sharing Rewards
- Leaderboard Widget on Homepage
- Winner Gallery

### AI & Personalization ✅
- **AI Bid Recommendations** (NEW!)
- **AI Product Recommendations** (NEW!)
- **Smart Alerts** (NEW!)
- Deal Radar
- Price Alerts
- Wishlist
- Optimal Bidding Times

### B2B Wholesale Portal ✅
- Separate Login/Registration
- Discount-based pricing
- Credit system
- Order history
- **Customer Management** (NEW!)
- **Bid Transfers to Customers** (NEW!)

### Admin Tools ✅
- Dashboard with stats
- User management
- Bot management
- Voice Debug Assistant
- Debug Reports Dashboard
- AI Chat Assistant
- Maintenance Mode
- **Staff Management** (Refactored!)
- **Push Notification Admin** (NEW!)

---

## Test Credentials
- **Admin:** admin@bidblitz.de / Admin123!
- **B2B Customer:** test@grosshandel.de / Test123!
- **Influencer:** demo@influencer.test / demo

---

## Mocked Services
| Service | Status | Required |
|---------|--------|----------|
| WhatsApp | MOCKED | API Token |
| Twilio SMS | MOCKED | Credentials |
| Apple Login | MOCKED | Dev Credentials |
| Tawk.to Live Chat | MOCKED | Property ID |
| Resend Email | ACTIVE | Working API Key |

---

## Files Modified/Created (This Session)

### New Features:
- `/app/frontend/src/components/AIRecommendations.js` - KI-Empfehlungen Widget
- `/app/frontend/src/components/PushNotificationSettings.js` - Push-Einstellungen
- `/app/frontend/src/components/admin/AdminStaff.js` - Staff Management Komponente
- `/app/backend/routers/push_notifications.py` - Push Notifications API

### Enhanced:
- `/app/frontend/src/pages/InfluencerDashboard.js` - Real-time Charts & KPIs
- `/app/frontend/src/pages/WholesaleDashboard.js` - B2B Kunden-Management
- `/app/backend/routers/wholesale_auth.py` - B2B Customer APIs
- `/app/backend/routers/ai_bid_recommendations.py` - Product Recommendations API
- `/app/frontend/src/pages/Dashboard.js` - AI Recommendations & Push Settings integriert

### Admin Panel Refactoring:
- `/app/frontend/src/pages/Admin.js` - Staff-Tab ausgelagert, ~145 Zeilen reduziert
- `/app/frontend/src/components/admin/index.js` - AdminStaff Export hinzugefügt

### Bug Fixes:
- `/app/frontend/src/pages/Admin.js` - Payments, Users, Products Tabs verwenden jetzt responsive Komponenten

---

## Backlog / Upcoming Tasks

### P1 (High Priority)
- [ ] Admin.js weiter refactoren (Dashboard-Tab, Jackpot-Tab, etc.)
- [ ] Auctions.js Refactoring (>1100 Zeilen)

### P2 (Medium Priority)
- [ ] Tawk.to Live Chat finalisieren (Credentials benötigt)
- [ ] Apple Login finalisieren (Credentials benötigt)
- [ ] Auktionsdauer-Bug Frontend verifizieren
- [ ] Maintenance Mode Toggle-Logik korrigieren

### P3 (Low Priority)
- [ ] Lint-Warnungen in VIPAuctions.js beheben
- [ ] Lint-Warnungen in Admin.js beheben
- [ ] i18n für alle neuen Komponenten erweitern

---

## Language Support (24 languages)
German, English, Albanian, Kosovo, Turkish, French, Spanish, Italian, Dutch, Polish, Portuguese, Russian, Arabic, Chinese, Japanese, Korean, Hindi, Swedish, Norwegian, Danish, Finnish, Greek, Romanian, Czech
