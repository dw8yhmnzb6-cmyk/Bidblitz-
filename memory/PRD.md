# BidBlitz PRD - Product Requirements Document

## Original Problem Statement
BidBlitz is a penny auction platform (React frontend, FastAPI backend, MongoDB). The platform has expanded to include:
1. Core auction platform with real-time bidding, bots, WebSocket updates
2. Mandatory KYC verification flow
3. Scooter/Device unlock system with support tickets and microfinance
4. CI/CD pipeline via GitHub Actions
5. Admin dashboard with comprehensive management tools

## Architecture
- **Frontend:** React (CRA) with TailwindCSS + Shadcn UI
- **Backend:** FastAPI with modular routers
- **Database:** MongoDB (Local on IONOS production, Atlas for development)
- **Deployment:** IONOS server (212.227.20.190), GitHub Actions CI/CD
- **Production URL:** bidblitz.ae

## What's Been Implemented

### Core Platform
- Real-time penny auction system with WebSocket
- Bot bidding system (auto-bidding)
- User registration, login, KYC verification
- Admin dashboard with comprehensive tools

### Auctions (Feb 2026)
- 30 new auctions with real Unsplash product photos
- All starting at €0.01 (1 cent)
- Mixed categories: Elektronik, Mode, Uhren, Haus & Garten, Sport
- Special types: Night, VIP, Beginner auctions
- Active bots on all auctions
- Fixed /api/auctions/recent-winners 404 endpoint

### Mobility / Scooter System
- **ScooterApp.jsx** - User-facing scooter rental with map, QR scanner, ride tracking
- **Backend routers:** devices.py, support_tickets.py, microfinance.py
- **Admin components:** AdminDevices, AdminTickets, AdminLoans, AdminOrganizations, AdminMobilityDashboard, AdminFleetManagement
- All admin components optimized for mobile (card layout on mobile, table on desktop)

### User-Facing Pages (NEW - Feb 27, 2026)
- **/support-tickets** - Users can create, view and reply to support tickets
- **/loans** (+ /kredite) - Microfinance: Users can apply for €50-€5000 loans, track status, repay
- **/scooter** (+ /mobility) - Scooter rental with map and QR unlock

### Mobile Responsive Fixes (Feb 27, 2026)
- AdminTickets: Stacked layout on mobile with back button
- AdminDevices: Card layout on mobile, table on desktop
- AdminOrganizations: Card layout with grid stats on mobile

## Pending Issues
- P1: E2E verification of CI/CD pipeline
- P2: Complete KYC upload/approval flow test

## Backlog
- Push Notifications
- Händler-Finder (Map View for merchants)
- WhatsApp Integration
- App Store submission
- Refactor large components

## Key Routes
- /auctions - Auction listing
- /scooter, /mobility - Scooter rental
- /support-tickets, /meine-tickets - Support tickets
- /loans, /kredite - Micro loans
- /admin - Admin dashboard

## Credentials
- Admin: admin@bidblitz.ae / AfrimKrasniqi123
- Server: 212.227.20.190 / root / neew7ky3xhyt3H
- GitHub: dw8yhmnzb6-cmyk/bidblitz

## Important: Database Configuration
- **Production (IONOS):** Uses LOCAL MongoDB (mongodb://localhost:27017/bidblitz)
- **Preview (Emergent):** Uses MongoDB Atlas
- Changes to data must be made on BOTH databases or directly on production
