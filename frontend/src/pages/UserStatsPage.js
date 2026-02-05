import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { 
  Trophy, TrendingUp, Target, Award, 
  Flame, Star, Crown, Calendar,
  BarChart3, PieChart, Zap, Gift
} from 'lucide-react';
import { Progress } from '../components/ui/progress';

const API = process.env.REACT_APP_BACKEND_URL;

// Translations
const translations = {
  de: {
    title: 'Meine Statistiken',
    overview: 'Übersicht',
    totalWins: 'Gesamtsiege',
    totalBids: 'Gebote platziert',
    totalSavings: 'Gespart',
    winRate: 'Gewinnrate',
    level: 'Level',
    achievements: 'Erfolge',
    weeklyActivity: 'Diese Woche',
    favoriteCategories: 'Lieblingskategorien',
    streak: 'Login-Streak',
    days: 'Tage',
    memberSince: 'Mitglied seit',
    pointsNeeded: 'Punkte bis',
    unlocked: 'Freigeschaltet',
    locked: 'Gesperrt',
    progress: 'Fortschritt',
    noStats: 'Noch keine Statistiken',
    startBidding: 'Beginne zu bieten um Statistiken zu sammeln!'
  },
  en: {
    title: 'My Statistics',
    overview: 'Overview',
    totalWins: 'Total Wins',
    totalBids: 'Bids Placed',
    totalSavings: 'Total Saved',
    winRate: 'Win Rate',
    level: 'Level',
    achievements: 'Achievements',
    weeklyActivity: 'This Week',
    favoriteCategories: 'Favorite Categories',
    streak: 'Login Streak',
    days: 'Days',
    memberSince: 'Member Since',
    pointsNeeded: 'Points until',
    unlocked: 'Unlocked',
    locked: 'Locked',
    progress: 'Progress',
    noStats: 'No statistics yet',
    startBidding: 'Start bidding to collect statistics!'
  }
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subValue, color = "cyan" }) => (
  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white font-bold text-xl">{value}</p>
        {subValue && <p className="text-gray-500 text-xs">{subValue}</p>}
      </div>
    </div>
  </div>
);

