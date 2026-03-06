# BidBlitz Super-App - PRD

## Übersicht
BidBlitz ist eine Super-App mit Auktionen, Mining, Games, und vielen Services.

## Design System (März 2026)

### Farben
- **Background:** `#0c0f22`
- **Cards:** `#1c213f`
- **Accent:** `#6c63ff`
- **Gold Coin:** `linear-gradient(135deg, #ffd700, #ffae00)`

### Bottom Navigation (Emoji)
| Tab | Emoji | Route |
|-----|-------|-------|
| Home | 🏠 | `/super-app` |
| Wallet | 💰 | `/app-wallet` |
| Games | 🎮 | `/games` |
| Mining | ⛏️ | `/miner` |
| Market | 🛒 | `/miner-market` |

### Animierte 3D-Münze
```css
@keyframes spinY {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}
animation: spinY 4s linear infinite;
```

## Seiten

### Home (`/super-app`)
- BidBlitz Welcome Card mit animierter 3D-Münze
- Quick Access: Taxi, Scooter, Auctions, Games
- Daily Reward Card
- Jackpot Card (205+ Coins)
- VIP Level Card (Bronze → Diamond)
- Live Activity Feed

### Wallet (`/app-wallet`)
- Balance groß angezeigt
- "Add Coins" Button

### Games (`/games`)
- Quick Play Button
- Game Links: Match-3, Glücksrad, Slot Machine, Schatzsuche

### Mining (`/miner`)
- Power: X TH (cyan)
- Reward: X Coins/day (grün)
- Your Miners Liste mit Upgrade Buttons
- "Buy Miners" Link

### Market (`/miner-market`)
- Balance Anzeige
- Alle 5 Miner mit Preisen:
  - Nano Miner S1 — 100 Coins
  - Basic Miner B1 — 500 Coins
  - Pro Miner P1 — 2000 Coins
  - Elite Miner E1 — 8000 Coins
  - Ultra Miner U1 — 25000 Coins

## Features

### Games
- Match-3 Puzzle (`/match3`)
- Glücksrad (`/spin-wheel`)
- Quick Play (10-50 Coins)

### Mining
- 5 Miner-Tiers
- 10 Upgrade-Level pro Miner
- Daily Claim (24h Cooldown)
- VIP Bonus

### Economy
- Jackpot System (wachsender Pot)
- VIP Levels (5 Stufen)
- Daily Rewards (7-Tage Streak)

## Tech Stack
- React + TailwindCSS
- FastAPI + MongoDB
- Canvas API für Animationen

## Nächste Schritte
- [ ] Schatzsuche Game
- [ ] Slot Machine
- [ ] Referral System
