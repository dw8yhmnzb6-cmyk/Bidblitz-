/**
 * BidBlitz Games Hub - Kategorisiert
 * Connected to Game Economy API
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const GAME_CATEGORIES = {
  top: {
    title: '🔥 Top Games',
    games: [
      { id: 1, name: 'Candy', icon: '🍬', gradient: 'from-pink-500 to-rose-600', url: '/games/candy.html', key: 'candy_match' },
      { id: 2, name: 'Wheel', icon: '🎡', gradient: 'from-purple-500 to-violet-600', url: '/games/wheel.html', key: 'lucky_wheel' },
      { id: 3, name: 'Reaction', icon: '⚡', gradient: 'from-yellow-500 to-amber-600', url: '/games/reaction.html', key: 'reaction' },
      { id: 4, name: 'Scratch', icon: '🎴', gradient: 'from-orange-500 to-orange-600', url: '/games/scratch.html', key: 'scratch' },
    ]
  },
  puzzle: {
    title: '🧠 Puzzle Games',
    games: [
      { id: 5, name: 'Puzzle', icon: '🧠', gradient: 'from-indigo-500 to-indigo-600', url: '/games/puzzle.html', key: 'puzzle' },
      { id: 6, name: 'Memory', icon: '🧩', gradient: 'from-teal-500 to-teal-600', url: '/games/memory.html', key: 'memory' },
      { id: 7, name: 'Blocks', icon: '🧱', gradient: 'from-amber-500 to-amber-600', url: '/games/blocks.html', key: 'blocks' },
      { id: 8, name: 'Snake', icon: '🐍', gradient: 'from-green-500 to-emerald-600', url: '/games/snake.html', key: 'snake' },
    ]
  },
  racing: {
    title: '🚗 Racing Games',
    games: [
      { id: 9, name: 'Racing', icon: '🚗', gradient: 'from-red-500 to-red-600', url: '/games/racing.html', key: 'racing' },
      { id: 10, name: 'Drift', icon: '🏎', gradient: 'from-blue-500 to-blue-600', url: '/games/drift.html', key: 'drift' },
      { id: 11, name: 'Speed', icon: '🏁', gradient: 'from-slate-500 to-slate-600', url: '/games/speed.html', key: 'speed' },
      { id: 12, name: 'Runner', icon: '🏃', gradient: 'from-cyan-500 to-cyan-600', url: '/games/runner.html', key: 'runner' },
    ]
  },
  casino: {
    title: '🎰 Casino Games',
    games: [
      { id: 13, name: 'Slots', icon: '🎰', gradient: 'from-fuchsia-500 to-fuchsia-600', url: '/games/slots.html', key: 'slots' },
      { id: 14, name: 'Dice', icon: '🎲', gradient: 'from-violet-500 to-violet-600', url: '/games/dice.html', key: 'dice' },
      { id: 15, name: 'Coin Flip', icon: '🪙', gradient: 'from-yellow-400 to-yellow-500', url: '/games/coinflip.html', key: 'coinflip' },
      { id: 16, name: 'Target', icon: '🎯', gradient: 'from-rose-500 to-rose-600', url: '/games/target.html', key: 'target' },
    ]
  }
};

export default function GamesHub() {
  const navigate = useNavigate();
  const [showGame, setShowGame] = useState(null);
  const [coins, setCoins] = useState(0);
  const [dailyBonusAvailable, setDailyBonusAvailable] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [showRewardPopup, setShowRewardPopup] = useState(false);

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const coinsRes = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(coinsRes.data.coins || 0);

      const bonusRes = await axios.get(`${API}/bbz/daily-bonus/status/${userId}`);
      setDailyBonusAvailable(!bonusRes.data.claimed_today);
    } catch (error) {
      console.log('Using default values');
    }
  };

  const claimDailyBonus = async () => {
    try {
      const res = await axios.post(`${API}/bbz/daily-bonus/${userId}`);
      if (res.data.success) {
        setCoins(res.data.new_balance);
        setDailyBonusAvailable(false);
        setLastReward({ type: 'daily', amount: res.data.bonus, streak: res.data.streak });
        setShowRewardPopup(true);
      }
    } catch (error) {
      console.error('Could not claim bonus');
    }
  };

  const playGame = (game) => {
    setShowGame(game);
  };

  const closeGame = async () => {
    if (showGame) {
      const won = Math.random() > 0.3;
      const score = Math.floor(Math.random() * 500);
      
      if (won) {
        try {
          const res = await axios.post(`${API}/bbz/games/reward`, {
            user_id: userId,
            game: showGame.key,
            won: true,
            score: score
          });
          
          if (res.data.success) {
            setCoins(res.data.new_balance);
            setLastReward({ type: 'game', amount: res.data.reward, game: showGame.name, score });
            setShowRewardPopup(true);
          }
        } catch (error) {
          console.error('Could not claim reward');
        }
      }
    }
    
    setShowGame(null);
    fetchUserData();
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ background: '#0f172a' }}>
      
      {/* Header */}
      <header className="p-5 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎮 BidBlitz Gaming</h1>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => navigate('/leaderboard')}
              className="bg-purple-600/30 p-2 rounded-lg cursor-pointer hover:bg-purple-600/50 transition-all"
            >
              🏆
            </div>
            <div className="bg-yellow-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span>🪙</span>
              <span className="font-bold text-yellow-400">{coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-5">
        
        {/* Daily Bonus Banner */}
        {dailyBonusAvailable && (
          <div 
            onClick={claimDailyBonus}
            className="mb-5 p-4 rounded-2xl cursor-pointer transform hover:scale-[1.02] transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">🎁 Täglicher Bonus!</h3>
                <p className="text-white/80 text-sm">Tippen zum Abholen</p>
              </div>
              <div className="text-4xl animate-bounce">🎁</div>
            </div>
          </div>
        )}

        {/* Game Categories */}
        {Object.entries(GAME_CATEGORIES).map(([key, category]) => (
          <div key={key} className="mb-6">
            <h2 className="text-lg font-semibold mb-3">{category.title}</h2>
            <div className="grid grid-cols-4 gap-3">
              {category.games.map(game => (
                <div
                  key={game.id}
                  onClick={() => playGame(game)}
                  className={`bg-gradient-to-br ${game.gradient} rounded-xl p-4 text-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg`}
                >
                  <div className="text-2xl mb-1">{game.icon}</div>
                  <div className="text-xs font-medium">{game.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div 
            onClick={() => navigate('/leaderboard')}
            className="bg-gradient-to-r from-purple-600 to-violet-600 p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h3 className="font-semibold">Leaderboard</h3>
                <p className="text-xs text-white/70">Top Spieler</p>
              </div>
            </div>
          </div>
          <div 
            onClick={() => navigate('/ride')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚕</span>
              <div>
                <h3 className="font-semibold">Ride & Pay</h3>
                <p className="text-xs text-white/70">Mit Coins bezahlen</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Game Modal */}
      {showGame && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-700 to-violet-700">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{showGame.icon}</span>
              <h3 className="font-bold text-white text-lg">{showGame.name}</h3>
            </div>
            <button 
              onClick={closeGame}
              className="px-4 py-2 rounded-xl text-white font-bold bg-white/20 hover:bg-white/30 transition-all"
            >
              ✕ Schließen
            </button>
          </div>
          <iframe 
            src={showGame.url} 
            className="flex-1 w-full border-none"
            title={showGame.name}
          />
        </div>
      )}

      {/* Reward Popup */}
      {showRewardPopup && lastReward && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div 
            className="max-w-sm w-full p-6 rounded-3xl text-center"
            style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', animation: 'bounceIn 0.4s ease-out' }}
          >
            <div className="text-6xl mb-4">
              {lastReward.type === 'daily' ? '🎁' : '🏆'}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {lastReward.type === 'daily' ? `Tag ${lastReward.streak} Bonus!` : 'Gewonnen!'}
            </h2>
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              +{lastReward.amount} 🪙
            </div>
            {lastReward.type === 'game' && (
              <p className="text-white/70 mb-4">
                {lastReward.game} • Score: {lastReward.score}
              </p>
            )}
            <button
              onClick={() => setShowRewardPopup(false)}
              className="px-8 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-white/90 transition-all"
            >
              Super! 🎉
            </button>
          </div>
        </div>
      )}

      <BottomNav />

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
