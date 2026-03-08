/**
 * BidBlitz Slot Machine - Mit Einsatz & Jackpot
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ITEMS = ['🍒', '🍋', '🍊', '⭐', '💎', '7️⃣'];
const BET_OPTIONS = [5, 10, 25, 50];

export default function SlotMachine() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [slots, setSlots] = useState(['❓', '❓', '❓']);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  const [currentBet, setCurrentBet] = useState(5);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

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

  const spendCoins = async (amount, source) => {
    try {
      const res = await axios.post(`${API}/bbz/coins/spend`, {
        user_id: userId,
        amount: amount,
        source: source
      });
      return { success: true, balance: res.data.new_balance };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Error' };
    }
  };

  const earnCoins = async (amount, source) => {
    try {
      const res = await axios.post(`${API}/bbz/coins/earn`, {
        user_id: userId,
        amount: amount,
        source: source
      });
      return res.data.new_balance;
    } catch (error) {
      return coins + amount;
    }
  };

  const spin = async () => {
    if (spinning) return;
    
    if (coins < currentBet) {
      setMessage(`❌ Nicht genug Coins! Du brauchst ${currentBet} Coins.`);
      return;
    }

    // Einsatz abziehen
    const spendResult = await spendCoins(currentBet, 'slot_machine_bet');
    if (!spendResult.success) {
      setMessage(spendResult.error);
      return;
    }
    
    setCoins(spendResult.balance);
    setSpinning(true);
    setLastWin(null);
    setMessage(`🎰 Spinning... -${currentBet} Coins`);
    
    // Animation
    let spins = 0;
    const spinInterval = setInterval(async () => {
      setSlots([
        ITEMS[Math.floor(Math.random() * ITEMS.length)],
        ITEMS[Math.floor(Math.random() * ITEMS.length)],
        ITEMS[Math.floor(Math.random() * ITEMS.length)]
      ]);
      spins++;
      
      if (spins >= 20) {
        clearInterval(spinInterval);
        
        // Final result with weighted odds
        const rand = Math.random();
        let a, b, c;
        
        if (rand < 0.02) {
          // 2% Jackpot (3x gleich)
          const jackpotSymbol = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          a = b = c = jackpotSymbol;
        } else if (rand < 0.15) {
          // 13% Small win (2x gleich)
          const matchSymbol = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          a = matchSymbol;
          b = matchSymbol;
          c = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          if (c === a) c = ITEMS[(ITEMS.indexOf(c) + 1) % ITEMS.length];
        } else {
          // 85% Loss
          a = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          b = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          c = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          // Ensure no accidental win
          while (a === b && b === c) {
            c = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          }
        }
        
        setSlots([a, b, c]);
        
        let winAmount = 0;
        let winType = '';
        
        if (a === b && b === c) {
          // Jackpot! 10x Einsatz
          winAmount = currentBet * 10;
          winType = a === '💎' ? 'MEGA JACKPOT!' : a === '7️⃣' ? 'SUPER JACKPOT!' : 'JACKPOT!';
        } else if (a === b || b === c || a === c) {
          // Match! 2x Einsatz
          winAmount = currentBet * 2;
          winType = 'Match!';
        }
        
        if (winAmount > 0) {
          const newBalance = await earnCoins(winAmount, `slot_machine_${winType.toLowerCase().replace(/[^a-z]/g, '')}`);
          setCoins(newBalance);
          setLastWin({ amount: winAmount, type: winType });
          setMessage(`🎉 ${winType} +${winAmount} Coins!`);
          
          // Add to history
          setHistory(prev => [{
            slots: [a, b, c],
            bet: currentBet,
            win: winAmount,
            type: winType
          }, ...prev.slice(0, 4)]);
        } else {
          setMessage('Kein Gewinn. Versuche es nochmal!');
          setHistory(prev => [{
            slots: [a, b, c],
            bet: currentBet,
            win: 0,
            type: 'Loss'
          }, ...prev.slice(0, 4)]);
        }
        
        setSpinning(false);
      }
    }, 80);
  };

  return (
    <>
      <style>{`
        .slot-game {
          text-align: center;
          background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
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
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
        }
        .slot-message {
          padding: 10px 20px;
          border-radius: 10px;
          margin: 10px auto;
          max-width: 400px;
          background: rgba(124, 58, 237, 0.3);
          font-weight: 500;
        }
        .slot-machine {
          background: linear-gradient(180deg, #374151 0%, #1f2937 100%);
          border-radius: 25px;
          padding: 25px 20px;
          margin: 20px auto;
          max-width: 340px;
          border: 4px solid #7c3aed;
          box-shadow: 0 15px 50px rgba(124, 58, 237, 0.4);
        }
        .slot-display {
          display: flex;
          justify-content: center;
          gap: 10px;
          background: #111827;
          padding: 20px;
          border-radius: 15px;
          margin-bottom: 20px;
        }
        .slot-reel {
          width: 80px;
          height: 90px;
          background: linear-gradient(180deg, #fff 0%, #e5e7eb 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
          border: 3px solid #374151;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
        }
        .slot-reel.spinning {
          animation: shake 0.08s infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .bet-selector {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 15px;
        }
        .bet-btn {
          padding: 10px 18px;
          border-radius: 10px;
          border: 2px solid #4b5563;
          background: #1f2937;
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bet-btn.active {
          background: #7c3aed;
          border-color: #a855f7;
        }
        .bet-btn:hover {
          border-color: #7c3aed;
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
          box-shadow: 0 5px 25px rgba(124, 58, 237, 0.5);
        }
        .slot-spin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .slot-win {
          background: linear-gradient(135deg, #22c55e, #10b981);
          padding: 20px;
          border-radius: 15px;
          font-size: 24px;
          font-weight: bold;
          margin: 20px auto;
          max-width: 340px;
          animation: pop 0.3s ease;
        }
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .slot-prizes {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 25px;
          flex-wrap: wrap;
        }
        .slot-prize {
          background: rgba(255,255,255,0.1);
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
        .slot-history {
          margin-top: 25px;
          max-width: 340px;
          margin-left: auto;
          margin-right: auto;
        }
        .slot-history-title {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 10px;
        }
        .slot-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.05);
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 5px;
          font-size: 14px;
        }
        .slot-history-slots {
          font-size: 18px;
        }
        .slot-history-win {
          color: #22c55e;
          font-weight: bold;
        }
        .slot-history-loss {
          color: #ef4444;
        }
      `}</style>
      
      <div className="slot-game" data-testid="slot-machine">
        {/* Header */}
        <div className="slot-header">
          <button className="slot-back" onClick={() => navigate('/games')}>←</button>
          <span className="slot-title">🎰 Slot Machine</span>
          <div className="slot-coins">💰 {coins}</div>
        </div>

        {/* Message */}
        {message && <div className="slot-message">{message}</div>}

        {/* Machine */}
        <div className="slot-machine">
          <div className="slot-display">
            {slots.map((slot, i) => (
              <div key={i} className={`slot-reel ${spinning ? 'spinning' : ''}`}>
                {slot}
              </div>
            ))}
          </div>
          
          {/* Bet Selector */}
          <div className="bet-selector">
            {BET_OPTIONS.map(bet => (
              <button
                key={bet}
                className={`bet-btn ${currentBet === bet ? 'active' : ''}`}
                onClick={() => !spinning && setCurrentBet(bet)}
                disabled={spinning}
              >
                {bet}
              </button>
            ))}
          </div>
          
          <button 
            className="slot-spin-btn" 
            onClick={spin}
            disabled={spinning || coins < currentBet}
          >
            {spinning ? '⏳ SPINNING...' : `🎰 SPIN (${currentBet} Coins)`}
          </button>
        </div>

        {/* Win */}
        {lastWin && (
          <div className="slot-win">
            🎉 {lastWin.type} +{lastWin.amount} Coins!
          </div>
        )}

        {/* Prizes */}
        <div className="slot-prizes">
          <div className="slot-prize">
            <div className="slot-prize-icons">🍒🍒🍒</div>
            <div className="slot-prize-value">10x</div>
          </div>
          <div className="slot-prize">
            <div className="slot-prize-icons">💎💎💎</div>
            <div className="slot-prize-value">10x</div>
          </div>
          <div className="slot-prize">
            <div className="slot-prize-icons">🍒🍒🍋</div>
            <div className="slot-prize-value">2x</div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="slot-history">
            <div className="slot-history-title">Letzte Spins</div>
            {history.map((item, i) => (
              <div key={i} className="slot-history-item">
                <span className="slot-history-slots">{item.slots.join(' ')}</span>
                <span className={item.win > 0 ? 'slot-history-win' : 'slot-history-loss'}>
                  {item.win > 0 ? `+${item.win}` : `-${item.bet}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
