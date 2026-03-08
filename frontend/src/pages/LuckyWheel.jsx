/**
 * BidBlitz Lucky Wheel - Mit Einsatz
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const REWARDS = [
  { value: 0, label: '💀', color: '#374151' },
  { value: 5, label: '5', color: '#ef4444' },
  { value: 10, label: '10', color: '#f59e0b' },
  { value: 0, label: '💀', color: '#374151' },
  { value: 20, label: '20', color: '#22c55e' },
  { value: 50, label: '50', color: '#3b82f6' },
  { value: 0, label: '💀', color: '#374151' },
  { value: 100, label: '💎', color: '#8b5cf6' },
];

const BET_COST = 10;

export default function LuckyWheel() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastWin, setLastWin] = useState(null);
  const [message, setMessage] = useState('');
  const [spinsToday, setSpinsToday] = useState(0);

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
    
    if (coins < BET_COST) {
      setMessage(`❌ Du brauchst ${BET_COST} Coins!`);
      return;
    }

    // Einsatz abziehen
    const spendResult = await spendCoins(BET_COST, 'lucky_wheel_bet');
    if (!spendResult.success) {
      setMessage(spendResult.error);
      return;
    }
    
    setCoins(spendResult.balance);
    setSpinning(true);
    setLastWin(null);
    setMessage(`🎡 Spinning... -${BET_COST} Coins`);
    
    // Weighted random - more likely to lose or get small wins
    const rand = Math.random();
    let winIndex;
    
    if (rand < 0.35) winIndex = 0;      // 35% - Loss
    else if (rand < 0.55) winIndex = 3; // 20% - Loss
    else if (rand < 0.70) winIndex = 6; // 15% - Loss
    else if (rand < 0.85) winIndex = 1; // 15% - 5 coins
    else if (rand < 0.93) winIndex = 2; // 8% - 10 coins
    else if (rand < 0.97) winIndex = 4; // 4% - 20 coins
    else if (rand < 0.99) winIndex = 5; // 2% - 50 coins
    else winIndex = 7;                   // 1% - 100 coins JACKPOT
    
    const win = REWARDS[winIndex].value;
    
    // Calculate rotation
    const segmentAngle = 360 / REWARDS.length;
    const newRotation = rotation + 1800 + (winIndex * segmentAngle) + (segmentAngle / 2);
    
    setRotation(newRotation);
    
    setTimeout(async () => {
      if (win > 0) {
        const newBalance = await earnCoins(win, 'lucky_wheel_win');
        setCoins(newBalance);
        setLastWin(win);
        setMessage(`🎉 Gewonnen! +${win} Coins!`);
      } else {
        setMessage('💀 Kein Gewinn. Versuche es nochmal!');
      }
      setSpinning(false);
      setSpinsToday(prev => prev + 1);
    }, 3000);
  };

  return (
    <>
      <style>{`
        .wheel-game {
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
          color: white;
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
        .wheel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .wheel-back {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .wheel-title {
          font-size: 24px;
          font-weight: bold;
        }
        .wheel-coins {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
        }
        .wheel-message {
          padding: 10px 20px;
          border-radius: 10px;
          margin: 10px auto;
          max-width: 350px;
          background: rgba(124, 58, 237, 0.3);
          font-weight: 500;
        }
        .wheel-container {
          position: relative;
          width: 280px;
          height: 280px;
          margin: 30px auto;
        }
        .wheel {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          position: relative;
          transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
          box-shadow: 0 0 30px rgba(124, 58, 237, 0.5);
        }
        .wheel-segment {
          position: absolute;
          width: 50%;
          height: 50%;
          top: 0;
          left: 50%;
          transform-origin: 0% 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          clip-path: polygon(0% 100%, 100% 0%, 100% 100%);
        }
        .wheel-segment span {
          transform: rotate(22.5deg) translateX(30px);
          font-size: 20px;
          font-weight: bold;
        }
        .wheel-pointer {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-top: 25px solid #fbbf24;
          z-index: 10;
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
        }
        .wheel-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          z-index: 5;
        }
        .wheel-spin-btn {
          margin-top: 30px;
          padding: 18px 50px;
          font-size: 20px;
          font-weight: bold;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          border-radius: 15px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wheel-spin-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 5px 25px rgba(124, 58, 237, 0.5);
        }
        .wheel-spin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .wheel-win {
          background: linear-gradient(135deg, #22c55e, #10b981);
          padding: 20px 40px;
          border-radius: 15px;
          font-size: 28px;
          font-weight: bold;
          margin: 20px auto;
          display: inline-block;
          animation: pop 0.3s ease;
        }
        @keyframes pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        .wheel-stats {
          margin-top: 20px;
          color: #94a3b8;
          font-size: 14px;
        }
      `}</style>
      
      <div className="wheel-game" data-testid="lucky-wheel">
        {/* Header */}
        <div className="wheel-header">
          <button className="wheel-back" onClick={() => navigate('/games')}>←</button>
          <span className="wheel-title">🎡 Lucky Wheel</span>
          <div className="wheel-coins">💰 {coins}</div>
        </div>

        {/* Message */}
        {message && <div className="wheel-message">{message}</div>}

        {/* Wheel */}
        <div className="wheel-container">
          <div className="wheel-pointer" />
          <div 
            className="wheel"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(${REWARDS.map((r, i) => 
                `${r.color} ${i * 45}deg ${(i + 1) * 45}deg`
              ).join(', ')})`
            }}
          >
            {REWARDS.map((reward, i) => (
              <div 
                key={i}
                className="wheel-segment"
                style={{ 
                  transform: `rotate(${i * 45 + 22.5}deg)`,
                }}
              >
                <span style={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  {reward.label}
                </span>
              </div>
            ))}
          </div>
          <div className="wheel-center">🎡</div>
        </div>

        {/* Win */}
        {lastWin && (
          <div className="wheel-win">
            🎉 +{lastWin} Coins!
          </div>
        )}

        {/* Spin Button */}
        <button 
          className="wheel-spin-btn" 
          onClick={spin}
          disabled={spinning || coins < BET_COST}
        >
          {spinning ? '⏳ Spinning...' : `🎡 Drehen (${BET_COST} Coins)`}
        </button>

        {/* Stats */}
        <div className="wheel-stats">
          Spins heute: {spinsToday}
        </div>
      </div>
    </>
  );
}
