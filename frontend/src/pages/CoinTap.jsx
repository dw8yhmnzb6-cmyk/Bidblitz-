/**
 * BidBlitz Coin Tap - Klick-Spiel mit Energy System
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const MAX_ENERGY = 100;
const ENERGY_REGEN_RATE = 1; // per second
const COINS_PER_TAP = 1;

export default function CoinTap() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [taps, setTaps] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [scale, setScale] = useState(1);
  const [particles, setParticles] = useState([]);
  const [unsavedCoins, setUnsavedCoins] = useState(0);
  const [message, setMessage] = useState('');

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchCoins();
    
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    // Energy regeneration
    const energyInterval = setInterval(() => {
      setEnergy(prev => Math.min(prev + ENERGY_REGEN_RATE, MAX_ENERGY));
    }, 1000);
    
    return () => {
      clearInterval(energyInterval);
      const header = document.querySelector('header');
      if (header) header.style.display = '';
    };
  }, []);

  // Auto-save coins every 5 seconds if there are unsaved coins
  useEffect(() => {
    if (unsavedCoins > 0) {
      const saveTimeout = setTimeout(async () => {
        await saveCoins(unsavedCoins);
        setUnsavedCoins(0);
      }, 5000);
      return () => clearTimeout(saveTimeout);
    }
  }, [unsavedCoins]);

  const fetchCoins = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 0);
    } catch {
      setCoins(0);
    }
  };

  const saveCoins = async (amount) => {
    if (amount <= 0) return;
    try {
      const res = await axios.post(`${API}/bbz/coins/earn`, {
        user_id: userId,
        amount: amount,
        source: 'coin_tap'
      });
      setMessage(`✅ ${amount} Coins gespeichert!`);
      setTimeout(() => setMessage(''), 2000);
      return res.data.new_balance;
    } catch (error) {
      console.log('Could not save coins');
      return null;
    }
  };

  const handleTap = useCallback((e) => {
    if (energy < 1) {
      setMessage('⚡ Keine Energie! Warte kurz...');
      return;
    }

    // Deduct energy
    setEnergy(prev => Math.max(prev - 1, 0));
    
    // Add coin
    setCoins(prev => prev + COINS_PER_TAP);
    setTaps(prev => prev + 1);
    setUnsavedCoins(prev => prev + COINS_PER_TAP);
    
    // Animation
    setScale(1.15);
    setTimeout(() => setScale(1), 80);
    
    // Particle effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      emoji: ['+1', '💰', '✨', '⭐'][Math.floor(Math.random() * 4)]
    };
    
    setParticles(prev => [...prev, newParticle]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 800);
  }, [energy]);

  const collectAll = async () => {
    if (unsavedCoins > 0) {
      await saveCoins(unsavedCoins);
      setUnsavedCoins(0);
    }
  };

  const energyPercent = (energy / MAX_ENERGY) * 100;

  return (
    <>
      <style>{`
        .tap-game {
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
          overflow: hidden;
          z-index: 999;
        }
        .tap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .tap-back {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .tap-title {
          font-size: 24px;
          font-weight: bold;
        }
        .tap-coins {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
        }
        .tap-message {
          padding: 10px 20px;
          border-radius: 10px;
          margin: 10px auto;
          max-width: 300px;
          background: rgba(124, 58, 237, 0.3);
          font-weight: 500;
          font-size: 14px;
        }
        .tap-stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 20px 0;
        }
        .tap-stat {
          background: rgba(255,255,255,0.1);
          padding: 15px 25px;
          border-radius: 15px;
        }
        .tap-stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #a855f7;
        }
        .tap-stat-label {
          font-size: 12px;
          color: #94a3b8;
        }
        .energy-bar-container {
          max-width: 300px;
          margin: 20px auto;
        }
        .energy-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .energy-bar {
          height: 12px;
          background: #374151;
          border-radius: 6px;
          overflow: hidden;
        }
        .energy-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
          transition: width 0.3s ease;
          border-radius: 6px;
        }
        .tap-area {
          position: relative;
          width: 220px;
          height: 220px;
          margin: 30px auto;
          cursor: pointer;
          user-select: none;
        }
        .tap-coin {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 100px;
          box-shadow: 
            0 10px 40px rgba(251, 191, 36, 0.4),
            inset 0 -5px 20px rgba(0,0,0,0.2),
            inset 0 5px 20px rgba(255,255,255,0.3);
          transition: transform 0.08s ease;
          border: 6px solid #d97706;
        }
        .tap-coin:active {
          transform: scale(0.95);
        }
        .tap-particle {
          position: absolute;
          pointer-events: none;
          font-size: 24px;
          font-weight: bold;
          animation: float-up 0.8s ease-out forwards;
          color: #fbbf24;
          text-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.5); }
        }
        .tap-collect-btn {
          margin-top: 20px;
          padding: 15px 40px;
          font-size: 18px;
          font-weight: bold;
          background: linear-gradient(135deg, #22c55e, #10b981);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tap-collect-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(34, 197, 94, 0.4);
        }
        .tap-collect-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .unsaved-badge {
          background: #ef4444;
          color: white;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 12px;
          margin-left: 5px;
        }
      `}</style>
      
      <div className="tap-game" data-testid="coin-tap">
        {/* Header */}
        <div className="tap-header">
          <button className="tap-back" onClick={() => navigate('/games')}>←</button>
          <span className="tap-title">🪙 Coin Tap</span>
          <div className="tap-coins">
            💰 {coins}
            {unsavedCoins > 0 && <span className="unsaved-badge">+{unsavedCoins}</span>}
          </div>
        </div>

        {/* Message */}
        {message && <div className="tap-message">{message}</div>}

        {/* Stats */}
        <div className="tap-stats">
          <div className="tap-stat">
            <div className="tap-stat-value">{taps}</div>
            <div className="tap-stat-label">Taps</div>
          </div>
          <div className="tap-stat">
            <div className="tap-stat-value">{unsavedCoins}</div>
            <div className="tap-stat-label">Unsaved</div>
          </div>
        </div>

        {/* Energy Bar */}
        <div className="energy-bar-container">
          <div className="energy-bar-label">
            <span>⚡ Energie</span>
            <span>{energy}/{MAX_ENERGY}</span>
          </div>
          <div className="energy-bar">
            <div 
              className="energy-bar-fill" 
              style={{ width: `${energyPercent}%` }}
            />
          </div>
        </div>

        {/* Tap Area */}
        <div 
          className="tap-area" 
          onClick={handleTap}
          style={{ transform: `scale(${scale})` }}
        >
          <div className="tap-coin">🪙</div>
          
          {/* Particles */}
          {particles.map(p => (
            <div 
              key={p.id}
              className="tap-particle"
              style={{ left: p.x, top: p.y }}
            >
              {p.emoji}
            </div>
          ))}
        </div>

        {/* Collect Button */}
        <button 
          className="tap-collect-btn"
          onClick={collectAll}
          disabled={unsavedCoins === 0}
        >
          💾 Coins speichern ({unsavedCoins})
        </button>
      </div>
    </>
  );
}
