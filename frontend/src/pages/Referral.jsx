/**
 * BidBlitz Referral System
 * Invite friends and earn coins
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Referral() {
  const [coins, setCoins] = useState(0);
  const [myCode, setMyCode] = useState('');
  const [referrals, setReferrals] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [friendCode, setFriendCode] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  
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
      setMyCode(refRes.data.code || '');
      setReferrals(refRes.data.referrals || 0);
      setEarnings(refRes.data.earnings || 0);
    } catch (error) {
      console.log('Data error');
    }
  };
  
  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      setResult(error.response?.data?.detail || 'Fehler');
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-2">BidBlitz Referral</h2>
        <p className="text-slate-400 mb-6">Your Coins: <span className="text-amber-400 font-bold">{coins.toLocaleString()}</span></p>
        
        {/* Your Invite Code */}
        <div className="card bg-[#1c213f] p-5 rounded-xl mb-4">
          <p className="text-slate-400 text-sm mb-2">Your Invite Code</p>
          <h3 className="text-2xl font-bold text-[#6c63ff] mb-4 font-mono">{myCode}</h3>
          <button
            onClick={copyCode}
            className={`w-full py-2.5 rounded-lg font-medium transition-all ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-[#6c63ff] hover:bg-[#5a52e0] text-white'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>
        
        {/* Invite a Friend */}
        <div className="card bg-[#1c213f] p-5 rounded-xl mb-4">
          <h3 className="font-semibold mb-3">Invite a Friend</h3>
          <input
            type="text"
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
            placeholder="Enter Invite Code"
            className="w-full p-3 rounded-lg bg-[#0c0f22] border border-slate-700 text-white placeholder-slate-500 mb-3"
          />
          <button
            onClick={joinWithCode}
            className="w-full py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium"
          >
            Join
          </button>
          {result && (
            <p className={`mt-3 text-sm ${result.includes('erhalten') ? 'text-green-400' : 'text-amber-400'}`}>
              {result}
            </p>
          )}
        </div>
        
        {/* Stats */}
        <div className="card bg-[#1c213f] p-5 rounded-xl mb-4">
          <h3 className="font-semibold mb-3">Total Referrals</h3>
          <p className="text-3xl font-bold text-[#6c63ff]">{referrals}</p>
          <p className="text-sm text-slate-400 mt-2">Verdient: <span className="text-green-400">{earnings} Coins</span></p>
        </div>
        
        {/* Rewards Info */}
        <div className="card bg-[#1c213f] p-5 rounded-xl">
          <h3 className="font-semibold mb-3">Rewards</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p>• Du erhältst <span className="text-amber-400">100 Coins</span> pro Einladung</p>
            <p>• Dein Freund erhält <span className="text-green-400">50 Coins</span> Startbonus</p>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
