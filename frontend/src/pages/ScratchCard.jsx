/**
 * BidBlitz Scratch Card Game
 * Scratch to reveal random coin reward
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function ScratchCard() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(100);
  const [cardValue, setCardValue] = useState('?');
  const [scratched, setScratched] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  
  const userId = localStorage.getItem('userId') || 'guest';

  useEffect(() => {
    fetchCoins();
    
    // Hide main navbar
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
      setCoins(res.data.coins || 100);
    } catch {
      setCoins(100);
    }
  };

  const scratch = async () => {
    if (scratched) {
      // Reset for new card
      setCardValue('?');
      setScratched(false);
      setLastWin(null);
      return;
    }

    // Cost 5 coins to scratch
    if (coins < 5) {
      alert('Nicht genug Coins! (5 Coins benötigt)');
      return;
    }

    // Deduct cost
    try {
      await axios.post(`${API}/bbz/coins/spend`, {
        user_id: userId,
        amount: 5,
        source: 'scratch_card'
      });
    } catch {}

    // Generate random reward (0-100)
    const reward = Math.floor(Math.random() * 100);
    setCardValue(reward);
    setScratched(true);
    setLastWin(reward);

    // Add reward
    try {
      const res = await axios.post(`${API}/bbz/coins/earn`, {
        user_id: userId,
        amount: reward,
        source: 'scratch_card_win'
      });
      setCoins(res.data.new_balance);
    } catch {
      setCoins(prev => prev - 5 + reward);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>BidBlitz Scratch Card</h1>
      
      <p style={styles.coins}>
        Coins: <span style={styles.coinsValue}>{coins}</span>
      </p>

      {/* Scratch Card */}
      <div 
        style={{
          ...styles.card,
          background: scratched ? '#22c55e' : '#1e293b',
        }}
        onClick={scratch}
      >
        <span style={{
          fontSize: scratched ? '50px' : '60px',
          fontWeight: 'bold',
        }}>
          {cardValue}
        </span>
        {scratched && <span style={styles.coinIcon}>🪙</span>}
      </div>

      {/* Win message */}
      {lastWin !== null && (
        <div style={styles.winMessage}>
          🎉 +{lastWin} Coins gewonnen!
        </div>
      )}

      {/* Buttons */}
      <button style={styles.button} onClick={scratch}>
        {scratched ? 'Neue Karte' : 'Scratch (5 Coins)'}
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
  card: {
    width: '200px',
    height: '200px',
    margin: '0 auto',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '60px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  coinIcon: {
    fontSize: '24px',
    marginTop: '5px',
  },
  winMessage: {
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    padding: '12px 20px',
    borderRadius: '10px',
    margin: '20px auto',
    maxWidth: '200px',
    fontWeight: 'bold',
  },
  button: {
    marginTop: '20px',
    padding: '15px 30px',
    background: '#a855f7',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '16px',
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
