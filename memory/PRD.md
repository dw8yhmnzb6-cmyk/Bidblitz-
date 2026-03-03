# BidBlitz Super-App - Product Requirements Document

## Original Problem Statement
Build a full-featured "Super App" (BidBlitz) with multiple modules including Hotels (Airbnb-style), Auctions, Wallet, Genius loyalty, and more. The app uses a dark-themed UI, React frontend with Tailwind CSS, FastAPI backend, and MongoDB.

## Architecture
- **Frontend:** React + Tailwind CSS (served as static build via nginx)
- **Backend:** FastAPI with modular routers (systemd-managed)
- **Database:** MongoDB
- **Server:** IONOS VPS at 212.227.20.190
- **Domain:** bidblitz.ae

## Code Structure
```
/var/www/bidblitz/
├── backend/
│   ├── server.py
│   ├── config.py
│   ├── routers/
│   │   ├── hotels.py          # Guest-facing API (search, book, cancel) + 55 sample listings
│   │   ├── hotels_host.py     # Host-facing API (manage listings/bookings)
│   │   ├── hotels_level3.py   # Internal Payouts API (cron job)
│   │   ├── auth.py, genius.py, etc.
│   └── .env
├── frontend/
│   └── src/
│       ├── App.js
│       ├── components/Navbar.js
│       └── pages/
│           ├── HotelsPage.jsx
│           ├── HotelDetail.jsx
│           ├── HotelsHost.jsx
│           └── HotelBookings.jsx
```

## What's Been Implemented

### Hotels Module (COMPLETE)
- **Search & Filter:** 55 professional listings, region/city/type/price/superhost filters, sorting
- **Detail & Booking:** Full detail page with photo gallery, amenities, pricing breakdown, wallet-based booking
- **Host Dashboard:** Create/edit/activate listings, manage bookings
- **Booking History:** Guest and Host views with cancel/confirm/complete actions
- **Payouts:** Cron-triggered monthly host payouts via internal API
- **Mobile UI:** Fully responsive dark-themed pages for all hotel screens (completed Dec 2025)

### Mobile UI Improvements (COMPLETE - March 2026)
- Optimized all 4 hotel pages for mobile viewports
- Compact headers, smaller text sizes on mobile (text-xs/text-sm)
- Stacking layouts (flex-col on mobile, flex-row on desktop)
- Bottom padding for floating CTA on Hotels page
- Proper Unicode character encoding for German text
- data-testid attributes added throughout

## Pending/Upcoming Tasks

### P1 - Next
- Reviews & Ratings system for hotels
- Star-based filter (3★, 4★, 5★)
- Clean up obsolete routers (hotels_booking.py, hotels_airbnb.py)
- Create MongoDB indexes for genius/genius_events collections

### P2 - Future
- Chat between guests and hosts
- Genius loyalty link in navigation
- Insurance module
- Parking Finder module
- KI-Support-Chatbot
- App Store preparation

## Key API Endpoints
- `GET /api/hotels/listings` - Search listings
- `GET /api/hotels/listings/:id` - Get listing detail
- `POST /api/hotels/bookings` - Create booking
- `POST /api/hotels/bookings/:id/cancel` - Cancel booking
- `GET /api/hotels/bookings/my` - Guest bookings
- `GET /api/hotels/host/listings` - Host listings
- `POST /api/hotels/host/listings` - Create listing
- `GET /api/hotels/host/bookings` - Host bookings
- `POST /api/hotels/internal/payouts/run` - Cron payouts

## DB Collections
- `hotel_listings` - User-created listings
- `hotel_bookings` - Booking records
- Backend also serves 55 hardcoded SAMPLE_LISTINGS when DB is empty

## 3rd Party Integrations
- Resend (email)
- Google Maps
- Tawk.to (chat widget)

## Mocked Features
- Crypto Wallet
- OEM Scooter Hardware integration
