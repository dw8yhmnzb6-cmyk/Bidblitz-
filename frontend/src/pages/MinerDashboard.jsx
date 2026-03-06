/**
 * BidBlitz Mining Farm - Professional Design
 * With 3D animated miners and live BTC counter
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Animated 3D Machine Component
const Machine = ({ tier }) => {
  const gradients = {
    bronze: 'linear-gradient(135deg, #cd7f32, #8b5a2b)',
    silver: 'linear-gradient(135deg, #5f63ff, #8b6dff)',
    gold: 'linear-gradient(135deg, #ffd700, #ffb347)',
    platinum: 'linear-gradient(135deg, #00bfff, #1e90ff)',
    diamond: 'linear-gradient(135deg, #ff3cac, #784ba0)',
  };
  
  return (
    <div 
      className="w-20 h-20 mx-auto rounded-xl animate-spin-slow"
      style={{ 
        background: gradients[tier] || gradients.silver,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
      }}
    />
  );
};

export default function MinerDashboard() {
  const [stats, setStats] = useState({ hashrate: 0, daily: 0, coins: 0 });
  const [miners, setMiners] = useState([]);
  const [liveBtc, setLiveBtc] = useState(0.00000001);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchData();
    
    // Live mining counter
    const interval = setInterval(() => {
      setLiveBtc(prev => prev + 0.00000001);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [statsRes, minersRes] = await Promise.all([
        axios.get(`${API}/app/mining/stats`, { headers }),
        axios.get(`${API}/app/miners/my`, { headers })
      ]);
      
      setStats({
        hashrate: statsRes.data.total_hashrate || 0,
        daily: statsRes.data.daily_reward || 0,
        coins: statsRes.data.coins || 0
      });
      setMiners(minersRes.data.miners || []);
    } catch (error) {
      console.log('Data error');
    }
  };
  
  const claimRewards = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/miner/claim`, { headers });
      setMessage(res.data.message);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Error');
    }
  };
  
  const upgradeMiner = async (minerId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/miner/upgrade`, { miner_id: minerId }, { headers });
      setMessage('Miner upgraded!');
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Upgrade failed');
    }
  };
  
  // Convert daily coins to fake BTC for display
  const dailyBtc = (stats.daily * 0.00000001).toFixed(8);
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-5">BidBlitz Mining Farm</h2>
        
        {/* Overview Boxes */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1c213f] p-4 rounded-xl text-center">
            <p className="text-xs text-slate-400 mb-1">Total Power</p>
            <h3 className="text-lg font-bold text-cyan-400">{stats.hashrate} TH</h3>
          </div>
          <div className="bg-[#1c213f] p-4 rounded-xl text-center">
            <p className="text-xs text-slate-400 mb-1">Daily Profit</p>
            <h3 className="text-lg font-bold text-green-400">{dailyBtc} BTC</h3>
          </div>
          <div className="bg-[#1c213f] p-4 rounded-xl text-center">
            <p className="text-xs text-slate-400 mb-1">Active Miners</p>
            <h3 className="text-lg font-bold text-amber-400">{miners.length}</h3>
          </div>
        </div>
        
        {/* Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-500/20 rounded-xl text-center text-sm text-green-400">
            {message}
          </div>
        )}
        
        {/* Miners Grid */}
        {miners.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {miners.map((miner) => (
              <div 
                key={miner.id} 
                className="bg-[#14183a] p-4 rounded-xl text-center"
                style={{ boxShadow: '0 15px 40px rgba(0,0,0,0.6)' }}
              >
                <Machine tier={miner.tier} />
                <h3 className="font-semibold mt-3 mb-1">{miner.name}</h3>
                <p className="text-sm text-cyan-400 mb-3">{miner.hashrate} TH</p>
                <button
                  onClick={() => upgradeMiner(miner.id)}
                  disabled={miner.level >= 10}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    miner.level >= 10
                      ? 'bg-slate-700 text-slate-500'
                      : 'bg-[#6c63ff] hover:bg-[#5a52e0]'
                  }`}
                >
                  {miner.level >= 10 ? 'Max' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1c213f] p-8 rounded-xl text-center mb-6">
            <p className="text-slate-400 mb-4">No miners yet</p>
            <Link
              to="/miner-market"
              className="inline-block px-6 py-2.5 bg-[#6c63ff] rounded-lg font-medium"
            >
              Buy First Miner
            </Link>
          </div>
        )}
        
        {/* Live Mining */}
        <div className="bg-[#1c213f] p-5 rounded-xl text-center mb-6">
          <h3 className="font-semibold mb-2">Live Mining</h3>
          <p className="text-2xl font-bold text-green-400 font-mono">
            +{liveBtc.toFixed(8)} BTC
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={claimRewards}
            className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold"
          >
            Claim Rewards
          </button>
          <Link
            to="/miner-market"
            className="flex-1 py-3 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-xl font-semibold text-center"
          >
            Buy Miners
          </Link>
        </div>
      </div>
      
      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spinSlow {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 6s linear infinite;
          transform-style: preserve-3d;
        }
      `}</style>
      
      <BottomNav />
    </div>
  );
}
