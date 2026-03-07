/**
 * BidBlitz Games Hub V2
 * All games with daily limits, rewards, and new mini-games
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function GamesHub() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(500);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState('');
  const [dailyPlays, setDailyPlays] = useState({});
  
  // Games with daily limits and reward ranges
  const games = {
    wheel: { name: 'Spin Wheel', icon: '🎡', min: 5, max: 50, limit: 3, color: 'from-purple-500/20 to-pink-500/10', border: 'border-purple-500/30' },
    scratch: { name: 'Scratch Card', icon: '🎫', min: 10, max: 40, limit: 5, color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30' },
    reaction: { name: 'Reaction Game', icon: '⚡', min: 3, max: 10, limit: 20, color: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/30' },
    taprush: { name: 'Tap Rush', icon: '👆', min: 5, max: 25, limit: 10, color: 'from-emerald-500/20 to-green-500/10', border: 'border-emerald-500/30' },
    coinhunt: { name: 'Coin Hunt', icon: '🗺️', min: 10, max: 30, limit: 10, color: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/30' },
  };
  
  useEffect(() => {
    fetchData();
    loadDailyPlays();
  }, []);
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/wallet/balance`, { headers });
      setCoins(res.data.coins || 500);
    } catch (error) {
      console.log('Coins error');
    }
  };

  const loadDailyPlays = () => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`dailyPlays_${today}`);
    if (saved) {
      setDailyPlays(JSON.parse(saved));
    }
  };

  const saveDailyPlays = (plays) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`dailyPlays_${today}`, JSON.stringify(plays));
  };
  
  const playGame = async (gameKey) => {
    const game = games[gameKey];
    const currentPlays = dailyPlays[gameKey] || 0;
    
    if (currentPlays >= game.limit) {
      setResult({ type: 'limit', game: gameKey, message: `Tägliches Limit erreicht! (${game.limit}/${game.limit})` });
      setTimeout(() => setResult(''), 3000);
      return;
    }
    
    setLoading(gameKey);
    
    // Try backend first
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/core/games/play`, { game: gameKey }, { headers });
      
      setCoins(res.data.new_balance);
      const newPlays = { ...dailyPlays, [gameKey]: currentPlays + 1 };
      setDailyPlays(newPlays);
      saveDailyPlays(newPlays);
      
      setResult({ type: 'win', game: gameKey, amount: res.data.reward });
    } catch (error) {
      // Fallback to local
      const reward = Math.floor(Math.random() * (game.max - game.min + 1)) + game.min;
      
      const newPlays = { ...dailyPlays, [gameKey]: currentPlays + 1 };
      setDailyPlays(newPlays);
      saveDailyPlays(newPlays);
      setCoins(prev => prev + reward);
      
      setResult({ type: 'win', game: gameKey, amount: reward });
    }
    
    setLoading('');
    setTimeout(() => setResult(''), 3000);
  };
  
  const getRemainingPlays = (gameKey) => {
    const game = games[gameKey];
    const played = dailyPlays[gameKey] || 0;
    return game.limit - played;
  };

  // Quick games (no limits)
  const quickGames = [
    { id: 'slots', icon: '🎰', name: 'Slots' },
    { id: 'dice', icon: '🎲', name: 'Würfel' },
    { id: 'flip', icon: '🪙', name: 'Flip' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e24] via-[#0f1332] to-[#0b0e24] text-white pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">🎮 BidBlitz Games</h2>
            <p className="text-xs text-slate-400">Spiele & verdiene Coins!</p>
          </div>
          <div className="bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30">
            <span className="text-amber-400 font-bold" data-testid="coins-display">
              {coins.toLocaleString()} 💰
            </span>
          </div>
        </div>

        {/* Result Toast */}
        {result && (
          <div className={`mb-4 p-4 rounded-2xl text-center font-bold animate-bounce ${
            result.type === 'win'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`} data-testid="game-result">
            {result.type === 'win' ? `+${result.amount} Coins! 🎉` : result.message}
          </div>
        )}
        
        {/* Main Games with Limits */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-slate-400 uppercase tracking-wider">Tägliche Spiele</h3>
            <span className="text-xs text-slate-500">Mit Limits</span>
          </div>
          <div className="grid grid-cols-2 gap-4" data-testid="games-grid">
            {Object.entries(games).map(([key, game]) => {
              const remaining = getRemainingPlays(key);
              const isLimitReached = remaining <= 0;
              
              return (
                <div 
                  key={key}
                  className={`bg-gradient-to-br ${game.color} p-5 rounded-2xl border ${game.border} transition-all ${isLimitReached ? 'opacity-50' : ''}`}
                  data-testid={`game-${key}`}
                >
                  <span className="text-4xl block mb-2">{game.icon}</span>
                  <h4 className="font-semibold mb-1">{game.name}</h4>
                  <p className="text-xs text-slate-400 mb-1">{game.min}-{game.max} Coins</p>
                  <p className={`text-xs mb-3 ${isLimitReached ? 'text-red-400' : 'text-emerald-400'}`}>
                    {remaining}/{game.limit} übrig
                  </p>
                  <button
                    onClick={() => playGame(key)}
                    disabled={loading === key || isLimitReached}
                    className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                      isLimitReached
                        ? 'bg-slate-600 cursor-not-allowed'
                        : loading === key
                          ? 'bg-emerald-500 cursor-wait'
                          : 'bg-[#6c63ff] hover:bg-[#8b6dff]'
                    }`}
                    data-testid={`btn-${key}`}
                  >
                    {loading === key ? '⏳' : isLimitReached ? 'Limit' : 'Spielen'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Auction Card */}
        <Link 
          to="/live-auction"
          className="block mb-6 bg-gradient-to-br from-red-500/20 to-orange-500/10 p-5 rounded-2xl border border-red-500/30 transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🔥</span>
              <div>
                <h4 className="font-bold text-lg">Live Auction</h4>
                <p className="text-xs text-slate-400">Biete & gewinne Produkte!</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-[#6c63ff] rounded-xl font-medium">Bieten</span>
          </div>
        </Link>
        
        {/* Quick Games */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span>⚡</span> Quick Games
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {quickGames.map((game) => (
              <button
                key={game.id}
                onClick={() => playGame(game.id)}
                disabled={loading === game.id}
                className="bg-black/20 p-4 rounded-xl text-center hover:bg-[#6c63ff]/20 transition-all"
                data-testid={`btn-${game.id}`}
              >
                <span className="text-2xl block mb-1">{game.icon}</span>
                <span className="text-xs">{game.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link 
            to="/app-leaderboard"
            className="bg-white/5 p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all border border-white/5"
          >
            <span className="text-2xl">🏆</span>
            <span className="text-sm">Leaderboard</span>
          </Link>
          <Link 
            to="/map"
            className="bg-white/5 p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all border border-white/5"
          >
            <span className="text-2xl">🗺️</span>
            <span className="text-sm">Coin Hunt Map</span>
          </Link>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
