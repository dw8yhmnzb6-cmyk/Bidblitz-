/**
 * FlashBonusPromo - Time-limited bonus promotion banner
 * Shows countdown timer for limited-time deposit bonuses
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Gift, ArrowRight, Sparkles } from 'lucide-react';

const translations = {
  de: {
    title: 'Flash Bonus!',
    subtitle: 'Zeitlich begrenzt',
    extraBonus: 'Extra-Bonus auf Einzahlungen',
    minDeposit: 'Ab',
    endsIn: 'Endet in',
    hours: 'Std',
    minutes: 'Min',
    seconds: 'Sek',
    grabNow: 'Jetzt sichern',
    expired: 'Abgelaufen'
  },
  en: {
    title: 'Flash Bonus!',
    subtitle: 'Limited time',
    extraBonus: 'Extra bonus on deposits',
    minDeposit: 'From',
    endsIn: 'Ends in',
    hours: 'hrs',
    minutes: 'min',
    seconds: 'sec',
    grabNow: 'Grab now',
    expired: 'Expired'
  },
  sq: {
    title: 'Bonus Flash!',
    subtitle: 'Kohë e kufizuar',
    extraBonus: 'Bonus shtesë në depozita',
    minDeposit: 'Nga',
    endsIn: 'Përfundon në',
    hours: 'orë',
    minutes: 'min',
    seconds: 'sek',
    grabNow: 'Merr tani',
    expired: 'Skaduar'
  },
  tr: {
    title: 'Flash Bonus!',
    subtitle: 'Sınırlı süre',
    extraBonus: 'Yatırımlarda ekstra bonus',
    minDeposit: 'En az',
    endsIn: 'Bitiş',
    hours: 'sa',
    minutes: 'dk',
    seconds: 'sn',
    grabNow: 'Şimdi al',
    expired: 'Süresi doldu'
  }
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FlashBonusPromo = ({ language = 'de', className = '' }) => {
  const [promo, setPromo] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();
  
  const t = translations[language] || translations.de;

  const fetchPromo = async () => {
    try {
      const res = await fetch(`${API}/referral/active-promotions?language=${language}`);
      if (res.ok) {
        const data = await res.json();
        if (data.promotions && data.promotions.length > 0) {
          setPromo(data.promotions[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromo();
  }, [language]);

  useEffect(() => {
    if (!promo?.valid_until) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(promo.valid_until);
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [promo]);

  if (loading || !promo || expired) return null;

  const handleClick = () => {
    navigate('/pay');
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 p-4 cursor-pointer transform hover:scale-[1.02] transition-all ${className}`}
      onClick={handleClick}
      data-testid="flash-bonus-promo"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine" />
      
      {/* Sparkle decorations */}
      <div className="absolute top-2 right-2">
        <Sparkles className="w-5 h-5 text-white/50 animate-pulse" />
      </div>
      <div className="absolute bottom-2 left-2">
        <Sparkles className="w-4 h-4 text-white/30 animate-pulse" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: Promo Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">
                {promo.badge || '🔥 FLASH'}
              </span>
            </div>
            <p className="text-white font-bold text-lg mt-1">
              +{promo.bonus_percentage}% {t.extraBonus}
            </p>
            <p className="text-white/80 text-sm">
              {t.minDeposit} €{promo.min_deposit}
            </p>
          </div>
        </div>

        {/* Right: Countdown + CTA */}
        <div className="text-right">
          <p className="text-white/70 text-xs mb-1 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            {t.endsIn}
          </p>
          <div className="flex items-center gap-1 justify-end mb-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[40px]">
              <p className="text-white font-bold text-lg">{String(timeLeft.hours).padStart(2, '0')}</p>
              <p className="text-white/60 text-[10px]">{t.hours}</p>
            </div>
            <span className="text-white font-bold">:</span>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[40px]">
              <p className="text-white font-bold text-lg">{String(timeLeft.minutes).padStart(2, '0')}</p>
              <p className="text-white/60 text-[10px]">{t.minutes}</p>
            </div>
            <span className="text-white font-bold">:</span>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[40px]">
              <p className="text-white font-bold text-lg">{String(timeLeft.seconds).padStart(2, '0')}</p>
              <p className="text-white/60 text-[10px]">{t.seconds}</p>
            </div>
          </div>
          <button className="bg-white text-pink-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors inline-flex items-center gap-1">
            {t.grabNow}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default FlashBonusPromo;
