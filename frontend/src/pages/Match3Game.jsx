/**
 * BidBlitz Match Game - With Combo Multipliers & Gravity
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const COLORS = [
  { name: 'red', bg: '#ff4d4d' },
  { name: 'blue', bg: '#4da6ff' },
  { name: 'green', bg: '#4dff88' },
  { name: 'yellow', bg: '#ffd24d' },
  { name: 'purple', bg: '#b84dff' },
];

const GRID_SIZE = 6;

export default function Match3Game() {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [lastMatch, setLastMatch] = useState(0);
  
  useEffect(() => {
    createBoard();
  }, []);
  
  const createBoard = () => {
    const newBoard = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const rowData = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        rowData.push({
          id: `${row}-${col}`,
          color: color.name,
          bg: color.bg,
          visible: true
        });
      }
      newBoard.push(rowData);
    }
    setBoard(newBoard);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setMessage('');
    setLastMatch(Date.now());
  };
  
  const handleTileClick = (row, col) => {
    if (!board[row][col].visible || gameOver) return;
    
    const clickedColor = board[row][col].color;
    const toRemove = findConnected(row, col, clickedColor);
    
    if (toRemove.size >= 3) {
      let newBoard = board.map(r => r.map(t => ({ ...t })));
      toRemove.forEach(pos => {
        const [r, c] = pos.split(',').map(Number);
        newBoard[r][c].visible = false;
      });
      
      // Check combo timing (within 3 seconds)
      const now = Date.now();
      const timeSinceLastMatch = now - lastMatch;
      
      let newCombo = 0;
      if (timeSinceLastMatch < 3000) {
        newCombo = combo + 1;
      } else {
        newCombo = 1;
      }
      
      // Calculate score with multiplier
      const multiplier = Math.min(newCombo, 5); // Max x5
      const basePoints = toRemove.size * 10;
      const points = basePoints * multiplier;
      
      setCombo(newCombo);
      setMaxCombo(Math.max(maxCombo, newCombo));
      setLastMatch(now);
      setScore(prev => prev + points);
      
      // Show combo message
      if (newCombo >= 2) {
        setMessage(`🔥 COMBO x${multiplier}! +${points}`);
        setTimeout(() => setMessage(''), 1500);
      }
      
      // Apply gravity
      setTimeout(() => {
        newBoard = applyGravity(newBoard);
        setBoard(newBoard);
        
        const hasValidMoves = checkValidMoves(newBoard);
        if (!hasValidMoves) {
          endGame();
        }
      }, 200);
      
      setBoard(newBoard);
    }
  };
  
  const findConnected = (startRow, startCol, color) => {
    const connected = new Set();
    const queue = [[startRow, startCol]];
    
    while (queue.length > 0) {
      const [row, col] = queue.shift();
      const key = `${row},${col}`;
      
      if (connected.has(key)) continue;
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) continue;
      if (!board[row][col].visible || board[row][col].color !== color) continue;
      
      connected.add(key);
      queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
    }
    
    return connected;
  };
  
  const applyGravity = (currentBoard) => {
    const newBoard = currentBoard.map(r => r.map(t => ({ ...t })));
    
    for (let col = 0; col < GRID_SIZE; col++) {
      const visibleTiles = [];
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newBoard[row][col].visible) {
          visibleTiles.push({ ...newBoard[row][col] });
        }
      }
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const tileIndex = GRID_SIZE - 1 - row;
        if (tileIndex < visibleTiles.length) {
          newBoard[row][col] = { ...visibleTiles[tileIndex], id: `${row}-${col}` };
        } else {
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          newBoard[row][col] = { id: `${row}-${col}`, color: color.name, bg: color.bg, visible: true };
        }
      }
    }
    
    return newBoard;
  };
  
  const checkValidMoves = (currentBoard) => {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (currentBoard[row][col].visible) {
          const connected = new Set();
          const queue = [[row, col]];
          const color = currentBoard[row][col].color;
          
          while (queue.length > 0) {
            const [r, c] = queue.shift();
            const key = `${r},${c}`;
            if (connected.has(key)) continue;
            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
            if (!currentBoard[r][c].visible || currentBoard[r][c].color !== color) continue;
            connected.add(key);
            queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
          }
          
          if (connected.size >= 3) return true;
        }
      }
    }
    return false;
  };
  
  const endGame = async () => {
    setGameOver(true);
    
    if (score > 0) {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.post(`${API}/app/games/play`, 
          { game_type: 'match_game', score },
          { headers }
        );
        setMessage(`Game Over! +${res.data.reward} Coins | Max Combo: x${maxCombo}`);
      } catch (error) {
        setMessage(`Game Over! Max Combo: x${maxCombo}`);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-20">
      <div className="p-5 text-center">
        <h2 className="text-2xl font-bold mb-2">BidBlitz Match Game</h2>
        
        {/* Stats Bar */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="bg-[#1c213f] px-4 py-2 rounded-lg">
            <span className="text-slate-400 text-sm">Score</span>
            <p className="font-bold text-[#6c63ff]">{score}</p>
          </div>
          <div className="bg-[#1c213f] px-4 py-2 rounded-lg">
            <span className="text-slate-400 text-sm">Combo</span>
            <p className={`font-bold ${combo >= 2 ? 'text-amber-400' : 'text-white'}`}>
              x{Math.min(combo, 5)}
            </p>
          </div>
          <div className="bg-[#1c213f] px-4 py-2 rounded-lg">
            <span className="text-slate-400 text-sm">Best</span>
            <p className="font-bold text-green-400">x{maxCombo}</p>
          </div>
        </div>
        
        {/* Combo Message */}
        {message && !gameOver && (
          <div className="mb-4 py-2 px-4 bg-amber-500/20 rounded-lg text-amber-400 font-bold animate-pulse">
            {message}
          </div>
        )}
        
        {/* Game Board */}
        <div className="mx-auto mb-4 bg-[#1c213f] p-3 rounded-xl inline-block">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {row.map((tile, colIndex) => (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(rowIndex, colIndex)}
                  className="w-12 h-12 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: tile.visible ? tile.bg : '#0c0f22',
                    opacity: tile.visible ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Game Over Message */}
        {gameOver && message && (
          <p className="text-lg text-green-400 mb-4">{message}</p>
        )}
        
        {/* Buttons */}
        <div className="flex justify-center gap-3">
          <button onClick={createBoard} className="px-6 py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium">
            New Game
          </button>
          <Link to="/games" className="px-6 py-2.5 bg-[#1c213f] hover:bg-[#252b4d] rounded-lg font-medium">
            Back
          </Link>
        </div>
        
        {/* Instructions */}
        <div className="mt-4 text-sm text-slate-400">
          <p>Match within 3 seconds for combo multiplier!</p>
          <p className="text-xs mt-1">x2 → x3 → x4 → x5 (max)</p>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
