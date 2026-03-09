/**
 * BidBlitz Puzzle - Match 3 Style Game
 * 8x8 Grid with colored tiles
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];

const COLOR_CLASSES = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
};

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const createBoard = () => {
  return Array(64).fill(null).map(() => randomColor());
};

export default function PuzzleGame() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(createBoard());
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  
  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

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
      setCoins(res.data.coins || 0);
    } catch {
      setCoins(0);
    }
  };

  const handleTileClick = (index) => {
    // Add 5 to score
    setScore(prev => prev + 5);
    
    // Change tile color
    const newBoard = [...board];
    newBoard[index] = randomColor();
    setBoard(newBoard);
  };

  const claimReward = async () => {
    if (score < 50) {
      alert('Mindestens 50 Punkte für Belohnung!');
      return;
    }
    
    const reward = Math.floor(score / 10);
    
    try {
      const res = await axios.post(`${API}/bbz/coins/earn`, {
        user_id: userId,
        amount: reward,
        source: 'puzzle_game'
      });
      setCoins(res.data.new_balance);
    } catch {
      setCoins(prev => prev + reward);
    }
    
    alert(`+${reward} Coins erhalten!`);
    setScore(0);
    setBoard(createBoard());
  };

  return (
    <div style={styles.page} data-testid="puzzle-game">
      {/* Header */}
      <h1 style={styles.title}>BidBlitz Puzzle</h1>
      
      {/* Stats */}
      <div style={styles.stats}>
        <p style={styles.score}>Score: <span style={styles.scoreValue}>{score}</span></p>
        <p style={styles.coins}>Coins: <span style={styles.coinsValue}>{coins}</span></p>
      </div>

      {/* Game Board */}
      <div style={styles.board} data-testid="puzzle-board">
        {board.map((color, index) => (
          <div
            key={index}
            style={{
              ...styles.tile,
              backgroundColor: COLOR_CLASSES[color],
            }}
            onClick={() => handleTileClick(index)}
            data-testid={`tile-${index}`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div style={styles.buttons}>
        <button style={styles.button} onClick={claimReward} data-testid="claim-reward">
          Belohnung ({Math.floor(score / 10)} Coins)
        </button>
        <button style={styles.buttonSecondary} onClick={() => navigate('/super-home')}>
          Zurück
        </button>
      </div>
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
    fontSize: '28px',
    marginBottom: '10px',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginBottom: '20px',
  },
  score: {
    fontSize: '18px',
    margin: 0,
  },
  scoreValue: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  coins: {
    fontSize: '18px',
    margin: 0,
  },
  coinsValue: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  board: {
    width: '320px',
    height: '320px',
    margin: '0 auto 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '4px',
  },
  tile: {
    width: '35px',
    height: '35px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '320px',
    margin: '0 auto',
  },
  button: {
    background: '#a855f7',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  buttonSecondary: {
    background: '#374151',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
  },
};
