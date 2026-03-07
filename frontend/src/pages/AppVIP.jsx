/**
 * BidBlitz VIP System
 * Buy VIP levels with coins
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppVIP() {
  const [coins, setCoins] = useState(500);
  const [vipLevel, setVipLevel] = useState(0);
  const [xp, setXp] = useState(0);
  const [result, setResult] = useState('');
  const [buying, setBuying] = useState(null);

  const vipTiers = [
    { 
      level: 1, 
      price: 200, 
      name: 'VIP Bronze',
      icon: '🥉',
      benefits: ['+5% Mining Bonus', '+10 Daily Coins', 'Bronze Badge'],
      color: 'from-orange-500/20 to-amber-500/10',
      border: 'border-orange-500/30'
    },
    { 
      level: 2, 
      price: 500, 
      name: 'VIP Silver',
      icon: '🥈',
      benefits: ['+10% Mining Bonus', '+25 Daily Coins', 'Silver Badge', 'Priority Support'],
      color: 'from-slate-400/20 to-slate-500/10',
      border: 'border-slate-400/30'
    },
    { 
      level: 3, 
      price: 1000, 
      name: 'VIP Gold',
      icon: '👑',
      benefits: ['+20% Mining Bonus', '+50 Daily Coins', 'Gold Badge', 'Exclusive Games', 'VIP Auctions'],
      color: 'from-amber-400/20 to-yellow-500/10',
      border: 'border-amber-400/30'
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [walletRes, vipRes] = await Promise.all([
        axios.get(`${API}/app/wallet/balance`, { headers }),
        axios.get(`${API}/app/vip/status`, { headers })
      ]);
      
      setCoins(walletRes.data.coins || 500);
      setVipLevel(vipRes.data.level || 0);
      setXp(vipRes.data.xp || 0);
    } catch (error) {
      // Load from localStorage
      const savedLevel = parseInt(localStorage.getItem('vipLevel') || '0');
      setVipLevel(savedLevel);
    }
  };

  const buyVIP = async (tier) => {
    if (coins < tier.price) {
      setResult({ type: 'error', message: 'Nicht genug Coins!' });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    if (vipLevel >= tier.level) {
      setResult({ type: 'info', message: 'Du hast bereits dieses Level!' });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    setBuying(tier.level);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/vip/upgrade`, {
        level: tier.level,
        price: tier.price
      }, { headers });
    } catch (error) {
      // Continue with local update
    }

    setCoins(prev => prev - tier.price);
    setVipLevel(tier.level);
    localStorage.setItem('vipLevel', tier.level.toString());
    
    setResult({ type: 'success', message: `${tier.name} aktiviert! 🎉` });
    
    setTimeout(() => {
      setResult('');
      setBuying(null);
    }, 2000);
  };

  const getCurrentBadge = () => {
    if (vipLevel >= 3) return { name: 'Gold', icon: '👑', color: '#f59e0b' };
    if (vipLevel >= 2) return { name: 'Silver', icon: '🥈', color: '#94a3b8' };
    if (vipLevel >= 1) return { name: 'Bronze', icon: '🥉', color: '#cd7f32' };
    return { name: 'Kein VIP', icon: '⭐', color: '#6c63ff' };
  };

  const badge = getCurrentBadge();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e24] via-[#0f1332] to-[#0b0e24] text-white pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/super-app" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <span className="text-lg">←</span>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">👑 BidBlitz VIP</h2>
              <p className="text-xs text-slate-400">Premium-Vorteile freischalten</p>
            </div>
          </div>
          <div className="bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30">
            <span className="text-amber-400 font-bold" data-testid="coins">{coins.toLocaleString()} 💰</span>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`mb-4 p-4 rounded-xl text-center font-medium ${
            result.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : result.type === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {result.message}
          </div>
        )}

        {/* Current VIP Status */}
        <div 
          className="p-6 rounded-3xl text-center mb-6"
          style={{
            background: `linear-gradient(135deg, ${badge.color}33, ${badge.color}11)`,
            border: `2px solid ${badge.color}55`
          }}
        >
          <span className="text-5xl block mb-3">{badge.icon}</span>
          <p className="text-sm text-slate-400">Dein VIP Status</p>
          <h3 className="text-2xl font-bold" style={{ color: badge.color }}>
            {badge.name}
          </h3>
          <p className="text-sm text-slate-400 mt-2">VIP Level: {vipLevel}</p>
        </div>

        {/* VIP Tiers */}
        <div className="space-y-4" data-testid="vip-tiers">
          {vipTiers.map((tier) => {
            const isOwned = vipLevel >= tier.level;
            const canAfford = coins >= tier.price;
            
            return (
              <div 
                key={tier.level}
                className={`bg-gradient-to-br ${tier.color} p-5 rounded-2xl border ${tier.border} transition-all ${
                  isOwned ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{tier.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg">{tier.name}</h3>
                      <p className="text-amber-400 font-bold">{tier.price} Coins</p>
                    </div>
                  </div>
                  {isOwned && (
                    <span className="px-3 py-1 bg-emerald-500 text-xs rounded-full font-bold">
                      ✓ Aktiv
                    </span>
                  )}
                </div>

                {/* Benefits */}
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-2">Vorteile:</p>
                  <div className="flex flex-wrap gap-2">
                    {tier.benefits.map((benefit, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-black/20 rounded-lg text-xs"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => buyVIP(tier)}
                  disabled={isOwned || buying === tier.level || !canAfford}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isOwned
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                      : !canAfford
                        ? 'bg-slate-600 cursor-not-allowed opacity-50'
                        : buying === tier.level
                          ? 'bg-[#6c63ff] cursor-wait'
                          : 'bg-[#6c63ff] hover:bg-[#8b6dff]'
                  }`}
                  data-testid={`buy-vip-${tier.level}`}
                >
                  {isOwned ? '✓ Bereits aktiviert' : buying === tier.level ? 'Wird aktiviert...' : 'Aktivieren'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span>💡</span>
            <h4 className="font-semibold">VIP Info</h4>
          </div>
          <p className="text-sm text-slate-400">
            VIP-Level sind dauerhaft! Höhere Level enthalten alle Vorteile der niedrigeren Level.
          </p>
        </div>

        {/* Quick Link */}
        <Link 
          to="/store"
          className="mt-4 block bg-white/5 p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all border border-white/5"
        >
          <span className="text-2xl">🛍️</span>
          <div>
            <p className="font-medium">Store besuchen</p>
            <p className="text-xs text-slate-400">Mehr Items kaufen</p>
          </div>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
