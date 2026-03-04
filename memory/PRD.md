# BidBlitz Super-App - PRD

## Architecture
Frontend: React + Tailwind + Leaflet | Backend: FastAPI | DB: MongoDB | Server: IONOS 212.227.20.190

## Level 15: In-App Chat (March 2026)

### Features
- Chat per booking (Guest <-> Host), thread auto-created
- Real-time polling (5s interval), unread badges, inbox
- Admin escalation: support tickets with reason + notes
- Admin can respond in escalated threads
- In-app notifications on new messages
- System messages for escalation events

### Collections
- chat_threads (per booking, unread counters per role)
- chat_messages (TEXT/IMAGE/SYSTEM, sender_role)
- support_tickets (OPEN/IN_PROGRESS/RESOLVED)
- notifications (in-app)

### Endpoints (hotel_chat.py)
- POST /api/hotels/chat/thread — create/get thread
- GET /api/hotels/chat/thread/{bookingId} — thread + messages
- POST /api/hotels/chat/send — send message
- POST /api/hotels/chat/read — mark read
- GET /api/hotels/chat/inbox — all user threads + unread count
- POST /api/hotels/chat/escalate — create support ticket
- GET /api/hotels/chat/admin/tickets — admin ticket list
- PATCH /api/hotels/chat/admin/tickets/{id} — update ticket
- POST /api/hotels/chat/admin/tickets/{id}/message — admin reply

### Notifications (notifications_inapp.py)
- GET /api/notifications/my
- POST /api/notifications/read/{id}

### Frontend
- /chat — Inbox with unread badges
- /chat/:bookingId — Chat thread with send, escalation modal

## Previous: L1-14 (Hotels, Taxi, Marketplace, Admin, Security, Monetization, Genius, Reviews)
## Pending: Insurance, Parking, KI-Chatbot, App Store, Analytics, Push Notifications
