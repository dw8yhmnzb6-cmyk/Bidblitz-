# BidBlitz PRD - Aktuell

## Neue Features (Feb 28, 2026)

### Übersetzungen (DE/EN/SQ/TR/FR)
- mobilityTranslations.js: Zentrale Übersetzungsdatei für alle Mobility-Seiten
- ScooterGuide, HändlerFinder, SupportTickets, GroupRides - alle 5 Sprachen

### Geofencing System
- **11 Zonen** erstellt: Dubai + Pristina
- Zonentypen: parking, no_parking, speed_limit, service_area
- API: /api/geofencing/zones (öffentlich für Karten-Anzeige)
- API: /api/geofencing/check-location (prüft ob Parken erlaubt)
- API: /api/geofencing/track/{session_id} (Live-Tracking während Fahrt)

### Scooter-Tracking
- GPS-Punkte während Fahrt speichern
- Route nach Fahrt abrufbar
- Geschwindigkeits-Warnungen in Tempo-Zonen

### Verfügbarkeits-Alarm
- API: /api/geofencing/alerts/subscribe (Alarm setzen)
- Benachrichtigung wenn Scooter in der Nähe verfügbar wird
- Radius + Gerätetyp konfigurierbar

### Footer Reorganisiert
- EXTRAS → aufgeteilt in "Partner" und "Marketing"
- Partner: Händler-Portal, Partner Portal, Kassen-Terminal, Großkunden, Investoren
- Marketing: Influencer, Auto-Werbung, VIP

## Server: 212.227.20.190 | Admin: admin@bidblitz.ae
