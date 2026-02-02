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
- Manager accounts (regional) - 3-tier hierarchy
- Referral System with rankings

### Auction System
- Real-time penny auctions with WebSocket updates
- Bot system (dual-mode: activity & sniper)
- Auction of the Day feature
- VIP-only auctions
- Auto-restart (3s delay)
- Timer extension on bids (10-15s)
- Beginner-Protection Auctions (<10 wins)
- **NEW: Bid Buddy / Auto-Bieter** - Automatic bidding system
- **NEW: Buy It Now** - Purchase with bid credit after losing
- **NEW: Countdown Alarm** - Notifications before auction ends

### Payment Integration
- Stripe (LIVE keys configured)
- Bid packages
- Happy Hour 2x Bids (18:00-20:00 Berlin)
- **NEW: Subscription Model** - Monthly bid packages (Basic €19.99, Pro €39.99, Elite €79.99)

### Gamification System
- **Glücksrad (Lucky Wheel)**: Daily spin for prizes
- **Wochen-Rangliste (Leaderboard)**: Top 10 win free bids
- **Bieter-Streak Bonus**: Consecutive bid bonuses
- **NEW: Achievements & Badges**: 18 achievements across 5 categories with bid rewards
- **Battle Pass System**: 50-tier progression with rewards
- **Mystery Box Auctions**: Hidden premium products
- **Levels System**: Bronze → Diamond progression

### Engagement Features
- **NEW: Video Testimonials**: Winner videos with upload rewards (+15 bids)
- **NEW: Win Notifications**: FOMO-inducing push notifications
- **Referral/Freunde-Bonus**: Invite friends, earn bids
- **Social Share Bonus**: Share wins on social media
- **Price Alerts**: Get notified when auctions drop below target

### Communication
- Telegram Bot (@BidBlitzBot)
- Push Notifications for ending auctions
- **Live Chat** (Tawk.to placeholder - needs configuration)
- Email notifications via Resend

## Technical Architecture

### Frontend
- React 18 with React Router
- Tailwind CSS + Shadcn/UI
- WebSocket for real-time updates
- i18n context for 10+ languages

### Backend
- FastAPI with async support
- MongoDB database
- JWT authentication
- WebSocket manager

### Key Files
- `/app/backend/server.py` - Main server + bot logic + all router imports
- `/app/frontend/src/App.js` - All frontend routes
- `/app/frontend/src/components/Navbar.js` - Navigation

## Completion Status (February 2, 2026)

### ✅ Completed - 10 New Customer Features
1. **Bid Buddy / Auto-Bieter** - Full backend + frontend
2. **Buy It Now** - Bid credit system with Stripe
3. **Subscription Model** - 3 tiers (Basic, Pro, Elite)
4. **Achievements & Badges** - 18 achievements, 5 categories
5. **Referral/Freunde-Bonus** - Page with stats and sharing
6. **Win Notifications** - FOMO notifications API
7. **Countdown Alarm** - Pre-auction-end notifications
8. **Video Testimonials** - Upload rewards + gallery
9. **Statistics & Insights** - Already implemented (MyStatsPage)
10. **Live Chat** - Tawk.to component (needs user's ID)

### 📋 Pending Items
- **Live Chat Activation**: Requires user's Tawk.to Property ID and Widget ID
- **Apple Login**: UI button added, needs Apple Developer credentials
- **Auction Duration Bug**: P2 - Admin form calculation issue
- **"Not Found" Toast**: P3 - Recurring issue (needs network tab debugging)
- **i18n Completion**: Some hardcoded text may exist

## Test Credentials
- **Admin:** admin@bidblitz.de / Admin123!
- **Customer:** kunde@bidblitz.de / Kunde123!
- **Influencer:** Code: demo, Email: demo@influencer.test
- **Manager (Berlin):** manager.berlin@bidblitz.de / Manager123!
- **Manager (Prishtina):** manager.prishtina@bidblitz.de / Prishtina2024!

## API Endpoints - New Features

### Bid Buddy
- POST /api/bid-buddy/activate - Activate auto-bidder
- DELETE /api/bid-buddy/deactivate/{auction_id} - Deactivate
- GET /api/bid-buddy/my-buddies - Get active bid buddies
- GET /api/bid-buddy/status/{auction_id} - Check status

### Buy It Now
- GET /api/buy-it-now/offers - Get available offers (after losing)
- GET /api/buy-it-now/offer/{auction_id} - Get specific offer
- POST /api/buy-it-now/purchase - Purchase with bid credit
- GET /api/buy-it-now/purchases - Purchase history

### Subscription
- GET /api/subscription/plans - Get all plans
- GET /api/subscription/my-subscription - User's subscription
- POST /api/subscription/subscribe - Subscribe to plan
- POST /api/subscription/cancel - Cancel subscription
- POST /api/subscription/reactivate - Reactivate

### Achievements
- GET /api/achievements/all - All 18 achievements
- GET /api/achievements/my-achievements - User's progress
- GET /api/achievements/progress - Progress towards next

### Testimonials
- GET /api/testimonials/videos - Get approved videos
- POST /api/testimonials/submit - Submit video
- POST /api/testimonials/{id}/like - Like video

### Countdown Alarm
- POST /api/countdown-alarm/set - Set alarm
- DELETE /api/countdown-alarm/remove/{auction_id} - Remove
- GET /api/countdown-alarm/my-alarms - User's alarms
- GET /api/countdown-alarm/status/{auction_id} - Check status

### Win Notifications
- GET /api/win-notifications/recent - Recent wins
- GET /api/win-notifications/preferences - User preferences
- POST /api/win-notifications/preferences - Update preferences

## Database Collections - New
- `bid_buddies` - Auto-bidder configurations
- `buy_it_now_purchases` - Buy It Now transactions
- `user_subscriptions` - Active subscriptions
- `pending_subscriptions` - Stripe pending
- `user_achievements` - Earned achievements
- `video_testimonials` - Winner videos
- `testimonial_likes` - Video likes
- `countdown_alarms` - User alarms
- `notification_preferences` - User notification settings
- `win_events` - Win notification events

## Test Reports
- `/app/test_reports/iteration_28.json` - 10 New Features Test (100% pass)
- Previous: iterations 1-27

## Mocked APIs
- **Resend Email**: Mock mode (no production key)
- **Tawk.to Live Chat**: Placeholder (needs user configuration)

## Last Updated
February 2, 2026

## Changelog

### February 2, 2026 - 10 Customer Features Implementation
- ✅ Implemented Bid Buddy (Auto-Bieter) - Backend router + Frontend page
- ✅ Implemented Buy It Now with bid credit (€0.50 per bid)
- ✅ Implemented Subscription Model (3 tiers with Stripe)
- ✅ Implemented Achievements System (18 badges, 5 categories)
- ✅ Implemented Video Testimonials page with upload rewards
- ✅ Implemented Win Notifications API
- ✅ Implemented Countdown Alarm system
- ✅ Implemented Referral/Freunde-Bonus page
- ✅ Created TawkToChat component for Live Chat
- ✅ Added new routes to App.js and Navbar.js
- ✅ Test Report: 100% success (23 backend + 4 frontend tests)

### Previous Sessions
- Manager System (3-tier hierarchy)
- Product Database update (72 new 2025/2026 products)
- Stripe payment fix (STRIPE_API_KEY)
- Influencer System with tiered commissions
- Admin Voice Commands
- Battle Pass System
- Mystery Box Auctions
- And many more...
