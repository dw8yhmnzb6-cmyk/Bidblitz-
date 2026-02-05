# BidBlitz Penny Auction - Product Requirements Document

## Original Problem Statement
Create a penny auction website modeled after `dealdash.com` and `snipster.de` with complete visual and functional features.

## Current Status (February 5, 2026)

### ✅ COMPLETE: Voice Debug Assistant + Dark Mode Toggle

The BidBlitz auction platform now has:
- **86 Backend API Routers** - Full coverage of all features
- **74 Frontend Pages** - Complete user interface
- **🌙 Dark Mode Toggle** - Users can switch between Light and Dark themes
- **🎤 Voice Debug Assistant** - Hotword-activated debugging for admins

---

## New Feature: Voice Debug Assistant 🎤🐛

### Description:
An AI-powered voice debugging assistant for the Admin Panel that allows admins to report bugs using voice commands.

### How it works:
1. **Hotword:** Say "Hey BidBlitz" to activate
2. **Voice Recording:** Describe the error in German or English
3. **AI Analysis:** OpenAI Whisper transcribes, GPT-4o-mini analyzes
4. **Report Generation:** Creates detailed bug report with:
   - Description
   - Severity (low/medium/high/critical)
   - Possible causes
   - Affected files
   - Recommendations

### Technical Implementation:
| Component | File | Description |
|-----------|------|-------------|
| Backend | `/routers/voice_debug.py` | API endpoints for transcription and analysis |
| Frontend | `/components/VoiceDebugAssistant.js` | Voice recording UI and report display |
| Admin Integration | `/pages/Admin.js` | Floating button and modal |

### API Endpoints:
- `POST /api/admin/voice-debug/transcribe` - Transcribe audio only
- `POST /api/admin/voice-debug/analyze` - Transcribe + AI analysis
- `GET /api/admin/voice-debug/reports` - Get all debug reports

### Requirements:
- Admin or Manager role required
- Microphone access
- EMERGENT_LLM_KEY for OpenAI Whisper

---

## Feature: Dark Mode Toggle 🌙☀️

### Description:
Toggle between Light (Cyan/Turquoise) and Dark (Obsidian Black) themes.

### How it works:
1. Click Sun/Moon icon in Navbar
2. Theme instantly switches
3. Preference saved to localStorage

### Color Palettes:
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | #ECFEFF → #CFFAFE | #050509 |
| Cards | #FFFFFF | #181824 |
| Text Primary | #1F2937 | #F8FAFC |
| Accent | #F59E0B | #F59E0B |

---

## All Features Summary

### Gamification ✅
Achievements, Levels, Daily Quests, Battle Pass, Lucky Wheel, Streak Protection

### Monetization ✅
Stripe Payments, Bid Packages, VIP Subscription, Gift Cards, Crypto Payments

### Social ✅
Friend Battle, Team Auctions, Referrals, Leaderboard, Winner Gallery

### AI & Personalization ✅
AI Bid Recommendations, Deal Radar, Price Alerts, Wishlist

### Admin Tools ✅
- Dashboard with stats
- User management
- Bot management
- Voice Debug Assistant (NEW!)
- AI Chat Assistant

---

## Test Credentials
- **Admin:** admin@bidblitz.de / Admin123!
- **Manager:** manager.prishtina@bidblitz.de / Manager123!

## Mocked Services
| Service | Status | Required |
|---------|--------|----------|
| WhatsApp | MOCKED | API Token |
| Twilio SMS | MOCKED | Credentials |
| Apple Login | MOCKED | Dev Credentials |

---

## Files Created/Modified This Session

### New Files:
- `/backend/routers/voice_debug.py` - Voice debug backend
- `/frontend/src/components/VoiceDebugAssistant.js` - Voice debug UI
- `/frontend/src/context/ThemeContext.js` - Dark mode context

### Modified Files:
- `/backend/server.py` - Added voice_debug_router
- `/frontend/src/App.js` - Added ThemeProvider
- `/frontend/src/components/Navbar.js` - Added Dark Mode toggle
- `/frontend/src/pages/Admin.js` - Added Voice Debug button
- `/frontend/src/index.css` - CSS variables + dark mode overrides
- `~70 pages` - Light theme styling

---

## Last Updated
February 5, 2026

## Next Steps
1. Activate WhatsApp/SMS notifications (API keys required)
2. Implement Apple Sign-In (credentials required)
3. Save debug reports to MongoDB database
