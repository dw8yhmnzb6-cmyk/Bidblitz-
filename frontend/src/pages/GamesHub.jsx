/**
 * BidBlitz Games Hub - Minimalistic Dark Theme
 * Play games and earn coins
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gamepad2, Dices, RotateCcw, Gift, Coins, Trophy,
  Sparkles, Target, Puzzle, Crown, ChevronRight
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

// Game Card
const GameCard = ({ icon: Icon, name, description, reward, color, onClick }) => (
  <button
    onClick={onClick}
    className="w-full bg-[#1c213f] rounded-xl p-4 text-left hover:bg-[#252b4d] transition-colors"
  >
    <div className="flex items-center gap-4">
      <div 
        className="p-3 rounded-xl"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-white">{name}</h3>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="text-right">
        <p className="text-green-400 font-bold text-sm">+{reward}</p>
        <p className="text-xs text-slate-500">Coins</p>
      </div>
    </div>
  </button>
);

export default function GamesHub() {
  const [reward, setReward] = useState(null);
  const [playing, setPlaying] = useState(false);
  
  const playQuickGame = () => {
    setPlaying(true);
    setReward(null);
    
    setTimeout(() => {
      const won = Math.floor(Math.random() * 50) + 10;
      setReward(won);
      setPlaying(false);
    }, 1500);
  };
  
  const games = [
    { icon: Dices, name: 'Glücksrad', description: 'Drehe und gewinne', reward: '10-100', color: '#f59e0b' },
    { icon: Puzzle, name: 'Match-3', description: 'Puzzle-Spiel', reward: '5-50', color: '#8b5cf6' },
    { icon: Target, name: 'Schatzsuche', description: 'Finde den Schatz', reward: '20-200', color: '#10b981' },
    { icon: Crown, name: 'Slot Machine', description: 'Jackpot gewinnen', reward: '0-500', color: '#ec4899' },
  ];
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-24">
      {/* Header */}
      <div className="p-5 pt-6">
        <h1 className="text-2xl font-bold mb-1">Games</h1>
        <p className="text-slate-400 text-sm">Spiele und verdiene Coins</p>
      </div>
      
      {/* Quick Play Card */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-r from-[#6c63ff] to-[#8b5cf6] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Gamepad2 className="w-8 h-8" />
            <div>
              <h2 className="font-bold text-lg">Quick Play</h2>
              <p className="text-sm text-white/70">Schnelles Glücksspiel</p>
            </div>
          </div>
          
          <button
            onClick={playQuickGame}
            disabled={playing}
            className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {playing ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                Spielen...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Jetzt spielen
              </>
            )}
          </button>
          
          {reward !== null && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl text-center">
              <Gift className="w-6 h-6 mx-auto mb-1 text-amber-300" />
              <p className="font-bold text-lg">Du hast {reward} Coins gewonnen!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Daily Rewards */}
      <div className="px-5 mb-6">
        <div className="bg-[#1c213f] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold">Tägliche Belohnung</p>
              <p className="text-xs text-slate-400">Hole dir deine Coins</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold text-sm">
            Abholen
          </button>
        </div>
      </div>
      
      {/* Games List */}
      <div className="px-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#6c63ff]" />
          Alle Spiele
        </h2>
        
        <div className="space-y-3">
          {games.map((game, idx) => (
            <GameCard key={idx} {...game} onClick={() => {}} />
          ))}
        </div>
      </div>
      
      {/* Leaderboard Link */}
      <div className="px-5 mt-6">
        <Link 
          to="/leaderboard" 
          className="block bg-[#1c213f] rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <div>
                <p className="font-semibold">Rangliste</p>
                <p className="text-xs text-slate-400">Top Spieler anzeigen</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </Link>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
