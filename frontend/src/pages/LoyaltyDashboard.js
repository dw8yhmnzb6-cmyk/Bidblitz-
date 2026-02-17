/**
 * Loyalty Dashboard - Restaurant Rewards Program
 * Shows stamps, challenges, and progress
 */
import { useState, useEffect } from 'react';
import { 
  Trophy, Star, Gift, Target, Zap, Award, ChevronRight, 
  CheckCircle, Lock, TrendingUp, Flame
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const translations = {
  de: {
    title: 'Treueprogramm',
    subtitle: 'Sammle Stempel, meistere Challenges',
    yourLevel: 'Dein Level',
    stamps: 'Stempel',
    toNextLevel: 'bis zum nächsten Level',
    challenges: 'Challenges',
    completed: 'Abgeschlossen',
    inProgress: 'In Bearbeitung',
    locked: 'Gesperrt',
    reward: 'Belohnung',
    bids: 'Gebote',
    streak: 'Wochenstreak',
    weeks: 'Wochen',
    leaderboard: 'Rangliste',
    yourRank: 'Dein Rang',
    benefits: 'Deine Vorteile',
    bonusOnVouchers: 'Bonus auf Gutscheine',
    loginRequired: 'Bitte melde dich an'
  },
  en: {
    title: 'Loyalty Program',
    subtitle: 'Collect stamps, master challenges',
    yourLevel: 'Your Level',
    stamps: 'Stamps',
    toNextLevel: 'to next level',
    challenges: 'Challenges',
    completed: 'Completed',
    inProgress: 'In Progress',
    locked: 'Locked',
    reward: 'Reward',
    bids: 'Bids',
    streak: 'Week Streak',
    weeks: 'Weeks',
    leaderboard: 'Leaderboard',
    yourRank: 'Your Rank',
    benefits: 'Your Benefits',
    bonusOnVouchers: 'Bonus on vouchers',
    loginRequired: 'Please log in'
  }
};

export default function LoyaltyDashboard() {
  const { isAuthenticated, token } = useAuth();
  const { language } = useLanguage();
  const t = translations[language] || translations.de;
  
  const [status, setStatus] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLoyaltyData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchLoyaltyData = async () => {
    try {
      const [statusRes, challengesRes, leaderboardRes] = await Promise.all([
        axios.get(`${API}/api/loyalty/status`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/loyalty/challenges`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/loyalty/leaderboard?limit=10`)
      ]);
      
      setStatus(statusRes.data);
      setChallenges(challengesRes.data?.challenges || []);
      setLeaderboard(leaderboardRes.data || []);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Gift className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t.title}</h2>
          <p className="text-gray-500 mb-4">{t.loginRequired}</p>
          <Button onClick={() => window.location.href = '/login'} className="bg-amber-500 hover:bg-amber-600">
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const level = status?.current_level || { name: 'Starter', icon: '🌟', bonus_percent: 0 };
  const nextLevel = status?.next_level;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Level */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-6 pb-16">
        <h1 className="text-xl font-bold mb-1">{t.title}</h1>
        <p className="text-purple-200 text-sm">{t.subtitle}</p>
      </div>
      
      {/* Level Card */}
      <div className="px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm">{t.yourLevel}</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl">{level.icon}</span>
                <span className="text-2xl font-bold text-gray-800">{level.name_de || level.name}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{status?.total_stamps || 0}</p>
              <p className="text-gray-500 text-sm">{t.stamps}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          {nextLevel && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">
                  {status?.stamps_to_next_level} {t.toNextLevel}
                </span>
                <span className="text-purple-600 font-medium">
                  {nextLevel.icon} {nextLevel.name_de || nextLevel.name}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${status?.progress_percent || 0}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Benefits */}
          <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
            <Gift className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">{t.benefits}</p>
              <p className="font-bold text-purple-700">
                +{level.bonus_percent}% {t.bonusOnVouchers}
              </p>
            </div>
          </div>
          
          {/* Streak */}
          {status?.current_streak > 0 && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.streak}</p>
                <p className="font-bold text-orange-600">
                  {status.current_streak} {t.weeks}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Challenges */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-500" />
          {t.challenges}
          <span className="text-gray-400 text-sm ml-auto">
            {challenges.filter(c => c.completed).length}/{challenges.length}
          </span>
        </h2>
        
        <div className="space-y-3">
          {challenges.map(challenge => (
            <div
              key={challenge.id}
              className={`bg-white rounded-xl p-4 shadow-sm ${
                challenge.completed ? 'border-l-4 border-green-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  challenge.completed 
                    ? 'bg-green-100' 
                    : challenge.progress_percent > 0 
                      ? 'bg-amber-100' 
                      : 'bg-gray-100'
                }`}>
                  {challenge.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : challenge.progress_percent > 0 ? (
                    <Zap className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{challenge.name}</h3>
                  <p className="text-gray-500 text-sm">{challenge.description}</p>
                  
                  {!challenge.completed && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{challenge.progress}/{challenge.requirement}</span>
                        <span>{Math.round(challenge.progress_percent)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: `${challenge.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`text-right ${challenge.completed ? 'text-green-500' : 'text-amber-500'}`}>
                  <p className="font-bold">+{challenge.reward_bids}</p>
                  <p className="text-xs">{t.bids}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Leaderboard */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          {t.leaderboard}
        </h2>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {leaderboard.map((entry, index) => (
            <div 
              key={entry.user_id}
              className={`flex items-center gap-3 p-3 ${
                index < leaderboard.length - 1 ? 'border-b' : ''
              } ${entry.user_id === status?.user_id ? 'bg-purple-50' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-amber-400 text-white' :
                index === 1 ? 'bg-gray-300 text-white' :
                index === 2 ? 'bg-amber-600 text-white' :
                'bg-gray-100 text-gray-500'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-gray-800">{entry.username}</p>
                <p className="text-xs text-gray-500">
                  {entry.level?.icon} {entry.level?.name_de || entry.level?.name}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-purple-600">{entry.total_stamps}</p>
                <p className="text-xs text-gray-500">{t.stamps}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
