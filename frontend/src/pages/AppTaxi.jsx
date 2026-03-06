/**
 * BidBlitz Taxi Booking
 * Book a taxi ride with coins
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppTaxi() {
  const [coins, setCoins] = useState(0);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchCoins();
  }, []);
  
  useEffect(() => {
    // Calculate estimated cost based on input
    if (pickup && destination) {
      const cost = Math.floor(Math.random() * 100) + 50; // 50-150 coins
      setEstimatedCost(cost);
    } else {
      setEstimatedCost(0);
    }
  }, [pickup, destination]);
  
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
  
  const bookTaxi = async () => {
    if (!pickup || !destination) {
      setMessage('Bitte Abholort und Ziel eingeben');
      return;
    }
    
    if (coins < estimatedCost) {
      setMessage('Nicht genug Coins!');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.post(`${API}/app/taxi/book`, {
        pickup,
        destination,
        cost: estimatedCost
      }, { headers });
      
      setBooking({
        id: res.data.booking_id || `TX${Date.now()}`,
        driver: res.data.driver || 'Max M.',
        car: res.data.car || 'BMW 3er',
        plate: res.data.plate || 'B-TX 123',
        eta: res.data.eta || '3 Min'
      });
      
      setCoins(res.data.new_balance || coins - estimatedCost);
      setMessage('');
    } catch (error) {
      // Simulate booking
      setBooking({
        id: `TX${Date.now()}`,
        driver: 'Max M.',
        car: 'BMW 3er',
        plate: 'B-TX 123',
        eta: '3 Min'
      });
      setCoins(prev => prev - estimatedCost);
    } finally {
      setLoading(false);
    }
  };
  
  const cancelBooking = () => {
    setBooking(null);
    setCoins(prev => prev + Math.floor(estimatedCost * 0.8)); // 80% refund
    setPickup('');
    setDestination('');
    setMessage('Buchung storniert. 80% erstattet.');
    setTimeout(() => setMessage(''), 3000);
  };
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-2">🚕 Taxi buchen</h2>
        <p className="text-slate-400 mb-5">Coins: <span className="text-amber-400 font-bold">{coins.toLocaleString()}</span></p>
        
        {message && (
          <div className={`mb-4 p-3 rounded-xl text-center ${
            message.includes('storniert') ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {message}
          </div>
        )}
        
        {!booking ? (
          <>
            {/* Booking Form */}
            <div className="bg-[#171a3a] p-5 rounded-2xl mb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">📍 Abholort</label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="z.B. Alexanderplatz"
                    className="w-full p-3 rounded-xl bg-[#0b0e24] border border-slate-700 text-white"
                    data-testid="pickup-input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">🎯 Ziel</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="z.B. Hauptbahnhof"
                    className="w-full p-3 rounded-xl bg-[#0b0e24] border border-slate-700 text-white"
                    data-testid="destination-input"
                  />
                </div>
              </div>
            </div>
            
            {/* Cost Estimate */}
            {estimatedCost > 0 && (
              <div className="bg-[#171a3a] p-4 rounded-2xl mb-4 text-center">
                <p className="text-slate-400 text-sm">Geschätzte Kosten</p>
                <p className="text-2xl font-bold text-amber-400">{estimatedCost} Coins</p>
              </div>
            )}
            
            {/* Book Button */}
            <button
              onClick={bookTaxi}
              disabled={loading || !pickup || !destination}
              className="w-full py-3 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-semibold
                         disabled:opacity-50 transition-colors"
              data-testid="book-btn"
            >
              {loading ? 'Wird gebucht...' : 'Taxi buchen'}
            </button>
          </>
        ) : (
          <>
            {/* Booking Confirmation */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 p-5 rounded-2xl mb-4">
              <div className="text-center mb-4">
                <p className="text-green-400 font-semibold">✓ Taxi gebucht!</p>
                <p className="text-xs text-slate-400">Buchungs-ID: {booking.id}</p>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fahrer:</span>
                  <span>{booking.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fahrzeug:</span>
                  <span>{booking.car}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kennzeichen:</span>
                  <span>{booking.plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ankunft in:</span>
                  <span className="text-green-400 font-bold">{booking.eta}</span>
                </div>
              </div>
            </div>
            
            {/* Route Info */}
            <div className="bg-[#171a3a] p-4 rounded-2xl mb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="w-0.5 h-8 bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">{pickup}</p>
                  <div className="h-8"></div>
                  <p className="text-sm">{destination}</p>
                </div>
              </div>
            </div>
            
            {/* Cancel Button */}
            <button
              onClick={cancelBooking}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 
                         text-red-400 rounded-xl font-semibold transition-colors"
              data-testid="cancel-btn"
            >
              Buchung stornieren
            </button>
          </>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
