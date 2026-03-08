/**
 * BidBlitz Reaction Game - Reaktionstest
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function ReactionGame() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, clicked, tooEarly
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(null);

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
        source: 'reaction_game'
      });
    } catch (error) {
      console.log('Could not save coins');
    }
  };

  const startGame = useCallback(() => {
    setGameState('waiting');
    setReactionTime(null);
    
    const delay = Math.random() * 4000 + 2000; // 2-6 seconds
    
    const timeout = setTimeout(() => {
      setGameState('ready');
      setStartTime(Date.now());
    }, delay);
    
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const cleanup = startGame();
    return cleanup;
  }, []);

  const handleClick = () => {
    if (gameState === 'waiting') {
      setGameState('tooEarly');
      setTimeout(startGame, 1500);
    } else if (gameState === 'ready') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState('clicked');
      
      // Calculate reward based on reaction time
      let reward = 0;
      if (time < 200) reward = 50;
      else if (time < 300) reward = 30;
      else if (time < 400) reward = 20;
      else if (time < 500) reward = 10;
      else reward = 5;
      
      setCoins(prev => prev + reward);
      saveCoins(reward);
      
      if (!bestTime || time < bestTime) {
        setBestTime(time);
      }
    }
  };

  const getBoxStyle = () => {
    let bg = '#ef4444'; // red
    if (gameState === 'ready') bg = '#22c55e'; // green
    if (gameState === 'tooEarly') bg = '#f59e0b'; // orange
    if (gameState === 'clicked') bg = '#3b82f6'; // blue
    return bg;
  };

  const getBoxText = () => {
    switch (gameState) {
      case 'waiting': return 'WAIT...';
      case 'ready': return 'CLICK!';
      case 'tooEarly': return 'TOO EARLY!';
      case 'clicked': return `${reactionTime} ms`;
      default: return 'WAIT...';
    }
  };

  return (
    <>
      <style>{`
        .reaction-game {
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
        .reaction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .reaction-back {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .reaction-title {
          font-size: 24px;
          font-weight: bold;
        }
        .reaction-coins {
          background: #7c3aed;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
        }
        .reaction-box {
          width: 220px;
          height: 220px;
          margin: 50px auto;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          transition: all 0.2s ease;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .reaction-box:hover {
          transform: scale(1.02);
        }
        .reaction-box:active {
          transform: scale(0.98);
        }
        .reaction-result {
          font-size: 22px;
          margin: 30px 0;
        }
        .reaction-best {
          font-size: 18px;
          color: #fbbf24;
          margin: 20px 0;
        }
        .reaction-stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 30px;
        }
        .reaction-stat {
          background: #1f2937;
          padding: 15px 25px;
          border-radius: 12px;
          text-align: center;
        }
        .reaction-stat-value {
          font-size: 24px;
          font-weight: bold;
        }
        .reaction-stat-label {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 5px;
        }
        .reaction-restart {
          margin-top: 30px;
          padding: 15px 40px;
          background: #7c3aed;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .reaction-restart:hover {
          background: #6d28d9;
        }
        .reaction-tip {
          margin-top: 30px;
          padding: 15px;
          background: #1f2937;
          border-radius: 10px;
          font-size: 14px;
          color: #9ca3af;
        }
      `}</style>
      
      <div className="reaction-game" data-testid="reaction-game">
        {/* Header */}
        <div className="reaction-header">
          <button className="reaction-back" onClick={() => navigate('/games')}>←</button>
          <span className="reaction-title">⚡ Reaction Game</span>
          <div className="reaction-coins">💰 {coins}</div>
        </div>

        {/* Game Box */}
        <div 
          className="reaction-box"
          style={{ background: getBoxStyle() }}
          onClick={handleClick}
        >
          {getBoxText()}
        </div>

        {/* Result */}
        {gameState === 'clicked' && (
          <div className="reaction-result">
            {reactionTime < 200 && '🏆 INCREDIBLE! +50'}
            {reactionTime >= 200 && reactionTime < 300 && '⚡ FAST! +30'}
            {reactionTime >= 300 && reactionTime < 400 && '👍 GOOD! +20'}
            {reactionTime >= 400 && reactionTime < 500 && '😊 OK! +10'}
            {reactionTime >= 500 && '🐢 SLOW! +5'}
          </div>
        )}

        {/* Best Time */}
        {bestTime && (
          <div className="reaction-best">
            🏆 Best: {bestTime} ms
          </div>
        )}

        {/* Restart */}
        {gameState === 'clicked' && (
          <button className="reaction-restart" onClick={startGame}>
            🔄 Nochmal
          </button>
        )}

        {/* Stats */}
        <div className="reaction-stats">
          <div className="reaction-stat">
            <div className="reaction-stat-value" style={{ color: '#22c55e' }}>&lt;200ms</div>
            <div className="reaction-stat-label">+50 Coins</div>
          </div>
          <div className="reaction-stat">
            <div className="reaction-stat-value" style={{ color: '#3b82f6' }}>&lt;300ms</div>
            <div className="reaction-stat-label">+30 Coins</div>
          </div>
          <div className="reaction-stat">
            <div className="reaction-stat-value" style={{ color: '#f59e0b' }}>&lt;400ms</div>
            <div className="reaction-stat-label">+20 Coins</div>
          </div>
        </div>

        {/* Tip */}
        <div className="reaction-tip">
          💡 Warte bis die Box GRÜN wird, dann klicke so schnell wie möglich!
        </div>
      </div>
    </>
  );
}
