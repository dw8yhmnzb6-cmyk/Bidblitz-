# BidBlitz Super-App - PRD

## Übersicht
BidBlitz ist eine Super-App mit über 50 Seiten und 90+ Routern - eine Enterprise-Grade Plattform für Auktionen, Zahlungen, Transport, Shopping, Mining und Games.

## Neue Features (März 2026)

### Match-3 Puzzle Game (NEU!)
- 8x8 Grid mit bunten Kugeln
- Tausche benachbarte Kugeln um 3+ zu matchen
- 20 Züge pro Spiel
- Combo-System (x1, x2, x3...)
- Score wird in Coins umgewandelt

### Glücksrad / Spin Wheel (NEU!)
- Animiertes Canvas-basiertes Rad
- 8 Segmente: 5, 10, 15, 25, 50, 100, 200, X (nichts)
- Einmal pro Tag drehen
- Smooth Easing-Animation (4 Sekunden)
- Gewinn wird automatisch gutgeschrieben

### Jackpot System (NEU!)
- Wachsender Pot (startet bei 200 Coins)
- Teilnahme kostet 5 Coins
- Coins werden zum Pot hinzugefügt
- Live-Teilnehmer-Anzeige

### VIP Level System (NEU!)
- 5 Level: Bronze → Silver → Gold → Platinum → Diamond
- Punkte für Aktionen sammeln
- Bonus-Prozent pro Level (0% bis 25%)
- Level-Schwellen: 0, 100, 300, 700, 1500 Punkte

### Super App Home
- Gradient Wallet Card mit Balance
- 8 Quick Access Items (Emoji-Icons)
- Daily Reward Card
- Jackpot Card mit Live-Pot
- VIP Level Card mit Punktestand
- Live Activity Feed

## Seiten

| Route | Seite | Beschreibung |
|-------|-------|--------------|
| `/super-app` | SuperAppMinimal | Home mit Jackpot/VIP |
| `/miner` | MinerDashboard | Mining Dashboard |
| `/miner-market` | MinerMarket | Miner Shop |
| `/games` | GamesHub | Games Übersicht |
| `/match3` | Match3Game | Match-3 Puzzle |
| `/spin-wheel` | SpinWheel | Glücksrad |
| `/app-wallet` | AppWallet | Wallet + Chart |

## Backend-Endpoints

### Games
- `POST /api/app/games/play` - Spiel spielen

### Spin Wheel
- `GET /api/app/spin/status` - Kann heute drehen?
- `POST /api/app/spin/claim` - Gewinn abholen

### Jackpot
- `GET /api/app/jackpot/current` - Aktueller Pot
- `POST /api/app/jackpot/join` - Teilnehmen (5 Coins)

### VIP
- `GET /api/app/vip/status` - VIP Status
- `POST /api/app/vip/add-points` - Punkte hinzufügen

## Datenbank-Collections

- `spin_history`: Glücksrad-Verlauf
- `jackpot`: Aktueller Jackpot
- `jackpot_entries`: Teilnehmer
- `vip_levels`: VIP Punkte pro User

## Tech Stack
- **Frontend:** React, TailwindCSS, Canvas API
- **Backend:** FastAPI, Python, MongoDB
- **Design:** Dark theme (#0c0f22), mobile-first

## Getestet
- ✅ Match-3 Grid rendert und ist spielbar
- ✅ Glücksrad dreht sich mit Animation
- ✅ Spin Win: +200 Coins gewonnen
- ✅ Jackpot: Join funktioniert, Pot wächst
- ✅ VIP: Bronze Level, Punkte sammeln
- ✅ Live Activity zeigt echte Aktivitäten

## Nächste Schritte
- [ ] Schatzsuche Mini-Game
- [ ] Slot Machine
- [ ] Jackpot Gewinner-Ziehung
- [ ] VIP Bonus bei Mining anwenden
