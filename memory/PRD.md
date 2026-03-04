# BidBlitz Super-App - PRD (Final)

## Architecture
Frontend: React + Tailwind + Leaflet | Backend: FastAPI | DB: MongoDB | Server: IONOS 212.227.20.190

## Super App Dashboard + Revenue Engine (March 2026)

### Super App Dashboard (/dashboard)
- Wallet quick-view (balance + Genius level)
- 4 Quick Actions: Scan, Pay, Transport, Wallet
- Category grid: Mobility, Food, Shopping, Services
- Explore carousel: Deals, Auktionen, Hotels, Games
- Referral widget + Quick links (Plus, Support, Genius)

### Revenue Engine (Auto-Revenue)
- Central fee rules per module (TAXI 2%, HOTELS 12%, MARKETPLACE 5%)
- Double-entry ledger (immutable entries + reversals)
- Partner balances (HOST/DRIVER/MERCHANT/PLATFORM)
- Payout management (request, admin approve/fail)
- Auto-invoicing per period (generate from ledger entries)
- Admin Revenue Dashboard (/admin/revenue): KPIs, Fee Rules, Payouts, Invoices

### Collections
- fee_rules, ledger_entries, partner_balances, payout_jobs, invoices

### Key Endpoints
- POST /api/revenue/internal/post — ledger entry with auto fee calc
- GET /api/admin/revenue/kpis — revenue by module + totals
- POST /api/admin/revenue/fee-rules/seed — default rules
- POST /api/payouts/request — partner payout
- POST /api/admin/invoices/generate — monthly invoices

## Complete Feature Count: 40+ Frontend Routes, 70+ Backend Routers, 20+ Feature Levels
