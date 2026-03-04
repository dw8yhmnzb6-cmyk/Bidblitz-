# BidBlitz Super-App - PRD (Final)

## Architecture
Frontend: React + Tailwind + Leaflet | Backend: FastAPI | DB: MongoDB | Server: IONOS 212.227.20.190

## Complete Feature List (L1-19)

### Core Modules
- **Hotels**: 55 listings, search/filter, booking, host dashboard, payouts, mobile UI
- **Taxi**: Rider app (nearby taxis, ETA, booking, tracking) + Driver app (online/offline, ride management, earnings)
- **Marketplace**: Real Estate, Cars, Jobs + search + moderation
- **Match-3 Game**: 8x8 grid, timer, score, levels, leaderboard

### Revenue & Monetization
- Boosts/Featured/Subscriptions with wallet payment
- Hotels promotion sorting (FEATURED > BOOST > normal)
- Admin revenue dashboard with KPIs

### Trust & Quality
- Booking-verified reviews (1 per booking, profanity moderation, host reply, helpful votes)
- Hotel/Host verification badges (admin-controlled)
- Star filter (3★/4★/5★) on search

### Loyalty & Engagement
- Genius Program (3 levels: 10%/15%/20% discounts + perks)
- Auto level-up on booking completion + reconciliation cron
- Loyalty points for reviews

### Communication
- Guest-Host chat per booking (real-time polling, unread badges)
- KI-Support chatbot (12 FAQ categories, ticket escalation)
- In-app notifications + Web Push (VAPID)
- Admin escalation + support tickets

### Security & Operations
- Rate limiting (MongoDB-backed, 60/min + 300/10min)
- Audit logs for all critical actions
- Marketplace auto-moderation (banned keywords, spam, risk scoring)
- Fraud detection (auto-flag after 10+ events/day)
- Business accounts with KYC-lite

### Infrastructure
- Multi-tenant SaaS (tenant resolution, per-tenant fees/branding/wallet)
- White-label domain support
- PWA (service worker, offline fallback, background sync)
- Dynamic pricing (weekend/seasonal/occupancy + admin override)

### New: Analytics + Insurance + Parking
- **Analytics Dashboard** (/admin/analytics): Revenue per module (Hotels/Taxi/Monetization), user growth, top hotels/buyers
- **Insurance**: 3 plans (Basis 5%, Premium 8%, Rundum 12%), wallet payment, policy management
- **Parking**: 8 sample spots (Pristina/Dubai/Frankfurt), distance search, reservation with wallet

### Frontend Routes (30+)
/hotels, /hotels/:id, /hotels/host, /hotels/bookings, /hotels/map
/taxi, /taxi/driver, /taxi-profil
/real-estate, /cars, /jobs, /search
/shop, /my-purchases, /loyalty/genius
/chat, /chat/:bookingId, /support
/settings/notifications, /insurance, /parking
/game/match3, /play/match3
/admin/dashboard, /admin/analytics, /admin/audit, /admin/fraud
/admin/reviews, /admin/monetization
/tenant-admin, /super-admin/tenants
