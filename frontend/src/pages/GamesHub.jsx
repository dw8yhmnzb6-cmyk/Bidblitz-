/**
 * BidBlitz Games Hub - 16 Games Grid
 * Connected to Game Economy API
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';
import soundManager from '../utils/soundManager';
import { useLanguage } from '../context/LanguageContext';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const GAMES = [
  { id: 1, name: 'Candy Match', icon: '🍬', gradient: 'from-pink-500 to-rose-700', url: '/games/bbz_match3.html', key: 'candy_match', reward: { base: 10, max: 50 } },
  { id: 2, name: 'Lucky Wheel', icon: '🎡', gradient: 'from-purple-500 to-violet-700', url: '/games/lucky_spin.html', key: 'lucky_wheel', reward: { base: 5, max: 100 } },
  { id: 3, name: 'Reaction', icon: '⚡', gradient: 'from-yellow-500 to-amber-700', url: '/games/reaction.html', key: 'reaction', reward: { base: 5, max: 25 } },
  { id: 4, name: 'Scratch Card', icon: '🎴', gradient: 'from-orange-500 to-orange-700', url: '/games/scratch.html', key: 'scratch', reward: { base: 10, max: 50 } },
  { id: 5, name: 'Snake', icon: '🐍', gradient: 'from-green-500 to-emerald-700', url: '/games/snake.html', key: 'snake', reward: { base: 10, max: 75 } },
  { id: 6, name: 'Racing', icon: '🚗', gradient: 'from-red-500 to-red-700', url: '/games/runner.html', key: 'racing', reward: { base: 15, max: 80 } },
  { id: 7, name: 'Runner', icon: '🏃', gradient: 'from-blue-500 to-blue-700', url: '/games/runner.html', key: 'runner', reward: { base: 10, max: 60 } },
  { id: 8, name: 'Puzzle', icon: '🧠', gradient: 'from-indigo-500 to-indigo-700', url: '/games/puzzle.html', key: 'puzzle', reward: { base: 15, max: 100 } },
  { id: 9, name: 'Block Break', icon: '🧱', gradient: 'from-amber-500 to-amber-700', url: '/games/blocks.html', key: 'blocks', reward: { base: 10, max: 50 } },
  { id: 10, name: 'Target', icon: '🎯', gradient: 'from-rose-500 to-rose-700', url: '/games/target.html', key: 'target', reward: { base: 10, max: 60 } },
  { id: 11, name: 'Coin Flip', icon: '🪙', gradient: 'from-yellow-400 to-yellow-600', url: '/games/coinflip.html', key: 'coinflip', reward: { base: 10, max: 50 } },
  { id: 12, name: 'Space Game', icon: '🚀', gradient: 'from-slate-600 to-slate-800', url: '/games/space.html', key: 'space', reward: { base: 15, max: 90 } },
  { id: 13, name: 'Memory', icon: '🧩', gradient: 'from-teal-500 to-teal-700', url: '/games/memory.html', key: 'memory', reward: { base: 15, max: 80 } },
  { id: 14, name: 'Arcade', icon: '🎮', gradient: 'from-fuchsia-500 to-fuchsia-700', url: '/games/arcade.html', key: 'arcade', reward: { base: 20, max: 100 } },
  { id: 15, name: 'Classic', icon: '🕹', gradient: 'from-cyan-500 to-cyan-700', url: '/games/classic.html', key: 'classic', reward: { base: 15, max: 70 } },
  { id: 16, name: 'Dice Game', icon: '🎲', gradient: 'from-violet-500 to-violet-700', url: '/games/dice.html', key: 'dice', reward: { base: 5, max: 30 } },
];

export default function GamesHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showGame, setShowGame] = useState(null);
  const [coins, setCoins] = useState(0);
  const [leagueStatus, setLeagueStatus] = useState({ rank: 1, points: 0, tier: 'bronze' });
  const [dailyBonusAvailable, setDailyBonusAvailable] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [showRewardPopup, setShowRewardPopup] = useState(false);

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
    fetchUserData();
    soundManager.init();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get coins
      const coinsRes = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(coinsRes.data.coins || 0);

      // Check daily bonus
      const bonusRes = await axios.get(`${API}/bbz/daily-bonus/status/${userId}`);
      setDailyBonusAvailable(!bonusRes.data.claimed_today);

      // Get league status
      const leagueRes = await axios.get(`${API}/league/status?user_id=${userId}`);
      setLeagueStatus(leagueRes.data);
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
        soundManager.gameWin && soundManager.gameWin();
      }
    } catch (error) {
      console.error('Could not claim bonus');
    }
  };

  const playGame = async (game) => {
    soundManager.gameStart && soundManager.gameStart();
    setShowGame(game);
    
    try {
      await axios.post(`${API}/league/add-points?user_id=${userId}&points=5&source=game`);
    } catch (error) {
      console.log('Could not update league');
    }
  };

  const closeGame = async () => {
    soundManager.gameEnd && soundManager.gameEnd();
    
    // Simulate game win (in real app, game would call API)
    if (showGame) {
      const won = Math.random() > 0.3; // 70% win rate for demo
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

  const getTierEmoji = (tier) => {
    const emojis = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '👑' };
    return emojis[tier] || '🥉';
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ background: '#0f172a' }}>
      
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-white/10">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🎮 <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">BidBlitz Games</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span>🪙</span>
            <span className="font-bold text-yellow-400">{coins.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="p-4">
        
        {/* Daily Bonus Banner */}
        {dailyBonusAvailable && (
          <div 
            onClick={claimDailyBonus}
            className="mb-4 p-4 rounded-2xl cursor-pointer transform hover:scale-[1.02] transition-all animate-pulse"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">🎁 Täglicher Bonus bereit!</h3>
                <p className="text-white/80 text-sm">Tippen zum Abholen</p>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </div>
        )}

        {/* Weekly League */}
        <div 
          onClick={() => navigate('/missions')}
          className="mb-4 p-4 rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform"
          style={{ background: 'linear-gradient(135deg, #4c1d95, #1e1b4b)' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Weekly League {getTierEmoji(leagueStatus.tier)}</h3>
              <p className="text-white/70 text-sm">Rang #{leagueStatus.rank} • {leagueStatus.points} Punkte</p>
            </div>
            <span className="text-3xl">{getTierEmoji(leagueStatus.tier)}</span>
          </div>
        </div>

        {/* 4x4 Games Grid */}
        <div className="grid grid-cols-4 gap-3">
          {GAMES.map(game => (
            <div
              key={game.id}
              onClick={() => playGame(game)}
              className={`bg-gradient-to-br ${game.gradient} rounded-xl p-4 text-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20`}
            >
              <div className="text-2xl mb-1">{game.icon}</div>
              <div className="text-xs font-medium leading-tight">{game.name}</div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">💰 Coins verdienen</h3>
          <div className="text-sm text-white/70 space-y-1">
            <p>🎮 Spiele spielen: 5-100 Coins pro Gewinn</p>
            <p>🎁 Täglicher Bonus: 20-130 Coins (7-Tage-Streak)</p>
            <p>🏆 League Belohnungen: Wöchentliche Preise</p>
          </div>
        </div>

      </div>

      {/* Game Modal */}
      {showGame && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4" style={{ background: 'linear-gradient(135deg, #4c1d95, #1e1b4b)' }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{showGame.icon}</span>
              <div>
                <h3 className="font-bold text-white">{showGame.name}</h3>
                <p className="text-xs text-white/70">Belohnung: {showGame.reward.base}-{showGame.reward.max} Coins</p>
              </div>
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
            className="max-w-sm w-full p-6 rounded-3xl text-center animate-bounce-in"
            style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)' }}
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
            <p className="text-white/70 mb-4">
              Neues Guthaben: <span className="text-yellow-400 font-bold">{coins}</span> Coins
            </p>
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

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
