/**
 * BidBlitz Super App Home - Mit Suchleiste und Horizontal Slider
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Trending Games (Slider)
const TRENDING_GAMES = [
  { id: 1, name: 'Candy Match', emoji: '🍬', route: '/candy-match' },
  { id: 2, name: 'Slot Machine', emoji: '🎰', route: '/slot-machine' },
  { id: 3, name: 'Lucky Wheel', emoji: '🎡', route: '/lucky-wheel' },
  { id: 4, name: 'Runner', emoji: '🏃', route: '/runner-game' },
  { id: 5, name: 'Memory Game', emoji: '🧠', route: '/candy-match' },
];

// Services
const SERVICES = [
  { id: 1, name: 'Games', emoji: '🎮', route: '/games' },
  { id: 2, name: 'Mining', emoji: '⛏', route: '/mining' },
  { id: 3, name: 'Taxi', emoji: '🚕', route: '/ride-pay' },
  { id: 4, name: 'Scooter', emoji: '🛴', route: '/ride-pay' },
  { id: 5, name: 'Bike', emoji: '🚲', route: '/ride-pay' },
  { id: 6, name: 'Market', emoji: '🛒', route: '/auctions' },
  { id: 7, name: 'Casino', emoji: '🎰', route: '/slot-machine' },
  { id: 8, name: 'Rank', emoji: '🏆', route: '/game-leaderboard' },
];

// Nav Items
const NAV_ITEMS = [
  { emoji: '🏠', route: '/super-home', active: true },
  { emoji: '🎮', route: '/games' },
  { emoji: '💰', route: '/wallet' },
  { emoji: '👤', route: '/profile' },
];

export default function SuperAppHome() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(1200);
  const [searchQuery, setSearchQuery] = useState('');

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
      setCoins(res.data.coins || 1200);
    } catch {
      setCoins(1200);
    }
  };

  return (
    <>
      <style>{`
        .super-home {
          margin: 0;
          background: #0f172a;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          min-height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 999;
          padding-bottom: 80px;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #111827;
          font-size: 20px;
          font-weight: bold;
          gap: 12px;
        }
        .topbar-logo {
          white-space: nowrap;
        }
        .search-box {
          flex: 1;
        }
        .search-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: none;
          background: #1f2937;
          color: white;
          font-size: 14px;
        }
        .search-input::placeholder {
          color: #6b7280;
        }
        .topbar-wallet {
          background: #7c3aed;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 16px;
          white-space: nowrap;
        }
        .hero-banner {
          margin: 20px;
          padding: 40px 20px;
          background: linear-gradient(90deg, #9333ea, #7c3aed);
          border-radius: 16px;
          text-align: center;
          font-size: 20px;
          font-weight: 500;
        }
        .section-title {
          padding: 20px 20px 10px;
          font-size: 20px;
          font-weight: bold;
        }
        .slider {
          display: flex;
          overflow-x: auto;
          gap: 16px;
          padding: 0 20px 20px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .slider::-webkit-scrollbar {
          display: none;
        }
        .slide {
          min-width: 160px;
          background: #1f2937;
          border-radius: 16px;
          padding: 30px 20px;
          text-align: center;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          border: none;
          color: white;
        }
        .slide:hover {
          background: #9333ea;
          transform: scale(1.05);
        }
        .slide-emoji {
          font-size: 36px;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          padding: 0 20px 20px;
        }
        .service-card {
          background: #1f2937;
          border-radius: 14px;
          padding: 20px 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .service-card:hover {
          background: #7c3aed;
          transform: scale(1.05);
        }
        .service-icon {
          font-size: 30px;
        }
        .service-name {
          font-size: 12px;
          font-weight: 600;
        }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          background: #111827;
          display: flex;
          justify-content: space-around;
          padding: 14px;
          z-index: 1000;
        }
        .nav-btn {
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          padding: 8px 16px;
          opacity: 0.6;
          transition: all 0.2s;
        }
        .nav-btn:hover, .nav-btn.active {
          opacity: 1;
          transform: scale(1.1);
        }
      `}</style>
      
      <div className="super-home" data-testid="super-app-home">
        {/* Top Bar with Search */}
        <div className="topbar">
          <div className="topbar-logo">BidBlitz</div>
          <div className="search-box">
            <input 
              type="text"
              className="search-input"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="topbar-wallet">💰{coins.toLocaleString()}</div>
        </div>

        {/* Hero Banner */}
        <div className="hero-banner">
          🚀 Play Games • Earn Coins • Ride
        </div>

        {/* Trending Games Slider */}
        <div className="section-title">🔥 Trending Games</div>
        <div className="slider">
          {TRENDING_GAMES.map((game) => (
            <button
              key={game.id}
              className="slide"
              onClick={() => navigate(game.route)}
            >
              <span className="slide-emoji">{game.emoji}</span>
              <span>{game.name}</span>
            </button>
          ))}
        </div>

        {/* Services */}
        <div className="section-title">⚡ Services</div>
        <div className="services-grid">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              className="service-card"
              onClick={() => navigate(service.route)}
            >
              <div className="service-icon">{service.emoji}</div>
              <div className="service-name">{service.name}</div>
            </button>
          ))}
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          {NAV_ITEMS.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.route)}
              className={`nav-btn ${item.active ? 'active' : ''}`}
            >
              {item.emoji}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
