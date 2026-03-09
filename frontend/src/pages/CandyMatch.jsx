/**
 * BidBlitz Candy Match - Echtes Match-3 Spiel
 * Level System mit Coins
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Fruit configuration with colors
const FRUITS = [
  { emoji: '🍊', color: '#f97316' }, // Orange
  { emoji: '🍋', color: '#facc15' }, // Lemon  
  { emoji: '🍇', color: '#a855f7' }, // Grape
  { emoji: '🫐', color: '#3b82f6' }, // Blueberry
  { emoji: '🍎', color: '#ef4444' }, // Apple
  { emoji: '🍐', color: '#22c55e' }, // Pear
];

const GRID_SIZE = 7;
const ROWS = 8;

// Level configuration
const LEVELS = [
  { level: 1, moves: 30, goal: 500, reward: 10, cost: 5 },
  { level: 2, moves: 25, goal: 800, reward: 20, cost: 5 },
  { level: 3, moves: 22, goal: 1200, reward: 35, cost: 10 },
  { level: 4, moves: 20, goal: 1500, reward: 50, cost: 10 },
  { level: 5, moves: 18, goal: 2000, reward: 75, cost: 15 },
  { level: 6, moves: 15, goal: 2500, reward: 100, cost: 20 },
  { level: 7, moves: 12, goal: 3000, reward: 150, cost: 25 },
  { level: 8, moves: 10, goal: 4000, reward: 200, cost: 30 },
];

const createBoard = () => {
  const board = [];
  for (let i = 0; i < ROWS * GRID_SIZE; i++) {
    board.push(Math.floor(Math.random() * FRUITS.length));
  }
  return board;
};

export default function CandyMatch() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(createBoard());
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [level, setLevel] = useState(1);
  const [goal, setGoal] = useState(500);
  const [coins, setCoins] = useState(0);
  const [gameState, setGameState] = useState('menu'); // menu, playing, won, lost
  const [message, setMessage] = useState('');
  
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
  
  const getCurrentLevel = () => LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  
  const startLevel = async () => {
    const levelConfig = getCurrentLevel();
    
    if (coins < levelConfig.cost) {
      setMessage(`❌ Du brauchst ${levelConfig.cost} Coins!`);
      return;
    }
    
    // Deduct coins
    try {
      const res = await axios.post(`${API}/bbz/coins/spend`, {
        user_id: userId,
        amount: levelConfig.cost,
        source: `candy_match_level_${level}`
      });
      setCoins(res.data.new_balance);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Fehler');
      return;
    }
    
    setBoard(createBoard());
    setScore(0);
    setMoves(levelConfig.moves);
    setGoal(levelConfig.goal);
    setGameState('playing');
    setMessage('');
  };
  
  const winLevel = async () => {
    const levelConfig = getCurrentLevel();
    setGameState('won');
    
    // Award coins
    try {
      const res = await axios.post(`${API}/bbz/coins/earn`, {
        user_id: userId,
        amount: levelConfig.reward,
        source: `candy_match_win_level_${level}`
      });
      setCoins(res.data.new_balance);
      setMessage(`🎉 Level ${level} geschafft! +${levelConfig.reward} Coins`);
    } catch {
      setMessage(`🎉 Level ${level} geschafft!`);
    }
  };
  
  const loseLevel = () => {
    setGameState('lost');
    setMessage(`💔 Level ${level} fehlgeschlagen! -${getCurrentLevel().cost} Coins`);
  };
  
  const nextLevel = () => {
    if (level < LEVELS.length) {
      setLevel(prev => prev + 1);
    }
    setGameState('menu');
  };
  
  const retryLevel = () => {
    setGameState('menu');
  };
  
  // Check for matches
  const checkMatches = useCallback((currentBoard) => {
    const matches = new Set();
    
    // Check horizontal matches
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const idx = row * GRID_SIZE + col;
        if (currentBoard[idx] !== -1 &&
            currentBoard[idx] === currentBoard[idx + 1] &&
            currentBoard[idx] === currentBoard[idx + 2]) {
          matches.add(idx);
          matches.add(idx + 1);
          matches.add(idx + 2);
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < ROWS - 2; row++) {
        const idx = row * GRID_SIZE + col;
        if (currentBoard[idx] !== -1 &&
            currentBoard[idx] === currentBoard[idx + GRID_SIZE] &&
            currentBoard[idx] === currentBoard[idx + GRID_SIZE * 2]) {
          matches.add(idx);
          matches.add(idx + GRID_SIZE);
          matches.add(idx + GRID_SIZE * 2);
        }
      }
    }
    
    return matches;
  }, []);
  
  // Process matches and gravity
  const processBoard = useCallback((currentBoard) => {
    let newBoard = [...currentBoard];
    let totalScore = 0;
    let hasMatches = true;
    
    while (hasMatches) {
      const matches = checkMatches(newBoard);
      
      if (matches.size > 0) {
        totalScore += matches.size * 10;
        
        // Remove matches
        matches.forEach(idx => {
          newBoard[idx] = -1;
        });
        
        // Apply gravity
        for (let col = 0; col < GRID_SIZE; col++) {
          let emptyRow = ROWS - 1;
          for (let row = ROWS - 1; row >= 0; row--) {
            const idx = row * GRID_SIZE + col;
            if (newBoard[idx] !== -1) {
              const newIdx = emptyRow * GRID_SIZE + col;
              if (newIdx !== idx) {
                newBoard[newIdx] = newBoard[idx];
                newBoard[idx] = -1;
              }
              emptyRow--;
            }
          }
          
          // Fill empty spots
          for (let row = emptyRow; row >= 0; row--) {
            const idx = row * GRID_SIZE + col;
            newBoard[idx] = Math.floor(Math.random() * FRUITS.length);
          }
        }
      } else {
        hasMatches = false;
      }
    }
    
    return { board: newBoard, score: totalScore };
  }, [checkMatches]);
  
  // Handle cell click
  const handleClick = (idx) => {
    if (gameState !== 'playing' || moves <= 0) return;
    
    if (selected === null) {
      setSelected(idx);
    } else {
      // Check if adjacent
      const row1 = Math.floor(selected / GRID_SIZE);
      const col1 = selected % GRID_SIZE;
      const row2 = Math.floor(idx / GRID_SIZE);
      const col2 = idx % GRID_SIZE;
      
      const isAdjacent = (Math.abs(row1 - row2) === 1 && col1 === col2) ||
                         (Math.abs(col1 - col2) === 1 && row1 === row2);
      
      if (isAdjacent) {
        // Swap
        const newBoard = [...board];
        [newBoard[selected], newBoard[idx]] = [newBoard[idx], newBoard[selected]];
        
        // Check if swap creates match
        const matches = checkMatches(newBoard);
        
        if (matches.size > 0) {
          // Valid move
          const result = processBoard(newBoard);
          setBoard(result.board);
          setScore(prev => {
            const newScore = prev + result.score;
            if (newScore >= goal) {
              setTimeout(() => winLevel(), 500);
            }
            return newScore;
          });
          setMoves(prev => {
            const newMoves = prev - 1;
            if (newMoves <= 0 && score < goal) {
              setTimeout(() => loseLevel(), 500);
            }
            return newMoves;
          });
        } else {
          // Invalid move - swap back (no move consumed)
        }
      }
      
      setSelected(null);
    }
  };
  
  // Check for game over
  useEffect(() => {
    if (gameState === 'playing' && moves <= 0 && score < goal) {
      loseLevel();
    }
  }, [moves, score, goal, gameState]);
  
  const levelConfig = getCurrentLevel();
  
  return (
    <>
      <style>{`
        .candy-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #7c3aed 0%, #ec4899 50%, #1e293b 100%);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 999;
          font-family: Arial, sans-serif;
        }
        
        .candy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: #7c3aed;
          color: white;
        }
        
        .candy-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: bold;
        }
        
        .close-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1e293b;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        }
        
        .candy-container {
          padding: 20px;
          text-align: center;
        }
        
        .candy-title {
          font-size: 36px;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          margin: 0;
        }
        
        .level-badge {
          display: inline-block;
          background: #fbbf24;
          color: #78350f;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: bold;
          margin: 10px 0;
        }
        
        .stats-bar {
          display: flex;
          justify-content: space-around;
          background: rgba(236, 72, 153, 0.5);
          border-radius: 15px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .stat {
          text-align: center;
          color: white;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: bold;
        }
        
        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.8;
        }
        
        .game-board {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
          background: rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 15px;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .candy-cell {
          aspect-ratio: 1;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          cursor: pointer;
          transition: all 0.2s;
          border: 3px solid transparent;
        }
        
        .candy-cell:hover {
          transform: scale(1.05);
        }
        
        .candy-cell.selected {
          border-color: white;
          transform: scale(1.1);
          box-shadow: 0 0 15px rgba(255,255,255,0.5);
        }
        
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1e293b;
          display: flex;
          justify-content: space-around;
          padding: 10px 0;
          border-top: 1px solid #334155;
        }
        
        .nav-item {
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px 15px;
        }
        
        .nav-item.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 10px;
        }
        
        .nav-icon {
          font-size: 24px;
          display: block;
          margin-bottom: 4px;
        }
        
        .footer {
          text-align: center;
          padding: 10px;
          color: white;
          font-size: 14px;
          margin-bottom: 70px;
        }
        
        .menu-card {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
          max-width: 350px;
          margin: 20px auto;
          color: #1e293b;
        }
        
        .menu-title {
          font-size: 28px;
          margin: 0 0 10px 0;
        }
        
        .menu-info {
          font-size: 14px;
          color: #64748b;
          margin: 5px 0;
        }
        
        .menu-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 15px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 15px;
          transition: 0.3s;
        }
        
        .menu-btn.play {
          background: linear-gradient(135deg, #22c55e, #10b981);
          color: white;
        }
        
        .menu-btn.play:hover {
          transform: scale(1.02);
        }
        
        .menu-btn.play:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .menu-btn.back {
          background: #e5e7eb;
          color: #374151;
        }
        
        .coins-badge {
          background: #fbbf24;
          color: #78350f;
          padding: 5px 15px;
          border-radius: 15px;
          font-weight: bold;
          display: inline-block;
          margin: 10px 0;
        }
        
        .result-card {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 30px;
          max-width: 350px;
          margin: 20px auto;
          color: #1e293b;
          text-align: center;
        }
        
        .result-emoji {
          font-size: 60px;
        }
        
        .result-title {
          font-size: 24px;
          margin: 10px 0;
        }
        
        .result-score {
          font-size: 36px;
          font-weight: bold;
          color: #7c3aed;
        }
      `}</style>
      
      <div className="candy-page">
        {/* Header */}
        <header className="candy-header">
          <div className="candy-header-left">
            <span>🍬</span>
            <span>Match</span>
          </div>
          <button className="close-btn" onClick={() => navigate('/games')}>✕</button>
        </header>
        
        <div className="candy-container">
          {/* Menu State */}
          {gameState === 'menu' && (
            <>
              <h1 className="candy-title">🍬 Candy Match</h1>
              <div className="level-badge">⭐ LEVEL {level}</div>
              
              <div className="menu-card">
                <h2 className="menu-title">Level {level}</h2>
                <p className="menu-info">🎯 Ziel: {levelConfig.goal} Punkte</p>
                <p className="menu-info">👆 Züge: {levelConfig.moves}</p>
                <p className="menu-info">🎁 Belohnung: {levelConfig.reward} Coins</p>
                <p className="menu-info">💰 Kosten: {levelConfig.cost} Coins</p>
                
                <div className="coins-badge">💰 {coins} Coins</div>
                
                {coins < levelConfig.cost && (
                  <p style={{color: '#ef4444', fontSize: '14px'}}>
                    ❌ Du brauchst {levelConfig.cost} Coins!
                  </p>
                )}
                
                <button 
                  className="menu-btn play"
                  onClick={startLevel}
                  disabled={coins < levelConfig.cost}
                >
                  🎮 Spielen ({levelConfig.cost} Coins)
                </button>
                
                <button 
                  className="menu-btn back"
                  onClick={() => navigate('/games')}
                >
                  ← Zurück
                </button>
              </div>
            </>
          )}
          
          {/* Playing State */}
          {gameState === 'playing' && (
            <>
              <h1 className="candy-title">🍬 Candy Match</h1>
              <div className="level-badge">⭐ LEVEL {level}</div>
              
              <div className="stats-bar">
                <div className="stat">
                  <div className="stat-value">{score}</div>
                  <div className="stat-label">Score</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{moves}</div>
                  <div className="stat-label">Züge</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{goal}</div>
                  <div className="stat-label">Ziel</div>
                </div>
              </div>
              
              <div className="game-board">
                {board.map((fruitIdx, idx) => (
                  <button
                    key={idx}
                    className={`candy-cell ${selected === idx ? 'selected' : ''}`}
                    style={{ backgroundColor: FRUITS[fruitIdx]?.color || '#ccc' }}
                    onClick={() => handleClick(idx)}
                  >
                    {FRUITS[fruitIdx]?.emoji || '?'}
                  </button>
                ))}
              </div>
            </>
          )}
          
          {/* Won State */}
          {gameState === 'won' && (
            <div className="result-card">
              <div className="result-emoji">🎉</div>
              <h2 className="result-title">Level {level} geschafft!</h2>
              <div className="result-score">{score} Punkte</div>
              <p>+{levelConfig.reward} Coins verdient!</p>
              <div className="coins-badge">💰 {coins} Coins</div>
              
              {level < LEVELS.length ? (
                <button className="menu-btn play" onClick={nextLevel}>
                  ➡️ Level {level + 1}
                </button>
              ) : (
                <button className="menu-btn play" onClick={() => navigate('/games')}>
                  🏆 Alle Level geschafft!
                </button>
              )}
              
              <button className="menu-btn back" onClick={() => navigate('/games')}>
                ← Zurück
              </button>
            </div>
          )}
          
          {/* Lost State */}
          {gameState === 'lost' && (
            <div className="result-card">
              <div className="result-emoji">💔</div>
              <h2 className="result-title">Level fehlgeschlagen</h2>
              <div className="result-score">{score} / {goal}</div>
              <p>-{levelConfig.cost} Coins verloren</p>
              <div className="coins-badge">💰 {coins} Coins</div>
              
              <button 
                className="menu-btn play" 
                onClick={retryLevel}
                disabled={coins < levelConfig.cost}
              >
                🔄 Nochmal ({levelConfig.cost} Coins)
              </button>
              
              <button className="menu-btn back" onClick={() => navigate('/games')}>
                ← Zurück
              </button>
            </div>
          )}
        </div>
        
        <div className="footer">bidblitz.ae</div>
        
        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <button className="nav-item" onClick={() => navigate('/super-home')}>
            <span className="nav-icon">🏠</span>
            Home
          </button>
          <button className="nav-item active">
            <span className="nav-icon">🎮</span>
            Games
          </button>
          <button className="nav-item" onClick={() => navigate('/wallet')}>
            <span className="nav-icon">💳</span>
            Wallet
          </button>
          <button className="nav-item" onClick={() => navigate('/simple')}>
            <span className="nav-icon">💎</span>
            BBZ
          </button>
          <button className="nav-item" onClick={() => navigate('/profile')}>
            <span className="nav-icon">👤</span>
            Profile
          </button>
        </nav>
      </div>
    </>
  );
}
