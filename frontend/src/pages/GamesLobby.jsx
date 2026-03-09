/**
 * BidBlitz Game Lobby
 * Central hub for all mini-games
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const GAMES = [
  { name: 'Lucky Wheel', emoji: '🎰', route: '/lucky-wheel', color: '#ef4444' },
  { name: 'Scratch Card', emoji: '🎫', route: '/scratch-card', color: '#22c55e' },
  { name: 'Puzzle Match', emoji: '🧩', route: '/puzzle-game', color: '#3b82f6' },
  { name: 'Snake', emoji: '🐍', route: '/snake-game', color: '#eab308' },
  { name: '2048', emoji: '🔢', route: '/game-2048', color: '#a855f7' },
  { name: 'Brick Breaker', emoji: '🧱', route: '/brick-breaker', color: '#f97316' },
  { name: 'Reaction', emoji: '⚡', route: '/reaction-game', color: '#ec4899' },
  { name: 'Memory', emoji: '🧠', route: '/memory-game', color: '#14b8a6' },
  { name: 'Treasure Box', emoji: '💎', route: '/coin-tap', color: '#8b5cf6' },
];

export default function GamesLobby() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(100);
  
  const userId = localStorage.getItem('userId') || 'guest';

  useEffect(() => {
    fetchCoins();
    
    // Hide main navbar
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    return () => {
      const header = document.querySelector('header');
      if (header) header.style.display = '';
    };
  }, []);

  const fetchCoins = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 100);
    } catch {
      setCoins(100);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        🎮 BidBlitz Game Lobby
      </header>

      <div style={styles.container}>
        {/* Wallet */}
        <div style={styles.wallet}>
          Coins: <span style={styles.coinsValue}>{coins}</span>
        </div>

        {/* Games Grid */}
        <div style={styles.games}>
          {GAMES.map((game, index) => (
            <div
              key={index}
              style={{
                ...styles.game,
                borderLeft: `4px solid ${game.color}`,
              }}
              onClick={() => navigate(game.route)}
              data-testid={`game-${game.name.toLowerCase().replace(' ', '-')}`}
            >
              <div style={styles.gameEmoji}>{game.emoji}</div>
              <div style={styles.gameName}>{game.name}</div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <button 
          style={styles.backButton}
          onClick={() => navigate('/super-home')}
        >
          ← Zurück zur Startseite
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    margin: 0,
    fontFamily: 'Arial, sans-serif',
    background: '#0f172a',
    color: 'white',
    minHeight: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
  },
  header: {
    background: '#020617',
    padding: '20px',
    textAlign: 'center',
    fontSize: '26px',
    fontWeight: 'bold',
  },
  container: {
    padding: '20px',
  },
  wallet: {
    background: '#1e293b',
    padding: '15px',
    textAlign: 'center',
    fontSize: '20px',
    marginBottom: '20px',
    borderRadius: '12px',
  },
  coinsValue: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  games: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
  },
  game: {
    background: '#1e293b',
    padding: '20px 10px',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, background 0.2s',
  },
  gameEmoji: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  gameName: {
    fontSize: '12px',
    fontWeight: '500',
  },
  backButton: {
    marginTop: '20px',
    padding: '15px 25px',
    background: '#374151',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
  },
};
