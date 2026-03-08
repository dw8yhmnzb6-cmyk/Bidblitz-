/**
 * BidBlitz Runner - Canvas Runner Game
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function RunnerGame() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  const gameRef = useRef({
    player: { x: 50, y: 150, w: 25, h: 25, jumping: false, vy: 0 },
    coin: { x: 400, y: 150, w: 20, h: 20 },
    obstacle: { x: 600, y: 155, w: 20, h: 20 },
    speed: 4,
    running: true
  });

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
        source: 'runner_game'
      });
    } catch (error) {
      console.log('Could not save coins');
    }
  };

  const jump = useCallback(() => {
    const game = gameRef.current;
    if (!game.player.jumping && game.running) {
      game.player.jumping = true;
      game.player.vy = -12;
    }
  }, []);

  const restartGame = () => {
    const game = gameRef.current;
    game.player = { x: 50, y: 150, w: 25, h: 25, jumping: false, vy: 0 };
    game.coin = { x: 400, y: 150, w: 20, h: 20 };
    game.obstacle = { x: 600, y: 155, w: 20, h: 20 };
    game.speed = 4;
    game.running = true;
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;
    let animationId;
    let localScore = 0;

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    const handleTouch = () => jump();

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('click', handleTouch);

    const draw = () => {
      if (!game.running) {
        if (localScore > highScore) {
          setHighScore(localScore);
        }
        setGameOver(true);
        const earnedCoins = Math.floor(localScore / 2);
        if (earnedCoins > 0) {
          setCoins(prev => prev + earnedCoins);
          saveCoins(earnedCoins);
        }
        return;
      }

      ctx.clearRect(0, 0, 400, 200);

      // Ground
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, 175, 400, 25);

      // Player (cyan block)
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(game.player.x, game.player.y, game.player.w, game.player.h);
      
      // Player eyes
      ctx.fillStyle = 'white';
      ctx.fillRect(game.player.x + 5, game.player.y + 5, 6, 6);
      ctx.fillRect(game.player.x + 14, game.player.y + 5, 6, 6);

      // Coin (gold)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(game.coin.x + 10, game.coin.y + 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.font = '14px Arial';
      ctx.fillText('$', game.coin.x + 5, game.coin.y + 15);

      // Obstacle (red spike)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(game.obstacle.x, game.obstacle.y + 20);
      ctx.lineTo(game.obstacle.x + 10, game.obstacle.y);
      ctx.lineTo(game.obstacle.x + 20, game.obstacle.y + 20);
      ctx.fill();

      // Physics
      if (game.player.jumping) {
        game.player.vy += 0.8; // gravity
        game.player.y += game.player.vy;
        
        if (game.player.y >= 150) {
          game.player.y = 150;
          game.player.jumping = false;
          game.player.vy = 0;
        }
      }

      // Move coin
      game.coin.x -= game.speed;
      if (game.coin.x < -20) {
        game.coin.x = 400 + Math.random() * 200;
        game.coin.y = 100 + Math.random() * 50;
      }

      // Move obstacle
      game.obstacle.x -= game.speed + 1;
      if (game.obstacle.x < -20) {
        game.obstacle.x = 500 + Math.random() * 300;
      }

      // Collision with coin
      if (
        game.player.x < game.coin.x + game.coin.w &&
        game.player.x + game.player.w > game.coin.x &&
        game.player.y < game.coin.y + game.coin.h &&
        game.player.y + game.player.h > game.coin.y
      ) {
        localScore += 10;
        setScore(localScore);
        game.coin.x = 400 + Math.random() * 200;
        game.speed += 0.1; // Speed up
      }

      // Collision with obstacle
      if (
        game.player.x < game.obstacle.x + game.obstacle.w &&
        game.player.x + game.player.w > game.obstacle.x &&
        game.player.y < game.obstacle.y + game.obstacle.h &&
        game.player.y + game.player.h > game.obstacle.y
      ) {
        game.running = false;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('click', handleTouch);
      cancelAnimationFrame(animationId);
    };
  }, [jump, gameOver]);

  return (
    <>
      <style>{`
        .runner-game {
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
        .runner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .runner-back {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .runner-title {
          font-size: 24px;
          font-weight: bold;
        }
        .runner-coins {
          background: #7c3aed;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
        }
        .runner-score {
          font-size: 28px;
          margin: 20px 0;
        }
        .runner-canvas {
          background: #111827;
          border-radius: 15px;
          border: 3px solid #374151;
          margin: 20px auto;
          display: block;
          max-width: 100%;
        }
        .runner-controls {
          margin-top: 20px;
          font-size: 14px;
          color: #9ca3af;
        }
        .runner-gameover {
          background: #ef4444;
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
        }
        .runner-restart {
          margin-top: 20px;
          padding: 15px 40px;
          background: #7c3aed;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
        }
        .runner-restart:hover {
          background: #6d28d9;
        }
        .runner-highscore {
          font-size: 18px;
          color: #fbbf24;
          margin: 15px 0;
        }
      `}</style>
      
      <div className="runner-game" data-testid="runner-game">
        {/* Header */}
        <div className="runner-header">
          <button className="runner-back" onClick={() => navigate('/games')}>←</button>
          <span className="runner-title">🏃 Runner</span>
          <div className="runner-coins">💰 {coins}</div>
        </div>

        {/* Score */}
        <div className="runner-score">
          Score: <strong>{score}</strong>
        </div>

        {/* High Score */}
        {highScore > 0 && (
          <div className="runner-highscore">
            🏆 High Score: {highScore}
          </div>
        )}

        {/* Canvas */}
        <canvas 
          ref={canvasRef}
          className="runner-canvas"
          width={400}
          height={200}
        />

        {/* Game Over */}
        {gameOver && (
          <div className="runner-gameover">
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>GAME OVER!</div>
            <div style={{ marginTop: '10px' }}>
              Score: {score} | +{Math.floor(score / 2)} Coins
            </div>
            <button className="runner-restart" onClick={restartGame}>
              🔄 Nochmal
            </button>
          </div>
        )}

        {/* Controls */}
        {!gameOver && (
          <div className="runner-controls">
            💡 Tippe auf das Spiel oder drücke LEERTASTE zum Springen!<br/>
            Sammle 🪙 Coins und weiche 🔺 Hindernissen aus!
          </div>
        )}
      </div>
    </>
  );
}
