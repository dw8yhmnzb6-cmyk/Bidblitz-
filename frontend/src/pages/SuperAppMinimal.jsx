/**
 * BidBlitz Super App Dashboard
 * 8-card grid with all main features
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function SuperAppMinimal() {
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState(0);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.get(`${API}/app/wallet/balance`, { headers });
      setBalance(res.data.coins || 0);
    } catch (error) {
      console.log('Data error');
    }
  };
  
  const cards = [
    { id: 'scan', emoji: '📷', label: 'Scan', path: '/scooter', color: 'hover:bg-cyan-600' },
    { id: 'pay', emoji: '💳', label: 'Pay', path: '/withdraw', color: 'hover:bg-green-600' },
    { id: 'taxi', emoji: '🚕', label: 'Taxi', path: '/taxi', color: 'hover:bg-amber-600' },
    { id: 'scooter', emoji: '🛴', label: 'Scooter', path: '/scooter', color: 'hover:bg-teal-600' },
    { id: 'games', emoji: '🎮', label: 'Games', path: '/games', color: 'hover:bg-purple-600' },
    { id: 'mining', emoji: '⛏️', label: 'Mining', path: '/miner', color: 'hover:bg-blue-600' },
    { id: 'marketplace', emoji: '🛒', label: 'Marketplace', path: '/market', color: 'hover:bg-pink-600' },
    { id: 'auctions', emoji: '🔨', label: 'Auctions', path: '/auctions', color: 'hover:bg-red-600' },
  ];
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold">BidBlitz Super App</h2>
          <Link 
            to="/app-notifications"
            className="relative p-2"
          >
            <span className="text-xl">🔔</span>
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {notifications}
              </span>
            )}
          </Link>
        </div>
        
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-[#6c63ff] to-[#8b6dff] p-5 rounded-2xl mb-5">
          <p className="text-white/80 text-sm">Wallet Balance</p>
          <p className="text-3xl font-bold">{balance.toLocaleString()} Coins</p>
          <div className="flex gap-2 mt-3">
            <Link 
              to="/withdraw"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm"
            >
              Withdraw
            </Link>
            <Link 
              to="/analytics"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm"
            >
              Analytics
            </Link>
          </div>
        </div>
        
        {/* 8-Card Grid */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {cards.map((card) => (
            <Link
              key={card.id}
              to={card.path}
              className={`bg-[#171a3a] p-4 rounded-2xl text-center cursor-pointer transition-all duration-200 ${card.color} active:scale-95`}
              data-testid={`card-${card.id}`}
            >
              <p className="text-2xl mb-1">{card.emoji}</p>
              <p className="text-xs">{card.label}</p>
            </Link>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link 
            to="/app-referral"
            className="bg-[#171a3a] p-4 rounded-2xl flex items-center gap-3 hover:bg-[#252b4d]"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-semibold">Invite Friends</p>
              <p className="text-xs text-slate-400">Earn 100 Coins</p>
            </div>
          </Link>
          <Link 
            to="/app-vip"
            className="bg-[#171a3a] p-4 rounded-2xl flex items-center gap-3 hover:bg-[#252b4d]"
          >
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-semibold">VIP Level</p>
              <p className="text-xs text-slate-400">Level Up!</p>
            </div>
          </Link>
        </div>
        
        {/* More Links */}
        <div className="bg-[#171a3a] p-4 rounded-2xl">
          <h3 className="font-semibold mb-3">More Features</h3>
          <div className="grid grid-cols-3 gap-2">
            <Link to="/map" className="p-2 text-center text-sm hover:bg-[#6c63ff]/20 rounded-xl">🗺️ Map</Link>
            <Link to="/favorite-routes" className="p-2 text-center text-sm hover:bg-[#6c63ff]/20 rounded-xl">📍 Routes</Link>
            <Link to="/driver-ratings" className="p-2 text-center text-sm hover:bg-[#6c63ff]/20 rounded-xl">⭐ Ratings</Link>
            <Link to="/app-leaderboard" className="p-2 text-center text-sm hover:bg-[#6c63ff]/20 rounded-xl">🏆 Ranking</Link>
            <Link to="/app-achievements" className="p-2 text-center text-sm hover:bg-[#6c63ff]/20 rounded-xl">🎖️ Badges</Link>
            <Link to="/sound-settings" className="p-2 text-center text-sm hover:bg-[#6c63ff]/20 rounded-xl">🔊 Sound</Link>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
