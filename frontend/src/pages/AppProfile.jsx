/**
 * BidBlitz App Profile
 * User stats, Level system with progress bar, Quick actions
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppProfile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('User');
  const [coins, setCoins] = useState(1200);
  const [miners, setMiners] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [xp, setXp] = useState(20);
  const [level, setLevel] = useState('Bronze');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchProfile();
  }, []);
  
  useEffect(() => {
    updateLevel();
  }, [xp]);
  
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
      
      setCoins(walletRes.data.coins || 0);
      setMiners(minersRes.data.count || 0);
      setXp(vipRes.data.points || 0);
      setReferrals(refRes.data.referrals || 0);
      
      // Get games count from history
      try {
        const gamesRes = await axios.get(`${API}/app/games/history?limit=100`, { headers });
        setGamesWon(gamesRes.data.history?.length || 0);
      } catch (e) {
        setGamesWon(0);
      }
      
      // Get username from token or localStorage
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          setUsername(userData.username || userData.email?.split('@')[0] || 'User');
        } catch (e) {
          setUsername('User');
        }
      }
    } catch (error) {
      console.log('Profile fetch error');
    }
  };
  
  const updateLevel = () => {
    let newLevel = 'Bronze';
    if (xp > 90) newLevel = 'Platinum';
    else if (xp > 60) newLevel = 'Gold';
    else if (xp > 30) newLevel = 'Silver';
    setLevel(newLevel);
  };
  
  const getLevelColor = () => {
    switch (level) {
      case 'Platinum': return '#a855f7';
      case 'Gold': return '#f59e0b';
      case 'Silver': return '#94a3b8';
      default: return '#d97706';
    }
  };
  
  const playGame = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.post(`${API}/app/games/play`, 
        { game_type: 'quick_play' }, 
        { headers }
      );
      
      setCoins(res.data.new_balance || coins + 20);
      setGamesWon(prev => prev + 1);
      setXp(prev => Math.min(100, prev + 5));
      setMessage(`+${res.data.reward || 20} Coins gewonnen!`);
      
      // Add VIP points
      await axios.post(`${API}/app/vip/add-points?points=5`, {}, { headers });
    } catch (error) {
      setCoins(prev => prev + 20);
      setGamesWon(prev => prev + 1);
      setXp(prev => Math.min(100, prev + 5));
      setMessage('+20 Coins gewonnen!');
    }
    
    setTimeout(() => setMessage(''), 2000);
  };
  
  const mineReward = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.get(`${API}/app/miner/claim`, { headers });
      
      setCoins(res.data.new_balance || coins + 50);
      setXp(prev => Math.min(100, prev + 10));
      setMessage(res.data.message || '+50 Mining Reward!');
      
      // Add VIP points
      await axios.post(`${API}/app/vip/add-points?points=10`, {}, { headers });
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Kein Mining-Reward verfügbar');
    }
    
    setTimeout(() => setMessage(''), 2000);
  };
  
  const inviteFriend = async () => {
    navigate('/app-referral');
  };
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-5">BidBlitz Profile</h2>
        
        {/* Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-center text-green-400">
            {message}
          </div>
        )}
        
        {/* User Stats Card */}
        <div 
          className="bg-[#171a3a] p-5 rounded-2xl mb-5"
          data-testid="stats-card"
        >
          <h3 className="text-xl font-semibold mb-4" data-testid="username">
            User: {username}
          </h3>
          <div className="space-y-2 text-slate-300">
            <p>
              Coins: <span className="text-amber-400 font-bold" data-testid="coins">{coins.toLocaleString()}</span>
            </p>
            <p>
              Miners: <span className="text-cyan-400 font-bold" data-testid="miners">{miners}</span>
            </p>
            <p>
              Games Won: <span className="text-green-400 font-bold" data-testid="games">{gamesWon}</span>
            </p>
            <p>
              Referrals: <span className="text-purple-400 font-bold" data-testid="refs">{referrals}</span>
            </p>
          </div>
        </div>
        
        {/* Level Card */}
        <div 
          className="bg-[#171a3a] p-5 rounded-2xl mb-5"
          data-testid="level-card"
        >
          <h3 className="font-semibold mb-2">Level</h3>
          <p 
            className="text-2xl font-bold mb-3"
            style={{ color: getLevelColor() }}
            data-testid="level"
          >
            {level}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full h-5 bg-[#333] rounded-xl overflow-hidden">
            <div 
              className="h-full transition-all duration-500 rounded-xl"
              style={{ 
                width: `${Math.min(100, xp)}%`,
                background: '#6c63ff'
              }}
              data-testid="progress-bar"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{xp}/100 XP</p>
        </div>
        
        {/* Action Buttons */}
        <div 
          className="flex flex-wrap gap-3"
          data-testid="actions"
        >
          <button
            onClick={playGame}
            className="flex-1 min-w-[100px] py-3 px-4 bg-[#6c63ff] hover:bg-[#8b6dff] 
                       rounded-xl font-medium transition-colors"
            data-testid="btn-play"
          >
            Play Game
          </button>
          <button
            onClick={mineReward}
            className="flex-1 min-w-[100px] py-3 px-4 bg-[#6c63ff] hover:bg-[#8b6dff] 
                       rounded-xl font-medium transition-colors"
            data-testid="btn-mine"
          >
            Mining Reward
          </button>
          <button
            onClick={inviteFriend}
            className="flex-1 min-w-[100px] py-3 px-4 bg-[#6c63ff] hover:bg-[#8b6dff] 
                       rounded-xl font-medium transition-colors"
            data-testid="btn-invite"
          >
            Referral
          </button>
        </div>
        
        {/* Level Info */}
        <div className="mt-5 bg-[#171a3a] p-4 rounded-xl text-sm text-slate-400">
          <h4 className="font-semibold text-white mb-2">Level Stufen:</h4>
          <div className="space-y-1">
            <p><span className="text-[#d97706]">Bronze</span> - 0-30 XP</p>
            <p><span className="text-[#94a3b8]">Silver</span> - 31-60 XP</p>
            <p><span className="text-[#f59e0b]">Gold</span> - 61-90 XP</p>
            <p><span className="text-[#a855f7]">Platinum</span> - 91+ XP</p>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
