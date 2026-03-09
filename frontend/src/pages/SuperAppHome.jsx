/**
 * BidBlitz - Penny Auction System
 * Gebot: 0.50€ / 50 Coins
 * Preiserhöhung: 0.01€ pro Gebot
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

// Auction Configuration
const BID_COST_EUR = 0.50;  // Gebot kostet 0.50€
const BID_COST_COINS = 50;   // Oder 50 Coins
const PRICE_INCREMENT = 0.01; // Preis erhöht sich um 1 Cent

export default function SuperAppHome() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(100);
  const [euroBalance, setEuroBalance] = useState(10.00); // Euro Guthaben
  const [price, setPrice] = useState(0.01); // Startpreis
  const [timer, setTimer] = useState(15);
  const [bidMessage, setBidMessage] = useState('');
  const [bidCount, setBidCount] = useState(0);
  const [lastBidder, setLastBidder] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('coins'); // 'coins' oder 'euro'
  
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
    // Check if auction ended
    if (timer <= 0) {
      setBidMessage('⏰ Auktion beendet!');
      setTimeout(() => setBidMessage(''), 2000);
      return;
    }
    
    // Check payment method and balance
    if (paymentMethod === 'coins') {
      if (coins < BID_COST_COINS) {
        setBidMessage(`❌ Nicht genug Coins! Du brauchst ${BID_COST_COINS} Coins (= ${BID_COST_EUR.toFixed(2)}€)`);
        setTimeout(() => setBidMessage(''), 3000);
        return;
      }
      
      try {
        // Spend coins for bid
        const res = await axios.post(`${API}/bbz/coins/spend`, {
          user_id: userId,
          amount: BID_COST_COINS,
          source: 'auction_bid_penny'
        });
        
        setCoins(res.data.new_balance);
      } catch (error) {
        setBidMessage(error.response?.data?.detail || 'Gebot fehlgeschlagen');
        setTimeout(() => setBidMessage(''), 2000);
        return;
      }
    } else {
      // Euro payment
      if (euroBalance < BID_COST_EUR) {
        setBidMessage(`❌ Nicht genug Guthaben! Du brauchst ${BID_COST_EUR.toFixed(2)}€`);
        setTimeout(() => setBidMessage(''), 3000);
        return;
      }
      setEuroBalance(prev => prev - BID_COST_EUR);
    }
    
    // Successful bid - increase price by 1 cent
    setPrice(prev => prev + PRICE_INCREMENT);
    setTimer(15); // Reset timer
    setBidCount(prev => prev + 1);
    setLastBidder('Du');
    setBidMessage(`✅ Gebot platziert! -${paymentMethod === 'coins' ? BID_COST_COINS + ' Coins' : BID_COST_EUR.toFixed(2) + '€'}`);
    setTimeout(() => setBidMessage(''), 2000);
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
        
        .wallet-info {
          display: flex;
          gap: 10px;
        }
        
        .wallet {
          background: #1e293b;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .wallet.coins {
          background: #7c3aed;
        }
        
        .wallet.euro {
          background: #22c55e;
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
          padding: 25px;
          margin: 20px;
          border-radius: 20px;
          text-align: center;
          border: 2px solid #a855f7;
        }
        
        .auction h2 {
          margin: 0 0 15px 0;
          color: #a855f7;
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
          font-size: 60px;
        }
        
        .auction-price {
          font-size: 36px;
          font-weight: bold;
          color: #22c55e;
          margin: 15px 0;
        }
        
        .auction-info {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin: 15px 0;
          font-size: 14px;
          color: #94a3b8;
        }
        
        .auction-timer {
          font-size: 28px;
          font-weight: bold;
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
        
        .payment-toggle {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin: 15px 0;
        }
        
        .payment-btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: 2px solid #374151;
          background: #1e293b;
          color: white;
          cursor: pointer;
          transition: 0.3s;
          font-size: 14px;
        }
        
        .payment-btn.active {
          border-color: #a855f7;
          background: #7c3aed;
        }
        
        .bid-btn {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          padding: 15px 40px;
          border-radius: 15px;
          color: white;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 10px;
        }
        
        .bid-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(168, 85, 247, 0.4);
        }
        
        .bid-btn:disabled {
          background: #4b5563;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .bid-cost-info {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 10px;
        }
        
        .bid-message {
          margin-top: 15px;
          font-size: 16px;
          font-weight: bold;
          padding: 10px;
          border-radius: 10px;
          background: rgba(168, 85, 247, 0.2);
        }
        
        .last-bidder {
          margin-top: 10px;
          font-size: 14px;
          color: #fbbf24;
        }
      `}</style>
      
      <div className="bbz-page">
        {/* Header */}
        <header className="bbz-header">
          <div className="logo">⚡ BidBlitz</div>
          <div className="wallet-info">
            <div className="wallet coins" onClick={() => navigate('/wallet')}>
              🪙 {coins} Coins
            </div>
            <div className="wallet euro">
              💶 {euroBalance.toFixed(2)}€
            </div>
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
        
        {/* Live Auction - Penny Auction System */}
        <div className="auction">
          <h2>🔥 Live Auction</h2>
          <div className="auction-image">📱</div>
          
          <p className="auction-price">{price.toFixed(2)} €</p>
          
          <div className="auction-info">
            <span>📊 {bidCount} Gebote</span>
            <span>💰 Gebot: {BID_COST_EUR.toFixed(2)}€</span>
            <span>📈 +{(PRICE_INCREMENT * 100).toFixed(0)} Cent/Gebot</span>
          </div>
          
          <p className={`auction-timer ${timer <= 5 ? 'urgent' : ''}`}>
            ⏱️ {timer}s
          </p>
          
          {lastBidder && <p className="last-bidder">👤 Höchstbietender: {lastBidder}</p>}
          
          {/* Payment Method Toggle */}
          <div className="payment-toggle">
            <button 
              className={`payment-btn ${paymentMethod === 'coins' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('coins')}
            >
              🪙 Coins ({BID_COST_COINS})
            </button>
            <button 
              className={`payment-btn ${paymentMethod === 'euro' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('euro')}
            >
              💶 Euro ({BID_COST_EUR.toFixed(2)}€)
            </button>
          </div>
          
          <button 
            className="bid-btn"
            onClick={bid}
            disabled={timer <= 0}
          >
            {timer <= 0 ? '⏰ Auktion beendet' : '🔥 BIETEN'}
          </button>
          
          <p className="bid-cost-info">
            Jedes Gebot kostet {BID_COST_EUR.toFixed(2)}€ = {BID_COST_COINS} Coins
          </p>
          
          {bidMessage && <p className="bid-message">{bidMessage}</p>}
        </div>
        
        <div style={{ height: '20px' }} />
      </div>
    </>
  );
}
