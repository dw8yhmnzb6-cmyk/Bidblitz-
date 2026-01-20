import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { 
  Trophy, Star, Crown, Flame, Gift, Sparkles, CheckCircle, Lock, 
  Target, Users, Zap, Medal, Award, TrendingUp, Calendar, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Category Icons
const CATEGORY_ICONS = {
  bidding: Zap,
  winning: Trophy,
  buying: Gift,
  engagement: Calendar,
  social: Users,
  special: Star
};

const CATEGORY_COLORS = {
  bidding: '#FFD700',
  winning: '#10B981',
  buying: '#06B6D4',
  engagement: '#7C3AED',
  social: '#EC4899',
  special: '#F59E0B'
};

export default function Achievements() {
  const { isAuthenticated, token } = useAuth();
  const [achievementData, setAchievementData] = useState(null);
  const [dailyStatus, setDailyStatus] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [activeTab, setActiveTab] = useState('achievements');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [achRes, dailyRes, leaderRes] = await Promise.all([
        axios.get(`${API}/rewards/achievements`, { headers }),
        axios.get(`${API}/rewards/daily`, { headers }),
        axios.get(`${API}/rewards/leaderboard?period=weekly`, { headers })
      ]);
      setAchievementData(achRes.data);
      setDailyStatus(dailyRes.data);
      setLeaderboard(leaderRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const claimDailyReward = async () => {
    setClaimingDaily(true);
    try {
      const response = await axios.post(`${API}/rewards/daily/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${response.data.message} +${response.data.total_bids} Gebote!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Abholen');
    } finally {
      setClaimingDaily(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="glass-card p-8 rounded-xl text-center max-w-md">
          <Trophy className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">Achievements & Belohnungen</h2>
          <p className="text-[#94A3B8] mb-6">Melden Sie sich an, um Ihre Erfolge zu sehen.</p>
          <Button className="btn-primary" onClick={() => window.location.href = '/login'}>
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  const achievements = achievementData?.achievements || [];
  const earnedCount = achievementData?.total_earned || 0;
  const totalCount = achievementData?.total_available || 0;
  const totalBidsEarned = achievementData?.total_bids_earned || 0;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, ach) => {
    const cat = ach.category || 'special';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ach);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="achievements-page">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF4D4D] flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Achievements & Belohnungen</h1>
          <p className="text-[#94A3B8]">Sammle Erfolge und verdiene Bonus-Gebote!</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 justify-center">
          {['achievements', 'daily', 'leaderboard'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-[#FFD700] text-black' 
                  : 'bg-[#181824] text-[#94A3B8] hover:text-white'
              }`}
            >
              {tab === 'achievements' && 'Achievements'}
              {tab === 'daily' && 'Tagesbonus'}
              {tab === 'leaderboard' && 'Rangliste'}
            </button>
          ))}
        </div>

        {/* Daily Reward Card - Always visible */}
        <div className="glass-card p-6 rounded-xl mb-8 border border-[#FFD700]/30 bg-gradient-to-r from-[#FFD700]/10 to-[#FF4D4D]/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                dailyStatus?.can_claim ? 'bg-[#FFD700]/20 animate-pulse' : 'bg-[#475569]/20'
              }`}>
                <Gift className={`w-8 h-8 ${dailyStatus?.can_claim ? 'text-[#FFD700]' : 'text-[#94A3B8]'}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Tägliche Belohnung</h3>
                <p className="text-[#94A3B8] text-sm">
                  {dailyStatus?.can_claim 
                    ? `+${dailyStatus?.next_reward?.bids || 1} Gebot${(dailyStatus?.next_reward?.bids || 1) !== 1 ? 'e' : ''} warten auf dich!`
                    : `Bereits abgeholt! Morgen wieder.`
                  }
                </p>
                <p className="text-[#FFD700] text-xs mt-1">
                  🔥 Streak: {dailyStatus?.current_streak || 0} Tage
                </p>
              </div>
            </div>
            <Button
              onClick={claimDailyReward}
              disabled={!dailyStatus?.can_claim || claimingDaily}
              className={dailyStatus?.can_claim 
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FF4D4D] text-black font-bold hover:scale-105 transition-transform'
                : 'bg-[#475569] text-white cursor-not-allowed'
              }
              data-testid="claim-daily-btn"
            >
              {claimingDaily ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : dailyStatus?.can_claim ? (
                'Jetzt abholen!'
              ) : (
                'Abgeholt ✓'
              )}
            </Button>
          </div>
        </div>

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <>
            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-[#FFD700]">{earnedCount}</p>
                <p className="text-[#94A3B8] text-sm">Freigeschaltet</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-white">{totalCount}</p>
                <p className="text-[#94A3B8] text-sm">Gesamt</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-[#10B981]">+{totalBidsEarned}</p>
                <p className="text-[#94A3B8] text-sm">Gebote verdient</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="glass-card p-4 rounded-xl mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#94A3B8]">Fortschritt</span>
                <span className="text-white font-bold">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-3 bg-[#181824] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF4D4D] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Achievements by Category */}
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
              const CategoryIcon = CATEGORY_ICONS[category] || Trophy;
              const categoryColor = CATEGORY_COLORS[category] || '#FFD700';
              
              return (
                <div key={category} className="mb-8">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CategoryIcon className="w-5 h-5" style={{ color: categoryColor }} />
                    {category === 'bidding' && 'Bieten'}
                    {category === 'winning' && 'Gewinnen'}
                    {category === 'buying' && 'Kaufen'}
                    {category === 'engagement' && 'Engagement'}
                    {category === 'social' && 'Sozial'}
                    {category === 'special' && 'Spezial'}
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAchievements.map((ach) => (
                      <div 
                        key={ach.id}
                        className={`glass-card p-4 rounded-xl transition-all ${
                          ach.earned 
                            ? 'border border-[#FFD700]/50 bg-[#FFD700]/5' 
                            : 'opacity-70'
                        }`}
                        data-testid={`achievement-${ach.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                            ach.earned 
                              ? 'bg-gradient-to-br from-[#FFD700] to-[#FF4D4D]' 
                              : 'bg-[#181824]'
                          }`}>
                            {ach.earned ? ach.icon : <Lock className="w-5 h-5 text-[#475569]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-bold text-sm ${ach.earned ? 'text-white' : 'text-[#94A3B8]'}`}>
                                {ach.name}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                ach.earned ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#181824] text-[#475569]'
                              }`}>
                                +{ach.reward_bids}
                              </span>
                            </div>
                            <p className="text-[#94A3B8] text-xs mt-1">{ach.description}</p>
                            
                            {/* Progress Bar */}
                            {!ach.earned && ach.target > 1 && (
                              <div className="mt-2">
                                <div className="h-1.5 bg-[#181824] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all"
                                    style={{ 
                                      width: `${ach.progress_percent}%`,
                                      backgroundColor: categoryColor 
                                    }}
                                  />
                                </div>
                                <p className="text-[#475569] text-[10px] mt-1">
                                  {ach.progress} / {ach.target}
                                </p>
                              </div>
                            )}
                            
                            {ach.earned && ach.earned_at && (
                              <p className="text-[#10B981] text-xs mt-2 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {new Date(ach.earned_at).toLocaleDateString('de-DE')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Daily Rewards Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-4">Tägliche Belohnungen</h2>
              <p className="text-[#94A3B8] mb-6">
                Logge dich jeden Tag ein und hole deinen Bonus ab! Je länger dein Streak, desto mehr Gebote bekommst du.
              </p>
              
              <div className="grid grid-cols-7 gap-2">
                {dailyStatus?.streak_rewards?.map((reward, index) => {
                  const currentDay = (dailyStatus?.current_streak % 7) || 0;
                  const isCurrentDay = index === currentDay && dailyStatus?.can_claim;
                  const isPast = index < currentDay || (index === 0 && currentDay === 0 && !dailyStatus?.can_claim);
                  
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg text-center transition-all ${
                        isCurrentDay 
                          ? 'bg-gradient-to-br from-[#FFD700] to-[#FF4D4D] text-black animate-pulse'
                          : isPast
                            ? 'bg-[#10B981]/20 border border-[#10B981]'
                            : 'bg-[#181824] border border-white/10'
                      }`}
                    >
                      <p className={`text-xs font-medium ${isCurrentDay ? 'text-black' : 'text-[#94A3B8]'}`}>
                        Tag {index + 1}
                      </p>
                      <p className={`text-lg font-bold ${isCurrentDay ? 'text-black' : isPast ? 'text-[#10B981]' : 'text-white'}`}>
                        +{reward.bids}
                      </p>
                      {isPast && <CheckCircle className="w-4 h-4 text-[#10B981] mx-auto mt-1" />}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-[#181824] rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Aktueller Streak</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{dailyStatus?.current_streak || 0} Tage</p>
                  </div>
                  <Flame className="w-12 h-12 text-[#FF4D4D]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FFD700]" />
              Wöchentliche Rangliste
            </h2>
            
            <div className="space-y-2">
              {leaderboard?.leaderboard?.slice(0, 20).map((entry, index) => (
                <div 
                  key={entry.user_id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index < 3 ? 'bg-gradient-to-r from-[#FFD700]/10 to-transparent' : 'bg-[#181824]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-8 text-center">{entry.badge || entry.rank}</span>
                    <div>
                      <p className="text-white font-medium">{entry.name}</p>
                      <p className="text-[#94A3B8] text-xs">{entry.wins} Siege • {entry.bids} Gebote</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#FFD700] font-bold">{entry.score}</p>
                    <p className="text-[#94A3B8] text-xs">Punkte</p>
                  </div>
                </div>
              ))}
              
              {(!leaderboard?.leaderboard || leaderboard.leaderboard.length === 0) && (
                <p className="text-center text-[#94A3B8] py-8">Noch keine Daten verfügbar</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
