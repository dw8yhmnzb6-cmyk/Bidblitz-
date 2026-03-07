"""
BidBlitz Games System - SQLite Version
Wallet, Games (from DB), Leaderboard
"""
from fastapi import APIRouter
import sqlite3
import random
import time
import os

router = APIRouter(prefix="/bbz-lite", tags=["BBZ Games SQLite"])

# SQLite Database
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bidblitz_games.db")

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()

# Tabellen erstellen
cursor.execute("""
CREATE TABLE IF NOT EXISTS users(
    user_id TEXT PRIMARY KEY,
    coins INTEGER DEFAULT 0
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS games(
    id INTEGER PRIMARY KEY,
    name TEXT,
    category TEXT,
    reward INTEGER,
    url TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS daily_rewards(
    user_id TEXT PRIMARY KEY,
    last_claim INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS game_plays(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    game_id INTEGER,
    reward INTEGER,
    played_at INTEGER
)
""")

conn.commit()

# Spiele in DB einfügen (nur wenn leer)
cursor.execute("SELECT COUNT(*) FROM games")
if cursor.fetchone()[0] == 0:
    cursor.executemany("""
        INSERT INTO games(name, category, reward, url) VALUES (?, ?, ?, ?)
    """, [
        ("Puzzle Blocks", "Puzzle", 5, "https://play.famobi.com/puzzle-block"),
        ("Idle Miner", "Tycoon", 10, "https://play.famobi.com/idle-mining"),
        ("Car Traffic Jam", "Puzzle", 6, "https://play.famobi.com/parking-fury-3d"),
        ("Space Battle", "Action", 12, "https://play.famobi.com/alien-attack"),
        ("Fruit Match", "Puzzle", 7, "https://play.famobi.com/fruits-link"),
        ("Treasure Hunter", "Adventure", 8, "https://play.famobi.com/treasure-hunter"),
        ("Speed Racer", "Racing", 9, "https://play.famobi.com/road-racer"),
        ("City Builder", "Tycoon", 15, "https://play.famobi.com/building-rush"),
        ("Zombie Attack", "Action", 11, "https://play.famobi.com/zombie-hunter"),
        ("Dragon Quest", "RPG", 20, "https://play.famobi.com/knight-hero")
    ])
    conn.commit()


# -------------------------
# WALLET
# -------------------------

@router.post("/wallet/create")
def create_wallet(user_id: str):
    """Create wallet with 50 coins"""
    cursor.execute("SELECT coins FROM users WHERE user_id=?", (user_id,))
    row = cursor.fetchone()
    if row:
        return {"message": "wallet exists", "coins": row[0]}
    
    cursor.execute("INSERT INTO users VALUES (?,?)", (user_id, 50))
    conn.commit()
    
    return {"user_id": user_id, "coins": 50}


@router.get("/wallet")
def wallet(user_id: str):
    """Get wallet balance"""
    cursor.execute("SELECT coins FROM users WHERE user_id=?", (user_id,))
    row = cursor.fetchone()
    
    if not row:
        return {"coins": 0}
    
    return {"coins": row[0]}


@router.get("/wallet/balance")
def wallet_balance(user_id: str):
    return wallet(user_id)


# -------------------------
# GAMES (from Database)
# -------------------------

@router.get("/games")
def get_games():
    """Get all games from database"""
    cursor.execute("SELECT * FROM games")
    rows = cursor.fetchall()
    
    games = []
    for r in rows:
        games.append({
            "id": r[0],
            "name": r[1],
            "category": r[2],
            "reward": r[3],
            "url": r[4]
        })
    
    return {"games": games}


