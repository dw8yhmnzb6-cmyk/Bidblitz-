/**
 * BidBlitz Referral System
 * Modern invite friends and earn coins page with glassmorphism
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Referral() {
  const [coins, setCoins] = useState(0);
  const [myCode, setMyCode] = useState('BIDBLITZ2024');
  const [referrals, setReferrals] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [friendCode, setFriendCode] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentReferrals, setRecentReferrals] = useState([]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [walletRes, refRes] = await Promise.all([
        axios.get(`${API}/app/wallet/balance`, { headers }),
        axios.get(`${API}/app/referral/my-code`, { headers })
      ]);
      
      setCoins(walletRes.data.coins || 0);
      setMyCode(refRes.data.code || 'BIDBLITZ2024');
      setReferrals(refRes.data.referrals || 0);
      setEarnings(refRes.data.earnings || 0);
      setRecentReferrals(refRes.data.recent || []);
    } catch (error) {
      console.log('Data error');
    }
  };
  
  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'BidBlitz - Jetzt beitreten!',
        text: `Hey! Nutze meinen Code ${myCode} und erhalte 50 Coins Startbonus bei BidBlitz!`,
        url: window.location.origin
      });
    } else {
      copyCode();
    }
  };
  
  const joinWithCode = async () => {
    if (!friendCode.trim()) {
      setResult('Bitte Code eingeben');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.post(`${API}/app/referral/use-code?code=${friendCode}`, {}, { headers });
      
      setResult(res.data.message);
      setCoins(res.data.new_balance);
      setFriendCode('');
    } catch (error) {
      setResult(error.response?.data?.detail || 'Code ungültig oder bereits verwendet');
    }
  };

  const rewards = [
    { level: 1, count: '1-5', bonus: '100', icon: '🥉' },
    { level: 2, count: '6-15', bonus: '150', icon: '🥈' },
    { level: 3, count: '16+', bonus: '200', icon: '🥇' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e24] via-[#0f1332] to-[#0b0e24] text-white pb-24">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-72 h-72 bg-purple-500/15 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/super-app" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <span className="text-lg">←</span>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">Freunde einladen</h2>
              <p className="text-xs text-slate-400">Teile & verdiene Coins</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Dein Guthaben</p>
            <p className="text-lg font-bold text-amber-400">{coins.toLocaleString()} 💰</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-4 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👥</span>
              <span className="text-xs text-emerald-400/80">Einladungen</span>
            </div>
            <p className="text-3xl font-bold">{referrals}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-4 rounded-2xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💰</span>
              <span className="text-xs text-amber-400/80">Verdient</span>
            </div>
            <p className="text-3xl font-bold">{earnings.toLocaleString()}</p>
          </div>
        </div>

        {/* Your Invite Code Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#6c63ff]/30 via-[#8b6dff]/20 to-transparent p-6 rounded-3xl mb-6 border border-[#6c63ff]/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6c63ff]/20 rounded-full blur-2xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎁</span>
              <p className="text-slate-300 text-sm font-medium">Dein Einladungscode</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/10">
              <p className="text-3xl font-bold text-center tracking-widest font-mono text-white">{myCode}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyCode}
                className={`py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
                data-testid="copy-code-btn"
              >
                {copied ? '✓ Kopiert!' : '📋 Kopieren'}
              </button>
              <button
                onClick={shareCode}
                className="py-3.5 px-4 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                data-testid="share-code-btn"
              >
                📤 Teilen
              </button>
            </div>
          </div>
        </div>
        
        {/* Enter Friend Code */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl mb-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤝</span>
            <h3 className="font-semibold">Code einlösen</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              placeholder="Code eingeben..."
              className="flex-1 p-3.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:border-[#6c63ff] focus:outline-none transition-all font-mono text-center tracking-wider"
              data-testid="friend-code-input"
            />
            <button
              onClick={joinWithCode}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold transition-all"
              data-testid="use-code-btn"
            >
              ✓
            </button>
          </div>
          {result && (
            <div className={`mt-3 p-3 rounded-xl text-sm text-center ${
              result.includes('erhalten') || result.includes('Erfolg')
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {result}
            </div>
          )}
        </div>
        
        {/* Rewards Tiers */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl mb-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h3 className="font-semibold">Belohnungs-Stufen</h3>
          </div>
          <div className="space-y-3">
            {rewards.map((tier) => (
              <div 
                key={tier.level}
                className={`p-4 rounded-xl flex items-center justify-between ${
                  referrals >= parseInt(tier.count.split('-')[0]) 
                    ? 'bg-[#6c63ff]/20 border border-[#6c63ff]/30' 
                    : 'bg-white/5 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <p className="font-medium">Level {tier.level}</p>
                    <p className="text-xs text-slate-400">{tier.count} Einladungen</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">+{tier.bonus}</p>
                  <p className="text-xs text-slate-500">pro Invite</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💡</span>
            <h3 className="font-semibold">So funktioniert's</h3>
          </div>
          <div className="space-y-4">
            {[
              { step: '1', icon: '📤', text: 'Teile deinen Code mit Freunden' },
              { step: '2', icon: '📝', text: 'Freund registriert sich mit Code' },
              { step: '3', icon: '🎁', text: 'Beide erhalten Bonus-Coins!' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#6c63ff]/20 flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                <p className="text-sm text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-5 p-4 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-medium text-sm">Bonus-Info</p>
                <p className="text-xs text-slate-400">Du erhältst <span className="text-emerald-400 font-bold">100 Coins</span> • Dein Freund bekommt <span className="text-amber-400 font-bold">50 Coins</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
