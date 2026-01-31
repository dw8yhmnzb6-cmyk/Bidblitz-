# BidBlitz Penny Auction - Product Requirements Document

## Original Problem Statement
Create a penny auction website modeled after `dealdash.com` and `snipster.de` with complete visual and functional overhaul.

## Core Features Implemented

### User System
- User registration with email verification
- JWT-based authentication
- Customer numbers (8-digit) for gifting
- VIP membership tiers
- Influencer accounts with free VIP access

### Auction System
- Real-time penny auctions with WebSocket updates
- Bot system (dual-mode: activity & sniper)
- Auction of the Day feature
- VIP-only auctions
- Auto-restart (3s delay)
- Timer extension on bids (10-15s)

### Payment Integration
- Stripe (LIVE keys configured)
- Bid packages
- Coinbase Commerce (disabled)

### Gift System (NEW)
- Customer numbers for all users
- Gift bids to friends/family
- Gift history tracking
- Notifications for recipients

### Influencer System
- Influencer login with code + email
- Free VIP access (never expires)
- 100 welcome bids
- Commission tracking (default 10%)
- Payout requests (min €50)
- Bank transfer / PayPal payouts

### Internationalization
- 5+ languages: DE, EN, TR, FR, SQ
- Multi-language product names
- Full page translations

## Technical Architecture

### Frontend
- React 18 with React Router
- Tailwind CSS + Shadcn/UI
- WebSocket for real-time updates
- i18n context for translations

### Backend
- FastAPI with async support
- MongoDB database
- JWT authentication
- WebSocket manager

### Key Files
- `/app/backend/server.py` - Main server + bot logic
- `/app/frontend/src/pages/Auctions.js` - Main auction display
- `/app/frontend/src/pages/Admin.js` - Admin panel (refactoring in progress)
- `/app/backend/routers/gifts.py` - Gift system
- `/app/backend/routers/influencer.py` - Influencer system

## Completion Status

### Completed (✅)
- User authentication
- Auction system with bots
- Stripe payments
- VIP system
- Influencer system with VIP + payouts
- Gift bidding system
- Multi-language support
- Admin panel (basic)

### In Progress (🔄)
- Admin.js refactoring (~45%)
- "Not Found" toast issue (mitigated)

### Pending (📋)
- 2FA implementation
- PayPal integration
- Live chat (needs Tawk.to ID)
- Router consolidation (user.py + users.py)

## Test Credentials
- **Admin:** admin@bidblitz.de / Admin123!
- **Customer:** kunde@bidblitz.de / Kunde123!
- **Influencer:** Code: demo, Email: demo@influencer.test

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### Auctions
- GET /api/auctions
- POST /api/auctions/{id}/bid
- GET /api/auction-of-the-day

### Gifts
- GET /api/gifts/my-customer-number
- GET /api/gifts/lookup/{number}
- POST /api/gifts/send
- GET /api/gifts/history

### Influencer
- POST /api/influencer/login
- GET /api/influencer/stats/{code}
- GET /api/influencer/payout/balance/{code}
- POST /api/influencer/payout/request/{code}

### VIP
- GET /api/vip/status
- GET /api/vip/plans

## Known Issues
1. Influencer login redirect sometimes fails (workaround: localStorage)
2. "Not Found" toast appears intermittently (404 interceptor added)
3. Data persistence may be lost on server restart

## Last Updated
January 31, 2026
