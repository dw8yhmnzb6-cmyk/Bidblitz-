// Reusable auction components - Extracted from Auctions.js
import { memo, useState, useEffect } from 'react';
import { Clock, Tag, Flame, Star, Users, Shield, ThumbsUp, Check, Trophy, Zap } from 'lucide-react';

// Live Timer Component - Countdown display
export const LiveTimer = memo(({ endTime, isPaused }) => {
  const [display, setDisplay] = useState('--:--:--');
  const [isLow, setIsLow] = useState(false);
  const [isLong, setIsLong] = useState(false);
  
  useEffect(() => {
    if (isPaused) {
      setDisplay('⏸️');
      setIsLow(false);
      setIsLong(false);
      return;
    }
    
    if (!endTime) {
      setDisplay('--:--:--');
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const diff = Math.max(0, end - now);
      
      if (diff === 0) {
        setDisplay('00:00:00');
        setIsLow(true);
        setIsLong(false);
        return;
      }
      
      const days = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const pad = (n) => String(n).padStart(2, '0');
      
      if (days > 0) {
        setDisplay(`${days}T ${pad(h)}:${pad(m)}:${pad(s)}`);
        setIsLong(true);
        setIsLow(false);
      } else if (h > 0) {
        setDisplay(`${pad(h)}:${pad(m)}:${pad(s)}`);
        setIsLong(true);
        setIsLow(false);
      } else {
        setDisplay(`${pad(m)}:${pad(s)}`);
        setIsLong(false);
        setIsLow(m === 0 && s <= 30);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime, isPaused]);
  
  return (
    <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded transition-colors duration-300 ${
      isPaused ? 'bg-indigo-600 text-white' :
      isLow ? 'bg-red-500 text-white animate-pulse' : 
      isLong ? 'bg-green-600 text-white' : 
      'bg-blue-600 text-white'
    }`}>
      {display}
    </span>
  );
});

// Live Price Component
export const LivePrice = memo(({ price, bidderName, t }) => (
  <div>
    <div className="flex items-baseline gap-1">
      <span className="text-xl sm:text-2xl font-bold text-white">€{price?.toFixed(2)}</span>
    </div>
    {bidderName && (
      <p className="text-[10px] text-[#94A3B8] truncate max-w-full">
        {t('auctionCard.highestBidder')}: <span className="text-[#FFD700]">{bidderName}</span>
      </p>
    )}
  </div>
));

// Product Info Component
export const ProductInfo = memo(({ name, retailPrice, imageUrl, discount }) => (
  <div className="flex items-center gap-2 sm:gap-3">
    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
      <img 
        src={imageUrl || '/placeholder.png'} 
        alt={name} 
        className="w-full h-full object-contain"
        loading="lazy"
      />
      {discount > 0 && (
        <div className="absolute top-0 right-0 bg-[#EF4444] text-white text-[8px] px-1 py-0.5 rounded-bl font-bold">
          -{discount}%
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-bold text-xs sm:text-sm truncate">{name}</h3>
      <p className="text-[10px] text-[#94A3B8]">
        UVP: <span className="line-through">€{retailPrice?.toFixed(2)}</span>
      </p>
    </div>
  </div>
));

// Activity Index Component
export const ActivityIndex = memo(({ auctionId, t }) => {
  const activity = Math.floor(Math.random() * 100);
  
  let color = 'bg-green-500';
  let label = t('auctionCard.activityLow') || 'Niedrig';
  
  if (activity > 75) {
    color = 'bg-red-500';
    label = t('auctionCard.activityHigh') || 'Hoch';
  } else if (activity > 40) {
    color = 'bg-yellow-500';
    label = t('auctionCard.activityMedium') || 'Mittel';
  }
  
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <Flame className="w-3 h-3 text-orange-500" />
      <div className="flex items-center gap-1">
        <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-500`}
            style={{ width: `${activity}%` }}
          />
        </div>
        <span className="text-[#94A3B8]">{label}</span>
      </div>
    </div>
  );
});

// Trust Badges Component
export const TrustBadges = memo(({ t }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-2">
        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#10B981]" />
      </div>
      <h3 className="text-white text-xs sm:text-sm font-bold mb-1">{t('trustBadge.secure')}</h3>
      <p className="text-[#94A3B8] text-[10px] sm:text-xs hidden sm:block">{t('trustBadge.secureDesc')}</p>
    </div>
    <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F59E0B]/20 flex items-center justify-center mx-auto mb-2">
        <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B]" />
      </div>
      <h3 className="text-white text-xs sm:text-sm font-bold mb-1">{t('trustBadge.satisfaction')}</h3>
      <p className="text-[#94A3B8] text-[10px] sm:text-xs hidden sm:block">{t('trustBadge.satisfactionDesc')}</p>
    </div>
    <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#06B6D4]/20 flex items-center justify-center mx-auto mb-2">
        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#06B6D4]" />
      </div>
      <h3 className="text-white text-xs sm:text-sm font-bold mb-1">{t('trustBadge.fast')}</h3>
      <p className="text-[#94A3B8] text-[10px] sm:text-xs hidden sm:block">{t('trustBadge.fastDesc')}</p>
    </div>
    <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#7C3AED]/20 flex items-center justify-center mx-auto mb-2">
        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3AED]" />
      </div>
      <h3 className="text-white text-xs sm:text-sm font-bold mb-1">{t('trustBadge.community')}</h3>
      <p className="text-[#94A3B8] text-[10px] sm:text-xs hidden sm:block">{t('trustBadge.communityDesc')}</p>
    </div>
  </div>
));

// Display name for debugging
LiveTimer.displayName = 'LiveTimer';
LivePrice.displayName = 'LivePrice';
ProductInfo.displayName = 'ProductInfo';
ActivityIndex.displayName = 'ActivityIndex';
TrustBadges.displayName = 'TrustBadges';
