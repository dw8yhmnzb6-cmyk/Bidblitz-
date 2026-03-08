/**
 * BidBlitz Super App Home - Clean Minimal Design
 * Einfaches Grid-Layout mit Emoji-Icons wie vom Benutzer gewünscht
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Quick Actions mit Emojis
const QUICK_ACTIONS = [
  { id: 1, name: 'Games', emoji: '🎮', route: '/games' },
  { id: 2, name: 'Mining', emoji: '⛏️', route: '/mining' },
  { id: 3, name: 'Taxi', emoji: '🚕', route: '/ride-pay' },
  { id: 4, name: 'Scooter', emoji: '🛴', route: '/ride-pay' },
  { id: 5, name: 'Bike', emoji: '🚲', route: '/ride-pay' },
  { id: 6, name: 'Market', emoji: '🛒', route: '/auctions' },
  { id: 7, name: 'Lottery', emoji: '🎲', route: '/games' },
  { id: 8, name: 'Ranking', emoji: '🏆', route: '/leaderboard' },
];

// Navigation Items
const NAV_ITEMS = [
  { emoji: '🏠', route: '/super-home' },
  { emoji: '🎮', route: '/games' },
  { emoji: '💰', route: '/wallet' },
  { emoji: '👤', route: '/profile' },
];

export default function SuperAppHome() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(1200);

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchCoins();
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
    <div 
      className="min-h-screen pb-20"
      style={{ background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}
      data-testid="super-app-home"
    >
      {/* Header */}
      <div 
        className="flex justify-between items-center"
        style={{ padding: '20px', fontSize: '26px', fontWeight: 'bold' }}
      >
        <div>BidBlitz</div>
        <div 
          className="flex items-center gap-1"
          style={{ 
            background: '#7c3aed', 
            padding: '8px 14px', 
            borderRadius: '10px' 
          }}
        >
          💰 {coins.toLocaleString()}
        </div>
      </div>

      {/* Grid */}
      <div 
        className="grid"
        style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          padding: '20px'
        }}
      >
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            className="hover:bg-purple-600 transition-colors"
            style={{
              background: '#1f2937',
              padding: '25px 10px',
              borderRadius: '14px',
              textAlign: 'center',
              fontSize: '14px',
              cursor: 'pointer',
              border: 'none',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            data-testid={`quick-action-${action.name.toLowerCase()}`}
          >
            <span style={{ fontSize: '28px' }}>{action.emoji}</span>
            <span style={{ fontWeight: '500' }}>{action.name}</span>
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          background: '#111827',
          padding: '12px',
          fontSize: '24px'
        }}
      >
        {NAV_ITEMS.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.route)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px'
            }}
          >
            {item.emoji}
          </button>
        ))}
      </nav>
    </div>
  );
}
