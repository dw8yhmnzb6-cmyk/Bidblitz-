# BidBlitz Super-App - PRD

## Architecture
Frontend: React + Tailwind + Leaflet | Backend: FastAPI | DB: MongoDB | Server: IONOS 212.227.20.190

## Level 16: Web Push + PWA + Background Sync (March 2026)

### Push Notifications
- VAPID keys configured, pywebpush installed
- Subscribe/unsubscribe via pushClient.js utility
- Triggers: chat messages, booking completion
- Admin test endpoint: POST /api/push/admin/send

### PWA
- manifest.json (standalone, BidBlitz branding)
- Service Worker v5: offline fallback, static caching, push handler, background sync
- offline.html fallback page
- Notification click → opens correct URL

### iOS Install
- IOSInstallHint component detects iOS Safari
- Shows "Teilen → Zum Home-Bildschirm" banner (dismissible)

### Background Sync
- offlineQueue.js: queues failed requests in localStorage
- Auto-replay on online event
- SW sync event handler for background replay

### Frontend Pages
- /settings/notifications — Push toggle + iOS install hint

### Files Created
- sw.js (v5), offline.html, pushClient.js, offlineQueue.js, PushSettings.jsx

### Files Modified
- hotel_chat.py (push trigger on messages)
- hotels_host.py (push on booking complete)
- server.py, App.js (route)

## All Levels: L1-16
Hotels, Taxi, Marketplace, Admin, Security, Monetization, Genius, Reviews, Chat, Push/PWA
