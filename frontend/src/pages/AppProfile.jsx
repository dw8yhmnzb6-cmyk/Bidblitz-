/**
 * BidBlitz App Profile
 * User stats with Level system, Ranking, Earn Coins, and actions
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppProfile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('Afrim');
  const [coins, setCoins] = useState(1200);
  const [miners, setMiners] = useState(3);
  const [gamesWon, setGamesWon] = useState(47);
  const [referrals, setReferrals] = useState(5);
  const [level, setLevel] = useState(3);
  const [ranking, setRanking] = useState(12);
  const [xp, setXp] = useState(30);
  const [xpToNext, setXpToNext] = useState(100);
  const [vipStatus, setVipStatus] = useState('Bronze');
  const [message, setMessage] = useState('');
  const [earnLoading, setEarnLoading] = useState(false);
  
  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Level up when reaching coin thresholds
    const newLevel = Math.floor(coins / 500) + 1;
    if (newLevel !== level && newLevel > level) {
      setLevel(newLevel);
      setMessage(`🎉 Level Up! Du bist jetzt Level ${newLevel}!`);
      setTimeout(() => setMessage(''), 3000);
    }
    
    // Update VIP status based on level
    if (newLevel >= 10) setVipStatus('Platinum');
    else if (newLevel >= 7) setVipStatus('Gold');
    else if (newLevel >= 4) setVipStatus('Silver');
    else setVipStatus('Bronze');
    
    // Calculate XP progress
    setXp((coins % 500) / 5);
  }, [coins]);
  
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [walletRes, minersRes, vipRes, refRes] = await Promise.all([
        axios.get(`${API}/app/wallet/balance`, { headers }),
        axios.get(`${API}/app/miners/my`, { headers }),
        axios.get(`${API}/app/vip/status`, { headers }),
        axios.get(`${API}/app/referral/my-code`, { headers })
      ]);
      
      setCoins(walletRes.data.coins || 1200);
      setMiners(minersRes.data.count || 3);
      setReferrals(refRes.data.referrals || 5);
      
      // Get username
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          setUsername(userData.username || userData.name || 'Afrim');
        } catch (e) {}
      }
      
      // Get games count
      try {
        const gamesRes = await axios.get(`${API}/app/games/history?limit=100`, { headers });
        setGamesWon(gamesRes.data.history?.length || 47);
      } catch (e) {}
      
    } catch (error) {
      console.log('Profile fetch error');
    }
  };

  const earnCoins = async () => {
    if (earnLoading) return;
    
    setEarnLoading(true);
    
    // Add 50 coins
    const earned = 50;
    setCoins(prev => prev + earned);
    setMessage(`+${earned} Coins verdient! 🎉`);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/wallet/earn`, { amount: earned }, { headers });
    } catch (error) {
      // Continue with local state
    }
    
    setTimeout(() => {
      setMessage('');
      setEarnLoading(false);
    }, 2000);
  };
  
  const getVipColor = () => {
    switch (vipStatus) {
      case 'Platinum': return 'from-purple-500 to-pink-500';
      case 'Gold': return 'from-amber-400 to-yellow-500';
      case 'Silver': return 'from-slate-300 to-slate-400';
      default: return 'from-orange-400 to-amber-500';
    }
  };

  const getVipIcon = () => {
    switch (vipStatus) {
      case 'Platinum': return '💎';
      case 'Gold': return '👑';
      case 'Silver': return '🥈';
      default: return '🥉';
    }
  };

  const quickActions = [
    { icon: '🎮', label: 'Games', path: '/games' },
    { icon: '👥', label: 'Friends', path: '/friends' },
    { icon: '🎉', label: 'Events', path: '/events' },
    { icon: '💬', label: 'Chat', path: '/app-chat' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e24] via-[#0f1332] to-[#0b0e24] text-white pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative p-5">
        {/* Header with Settings */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Profil</h2>
          <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
            <span className="text-lg">⚙️</span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center text-emerald-400 font-bold animate-pulse">
            {message}
          </div>
        )}
        
        {/* Profile Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1c213f] to-[#171a3a] p-6 rounded-3xl mb-6 border border-white/10">
          {/* VIP Badge */}
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r ${getVipColor()} text-xs font-bold`}>
            {getVipIcon()} {vipStatus}
          </div>
          
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#6c63ff] to-[#8b6dff] rounded-2xl flex items-center justify-center text-4xl">
              👤
            </div>
            <div>
              <h3 className="text-2xl font-bold" data-testid="username">{username}</h3>
              <p className="text-slate-400">Level {level} • Rang #{ranking}</p>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Level {level}</span>
              <span className="text-slate-400">{Math.round(xp)}% zum nächsten Level</span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden">
              <div 
                id="bar"
                className="h-full bg-gradient-to-r from-[#6c63ff] to-[#8b6dff] rounded-full transition-all duration-500"
                style={{ width: `${xp}%` }}
              />
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/20 p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-amber-400" data-testid="coins">{coins.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Coins</p>
            </div>
            <div className="bg-black/20 p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-emerald-400" data-testid="level">{level}</p>
              <p className="text-xs text-slate-400">Level</p>
            </div>
            <div className="bg-black/20 p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-purple-400" data-testid="ranking">#{ranking}</p>
              <p className="text-xs text-slate-400">Ranking</p>
            </div>
          </div>
        </div>

        {/* Earn Coins Button */}
        <button
          onClick={earnCoins}
          disabled={earnLoading}
          className={`w-full py-4 rounded-2xl font-bold text-lg mb-6 transition-all ${
            earnLoading 
              ? 'bg-slate-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 active:scale-[0.98]'
          }`}
          data-testid="earn-coins-btn"
        >
          {earnLoading ? '⏳ Wird verarbeitet...' : '💰 Earn Coins (+50)'}
        </button>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⛏️</span>
              <span className="text-sm text-slate-400">Miners</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400" data-testid="miners">{miners}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎮</span>
              <span className="text-sm text-slate-400">Games Won</span>
            </div>
            <p className="text-2xl font-bold text-green-400" data-testid="games">{gamesWon}</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 mb-6">
          <h3 className="font-semibold mb-4">Schnellzugriff</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="p-3 bg-black/20 rounded-xl text-center hover:bg-[#6c63ff]/20 transition-all"
              >
                <span className="text-2xl block mb-1">{action.icon}</span>
                <span className="text-xs text-slate-400">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
          <h3 className="font-semibold mb-4">Deine Ziele</h3>
          <div className="space-y-3">
            {[
              { icon: '📈', label: 'Level erhöhen', desc: `${500 - (coins % 500)} Coins bis Level ${level + 1}`, progress: xp },
              { icon: '💰', label: 'Coins sammeln', desc: `${coins.toLocaleString()} / 10.000`, progress: (coins / 10000) * 100 },
              { icon: '🏆', label: 'Ranking verbessern', desc: `Aktuell Rang #${ranking}`, progress: ((100 - ranking) / 100) * 100 },
            ].map((goal) => (
              <div key={goal.label} className="bg-black/20 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{goal.icon}</span>
                    <span className="text-sm font-medium">{goal.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">{goal.desc}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#6c63ff] rounded-full transition-all"
                    style={{ width: `${Math.min(100, goal.progress)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
