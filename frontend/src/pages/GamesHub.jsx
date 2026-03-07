/**
 * BidBlitz Games Kingdom - King.com Style
 * Bunte, verspielte Spieleseite
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const GAMES = [
  { id: 1, name: 'Candy Match', icon: '🍬', color: '#ff6b9d', gradient: 'from-pink-500 to-rose-500', reward: 15, category: 'Match-3', url: '/games/bbz_match3.html', players: '2.4M' },
  { id: 2, name: 'Lucky Spin', icon: '🎡', color: '#ffd93d', gradient: 'from-yellow-400 to-orange-500', reward: 25, category: 'Casino', url: '/games/lucky_spin.html', players: '1.8M' },
  { id: 3, name: 'Fruit Slots', icon: '🍒', color: '#ff4757', gradient: 'from-red-500 to-pink-600', reward: 20, category: 'Casino', url: '/games/slots.html', players: '3.1M' },
  { id: 4, name: 'Memory Magic', icon: '🧠', color: '#5f27cd', gradient: 'from-purple-600 to-indigo-600', reward: 15, category: 'Puzzle', url: '/games/memory.html', players: '1.2M' },
  { id: 5, name: 'Speed Tap', icon: '👆', color: '#00d2d3', gradient: 'from-cyan-400 to-teal-500', reward: 12, category: 'Arcade', url: '/games/speed_tap.html', players: '890K' },
  { id: 6, name: 'Reaction Rush', icon: '⚡', color: '#ffa502', gradient: 'from-amber-400 to-orange-500', reward: 10, category: 'Arcade', url: '/games/reaction.html', players: '1.5M' },
  { id: 7, name: 'Dice Master', icon: '🎲', color: '#1dd1a1', gradient: 'from-emerald-400 to-green-500', reward: 8, category: 'Casino', url: '/games/dice.html', players: '670K' },
  { id: 8, name: 'Puzzle Blocks', icon: '🧩', color: '#54a0ff', gradient: 'from-blue-400 to-indigo-500', reward: 10, category: 'Puzzle', url: '/games/match_game.html', players: '980K' },
  { id: 9, name: 'Treasure Hunt', icon: '💎', color: '#ff9ff3', gradient: 'from-pink-400 to-purple-500', reward: 18, category: 'Adventure', url: '/games/bbz_match3.html', players: '2.1M' },
  { id: 10, name: 'Gold Rush', icon: '💰', color: '#ffd700', gradient: 'from-yellow-400 to-amber-500', reward: 22, category: 'Adventure', url: '/games/slots.html', players: '1.6M' },
  { id: 11, name: 'Dragon Quest', icon: '🐉', color: '#ff6348', gradient: 'from-orange-500 to-red-600', reward: 25, category: 'RPG', url: '/games/bbz_match3.html', players: '750K' },
  { id: 12, name: 'Space Battle', icon: '🚀', color: '#3742fa', gradient: 'from-indigo-500 to-purple-600', reward: 15, category: 'Action', url: '/games/reaction.html', players: '1.1M' },
];

const CATEGORIES = ['Alle', 'Match-3', 'Casino', 'Puzzle', 'Arcade', 'Adventure', 'Action'];

// Floating Candies Animation
const FloatingCandy = ({ emoji, delay, left }) => (
  <div 
    className="absolute text-4xl animate-bounce opacity-20 pointer-events-none"
    style={{ 
      left: `${left}%`, 
      top: `${Math.random() * 30}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${2 + Math.random() * 2}s`
    }}
  >
    {emoji}
  </div>
);

// Game Card Component
const GameCard = ({ game, onPlay }) => (
  <div 
    className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
    onClick={() => onPlay(game)}
  >
    <div 
      className={`relative bg-gradient-to-br ${game.gradient} rounded-3xl p-4 shadow-xl overflow-hidden`}
      style={{ boxShadow: `0 15px 35px ${game.color}40` }}
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Sparkle */}
      <div className="absolute top-2 right-2 text-white/50 group-hover:text-white transition-colors">✨</div>
      
      {/* Icon */}
      <div className="text-center mb-2">
        <span className="text-5xl drop-shadow-lg group-hover:scale-110 inline-block transition-transform duration-300">
          {game.icon}
        </span>
      </div>
      
      {/* Name */}
      <h3 className="text-white font-bold text-center text-sm mb-1 drop-shadow">{game.name}</h3>
      
      {/* Category Badge */}
      <div className="flex justify-center mb-2">
        <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
          {game.category}
        </span>
      </div>
      
      {/* Stats Row */}
      <div className="flex justify-between items-center text-white/80 text-xs">
        <span>🏆 {game.reward}P</span>
        <span>👥 {game.players}</span>
      </div>
      
      {/* Play Button */}
      <div className="mt-3">
        <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-bold text-sm transition-all active:scale-95">
          ▶️ SPIELEN
        </button>
      </div>
    </div>
  </div>
);

