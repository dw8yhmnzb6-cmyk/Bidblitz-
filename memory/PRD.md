# BidBlitz Super-App - PRD

## Architecture
Frontend: React + Tailwind + Leaflet | Backend: FastAPI | DB: MongoDB | Server: IONOS 212.227.20.190

## Level 18: KI-Support-Chatbot (March 2026)

### Features
- Keyword-based FAQ matching (12 categories: booking, payment, review, loyalty, taxi, host, account, pricing, escalation)
- Confidence scoring (0-1 based on keyword matches)
- Auto-escalation: "Ticket" keyword creates support ticket
- Session-based chat history (persist in MongoDB)
- Quick question buttons in UI
- Typing indicator animation
- Admin ticket management

### Collections
- support_chat (session_id, user_id, role USER/BOT, text, category, confidence)
- support_tickets_bot (session_id, user_id, reason, status OPEN/RESOLVED)

### Endpoints
- POST /api/support/chat — send message, get bot response
- GET /api/support/chat/history?session_id= — session history
- GET /api/support/chat/sessions — all user sessions
- GET /api/support/admin/tickets — bot-created tickets
- PATCH /api/support/admin/tickets/{id} — resolve ticket

### Frontend: /support
- Messenger-style chat UI with bot avatar "KI"
- Welcome message with usage hints
- Quick question chips (Stornierung, Check-in, Genius, Taxi, Erstattung)
- Ticket creation notification in chat

## All Levels: L1-18
Hotels, Taxi, Marketplace, Admin, Security, Monetization, Genius, Reviews, Chat, Push/PWA, Multi-Tenant, KI-Bot
