# BidBlitz Penny Auction Platform - PRD

## Letztes Update: 21. Januar 2026

## Original-Anforderung
Der Benutzer hat eine Penny-Auktions-Website nach dem Vorbild von `dealdash.com` und `snipster.de` angefordert, mit einer Kunden-App und einem Admin-Panel.

## Was wurde implementiert

### Session 21. Januar 2026 - Vollständige i18n-Migration
- **Auctions.js** - Vollständig übersetzt (DE, EN, SQ, TR, FR)
- **Login.js** - Vollständig übersetzt
- **Register.js** - Vollständig übersetzt
- **Contact.js** - Vollständig übersetzt mit Dubai-Adresse
- **FAQ.js** - Vollständig neu geschrieben mit mehrsprachigem Inhalt
- **BuyBids.js** - Vollständig übersetzt
- **Winners.js** - Vollständig übersetzt
- **Dashboard.js** - Teilweise übersetzt (Haupttexte)
- **HowItWorks.js** - War bereits übersetzt

### Unterstützte Sprachen
1. Deutsch (DE) - Standard
2. English (EN)
3. Shqip/Albanisch (SQ)
4. Türkçe (TR)
5. Français (FR)

### Neue Dateien erstellt
- `/app/frontend/src/i18n/pageTranslations.js` - Zentrale Übersetzungsdatei für Seiten

### Früher implementierte Funktionen
- Admin Content Management System für statische Seiten
- Globales Auto-Restart für beendete Auktionen
- Bot-System für VIP-Auktionen
- Bedingte Krypto-Zahlungen (deaktiviert wenn API-Key ungültig)
- Dubai-Firmeninformationen in legalen Seiten
- Albanische Sprachunterstützung

## Architektur
```
/app/
├── backend/
│   ├── server.py          # FastAPI mit Background Tasks
│   ├── routers/           # API-Routen
│   └── .env               # DB_NAME=bidblitz_production
├── frontend/
│   ├── src/
│   │   ├── pages/         # React-Seiten mit i18n
│   │   ├── i18n/          # Übersetzungsdateien
│   │   │   ├── translations.js
│   │   │   └── pageTranslations.js
│   │   └── context/       # Language & Auth Context
│   └── .env
└── DEPLOYMENT_GUIDE.md
```

## Noch zu erledigen (Backlog)

### P1 - Hoch
- [ ] PayPal-Integration
- [ ] Push-Benachrichtigungen bei Überbieten
- [ ] Admin-Panel i18n (hardcodierte deutsche Texte)

### P2 - Mittel
- [ ] VIP.js i18n
- [ ] Profile.js i18n
- [ ] InviteFriends.js i18n
- [ ] Mehr Auktionen erstellen (~100)

### P3 - Niedrig
- [ ] Wunschliste & Auktion des Tages
- [ ] Gewinner-Galerie erweitern
- [ ] E-Mail-Konfiguration (Production)
- [ ] Datenpersistenz-Audit

## Test-Zugangsdaten
- **Admin:** admin@bidblitz.de / Admin123!
- **Kunde:** kunde@bidblitz.de / Kunde123!
- **Test:** afrimk@me.com / Test123!

## Bekannte Einschränkungen
- Resend E-Mail ist im Sandbox-Modus
- Coinbase Commerce ist deaktiviert (Platzhalter-API-Key)