// Achievement Badge Component
const AchievementBadge = ({ achievement, t }) => (
  <div 
    className={`p-3 rounded-xl border ${
      achievement.unlocked 
        ? 'bg-gradient-to-b from-yellow-500/10 to-amber-500/10 border-yellow-500/30' 
        : 'bg-gray-800/30 border-gray-700/30 opacity-50'
    }`}
    title={achievement.description}
  >
    <div className="text-center">
      <span className="text-3xl">{achievement.icon}</span>
      <p className={`text-xs font-bold mt-1 ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
        {achievement.name}
      </p>
      {!achievement.unlocked && (
        <div className="mt-2">
          <Progress value={achievement.progress || 0} className="h-1" />
          <p className="text-[10px] text-gray-500 mt-1">{Math.round(achievement.progress || 0)}%</p>
        </div>
      )}
    </div>
  </div>
);

export default function UserStatsPage() {
  const { isAuthenticated, token } = useAuth();
  const { language, mappedLanguage } = useLanguage();
  const t = translations[mappedLanguage] || translations[language] || translations.de;
  
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [] });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      
      try {
        const [statsRes, achievementsRes] = await Promise.all([
          axios.get(`${API}/api/user-stats/overview`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/api/user-stats/achievements`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { unlocked: [], locked: [] } }))
        ]);
        
        setStats(statsRes.data);
        setAchievements(achievementsRes.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [isAuthenticated, token]);
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Bitte anmelden</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-cyan-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Lade Statistiken...</p>
        </div>
      </div>
    );
  }
  
  const overview = stats?.overview || {};
  const level = stats?.level || {};
  const streak = stats?.streak || {};
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8 px-4" data-testid="user-stats-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          
          {/* Level Badge */}
          {level.name && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
              <span className="text-2xl">{level.icon}</span>
              <span className="text-yellow-400 font-bold">{level.name}</span>
              <span className="text-gray-400 text-sm">({level.points} Punkte)</span>
            </div>
          )}
          
          {/* Progress to next level */}
          {level.next_level && (
            <div className="mt-3 max-w-xs mx-auto">
              <Progress value={level.progress_to_next} className="h-2" />
              <p className="text-gray-500 text-xs mt-1">
                {level.points_needed} {t.pointsNeeded} {level.next_level}
              </p>
            </div>
          )}
        </div>
        
        {/* Overview Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Trophy} 
            label={t.totalWins} 
            value={overview.total_wins || 0}
            color="yellow"
          />
          <StatCard 
            icon={Zap} 
            label={t.totalBids} 
            value={overview.total_bids || 0}
            color="blue"
          />
          <StatCard 
            icon={Gift} 
            label={t.totalSavings} 
            value={`€${(overview.total_savings || 0).toLocaleString('de-DE')}`}
            subValue={`${overview.savings_percentage || 0}% Ersparnis`}
            color="green"
          />
          <StatCard 
            icon={Target} 
            label={t.winRate} 
            value={`${overview.win_rate || 0}%`}
            color="purple"
          />
        </div>
        
        {/* Streak & Weekly Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Login Streak */}
          <div className="bg-gradient-to-b from-orange-500/10 to-red-500/10 rounded-xl p-5 border border-orange-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                {t.streak}
              </h3>
              <span className="text-orange-400 font-bold text-2xl">{streak.current || 0}</span>
            </div>
            <p className="text-gray-400 text-sm">
              {streak.current || 0} {t.days} in Folge
            </p>
            {streak.best > streak.current && (
              <p className="text-gray-500 text-xs mt-1">
                Bester: {streak.best} {t.days}
              </p>
            )}
          </div>
          
          {/* Weekly Activity */}
          <div className="bg-gradient-to-b from-cyan-500/10 to-blue-500/10 rounded-xl p-5 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                {t.weeklyActivity}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs">Siege</p>
                <p className="text-white font-bold text-xl">{stats?.weekly_activity?.wins || 0}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Gespart</p>
                <p className="text-green-400 font-bold text-xl">€{stats?.weekly_activity?.savings || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Favorite Categories */}
        {stats?.favorite_categories?.length > 0 && (
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 mb-8">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              {t.favoriteCategories}
            </h3>
            <div className="space-y-3">
              {stats.favorite_categories.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-lg">{['🥇', '🥈', '🥉'][i] || '•'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-white">{cat.category}</span>
                      <span className="text-gray-400">{cat.wins} Siege</span>
                    </div>
                    <Progress value={(cat.wins / (stats.overview?.total_wins || 1)) * 100} className="h-1 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Achievements */}
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            {t.achievements}
            <span className="text-gray-500 text-sm ml-2">
              ({achievements.unlocked?.length || 0}/{(achievements.unlocked?.length || 0) + (achievements.locked?.length || 0)})
            </span>
          </h3>
          
          {/* Unlocked */}
          {achievements.unlocked?.length > 0 && (
            <div className="mb-6">
              <p className="text-green-400 text-xs font-bold mb-3">{t.unlocked}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {achievements.unlocked.map(achievement => (
                  <AchievementBadge key={achievement.id} achievement={achievement} t={t} />
                ))}
              </div>
            </div>
          )}
          
          {/* Locked */}
          {achievements.locked?.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-bold mb-3">{t.locked}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {achievements.locked.slice(0, 10).map(achievement => (
                  <AchievementBadge key={achievement.id} achievement={achievement} t={t} />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Member Since */}
        {stats?.member_since && (
          <p className="text-center text-gray-500 text-sm mt-8">
            {t.memberSince}: {new Date(stats.member_since).toLocaleDateString('de-DE')}
          </p>
        )}
      </div>
    </div>
  );
}
