/**
 * BidBlitz Miner Market - GoMining Style
 * Purchase miners and special deals
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart, Coins, Zap, Activity, ArrowLeft,
  Server, Sparkles, Crown, CheckCircle, AlertCircle,
  TrendingUp, Gift, Star, Percent
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// ==================== TIER STYLES ====================
const tierConfig = {
  bronze: {
    gradient: 'from-amber-700 to-amber-900',
    border: 'border-amber-600/50',
    glow: 'hover:shadow-amber-500/30',
    badge: 'bg-amber-600'
  },
  silver: {
    gradient: 'from-slate-400 to-slate-600',
    border: 'border-slate-400/50',
    glow: 'hover:shadow-slate-400/30',
    badge: 'bg-slate-500'
  },
  gold: {
    gradient: 'from-yellow-500 to-amber-600',
    border: 'border-yellow-500/50',
    glow: 'hover:shadow-yellow-500/40',
    badge: 'bg-yellow-500'
  },
  platinum: {
    gradient: 'from-cyan-400 to-blue-600',
    border: 'border-cyan-500/50',
    glow: 'hover:shadow-cyan-500/40',
    badge: 'bg-cyan-500'
  },
  diamond: {
    gradient: 'from-purple-500 to-pink-600',
    border: 'border-purple-500/50',
    glow: 'hover:shadow-purple-500/50',
    badge: 'bg-purple-500'
  }
};

// ==================== MINER CARD ====================
const MarketMinerCard = ({ miner, balance, onBuy, buying }) => {
  const tier = tierConfig[miner.tier] || tierConfig.bronze;
  const canAfford = balance >= miner.price;
  
  return (
    <div className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl overflow-hidden border ${tier.border} hover:border-opacity-100 transition-all duration-300 group shadow-xl ${tier.glow}`}>
      {/* Limited Badge */}
      {miner.limited && (
        <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
          LIMITIERT • {miner.stock} übrig
        </div>
      )}
      
      {/* Tier Badge */}
      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${tier.gradient} text-white shadow-lg`}>
        {miner.tier}
      </div>
      
      {/* Miner Visual */}
      <div className="h-40 bg-gradient-to-b from-slate-700/30 to-transparent flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/50" />
        <Server className={`w-20 h-20 text-white/80 group-hover:scale-110 transition-transform duration-500`} />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i < Object.keys(tierConfig).indexOf(miner.tier) + 1 ? 'bg-cyan-400' : 'bg-slate-600'}`}
            />
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-white text-xl mb-4">{miner.name}</h3>
        
        {/* Stats */}
        <div className="space-y-3 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-cyan-400" /> Hashrate
            </span>
            <span className="text-cyan-400 font-bold">{miner.hashrate} TH/s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-400" /> Power
            </span>
            <span className="text-amber-400 font-bold">{miner.power}W</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-400" /> Täglich
            </span>
            <span className="text-green-400 font-bold">+{miner.daily_reward} Coins</span>
          </div>
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl mb-4">
          <span className="text-slate-300 text-sm">Preis</span>
          <span className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <Coins className="w-5 h-5" />
            {miner.price.toLocaleString('de-DE')}
          </span>
        </div>
        
        {/* ROI Info */}
        <div className="text-center text-xs text-slate-400 mb-4">
          ROI in ca. {Math.ceil(miner.price / miner.daily_reward)} Tagen
        </div>
        
        {/* Buy Button */}
        <button
          onClick={() => onBuy(miner.id)}
          disabled={!canAfford || buying}
          className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            canAfford
              ? `bg-gradient-to-r ${tier.gradient} text-white hover:opacity-90 shadow-lg`
              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
          }`}
        >
          {buying ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Kaufen...
            </>
          ) : canAfford ? (
            <>
              <ShoppingCart className="w-5 h-5" />
              Jetzt kaufen
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              Nicht genug Coins
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ==================== DEAL CARD ====================
const DealCard = ({ deal }) => (
  <div className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/30 overflow-hidden">
    <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
      -{deal.discount}%
    </div>
    
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 bg-amber-500/20 rounded-xl">
        <Gift className="w-8 h-8 text-amber-400" />
      </div>
      <div>
        <h3 className="font-bold text-white text-lg">{deal.name}</h3>
        <p className="text-amber-300/70 text-sm">{deal.description}</p>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <span className="text-slate-400 line-through text-sm">{deal.original_price}</span>
        <span className="text-2xl font-bold text-amber-400 ml-2">{deal.sale_price} Coins</span>
      </div>
      <button className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-400 hover:to-orange-400 transition-all">
        Deal sichern
      </button>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
export default function MinerMarket() {
  const navigate = useNavigate();
  const [miners, setMiners] = useState([]);
  const [deals, setDeals] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [marketRes, walletRes, dealsRes] = await Promise.all([
        axios.get(`${API}/app/market/miners`),
        axios.get(`${API}/app/wallet/balance`, { headers }),
        axios.get(`${API}/app/market/deals`)
      ]);
      
      setMiners(marketRes.data.miners || []);
      setBalance(walletRes.data.coins || 0);
      setDeals(dealsRes.data.deals || []);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBuy = async (minerTypeId) => {
    setBuying(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.post(`${API}/app/miner/buy`, 
        { miner_type_id: minerTypeId },
        { headers }
      );
      
      setMessage({ type: 'success', text: res.data.message });
      setBalance(res.data.new_balance);
      
      // Redirect to dashboard after short delay
      setTimeout(() => navigate('/miner'), 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Kauf fehlgeschlagen' 
      });
    } finally {
      setBuying(false);
    }
  };
  
  const addTestCoins = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/wallet/add-coins?amount=5000`, {}, { headers });
      setBalance(res.data.new_balance);
      setMessage({ type: 'success', text: '+5.000 Test-Coins hinzugefügt!' });
    } catch (error) {
      console.error('Error adding coins:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 font-medium">Miner-Markt wird geladen...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/miner"
              className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
                <ShoppingCart className="w-10 h-10 text-cyan-400" />
                Miner Markt
              </h1>
              <p className="text-slate-400 mt-1">Wähle deinen perfekten Miner</p>
            </div>
          </div>
          
          {/* Wallet Balance */}
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-slate-800/80 rounded-2xl border border-slate-700/50 flex items-center gap-3">
              <Coins className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-xs text-slate-400">Dein Guthaben</p>
                <p className="text-xl font-bold text-amber-400">{balance.toLocaleString('de-DE')} Coins</p>
              </div>
            </div>
            <button
              onClick={addTestCoins}
              className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-semibold text-sm transition-colors border border-green-500/30"
            >
              +5000 Test
            </button>
          </div>
        </div>
        
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}
        
        {/* Special Deals */}
        {deals.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-amber-400" />
              Aktuelle Deals
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        )}
        
        {/* Miner Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
            <Server className="w-7 h-7 text-cyan-400" />
            Alle Miner
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {miners.map((miner) => (
              <MarketMinerCard 
                key={miner.id} 
                miner={miner} 
                balance={balance}
                onBuy={handleBuy}
                buying={buying}
              />
            ))}
          </div>
        </div>
        
        {/* Info Section */}
        <div className="mt-12 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-cyan-400" />
            Wie funktioniert das Mining?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 font-bold shrink-0">1</div>
              <div>
                <p className="font-semibold text-white">Miner kaufen</p>
                <p className="text-sm text-slate-400">Wähle einen Miner und kaufe ihn mit deinen Coins.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 font-bold shrink-0">2</div>
              <div>
                <p className="font-semibold text-white">Mining starten</p>
                <p className="text-sm text-slate-400">Dein Miner arbeitet automatisch und generiert Coins.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 font-bold shrink-0">3</div>
              <div>
                <p className="font-semibold text-white">Belohnungen sammeln</p>
                <p className="text-sm text-slate-400">Hole täglich deine Mining-Belohnungen ab.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
