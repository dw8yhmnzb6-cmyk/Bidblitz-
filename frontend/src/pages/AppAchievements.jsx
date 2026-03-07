/**
 * BidBlitz Achievements System
 * Badges and milestones for users
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  
  const allAchievements = [
    // Coins
    { id: 'first_100', emoji: '🪙', name: 'Erste Schritte', desc: 'Verdiene 100 Coins', requirement: 100, type: 'coins', points: 10 },
    { id: 'coins_1k', emoji: '💰', name: 'Sparschwein', desc: 'Verdiene 1.000 Coins', requirement: 1000, type: 'coins', points: 25 },
    { id: 'coins_10k', emoji: '🏦', name: 'Banker', desc: 'Verdiene 10.000 Coins', requirement: 10000, type: 'coins', points: 100 },
    { id: 'coins_100k', emoji: '💎', name: 'Diamant-Sammler', desc: 'Verdiene 100.000 Coins', requirement: 100000, type: 'coins', points: 500 },
    
    // Games
    { id: 'first_game', emoji: '🎮', name: 'Gamer', desc: 'Spiele dein erstes Spiel', requirement: 1, type: 'games', points: 5 },
    { id: 'games_10', emoji: '🕹️', name: 'Hobby-Spieler', desc: 'Spiele 10 Spiele', requirement: 10, type: 'games', points: 15 },
    { id: 'games_100', emoji: '🏆', name: 'Pro Gamer', desc: 'Spiele 100 Spiele', requirement: 100, type: 'games', points: 50 },
    { id: 'games_1000', emoji: '👑', name: 'Legende', desc: 'Spiele 1.000 Spiele', requirement: 1000, type: 'games', points: 200 },
    
    // Mining
    { id: 'first_miner', emoji: '⛏️', name: 'Miner', desc: 'Kaufe deinen ersten Miner', requirement: 1, type: 'miners', points: 20 },
    { id: 'miners_5', emoji: '🏭', name: 'Mining-Farm', desc: 'Besitze 5 Miner', requirement: 5, type: 'miners', points: 75 },
    { id: 'miners_10', emoji: '🌐', name: 'Mining-Imperium', desc: 'Besitze 10 Miner', requirement: 10, type: 'miners', points: 150 },
    
    // Referrals
    { id: 'first_ref', emoji: '👥', name: 'Freundschaftlich', desc: 'Lade 1 Freund ein', requirement: 1, type: 'referrals', points: 30 },
    { id: 'refs_5', emoji: '🤝', name: 'Netzwerker', desc: 'Lade 5 Freunde ein', requirement: 5, type: 'referrals', points: 100 },
    { id: 'refs_20', emoji: '🌟', name: 'Influencer', desc: 'Lade 20 Freunde ein', requirement: 20, type: 'referrals', points: 300 },
    
    // Special
    { id: 'vip_5', emoji: '✨', name: 'VIP Elite', desc: 'Erreiche VIP 5', requirement: 20000, type: 'coins', points: 500 },
    { id: 'daily_7', emoji: '📅', name: 'Treu', desc: '7 Tage Streak', requirement: 7, type: 'streak', points: 50 },
  ];
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  useEffect(() => {
    calculateAchievements();
  }, [stats]);
  
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [walletRes, minersRes, gamesRes, refRes] = await Promise.all([
        axios.get(`${API}/app/wallet/balance`, { headers }),
        axios.get(`${API}/app/miners/my`, { headers }),
        axios.get(`${API}/app/games/history?limit=1000`, { headers }),
        axios.get(`${API}/app/referral/my-code`, { headers })
      ]);
      
      setStats({
        coins: walletRes.data.total_earned || 0,
        miners: minersRes.data.count || 0,
        games: gamesRes.data.history?.length || 0,
        referrals: refRes.data.referrals || 0,
        streak: walletRes.data.streak || 0
      });
    } catch (error) {
      console.log('Stats error');
    }
  };
  
  const calculateAchievements = () => {
    const unlocked = allAchievements.map(ach => {
      let progress = 0;
      switch (ach.type) {
        case 'coins': progress = stats.coins || 0; break;
        case 'games': progress = stats.games || 0; break;
        case 'miners': progress = stats.miners || 0; break;
        case 'referrals': progress = stats.referrals || 0; break;
        case 'streak': progress = stats.streak || 0; break;
        default: progress = 0;
      }
      return {
        ...ach,
        progress,
        unlocked: progress >= ach.requirement,
        percent: Math.min(100, (progress / ach.requirement) * 100)
      };
    });
    
    setAchievements(unlocked);
    setTotalPoints(unlocked.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0));
  };
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-2">🏆 Achievements</h2>
        
        {/* Stats Overview */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-700/20 border border-amber-500/30 p-4 rounded-xl mb-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-400">Freigeschaltet</p>
              <p className="text-2xl font-bold">{unlockedCount}/{achievements.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Punkte</p>
              <p className="text-2xl font-bold text-amber-400">{totalPoints}</p>
            </div>
          </div>
        </div>
        
        {/* Achievements Grid */}
        <div className="space-y-3" data-testid="achievements-list">
          {achievements.map((ach) => (
            <div 
              key={ach.id}
              className={`p-4 rounded-xl border ${
                ach.unlocked 
                  ? 'bg-green-900/20 border-green-500/30' 
                  : 'bg-[#171a3a] border-slate-700/30'
              }`}
              data-testid={`achievement-${ach.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`text-3xl ${ach.unlocked ? '' : 'grayscale opacity-50'}`}>
                  {ach.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-semibold ${ach.unlocked ? 'text-green-400' : ''}`}>
                        {ach.name}
                      </p>
                      <p className="text-xs text-slate-400">{ach.desc}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      ach.unlocked ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      +{ach.points} Pts
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  {!ach.unlocked && (
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${ach.percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {ach.progress.toLocaleString()} / {ach.requirement.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
