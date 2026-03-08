/**
 * BidBlitz Game Leaderboard - Rangliste
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function GameLeaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  const userId = localStorage.getItem('userId') || 'guest';

  useEffect(() => {
    fetchLeaderboard();
    fetchCoins();
    
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    return () => {
      const header = document.querySelector('header');
      if (header) header.style.display = '';
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API}/bbz/leaderboard`);
      setLeaderboard(res.data.leaderboard || []);
      
      // Find user rank
      const rank = res.data.leaderboard?.findIndex(p => p.user_id === userId);
      if (rank !== -1) setUserRank(rank + 1);
    } catch {
      // Mock data
      setLeaderboard([
        { user_id: 'player1', coins: 1200 },
        { user_id: 'player2', coins: 900 },
        { user_id: 'player3', coins: 700 },
        { user_id: 'player4', coins: 600 },
        { user_id: 'player5', coins: 450 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoins = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 0);
    } catch {
      setCoins(0);
    }
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return { background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)' };
      case 2: return { background: 'linear-gradient(90deg, #94a3b8 0%, #64748b 100%)' };
      case 3: return { background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)' };
      default: return { background: '#1f2937' };
    }
  };

  return (
    <>
      <style>{`
        .leaderboard {
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
        .lb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .lb-back {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .lb-title {
          font-size: 24px;
          font-weight: bold;
        }
        .lb-coins {
          background: #7c3aed;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 16px;
        }
        .lb-table {
          width: 100%;
          margin-top: 20px;
          border-collapse: separate;
          border-spacing: 0 10px;
        }
        .lb-table th {
          padding: 15px;
          text-align: left;
          color: #9ca3af;
          font-size: 14px;
          font-weight: 500;
        }
        .lb-row {
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .lb-row:hover {
          transform: translateX(5px);
        }
        .lb-row td {
          padding: 15px;
        }
        .lb-row td:first-child {
          border-radius: 12px 0 0 12px;
          font-size: 20px;
          font-weight: bold;
          width: 60px;
          text-align: center;
        }
        .lb-row td:last-child {
          border-radius: 0 12px 12px 0;
          text-align: right;
          font-weight: bold;
          color: #fbbf24;
        }
        .lb-player {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lb-avatar {
          width: 40px;
          height: 40px;
          background: #374151;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .lb-name {
          font-weight: 500;
        }
        .lb-your-rank {
          background: linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%);
          padding: 20px;
          border-radius: 15px;
          margin-top: 30px;
          text-align: center;
        }
        .lb-your-rank-title {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 5px;
        }
        .lb-your-rank-value {
          font-size: 32px;
          font-weight: bold;
        }
        .lb-loading {
          text-align: center;
          padding: 50px;
          color: #9ca3af;
        }
      `}</style>
      
      <div className="leaderboard" data-testid="game-leaderboard">
        {/* Header */}
        <div className="lb-header">
          <button className="lb-back" onClick={() => navigate('/super-home')}>←</button>
          <span className="lb-title">🏆 Leaderboard</span>
          <div className="lb-coins">💰 {coins}</div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="lb-loading">Laden...</div>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th style={{ textAlign: 'right' }}>Coins</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr 
                  key={player.user_id}
                  className="lb-row"
                  style={getRankStyle(index + 1)}
                >
                  <td>{getRankEmoji(index + 1)}</td>
                  <td>
                    <div className="lb-player">
                      <div className="lb-avatar">👤</div>
                      <span className="lb-name">
                        {player.user_id === userId ? 'Du' : player.user_id}
                      </span>
                    </div>
                  </td>
                  <td>{player.coins?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Your Rank */}
        {userRank && (
          <div className="lb-your-rank">
            <div className="lb-your-rank-title">Dein Rang</div>
            <div className="lb-your-rank-value">#{userRank}</div>
          </div>
        )}
      </div>
    </>
  );
}
