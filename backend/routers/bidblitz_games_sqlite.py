"""
BidBlitz Games System - SQLite Version (Fallback/Alternative)
Wallet, Daily Rewards, Games, Referral, Leaderboard
"""
from fastapi import APIRouter
import sqlite3
import random
import time
import os

router = APIRouter(prefix="/bbz-lite", tags=["BBZ Games SQLite"])

# SQLite Database Path
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bidblitz_games.db")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users/Wallets table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            coins INTEGER DEFAULT 0,
            total_earned INTEGER DEFAULT 0,
            created_at INTEGER
        )
    """)
    
    # Daily rewards tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_rewards (
            user_id TEXT PRIMARY KEY,
            last_claim INTEGER,
            streak INTEGER DEFAULT 0
        )
    """)
    
    # Game plays history
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS game_plays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            game TEXT,
            reward INTEGER,
            played_at INTEGER
        )
    """)
    
    # Referrals
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS referrals (
            new_user TEXT PRIMARY KEY,
            inviter TEXT,
            created_at INTEGER
        )
    """)
    
    conn.commit()
    conn.close()

# Initialize on import
init_db()


def add_coins(user_id: str, amount: int):
    """Add coins to user"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE users SET coins = coins + ?, total_earned = total_earned + ? WHERE user_id = ?",
        (amount, amount, user_id)
    )
    
    conn.commit()
    conn.close()


# -------------------------
# WALLET
# -------------------------

@router.post("/wallet/create")
def create_wallet(user_id: str):
    """Create wallet with 50 starting coins"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    
    if user:
        conn.close()
        return {"message": "wallet exists", "coins": user["coins"]}
    
    now = int(time.time())
    cursor.execute(
        "INSERT INTO users (user_id, coins, total_earned, created_at) VALUES (?, ?, ?, ?)",
        (user_id, 50, 50, now)
    )
    
    conn.commit()
    conn.close()
    
    return {"user_id": user_id, "coins": 50}


