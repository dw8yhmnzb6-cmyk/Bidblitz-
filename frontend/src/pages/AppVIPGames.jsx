/**
 * BidBlitz VIP Exclusive Games
 * Only for VIP 5 members
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppVIPGames() {
  const navigate = useNavigate();
  const [vipLevel, setVipLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    checkVIPAccess();
  }, []);
  
  const checkVIPAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.get(`${API}/app/wallet/balance`, { headers });
      const totalEarned = res.data.total_earned || 0;
      setCoins(res.data.coins || 0);
      
      // VIP 5 requires 20000+ coins earned
      const level = totalEarned > 20000 ? 5 : totalEarned > 10000 ? 4 : totalEarned > 5000 ? 3 : totalEarned > 2000 ? 2 : 1;
      setVipLevel(level);
      setHasAccess(level >= 5);
    } catch (error) {
      setHasAccess(false);
    }
  };
  
  const playExclusiveGame = async (gameType, calculateWin) => {
    if (!hasAccess) return;
    
    setLoading(gameType);
    setResult('');
    
    await new Promise(r => setTimeout(r, 800));
    
    const win = calculateWin();
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.post(`${API}/app/games/play`, 
        { game_type: `vip_${gameType}` },
        { headers }
      );
      
      setCoins(res.data.new_balance || coins + win);
    } catch (error) {
      setCoins(prev => prev + win);
    }
    
    setResult(`+${win} Coins!`);
    setLoading('');
    setTimeout(() => setResult(''), 2000);
  };
  
  const vipGames = [
    { 
      id: 'diamond', 
      emoji: '💎', 
      name: 'Diamond Rush', 
      desc: 'Hohe Gewinne',
      calculate: () => Math.floor(Math.random() * 1000) + 500 
    },
    { 
      id: 'gold', 
      emoji: '🏅', 
      name: 'Gold Strike', 
      desc: 'Goldene Belohnungen',
      calculate: () => Math.floor(Math.random() * 800) + 300 
    },
    { 
      id: 'crown', 
      emoji: '👑', 
      name: 'Crown Jackpot', 
      desc: 'Mega Jackpots',
      calculate: () => Math.floor(Math.random() * 2000) 
    },
    { 
      id: 'vip_spin', 
      emoji: '🎰', 
      name: 'VIP Slots', 
      desc: '10x Multiplikator',
      calculate: () => (Math.floor(Math.random() * 100) + 50) * 10 
    },
  ];
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
        <div className="p-5">
          <h2 className="text-2xl font-bold mb-5">👑 VIP Exclusive Games</h2>
          
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 p-6 rounded-2xl text-center">
            <p className="text-6xl mb-4">🔒</p>
            <h3 className="text-xl font-bold mb-2">VIP 5 erforderlich</h3>
            <p className="text-slate-400 mb-4">
              Du bist aktuell VIP {vipLevel}. Erreiche VIP 5 um exklusive Spiele freizuschalten!
            </p>
            <p className="text-sm text-purple-400">
              Verdiene 20.000+ Coins um VIP 5 zu werden
            </p>
            
            <button
              onClick={() => navigate('/app-vip')}
              className="mt-6 px-6 py-3 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-semibold"
            >
              VIP Status ansehen
            </button>
          </div>
        </div>
        
        <BottomNav />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-2">👑 VIP Exclusive Games</h2>
        <p className="text-slate-400 mb-5">
          Coins: <span className="text-amber-400 font-bold">{coins.toLocaleString()}</span>
        </p>
        
        {/* VIP Badge */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-700/20 border border-amber-500/30 p-4 rounded-xl mb-5 text-center">
          <p className="text-amber-400 font-bold">✨ VIP 5 Mitglied ✨</p>
          <p className="text-xs text-slate-400">Exklusive Spiele freigeschaltet</p>
        </div>
        
        {/* Result */}
        {result && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-center text-green-400 font-bold text-lg">
            {result}
          </div>
        )}
        
        {/* VIP Games Grid */}
        <div className="grid grid-cols-2 gap-4" data-testid="vip-games-grid">
          {vipGames.map((game) => (
            <div 
              key={game.id}
              className="bg-gradient-to-br from-[#171a3a] to-[#252b4d] p-5 rounded-2xl text-center border border-purple-500/20"
              data-testid={`vip-game-${game.id}`}
            >
              <p className="text-3xl mb-2">{game.emoji}</p>
              <h4 className="font-semibold mb-1">{game.name}</h4>
              <p className="text-xs text-slate-400 mb-3">{game.desc}</p>
              <button
                onClick={() => playExclusiveGame(game.id, game.calculate)}
                disabled={loading === game.id}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 
                           rounded-xl font-medium disabled:opacity-50 text-black"
                data-testid={`play-${game.id}`}
              >
                {loading === game.id ? '...' : 'Play'}
              </button>
            </div>
          ))}
        </div>
        
        {/* Rewards Info */}
        <div className="mt-5 bg-[#171a3a] p-4 rounded-xl text-sm text-slate-400">
          <h4 className="font-semibold text-white mb-2">VIP Belohnungen:</h4>
          <p>💎 Diamond Rush: 500-1500 Coins</p>
          <p>🏅 Gold Strike: 300-1100 Coins</p>
          <p>👑 Crown Jackpot: 0-2000 Coins</p>
          <p>🎰 VIP Slots: 500-1500 Coins (10x)</p>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
