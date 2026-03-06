/**
 * BidBlitz Super App Home - Full Featured
 * With Jackpot, VIP Level, Live Activity
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Cpu, Gamepad2, Car, Wallet, QrCode, CreditCard,
  Gift, ShoppingBag, Crown, Coins, ChevronRight,
  Trophy, Sparkles, Activity, Users
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Quick Access Item
const QuickItem = ({ icon: Icon, label, to, emoji }) => (
  <Link
    to={to}
    className="flex flex-col items-center justify-center p-4 bg-[#1c213f] rounded-xl hover:bg-[#252b4d] transition-colors"
  >
    {emoji ? (
      <span className="text-2xl mb-1">{emoji}</span>
    ) : (
      <Icon className="w-6 h-6 mb-1 text-[#6c63ff]" />
    )}
    <span className="text-xs text-slate-300">{label}</span>
  </Link>
);

export default function SuperAppMinimal() {
  const [balance, setBalance] = useState(0);
  const [jackpot, setJackpot] = useState({ amount: 200, participants: 0 });
  const [vip, setVip] = useState({ name: 'Bronze', points: 0, level: 1 });
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
  
  const quickItems = [
    { emoji: '📷', label: 'Scan', to: '/scan' },
    { emoji: '💳', label: 'Pay', to: '/bidblitz-pay-info' },
    { emoji: '🚕', label: 'Taxi', to: '/taxi' },
    { emoji: '🛴', label: 'Scooter', to: '/scooter' },
    { emoji: '🎮', label: 'Games', to: '/games' },
    { emoji: '⛏️', label: 'Mining', to: '/miner' },
    { emoji: '🛍️', label: 'Market', to: '/miner-market' },
    { emoji: '🎁', label: 'Rewards', to: '/games' },
  ];
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-24">
      {/* Header */}
      <div className="p-5 pt-6">
        <h1 className="text-2xl font-bold">BidBlitz</h1>
      </div>
      
      {/* Wallet Card */}
      <div className="px-5 mb-5">
        <div className="bg-gradient-to-br from-[#6a5cff] to-[#8b7dff] rounded-2xl p-5 shadow-lg">
          <p className="text-white/70 text-sm">Wallet Balance</p>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            {balance.toLocaleString()}
            <Coins className="w-8 h-8 text-amber-300" />
          </h1>
        </div>
      </div>
      
      {/* Quick Access Grid */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {quickItems.map((item, idx) => (
            <QuickItem key={idx} {...item} />
          ))}
        </div>
      </div>
      
      {/* Message */}
      {message && (
        <div className="mx-5 mb-4 p-3 bg-[#6c63ff]/20 rounded-xl text-center text-sm">
          {message}
        </div>
      )}
      
      {/* Cards Section */}
      <div className="px-5 space-y-4">
        {/* Daily Reward */}
        <div className="bg-[#1c213f] rounded-xl p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            Daily Reward
          </h3>
          <button
            onClick={claimDaily}
            disabled={!dailyReward?.can_claim}
            className={`w-full py-2.5 rounded-lg font-medium text-sm ${
              dailyReward?.can_claim
                ? 'bg-[#6c63ff] hover:bg-[#5a52e0]'
                : 'bg-slate-700 cursor-not-allowed text-slate-400'
            }`}
          >
            {dailyReward?.can_claim ? 'Claim Reward' : 'Bereits abgeholt'}
          </button>
        </div>
        
        {/* Jackpot */}
        <div className="bg-[#1c213f] rounded-xl p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Jackpot
          </h3>
          <p className="text-2xl font-bold text-amber-400 mb-1">{jackpot.amount} Coins</p>
          <p className="text-xs text-slate-400 mb-3">{jackpot.participants} Teilnehmer</p>
          <button
            onClick={joinJackpot}
            className="w-full py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium text-sm"
          >
            Join (5 Coins)
          </button>
        </div>
        
        {/* VIP Level */}
        <div className="bg-[#1c213f] rounded-xl p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            VIP Level
          </h3>
          <p className="text-2xl font-bold text-[#6c63ff] mb-1">{vip.name}</p>
          <p className="text-xs text-slate-400 mb-3">{vip.points} Punkte • +{vip.bonus || 0}% Bonus</p>
          <button
            onClick={increaseVip}
            className="w-full py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium text-sm"
          >
            Increase Level (+10 Punkte)
          </button>
        </div>
        
        {/* Live Activity */}
        <div className="bg-[#1c213f] rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Live Activity
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {liveFeed.length === 0 ? (
              <p className="text-slate-500 text-sm">Keine Aktivitäten</p>
            ) : (
              liveFeed.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-slate-700/50 last:border-0">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'game_win' ? 'bg-green-400' :
                    item.type === 'jackpot' ? 'bg-amber-400' :
                    item.type === 'spin_win' ? 'bg-purple-400' :
                    'bg-cyan-400'
                  }`} />
                  <p className="text-sm text-slate-300">{item.action}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
