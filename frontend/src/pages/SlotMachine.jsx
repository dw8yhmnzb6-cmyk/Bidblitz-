/**
 * BidBlitz Slot Machine - Casino Spiel
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ITEMS = ['🍒', '🍋', '🍊', '⭐', '💎'];

export default function SlotMachine() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [slots, setSlots] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  const [totalWins, setTotalWins] = useState(0);

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchCoins();
    
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    return () => {
      const header = document.querySelector('header');
      if (header) header.style.display = '';
    };
  }, []);

  const fetchCoins = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 0);
    } catch {
      setCoins(0);
    }
  };

  const saveCoins = async (amount) => {
    try {
      await axios.post(`${API}/bbz/coins/earn`, {
        user_id: userId,
        amount: amount,
        source: 'slot_machine'
      });
    } catch (error) {
      console.log('Could not save coins');
    }
  };

  const spin = () => {
    if (spinning) return;
    
    setSpinning(true);
    setLastWin(null);
    
    // Animation effect
    let spins = 0;
    const spinInterval = setInterval(() => {
      setSlots([
        ITEMS[Math.floor(Math.random() * ITEMS.length)],
        ITEMS[Math.floor(Math.random() * ITEMS.length)],
        ITEMS[Math.floor(Math.random() * ITEMS.length)]
      ]);
      spins++;
      
      if (spins >= 15) {
        clearInterval(spinInterval);
        
        // Final result
        const a = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        const b = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        const c = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        
        setSlots([a, b, c]);
        
        let win = 0;
        if (a === b && b === c) {
          win = 50; // Jackpot!
        } else if (a === b || b === c || a === c) {
          win = 10; // Match
        }
        
        if (win > 0) {
          setCoins(prev => prev + win);
          setLastWin(win);
          setTotalWins(prev => prev + win);
          saveCoins(win);
        }
        
        setSpinning(false);
      }
    }, 100);
  };

  return (
    <>
      <style>{`
        .slot-game {
          text-align: center;
          background: #0f172a;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          padding: 20px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 999;
        }
        .slot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .slot-back {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .slot-title {
          font-size: 24px;
          font-weight: bold;
        }
        .slot-coins {
          background: #7c3aed;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
        }
        .slot-machine {
          background: linear-gradient(180deg, #374151 0%, #1f2937 100%);
          border-radius: 20px;
          padding: 30px 20px;
          margin: 30px auto;
          max-width: 320px;
          border: 4px solid #7c3aed;
          box-shadow: 0 10px 40px rgba(124, 58, 237, 0.3);
        }
        .slot-display {
          display: flex;
          justify-content: center;
          gap: 15px;
          background: #111827;
          padding: 20px;
          border-radius: 15px;
          margin-bottom: 20px;
        }
        .slot-reel {
          width: 70px;
          height: 80px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
          border: 3px solid #374151;
        }
        .slot-reel.spinning {
          animation: shake 0.1s infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .slot-spin-btn {
          width: 100%;
          padding: 18px;
          font-size: 22px;
          font-weight: bold;
          background: linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .slot-spin-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 5px 20px rgba(124, 58, 237, 0.5);
        }
        .slot-spin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .slot-score {
          font-size: 28px;
          margin: 25px 0;
        }
        .slot-win {
          background: #22c55e;
          padding: 20px;
          border-radius: 15px;
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0;
          animation: pop 0.3s ease;
        }
        @keyframes pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        .slot-prizes {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 25px;
        }
        .slot-prize {
          background: #1f2937;
          padding: 12px 18px;
          border-radius: 10px;
          text-align: center;
        }
        .slot-prize-icons {
          font-size: 20px;
          margin-bottom: 5px;
        }
        .slot-prize-value {
          color: #fbbf24;
          font-weight: bold;
        }
      `}</style>
      
      <div className="slot-game" data-testid="slot-machine">
        {/* Header */}
        <div className="slot-header">
          <button className="slot-back" onClick={() => navigate('/games')}>←</button>
          <span className="slot-title">🎰 Slot Machine</span>
          <div className="slot-coins">💰 {coins}</div>
        </div>

        {/* Machine */}
        <div className="slot-machine">
          <div className="slot-display">
            {slots.map((slot, i) => (
              <div key={i} className={`slot-reel ${spinning ? 'spinning' : ''}`}>
                {slot}
              </div>
            ))}
          </div>
          
          <button 
            className="slot-spin-btn" 
            onClick={spin}
            disabled={spinning}
          >
            {spinning ? '⏳ SPINNING...' : '🎰 SPIN'}
          </button>
        </div>

        {/* Win */}
        {lastWin && (
          <div className="slot-win">
            🎉 +{lastWin} Coins!
            {lastWin === 50 && ' JACKPOT!'}
          </div>
        )}

        {/* Score */}
        <div className="slot-score">
          Coins: <strong>{coins}</strong>
        </div>

        {/* Prizes */}
        <div className="slot-prizes">
          <div className="slot-prize">
            <div className="slot-prize-icons">🍒🍒🍒</div>
            <div className="slot-prize-value">+50</div>
          </div>
          <div className="slot-prize">
            <div className="slot-prize-icons">🍒🍒🍋</div>
            <div className="slot-prize-value">+10</div>
          </div>
        </div>
      </div>
    </>
  );
}
