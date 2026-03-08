/**
 * BidBlitz Candy Match - Interaktives Spiel
 * 6x6 Grid mit Süßigkeiten-Emojis
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const EMOJIS = ['🍬', '🍭', '🍫', '🍩', '🍪', '🧁'];

// Generiere ein zufälliges Board
const generateBoard = () => {
  return Array(36).fill(null).map(() => ({
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    clicked: false,
    matched: false
  }));
};

export default function CandyMatch() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(generateBoard());
  const [coins, setCoins] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchCoins();
    
    // Hide the main header
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

  const saveCoins = async (newCoins) => {
    try {
      await axios.post(`${API}/bbz/coins/earn`, {
        user_id: userId,
        amount: newCoins - coins,
        source: 'candy_match'
      });
    } catch (error) {
      console.log('Could not save coins');
    }
  };

  const handleCellClick = (index) => {
    if (board[index].matched || gameOver) return;

    if (selected === null) {
      // Erste Auswahl
      setSelected(index);
      const newBoard = [...board];
      newBoard[index].clicked = true;
      setBoard(newBoard);
    } else {
      // Zweite Auswahl - prüfe Match
      const newBoard = [...board];
      newBoard[index].clicked = true;
      setBoard(newBoard);

      if (board[selected].emoji === board[index].emoji && selected !== index) {
        // Match gefunden!
        setTimeout(() => {
          const matchedBoard = [...board];
          matchedBoard[selected].matched = true;
          matchedBoard[index].matched = true;
          matchedBoard[selected].clicked = false;
          matchedBoard[index].clicked = false;
          setBoard(matchedBoard);
          
          const newScore = score + 10;
          const newCoins = coins + 5;
          setScore(newScore);
          setCoins(newCoins);
          saveCoins(newCoins);
          
          // Prüfe ob Spiel vorbei
          if (matchedBoard.every(cell => cell.matched)) {
            setGameOver(true);
          }
        }, 300);
      } else {
        // Kein Match
        setTimeout(() => {
          const resetBoard = [...board];
          resetBoard[selected].clicked = false;
          resetBoard[index].clicked = false;
          setBoard(resetBoard);
        }, 500);
      }
      setSelected(null);
    }
  };

  const resetGame = () => {
    setBoard(generateBoard());
    setScore(0);
    setSelected(null);
    setGameOver(false);
  };

  return (
    <>
      <style>{`
        .candy-game {
          background: #0f172a;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center;
          min-height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 999;
          padding: 20px;
        }
        .candy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .candy-back {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .candy-title {
          font-size: 24px;
          font-weight: bold;
        }
        .candy-coins {
          background: #7c3aed;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
        }
        .candy-score {
          margin: 20px 0;
          font-size: 22px;
        }
        .candy-board {
          display: grid;
          grid-template-columns: repeat(6, 55px);
          gap: 8px;
          justify-content: center;
          margin-top: 30px;
        }
        .candy-cell {
          width: 55px;
          height: 55px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          background: #1f2937;
          border: none;
          transition: all 0.2s ease;
        }
        .candy-cell:hover {
          background: #374151;
          transform: scale(1.05);
        }
        .candy-cell.clicked {
          background: #7c3aed;
          transform: scale(1.1);
        }
        .candy-cell.matched {
          background: #10b981;
          opacity: 0.5;
        }
        .candy-reset {
          margin-top: 30px;
          background: #7c3aed;
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .candy-reset:hover {
          background: #6d28d9;
          transform: scale(1.05);
        }
        .game-over {
          margin-top: 20px;
          padding: 20px;
          background: #10b981;
          border-radius: 15px;
          font-size: 20px;
          font-weight: bold;
        }
      `}</style>
      
      <div className="candy-game" data-testid="candy-match">
        {/* Header */}
        <div className="candy-header">
          <button className="candy-back" onClick={() => navigate('/games')}>←</button>
          <span className="candy-title">🍬 Candy Match</span>
          <div className="candy-coins">💰 {coins}</div>
        </div>

        {/* Score */}
        <div className="candy-score">
          Score: <strong>{score}</strong>
        </div>

        {/* Board */}
        <div className="candy-board">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              className={`candy-cell ${cell.clicked ? 'clicked' : ''} ${cell.matched ? 'matched' : ''}`}
              disabled={cell.matched}
            >
              {cell.emoji}
            </button>
          ))}
        </div>

        {/* Game Over */}
        {gameOver && (
          <div className="game-over">
            🎉 Gewonnen! +{score} Punkte!
          </div>
        )}

        {/* Reset Button */}
        <button className="candy-reset" onClick={resetGame}>
          🔄 Neues Spiel
        </button>
      </div>
    </>
  );
}
