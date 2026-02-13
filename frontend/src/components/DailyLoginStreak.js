import { useState, useEffect } from 'react';
import { Flame, Gift, Trophy, Star, Zap, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const streakTexts = {
  de: {
    title: 'Tägliche Belohnung',
    streak: 'Tage in Folge',
    claim: 'Belohnung abholen',
    claimed: 'Heute abgeholt!',
    nextReward: 'Morgen:',
    bids: 'Gebote',
    bonus: 'Streak-Bonus!',
    milestone: 'Meilenstein erreicht!',
    comeBack: 'Komm morgen wieder!',
    day: 'Tag'
  },
  sq: {
    title: 'Shpërblimi ditor',
    streak: 'Ditë radhazi',
    claim: 'Merr shpërblimin',
    claimed: 'Marrë sot!',
    nextReward: 'Nesër:',
    bids: 'Oferta',
    bonus: 'Bonus Streak!',
    milestone: 'Arritët pikën!',
    comeBack: 'Kthehu nesër!',
    day: 'Ditë'
  },
  en: {
    title: 'Daily Reward',
    streak: 'Day streak',
    claim: 'Claim reward',
    claimed: 'Claimed today!',
    nextReward: 'Tomorrow:',
    bids: 'Bids',
    bonus: 'Streak Bonus!',
    milestone: 'Milestone reached!',
    comeBack: 'Come back tomorrow!',
    day: 'Day'
  }
};

// Reward tiers based on streak day
const getRewardForDay = (day) => {
  if (day <= 0) return 1;
  if (day === 1) return 1;
  if (day === 2) return 2;
  if (day === 3) return 3;
  if (day === 4) return 4;
  if (day === 5) return 5;
  if (day === 6) return 7;
  if (day === 7) return 10; // Weekly bonus!
  // After week 1, cycle with bonuses
  const weekNum = Math.floor((day - 1) / 7);
  const dayInWeek = ((day - 1) % 7) + 1;
  const baseReward = getRewardForDay(dayInWeek);
  return baseReward + weekNum * 2; // +2 per week bonus
};

export default function DailyLoginStreak({ onClose }) {
  const { language, mappedLanguage } = useLanguage();
  const { token, user, refreshUser } = useAuth();
  const langKey = mappedLanguage || language;
  const t = streakTexts[langKey] || streakTexts.de;
  
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (token) {
      fetchStreakData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchStreakData = async () => {
    try {
      const response = await axios.get(`${API}/daily-streak/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStreakData(response.data);
    } catch (error) {
      // Create default streak data
      setStreakData({
        current_streak: 0,
        claimed_today: false,
        today_reward: 1,
        next_reward: 2
      });
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!token || claiming || streakData?.claimed_today) return;
    
    setClaiming(true);
    try {
      const response = await axios.post(`${API}/daily-streak/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowAnimation(true);
      toast.success(`🎉 +${response.data.bids_earned || streakData.today_reward} ${t.bids}!`);
      
      // Update streak data
      setStreakData(prev => ({
        ...prev,
        claimed_today: true,
        current_streak: (prev?.current_streak || 0) + 1
      }));
      
      // Refresh user to update bids
      if (refreshUser) refreshUser();
      
      setTimeout(() => setShowAnimation(false), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Abholen');
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !token) return null;

  const streak = streakData?.current_streak || 0;
  const claimed = streakData?.claimed_today;
  const todayReward = getRewardForDay(streak + 1);
  const nextReward = getRewardForDay(streak + 2);
  const isWeeklyMilestone = (streak + 1) % 7 === 0;

  return (
    <div className="relative bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6 overflow-hidden">
      {/* Animated flames background */}
      {showAnimation && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-red-500/30 animate-pulse" />
      )}
      
      {/* Close button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Fire Icon with streak count */}
        <div className="relative flex-shrink-0">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg ${streak > 0 ? 'animate-pulse' : ''}`}>
            <Flame className="w-8 h-8 text-white" />
          </div>
          {streak > 0 && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
              {streak}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            {t.title}
            {isWeeklyMilestone && !claimed && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-bounce">
                {t.bonus}
              </span>
            )}
          </h3>
          
          {/* Streak progress */}
          <div className="flex items-center gap-2 mt-1 mb-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const dayStreak = (streak % 7) || (streak > 0 ? 7 : 0);
                const isCompleted = day <= dayStreak;
                const isCurrent = day === dayStreak + 1 && !claimed;
                return (
                  <div 
                    key={day}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' 
                        : isCurrent
                          ? 'bg-orange-200 text-orange-600 border-2 border-orange-400 animate-pulse'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {day === 7 ? <Star className="w-4 h-4" /> : day}
                  </div>
                );
              })}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              <span className="font-bold text-orange-500">{streak}</span> {t.streak}
            </span>
          </div>

          {/* Next reward preview */}
          {!claimed && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Gift className="w-4 h-4 text-amber-500" />
              <span>{t.day} {streak + 1}: <span className="font-bold text-amber-600">+{todayReward} {t.bids}</span></span>
              {streak < 30 && (
                <span className="text-gray-400">• {t.nextReward} +{nextReward}</span>
              )}
            </div>
          )}
          
          {claimed && (
            <p className="text-green-500 text-sm font-medium flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              {t.claimed} {t.comeBack}
            </p>
          )}
        </div>

        {/* Claim Button */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button 
            onClick={claimReward}
            disabled={claimed || claiming}
            className={`w-full sm:w-auto font-bold shadow-lg transition-all ${
              claimed 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white shadow-orange-500/30'
            }`}
          >
            {claiming ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </span>
            ) : claimed ? (
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                {t.claimed}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                +{todayReward} {t.bids}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
