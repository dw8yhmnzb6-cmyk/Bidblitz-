# BidBlitz Super-App - PRD

## Architecture
Frontend: React + Tailwind + Leaflet | Backend: FastAPI | DB: MongoDB | Server: IONOS 212.227.20.190

## Level 11 Monetization Engine (March 2026)

### Products (Auto-seeded)
- Hotels Boost 24h: 10€ (weight 50)
- Hotels Featured 72h: 30€ (weight 100)
- Marketplace Boost 24h: 5€
- Business Basic 30d: 29€

### Purchase Flow
- Wallet deduction → Purchase record → Promotion/Subscription created → Audit logged
- Insufficient funds → 402 error with balance info

### Hotels Promotion Sorting
- Listings sorted: FEATURED first → BOOST → normal
- Response includes is_featured, is_boosted, promo_ends_at fields

### Admin Revenue Dashboard
- KPIs: today/7d/30d revenue, purchase count, active promotions, refunds
- Top products, top users
- Refund capability with wallet restoration

### Collections
- monetization_products, monetization_purchases, listing_promotions, business_subscriptions

### All Endpoints
- GET /api/monetization/products
- POST /api/monetization/purchase
- GET /api/monetization/my-purchases
- GET /api/admin/monetization/overview
- GET /api/admin/monetization/purchases
- POST /api/admin/monetization/refund

### Frontend Pages
- /shop — Product catalog with buy buttons
- /my-purchases — Purchase history
- /admin/monetization — Revenue KPIs + refund management

## Previous Levels Complete
- L1-5: Hotels, Taxi (rider+driver), Admin Dashboard
- L6: Loyalty, Dynamic Pricing, Coupons, Reviews, Star Filter
- L7: Marketplace (Real Estate, Cars, Jobs), Search
- L10: Rate Limiting, Audit Logs, Moderation, Fraud Detection, Business Accounts, Dynamic Pricing

## Pending: P2
Guest-Host chat, Genius loyalty, Insurance, Parking, KI-Chatbot, App Store
