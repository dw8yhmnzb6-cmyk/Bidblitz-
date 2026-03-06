/**
 * BidBlitz App Wallet - Minimalistic Dark Theme
 * Coin balance and transactions
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Wallet, Coins, ArrowUpRight, ArrowDownLeft, 
  History, Gift, ShoppingCart, Plus, ChevronRight,
  TrendingUp, Clock
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Transaction Item
const TransactionItem = ({ type, amount, description, time }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${type === 'in' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        {type === 'in' ? (
          <ArrowDownLeft className="w-4 h-4 text-green-400" />
        ) : (
          <ArrowUpRight className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div>
        <p className="font-medium text-sm">{description}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
    </div>
    <span className={`font-bold ${type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
      {type === 'in' ? '+' : '-'}{amount}
    </span>
  </div>
);

export default function AppWallet() {
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({ earned: 0, spent: 0 });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [walletRes, statsRes] = await Promise.all([
        axios.get(`${API}/app/wallet/balance`, { headers }),
        axios.get(`${API}/app/mining/stats`, { headers })
      ]);
      
      setBalance(walletRes.data.coins || 0);
      setStats({
        earned: statsRes.data.total_earned || 0,
        spent: statsRes.data.total_spent || 0
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const addTestCoins = async () => {
    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/wallet/add-coins?amount=1000`, {}, { headers });
      fetchBalance();
    } catch (error) {
      console.error('Error adding coins:', error);
    } finally {
      setAdding(false);
    }
  };
  
  // Mock transactions
  const transactions = [
    { type: 'in', amount: 5, description: 'Mining Reward', time: 'Gerade eben' },
    { type: 'out', amount: 100, description: 'Miner gekauft', time: 'Vor 5 Min' },
    { type: 'in', amount: 50, description: 'Spiel gewonnen', time: 'Vor 1 Std' },
    { type: 'in', amount: 1000, description: 'Startguthaben', time: 'Vor 2 Std' },
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0f22] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-24">
      {/* Header */}
      <div className="p-5 pt-6">
        <h1 className="text-2xl font-bold mb-1">Wallet</h1>
        <p className="text-slate-400 text-sm">Dein Coin-Guthaben</p>
      </div>
      
      {/* Balance Card */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-br from-[#6c63ff] to-[#8b5cf6] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-white/70" />
            <span className="text-white/70 text-sm">Verfügbar</span>
          </div>
          <div className="flex items-end gap-2 mb-6">
            <span className="text-4xl font-bold">{balance.toLocaleString()}</span>
            <Coins className="w-8 h-8 text-amber-300 mb-1" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={addTestCoins}
              disabled={adding}
              className="py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Laden...' : 'Aufladen'}
            </button>
            <Link
              to="/miner-market"
              className="py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Ausgeben
            </Link>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1c213f] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Verdient</span>
            </div>
            <p className="text-xl font-bold text-green-400">+{stats.earned.toLocaleString()}</p>
          </div>
          <div className="bg-[#1c213f] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Ausgegeben</span>
            </div>
            <p className="text-xl font-bold text-red-400">-{stats.spent.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="px-5 mb-6">
        <h2 className="font-semibold mb-3">Schnellaktionen</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/miner" className="bg-[#1c213f] rounded-xl p-3 text-center hover:bg-[#252b4d] transition-colors">
            <Gift className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <span className="text-xs">Claim</span>
          </Link>
          <Link to="/miner-market" className="bg-[#1c213f] rounded-xl p-3 text-center hover:bg-[#252b4d] transition-colors">
            <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
            <span className="text-xs">Shop</span>
          </Link>
          <Link to="/games" className="bg-[#1c213f] rounded-xl p-3 text-center hover:bg-[#252b4d] transition-colors">
            <Gift className="w-5 h-5 mx-auto mb-1 text-purple-400" />
            <span className="text-xs">Spielen</span>
          </Link>
        </div>
      </div>
      
      {/* Transactions */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-[#6c63ff]" />
            Transaktionen
          </h2>
          <button className="text-[#6c63ff] text-sm flex items-center gap-1">
            Alle <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="bg-[#1c213f] rounded-xl p-4">
          {transactions.map((tx, idx) => (
            <TransactionItem key={idx} {...tx} />
          ))}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
