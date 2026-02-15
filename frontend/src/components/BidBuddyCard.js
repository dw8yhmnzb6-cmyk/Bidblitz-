/**
 * BidBuddy Component - Autobidder UI
 * Allows users to set up automatic bidding with different strategies
 */
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Bot, Zap, Target, Clock, TrendingUp, Award, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Strategy descriptions
const STRATEGIES = {
  aggressive: {
    name: 'Aggressiv',
    icon: '⚡',
    description: 'Bietet sofort nach dem Überboten werden',
    color: 'from-red-500 to-orange-500'
  },
  balanced: {
    name: 'Ausgewogen',
    icon: '⚖️',
    description: 'Bietet mit kurzem Delay',
    color: 'from-blue-500 to-cyan-500'
  },
  conservative: {
    name: 'Konservativ',
    icon: '🛡️',
    description: 'Wartet bis kurz vor Ende',
    color: 'from-green-500 to-emerald-500'
  },
  sniper: {
    name: 'Sniper',
    icon: '🎯',
    description: 'Bietet nur in letzten 3 Sekunden',
    color: 'from-purple-500 to-pink-500'
  }
};

const BidBuddyCard = ({ auctionId, auctionName, currentPrice, userBids, onActivate, langKey = 'de' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [maxBids, setMaxBids] = useState(10);
  const [maxPrice, setMaxPrice] = useState(null);
  const [strategy, setStrategy] = useState('balanced');
  const [isActivating, setIsActivating] = useState(false);
  const [activeBuddy, setActiveBuddy] = useState(null);
  
  const texts = {
    de: {
      title: 'Bid Buddy aktivieren',
      subtitle: 'Automatisch bieten wenn du überboten wirst',
      maxBids: 'Maximale Gebote',
      maxPrice: 'Maximaler Preis (optional)',
      strategy: 'Strategie',
      activate: 'Bid Buddy aktivieren',
      deactivate: 'Deaktivieren',
      active: 'Bid Buddy aktiv',
      remaining: 'verbleibend',
      bidsUsed: 'Gebote verwendet'
    },
    en: {
      title: 'Activate Bid Buddy',
      subtitle: 'Automatically bid when outbid',
      maxBids: 'Maximum Bids',
      maxPrice: 'Maximum Price (optional)',
      strategy: 'Strategy',
      activate: 'Activate Bid Buddy',
      deactivate: 'Deactivate',
      active: 'Bid Buddy Active',
      remaining: 'remaining',
      bidsUsed: 'Bids used'
    }
  };
  
  const t = texts[langKey] || texts.de;
  
  useEffect(() => {
    checkBuddyStatus();
  }, [auctionId]);
  
  const checkBuddyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await axios.get(`${API}/api/bid-buddy/status/${auctionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.active) {
        setActiveBuddy(res.data.bid_buddy);
      }
    } catch (err) {
      console.log('No active bid buddy');
    }
  };
  
  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Bitte einloggen');
        return;
      }
      
      const res = await axios.post(`${API}/api/bid-buddy/activate`, {
        auction_id: auctionId,
        max_bids: maxBids,
        max_price: maxPrice,
        strategy: strategy,
        bid_on_outbid: true,
        min_seconds_before_end: strategy === 'sniper' ? 3 : 5
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setActiveBuddy(res.data.bid_buddy);
      toast.success('Bid Buddy aktiviert! 🤖');
      if (onActivate) onActivate(res.data.bid_buddy);
      
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler beim Aktivieren');
    } finally {
      setIsActivating(false);
    }
  };
  
  const handleDeactivate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/bid-buddy/deactivate/${auctionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setActiveBuddy(null);
      toast.success('Bid Buddy deaktiviert');
    } catch (err) {
      toast.error('Fehler beim Deaktivieren');
    }
  };
  
  // If already active, show status
  if (activeBuddy) {
    const strategyInfo = STRATEGIES[activeBuddy.strategy] || STRATEGIES.balanced;
    const remaining = activeBuddy.max_bids - activeBuddy.bids_placed;
    
    return (
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-green-500 animate-pulse" />
            <span className="font-bold text-green-600">{t.active}</span>
          </div>
          <span className="text-2xl">{strategyInfo.icon}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">{t.remaining}</p>
            <p className="text-xl font-bold text-green-600">{remaining}</p>
          </div>
          <div className="bg-white/50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">{t.bidsUsed}</p>
            <p className="text-xl font-bold text-blue-600">{activeBuddy.bids_placed}</p>
          </div>
        </div>
        
        <Button 
          onClick={handleDeactivate}
          variant="outline"
          className="w-full border-red-500 text-red-500 hover:bg-red-50"
        >
          {t.deactivate}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-b from-cyan-50 to-white rounded-xl border border-cyan-200 overflow-hidden">
      {/* Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-cyan-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800">{t.title}</h3>
            <p className="text-xs text-gray-500">{t.subtitle}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Strategy Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t.strategy}</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STRATEGIES).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setStrategy(key)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    strategy === key 
                      ? `border-cyan-500 bg-gradient-to-r ${info.color} text-white` 
                      : 'border-gray-200 bg-white hover:border-cyan-300'
                  }`}
                >
                  <span className="text-xl">{info.icon}</span>
                  <p className={`text-sm font-medium ${strategy === key ? 'text-white' : 'text-gray-700'}`}>
                    {info.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Max Bids Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">{t.maxBids}</label>
              <span className="text-sm font-bold text-cyan-600">{maxBids}</span>
            </div>
            <Slider
              value={[maxBids]}
              onValueChange={(value) => setMaxBids(value[0])}
              min={5}
              max={Math.min(100, userBids || 50)}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>5</span>
              <span>{Math.min(100, userBids || 50)}</span>
            </div>
          </div>
          
          {/* Max Price (optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t.maxPrice}</label>
            <input
              type="number"
              placeholder="€ (leer = kein Limit)"
              value={maxPrice || ''}
              onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full p-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          
          {/* Activate Button */}
          <Button
            onClick={handleActivate}
            disabled={isActivating || maxBids > (userBids || 0)}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3"
          >
            {isActivating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Aktiviere...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" /> {t.activate}
              </span>
            )}
          </Button>
          
          {maxBids > (userBids || 0) && (
            <p className="text-xs text-red-500 text-center">
              Nicht genug Gebote. Du hast {userBids || 0} Gebote.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BidBuddyCard;
