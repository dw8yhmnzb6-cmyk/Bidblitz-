/**
 * BidBlitz Games - Simple 5-Game Grid
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GAMES = [
  { name: 'Puzzle Match', route: '/puzzle-game' },
  { name: 'Runner Game', route: '/runner-game' },
  { name: 'Lucky Wheel', route: '/lucky-wheel' },
  { name: 'Scratch Card', route: '/scratch-card' },
  { name: 'Reaction Game', route: '/reaction-game' },
];

export default function GamesLobby() {
  const navigate = useNavigate();

  useEffect(() => {
    // Hide main navbar
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    return () => {
      const header = document.querySelector('header');
      if (header) header.style.display = '';
    };
  }, []);

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        🎮 BidBlitz Games
      </header>

      <div style={styles.container}>
        {/* Games Grid */}
        <div style={styles.grid}>
          {GAMES.map((game, index) => (
            <div
              key={index}
              style={styles.card}
              onClick={() => navigate(game.route)}
              data-testid={`game-${game.name.toLowerCase().replace(' ', '-')}`}
            >
              {game.name}
            </div>
          ))}
        </div>

        {/* Back Button */}
        <button 
          style={styles.backButton}
          onClick={() => navigate('/super-home')}
        >
          ← Zurück
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
    minHeight: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
  },
  header: {
    background: '#020617',
    padding: '20px',
    textAlign: 'center',
    fontSize: '26px',
    fontWeight: 'bold',
  },
  container: {
    padding: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
  },
  card: {
    background: '#1e293b',
    padding: '20px 10px',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  backButton: {
    marginTop: '20px',
    padding: '12px 20px',
    background: '#374151',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
