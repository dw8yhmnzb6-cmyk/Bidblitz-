/**
 * BidBlitz Complete - Dashboard + Gaming Lobby + Live Auction
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
  const [coins, setCoins] = useState(100);
  const [price, setPrice] = useState(0.10);
  const [timer, setTimer] = useState(10);
  const [bidMessage, setBidMessage] = useState('');
  
  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);
  
  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchCoins();
    
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    // Auction Timer
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
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
      setCoins(res.data.coins || 100);
    } catch {
      setCoins(100);
    }
  };
  
  const bid = async () => {
    if (coins < 1) {
      setBidMessage('❌ Not enough coins!');
      setTimeout(() => setBidMessage(''), 2000);
      return;
    }
    
    if (timer <= 0) {
      setBidMessage('⏰ Auction ended!');
      setTimeout(() => setBidMessage(''), 2000);
      return;
    }
    
    try {
      // Spend 1 coin for bid
      const res = await axios.post(`${API}/bbz/coins/spend`, {
        user_id: userId,
        amount: 1,
        source: 'auction_bid'
      });
      
      setCoins(res.data.new_balance);
      setPrice(prev => prev + 0.10);
      setTimer(10); // Reset timer
      setBidMessage('✅ Bid placed!');
      setTimeout(() => setBidMessage(''), 2000);
    } catch (error) {
      setBidMessage(error.response?.data?.detail || 'Bid failed');
      setTimeout(() => setBidMessage(''), 2000);
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
          padding: 20px;
        }
        
        .games-section h2 {
          margin: 0 0 20px 0;
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
        
        .auction-image {
          width: 150px;
          height: 150px;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          border-radius: 15px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
        }
        
        .auction-price {
          font-size: 24px;
          font-weight: bold;
          color: #22c55e;
          margin: 10px 0;
        }
        
        .auction-timer {
          font-size: 20px;
          margin: 10px 0;
        }
        
        .auction-timer.urgent {
          color: #ef4444;
          animation: pulse 0.5s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .bid-btn {
          background: #a855f7;
          border: none;
          padding: 12px 25px;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
        }
        
        .bid-btn:hover {
          background: #9333ea;
          transform: scale(1.05);
        }
        
        .bid-btn:disabled {
          background: #4b5563;
          cursor: not-allowed;
        }
        
        .bid-message {
          margin-top: 10px;
          font-size: 14px;
          font-weight: bold;
        }
        
        .bottom-spacer {
          height: 20px;
        }
      `}</style>
      
      <div className="bbz-page">
        {/* Header */}
        <header className="bbz-header">
          <div className="logo">⚡ BidBlitz</div>
          <div className="wallet" onClick={() => navigate('/wallet')}>
            💰 Coins: {coins}
          </div>
        </header>
        
        {/* Dashboard Grid */}
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
          <div className="auction-image">📱</div>
          <p className="auction-price">Preis: {price.toFixed(2)} €</p>
          <p className={`auction-timer ${timer <= 3 ? 'urgent' : ''}`}>
            Timer: {timer}s
          </p>
          <button 
            className="bid-btn"
            onClick={bid}
            disabled={timer <= 0}
          >
            {timer <= 0 ? 'Ended' : 'Bid (1 Coin)'}
          </button>
          {bidMessage && <p className="bid-message">{bidMessage}</p>}
        </div>
        
        <div className="bottom-spacer" />
      </div>
    </>
  );
}
