/**
 * BidBlitz App Admin Panel
 * Manage user coins, view stats
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppAdminPanel() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState(1000);
  const [action, setAction] = useState('add');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/admin/stats`, { headers });
      setStats(res.data);
    } catch (error) {
      console.log('Stats error');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim()) {
      setResult('Bitte User ID eingeben');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.post(`${API}/app/admin/coins`, {
        user_id: userId,
        amount: action === 'add' ? amount : -amount,
        action: action
      }, { headers });
      
      setResult(`✅ ${res.data.message}`);
      setUserId('');
      fetchStats();
    } catch (error) {
      setResult(`❌ ${error.response?.data?.detail || 'Fehler'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-6">🔧 Admin Panel</h2>
        
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#1c213f] p-4 rounded-xl">
              <p className="text-slate-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-[#6c63ff]">{stats.total_users || 0}</p>
            </div>
            <div className="bg-[#1c213f] p-4 rounded-xl">
              <p className="text-slate-400 text-sm">Total Miners</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.total_miners || 0}</p>
            </div>
            <div className="bg-[#1c213f] p-4 rounded-xl">
              <p className="text-slate-400 text-sm">Total Coins</p>
              <p className="text-2xl font-bold text-amber-400">{(stats.total_coins || 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#1c213f] p-4 rounded-xl">
              <p className="text-slate-400 text-sm">Games Today</p>
              <p className="text-2xl font-bold text-green-400">{stats.games_today || 0}</p>
            </div>
          </div>
        )}
        
        {/* Coin Management */}
        <div className="bg-[#1c213f] p-5 rounded-xl mb-4">
          <h3 className="font-semibold mb-4">💰 Coins verwalten</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="z.B. demo_user"
                className="w-full p-3 rounded-lg bg-[#0c0f22] border border-slate-700 
                           text-white placeholder-slate-500"
                data-testid="user-id-input"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Aktion</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction('add')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    action === 'add' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-[#0c0f22] text-slate-400'
                  }`}
                  data-testid="add-action-btn"
                >
                  ➕ Hinzufügen
                </button>
                <button
                  type="button"
                  onClick={() => setAction('remove')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    action === 'remove' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-[#0c0f22] text-slate-400'
                  }`}
                  data-testid="remove-action-btn"
                >
                  ➖ Abziehen
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Anzahl Coins</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                max="1000000"
                className="w-full p-3 rounded-lg bg-[#0c0f22] border border-slate-700 
                           text-white"
                data-testid="amount-input"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg 
                         font-semibold disabled:opacity-50"
              data-testid="submit-btn"
            >
              {loading ? 'Wird verarbeitet...' : 'Ausführen'}
            </button>
          </form>
          
          {result && (
            <p className={`mt-4 p-3 rounded-lg text-center ${
              result.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {result}
            </p>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="bg-[#1c213f] p-5 rounded-xl">
          <h3 className="font-semibold mb-3">⚡ Schnellaktionen</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setUserId('demo_user');
                setAmount(10000);
                setAction('add');
              }}
              className="w-full py-2.5 bg-[#0c0f22] hover:bg-[#6c63ff]/20 rounded-lg text-left px-4"
            >
              🎁 Demo User +10.000 Coins
            </button>
            <button
              onClick={fetchStats}
              className="w-full py-2.5 bg-[#0c0f22] hover:bg-[#6c63ff]/20 rounded-lg text-left px-4"
            >
              🔄 Stats aktualisieren
            </button>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
