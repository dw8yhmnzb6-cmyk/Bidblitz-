/**
 * BidBlitz Dashboard - Mit VIP Logic
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const SERVICES = [
  { emoji: '🎮', name: 'Games', route: '/games' },
  { emoji: '💰', name: 'Wallet', route: '/wallet' },
  { emoji: '🔥', name: 'Live Auctions', route: '/auctions' },
  { emoji: '👑', name: 'VIP Auctions', route: '/vip-auctions' },
  { emoji: '⛏', name: 'Mining', route: '/mining' },
  { emoji: '🛍', name: 'Marketplace', route: '/marketplace' },
  { emoji: '🚕', name: 'Taxi', route: '/taxi' },
  { emoji: '🛴', name: 'Scooter', route: '/scooter' },
];

// VIP Check Function
const checkVIP = (price) => {
  if (price >= 1000) {
    return "VIP";
  }
  return "NORMAL";
};

export default function SuperAppHome() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [vipStatus, setVipStatus] = useState('NORMAL');
  
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
      const userCoins = res.data.coins || 0;
      setCoins(userCoins);
      setVipStatus(checkVIP(userCoins));
    } catch {
      setCoins(100);
      setVipStatus('NORMAL');
    }
  };
  
  return (
    <>
      <style>{`
        .dashboard {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 20px;
        }
        
        .card {
          background: #1e293b;
          border-radius: 15px;
          padding: 25px;
          font-size: 18px;
          text-align: center;
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
          font-size: 36px;
          display: block;
          margin-bottom: 10px;
        }
      `}</style>
      
      <div style={{
        background: '#0f172a',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 999
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>⚡ BidBlitz</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {vipStatus === 'VIP' && (
              <span style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                👑 VIP
              </span>
            )}
            <div 
              onClick={() => navigate('/wallet')}
              style={{
                background: '#7c3aed',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              💰 {coins.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Dashboard Grid */}
        <div className="dashboard" style={{ paddingBottom: '100px' }}>
          {SERVICES.map((service, index) => (
            <button
              key={index}
              className="card"
              onClick={() => navigate(service.route)}
            >
              <span className="card-emoji">{service.emoji}</span>
              {service.name}
            </button>
          ))}
        </div>
        
        {/* Bottom Navigation */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#111827',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '15px',
          borderTop: '1px solid #1f2937'
        }}>
          <button style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '24px', cursor: 'pointer' }}>
            🏠
          </button>
          <button onClick={() => navigate('/games')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>
            🎮
          </button>
          <button onClick={() => navigate('/mining')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>
            ⛏
          </button>
          <button onClick={() => navigate('/wallet')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>
            💰
          </button>
        </div>
      </div>
    </>
  );
}
