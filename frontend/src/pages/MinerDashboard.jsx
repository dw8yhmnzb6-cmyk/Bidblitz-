/**
 * BidBlitz Mining Dashboard - Simple Card Style
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MinerDashboard() {
  const [stats, setStats] = useState({ hashrate: 0, daily: 0, coins: 0 });
  const [miners, setMiners] = useState([]);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchData();
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
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-20">
      <div className="p-5">
        {/* Mining Stats */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
          <h2 className="text-xl font-semibold mb-4">Mining</h2>
          <p className="text-slate-400 mb-1">Power: <span className="text-cyan-400 font-bold">{stats.hashrate} TH</span></p>
          <p className="text-slate-400 mb-4">Reward: <span className="text-green-400 font-bold">{stats.daily} Coins/day</span></p>
          <button
            onClick={claimRewards}
            className="px-6 py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium"
          >
            Claim Rewards
          </button>
          {message && (
            <p className="mt-3 text-sm text-green-400">{message}</p>
          )}
        </div>
        
        {/* Miners List */}
        {miners.length > 0 && (
          <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
            <h3 className="font-semibold mb-3">Your Miners ({miners.length})</h3>
            <div className="space-y-3">
              {miners.map((miner) => (
                <div key={miner.id} className="p-3 bg-[#0c0f22] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{miner.name}</span>
                    <span className="text-xs text-slate-400 uppercase">{miner.tier}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">
                    Level {miner.level} • {miner.hashrate} TH/s • +{miner.daily_reward}/day
                  </p>
                  <button
                    onClick={() => upgradeMiner(miner.id)}
                    disabled={miner.level >= 10}
                    className={`text-sm px-3 py-1.5 rounded ${
                      miner.level >= 10 
                        ? 'bg-slate-700 text-slate-500' 
                        : 'bg-[#6c63ff] hover:bg-[#5a52e0]'
                    }`}
                  >
                    {miner.level >= 10 ? 'Max Level' : 'Upgrade Miner'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Buy Link */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl">
          <h3 className="font-semibold mb-3">Need more power?</h3>
          <Link
            to="/miner-market"
            className="block text-center py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium"
          >
            Buy Miners
          </Link>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
