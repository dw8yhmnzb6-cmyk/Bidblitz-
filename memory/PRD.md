# BidBlitz PRD

## Aktueller Stand: Komplett-System LIVE auf bidblitz.ae

### Scooter-App (Lime-Style)
- Echte Leaflet-Karte mit OpenStreetMap
- Scooter-Marker mit Akku-Farbe (gruen/gelb/rot)
- User-Position (blauer Punkt)
- Bottom-Sheet: Details, Reservieren, Klingeln, Problem melden
- QR-Scanner + manuelle Seriennummer
- Aktive Fahrt: Timer, Kosten, Beenden
- Sidebar: Wallet, Abo, Gruppen, Verlauf, Hilfe, Einstellungen
- Abo-Badge auf Karte wenn aktiv

### Abo-Integration
- Bei aktivem Abo: Entsperrgebuehr = 0 EUR (Backend prüft automatisch)
- Unlimited-Plan: Auch Minutenpreis = 0 EUR
- Abo-Status in ScooterApp sichtbar

### Push Notifications
- Service Worker mit Push-Event-Handler
- VAPID-Key Subscription Flow
- Automatische Prompt-Banner nach Login (3 Sek Delay)
- "Aktivieren" / "Nicht jetzt" Buttons
- Auto-Subscribe bei bereits erteilter Erlaubnis
- Backend sendet Notifications für Auktionen, Fahrten, Angebote

### Caching (Auto-Update für Kunden)
- index.html: no-cache (immer neueste Version)
- Static JS/CSS: 1 Jahr Cache (Hash im Dateinamen)
- Nginx serviert direkt aus build/ (kein Node.js Server nötig)

## Alle Seiten
/scooter, /scooter-abo, /gruppen-fahrt, /scooter-bewertungen
/scooter-guide, /haendler-finder, /support-tickets, /loans, /auctions

## Credentials
- Admin: admin@bidblitz.ae / AfrimKrasniqi123
- Server: 212.227.20.190 / root / neew7ky3xhyt3H
