# BidBlitz Super-App - PRD

## Architecture
Frontend: React + Tailwind + Leaflet | Backend: FastAPI | DB: MongoDB | Server: IONOS 212.227.20.190

## Level 13: Genius Loyalty Program (March 2026)

### Level Rules
- Level 1: 0-4 Nächte → 10% Rabatt
- Level 2: 5-14 Nächte → 15% Rabatt + Late Checkout
- Level 3: 15+ Nächte → 20% Rabatt + Late Checkout + Priority Support + Upgrade

### Auto Level-Up
- Hooked into booking completion (hotels_host.py)
- Automatic recalculation on every completed booking
- Daily reconciliation cron job for safety

### Collections
- loyalty_profile (user_id, level, qualified_nights/bookings, total_spend)
- loyalty_events (audit trail: BOOKING_COMPLETED, LEVEL_UP/DOWN, MANUAL_ADJUST)

### Endpoints
- GET /api/loyalty/benefits (public)
- GET /api/loyalty/me (user, includes progress bar data)
- POST /api/admin/loyalty/{user_id}/adjust (admin only)
- POST /api/loyalty/internal/reconcile?secret=... (cron, localhost)

### Frontend: /loyalty/genius
- Current level card with progress bar
- Benefits cards for all 3 levels
- Stats: nights, bookings, total spend
- "Hotels finden" CTA

## Previous Levels
- L1-5: Hotels, Taxi (rider+driver), Admin Dashboard
- L6: Loyalty Points, Dynamic Pricing, Coupons, Star Filter
- L7: Marketplace (Real Estate, Cars, Jobs), Search
- L10: Rate Limiting, Audit Logs, Moderation, Fraud, Business Accounts
- L11: Monetization (Boosts, Featured, Subscriptions, Revenue)
- L12: Booking-Verified Reviews, Verification System, Admin Moderation

## Pending: P2
Guest-Host chat, Insurance, Parking, KI-Chatbot, App Store, Analytics Dashboard
