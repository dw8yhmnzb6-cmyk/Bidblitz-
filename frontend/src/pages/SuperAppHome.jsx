/**
 * BidBlitz Gaming Platform - Complete Design
 * Hero + Dashboard (8 Cards) + Gaming Lobby
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const DASHBOARD_ITEMS = [
  { emoji: '🎮', name: 'Games', route: '/games' },
  { emoji: '🔥', name: 'Auctions', route: '/auctions' },
  { emoji: '👑', name: 'VIP Auctions', route: '/vip-auctions' },
  { emoji: '⛏', name: 'Mining', route: '/mining' },
  { emoji: '💰', name: 'Wallet', route: '/wallet' },
  { emoji: '🛍', name: 'Marketplace', route: '/marketplace' },
  { emoji: '🚕', name: 'Taxi', route: '/taxi' },
  { emoji: '🛴', name: 'Scooter', route: '/scooter' },
];

const GAMES = [
  { name: 'Dice Game', route: '/simple', emoji: '🎲' },
  { name: 'Match-3', route: '/candy-match', emoji: '🍬' },
  { name: 'Runner', route: '/runner-game', emoji: '🏃' },
  { name: 'Puzzle', route: '/reaction-game', emoji: '🧩' },
  { name: 'Strategy', route: '/coin-tap', emoji: '🪙' },
  { name: 'Lucky Wheel', route: '/lucky-wheel', emoji: '🎡' },
];

export default function SuperAppHome() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(200);
  
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
      setCoins(res.data.coins || 200);
    } catch {
      setCoins(200);
    }
  };
  
  return (
    <>
      <style>{`
        .bbz-page {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0f172a;
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
        
        .bbz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #020617;
        }
        
        .logo {
          font-size: 24px;
          color: #a855f7;
          font-weight: bold;
        }
        
        .wallet {
          background: #1e293b;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          transition: 0.3s;
        }
        
        .wallet:hover {
          background: #334155;
        }
        
        .hero {
          text-align: center;
          padding: 40px 20px;
        }
        
        .hero h1 {
          font-size: 40px;
          color: #a855f7;
          margin: 0 0 10px 0;
        }
        
        .hero p {
          color: #94a3b8;
          margin: 0;
          font-size: 18px;
        }
        
        .dashboard {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 20px;
        }
        
        .card {
          background: #1e293b;
          border-radius: 20px;
          padding: 30px;
          text-align: center;
          font-size: 20px;
          transition: 0.3s;
          transform-style: preserve-3d;
          cursor: pointer;
          border: none;
          color: white;
        }
        
        .card:hover {
          transform: rotateY(10deg) scale(1.05);
          background: #334155;
        }
        
        .card-emoji {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }
        
        .games-section {
          padding: 30px;
          padding-bottom: 100px;
        }
        
        .games-section h2 {
          margin: 0 0 20px 0;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        
        .game-card {
          background: #1e293b;
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          transition: 0.3s;
          cursor: pointer;
          border: none;
          color: white;
          font-size: 16px;
        }
        
        .game-card:hover {
          transform: scale(1.1);
          background: #334155;
        }
        
        .game-img {
          height: 120px;
          background: #020617;
          border-radius: 10px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
        }
        
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          background: #020617;
          display: flex;
          justify-content: space-around;
          padding: 15px 0;
        }
        
        .bottom-nav button {
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 5px 15px;
          transition: 0.3s;
        }
        
        .bottom-nav button:hover {
          color: #a855f7;
        }
        
        .bottom-nav button.active {
          color: #a855f7;
        }
        
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .hero h1 {
            font-size: 32px;
          }
        }
      `}</style>
      
      <div className="bbz-page">
        {/* Header */}
        <header className="bbz-header">
          <div className="logo">⚡ BidBlitz</div>
          <div className="wallet" onClick={() => navigate('/wallet')}>
            Coins: {coins}
          </div>
        </header>
        
        {/* Hero */}
        <div className="hero">
          <h1>Play • Bid • Win</h1>
          <p>Gaming Platform</p>
        </div>
        
        {/* Dashboard Grid - 8 Cards */}
        <div className="dashboard">
          {DASHBOARD_ITEMS.map((item, index) => (
            <button
              key={index}
              className="card"
              onClick={() => navigate(item.route)}
            >
              <span className="card-emoji">{item.emoji}</span>
              {item.name}
            </button>
          ))}
        </div>
        
        {/* Gaming Lobby */}
        <div className="games-section">
          <h2>🎮 Gaming Lobby</h2>
          <div className="grid">
            {GAMES.map((game, index) => (
              <button
                key={index}
                className="game-card"
                onClick={() => navigate(game.route)}
              >
                <div className="game-img">{game.emoji}</div>
                {game.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <button className="active">Home</button>
          <button onClick={() => navigate('/games')}>Games</button>
          <button onClick={() => navigate('/wallet')}>Wallet</button>
          <button onClick={() => navigate('/profile')}>Profile</button>
        </nav>
      </div>
    </>
  );
}
