import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  BarChart3, Trophy, Target, TrendingUp, Zap, Clock, 
  DollarSign, Award, Calendar, Activity, PieChart, Gift,
  ArrowUp, ArrowDown, Star, Crown, Flame
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UserStats() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const texts = {
    de: {
      title: 'Meine Statistiken',
      subtitle: 'Übersicht Ihrer Aktivitäten',
      totalBids: 'Gebote insgesamt',
      wonAuctions: 'Gewonnene Auktionen',
      totalSavings: 'Gespart',
      avgPrice: 'Ø Gewinnpreis',
      winRate: 'Gewinnrate',
      memberSince: 'Mitglied seit',
      currentStreak: 'Login-Streak',
      days: 'Tage',
      bidsThisMonth: 'Gebote diesen Monat',
      bidsToday: 'Gebote heute',
      favoriteCategory: 'Lieblingskategorie',
      biggestWin: 'Größter Gewinn',
      lastWin: 'Letzter Gewinn',
      activity: 'Aktivität',
      achievements: 'Achievements',
      level: 'Level',
      nextLevel: 'Nächstes Level',
      noData: 'Noch keine Daten verfügbar'
    },
    en: {
      title: 'My Statistics',
      subtitle: 'Overview of your activities',
      totalBids: 'Total Bids',
      wonAuctions: 'Won Auctions',
      totalSavings: 'Total Savings',
      avgPrice: 'Avg. Win Price',
      winRate: 'Win Rate',
      memberSince: 'Member Since',
      currentStreak: 'Login Streak',
      days: 'Days',
      bidsThisMonth: 'Bids This Month',
      bidsToday: 'Bids Today',
      favoriteCategory: 'Favorite Category',
      biggestWin: 'Biggest Win',
      lastWin: 'Last Win',
      activity: 'Activity',
      achievements: 'Achievements',
      level: 'Level',
      nextLevel: 'Next Level',
      noData: 'No data available yet'
    }
  };
  const t = texts[language] || texts.de;

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, historyRes, achievementsRes] = await Promise.all([
        axios.get(`${API}/user/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/user/bid-history`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/auth/achievements`, { headers }).catch(() => ({ data: { earned: [], total: 0 } }))
      ]);
      
      setStats({
        ...statsRes.data,
        achievements: achievementsRes.data
      });
      setBidHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate derived stats
  const calculateStats = () => {
    if (!stats && !user) return null;
    
    const totalBids = user?.total_bids_placed || 0;
    const wonCount = user?.won_auctions?.length || 0;
    const winRate = totalBids > 0 ? ((wonCount / Math.max(totalBids / 100, 1)) * 100).toFixed(1) : 0;
    
    // Calculate level based on total bids
    const level = Math.floor(totalBids / 100) + 1;
    const nextLevelBids = level * 100;
    const progress = ((totalBids % 100) / 100) * 100;
    
    return {
      totalBids,
      wonCount,
      winRate,
      level,
      nextLevelBids,
      progress,
      bidsBalance: user?.bids_balance || 0,
      memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : '-',
      streak: stats?.current_streak || 0
    };
  };

  const calculatedStats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4" data-testid="user-stats-page">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-bold text-white">{t.title}</h1>
        </div>
        <p className="text-gray-400">{t.subtitle}</p>
      </div>

      {/* Level & Progress */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-2xl p-6 border border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-amber-400 text-sm font-medium">{t.level}</p>
                <p className="text-3xl font-black text-white">{calculatedStats?.level || 1}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">{t.nextLevel}</p>
              <p className="text-white font-bold">{calculatedStats?.totalBids || 0} / {calculatedStats?.nextLevelBids || 100} {t.totalBids}</p>
            </div>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${calculatedStats?.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Bids */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-gray-400 text-sm">{t.totalBids}</span>
          </div>
          <p className="text-2xl font-bold text-white">{calculatedStats?.totalBids?.toLocaleString('de-DE') || 0}</p>
        </div>

        {/* Won Auctions */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400 text-sm">{t.wonAuctions}</span>
          </div>
          <p className="text-2xl font-bold text-white">{calculatedStats?.wonCount || 0}</p>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">{t.winRate}</span>
          </div>
          <p className="text-2xl font-bold text-white">{calculatedStats?.winRate || 0}%</p>
        </div>

        {/* Login Streak */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-gray-400 text-sm">{t.currentStreak}</span>
          </div>
          <p className="text-2xl font-bold text-white">{calculatedStats?.streak || 0} <span className="text-sm text-gray-400">{t.days}</span></p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Bid Balance Card */}
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-400 text-sm mb-1">Verfügbare Gebote</p>
              <p className="text-4xl font-black text-white">{calculatedStats?.bidsBalance?.toLocaleString('de-DE') || 0}</p>
              <Link to="/buy-bids" className="text-cyan-400 text-sm hover:underline mt-2 inline-block">
                → Mehr Gebote kaufen
              </Link>
            </div>
            <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <Zap className="w-10 h-10 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Member Info Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            {t.memberSince}
          </h3>
          <p className="text-2xl font-bold text-white mb-2">{calculatedStats?.memberSince}</p>
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="w-4 h-4" />
            <span>Aktives Mitglied</span>
          </div>
        </div>
      </div>

      {/* Achievements Preview */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              {t.achievements}
            </h3>
            <Link to="/achievements" className="text-cyan-400 text-sm hover:underline">
              Alle anzeigen →
            </Link>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {stats?.achievements?.earned?.slice(0, 6).map((achievement, index) => (
              <div 
                key={index}
                className="bg-slate-700/50 rounded-lg p-3 text-center"
                title={achievement.name}
              >
                <div className="text-2xl mb-1">{achievement.icon || '🏆'}</div>
                <p className="text-xs text-gray-400 truncate">{achievement.name}</p>
              </div>
            ))}
            {(!stats?.achievements?.earned || stats.achievements.earned.length === 0) && (
              <div className="col-span-4 md:col-span-6 text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t.noData}</p>
                <Link to="/auctions" className="text-cyan-400 text-sm hover:underline mt-2 inline-block">
                  Jetzt bieten und Achievements verdienen!
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Letzte Aktivitäten
          </h3>
          
          {bidHistory.length > 0 ? (
            <div className="space-y-3">
              {bidHistory.slice(0, 10).map((bid, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm">{bid.product_name || 'Auktion'}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(bid.timestamp).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <span className="text-cyan-400 font-bold">€ {bid.price?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Noch keine Aktivitäten</p>
              <Link to="/auctions" className="text-cyan-400 text-sm hover:underline mt-2 inline-block">
                Jetzt erste Auktion bieten!
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
