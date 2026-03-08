/**
 * BidBlitz Candy Match - Mit Einsatz & Leaderboard
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const EMOJIS = ['🍬', '🍭', '🍫', '🍩', '🍪', '🧁'];
const BET_COST = 5; // Kosten pro Spiel

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
  const [matchCount, setMatchCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
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

  const startGame = async () => {
    if (coins < BET_COST) {
      setMessage(`❌ Nicht genug Coins! Du brauchst ${BET_COST} Coins.`);
      return;
    }

    try {
      // Einsatz abziehen
      const res = await axios.post(`${API}/bbz/coins/spend`, {
        user_id: userId,
        amount: BET_COST,
        source: 'candy_match_bet'
      });
      
      setCoins(res.data.new_balance);
      setBoard(generateBoard());
      setScore(0);
      setMatchCount(0);
      setSelected(null);
      setGameOver(false);
      setGameStarted(true);
      setMessage(`🎮 Spiel gestartet! -${BET_COST} Coins`);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Fehler beim Starten');
    }
  };

  const earnCoins = async (amount, source) => {
    try {
      const res = await axios.post(`${API}/bbz/coins/earn`, {
        user_id: userId,
        amount: amount,
        source: source
      });
      setCoins(res.data.new_balance);
      return res.data.new_balance;
    } catch (error) {
      console.log('Could not save coins');
      return coins + amount;
    }
  };

  const saveToLeaderboard = async (finalScore) => {
    try {
      await axios.post(`${API}/bbz/leaderboard`, {
        user_id: userId,
        name: 'Player',
        score: finalScore,
        game: 'candy_match'
      });
    } catch (error) {
      console.log('Could not save to leaderboard');
    }
  };

  const handleCellClick = (index) => {
    if (!gameStarted || board[index].matched || gameOver) return;

    if (selected === null) {
      setSelected(index);
      const newBoard = [...board];
      newBoard[index].clicked = true;
      setBoard(newBoard);
    } else {
      const newBoard = [...board];
      newBoard[index].clicked = true;
      setBoard(newBoard);

      if (board[selected].emoji === board[index].emoji && selected !== index) {
        // Match gefunden!
        setTimeout(async () => {
          const matchedBoard = [...board];
          matchedBoard[selected].matched = true;
          matchedBoard[index].matched = true;
          matchedBoard[selected].clicked = false;
          matchedBoard[index].clicked = false;
          setBoard(matchedBoard);
          
          const newScore = score + 10;
          const newMatchCount = matchCount + 1;
          setScore(newScore);
          setMatchCount(newMatchCount);
          
          // +3 Coins pro Match
          await earnCoins(3, 'candy_match_match');
          setMessage(`✅ Match! +3 Coins`);
          
          // Prüfe ob Spiel vorbei (alle 18 Paare gefunden)
          if (newMatchCount >= 18) {
            setGameOver(true);
            setGameStarted(false);
            
            // Bonus für Completion
            const bonus = 20;
            await earnCoins(bonus, 'candy_match_win');
            await saveToLeaderboard(newScore);
            setMessage(`🎉 Gewonnen! +${bonus} Bonus Coins!`);
          }
        }, 300);
      } else {
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

  return (
    <>
      <style>{`
        .candy-game {
          background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
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
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
        }
        .candy-message {
          padding: 10px 20px;
          border-radius: 10px;
          margin: 10px 0;
          font-weight: 500;
          background: rgba(124, 58, 237, 0.3);
        }
        .candy-stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 15px 0;
        }
        .candy-stat {
          background: rgba(255,255,255,0.1);
          padding: 10px 20px;
          border-radius: 10px;
        }
        .candy-stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #a855f7;
        }
        .candy-stat-label {
          font-size: 12px;
          color: #94a3b8;
        }
        .candy-board {
          display: grid;
          grid-template-columns: repeat(6, 50px);
          gap: 6px;
          justify-content: center;
          margin: 20px auto;
        }
        .candy-cell {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          background: #1f2937;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }
        .candy-cell:hover:not(.matched) {
          border-color: #7c3aed;
          transform: scale(1.05);
        }
        .candy-cell.clicked {
          background: #7c3aed;
          transform: scale(1.1);
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.5);
        }
        .candy-cell.matched {
          background: #10b981;
          opacity: 0.4;
          cursor: default;
        }
        .candy-start-btn {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white;
          border: none;
          padding: 18px 50px;
          border-radius: 15px;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 20px;
        }
        .candy-start-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 5px 25px rgba(124, 58, 237, 0.5);
        }
        .candy-start-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .game-over-overlay {
          background: rgba(16, 185, 129, 0.2);
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
          border: 2px solid #10b981;
        }
        .game-over-title {
          font-size: 28px;
          font-weight: bold;
          color: #10b981;
        }
      `}</style>
      
      <div className="candy-game" data-testid="candy-match">
        {/* Header */}
        <div className="candy-header">
          <button className="candy-back" onClick={() => navigate('/games')}>←</button>
          <span className="candy-title">🍬 Candy Match</span>
          <div className="candy-coins">💰 {coins}</div>
        </div>

        {/* Message */}
        {message && <div className="candy-message">{message}</div>}

        {/* Stats */}
        <div className="candy-stats">
          <div className="candy-stat">
            <div className="candy-stat-value">{score}</div>
            <div className="candy-stat-label">Score</div>
          </div>
          <div className="candy-stat">
            <div className="candy-stat-value">{matchCount}/18</div>
            <div className="candy-stat-label">Matches</div>
          </div>
        </div>

        {/* Start Button */}
        {!gameStarted && !gameOver && (
          <button 
            className="candy-start-btn" 
            onClick={startGame}
            disabled={coins < BET_COST}
          >
            🎮 Spielen ({BET_COST} Coins)
          </button>
        )}

        {/* Board */}
        {(gameStarted || gameOver) && (
          <div className="candy-board">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                className={`candy-cell ${cell.clicked ? 'clicked' : ''} ${cell.matched ? 'matched' : ''}`}
                disabled={cell.matched || !gameStarted}
              >
                {cell.emoji}
              </button>
            ))}
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-title">🎉 Gewonnen!</div>
            <p>Score: {score} Punkte</p>
            <button className="candy-start-btn" onClick={startGame} disabled={coins < BET_COST}>
              🔄 Nochmal spielen ({BET_COST} Coins)
            </button>
          </div>
        )}
      </div>
    </>
  );
}
