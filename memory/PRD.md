# BidBlitz Penny Auction - Product Requirements Document

## Original Problem Statement
Create a penny auction website modeled after `dealdash.com` and `snipster.de` with complete visual and functional features.

## Current Status (February 5, 2026)

### ✅ COMPLETE: Voice Debug Assistant (iOS/Safari Kompatibel) + Dark Mode + Verbesserte Fehlermeldungen

The BidBlitz auction platform now has:
- **86 Backend API Routers** - Full coverage of all features
- **74 Frontend Pages** - Complete user interface
- **🌙 Dark Mode Toggle** - Users can switch between Light and Dark themes
- **🎤 Voice Debug Assistant** - Cross-platform debugging for admins (iOS/Safari kompatibel)
- **✨ Verbesserte Fehlermeldungen** - "Bitte anmelden um zu bieten" statt generischem Fehler

---

## New Feature: Voice Debug Assistant 🎤🐛

### Description:
An AI-powered voice debugging assistant for the Admin Panel that allows admins to report bugs using voice recording.

### How it works:
1. **Click Record Button:** Press "Aufnahme starten" on Admin panel
2. **Voice Recording:** Describe the error in German or English (max 60 seconds)
3. **AI Analysis:** OpenAI Whisper transcribes, GPT-4o-mini analyzes
4. **Report Generation:** Creates detailed bug report with:
   - Description
   - Severity (low/medium/high/critical)
   - Possible causes
   - Affected files
   - Recommendations

### iOS/Safari Compatibility (NEW):
- Uses MediaRecorder API instead of Web Speech Recognition
- Supports multiple audio formats: audio/mp4, audio/webm, audio/ogg
- Dynamic MIME type detection for cross-browser support
- Longer timeslices (1000ms) for iOS stability

### Technical Implementation:
| Component | File | Description |
|-----------|------|-------------|
| Backend | `/routers/voice_debug.py` | API endpoints for transcription and analysis |
| Frontend | `/components/VoiceDebugAssistant.js` | Voice recording UI with iOS compatibility |
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
| Tawk.to Live Chat | MOCKED | Property ID |
| Resend Email | MOCKED | Working API Key |

---

## Files Created/Modified This Session

### New Files:
- `/backend/routers/voice_debug.py` - Voice debug backend with MongoDB persistence
- `/frontend/src/components/VoiceDebugAssistant.js` - Voice debug UI (iOS/Safari kompatibel)
- `/frontend/src/context/ThemeContext.js` - Dark mode context

### Modified Files:
- `/backend/server.py` - Added voice_debug_router
- `/frontend/src/App.js` - Added ThemeProvider
- `/frontend/src/components/Navbar.js` - Added Dark Mode toggle
- `/frontend/src/pages/Admin.js` - Added Voice Debug button
- `/frontend/src/index.css` - CSS variables + dark mode overrides
- `/frontend/src/pages/Notifications.js` - Fixed to light theme
- `/frontend/src/pages/Invoices.js` - Fixed to light theme
- `/frontend/src/pages/*.js` - Improved bidding error messages (401/403 handling)
- `~70 pages` - Light theme styling

---

## Debug Reports API (NEW)
Debug reports are now saved to MongoDB:
- `GET /api/admin/voice-debug/reports` - List all reports
- `PATCH /api/admin/voice-debug/reports/{id}/status` - Update status
- `DELETE /api/admin/voice-debug/reports/{id}` - Delete report

---

## Last Updated
February 5, 2026

## Next Steps (Priority Order)
1. ✅ Voice Debug Assistant iOS/Safari kompatibel
2. ✅ Debug Reports in MongoDB speichern
3. ✅ Verbesserte Bidding-Fehlermeldungen
4. ✅ Theme-Konsistenz (Notifications, Invoices Seiten)
5. 🔶 Remaining theme fixes (Contact, FAQ, HowItWorks, VIP pages)
6. 🔶 Activate WhatsApp/SMS notifications (API keys required)
7. 🔶 Implement Apple Sign-In (credentials required)
8. 🔶 Investigate 404 error root cause (currently suppressed)
9. 🔶 Admin.js refactoring (>1200 lines)