@router.get("/games/play")
def play_game(game_id: int, user_id: str = None):
    """Get game info and play URL"""
    cursor.execute(
        "SELECT name, reward, url, category FROM games WHERE id=?",
        (game_id,)
    )
    
    game = cursor.fetchone()
    
    if not game:
        return {"error": "game not found"}
    
    # If user_id provided, add reward
    if user_id:
        now = int(time.time())
        reward = random.randint(max(1, game[1] - 3), game[1] + 3)
        
        # Ensure user exists
        cursor.execute("SELECT * FROM users WHERE user_id=?", (user_id,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO users VALUES (?,?)", (user_id, 0))
        
        cursor.execute(
            "UPDATE users SET coins = coins + ? WHERE user_id=?",
            (reward, user_id)
        )
        
        cursor.execute(
            "INSERT INTO game_plays (user_id, game_id, reward, played_at) VALUES (?,?,?,?)",
            (user_id, game_id, reward, now)
        )
        
        conn.commit()
        
        cursor.execute("SELECT coins FROM users WHERE user_id=?", (user_id,))
        balance = cursor.fetchone()[0]
        
        return {
            "game": game[0],
            "category": game[3],
            "reward": reward,
            "balance": balance,
            "play_url": game[2]
        }
    
    return {
        "game": game[0],
        "category": game[3],
        "reward": game[1],
        "play_url": game[2]
    }


@router.get("/games/categories")
def get_categories():
    """Get all game categories"""
    cursor.execute("SELECT DISTINCT category FROM games")
    rows = cursor.fetchall()
    return {"categories": [r[0] for r in rows]}


# -------------------------
# DAILY REWARD
# -------------------------

@router.get("/reward/daily")
def daily_reward(user_id: str):
    """Claim daily reward"""
    now = int(time.time())
    
    cursor.execute("SELECT * FROM users WHERE user_id=?", (user_id,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users VALUES (?,?)", (user_id, 0))
    
    cursor.execute("SELECT last_claim FROM daily_rewards WHERE user_id=?", (user_id,))
    row = cursor.fetchone()
    
    if row and now - row[0] < 86400:
        return {"error": "already claimed", "wait": 86400 - (now - row[0])}
    
    reward = random.choice([10, 15, 20, 25, 50])
    
    cursor.execute("UPDATE users SET coins = coins + ? WHERE user_id=?", (reward, user_id))
    cursor.execute("DELETE FROM daily_rewards WHERE user_id=?", (user_id,))
    cursor.execute("INSERT INTO daily_rewards VALUES (?,?)", (user_id, now))
    
    conn.commit()
    
    cursor.execute("SELECT coins FROM users WHERE user_id=?", (user_id,))
    balance = cursor.fetchone()[0]
    
    return {"reward": reward, "balance": balance}


# -------------------------
# LEADERBOARD
# -------------------------

@router.get("/leaderboard")
def leaderboard():
    """Get top 10 players"""
    cursor.execute("SELECT user_id, coins FROM users ORDER BY coins DESC LIMIT 10")
    rows = cursor.fetchall()
    
    return {
        "leaderboard": [{"user_id": r[0], "coins": r[1]} for r in rows]
    }


# -------------------------
# STATS
# -------------------------

@router.get("/stats")
def stats(user_id: str):
    """Get user stats"""
    cursor.execute("SELECT coins FROM users WHERE user_id=?", (user_id,))
    row = cursor.fetchone()
    
    if not row:
        return {"error": "user not found"}
    
    cursor.execute("SELECT COUNT(*) FROM game_plays WHERE user_id=?", (user_id,))
    games_played = cursor.fetchone()[0]
    
    return {
        "user_id": user_id,
        "coins": row[0],
        "games_played": games_played
    }


# -------------------------
# ADMIN: Add Game
# -------------------------

@router.post("/admin/games/add")
def add_game(name: str, category: str, reward: int, url: str):
    """Admin: Add a new game"""
    cursor.execute(
        "INSERT INTO games(name, category, reward, url) VALUES (?,?,?,?)",
        (name, category, reward, url)
    )
    conn.commit()
    
    return {"success": True, "message": f"Game '{name}' added"}
