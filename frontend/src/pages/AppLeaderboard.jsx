/**
 * BidBlitz Leaderboard
 * Table-based ranking with coins
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppLeaderboard() {
  const [users, setUsers] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [activeTab, setActiveTab] = useState('coins');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.get(`${API}/app/leaderboard/${activeTab}`, { headers });
      setUsers(res.data.leaderboard || []);
      setMyRank(res.data.my_rank);
    } catch (error) {
      // Sample data
      const sampleData = {
        coins: [
          { name: 'Alex', coins: 12500, level: 15 },
          { name: 'Sara', coins: 9800, level: 12 },
          { name: 'Mark', coins: 7200, level: 10 },
          { name: 'David', coins: 5400, level: 8 },
          { name: 'Lina', coins: 3500, level: 6 },
          { name: 'Tom', coins: 2800, level: 5 },
          { name: 'Lisa', coins: 2100, level: 4 },
          { name: 'Ben', coins: 1500, level: 3 },
          { name: 'Anna', coins: 900, level: 2 },
          { name: 'Max', coins: 500, level: 1 },
        ],
        mining: [
          { name: 'Alex', hashrate: 500, miners: 8 },
          { name: 'Tom', hashrate: 420, miners: 6 },
          { name: 'Sara', hashrate: 350, miners: 5 },
          { name: 'Mark', hashrate: 280, miners: 4 },
          { name: 'David', hashrate: 200, miners: 3 },
        ],
        games: [
          { name: 'Lina', games: 450, wins: 320 },
          { name: 'Alex', games: 380, wins: 250 },
          { name: 'Sara', games: 320, wins: 210 },
          { name: 'Ben', games: 280, wins: 180 },
          { name: 'Tom', games: 200, wins: 130 },
        ]
      };
      setUsers(sampleData[activeTab] || sampleData.coins);
    } finally {
      setLoading(false);
    }
  };
  
  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };
  
  const getRowStyle = (rank) => {
    if (rank === 1) return 'bg-amber-500/10 border-l-4 border-amber-500';
    if (rank === 2) return 'bg-slate-400/10 border-l-4 border-slate-400';
    if (rank === 3) return 'bg-orange-500/10 border-l-4 border-orange-600';
    return '';
  };
  
  const tabs = [
    { id: 'coins', label: '💰 Coins' },
    { id: 'mining', label: '⛏️ Mining' },
    { id: 'games', label: '🎮 Games' },
  ];
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-5">🏆 BidBlitz Leaderboard</h2>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                activeTab === tab.id ? 'bg-[#6c63ff]' : 'bg-[#171a3a]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Table */}
        <div className="bg-[#171a3a] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2b2f60]">
                <th className="p-4 text-left text-[#6c63ff] font-semibold">Rank</th>
                <th className="p-4 text-left text-[#6c63ff] font-semibold">User</th>
                <th className="p-4 text-right text-[#6c63ff] font-semibold">
                  {activeTab === 'coins' && 'Coins'}
                  {activeTab === 'mining' && 'Hashrate'}
                  {activeTab === 'games' && 'Games'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-400">
                    Lädt...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-400">
                    Keine Daten
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr 
                    key={index}
                    className={`border-b border-[#2b2f60] last:border-0 ${getRowStyle(index + 1)}`}
                  >
                    <td className="p-4">
                      <span className={`text-lg ${index < 3 ? 'text-2xl' : 'text-slate-400'}`}>
                        {getRankBadge(index + 1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        {activeTab === 'coins' && (
                          <p className="text-xs text-slate-500">Level {user.level}</p>
                        )}
                        {activeTab === 'mining' && (
                          <p className="text-xs text-slate-500">{user.miners} Miner</p>
                        )}
                        {activeTab === 'games' && (
                          <p className="text-xs text-slate-500">{user.wins} Siege</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-bold ${
                        index === 0 ? 'text-amber-400' : 
                        index === 1 ? 'text-slate-300' : 
                        index === 2 ? 'text-orange-400' : 'text-white'
                      }`}>
                        {activeTab === 'coins' && user.coins?.toLocaleString()}
                        {activeTab === 'mining' && `${user.hashrate} TH`}
                        {activeTab === 'games' && user.games}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* My Rank */}
        {myRank && (
          <div className="mt-4 bg-[#6c63ff]/20 border border-[#6c63ff] p-4 rounded-xl">
            <p className="text-center">
              Dein Rang: <span className="font-bold text-[#6c63ff]">#{myRank}</span>
            </p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
