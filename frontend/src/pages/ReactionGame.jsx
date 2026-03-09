/**
 * BidBlitz Reaction Game
 * Test your reaction time - faster = more coins
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function ReactionGame() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(100);
  const [gameState, setGameState] = useState('idle'); // idle, waiting, click, result
  const [message, setMessage] = useState('Drücke Start');
  const [reactionTime, setReactionTime] = useState(null);
  const [lastReward, setLastReward] = useState(null);
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const userId = localStorage.getItem('userId') || 'guest';

  useEffect(() => {
    fetchCoins();
    
    // Hide main navbar
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    return () => {
      const header = document.querySelector('header');
      if (header) header.style.display = '';
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchCoins = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 100);
    } catch {
      setCoins(100);
    }
  };

  const startGame = () => {
    setGameState('waiting');
    setMessage('WARTE...');
    setReactionTime(null);
    setLastReward(null);

    // Random delay between 1-4 seconds
    const delay = Math.random() * 3000 + 1000;
    
    timeoutRef.current = setTimeout(() => {
      setGameState('click');
      setMessage('KLICK!');
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleBoxClick = async () => {
    if (gameState === 'waiting') {
      // Too early!
      clearTimeout(timeoutRef.current);
      setGameState('result');
      setMessage('Zu früh! ❌');
      setReactionTime(null);
      return;
    }

    if (gameState === 'click') {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setGameState('result');
      
      // Calculate reward: faster = more coins (max 50, min 5)
      const reward = Math.max(5, 50 - Math.floor(time / 10));
      setLastReward(reward);
      setMessage(`${time} ms`);

      // Add reward
      try {
        const res = await axios.post(`${API}/bbz/coins/earn`, {
          user_id: userId,
          amount: reward,
          source: 'reaction_game'
        });
        setCoins(res.data.new_balance);
      } catch {
        setCoins(prev => prev + reward);
      }
    }
  };

  const getBoxStyle = () => {
    let bgColor = '#1e293b';
    if (gameState === 'click') bgColor = '#22c55e';
    if (gameState === 'result' && reactionTime === null) bgColor = '#ef4444';
    if (gameState === 'result' && reactionTime !== null) bgColor = '#3b82f6';
    
    return {
      ...styles.box,
      background: bgColor,
    };
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>BidBlitz Reaction Game</h1>
      
      <p style={styles.coins}>
        Coins: <span style={styles.coinsValue}>{coins}</span>
      </p>

      {/* Game Box */}
      <div 
        style={getBoxStyle()}
        onClick={handleBoxClick}
      >
        <span style={styles.boxText}>{message}</span>
      </div>

      {/* Result */}
      {lastReward !== null && (
        <div style={styles.result}>
          <div style={styles.reactionLabel}>Reaktionszeit</div>
          <div style={styles.reactionTime}>{reactionTime} ms</div>
          <div style={styles.reward}>+{lastReward} Coins! 🪙</div>
        </div>
      )}

      {/* Start Button */}
      <button 
        style={{
          ...styles.button,
          opacity: gameState === 'waiting' || gameState === 'click' ? 0.5 : 1,
        }}
        onClick={startGame}
        disabled={gameState === 'waiting' || gameState === 'click'}
      >
        {gameState === 'idle' ? 'Start' : 'Nochmal'}
      </button>

      <button style={styles.backButton} onClick={() => navigate('/super-home')}>
        Zurück
      </button>
    </div>
  );
}

const styles = {
  page: {
    margin: 0,
    fontFamily: 'Arial, sans-serif',
    background: '#0f172a',
    color: 'white',
    textAlign: 'center',
    minHeight: '100vh',
    padding: '20px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
  },
  title: {
    padding: '10px',
    margin: 0,
    fontSize: '24px',
  },
  coins: {
    fontSize: '18px',
    margin: '10px 0 20px',
  },
  coinsValue: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  box: {
    width: '200px',
    height: '200px',
    margin: '0 auto',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  boxText: {
    fontSize: '22px',
    fontWeight: 'bold',
  },
  result: {
    marginTop: '20px',
    padding: '15px',
    background: '#1e293b',
    borderRadius: '10px',
    maxWidth: '200px',
    margin: '20px auto',
  },
  reactionLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  reactionTime: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#22c55e',
  },
  reward: {
    marginTop: '10px',
    fontSize: '18px',
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  button: {
    marginTop: '20px',
    padding: '15px 40px',
    background: '#a855f7',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  backButton: {
    marginTop: '15px',
    padding: '12px 25px',
    background: '#374151',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'block',
    margin: '15px auto 0',
  },
};
