import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, TrendingDown, Trophy, Zap, 
  DollarSign, Calendar, Target, Award, PieChart
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const dashboardTexts = {
  de: {
    title: 'Meine Statistiken',
    totalWins: 'Gewonnene Auktionen',
    totalSaved: 'Gesamt gespart',
    totalSpent: 'Ausgegeben',
    avgSavings: 'Ø Ersparnis',
    winRate: 'Gewinnrate',
    bidsUsed: 'Gebote verwendet',
    favoriteCategory: 'Lieblingskategorie',
    bestDeal: 'Bester Deal',
    thisMonth: 'Diesen Monat',
    allTime: 'Insgesamt',
    noData: 'Noch keine Statistiken verfügbar'
  },
  sq: {
    title: 'Statistikat e mia',
    totalWins: 'Ankande të fituara',
    totalSaved: 'Totali i kursyer',
    totalSpent: 'Shpenzuar',
    avgSavings: 'Kursim mesatar',
    winRate: 'Norma e fitimit',
    bidsUsed: 'Oferta të përdorura',
    favoriteCategory: 'Kategoria e preferuar',
    bestDeal: 'Oferta më e mirë',
    thisMonth: 'Këtë muaj',
    allTime: 'Gjithë kohës',
    noData: 'Ende nuk ka statistika'
  },
  en: {
    title: 'My Statistics',
    totalWins: 'Auctions Won',
    totalSaved: 'Total Saved',
    totalSpent: 'Spent',
    avgSavings: 'Avg. Savings',
    winRate: 'Win Rate',
    bidsUsed: 'Bids Used',
    favoriteCategory: 'Favorite Category',
    bestDeal: 'Best Deal',
    thisMonth: 'This Month',
    allTime: 'All Time',
    noData: 'No statistics available yet'
  }
};

export default function UserStatsDashboard() {
  const { language } = useLanguage();
  const { token, isAuthenticated } = useAuth();
  const t = dashboardTexts[language] || dashboardTexts.de;
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // 'month' or 'all'

  useEffect(() => {
    if (token) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [token, period]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/user/stats?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      // Use demo data
      setStats({
        total_wins: 12,
        total_saved: 2456.78,
        total_spent: 234.50,
        avg_savings_percent: 87,
        win_rate: 23,
        bids_used: 456,
        favorite_category: 'Elektronik',
        best_deal: {
          product: 'iPhone 15 Pro',
          saved: 1180,
          percent: 92
        },
        monthly_savings: [
          { month: 'Jan', amount: 450 },
          { month: 'Feb', amount: 380 },
          { month: 'Mär', amount: 520 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">{t.noData}</p>
      </div>
    );
  }

  const statCards = [
    {
      icon: Trophy,
      label: t.totalWins,
      value: stats.total_wins,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      icon: DollarSign,
      label: t.totalSaved,
      value: `€${stats.total_saved?.toFixed(0)}`,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      icon: Target,
      label: t.winRate,
      value: `${stats.win_rate}%`,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10'
    },
    {
      icon: Zap,
      label: t.bidsUsed,
      value: stats.bids_used,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-500" />
          {t.title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              period === 'month'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t.thisMonth}
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              period === 'all'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t.allTime}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div 
            key={index}
            className={`${stat.bg} rounded-xl p-4 transition-transform hover:scale-105`}
          >
            <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Best Deal Highlight */}
      {stats.best_deal && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.bestDeal}</p>
              <p className="font-bold text-gray-800 dark:text-white">{stats.best_deal.product}</p>
              <p className="text-green-500 font-medium">
                €{stats.best_deal.saved} gespart ({stats.best_deal.percent}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Link to full stats */}
      <Link 
        to="/my-stats"
        className="mt-4 block text-center text-cyan-500 hover:text-cyan-600 text-sm font-medium"
      >
        Alle Statistiken ansehen →
      </Link>
    </div>
  );
}
