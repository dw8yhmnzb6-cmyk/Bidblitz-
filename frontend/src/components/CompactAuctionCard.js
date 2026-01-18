import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer, Zap } from 'lucide-react';
import { Button } from './ui/button';

// Activity Index Component - colored dots showing auction activity
const ActivityIndex = ({ bids }) => {
  // More bids = more green dots, fewer bids = more red/orange dots
  const getColors = () => {
    if (bids >= 30) return ['#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626'];
    if (bids >= 20) return ['#22c55e', '#22c55e', '#22c55e', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626', '#dc2626'];
    if (bids >= 10) return ['#22c55e', '#22c55e', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#ef4444', '#dc2626', '#dc2626'];
    if (bids >= 5) return ['#22c55e', '#22c55e', '#84cc16', '#eab308', '#f97316', '#f97316', '#ef4444', '#ef4444', '#dc2626', '#dc2626'];
    return ['#22c55e', '#84cc16', '#eab308', '#f97316', '#f97316', '#ef4444', '#ef4444', '#dc2626', '#dc2626', '#dc2626'];
  };

  return (
    <div className="flex items-center gap-0.5">
      {getColors().map((color, i) => (
        <div 
          key={i} 
          className="w-2 h-3 rounded-sm" 
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

export const CompactAuctionCard = ({ auction, onBid, isAuthenticated }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

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

    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      setIsUrgent(newTime.hours === 0 && newTime.minutes < 1);
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [auction.end_time]);

  const product = auction.product || {};
  const isEnded = auction.status === 'ended' || (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0);
  const isScheduled = auction.status === 'scheduled';

  const formatTime = (num) => String(num).padStart(2, '0');
  
  // Generate a "last sold for" price (random between 1-15€)
  const lastSoldPrice = ((auction.id.charCodeAt(0) % 14) + 1 + Math.random()).toFixed(2);

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
      data-testid={`compact-auction-${auction.id}`}
    >
      {/* Header Badge */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 text-center uppercase tracking-wide">
        {isScheduled ? 'DEMNÄCHST' : isEnded ? 'BEENDET' : 'FÜR PROFIS!'}
      </div>

      <div className="p-3">
        {/* Product Name */}
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2 h-10" title={product.name}>
          {product.name?.toUpperCase()}
        </h3>
        
        {/* Retail Price */}
        <p className="text-gray-500 text-xs mb-2">
          Vergleichspreis*: € {product.retail_price?.toFixed(0)},-
        </p>

        <div className="flex gap-2">
          {/* Left side - Price & Bidder */}
          <div className="flex-1">
            {/* Current Price */}
            <p className="text-2xl font-bold text-teal-600 font-mono">
              € {auction.current_price?.toFixed(2).replace('.', ',')}
            </p>
            
            {/* Last Bidder */}
            <p className="text-gray-500 text-xs truncate">
              {auction.last_bidder_name || 'Noch keine Gebote'}
            </p>
            
            {/* Bid Button */}
            <Link to={`/auctions/${auction.id}`}>
              <button 
                className="mt-2 w-full bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-bold py-1.5 px-4 rounded text-sm uppercase shadow-md transition-all"
                disabled={isEnded}
              >
                BIETEN
              </button>
            </Link>
          </div>

          {/* Right side - Image & Timer */}
          <div className="w-24 flex flex-col items-center">
            {/* Timer */}
            <div className={`w-full text-center py-1 px-2 rounded text-white text-xs font-mono font-bold mb-1 ${
              isUrgent ? 'bg-red-500 animate-pulse' : isEnded ? 'bg-gray-500' : 'bg-green-500'
            }`}>
              {isEnded ? 'ENDE' : `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`}
            </div>
            
            {/* Product Image */}
            <img
              src={product.image_url || 'https://via.placeholder.com/100'}
              alt={product.name}
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>

        {/* Activity Index */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-gray-500 text-xs">Aktivitätsindex:</span>
          <ActivityIndex bids={auction.total_bids || 0} />
        </div>
      </div>

      {/* Footer - Last Sold */}
      <div className="bg-gray-100 px-3 py-1.5 text-center">
        <p className="text-gray-600 text-xs">
          Zuletzt versteigert für nur <span className="font-bold text-green-600">€ {lastSoldPrice}</span>
        </p>
      </div>
    </div>
  );
};

export default CompactAuctionCard;
