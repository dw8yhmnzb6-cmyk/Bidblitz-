/**
 * BidBlitz Super App Home
 * With animated 3D spinning coin
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Animated 3D Coin Component
const SpinningCoin = () => (
  <div className="flex justify-center my-6">
    <div 
      className="w-20 h-20 rounded-full animate-spin-y"
      style={{
        background: 'linear-gradient(135deg, #ffd700, #ffae00)',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
      }}
    />
    <style jsx>{`
      @keyframes spinY {
        0% { transform: rotateY(0deg); }
        100% { transform: rotateY(360deg); }
      }
      .animate-spin-y {
        animation: spinY 4s linear infinite;
        transform-style: preserve-3d;
      }
    `}</style>
  </div>
);

export default function SuperAppMinimal() {
  const [balance, setBalance] = useState(0);
  const [jackpot, setJackpot] = useState({ amount: 200, participants: 0 });
  const [vip, setVip] = useState({ name: 'Bronze', points: 0 });
  const [liveFeed, setLiveFeed] = useState([]);
  const [dailyReward, setDailyReward] = useState(null);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchLiveFeed, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [walletRes, jackpotRes, vipRes, dailyRes] = await Promise.all([
        axios.get(`${API}/app/wallet/balance`, { headers }),
        axios.get(`${API}/app/jackpot/current`),
        axios.get(`${API}/app/vip/status`, { headers }),
        axios.get(`${API}/app/daily-reward/status`, { headers })
      ]);
      
      setBalance(walletRes.data.coins || 0);
      setJackpot(jackpotRes.data);
      setVip(vipRes.data);
      setDailyReward(dailyRes.data);
      fetchLiveFeed();
    } catch (error) {
      console.log('Data fetch error');
    }
  };
  
  const fetchLiveFeed = async () => {
    try {
      const res = await axios.get(`${API}/app/live-feed?limit=5`);
      setLiveFeed(res.data.feed || []);
    } catch (error) {
      console.log('Feed error');
    }
  };
  
  const claimDaily = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/daily-reward/claim`, {}, { headers });
      setMessage(res.data.message);
      setBalance(res.data.new_balance);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Fehler');
    }
  };
  
  const joinJackpot = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/jackpot/join`, {}, { headers });
      setMessage(res.data.message);
      setJackpot({ amount: res.data.jackpot_amount, participants: res.data.participants });
      setBalance(res.data.new_balance);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Fehler');
    }
  };
  
  const increaseVip = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/vip/add-points?points=10`, {}, { headers });
      setVip({
        name: res.data.name,
        points: res.data.total_points,
        level: res.data.level,
        bonus: res.data.bonus
      });
      setMessage(`+10 VIP Punkte! Level: ${res.data.name}`);
    } catch (error) {
      setMessage('Fehler');
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-20">
      <div id="screen" className="p-5">
        {/* Welcome Card with Spinning Coin */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
          <h2 className="text-2xl font-bold mb-1">BidBlitz</h2>
          <p className="text-slate-400">Welcome to the Super App</p>
          <SpinningCoin />
        </div>
        
        {/* Quick Access */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
          <p className="text-slate-400 mb-3">Quick Access</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/taxi" className="px-3 py-1.5 bg-[#0c0f22] rounded-lg text-sm hover:bg-[#6c63ff]/20">Taxi</Link>
            <Link to="/scooter" className="px-3 py-1.5 bg-[#0c0f22] rounded-lg text-sm hover:bg-[#6c63ff]/20">Scooter</Link>
            <Link to="/auctions" className="px-3 py-1.5 bg-[#0c0f22] rounded-lg text-sm hover:bg-[#6c63ff]/20">Auctions</Link>
            <Link to="/games" className="px-3 py-1.5 bg-[#0c0f22] rounded-lg text-sm hover:bg-[#6c63ff]/20">Games</Link>
          </div>
        </div>
        
        {/* Message */}
        {message && (
          <div className="mb-4 p-3 bg-[#6c63ff]/20 rounded-xl text-center text-sm">
            {message}
          </div>
        )}
        
        {/* Daily Reward */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
          <h3 className="font-semibold mb-3">Daily Reward</h3>
          <button
            onClick={claimDaily}
            disabled={!dailyReward?.can_claim}
            className={`w-full py-2.5 rounded-lg font-medium ${
              dailyReward?.can_claim
                ? 'bg-[#6c63ff] hover:bg-[#5a52e0]'
                : 'bg-slate-700 cursor-not-allowed text-slate-400'
            }`}
          >
            {dailyReward?.can_claim ? 'Claim Reward' : 'Already Claimed'}
          </button>
        </div>
        
        {/* Jackpot */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
          <h3 className="font-semibold mb-2">Jackpot</h3>
          <p className="text-2xl font-bold text-amber-400 mb-3">{jackpot.amount} Coins</p>
          <button
            onClick={joinJackpot}
            className="w-full py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium"
          >
            Join
          </button>
        </div>
        
        {/* VIP Level */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
          <h3 className="font-semibold mb-2">VIP Level</h3>
          <p className="text-2xl font-bold text-[#6c63ff] mb-3">{vip.name}</p>
          <button
            onClick={increaseVip}
            className="w-full py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium"
          >
            Increase Level
          </button>
        </div>
        
        {/* Live Feed */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl">
          <h3 className="font-semibold mb-3">Live Activity</h3>
          <div className="space-y-2">
            {liveFeed.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity</p>
            ) : (
              liveFeed.slice(0, 5).map((item, idx) => (
                <p key={idx} className="text-sm text-slate-300 py-1 border-b border-slate-700/50 last:border-0">
                  {item.action}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
