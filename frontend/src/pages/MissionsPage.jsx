/**
 * BidBlitz Missions Page
 * Daily & Weekly missions with rewards
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';
import soundManager from '../utils/soundManager';
import notificationManager from '../utils/notificationManager';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MissionsPage() {
  const [missions, setMissions] = useState({ daily: [], weekly: [], special: [] });
  const [leagueStatus, setLeagueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    // Save userId for consistency
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [missionsRes, leagueRes] = await Promise.all([
        axios.get(`${API}/league/missions?user_id=${userId}`),
        axios.get(`${API}/league/status?user_id=${userId}`)
      ]);
      setMissions(missionsRes.data);
      setLeagueStatus(leagueRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (missionId, reward) => {
    setClaimingId(missionId);
    try {
      const res = await axios.post(`${API}/league/missions/claim?user_id=${userId}&mission_id=${missionId}`);
      if (res.data.success) {
        soundManager.reward();
        notificationManager.coinEarned(reward);
        fetchData();
      }
    } catch (error) {
      console.error('Error claiming:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-amber-700 to-amber-900',
      silver: 'from-slate-400 to-slate-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-cyan-400 to-cyan-600',
      diamond: 'from-purple-400 to-pink-500'
    };
    return colors[tier] || colors.bronze;
  };

  const MissionCard = ({ mission }) => {
    const progress = Math.min(100, (mission.progress / mission.target) * 100);
    const canClaim = mission.completed && !mission.claimed;
    
    return (
      <div className={`bg-[#1c213f] rounded-xl p-4 ${mission.claimed ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="text-3xl">{mission.icon}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-white">{mission.name}</h4>
            <p className="text-sm text-slate-400 mb-2">{mission.description}</p>
            
            {/* Progress Bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full transition-all duration-500 ${mission.completed ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                {mission.progress}/{mission.target}
              </span>
              
              {mission.claimed ? (
                <span className="text-xs text-green-500">✓ Erhalten</span>
              ) : canClaim ? (
                <button
                  onClick={() => claimReward(mission.id, mission.reward)}
                  disabled={claimingId === mission.id}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all"
                >
                  {claimingId === mission.id ? '...' : `+${mission.reward} 🪙`}
                </button>
              ) : (
                <span className="text-xs text-slate-500">+{mission.reward} 🪙</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0f22] flex items-center justify-center">
        <div className="text-white text-xl">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-24">
      {/* Header */}
      <div className="p-5">
        <h1 className="text-2xl font-bold mb-4">🎯 Missionen</h1>
        
        {/* League Status Card */}
        {leagueStatus && (
          <div className={`bg-gradient-to-r ${getTierColor(leagueStatus.tier)} rounded-xl p-4 mb-5`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold capitalize">{leagueStatus.tier} League</h3>
                <p className="text-sm opacity-90">Woche {leagueStatus.week}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">#{leagueStatus.rank}</p>
                <p className="text-sm opacity-90">{leagueStatus.points} Punkte</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-sm">
              <span>🎮 {leagueStatus.games_played} Spiele</span>
              <span>🏆 +{leagueStatus.tier_reward} Bonus</span>
            </div>
          </div>
        )}

        {/* Daily Missions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>📅</span> Tägliche Missionen
          </h2>
          <div className="space-y-3">
            {missions.daily.map(mission => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        </div>

        {/* Weekly Missions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>📆</span> Wöchentliche Missionen
          </h2>
          <div className="space-y-3">
            {missions.weekly.map(mission => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        </div>

        {/* Special Missions */}
        {missions.special.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>⭐</span> Spezial Missionen
            </h2>
            <div className="space-y-3">
              {missions.special.map(mission => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
