import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { 
  Trophy, Star, Crown, Moon, Sun, Gem, Flame, Share2, 
  Zap, Target, Users, Lock, CheckCircle, Gift, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Icon mapping
const ICONS = {
  trophy: Trophy,
  star: Star,
  crown: Crown,
  moon: Moon,
  sun: Sun,
  gem: Gem,
  flame: Flame,
  fire: Flame,
  share: Share2,
  zap: Zap,
  target: Target,
  users: Users
};

export default function Achievements() {
  const { isAuthenticated, token } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [dailyStatus, setDailyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [achRes, dailyRes] = await Promise.all([
        axios.get(`${API}/achievements`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/daily-reward/status`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAchievements(achRes.data);
      setDailyStatus(dailyRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimDailyReward = async () => {
    setClaimingDaily(true);
    try {
      const response = await axios.post(`${API}/daily-reward`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message);
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
          <h2 className="text-xl font-bold text-white mb-4">Achievements</h2>
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

  const unlockedCount = achievements.achievements?.filter(a => a.unlocked).length || 0;
  const totalCount = achievements.achievements?.length || 0;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="achievements-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF4D4D] flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-[#94A3B8]">Sammle Erfolge und verdiene Bonus-Gebote!</p>
        </div>

        {/* Daily Reward Card */}
        <div className="glass-card p-6 rounded-xl mb-8 border border-[#FFD700]/30 bg-gradient-to-r from-[#FFD700]/10 to-[#FF4D4D]/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                <Gift className={`w-8 h-8 ${dailyStatus?.claimed_today ? 'text-[#94A3B8]' : 'text-[#FFD700] animate-pulse'}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Tägliche Belohnung</h3>
                <p className="text-[#94A3B8] text-sm">
                  {dailyStatus?.claimed_today 
                    ? `Bereits abgeholt! Streak: ${dailyStatus.current_streak} Tage`
                    : `+${dailyStatus?.next_reward || 1} Gebot${dailyStatus?.next_reward !== 1 ? 'e' : ''} • Streak: ${dailyStatus?.current_streak || 0} Tage`
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={claimDailyReward}
              disabled={dailyStatus?.claimed_today || claimingDaily}
              className={dailyStatus?.claimed_today 
                ? 'bg-[#475569] text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FFD700] to-[#FF4D4D] text-black font-bold hover:scale-105 transition-transform'
              }
              data-testid="claim-daily-btn"
            >
              {claimingDaily ? 'Wird abgeholt...' : dailyStatus?.claimed_today ? 'Abgeholt ✓' : 'Jetzt abholen!'}
            </Button>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-[#FFD700]">{unlockedCount}</p>
            <p className="text-[#94A3B8] text-sm">Freigeschaltet</p>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-white">{totalCount}</p>
            <p className="text-[#94A3B8] text-sm">Gesamt</p>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-[#10B981]">{achievements.total_points || 0}</p>
            <p className="text-[#94A3B8] text-sm">Punkte</p>
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

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.achievements?.map((ach) => {
            const IconComponent = ICONS[ach.icon] || Trophy;
            return (
              <div 
                key={ach.id}
                className={`glass-card p-4 rounded-xl transition-all ${
                  ach.unlocked 
                    ? 'border border-[#FFD700]/50 bg-[#FFD700]/5' 
                    : 'opacity-60 grayscale'
                }`}
                data-testid={`achievement-${ach.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    ach.unlocked 
                      ? 'bg-gradient-to-br from-[#FFD700] to-[#FF4D4D]' 
                      : 'bg-[#181824]'
                  }`}>
                    {ach.unlocked ? (
                      <IconComponent className="w-6 h-6 text-black" />
                    ) : (
                      <Lock className="w-6 h-6 text-[#475569]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold ${ach.unlocked ? 'text-white' : 'text-[#94A3B8]'}`}>
                        {ach.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ach.unlocked ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#181824] text-[#475569]'
                      }`}>
                        {ach.points} Pkt
                      </span>
                    </div>
                    <p className="text-[#94A3B8] text-sm mt-1">{ach.description}</p>
                    {ach.unlocked && ach.unlocked_at && (
                      <p className="text-[#10B981] text-xs mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {new Date(ach.unlocked_at).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
