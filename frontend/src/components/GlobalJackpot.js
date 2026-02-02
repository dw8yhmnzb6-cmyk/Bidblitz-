import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, TrendingUp, Crown } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function GlobalJackpot({ className = '' }) {
  const [jackpot, setJackpot] = useState(null);
  const [prevAmount, setPrevAmount] = useState(0);
  const [showIncrease, setShowIncrease] = useState(false);

  useEffect(() => {
    const fetchJackpot = async () => {
      try {
        const res = await fetch(`${API}/api/excitement/global-jackpot`);
        const data = await res.json();
        
        // Check if jackpot increased
        if (jackpot && data.current_amount > jackpot.current_amount) {
          setShowIncrease(true);
          setTimeout(() => setShowIncrease(false), 1000);
        }
        
        setPrevAmount(jackpot?.current_amount || 0);
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Main Jackpot Card */}
      <div className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-[length:200%_100%] animate-gradient rounded-2xl p-6 shadow-2xl border-4 border-[#FFD700]/50">
        {/* Sparkle Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                opacity: 0 
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                delay: i * 0.3 
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-between">
          {/* Left: Trophy Icon */}
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex-shrink-0"
          >
            <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-black" />
            </div>
          </motion.div>

          {/* Center: Jackpot Amount */}
          <div className="flex-grow text-center mx-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-black" />
              <span className="text-black font-bold text-sm uppercase tracking-wider">
                GLOBALER JACKPOT
              </span>
              <Crown className="w-5 h-5 text-black" />
            </div>
            
            <motion.div
              key={jackpot.current_amount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <span className="text-5xl md:text-6xl font-black text-black drop-shadow-lg">
                {jackpot.current_amount.toLocaleString('de-DE')}
              </span>
              <span className="text-2xl md:text-3xl font-bold text-black ml-2">
                GEBOTE
              </span>
              
              {/* Increase Animation */}
              <AnimatePresence>
                {showIncrease && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -30 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="absolute -top-4 right-0 text-green-800 font-bold text-xl"
                  >
                    +1
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <p className="text-black/70 text-sm mt-2">
              Jedes Gebot erhöht den Jackpot um +1
            </p>
          </div>

          {/* Right: Stats */}
          <div className="flex-shrink-0 text-right">
            <div className="bg-black/20 rounded-xl p-3">
              <div className="flex items-center gap-1 text-black/80 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>Wert</span>
              </div>
              <p className="text-black font-black text-xl">
                €{(jackpot.current_amount * 0.15).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Last Winner */}
        {jackpot.last_winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-4 border-t border-black/20"
          >
            <div className="flex items-center justify-center gap-2 text-black/80 text-sm">
              <Trophy className="w-4 h-4" />
              <span>
                Letzter Gewinner: <strong>{jackpot.last_winner}</strong> - {jackpot.last_won_amount} Gebote
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Pulsing Glow Effect */}
      <motion.div
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.02, 1]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-2xl blur-xl -z-10"
      />
    </motion.div>
  );
}

// CSS for gradient animation
const style = document.createElement('style');
style.textContent = `
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-gradient {
  animation: gradient 3s ease infinite;
}
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}
