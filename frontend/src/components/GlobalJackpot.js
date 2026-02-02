import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Gift } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function GlobalJackpot({ className = '' }) {
  const [jackpot, setJackpot] = useState(null);
  const [showIncrease, setShowIncrease] = useState(false);

  useEffect(() => {
    const fetchJackpot = async () => {
      try {
        const res = await fetch(`${API}/api/excitement/global-jackpot`);
        const data = await res.json();
        
        if (jackpot && data.current_amount > jackpot.current_amount) {
          setShowIncrease(true);
          setTimeout(() => setShowIncrease(false), 1000);
        }
        
        setJackpot(data);
      } catch (err) {
        console.error('Jackpot fetch error:', err);
      }
    };

    fetchJackpot();
    const interval = setInterval(fetchJackpot, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!jackpot) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      {/* Compact Jackpot Card */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-xl p-3 shadow-lg border-2 border-yellow-500/50 overflow-hidden">
        {/* Animated Background Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
        
        <div className="relative flex items-center justify-between gap-3">
          {/* Left: Trophy */}
          <motion.div
            animate={{ rotate: [-5, 5, -5], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex-shrink-0"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-600/30 rounded-full flex items-center justify-center">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-900" />
            </div>
          </motion.div>

          {/* Center: Amount */}
          <div className="flex-grow text-center">
            <p className="text-yellow-900/70 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              🏆 Jackpot
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <motion.span
                key={jackpot.current_amount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl sm:text-3xl font-black text-yellow-900"
              >
                {jackpot.current_amount.toLocaleString('de-DE')}
              </motion.span>
              <span className="text-sm sm:text-base font-bold text-yellow-900/80">
                Gebote
              </span>
              
              {/* +1 Animation */}
              <AnimatePresence>
                {showIncrease && (
                  <motion.span
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -15 }}
                    exit={{ opacity: 0 }}
                    className="absolute text-green-700 font-bold text-sm"
                  >
                    +1
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className="text-yellow-900/60 text-[9px] sm:text-[10px]">
              Jedes Gebot = +1 zum Jackpot
            </p>
          </div>

          {/* Right: Value */}
          <div className="flex-shrink-0 text-right">
            <div className="bg-yellow-600/20 rounded-lg px-2 py-1">
              <p className="text-yellow-900/60 text-[8px] sm:text-[9px]">Wert</p>
              <p className="text-yellow-900 font-black text-sm sm:text-base">
                €{(jackpot.current_amount * 0.15).toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Last Winner (if exists) */}
        {jackpot.last_winner && (
          <div className="mt-2 pt-2 border-t border-yellow-600/30 text-center">
            <p className="text-yellow-900/70 text-[9px] sm:text-[10px]">
              🏆 Letzter Gewinner: <strong>{jackpot.last_winner}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Subtle Glow */}
      <div className="absolute inset-0 bg-yellow-400/30 rounded-xl blur-xl -z-10 scale-95" />
    </motion.div>
  );
}

// Add shimmer animation to global CSS if not exists
const style = document.createElement('style');
style.textContent = `
@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(200%) skewX(-12deg); }
}
.animate-shimmer {
  animation: shimmer 3s ease-in-out infinite;
}
`;
if (typeof document !== 'undefined' && !document.querySelector('[data-jackpot-style]')) {
  style.setAttribute('data-jackpot-style', 'true');
  document.head.appendChild(style);
}
