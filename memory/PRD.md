# BidBlitz Super-App - PRD

## Übersicht
BidBlitz ist eine Super-App mit Auktionen, Mining, Games, Mobilität, Chat und vielen Services.

## Implementierte Features (März 2026)

### ✅ Kernsystem
- **Backend:** FastAPI mit MongoDB (PERSISTENT!)
- **Frontend:** React mit TailwindCSS
- **Auth:** JWT-basiert mit Demo-User Support

### ✅ Mining System (mit VIP Bonus!)
- 5 Miner-Tiers (Nano → Ultra)
- 10 Upgrade-Level pro Miner
- Daily Claim (24h Cooldown)
- Mining Stats & History
- Globale Pool-Statistiken
- **VIP 2+:** +10% Mining Profit
- **VIP 3+:** +20% Mining Profit

### ✅ Games (10+ Spiele!)
| Spiel | Route | Gewinn |
|-------|-------|--------|
| Lucky Wheel | /games | 0-100 Coins |
| Slot Machine | /games | -50 bis +150 |
| Reaction | /games | 0-20 Coins |
| Daily Bonus | /games | 50 Coins |
| Dice | /games | 0-60 Coins |
| Coin Flip | /games | +30 oder -10 |
| Bomb Game | /games | +100 oder -50 |
| Jackpot | /games | 0-500 Coins |
| Puzzle | /games | 20 Coins |
| Boost Game | /games | 0-150 Coins |
| Match-3 | /match3 | Variable |
| Schatzsuche | /treasure-hunt | 50-200 Coins |

### ✅ VIP Exclusive Games (`/vip-games`)
- **VIP 5 erforderlich** (20.000+ Coins)
- Diamond Rush, Gold Strike, Crown Jackpot, VIP Slots
- 10x höhere Gewinne als normale Spiele

### ✅ Mobilität
- **🚕 Taxi** (`/taxi`) - Buchung mit Coins, Fahrer-Details
- **🛴 E-Scooter** (`/scooter`) - Mieten, Batterie-Anzeige, Live-Kosten

### ✅ VIP System (`/app-vip`)
| Level | Coins | Benefit |
|-------|-------|---------|
| VIP 1 | 0-2.000 | Normal Rewards |
| VIP 2 | 2.001-5.000 | +10% Mining Profit |
| VIP 3 | 5.001-10.000 | +20% Mining Profit |
| VIP 4 | 10.001-20.000 | -10% Marketplace Fees |
| VIP 5 | 20.001+ | Exclusive Games |

### ✅ Achievements System (`/app-achievements`) - NEU!
- 16 Achievements in 5 Kategorien:
  - Coins (Erste 100, 1k, 10k, 100k)
  - Games (1, 10, 100, 1000 Spiele)
  - Mining (1, 5, 10 Miner)
  - Referrals (1, 5, 20 Freunde)
  - Special (VIP 5, 7-Tage Streak)
- Fortschrittsbalken für nicht freigeschaltete
- Punkte-System

### ✅ Notifications (`/app-notifications`) - NEU!
- Mining Reward bereit
- Jackpot Updates
- Referral Benachrichtigungen
- Einstellungen für Benachrichtigungstypen
- Ungelesen-Zähler

### ✅ Chat System (`/app-chat`) - NEU!
- Echtzeit-Chat zwischen Spielern
- System-Nachrichten (Jackpot-Gewinne, Pool-Updates)
- Quick-Messages (👋 Hi!, 🎉 GG!, etc.)
- Online-Nutzer Anzeige
- Auto-Scroll zu neuen Nachrichten

### ✅ Marketplace (`/market`) - NEU!
- Miner, Boosts, Items kaufen/verkaufen
- VIP 4+ Rabatt: 10% auf alle Käufe
- 5% Verkaufsgebühr
- Verkäufer-Info und Preishistorie

### ✅ Sound-Effekte (`/sound-settings`) - NEU!
- 9 verschiedene Sound-Effekte:
  - Coin, Gewinn, Verlust, Klick
  - Achievement, Benachrichtigung
  - Spin, Mining, Level Up
- Lautstärke-Regler (0-100%)
- Ein/Aus Toggle
- Web Audio API (keine externen Dateien)

### ✅ Weitere Features
- **Profile** (`/app-profile`) - Stats, Level-System, XP
- **Statistics** (`/app-statistics`) - Platform-wide Stats
- **Leaderboard** (`/app-leaderboard`) - Top Miner, Spieler, Werber
- **Referral** (`/app-referral`) - Invite Codes, Bonus-System

## Navigation

### Bottom Navigation (5 Tabs)
| Tab | Emoji | Route |
|-----|-------|-------|
| Home | 🏠 | `/super-app` |
| Wallet | 💰 | `/app-wallet` |
| Games | 🎮 | `/games` |
| Mining | ⛏️ | `/miner` |
| Friends | 👥 | `/app-referral` |

### Home Menu (8 Items)
| Item | Emoji | Route |
|------|-------|-------|
| Taxi | 🚕 | `/taxi` |
| Scooter | 🛴 | `/scooter` |
| Games | 🎮 | `/games` |
| Mining | ⛏️ | `/miner` |
| Marketplace | 🛍️ | `/market` |
| Rewards | 🎁 | `/daily` |
| Referral | 👥 | `/app-referral` |
| Settings | ⚙️ | `/app-profile` |

## Alle Routen

### Super-App Seiten
- `/super-app` - Home
- `/games` - Game Center (10 Spiele)
- `/miner` - Mining Dashboard
- `/miner-market` - Miner kaufen
- `/app-wallet` - Wallet
- `/app-profile` - Profile
- `/app-vip` - VIP Status
- `/vip-games` - VIP Exclusive Games
- `/taxi` - Taxi Buchung
- `/scooter` - E-Scooter
- `/app-referral` - Referral System
- `/app-leaderboard` - Ranglisten
- `/app-achievements` - Achievements
- `/app-notifications` - Benachrichtigungen
- `/app-chat` - Chat
- `/market` - Marketplace
- `/app-statistics` - Platform Stats
- `/sound-settings` - Sound-Einstellungen
- `/match3` - Match-3 Spiel
- `/treasure-hunt` - Schatzsuche
- `/spin-wheel` - Glücksrad

## Changelog

### 2026-03-07 (Update 3)
- ✅ Achievements System (16 Badges, Punkte)
- ✅ Notifications Center
- ✅ Chat System (Echtzeit)
- ✅ Marketplace (Kaufen/Verkaufen)
- ✅ Sound-Effekte (9 Sounds, Web Audio API)

### 2026-03-06 (Update 2)
- ✅ Taxi & Scooter Buchung
- ✅ VIP Benefits in Mining
- ✅ VIP Exclusive Games
- ✅ Platform Statistics

### 2026-03-06 (Update 1)
- ✅ Home Redesign, Game Center, Profile, VIP

## Tech Stack
- React + TailwindCSS (Frontend)
- FastAPI + Python (Backend)
- MongoDB Atlas (Database)
- Web Audio API (Sounds)
