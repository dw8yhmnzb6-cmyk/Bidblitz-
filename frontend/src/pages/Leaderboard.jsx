/**
 * BidBlitz Leaderboard Page
 * Shows top players by game and overall
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const GAME_TABS = [
  { key: 'overall', name: 'Gesamt', icon: '🏆' },
  { key: 'candy_match', name: 'Candy', icon: '🍬' },
  { key: 'lucky_wheel', name: 'Wheel', icon: '🎡' },
  { key: 'puzzle', name: 'Puzzle', icon: '🧠' },
  { key: 'snake', name: 'Snake', icon: '🐍' },
  { key: 'racing', name: 'Racing', icon: '🚗' },
];

export default function Leaderboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);

  const userId = localStorage.getItem('userId') || 'guest';

  useEffect(() => {
    fetchLeaderboard();
    fetchUserStats();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const gameParam = activeTab === 'overall' ? '' : `?game=${activeTab}`;
      const res = await axios.get(`${API}/bbz/leaderboard${gameParam}&limit=50`);
      setLeaderboard(res.data.leaderboard || []);

      // Get user rank
      const rankRes = await axios.get(`${API}/bbz/leaderboard/user/${userId}?game=${activeTab}`);
      setUserRank(rankRes.data);
    } catch (error) {
      console.error('Could not fetch leaderboard');
      // Demo data
      setLeaderboard([
        { rank: 1, name: 'ProGamer', user_id: 'pro1', score: 15420, coins: 5000 },
        { rank: 2, name: 'BidKing', user_id: 'bid2', score: 12350, coins: 3500 },
        { rank: 3, name: 'LuckyOne', user_id: 'luck3', score: 9870, coins: 2800 },
        { rank: 4, name: 'FastFingers', user_id: 'fast4', score: 8540, coins: 2100 },
        { rank: 5, name: 'Champ2026', user_id: 'champ5', score: 7230, coins: 1800 },
        { rank: 6, name: 'AcePlayer', user_id: 'ace6', score: 6100, coins: 1500 },
        { rank: 7, name: 'TopScore', user_id: 'top7', score: 5400, coins: 1200 },
        { rank: 8, name: 'Winner99', user_id: 'win8', score: 4800, coins: 1000 },
        { rank: 9, name: 'BidMaster', user_id: 'bid9', score: 4200, coins: 850 },
        { rank: 10, name: 'GameOn', user_id: 'game10', score: 3600, coins: 700 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await axios.get(`${API}/bbz/games/stats/${userId}`);
      setUserStats(res.data);
    } catch (error) {
      setUserStats({ total_games: 0, total_earned: 0 });
    }
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-slate-400/30 to-slate-500/30 border-slate-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 border-amber-600/50';
    return 'bg-white/5 border-white/10';
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ background: '#0f172a' }}>
      
      {/* Header */}
      <header className="p-5 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
          </div>
        </div>
      </header>

      {/* Your Stats */}
      {userStats && (
        <div className="mx-5 mt-5 p-4 rounded-xl bg-gradient-to-r from-purple-600/30 to-violet-600/30 border border-purple-500/30">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-white/70">Deine Statistik</p>
              <p className="font-bold text-lg">{userStats.total_games} Spiele gespielt</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">Verdient</p>
              <p className="font-bold text-lg text-yellow-400">{userStats.total_earned} 🪙</p>
            </div>
          </div>
          {userRank?.rank && (
            <div className="mt-3 pt-3 border-t border-white/10 text-center">
              <p className="text-sm text-white/70">Dein Rang</p>
              <p className="font-bold text-2xl">{getRankEmoji(userRank.rank)}</p>
            </div>
          )}
        </div>
      )}

      {/* Game Tabs */}
      <div className="flex gap-2 p-5 overflow-x-auto no-scrollbar">
        {GAME_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm font-medium">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="px-5">
        {loading ? (
          <div className="text-center py-10">
            <div className="text-4xl animate-spin mb-3">🔄</div>
            <p className="text-white/50">Laden...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">😴</div>
            <p className="text-white/50">Noch keine Einträge</p>
            <p className="text-sm text-white/30 mt-1">Spiele um auf die Liste zu kommen!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id || index}
                className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${getRankStyle(entry.rank || index + 1)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold w-10 text-center">
                      {getRankEmoji(entry.rank || index + 1)}
                    </div>
                    <div>
                      <p className="font-semibold">{entry.name || entry.user_id?.slice(0, 8)}</p>
                      <p className="text-xs text-white/50">{entry.user_id?.slice(0, 12)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{(entry.score || 0).toLocaleString()}</p>
                    <p className="text-xs text-yellow-400">{entry.coins || 0} 🪙</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rewards Info */}
      <div className="mx-5 mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <h3 className="font-semibold mb-3">🎁 Wöchentliche Belohnungen</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>🥇 Platz 1</span>
            <span className="text-yellow-400 font-bold">5.000 Coins</span>
          </div>
          <div className="flex justify-between">
            <span>🥈 Platz 2</span>
            <span className="text-slate-300 font-bold">2.500 Coins</span>
          </div>
          <div className="flex justify-between">
            <span>🥉 Platz 3</span>
            <span className="text-amber-500 font-bold">1.000 Coins</span>
          </div>
          <div className="flex justify-between">
            <span>Top 10</span>
            <span className="text-white/70">500 Coins</span>
          </div>
          <div className="flex justify-between">
            <span>Top 50</span>
            <span className="text-white/70">100 Coins</span>
          </div>
        </div>
      </div>

      <BottomNav />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
