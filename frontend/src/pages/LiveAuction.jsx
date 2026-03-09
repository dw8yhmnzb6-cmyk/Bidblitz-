/**
 * BidBlitz Live Auction - Mit Admin Panel
 * Gebühr: 0.50€ pro Gebot
 * Preiserhöhung: 0.01€ pro Gebot
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const BID_COST = 0.50; // €0.50 pro Gebot

export default function LiveAuction() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  
  // Auction State
  const [productName, setProductName] = useState('iPhone 15 Pro');
  const [productValue, setProductValue] = useState(999);
  const [price, setPrice] = useState(0.00);
  const [timer, setTimer] = useState(10);
  const [bids, setBids] = useState(0);
  const [minRevenue, setMinRevenue] = useState(200);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [lastBidder, setLastBidder] = useState('');
  
  // Admin inputs
  const [adminProduct, setAdminProduct] = useState('');
  const [adminValue, setAdminValue] = useState('');
  const [adminMinRevenue, setAdminMinRevenue] = useState('');
  
  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);
  const timerRef = useRef(timer);
  
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
  
  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) {
          // Check if auction should end
          const revenue = bids * BID_COST;
          if (revenue >= minRevenue) {
            setAuctionEnded(true);
            return 0;
          } else {
            // Extend timer
            return 5;
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [bids, minRevenue]);
  
  const fetchCoins = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 0);
    } catch {
      setCoins(0);
    }
  };
  
  const bid = async () => {
    if (auctionEnded) return;
    
    // Spend 1 coin (equivalent to 0.50€)
    if (coins > 0) {
      try {
        const res = await axios.post(`${API}/bbz/coins/spend`, {
          user_id: userId,
          amount: 1,
          source: 'live_auction_bid'
        });
        setCoins(res.data.new_balance);
      } catch {
        setCoins(prev => Math.max(0, prev - 1));
      }
    } else {
      alert(`Charge €${BID_COST.toFixed(2)} for bid - Keine Coins!`);
      return;
    }
    
    // Update auction
    setBids(prev => prev + 1);
    setPrice(prev => prev + 0.01);
    setTimer(10);
    setLastBidder(userId.slice(0, 8));
  };
  
  const createAuction = () => {
    if (!adminProduct) {
      alert('Bitte Produktname eingeben');
      return;
    }
    
    setProductName(adminProduct);
    setProductValue(parseFloat(adminValue) || 0);
    setMinRevenue(parseFloat(adminMinRevenue) || 200);
    setPrice(0);
    setBids(0);
    setTimer(10);
    setAuctionEnded(false);
    setLastBidder('');
    
    // Clear inputs
    setAdminProduct('');
    setAdminValue('');
    setAdminMinRevenue('');
  };
  
  const revenue = bids * BID_COST;
  const profit = revenue - (auctionEnded ? price : 0);
  
  return (
    <>
      <style>{`
        .auction-page {
          font-family: Arial, sans-serif;
          background: #0f172a;
          color: white;
          margin: 0;
          min-height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 999;
        }
        
        .auction-header {
          background: #020617;
          padding: 20px;
          font-size: 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .auction-header .back {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        
        .wallet-badge {
          background: #7c3aed;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 16px;
        }
        
        .container {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .auction-card {
          background: #1e293b;
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .auction-card h2 {
          margin: 0 0 15px 0;
          color: #a855f7;
          font-size: 24px;
        }
        
        .product-image {
          width: 150px;
          height: 150px;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          border-radius: 15px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
        }
        
        .auction-price {
          font-size: 42px;
          font-weight: bold;
          color: #22c55e;
          margin: 15px 0;
        }
        
        .auction-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        
        .stat-box {
          background: #0f172a;
          padding: 15px;
          border-radius: 10px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
        }
        
        .stat-value.timer {
          color: #fbbf24;
        }
        
        .stat-value.timer.urgent {
          color: #ef4444;
          animation: pulse 0.5s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .stat-value.bids {
          color: #3b82f6;
        }
        
        .stat-value.revenue {
          color: #22c55e;
        }
        
        .bid-btn {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          padding: 18px 50px;
          color: white;
          border-radius: 15px;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
          width: 100%;
          margin-top: 15px;
        }
        
        .bid-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 5px 25px rgba(168, 85, 247, 0.5);
        }
        
        .bid-btn:disabled {
          background: #4b5563;
          cursor: not-allowed;
        }
        
        .bid-cost {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 10px;
        }
        
        .last-bidder {
          margin-top: 15px;
          padding: 10px;
          background: #0f172a;
          border-radius: 10px;
          font-size: 14px;
        }
        
        .auction-ended {
          background: linear-gradient(135deg, #22c55e, #10b981);
          padding: 20px;
          border-radius: 15px;
          margin-top: 20px;
        }
        
        .admin-card {
          background: #1e293b;
          padding: 20px;
          border-radius: 15px;
          margin-top: 20px;
        }
        
        .admin-card h3 {
          margin: 0 0 15px 0;
          color: #fbbf24;
        }
        
        .admin-input {
          width: 100%;
          padding: 12px;
          margin: 8px 0;
          border: none;
          border-radius: 10px;
          background: #0f172a;
          color: white;
          font-size: 16px;
          box-sizing: border-box;
        }
        
        .admin-input::placeholder {
          color: #64748b;
        }
        
        .admin-btn {
          background: #fbbf24;
          border: none;
          padding: 12px 25px;
          color: #0f172a;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          margin-top: 10px;
          transition: 0.3s;
        }
        
        .admin-btn:hover {
          background: #f59e0b;
        }
        
        .product-value {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 5px;
        }
      `}</style>
      
      <div className="auction-page">
        {/* Header */}
        <header className="auction-header">
          <button className="back" onClick={() => navigate('/super-home')}>←</button>
          <span>⚡ BidBlitz Live Auction</span>
          <div className="wallet-badge">🪙 {coins}</div>
        </header>
        
        <div className="container">
          {/* Auction Card */}
          <div className="auction-card">
            <h2>{productName}</h2>
            <p className="product-value">Wert: €{productValue.toFixed(2)}</p>
            
            <div className="product-image">📱</div>
            
            <div className="auction-price">€{price.toFixed(2)}</div>
            
            <div className="auction-stats">
              <div className="stat-box">
                <div className="stat-label">Timer</div>
                <div className={`stat-value timer ${timer <= 3 ? 'urgent' : ''}`}>
                  {timer}s
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Gebote</div>
                <div className="stat-value bids">{bids}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Umsatz</div>
                <div className="stat-value revenue">€{revenue.toFixed(2)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Min. Umsatz</div>
                <div className="stat-value">€{minRevenue.toFixed(2)}</div>
              </div>
            </div>
            
            {lastBidder && (
              <div className="last-bidder">
                👤 Höchstbietender: <strong>{lastBidder}</strong>
              </div>
            )}
            
            <button 
              className="bid-btn"
              onClick={bid}
              disabled={auctionEnded || coins === 0}
            >
              {auctionEnded ? '⏰ Auktion beendet' : '🔥 BIETEN'}
            </button>
            
            <p className="bid-cost">
              Jedes Gebot kostet €{BID_COST.toFixed(2)} (1 Coin)
            </p>
            
            {auctionEnded && (
              <div className="auction-ended">
                <h3>🎉 Auktion beendet!</h3>
                <p>Gewinner: {lastBidder || 'Keiner'}</p>
                <p>Endpreis: €{price.toFixed(2)}</p>
                <p>Umsatz: €{revenue.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          {/* Admin Panel */}
          <div className="admin-card">
            <h3>⚙️ Admin Panel</h3>
            <input 
              className="admin-input"
              placeholder="Produktname"
              value={adminProduct}
              onChange={(e) => setAdminProduct(e.target.value)}
            />
            <input 
              className="admin-input"
              placeholder="Produktwert €"
              type="number"
              value={adminValue}
              onChange={(e) => setAdminValue(e.target.value)}
            />
            <input 
              className="admin-input"
              placeholder="Minimum Umsatz €"
              type="number"
              value={adminMinRevenue}
              onChange={(e) => setAdminMinRevenue(e.target.value)}
            />
            <button className="admin-btn" onClick={createAuction}>
              🚀 Auktion starten
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
