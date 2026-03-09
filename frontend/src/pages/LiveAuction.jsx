/**
 * BidBlitz Live Auction - Einfaches Design
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const BID_COST = 0.50;

export default function LiveAuction() {
  const navigate = useNavigate();
  
  // Auction state
  const [productName, setProductName] = useState('Product');
  const [price, setPrice] = useState(0);
  const [timer, setTimer] = useState(10);
  const [bids, setBids] = useState(0);
  const [minRevenue, setMinRevenue] = useState(200);
  const [auctionFinished, setAuctionFinished] = useState(false);
  
  // Admin inputs
  const [adminProduct, setAdminProduct] = useState('');
  const [adminValue, setAdminValue] = useState('');
  const [adminMinRevenue, setAdminMinRevenue] = useState('');
  
  const timerRef = useRef(timer);
  
  useEffect(() => {
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
        if (prev > 0) {
          return prev - 1;
        }
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Check auction end
  useEffect(() => {
    if (timer === 0 && !auctionFinished) {
      const revenue = bids * BID_COST;
      
      if (revenue >= minRevenue) {
        setAuctionFinished(true);
        alert('Auction finished');
      } else {
        // Extend timer
        setTimer(5);
      }
    }
  }, [timer, bids, minRevenue, auctionFinished]);
  
  const createAuction = () => {
    if (adminProduct) {
      setProductName(adminProduct);
    }
    if (adminMinRevenue) {
      setMinRevenue(parseFloat(adminMinRevenue) || 200);
    }
    
    setPrice(0);
    setBids(0);
    setTimer(10);
    setAuctionFinished(false);
    
    // Clear inputs
    setAdminProduct('');
    setAdminValue('');
    setAdminMinRevenue('');
  };
  
  const bid = () => {
    if (auctionFinished) return;
    
    setBids(prev => prev + 1);
    setPrice(prev => prev + 0.01);
    setTimer(10);
  };
  
  const revenue = bids * BID_COST;
  
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
          align-items: center;
          gap: 15px;
        }
        
        .back-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        
        .container {
          padding: 20px;
        }
        
        .auction-card {
          background: #1e293b;
          padding: 20px;
          border-radius: 15px;
          margin-bottom: 20px;
        }
        
        .auction-card h2 {
          margin: 0 0 15px 0;
        }
        
        .auction-card p {
          margin: 10px 0;
          font-size: 18px;
        }
        
        .bid-btn {
          background: #a855f7;
          border: none;
          padding: 10px 20px;
          color: white;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          transition: 0.3s;
        }
        
        .bid-btn:hover {
          background: #9333ea;
        }
        
        .bid-btn:disabled {
          background: #4b5563;
          cursor: not-allowed;
        }
        
        .admin-card {
          background: #1e293b;
          padding: 20px;
          border-radius: 15px;
          margin-top: 20px;
        }
        
        .admin-card h3 {
          margin: 0 0 15px 0;
        }
        
        .admin-input {
          padding: 10px;
          margin: 5px;
          border: none;
          border-radius: 8px;
          background: #0f172a;
          color: white;
          font-size: 14px;
          width: calc(100% - 30px);
        }
        
        .admin-input::placeholder {
          color: #64748b;
        }
        
        .admin-btn {
          background: #a855f7;
          border: none;
          padding: 10px 20px;
          color: white;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 10px;
        }
        
        .admin-btn:hover {
          background: #9333ea;
        }
        
        .timer-urgent {
          color: #ef4444;
        }
        
        .revenue {
          color: #22c55e;
        }
      `}</style>
      
      <div className="auction-page">
        {/* Header */}
        <header className="auction-header">
          <button className="back-btn" onClick={() => navigate('/super-home')}>←</button>
          <span>⚡ BidBlitz Live Auction</span>
        </header>
        
        <div className="container">
          {/* Auction Card */}
          <div className="auction-card">
            <h2>{productName}</h2>
            
            <p>Preis: €<strong>{price.toFixed(2)}</strong></p>
            
            <p className={timer <= 3 ? 'timer-urgent' : ''}>
              Timer: <strong>{timer}</strong>s
            </p>
            
            <p>Gebote: <strong>{bids}</strong></p>
            
            <p className="revenue">
              Umsatz: €<strong>{revenue.toFixed(2)}</strong>
            </p>
            
            <button 
              className="bid-btn" 
              onClick={bid}
              disabled={auctionFinished}
            >
              Bieten
            </button>
          </div>
          
          {/* Admin Panel */}
          <div className="admin-card">
            <h3>Admin Panel</h3>
            
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
              Auktion starten
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
