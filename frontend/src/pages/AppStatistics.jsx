/**
 * BidBlitz Statistics Panel
 * Live platform statistics with simulate activity
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppStatistics() {
  const [stats, setStats] = useState({
    users: 1520,
    online: 245,
    coins: 450000,
    power: 1850,
    games: 24500,
    market: 92000
  });
  
  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/app/platform/stats`);
      if (res.data) {
        setStats(prev => ({
          users: res.data.total_users || prev.users,
          online: res.data.online_users || prev.online,
          coins: res.data.total_coins || prev.coins,
          power: res.data.mining_power || prev.power,
          games: res.data.games_played || prev.games,
          market: res.data.market_volume || prev.market
        }));
      }
    } catch (error) {
      console.log('Stats fetch error');
    }
  };
  
  const simulate = () => {
    setStats(prev => ({
      users: prev.users + Math.floor(Math.random() * 5),
      online: Math.max(0, prev.online + Math.floor(Math.random() * 10) - 5),
      coins: prev.coins + Math.floor(Math.random() * 500),
      power: prev.power + Math.floor(Math.random() * 20),
      games: prev.games + Math.floor(Math.random() * 50),
      market: prev.market + Math.floor(Math.random() * 300)
    }));
  };
  
  const statBoxes = [
    { label: 'Total Users', value: stats.users.toLocaleString(), color: 'text-blue-400' },
    { label: 'Online Users', value: stats.online.toLocaleString(), color: 'text-green-400' },
    { label: 'Total Coins', value: stats.coins.toLocaleString(), color: 'text-amber-400' },
    { label: 'Mining Power', value: `${stats.power.toLocaleString()} TH`, color: 'text-cyan-400' },
    { label: 'Games Played', value: stats.games.toLocaleString(), color: 'text-purple-400' },
    { label: 'Marketplace Volume', value: `${stats.market.toLocaleString()} Coins`, color: 'text-pink-400' },
  ];
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-5">BidBlitz Statistics</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6" data-testid="stats-grid">
          {statBoxes.map((box, index) => (
            <div 
              key={index}
              className="bg-[#171a3a] p-4 rounded-2xl text-center"
              data-testid={`stat-box-${index}`}
            >
              <h3 className="text-xs text-slate-400 mb-1">{box.label}</h3>
              <p className={`text-lg font-bold ${box.color}`}>{box.value}</p>
            </div>
          ))}
        </div>
        
        {/* Simulate Controls */}
        <div className="bg-[#171a3a] p-5 rounded-2xl">
          <h3 className="font-semibold mb-3">Simulate Activity</h3>
          <button
            onClick={simulate}
            className="w-full py-3 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-medium
                       transition-colors active:scale-98"
            data-testid="simulate-btn"
          >
            Generate Activity
          </button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
