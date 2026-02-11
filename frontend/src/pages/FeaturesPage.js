import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import GlobalJackpot from '../components/GlobalJackpot';
import { HappyHourBanner, LuckyBidCounter, ExcitementStatusBar } from '../components/ExcitementFeatures';
import LeaderboardWidget from '../components/LeaderboardWidget';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import WinnerGallery from '../components/WinnerGallery';
import DailyQuestsWidget from '../components/DailyQuestsWidget';
import { VIPPromoBanner } from '../components/VIPBadge';
import FlashSaleBanner from '../components/FlashSaleBanner';
import MysteryBoxSection from '../components/MysteryBoxSection';
import LiveWinnerTicker from '../components/LiveWinnerTicker';
import VIPBenefitsBanner from '../components/VIPBenefitsBanner';
import DailyLoginStreak from '../components/DailyLoginStreak';
import ShareAndWin from '../components/ShareAndWin';
import WinnerGalleryHome from '../components/WinnerGalleryHome';
import SustainabilitySection from '../components/SustainabilitySection';
import { 
  Trophy, Gift, Zap, Target, Star, Users, 
  Swords, Brain, Ticket, Bell, Crown, TrendingUp,
  Calendar, Award, Shield, Gamepad2, Coins
} from 'lucide-react';

const translations = {
  de: {
    title: 'Features & Extras',
    subtitle: 'Entdecke alle BidBlitz Vorteile',
    gamification: 'Gamification',
    social: 'Social Features',
    rewards: 'Belohnungen',
    extras: 'Extras',
    duels: 'Duelle',
    duelsDesc: '1v1 gegen andere Bieter',
    betting: 'Social Betting',
    bettingDesc: 'Wette auf Auktionsgewinner',
    teams: 'Team-Bieten',
    teamsDesc: 'Bilde ein Team und gewinne zusammen',
    battles: 'Freunde-Battles',
    battlesDesc: 'Kämpfe gegen deine Freunde',
    aiAdvisor: 'KI-Berater',
    aiAdvisorDesc: 'Intelligente Gebot-Empfehlungen',
    vouchers: 'Gutschein-Auktionen',
    vouchersDesc: 'Ersteigere Gutscheine',
    gifts: 'Geschenkkarten',
    giftsDesc: 'Verschenke BidBlitz Gebote',
    alarm: 'Gebot-Alarm',
    alarmDesc: 'Benachrichtigungen für Auktionen',
    dailyQuests: 'Tägliche Aufgaben',
    dailyRewards: 'Tägliche Belohnungen',
    battlePass: 'Battle Pass',
    achievements: 'Achievements',
    tournaments: 'Turniere',
    dealRadar: 'Deal Radar',
    priceAlerts: 'Preis-Alerts',
    vipDashboard: 'VIP Dashboard',
    goToAuctions: 'Zu den Auktionen',
    explore: 'Entdecken',
    comingSoon: 'Demnächst'
  },
  en: {
    title: 'Features & Extras',
    subtitle: 'Discover all BidBlitz benefits',
    gamification: 'Gamification',
    social: 'Social Features',
    rewards: 'Rewards',
    extras: 'Extras',
    duels: 'Duels',
    duelsDesc: '1v1 against other bidders',
    betting: 'Social Betting',
    bettingDesc: 'Bet on auction winners',
    teams: 'Team Bidding',
    teamsDesc: 'Form a team and win together',
    battles: 'Friend Battles',
    battlesDesc: 'Battle against your friends',
    aiAdvisor: 'AI Advisor',
    aiAdvisorDesc: 'Smart bid recommendations',
    vouchers: 'Voucher Auctions',
    vouchersDesc: 'Bid on vouchers',
    gifts: 'Gift Cards',
    giftsDesc: 'Gift BidBlitz bids',
    alarm: 'Bid Alarm',
    alarmDesc: 'Notifications for auctions',
    dailyQuests: 'Daily Quests',
    dailyRewards: 'Daily Rewards',
    battlePass: 'Battle Pass',
    achievements: 'Achievements',
    tournaments: 'Tournaments',
    dealRadar: 'Deal Radar',
    priceAlerts: 'Price Alerts',
    vipDashboard: 'VIP Dashboard',
    goToAuctions: 'Go to Auctions',
    explore: 'Explore',
    comingSoon: 'Coming Soon'
  },
  sq: {
    title: 'Veçoritë & Ekstra',
    subtitle: 'Zbulo të gjitha përfitimet e BidBlitz',
    gamification: 'Lojëzimi',
    social: 'Veçori Sociale',
    rewards: 'Shpërblimet',
    extras: 'Ekstra',
    duels: 'Duelet',
    duelsDesc: '1v1 kundër ofertuesve të tjerë',
    betting: 'Bastet Sociale',
    bettingDesc: 'Bast në fituesit e ankandeve',
    teams: 'Ofertimi në Ekip',
    teamsDesc: 'Krijo ekip dhe fito së bashku',
    battles: 'Betejat me Miq',
    battlesDesc: 'Lufto kundër miqve',
    aiAdvisor: 'Këshilltari AI',
    aiAdvisorDesc: 'Rekomandime të zgjuara',
    vouchers: 'Ankandet e Kuponave',
    vouchersDesc: 'Oferto për kupona',
    gifts: 'Kartat e Dhuratave',
    giftsDesc: 'Dhuro ofertat BidBlitz',
    alarm: 'Alarmi i Ofertave',
    alarmDesc: 'Njoftime për ankande',
    dailyQuests: 'Detyrat Ditore',
    dailyRewards: 'Shpërblimet Ditore',
    battlePass: 'Battle Pass',
    achievements: 'Arritjet',
    tournaments: 'Turnetë',
    dealRadar: 'Radari i Ofertave',
    priceAlerts: 'Alarmet e Çmimit',
    vipDashboard: 'Paneli VIP',
    goToAuctions: 'Shko te Ankandat',
    explore: 'Eksploro',
    comingSoon: 'Së Shpejti'
  }
};

