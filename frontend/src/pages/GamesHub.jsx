/**
 * BidBlitz Games Hub - Gradient Header Design
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// 8 Games
const GAMES = [
  { id: 1, name: 'Candy Match', emoji: '🍬', route: '/candy-match' },
  { id: 2, name: 'Slot Machine', emoji: '🎰', route: '/slot-machine' },
  { id: 3, name: 'Lucky Wheel', emoji: '🎡', route: '/lucky-wheel' },
  { id: 4, name: 'Reaction Game', emoji: '⚡', route: '/reaction-game' },
  { id: 5, name: 'Runner', emoji: '🏃', route: '/runner-game' },
  { id: 6, name: 'Memory Game', emoji: '🧠', route: '/candy-match' },
  { id: 7, name: 'Coin Tap', emoji: '🪙', route: '/coin-tap' },
  { id: 8, name: 'Dice Game', emoji: '🎲', route: '/games/dice.html' },
];

export default function GamesHub() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchCoins();
    
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
      setCoins(res.data.coins || 0);
    } catch {
      setCoins(100);
    }
  };

  const handleGameClick = (game) => {
    if (game.route.startsWith('/games/')) {
      window.location.href = game.route;
    } else {
      navigate(game.route);
    }
  };

  return (
    <>
      <style>{`
        .games-hub {
          margin: 0;
          background: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          min-height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 999;
        }
        .games-header {
          background: linear-gradient(90deg, #7c3aed, #9333ea);
          padding: 22px;
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          position: relative;
        }
        .games-back {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .games-coins {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.2);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 16px;
        }
        .games-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
          padding: 20px;
        }
        .game-card {
          background: #1f2937;
          border-radius: 18px;
          padding: 30px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .game-card:hover {
          transform: scale(1.05);
          background: #7c3aed;
        }
        .game-card:active {
          transform: scale(0.95);
        }
        .game-icon {
          font-size: 42px;
          margin-bottom: 12px;
          line-height: 1;
        }
        .game-title {
          font-size: 20px;
          font-weight: 600;
        }
      `}</style>
      
      <div className="games-hub" data-testid="games-hub">
        {/* Gradient Header */}
        <div className="games-header">
          <button className="games-back" onClick={() => navigate('/super-home')}>←</button>
          🎮 BidBlitz Games
          <div className="games-coins">💰 {coins}</div>
        </div>

        {/* Grid */}
        <div className="games-grid">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => handleGameClick(game)}
              className="game-card"
              data-testid={`game-${game.id}`}
            >
              <div className="game-icon">{game.emoji}</div>
              <div className="game-title">{game.name}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
