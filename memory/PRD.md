# BidBlitz Super-App - PRD

## Übersicht
BidBlitz ist eine Super-App mit über 50 Seiten und 90+ Routern - eine Enterprise-Grade Plattform für Auktionen, Zahlungen, Transport, Shopping und Services.

## Neue Features (März 2026)

### Mining-System (GoMining-Style)
- **MinerDashboard** (`/miner`): Professionelles dark-theme Dashboard
  - Animierte Coin-Counter
  - Stats-Grid (Coins, Hashrate, Power, Daily Reward)
  - Mining Farm Übersicht mit Miner-Karten
  - VIP-Level System basierend auf Hashrate
  - Belohnungen sammeln (24h Cooldown)
  
- **MinerMarket** (`/miner-market`): Shop für Miner
  - 5 Miner-Tiers: Bronze, Silver, Gold, Platinum, Diamond
  - Spezielle Deals und Bundles
  - ROI-Berechnung
  - Test-Coins für Entwicklung

- **Backend-Endpoints:**
  - `GET /api/app/wallet/balance` - Coin-Guthaben
  - `POST /api/app/wallet/add-coins` - Test-Coins hinzufügen
  - `GET /api/app/miners/catalog` - Alle verfügbaren Miner
  - `GET /api/app/miners/my` - Eigene Miner
  - `POST /api/app/miner/buy` - Miner kaufen
  - `POST /api/app/miner/upgrade` - Miner upgraden
  - `GET /api/app/miner/claim` - Belohnungen sammeln
  - `GET /api/app/mining/stats` - Mining-Statistiken
  - `GET /api/app/market/miners` - Markt-Miner
  - `GET /api/app/market/deals` - Aktuelle Deals

## Bestehende Module

### Core Features
- Hotels (55 Listings, Reviews, Verifizierung, dynamische Preise, Loyalty)
- Taxi (Rider + Driver App, Nearby Drivers)
- Marketplace (Produkte, Autos, Immobilien, Services)
- Games (Match-3 mit Levels + Leaderboard)

### Monetarisierung
- Boosts, Featured Listings, Subscriptions
- Genius Loyalty (3 Level, Auto Level-up)
- BidBlitz Plus Abonnement

### Engagement
- Chat (Guest-Host, Admin Escalation)
- Push (VAPID, PWA, Service Worker)
- Daily Rewards, Missions, Weekly Leagues
- Social Feed + Stories
- Spin & Win

### Admin & Sicherheit
- KYC + Risk Control
- Multi-Tenant SaaS (White-Label)
- Revenue Engine (Fees, Ledger, Payouts, Invoices)

## Tech Stack
- **Frontend:** React, TailwindCSS, Lucide Icons
- **Backend:** FastAPI, Python
- **Database:** MongoDB
- **Hosting:** Emergent Preview / IONOS Production

## Datenbank-Schema

### Mining Collections
- `app_wallets`: `{user_id, coins, total_earned, total_spent}`
- `app_miners`: `{user_id, miners: [{id, type_id, level, is_active, last_claim, total_mined}]}`
- `mining_history`: `{user_id, amount, miners_claimed, claimed_at}`

## Bekannte Probleme
1. **KRITISCH:** Einige ältere Features nutzen in-memory Dicts statt MongoDB
2. Veraltete Router-Dateien sollten entfernt werden
3. Fehlende MongoDB-Indexes für `genius` und `genius_events`

## Nächste Schritte
- [ ] Mining-Verlauf Seite implementieren
- [ ] VIP-Bonusberechnung verfeinern
- [ ] Match-3 Spiel UI/UX verbessern
- [ ] White-Label Demo für Multi-Tenant
- [ ] In-Memory Daten auf MongoDB migrieren
