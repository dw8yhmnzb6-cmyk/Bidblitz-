/**
 * BidBlitz Game Center
 * 2x2 Grid with Lucky Wheel, Slot Machine, Reaction Game, Daily Bonus
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function GamesHub() {
  const [coins, setCoins] = useState(500);
  const [wheelResult, setWheelResult] = useState('');
  const [slotResult, setSlotResult] = useState('');
  const [reactionResult, setReactionResult] = useState('');
  const [dailyResult, setDailyResult] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  
  useEffect(() => {
    fetchCoins();
  }, []);
  
  const fetchCoins = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/wallet/balance`, { headers });
      setCoins(res.data.coins || 0);
    } catch (error) {
      console.log('Coins error');
    }
  };
  
  const saveGameResult = async (gameType, reward) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/games/play`, 
        { game_type: gameType },
        { headers }
      );
      return res.data.new_balance;
    } catch (error) {
      return coins + reward;
    }
  };
  
  const wheel = async () => {
    setSpinning(true);
    setWheelResult('');
    
    // Simulate spin animation
    await new Promise(r => setTimeout(r, 1500));
    
    const win = Math.floor(Math.random() * 100);
    const newBalance = await saveGameResult('lucky_wheel', win);
    
    setWheelResult(`You won ${win} coins`);
    setCoins(newBalance);
    setSpinning(false);
  };
  
  const slot = async () => {
    setPlaying(true);
    setSlotResult('');
    
    // Simulate slot animation
    await new Promise(r => setTimeout(r, 1000));
    
    const win = Math.floor(Math.random() * 200) - 50;
    const newBalance = await saveGameResult('slot_machine', Math.max(0, win));
    
    setSlotResult(`Result ${win > 0 ? '+' : ''}${win} coins`);
    setCoins(newBalance);
    setPlaying(false);
  };
  
  const reaction = async () => {
    setReacting(true);
    setReactionResult('');
    
    // Quick reaction game
    await new Promise(r => setTimeout(r, 300));
    
    const win = Math.floor(Math.random() * 20);
    const newBalance = await saveGameResult('reaction_game', win);
    
    setReactionResult(`+ ${win} coins`);
    setCoins(newBalance);
    setReacting(false);
  };
  
  const daily = async () => {
    setClaiming(true);
    setDailyResult('');
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/daily-reward/claim`, {}, { headers });
      
      setDailyResult(`Daily reward ${res.data.coins}`);
      setCoins(res.data.new_balance);
    } catch (error) {
      setDailyResult(error.response?.data?.detail || 'Already claimed today');
    } finally {
      setClaiming(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-2">BidBlitz Game Center</h2>
        <h3 className="text-lg mb-6">
          Coins: <span className="font-bold text-amber-400" data-testid="coins-display">{coins.toLocaleString()}</span>
        </h3>
        
        {/* 2x2 Games Grid */}
        <div className="grid grid-cols-2 gap-5 mb-6" data-testid="games-grid">
          
          {/* Lucky Wheel */}
          <div className="bg-[#171a3a] p-5 rounded-2xl text-center" data-testid="game-wheel">
            <h3 className="font-semibold mb-4">🎡 Lucky Wheel</h3>
            <button
              onClick={wheel}
              disabled={spinning}
              className="px-5 py-2.5 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-medium 
                         disabled:opacity-50 transition-colors"
              data-testid="wheel-btn"
            >
              {spinning ? '...' : 'Spin'}
            </button>
            {wheelResult && (
              <p className="mt-3 text-sm text-green-400" data-testid="wheel-result">{wheelResult}</p>
            )}
          </div>
          
          {/* Slot Machine */}
          <div className="bg-[#171a3a] p-5 rounded-2xl text-center" data-testid="game-slot">
            <h3 className="font-semibold mb-4">🎰 Slot Machine</h3>
            <button
              onClick={slot}
              disabled={playing}
              className="px-5 py-2.5 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-medium 
                         disabled:opacity-50 transition-colors"
              data-testid="slot-btn"
            >
              {playing ? '...' : 'Play'}
            </button>
            {slotResult && (
              <p className={`mt-3 text-sm ${slotResult.includes('-') ? 'text-red-400' : 'text-green-400'}`} 
                 data-testid="slot-result">
                {slotResult}
              </p>
            )}
          </div>
          
          {/* Reaction Game */}
          <div className="bg-[#171a3a] p-5 rounded-2xl text-center" data-testid="game-reaction">
            <h3 className="font-semibold mb-4">⚡ Reaction Game</h3>
            <button
              onClick={reaction}
              disabled={reacting}
              className="px-5 py-2.5 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-medium 
                         disabled:opacity-50 transition-colors"
              data-testid="reaction-btn"
            >
              {reacting ? '...' : 'Tap'}
            </button>
            {reactionResult && (
              <p className="mt-3 text-sm text-green-400" data-testid="reaction-result">{reactionResult}</p>
            )}
          </div>
          
          {/* Daily Bonus */}
          <div className="bg-[#171a3a] p-5 rounded-2xl text-center" data-testid="game-daily">
            <h3 className="font-semibold mb-4">🎁 Daily Bonus</h3>
            <button
              onClick={daily}
              disabled={claiming}
              className="px-5 py-2.5 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-medium 
                         disabled:opacity-50 transition-colors"
              data-testid="daily-btn"
            >
              {claiming ? '...' : 'Claim'}
            </button>
            {dailyResult && (
              <p className={`mt-3 text-sm ${dailyResult.includes('reward') ? 'text-green-400' : 'text-amber-400'}`}
                 data-testid="daily-result">
                {dailyResult}
              </p>
            )}
          </div>
        </div>
        
        {/* More Games Links */}
        <div className="bg-[#171a3a] p-5 rounded-2xl">
          <h3 className="font-semibold mb-3">More Games</h3>
          <div className="space-y-2">
            <Link 
              to="/match3" 
              className="block py-3 px-4 bg-[#0b0e24] rounded-xl hover:bg-[#6c63ff]/20 transition-colors"
              data-testid="link-match3"
            >
              🧩 Match Game
            </Link>
            <Link 
              to="/spin-wheel" 
              className="block py-3 px-4 bg-[#0b0e24] rounded-xl hover:bg-[#6c63ff]/20 transition-colors"
              data-testid="link-spinwheel"
            >
              🎡 Spin Wheel
            </Link>
            <Link 
              to="/treasure-hunt" 
              className="block py-3 px-4 bg-[#0b0e24] rounded-xl hover:bg-[#6c63ff]/20 transition-colors"
              data-testid="link-treasure"
            >
              🗺️ Schatzsuche
            </Link>
          </div>
        </div>
        
        {/* Leaderboard Link */}
        <Link 
          to="/app-leaderboard"
          className="block mt-4 py-3 px-4 bg-[#171a3a] rounded-xl hover:bg-[#252b4d] transition-colors text-center"
          data-testid="link-leaderboard"
        >
          🏆 Rangliste anzeigen
        </Link>
      </div>
      
      <BottomNav />
    </div>
  );
}