@router.get("/wallet/balance")
def wallet_balance(user_id: str):
    """Get wallet balance"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT coins, total_earned FROM users WHERE user_id = ?", (user_id,))
    result = cursor.fetchone()
    
    conn.close()
    
    if not result:
        return {"coins": 0, "total_earned": 0}
    
    return {"coins": result["coins"], "total_earned": result["total_earned"]}


# -------------------------
# DAILY REWARD
# -------------------------

@router.get("/reward/daily")
def daily_reward(user_id: str):
    """Claim daily reward (once per 24h)"""
    conn = get_db()
    cursor = conn.cursor()
    
    now = int(time.time())
    
    # Check if user exists, create if not
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (user_id, coins, total_earned, created_at) VALUES (?, ?, ?, ?)",
            (user_id, 0, 0, now)
        )
    
    # Check last claim
    cursor.execute("SELECT last_claim, streak FROM daily_rewards WHERE user_id = ?", (user_id,))
    result = cursor.fetchone()
    
    if result:
        last_claim = result["last_claim"]
        streak = result["streak"]
        
        # Already claimed today
        if now - last_claim < 86400:
            conn.close()
            return {"error": "already claimed", "next_claim_in": 86400 - (now - last_claim)}
        
        # Check if streak continues (within 48h) or resets
        if now - last_claim < 172800:
            streak = min(streak + 1, 7)
        else:
            streak = 1
    else:
        streak = 1
    
    # Reward based on streak
    rewards = [10, 15, 20, 25, 30, 40, 100]
    reward = rewards[min(streak - 1, 6)]
    
    # Update coins
    cursor.execute(
        "UPDATE users SET coins = coins + ?, total_earned = total_earned + ? WHERE user_id = ?",
        (reward, reward, user_id)
    )
    
    # Update daily rewards
    cursor.execute("DELETE FROM daily_rewards WHERE user_id = ?", (user_id,))
    cursor.execute(
        "INSERT INTO daily_rewards (user_id, last_claim, streak) VALUES (?, ?, ?)",
        (user_id, now, streak)
    )
    
    # Get new balance
    cursor.execute("SELECT coins FROM users WHERE user_id = ?", (user_id,))
    balance = cursor.fetchone()["coins"]
    
    conn.commit()
    conn.close()
    
    return {
        "reward": reward,
        "streak": streak,
        "balance": balance
    }


# -------------------------
# LUCKY WHEEL
# -------------------------

@router.post("/games/lucky-wheel")
def lucky_wheel(user_id: str):
    """Spin the lucky wheel"""
    conn = get_db()
    cursor = conn.cursor()
    
    now = int(time.time())
    
    # Ensure user exists
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (user_id, coins, total_earned, created_at) VALUES (?, ?, ?, ?)",
            (user_id, 0, 0, now)
        )
    
    reward = random.choice([5, 10, 20, 50, 100])
    
    cursor.execute(
        "UPDATE users SET coins = coins + ?, total_earned = total_earned + ? WHERE user_id = ?",
        (reward, reward, user_id)
    )
    
    # Record game play
    cursor.execute(
        "INSERT INTO game_plays (user_id, game, reward, played_at) VALUES (?, ?, ?, ?)",
        (user_id, "lucky_wheel", reward, now)
    )
    
    cursor.execute("SELECT coins FROM users WHERE user_id = ?", (user_id,))
    balance = cursor.fetchone()["coins"]
    
    conn.commit()
    conn.close()
    
    return {
        "game": "lucky wheel",
        "reward": reward,
        "balance": balance
    }


# -------------------------
# SCRATCH CARD
# -------------------------

@router.post("/games/scratch")
def scratch(user_id: str):
    """Scratch a card"""
    conn = get_db()
    cursor = conn.cursor()
    
    now = int(time.time())
    
    # Ensure user exists
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (user_id, coins, total_earned, created_at) VALUES (?, ?, ?, ?)",
            (user_id, 0, 0, now)
        )
    
    reward = random.choice([0, 0, 5, 10, 20, 100])
    
    if reward > 0:
        cursor.execute(
            "UPDATE users SET coins = coins + ?, total_earned = total_earned + ? WHERE user_id = ?",
            (reward, reward, user_id)
        )
    
    # Record game play
    cursor.execute(
        "INSERT INTO game_plays (user_id, game, reward, played_at) VALUES (?, ?, ?, ?)",
        (user_id, "scratch", reward, now)
    )
    
    cursor.execute("SELECT coins FROM users WHERE user_id = ?", (user_id,))
    balance = cursor.fetchone()["coins"]
    
    conn.commit()
    conn.close()
    
    return {
        "game": "scratch",
        "reward": reward,
        "won": reward > 0,
        "balance": balance
    }


# -------------------------
# REACTION GAME
# -------------------------

@router.post("/games/reaction")
def reaction(user_id: str, reaction_ms: int = 500):
    """Play reaction game - faster = more reward"""
    conn = get_db()
    cursor = conn.cursor()
    
    now = int(time.time())
    
    # Ensure user exists
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (user_id, coins, total_earned, created_at) VALUES (?, ?, ?, ?)",
            (user_id, 0, 0, now)
        )
    
    # Reward based on reaction time
    if reaction_ms < 200:
        reward = 20
    elif reaction_ms < 300:
        reward = 15
    elif reaction_ms < 400:
        reward = 10
    else:
        reward = 5
    
    cursor.execute(
        "UPDATE users SET coins = coins + ?, total_earned = total_earned + ? WHERE user_id = ?",
        (reward, reward, user_id)
    )
    
    # Record game play
    cursor.execute(
        "INSERT INTO game_plays (user_id, game, reward, played_at) VALUES (?, ?, ?, ?)",
        (user_id, "reaction", reward, now)
    )
    
    cursor.execute("SELECT coins FROM users WHERE user_id = ?", (user_id,))
    balance = cursor.fetchone()["coins"]
    
    conn.commit()
    conn.close()
    
    return {
        "game": "reaction",
        "reaction_ms": reaction_ms,
        "reward": reward,
        "balance": balance
    }


# -------------------------
# REFERRAL
# -------------------------

@router.post("/referral/use")
def referral(inviter: str, new_user: str):
    """Use referral code"""
    conn = get_db()
    cursor = conn.cursor()
    
    now = int(time.time())
    
    # Check if already used
    cursor.execute("SELECT * FROM referrals WHERE new_user = ?", (new_user,))
    if cursor.fetchone():
        conn.close()
        return {"error": "already used"}
    
    # Can't refer yourself
    if inviter == new_user:
        conn.close()
        return {"error": "cannot refer yourself"}
    
    # Ensure both users exist
    for uid in [inviter, new_user]:
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (uid,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO users (user_id, coins, total_earned, created_at) VALUES (?, ?, ?, ?)",
                (uid, 0, 0, now)
            )
    
    # Record referral
    cursor.execute(
        "INSERT INTO referrals (new_user, inviter, created_at) VALUES (?, ?, ?)",
        (new_user, inviter, now)
    )
    
    # Reward both
    cursor.execute(
        "UPDATE users SET coins = coins + 100, total_earned = total_earned + 100 WHERE user_id = ?",
        (inviter,)
    )
    cursor.execute(
        "UPDATE users SET coins = coins + 50, total_earned = total_earned + 50 WHERE user_id = ?",
        (new_user,)
    )
    
    conn.commit()
    conn.close()
    
    return {
        "inviter_reward": 100,
        "new_user_reward": 50
    }


# -------------------------
# LEADERBOARD
# -------------------------

@router.get("/leaderboard")
def get_leaderboard():
    """Get top 10 players"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT user_id, coins FROM users ORDER BY coins DESC LIMIT 10"
    )
    
    rows = cursor.fetchall()
    conn.close()
    
    return {
        "leaderboard": [{"user_id": row["user_id"], "coins": row["coins"]} for row in rows]
    }


# -------------------------
# STATS
# -------------------------

@router.get("/stats")
def get_stats(user_id: str):
    """Get user stats"""
    conn = get_db()
    cursor = conn.cursor()
    
    # User info
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return {"error": "user not found"}
    
    # Game count
    cursor.execute("SELECT COUNT(*) as count FROM game_plays WHERE user_id = ?", (user_id,))
    games_played = cursor.fetchone()["count"]
    
    # Streak
    cursor.execute("SELECT streak FROM daily_rewards WHERE user_id = ?", (user_id,))
    streak_row = cursor.fetchone()
    streak = streak_row["streak"] if streak_row else 0
    
    conn.close()
    
    return {
        "user_id": user_id,
        "coins": user["coins"],
        "total_earned": user["total_earned"],
        "games_played": games_played,
        "streak": streak
    }
