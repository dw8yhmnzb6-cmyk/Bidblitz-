/**
 * VIPLoyalty - Treueprogramm mit Stufen und Vorteilen
 * Features: Bronze/Silber/Gold/Platin, Punkte sammeln, Vorteile
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown, Star, Gift, TrendingUp, Award, Calendar, RefreshCw,
  ChevronRight, Lock, Unlock, Zap, Percent, Users, Clock, Trophy
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Tier Colors and Icons
const TIER_CONFIG = {
  bronze: { color: '#CD7F32', bgColor: 'from-amber-900/50 to-amber-800/50', icon: Star },
  silver: { color: '#C0C0C0', bgColor: 'from-gray-500/50 to-gray-400/50', icon: Star },
  gold: { color: '#FFD700', bgColor: 'from-yellow-600/50 to-yellow-500/50', icon: Crown },
  platinum: { color: '#E5E4E2', bgColor: 'from-slate-400/50 to-slate-300/50', icon: Crown }
};

const VIPLoyalty = ({ token, language = 'de' }) => {
  const [status, setStatus] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState('status'); // status, tiers, leaderboard

  const t = (key) => {
    const translations = {
      de: {
        title: 'VIP Treueprogramm',
        subtitle: 'Sammle Punkte und genieße exklusive Vorteile',
        yourStatus: 'Dein Status',
        points: 'Punkte',
        nextTier: 'Nächste Stufe',
        pointsNeeded: 'Punkte benötigt',
        benefits: 'Vorteile',
        cashbackBonus: 'Cashback Bonus',
        bidDiscount: 'Gebot-Rabatt',
        freeBidsMonthly: 'Gratis-Gebote/Monat',
        prioritySupport: 'Premium Support',
        exclusiveAuctions: 'Exklusive Auktionen',
        earlyAccess: 'Früher Zugang',
        claimDaily: 'Täglichen Bonus abholen',
        alreadyClaimed: 'Heute bereits abgeholt',
        memberSince: 'Mitglied seit',
        recentActivity: 'Letzte Aktivität',
        allTiers: 'Alle Stufen',
        leaderboard: 'Rangliste',
        thisWeek: 'Diese Woche',
        thisMonth: 'Diesen Monat',
        allTime: 'Gesamt',
        rank: 'Rang',
        howToEarn: 'So sammelst du Punkte',
        bidPlaced: 'Gebot platziert',
        auctionWon: 'Auktion gewonnen',
        bidPurchase: 'Gebote gekauft',
        dailyLogin: 'Täglicher Login',
        referralSignup: 'Freund geworben'
      },
      en: {
        title: 'VIP Loyalty Program',
        subtitle: 'Earn points and enjoy exclusive benefits',
        yourStatus: 'Your Status',
        points: 'Points',
        nextTier: 'Next Tier',
        pointsNeeded: 'Points needed',
        benefits: 'Benefits',
        cashbackBonus: 'Cashback Bonus',
        bidDiscount: 'Bid Discount',
        freeBidsMonthly: 'Free Bids/Month',
        prioritySupport: 'Priority Support',
        exclusiveAuctions: 'Exclusive Auctions',
        earlyAccess: 'Early Access',
        claimDaily: 'Claim Daily Bonus',
        alreadyClaimed: 'Already claimed today',
        memberSince: 'Member since',
        recentActivity: 'Recent Activity',
        allTiers: 'All Tiers',
        leaderboard: 'Leaderboard',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        allTime: 'All Time',
        rank: 'Rank',
        howToEarn: 'How to earn points',
        bidPlaced: 'Bid placed',
        auctionWon: 'Auction won',
        bidPurchase: 'Bids purchased',
        dailyLogin: 'Daily login',
        referralSignup: 'Friend referred'
      }
    };
    return translations[language]?.[key] || translations.de[key] || key;
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const [statusRes, tiersRes, leaderboardRes] = await Promise.all([
        fetch(`${API}/api/loyalty/status`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/loyalty/tiers`),
        fetch(`${API}/api/loyalty/leaderboard?period=month`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }
      
      if (tiersRes.ok) {
        const data = await tiersRes.json();
        setTiers(data.tiers || []);
      }
      
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const claimDailyBonus = async () => {
    setClaiming(true);
    try {
      const response = await fetch(`${API}/api/loyalty/claim-daily`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`+${data.points_earned} Punkte erhalten!`);
        fetchData(); // Refresh status
      } else {
        toast.info(data.detail || t('alreadyClaimed'));
      }
    } catch (error) {
      toast.error('Fehler beim Abholen');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const currentTier = status?.tier || { id: 'bronze', name: 'Bronze', color: '#CD7F32', benefits: {} };
  const tierConfig = TIER_CONFIG[currentTier.id] || TIER_CONFIG.bronze;
  const TierIcon = tierConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4" data-testid="vip-loyalty-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-amber-500" />
            {t('title')}
          </h1>
          <p className="text-gray-400">{t('subtitle')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          {['status', 'tiers', 'leaderboard'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab === 'status' ? t('yourStatus') : tab === 'tiers' ? t('allTiers') : t('leaderboard')}
            </button>
          ))}
        </div>

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Current Status Card */}
            <div className={`bg-gradient-to-r ${tierConfig.bgColor} rounded-2xl p-6 border-2`} style={{ borderColor: currentTier.color }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: currentTier.color + '30' }}
                  >
                    <TierIcon className="w-8 h-8" style={{ color: currentTier.color }} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('yourStatus')}</p>
                    <h2 className="text-2xl font-bold" style={{ color: currentTier.color }}>
                      {currentTier.name}
                    </h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">{t('points')}</p>
                  <p className="text-3xl font-bold text-amber-400">{status?.points?.toLocaleString('de-DE') || 0}</p>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {status?.progress && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">{t('nextTier')}: {status.progress.next_tier_name}</span>
                    <span className="text-amber-400">{status.progress.points_needed} {t('pointsNeeded')}</span>
                  </div>
                  <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all"
                      style={{ width: `${status.progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Daily Bonus Button */}
              <Button
                onClick={claimDailyBonus}
                disabled={claiming}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                {claiming ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Gift className="w-4 h-4 mr-2" />
                )}
                {t('claimDaily')} (+5 Punkte)
              </Button>
            </div>

            {/* Benefits Grid */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                {t('benefits')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <BenefitItem
                  icon={Percent}
                  label={t('cashbackBonus')}
                  value={`+${currentTier.benefits?.cashback_bonus || 0}%`}
                  active={currentTier.benefits?.cashback_bonus > 0}
                />
                <BenefitItem
                  icon={Zap}
                  label={t('bidDiscount')}
                  value={`${currentTier.benefits?.bid_discount || 0}%`}
                  active={currentTier.benefits?.bid_discount > 0}
                />
                <BenefitItem
                  icon={Gift}
                  label={t('freeBidsMonthly')}
                  value={currentTier.benefits?.free_bids_monthly || 0}
                  active={currentTier.benefits?.free_bids_monthly > 0}
                />
                <BenefitItem
                  icon={Users}
                  label={t('prioritySupport')}
                  value={currentTier.benefits?.priority_support ? '✓' : '—'}
                  active={currentTier.benefits?.priority_support}
                />
                <BenefitItem
                  icon={Star}
                  label={t('exclusiveAuctions')}
                  value={currentTier.benefits?.exclusive_auctions ? '✓' : '—'}
                  active={currentTier.benefits?.exclusive_auctions}
                />
                <BenefitItem
                  icon={Clock}
                  label={t('earlyAccess')}
                  value={currentTier.benefits?.early_access ? '✓' : '—'}
                  active={currentTier.benefits?.early_access}
                />
              </div>
            </div>

            {/* How to Earn Points */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                {t('howToEarn')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <PointsMethod action={t('bidPlaced')} points={1} />
                <PointsMethod action={t('auctionWon')} points={100} />
                <PointsMethod action={t('bidPurchase')} points={2} />
                <PointsMethod action={t('dailyLogin')} points={5} />
                <PointsMethod action={t('referralSignup')} points={200} />
              </div>
            </div>

            {/* Recent Activity */}
            {status?.recent_activity && status.recent_activity.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-4">{t('recentActivity')}</h3>
                <div className="space-y-3">
                  {status.recent_activity.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{activity.reason}</span>
                      <span className={`font-medium ${activity.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {activity.points > 0 ? '+' : ''}{activity.points} Punkte
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tiers Tab */}
        {activeTab === 'tiers' && (
          <div className="space-y-4">
            {tiers.map((tier, idx) => {
              const config = TIER_CONFIG[tier.id] || TIER_CONFIG.bronze;
              const TIcon = config.icon;
              const isCurrentTier = tier.id === currentTier.id;
              const isUnlocked = (status?.points || 0) >= tier.min_points;
              
              return (
                <div 
                  key={tier.id}
                  className={`rounded-xl p-5 border-2 transition-all ${
                    isCurrentTier ? 'border-amber-500' : 'border-gray-700/50'
                  } ${isUnlocked ? '' : 'opacity-60'}`}
                  style={{ backgroundColor: config.color + '10' }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: config.color + '30' }}
                    >
                      {isUnlocked ? (
                        <TIcon className="w-7 h-7" style={{ color: config.color }} />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold" style={{ color: config.color }}>
                          {tier.name}
                        </h3>
                        {isCurrentTier && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                            Aktuell
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{tier.min_points.toLocaleString('de-DE')} Punkte benötigt</p>
                    </div>

                    <div className="text-right text-sm">
                      <div className="text-amber-400">+{tier.benefits?.cashback_bonus || 0}% Cashback</div>
                      <div className="text-gray-400">{tier.benefits?.free_bids_monthly || 0} Gratis-Gebote</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top Sammler diesen Monat
              </h3>
            </div>
            <div className="divide-y divide-gray-700/50">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Noch keine Rangliste verfügbar
                </div>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-700/30 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-black' :
                      idx === 1 ? 'bg-gray-400 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{entry.name}</p>
                      <p className="text-xs" style={{ color: TIER_CONFIG[entry.tier]?.color || '#CD7F32' }}>
                        {entry.tier?.charAt(0).toUpperCase() + entry.tier?.slice(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-bold">{entry.points?.toLocaleString('de-DE')}</p>
                      <p className="text-gray-500 text-xs">{t('points')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Benefit Item Component
const BenefitItem = ({ icon: Icon, label, value, active }) => (
  <div className={`p-3 rounded-lg ${active ? 'bg-amber-500/10' : 'bg-gray-700/30'}`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-gray-500'}`} />
      <span className="text-gray-400 text-xs">{label}</span>
    </div>
    <p className={`font-semibold ${active ? 'text-white' : 'text-gray-500'}`}>{value}</p>
  </div>
);

// Points Method Component
const PointsMethod = ({ action, points }) => (
  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
    <span className="text-gray-300 text-sm">{action}</span>
    <span className="text-amber-400 font-medium">+{points}</span>
  </div>
);

export default VIPLoyalty;
