/**
 * BidBlitz Ride & Pay - Mit Coins bezahlen
 * Connected to Game Economy API
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const RIDE_OPTIONS = [
  { 
    id: 'bike', 
    name: 'E-Bike', 
    icon: '🚲', 
    price: 10, 
    time: '15 min',
    description: 'Umweltfreundlich durch die Stadt',
    gradient: 'from-green-500 to-emerald-600'
  },
  { 
    id: 'scooter', 
    name: 'E-Scooter', 
    icon: '🛴', 
    price: 20, 
    time: '10 min',
    description: 'Schnell und wendig',
    gradient: 'from-blue-500 to-cyan-600'
  },
  { 
    id: 'taxi', 
    name: 'Taxi', 
    icon: '🚕', 
    price: 50, 
    time: '8 min',
    description: 'Bequem und direkt',
    gradient: 'from-yellow-500 to-amber-600'
  },
  { 
    id: 'premium_taxi', 
    name: 'Premium', 
    icon: '🚙', 
    price: 100, 
    time: '5 min',
    description: 'Luxus-Fahrt mit Extras',
    gradient: 'from-purple-500 to-violet-600'
  },
];

export default function RidePay() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    fetchUserData();
    fetchRideHistory();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(res.data.coins || 0);
    } catch (error) {
      console.log('Using default coins');
    }
  };

  const fetchRideHistory = async () => {
    try {
      const res = await axios.get(`${API}/bbz/rides/history/${userId}`);
      setRideHistory(res.data.rides || []);
    } catch (error) {
      console.log('No ride history');
    }
  };

  const selectRide = (ride) => {
    setSelectedRide(ride);
    setShowConfirm(true);
  };

  const confirmRide = async () => {
    if (!selectedRide) return;
    
    if (coins < selectedRide.price) {
      setMessage({ type: 'error', text: `Nicht genug Coins! Du brauchst ${selectedRide.price} 🪙` });
      setShowConfirm(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/bbz/rides/pay`, {
        user_id: userId,
        ride_type: selectedRide.id
      });

      if (res.data.success) {
        setCoins(res.data.new_balance);
        setMessage({ 
          type: 'success', 
          text: `${selectedRide.icon} ${selectedRide.name} gebucht! -${selectedRide.price} 🪙` 
        });
        fetchRideHistory();
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Buchung fehlgeschlagen' 
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setSelectedRide(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ background: '#0f172a' }}>
      
      {/* Header */}
      <header className="p-5 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">🚕 Ride & Pay</h1>
          </div>
          <div className="bg-yellow-500/20 px-4 py-2 rounded-full flex items-center gap-2">
            <span>🪙</span>
            <span className="font-bold text-yellow-400">{coins.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="p-5">
        
        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-xl text-center ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <h3 className="font-semibold">Mit Coins bezahlen</h3>
              <p className="text-sm text-white/70">Verdiene Coins in Spielen, bezahle hier!</p>
            </div>
          </div>
        </div>

        {/* Ride Options */}
        <h2 className="text-lg font-semibold mb-3">🚗 Wähle deine Fahrt</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {RIDE_OPTIONS.map(ride => {
            const canAfford = coins >= ride.price;
            return (
              <div
                key={ride.id}
                onClick={() => canAfford && selectRide(ride)}
                className={`bg-gradient-to-br ${ride.gradient} rounded-xl p-4 cursor-pointer transition-all ${
                  canAfford 
                    ? 'hover:scale-105 active:scale-95' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-4xl mb-2">{ride.icon}</div>
                <h3 className="font-bold text-lg">{ride.name}</h3>
                <p className="text-xs text-white/70 mb-2">{ride.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">⏱ {ride.time}</span>
                  <span className="font-bold">{ride.price} 🪙</span>
                </div>
                {!canAfford && (
                  <div className="mt-2 text-xs text-red-200 bg-black/30 rounded px-2 py-1">
                    ❌ Nicht genug Coins
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need More Coins */}
        <div 
          onClick={() => navigate('/games')}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 cursor-pointer hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎮</span>
              <div>
                <h3 className="font-semibold">Mehr Coins nötig?</h3>
                <p className="text-sm text-white/70">Spiele und verdiene!</p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </div>

        {/* Ride History */}
        {rideHistory.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3">📜 Letzte Fahrten</h2>
            <div className="space-y-3">
              {rideHistory.slice(0, 5).map((ride, index) => {
                const rideInfo = RIDE_OPTIONS.find(r => r.id === ride.ride_type) || {};
                return (
                  <div 
                    key={ride.id || index}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{rideInfo.icon || '🚗'}</span>
                      <div>
                        <p className="font-medium">{rideInfo.name || ride.ride_type}</p>
                        <p className="text-xs text-white/50">{formatDate(ride.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-400">-{ride.cost} 🪙</p>
                      <p className="text-xs text-green-400">{ride.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Confirm Modal */}
      {showConfirm && selectedRide && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-800 rounded-3xl p-6 text-center">
            <div className="text-6xl mb-4">{selectedRide.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{selectedRide.name}</h2>
            <p className="text-white/70 mb-4">{selectedRide.description}</p>
            
            <div className="bg-black/30 rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span>Fahrzeit</span>
                <span className="font-bold">{selectedRide.time}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Kosten</span>
                <span className="font-bold text-yellow-400">{selectedRide.price} 🪙</span>
              </div>
            </div>

            <div className="text-sm text-white/50 mb-4">
              Dein Guthaben: <span className="text-yellow-400">{coins} 🪙</span>
              <br />
              Nach Buchung: <span className="text-green-400">{coins - selectedRide.price} 🪙</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmRide}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50"
              >
                {loading ? '...' : '✓ Buchen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