export default function GamesHub() {
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [balance, setBalance] = useState(1250);
  const [showGame, setShowGame] = useState(null);
  
  const filteredGames = selectedCategory === 'Alle' 
    ? GAMES 
    : GAMES.filter(g => g.category === selectedCategory);
  
  const playGame = (game) => {
    setShowGame(game);
  };
  
  const closeGame = () => {
    // Add reward
    if (showGame) {
      setBalance(prev => prev + showGame.reward);
    }
    setShowGame(null);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#16082a] to-[#0d0618] text-white pb-24 overflow-hidden">
      
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <FloatingCandy emoji="🍬" delay={0} left={5} />
        <FloatingCandy emoji="🍭" delay={0.5} left={15} />
        <FloatingCandy emoji="⭐" delay={1} left={25} />
        <FloatingCandy emoji="💎" delay={1.5} left={75} />
        <FloatingCandy emoji="🎁" delay={2} left={85} />
        <FloatingCandy emoji="🍩" delay={0.3} left={95} />
      </div>
      
      {/* Header */}
      <div className="relative px-5 pt-6 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              BidBlitz Games
            </h1>
            <p className="text-purple-300/60 text-sm">Spiele & gewinne Coins! 🎮</p>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 rounded-2xl shadow-lg">
            <span className="text-white font-bold">💰 {balance.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Featured Banner */}
        <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-3xl p-5 mb-5 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
          <div className="absolute -top-10 -right-10 text-8xl opacity-30">🎰</div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white mb-1">🔥 Hot Games!</h2>
            <p className="text-white/80 text-sm mb-3">Täglich neue Belohnungen</p>
            <div className="flex gap-2">
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">+50% Bonus</span>
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">12 Spiele</span>
            </div>
          </div>
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-none px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      {/* Games Grid */}
      <div className="px-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGames.map(game => (
            <GameCard key={game.id} game={game} onPlay={playGame} />
          ))}
        </div>
      </div>
      
      {/* Daily Bonus Section */}
      <div className="px-5 mt-6">
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎁</div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-400">Täglicher Bonus</h3>
              <p className="text-sm text-emerald-300/60">Spiele 3 Games für extra Coins!</p>
            </div>
            <div className="bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-sm font-bold">
              0/3
            </div>
          </div>
        </div>
      </div>
      
      {/* Game Modal */}
      {showGame && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-900 to-indigo-900">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{showGame.icon}</span>
              <div>
                <h3 className="font-bold text-white">{showGame.name}</h3>
                <p className="text-purple-300 text-sm">🏆 +{showGame.reward} Coins</p>
              </div>
            </div>
            <button 
              onClick={closeGame}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white font-bold transition-all"
            >
              ✕ Schließen (+{showGame.reward}P)
            </button>
          </div>
          <iframe 
            src={showGame.url} 
            className="flex-1 w-full border-none"
            title={showGame.name}
          />
        </div>
      )}
      
      <BottomNav />
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
