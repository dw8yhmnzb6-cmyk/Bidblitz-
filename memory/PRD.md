# BidBlitz Gaming Platform - PRD

## Original Problem Statement
Build a complete gaming platform called BidBlitz with games, auctions, mobility services, and a coin-based economy. The user requested migration from MongoDB to PostgreSQL and deployment on IONOS server.

## User Personas
- **Gamers**: Play mini-games to earn coins
- **Auction Users**: Bid on products using coins
- **Admins**: Manage platform, users, and economy

## Tech Stack
- **Frontend**: React, Tailwind CSS
- **Backend**: FastAPI, Pydantic
- **Database**: MongoDB (current) → PostgreSQL (migration in progress)
- **Server**: IONOS (212.227.20.190)

---

## ✅ Completed Features

### March 10, 2025 - Gaming Platform
- [x] GamePlatform.jsx with 29 games
- [x] Category filters (Puzzle, Arcade, Tycoon, Strategy, 3D)
- [x] Games API (`/api/games/*`)
- [x] Leaderboard system
- [x] Coin economy integration

### March 10, 2025 - PostgreSQL Preparation
- [x] SQLAlchemy models (`pg_models.py`)
- [x] Async database config (`database.py`)
- [x] Alembic migration setup
- [x] Migration script (`migrate_to_postgres.py`)
- [x] Server configuration files

---

## 🔴 P0 - Critical (In Progress)

### IONOS Deployment Fix
- **Status**: READY TO DEPLOY
- **Issue**: Live site shows old version
- **Solution**: Quick fix script created
- **Files**: `/app/server-config/quick-fix.sh`

### PostgreSQL Migration
- **Status**: PREPARED
- **Next Step**: Run on IONOS server
- **Database**: bidblitz_db
- **User**: bidblitz
- **Password**: BidBlitz2024SecureDB!

---

## 🟠 P1 - High Priority

1. **Run Quick Fix on IONOS**
   - SSH to server
   - Execute quick-fix.sh
   - Clear browser cache

2. **Install PostgreSQL on IONOS**
   - apt install postgresql
   - Create database and user
   - Configure backend .env

3. **Run Data Migration**
   - MongoDB → PostgreSQL
   - Verify data integrity
   - Switch backend to PostgreSQL

---

## 🟡 P2 - Medium Priority

1. **Codebase Cleanup**
   - Remove ~200 old files from /frontend/src/pages
   - Consolidate duplicate components

2. **Full i18n Implementation**
   - Replace hardcoded German text
   - Add language switcher

---

## Key API Endpoints

### Games API
- `GET /api/games` - List all games
- `GET /api/games/categories` - Get categories
- `POST /api/games/score` - Submit score
- `GET /api/games/leaderboard/global/top` - Leaderboard

### User API
- `GET /api/bbz/coins/{user_id}` - Get coin balance
- `POST /api/bbz/coins/earn` - Earn coins

---

## Test Credentials
- **Admin**: admin@bidblitz.ae / admin123
- **Customer**: kunde@bidblitz.ae / test123

---

## Server Configuration

### IONOS Server
- **IP**: 212.227.20.190
- **User**: root
- **Path**: /var/www/bidblitz

### PostgreSQL (To be installed)
- **Host**: localhost
- **Port**: 5432
- **Database**: bidblitz_db
- **User**: bidblitz
- **Password**: BidBlitz2024SecureDB!

---

## Changelog

### 2025-03-10
- Created PostgreSQL migration infrastructure
- Updated deploy.yml with cache clearing
- Created server configuration files
- Created quick-fix.sh for rapid deployment repair
