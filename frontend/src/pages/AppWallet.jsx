/**
 * BidBlitz App Wallet - Simple Card Style
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppWallet() {
  const [balance, setBalance] = useState(0);
  const [adding, setAdding] = useState(false);
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/wallet/balance`, { headers });
      setBalance(res.data.coins || 0);
    } catch (error) {
      console.log('Balance error');
    }
  };
  
  const addCoins = async () => {
    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/wallet/add-coins?amount=1000`, {}, { headers });
      setBalance(res.data.new_balance);
    } catch (error) {
      console.log('Add error');
    } finally {
      setAdding(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-20">
      <div className="p-5">
        <div className="card bg-[#1c213f] p-5 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Wallet</h2>
          <h1 className="text-4xl font-bold mb-6">{balance.toLocaleString()} Coins</h1>
          <button
            onClick={addCoins}
            disabled={adding}
            className="px-6 py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Coins'}
          </button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
