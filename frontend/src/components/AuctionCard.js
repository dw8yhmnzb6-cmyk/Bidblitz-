import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer, Users, Zap, Calendar, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../context/LanguageContext';
import { getProductName } from '../utils/productTranslation';
import { useCountdownSound } from './CountdownSound';

export const AuctionCard = ({ auction, onBid, isAuthenticated, enableSound = false }) => {
  const { language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [startTimeLeft, setStartTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  
  // Countdown sound effect
  useCountdownSound(timeLeft.seconds, soundEnabled && isUrgent);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endTime = new Date(auction.end_time);
      const now = new Date();
      const diff = endTime - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    const calculateStartTimeLeft = () => {
      if (!auction.start_time || auction.status !== 'scheduled') {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      const startTime = new Date(auction.start_time);
      const now = new Date();
      const diff = startTime - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      setIsUrgent(newTime.hours === 0 && newTime.minutes === 0 && newTime.seconds <= 10);
      setStartTimeLeft(calculateStartTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    setStartTimeLeft(calculateStartTimeLeft());

    return () => clearInterval(timer);
  }, [auction.end_time, auction.start_time, auction.status]);

  const product = auction.product || {};
  const productName = getProductName(product, language);
  const isEnded = auction.status === 'ended' || (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 && auction.status !== 'scheduled');
  const isScheduled = auction.status === 'scheduled';

  const formatTime = (num) => String(num).padStart(2, '0');

  return (
    <div 
      className={`auction-card group relative ${isUrgent && !isEnded && !isScheduled ? 'glow-urgency' : ''}`}
      data-testid={`auction-card-${auction.id}`}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-[#181824]">
        <img
          src={product.image_url || 'https://via.placeholder.com/400'}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F16] via-transparent to-transparent" />
        
        {/* Status badge */}
        {isEnded ? (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#EF4444]/90 text-white text-xs font-bold uppercase">
            Beendet
          </div>
        ) : isScheduled ? (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#F59E0B]/90 text-white text-xs font-bold uppercase">
            Geplant
          </div>
        ) : (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#10B981]/90 text-white text-xs font-bold uppercase">
            Live
          </div>
        )}

        {/* Retail price */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[#94A3B8] text-xs">
          UVP: €{product.retail_price?.toFixed(2)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <h3 className="font-bold text-lg text-white truncate" title={productName}>
          {productName}
        </h3>

        {/* Timer */}
        <div className={`flex items-center justify-center gap-2 py-3 rounded-lg bg-[#181824] ${isUrgent && !isEnded && !isScheduled ? 'timer-urgent' : ''}`}>
          {isScheduled ? (
            <>
              <Calendar className="w-5 h-5 text-[#F59E0B]" />
              <span className="font-mono text-lg font-bold tracking-wider text-[#F59E0B]">
                {startTimeLeft.days > 0 && `${startTimeLeft.days}T `}
                {formatTime(startTimeLeft.hours)}:{formatTime(startTimeLeft.minutes)}:{formatTime(startTimeLeft.seconds)}
              </span>
            </>
          ) : (
            <>
              <Timer className="w-5 h-5" />
              {isEnded ? (
                <span className="font-mono text-xl font-bold text-[#EF4444]">BEENDET</span>
              ) : (
                <span className="font-mono text-xl font-bold tracking-wider">
                  {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Current Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#94A3B8] text-xs uppercase tracking-wider">
              {isScheduled ? 'Startpreis' : 'Aktueller Preis'}
            </p>
            <p className="text-2xl font-bold text-[#06B6D4] font-mono">
              €{auction.current_price?.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[#94A3B8] text-xs uppercase tracking-wider">Gebote</p>
            <p className="text-lg font-bold text-white flex items-center gap-1">
              <Users className="w-4 h-4" />
              {auction.total_bids}
            </p>
          </div>
        </div>

        {/* Last bidder */}
        {auction.last_bidder_name && !isScheduled && (
          <p className="text-sm text-[#94A3B8] text-center">
            Letzter Bieter: <span className="text-[#A78BFA] font-medium">{auction.last_bidder_name}</span>
          </p>
        )}

        {/* Scheduled start time info */}
        {isScheduled && auction.start_time && (
          <p className="text-sm text-[#F59E0B] text-center">
            Startet: {new Date(auction.start_time).toLocaleString('de-DE', {dateStyle: 'short', timeStyle: 'short'})}
          </p>
        )}

        {/* Winner info */}
        {isEnded && auction.winner_name && (
          <div className="text-center py-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
            <p className="text-[#10B981] font-bold">
              Gewinner: {auction.winner_name}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link to={`/auctions/${auction.id}`} className="flex-1">
            <Button 
              variant="outline" 
              className="w-full border-white/10 text-white hover:bg-white/10"
              data-testid={`view-auction-${auction.id}`}
            >
              Details
            </Button>
          </Link>
          {!isEnded && !isScheduled && (
            <Button 
              onClick={() => onBid && onBid(auction.id)}
              disabled={!isAuthenticated}
              className="flex-1 btn-bid py-2"
              data-testid={`bid-btn-${auction.id}`}
            >
              <Zap className="w-4 h-4 mr-1" />
              Bieten
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
