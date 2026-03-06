/**
 * BidBlitz Miner Dashboard - GoMining Style
 * Professional dark theme mining dashboard with animated stats
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Cpu, Zap, Coins, TrendingUp, ArrowUpCircle, 
  Clock, ShoppingCart, History, Crown, ChevronRight,
  Activity, Server, Sparkles, Gift, Settings
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// ==================== ANIMATED COIN COUNTER ====================
const AnimatedCounter = ({ value, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString('de-DE')}{suffix}
    </span>
  );
};

// ==================== STAT CARD ====================
const StatCard = ({ icon: Icon, label, value, suffix = '', color = 'cyan', trend = null }) => (
  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 group">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2.5 rounded-xl bg-${color}-500/20 group-hover:bg-${color}-500/30 transition-colors`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <span className="text-slate-400 text-sm font-medium">{label}</span>
    </div>
    <div className="flex items-end justify-between">
      <span className="text-2xl font-bold text-white">
        <AnimatedCounter value={value} suffix={suffix} />
      </span>
      {trend && (
        <span className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  </div>
);

// ==================== MINER CARD ====================
const MinerCard = ({ miner, onUpgrade }) => {
  const tierColors = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-slate-400 to-slate-600',
    gold: 'from-yellow-500 to-amber-600',
    platinum: 'from-cyan-400 to-blue-600',
    diamond: 'from-purple-500 to-pink-600'
  };
  
  const tierGlow = {
    bronze: 'shadow-amber-500/20',
    silver: 'shadow-slate-400/20',
    gold: 'shadow-yellow-500/30',
    platinum: 'shadow-cyan-500/30',
    diamond: 'shadow-purple-500/40'
  };
  
  return (
    <div className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group shadow-lg ${tierGlow[miner.tier] || ''}`}>
      {/* Tier Badge */}
      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${tierColors[miner.tier]} text-white shadow-lg`}>
        {miner.tier}
      </div>
      
      {/* Level Badge */}
      <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-slate-700/80 text-cyan-400 text-xs font-bold">
        LVL {miner.level}
      </div>
      
      {/* Miner Image */}
      <div className="h-32 bg-gradient-to-b from-slate-700/30 to-transparent flex items-center justify-center pt-8">
        <div className="relative">
          <Server className="w-16 h-16 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-slate-900" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white text-lg mb-3">{miner.name}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Hashrate
            </span>
            <span className="text-cyan-400 font-semibold">{miner.hashrate} TH/s</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Power
            </span>
            <span className="text-amber-400 font-semibold">{miner.power}W</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Täglich
            </span>
            <span className="text-green-400 font-semibold">+{miner.daily_reward}</span>
          </div>
        </div>
        
        {/* Upgrade Button */}
        <button
          onClick={() => onUpgrade(miner.id)}
          disabled={miner.level >= 10}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            miner.level >= 10
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          {miner.level >= 10 ? 'Max Level' : `Upgrade (${Math.floor(miner.base_price * miner.level * 0.5)} Coins)`}
        </button>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function MinerDashboard() {
  const [stats, setStats] = useState(null);
  const [miners, setMiners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [statsRes, minersRes] = await Promise.all([
        axios.get(`${API}/app/mining/stats`, { headers }),
        axios.get(`${API}/app/miners/my`, { headers })
      ]);
      
      setStats(statsRes.data);
      setMiners(minersRes.data.miners || []);
    } catch (error) {
      console.error('Error fetching mining data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  const handleClaim = async () => {
    setClaiming(true);
    setClaimMessage('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/miner/claim`, { headers });
      setClaimMessage(res.data.message);
      fetchData();
    } catch (error) {
      setClaimMessage(error.response?.data?.detail || 'Fehler beim Sammeln');
    } finally {
      setClaiming(false);
    }
  };
  
  const handleUpgrade = async (minerId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/miner/upgrade`, { miner_id: minerId }, { headers });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Upgrade fehlgeschlagen');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 font-medium">Mining Dashboard wird geladen...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
              <Cpu className="w-10 h-10 text-cyan-400" />
              Mining Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Verwalte deine Mining-Farm und sammle Belohnungen</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/miner-market"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Miner kaufen
            </Link>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-400 hover:to-emerald-500 transition-all duration-300 shadow-lg shadow-green-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Gift className={`w-4 h-4 ${claiming ? 'animate-bounce' : ''}`} />
              {claiming ? 'Sammeln...' : 'Belohnungen sammeln'}
            </button>
          </div>
        </div>
        
        {/* Claim Message */}
        {claimMessage && (
          <div className={`mb-6 p-4 rounded-xl ${claimMessage.includes('Keine') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
            {claimMessage}
          </div>
        )}
        
        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Coins}
            label="Coins"
            value={stats?.coins || 0}
            color="amber"
          />
          <StatCard
            icon={Activity}
            label="Total Hashrate"
            value={stats?.total_hashrate || 0}
            suffix=" TH/s"
            color="cyan"
          />
          <StatCard
            icon={Zap}
            label="Power"
            value={stats?.total_power || 0}
            suffix="W"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Täglich"
            value={stats?.daily_reward || 0}
            suffix=" Coins"
            color="green"
            trend={stats?.vip_bonus || 0}
          />
        </div>
        
        {/* VIP Status */}
        {stats?.vip_level > 0 && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Crown className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-400">VIP Level {stats.vip_level}</h3>
                  <p className="text-amber-300/70 text-sm">+{stats.vip_bonus}% Bonus auf alle Belohnungen</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-amber-400">{stats.vip_bonus}%</span>
                <p className="text-amber-300/70 text-xs">Mining Bonus</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Mining Farm Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Server className="w-7 h-7 text-cyan-400" />
              Mining Farm
              <span className="ml-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full">
                {miners.length} Miner
              </span>
            </h2>
            <Link to="/mining-history" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-sm">
              <History className="w-4 h-4" /> Verlauf
            </Link>
          </div>
          
          {miners.length === 0 ? (
            <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700/50">
              <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Keine Miner vorhanden</h3>
              <p className="text-slate-400 mb-6">Kaufe deinen ersten Miner und starte das Mining!</p>
              <Link
                to="/miner-market"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
              >
                <ShoppingCart className="w-5 h-5" />
                Zum Miner-Markt
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {miners.map((miner) => (
                <MinerCard key={miner.id} miner={miner} onUpgrade={handleUpgrade} />
              ))}
            </div>
          )}
        </div>
        
        {/* Quick Stats Footer */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-700/50">
          <div className="text-center">
            <p className="text-slate-400 text-sm">Gesamt verdient</p>
            <p className="text-xl font-bold text-green-400">{(stats?.total_earned || 0).toLocaleString('de-DE')}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Gesamt ausgegeben</p>
            <p className="text-xl font-bold text-red-400">{(stats?.total_spent || 0).toLocaleString('de-DE')}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Miner Anzahl</p>
            <p className="text-xl font-bold text-cyan-400">{stats?.miner_count || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Nächste Belohnung</p>
            <p className="text-xl font-bold text-amber-400">~24h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