const FeatureCard = ({ icon: Icon, title, description, route, color, isNew, navigate }) => (
  <div
    onClick={() => navigate(route)}
    className={`relative bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-gray-700 hover:border-${color}-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-${color}-500/10`}
  >
    {isNew && (
      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
        NEU
      </span>
    )}
    <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
      <Icon className={`w-6 h-6 text-${color}-400`} />
    </div>
    <h3 className="text-white font-bold mb-1">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

const FeaturesPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { language, mappedLanguage } = useLanguage();
  const navigate = useNavigate();
  const langKey = mappedLanguage || language;
  const t = translations[langKey] || translations.de;

  const gamificationFeatures = [
    { icon: Swords, title: t.duels, description: t.duelsDesc, route: '/duels', color: 'orange', isNew: true },
    { icon: Coins, title: t.betting, description: t.bettingDesc, route: '/betting', color: 'yellow', isNew: true },
    { icon: Users, title: t.teams, description: t.teamsDesc, route: '/teams', color: 'green', isNew: true },
    { icon: Gamepad2, title: t.battles, description: t.battlesDesc, route: '/friend-battles', color: 'red', isNew: true },
    { icon: Trophy, title: t.tournaments, description: '', route: '/tournaments', color: 'purple' },
    { icon: Award, title: t.achievements, description: '', route: '/achievements', color: 'blue' },
  ];

  const utilityFeatures = [
    { icon: Brain, title: t.aiAdvisor, description: t.aiAdvisorDesc, route: '/ki-berater', color: 'blue', isNew: true },
    { icon: Ticket, title: t.vouchers, description: t.vouchersDesc, route: '/gutscheine', color: 'purple', isNew: true },
    { icon: Gift, title: t.gifts, description: t.giftsDesc, route: '/gift-cards', color: 'pink', isNew: true },
    { icon: Bell, title: t.alarm, description: t.alarmDesc, route: '/alarm', color: 'red', isNew: true },
    { icon: Target, title: t.dealRadar, description: '', route: '/deal-radar', color: 'cyan' },
    { icon: TrendingUp, title: t.priceAlerts, description: '', route: '/price-alerts', color: 'green' },
  ];

  const rewardFeatures = [
    { icon: Calendar, title: t.dailyQuests, description: '', route: '/daily-rewards', color: 'orange' },
    { icon: Star, title: t.battlePass, description: '', route: '/battle-pass', color: 'yellow' },
    { icon: Crown, title: t.vipDashboard, description: '', route: '/vip-dashboard', color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-20 pb-24" data-testid="features-page">
      {/* Header */}
      <div className="text-center mb-8 px-4">
        <h1 className="text-3xl font-black text-white mb-2">{t.title}</h1>
        <p className="text-gray-400">{t.subtitle}</p>
        <button
          onClick={() => navigate('/auktionen')}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all"
        >
          {t.goToAuctions} →
        </button>
      </div>

      {/* Happy Hour & Jackpot */}
      <div className="max-w-4xl mx-auto mb-6 px-4 space-y-4">
        <HappyHourBanner />
        <GlobalJackpot />
      </div>

      {/* Live Winner Ticker */}
      <div className="max-w-7xl mx-auto mb-6 px-4">
        <LiveWinnerTicker />
      </div>

      {/* Gamification Section */}
      <div className="max-w-7xl mx-auto mb-8 px-4">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-orange-500" />
          {t.gamification}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {gamificationFeatures.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Utility Features Section */}
      <div className="max-w-7xl mx-auto mb-8 px-4">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-500" />
          {t.extras}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {utilityFeatures.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Rewards Section */}
      <div className="max-w-7xl mx-auto mb-8 px-4">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" />
          {t.rewards}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {rewardFeatures.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Daily Login Streak */}
      {isAuthenticated && (
        <div className="max-w-4xl mx-auto mb-6 px-4">
          <DailyLoginStreak />
        </div>
      )}

      {/* VIP Promo Banner - Only for non-VIP users */}
      {isAuthenticated && !user?.is_vip && (
        <div className="max-w-4xl mx-auto mb-6 px-4">
          <VIPPromoBanner onJoin={() => navigate('/vip')} />
        </div>
      )}

      {/* VIP Benefits Banner */}
      <div className="max-w-4xl mx-auto mb-6 px-4">
        <VIPBenefitsBanner />
      </div>

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto mb-6 px-4">
        <LeaderboardWidget language={language} />
      </div>

      {/* Daily Quests Widget - For logged-in users */}
      {isAuthenticated && (
        <div className="max-w-4xl mx-auto mb-6 px-4">
          <DailyQuestsWidget />
        </div>
      )}

      {/* Personalized Recommendations */}
      <div className="max-w-7xl mx-auto mb-6 px-4">
        <PersonalizedRecommendations />
      </div>

      {/* Flash Sales Banner */}
      <div className="max-w-7xl mx-auto mb-6 px-4">
        <FlashSaleBanner />
      </div>

      {/* Mystery Box Section */}
      <div className="max-w-7xl mx-auto mb-6 px-4">
        <MysteryBoxSection />
      </div>

      {/* Share and Win */}
      <div className="max-w-4xl mx-auto mb-6 px-4">
        <ShareAndWin />
      </div>

      {/* Winner Gallery */}
      <div className="max-w-7xl mx-auto mb-6 px-4">
        <WinnerGalleryHome />
      </div>

      {/* Sustainability Section */}
      <SustainabilitySection />

      {/* Winner Gallery (Full) */}
      <WinnerGallery limit={6} />
    </div>
  );
};

export default FeaturesPage;
