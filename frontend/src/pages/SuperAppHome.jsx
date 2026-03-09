/**
 * BidBlitz - Clean Design mit Auction
 * Coins oder 0.50€ pro Gebot
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const DASHBOARD_ITEMS = [
  { emoji: '🎮', name: 'Games', route: '/games' },
  { emoji: '🔥', name: 'Live Auctions', route: '/auctions' },
  { emoji: '👑', name: 'VIP Auctions', route: '/vip-auctions' },
  { emoji: '⛏', name: 'Mining', route: '/mining' },
  { emoji: '💰', name: 'Wallet', route: '/wallet' },
  { emoji: '🛍', name: 'Marketplace', route: '/marketplace' },
];

const GAMES = [
  { name: 'Dice Game', route: '/simple' },
  { name: 'Match-3', route: '/candy-match' },
  { name: 'Runner', route: '/runner-game' },
  { name: 'Puzzle', route: '/reaction-game' },
  { name: 'Strategy', route: '/coin-tap' },
  { name: 'Lucky Wheel', route: '/lucky-wheel' },
];

export default function SuperAppHome() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(10);
  const [price, setPrice] = useState(0.00);
  const [timer, setTimer] = useState(10);
  
  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);
  
  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchCoins();
    
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    // Timer countdown
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    return () => {
      clearInterval(interval);
      const header = document.querySelector('header');
      if (header) header.style.display = '';
    };
  }, []);
  
  const fetchCoins = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 10);
    } catch {
      setCoins(10);
    }
  };
  
  const bid = async () => {
    if (coins > 0) {
      // Pay with coins
      try {
        const res = await axios.post(`${API}/bbz/coins/spend`, {
          user_id: userId,
          amount: 1,
          source: 'auction_bid'
        });
        setCoins(res.data.new_balance);
      } catch {
        setCoins(prev => prev - 1);
      }
    } else {
      // No coins - charge 0.50€
      alert('Charge 0.50€ for bid');
      // Here you would integrate Stripe/Payment
    }
    
    // Increase price by 0.01€
    setPrice(prev => prev + 0.01);
    // Reset timer
    setTimer(10);
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
          font-size: 22px;
          font-weight: bold;
          color: #a855f7;
        }
        
        .wallet {
          background: #1e293b;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
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
          cursor: pointer;
          border: none;
          color: white;
        }
        
        .card:hover {
          transform: scale(1.05);
          background: #334155;
        }
        
        .card-emoji {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }
        
        .games-section {
          padding: 20px;
        }
        
        .games-section h2 {
          margin: 0 0 15px 0;
        }
        
        .game-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        
        .game {
          background: #1e293b;
          padding: 20px;
          border-radius: 15px;
          text-align: center;
          transition: 0.3s;
          cursor: pointer;
          border: none;
          color: white;
          font-size: 16px;
        }
        
        .game:hover {
          transform: scale(1.1);
          background: #334155;
        }
        
        .auction {
          background: #1e293b;
          padding: 20px;
          margin: 20px;
          border-radius: 15px;
          text-align: center;
        }
        
        .auction h2 {
          margin: 0 0 15px 0;
        }
        
        .auction-img {
          width: 150px;
          height: 150px;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          border-radius: 15px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
        }
        
        .auction p {
          margin: 10px 0;
          font-size: 18px;
        }
        
        .auction-price {
          font-size: 28px !important;
          font-weight: bold;
          color: #22c55e;
        }
        
        .auction-timer {
          font-size: 24px !important;
        }
        
        .auction-timer.urgent {
          color: #ef4444;
        }
        
        .bid-btn {
          background: #a855f7;
          border: none;
          padding: 12px 25px;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          font-weight: bold;
          margin-top: 10px;
          cursor: pointer;
          transition: 0.3s;
        }
        
        .bid-btn:hover {
          background: #9333ea;
          transform: scale(1.05);
        }
        
        .spacer {
          height: 30px;
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
        
        {/* Dashboard */}
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
          <div className="game-grid">
            {GAMES.map((game, index) => (
              <button
                key={index}
                className="game"
                onClick={() => navigate(game.route)}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Live Auction */}
        <div className="auction">
          <h2>🔥 Live Auction</h2>
          <div className="auction-img">📱</div>
          <p className="auction-price">Preis: €{price.toFixed(2)}</p>
          <p className={`auction-timer ${timer <= 3 ? 'urgent' : ''}`}>
            Timer: {timer}s
          </p>
          <button className="bid-btn" onClick={bid}>
            Bieten
          </button>
        </div>
        
        <div className="spacer" />
      </div>
    </>
  );
}
