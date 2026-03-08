/**
 * BidBlitz Super App Home - Premium Design
 * Modern Dashboard mit Animationen, Glaseffekten und erweiterten Features
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Gamepad2, Pickaxe, Car, Bike, ShoppingCart, Trophy, Gift, Wallet,
  TrendingUp, Zap, Star, ChevronRight, Bell, Settings, Search,
  Sparkles, Clock, Target, Award, Coins, CreditCard, Users,
  Home, User, MapPin, Ticket
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Quick Actions mit Lucide Icons und Gradienten
const QUICK_ACTIONS = [
  { id: 1, name: 'Games', icon: Gamepad2, route: '/games', gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30' },
  { id: 2, name: 'Mining', icon: Pickaxe, route: '/mining', gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30' },
  { id: 3, name: 'Taxi', icon: Car, route: '/ride-pay', gradient: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-500/30' },
  { id: 4, name: 'Scooter', icon: MapPin, route: '/ride-pay', gradient: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-500/30' },
  { id: 5, name: 'Bike', icon: Bike, route: '/ride-pay', gradient: 'from-sky-400 to-blue-500', glow: 'shadow-sky-500/30' },
  { id: 6, name: 'Market', icon: ShoppingCart, route: '/auctions', gradient: 'from-pink-400 to-rose-500', glow: 'shadow-pink-500/30' },
  { id: 7, name: 'Lottery', icon: Gift, route: '/games', gradient: 'from-red-400 to-rose-500', glow: 'shadow-red-500/30' },
  { id: 8, name: 'Ranking', icon: Trophy, route: '/leaderboard', gradient: 'from-fuchsia-400 to-purple-500', glow: 'shadow-fuchsia-500/30' },
];

// Featured Cards
const FEATURED_CARDS = [
  {
    id: 1,
    title: 'Spiele & Verdiene',
    subtitle: '20+ Spiele verfügbar',
    icon: Gamepad2,
    route: '/games',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    badge: 'NEU'
  },
  {
    id: 2,
    title: 'Live Auktionen',
    subtitle: 'iPhone 17, PS6 & mehr',
    icon: Target,
    route: '/auctions',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    badge: 'LIVE'
  },
  {
    id: 3,
    title: 'Daily Bonus',
    subtitle: 'Täglich Coins sammeln',
    icon: Gift,
    route: '/games',
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    badge: 'GRATIS'
  },
];

export default function SuperAppHome() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    totalWins: 0,
    streak: 0
  });

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 0);
    } catch {
      setCoins(100);
    }

    // Check for logged in user
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userRes = await axios.get(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userRes.data);
      } catch {}
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-[#0a0a1a] via-[#111827] to-[#0a0a1a]" data-testid="super-app-home">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">BidBlitz</h1>
            <p className="text-xs text-gray-400">Super App</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Coins Display */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-full px-4 py-2 shadow-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-yellow-400">{coins.toLocaleString()}</span>
          </div>
          {/* Notifications */}
          <button className="relative w-11 h-11 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </header>

      {/* Welcome Banner */}
      <div className="relative z-10 mx-5 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 shadow-2xl shadow-purple-500/20">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium text-white/80">
                {user ? 'Willkommen zurück!' : 'Willkommen bei BidBlitz!'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {user?.first_name || 'Entdecke'}
            </h2>
            <p className="text-white/70 text-sm">
              {user ? 'Bereit für neue Abenteuer?' : 'Spiele, Gewinne & Spare bis zu 90%'}
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Tages-Ziel</span>
                <span>500 / 1000 Coins</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="relative z-10 px-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Quick Actions
          </h2>
          <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Alle →
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => navigate(action.route)}
                className={`relative bg-gradient-to-br ${action.gradient} rounded-2xl p-4 text-center shadow-xl ${action.glow} transform hover:scale-105 active:scale-95 transition-all overflow-hidden`}
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`quick-action-${action.name.toLowerCase()}`}
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white">{action.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 px-5 mb-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Deine Stats
        </h2>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#252540] rounded-2xl p-4 border border-white/5 shadow-xl">
            <Coins className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold text-white">{coins.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Coins</p>
          </div>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#252540] rounded-2xl p-4 border border-white/5 shadow-xl">
            <Star className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">12</p>
            <p className="text-xs text-gray-400">Level</p>
          </div>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#252540] rounded-2xl p-4 border border-white/5 shadow-xl">
            <Award className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-white">5</p>
            <p className="text-xs text-gray-400">Streak 🔥</p>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="relative z-10 px-5 mb-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-fuchsia-400" />
          Featured
        </h2>
        
        <div className="space-y-3">
          {FEATURED_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => navigate(card.route)}
                className={`w-full relative overflow-hidden bg-gradient-to-r ${card.gradient} rounded-2xl p-5 shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-lg">{card.title}</h3>
                        <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm">{card.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/70" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="relative z-10 px-5 mb-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#252540] rounded-2xl p-5 border border-white/10 shadow-xl">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-2xl" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">GRATIS BONUS</span>
              </div>
              <p className="text-white font-semibold">Lade Freunde ein & erhalte 500 Coins!</p>
              <p className="text-gray-400 text-xs mt-1">Pro erfolgreichem Invite</p>
            </div>
            <button className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold px-4 py-2 rounded-xl shadow-lg shadow-yellow-500/30 hover:scale-105 transition-transform">
              Einladen
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/95 backdrop-blur-xl border-t border-white/10 px-6 py-3 safe-area-inset">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button onClick={() => navigate('/super-home')} className="flex flex-col items-center gap-1 text-purple-400">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button onClick={() => navigate('/games')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="text-xs">Games</span>
          </button>
          <button onClick={() => navigate('/auctions')} className="flex flex-col items-center gap-1 -mt-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-gray-400 mt-1">Shop</span>
          </button>
          <button onClick={() => navigate('/wallet')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs">Wallet</span>
          </button>
          <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs">Profil</span>
          </button>
        </div>
      </nav>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .safe-area-inset {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
