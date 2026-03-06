/**
 * BidBlitz Games Hub - Simple Card Style
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function GamesHub() {
  const [reward, setReward] = useState(null);
  const [playing, setPlaying] = useState(false);
  
  const playGame = async () => {
    setPlaying(true);
    setReward(null);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res = await axios.post(`${API}/app/games/play`, 
        { game_type: 'quick_play' },
        { headers }
      );
      
      setReward(res.data.reward);
    } catch (error) {
      setReward(0);
    } finally {
      setPlaying(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-20">
      <div className="p-5">
        {/* Quick Play */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
          <h2 className="text-xl font-semibold mb-4">Games</h2>
          <button
            onClick={playGame}
            disabled={playing}
            className="px-6 py-2.5 bg-[#6c63ff] hover:bg-[#5a52e0] rounded-lg font-medium disabled:opacity-50"
          >
            {playing ? 'Playing...' : 'Play Game'}
          </button>
          {reward !== null && (
            <p className="mt-4 text-lg text-green-400">
              You won {reward} Coins!
            </p>
          )}
        </div>
        
        {/* Game Links */}
        <div className="card bg-[#1c213f] p-5 rounded-2xl mb-4">
          <h3 className="font-semibold mb-3">All Games</h3>
          <div className="space-y-2">
            <Link to="/match3" className="block py-3 px-4 bg-[#0c0f22] rounded-lg hover:bg-[#6c63ff]/20">
              🧩 Match-3 Puzzle
            </Link>
            <Link to="/spin-wheel" className="block py-3 px-4 bg-[#0c0f22] rounded-lg hover:bg-[#6c63ff]/20">
              🎡 Glücksrad
            </Link>
            <Link to="/games" className="block py-3 px-4 bg-[#0c0f22] rounded-lg hover:bg-[#6c63ff]/20">
              🎰 Slot Machine
            </Link>
            <Link to="/games" className="block py-3 px-4 bg-[#0c0f22] rounded-lg hover:bg-[#6c63ff]/20">
              🗺️ Schatzsuche
            </Link>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
