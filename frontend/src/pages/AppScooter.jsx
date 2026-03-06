/**
 * BidBlitz Scooter Booking
 * Rent an e-scooter with coins
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppScooter() {
  const [coins, setCoins] = useState(0);
  const [scooters, setScooters] = useState([
    { id: 'SC001', distance: '50m', battery: 85, price: 5 },
    { id: 'SC002', distance: '120m', battery: 62, price: 5 },
    { id: 'SC003', distance: '200m', battery: 91, price: 5 },
    { id: 'SC004', distance: '350m', battery: 44, price: 4 },
  ]);
  const [activeRide, setActiveRide] = useState(null);
  const [rideTime, setRideTime] = useState(0);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchCoins();
  }, []);
  
  useEffect(() => {
    let interval;
    if (activeRide) {
      interval = setInterval(() => {
        setRideTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRide]);
  
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
  
  const rentScooter = async (scooter) => {
    if (coins < scooter.price) {
      setMessage('Nicht genug Coins!');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(`${API}/app/scooter/rent`, {
        scooter_id: scooter.id,
        price: scooter.price
      }, { headers });
    } catch (error) {
      console.log('Rent error');
    }
    
    setActiveRide(scooter);
    setCoins(prev => prev - scooter.price);
    setRideTime(0);
  };
  
  const endRide = async () => {
    const costPerMinute = 2;
    const totalMinutes = Math.ceil(rideTime / 60);
    const rideCost = totalMinutes * costPerMinute;
    
    // Check if user has enough coins for the ride
    if (coins < rideCost) {
      setMessage('Nicht genug Coins für die Fahrt! Fahrt wird kostenlos beendet.');
    } else {
      setCoins(prev => prev - rideCost);
      setMessage(`Fahrt beendet! ${rideCost} Coins für ${totalMinutes} Min.`);
    }
    
    setActiveRide(null);
    setRideTime(0);
    setTimeout(() => setMessage(''), 3000);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getBatteryColor = (battery) => {
    if (battery > 60) return 'text-green-400';
    if (battery > 30) return 'text-amber-400';
    return 'text-red-400';
  };
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-2">🛴 E-Scooter</h2>
        <p className="text-slate-400 mb-5">Coins: <span className="text-amber-400 font-bold">{coins.toLocaleString()}</span></p>
        
        {message && (
          <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-center text-amber-400">
            {message}
          </div>
        )}
        
        {!activeRide ? (
          <>
            {/* Available Scooters */}
            <h3 className="font-semibold mb-3">Verfügbare Scooter in der Nähe</h3>
            <div className="space-y-3" data-testid="scooter-list">
              {scooters.map((scooter) => (
                <div 
                  key={scooter.id}
                  className="bg-[#171a3a] p-4 rounded-2xl flex items-center justify-between"
                  data-testid={`scooter-${scooter.id}`}
                >
                  <div>
                    <p className="font-semibold">🛴 {scooter.id}</p>
                    <p className="text-xs text-slate-400">{scooter.distance} entfernt</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold ${getBatteryColor(scooter.battery)}`}>
                      🔋 {scooter.battery}%
                    </p>
                  </div>
                  <button
                    onClick={() => rentScooter(scooter)}
                    className="px-4 py-2 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl text-sm font-medium"
                    data-testid={`rent-btn-${scooter.id}`}
                  >
                    {scooter.price} 💰
                  </button>
                </div>
              ))}
            </div>
            
            {/* Pricing Info */}
            <div className="mt-5 bg-[#171a3a] p-4 rounded-xl text-sm text-slate-400">
              <h4 className="font-semibold text-white mb-2">Preise:</h4>
              <p>Entsperrung: 5 Coins</p>
              <p>Pro Minute: 2 Coins</p>
            </div>
          </>
        ) : (
          <>
            {/* Active Ride */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 p-5 rounded-2xl mb-4">
              <div className="text-center">
                <p className="text-green-400 font-semibold mb-2">🛴 Fahrt aktiv</p>
                <p className="text-4xl font-bold mb-2">{formatTime(rideTime)}</p>
                <p className="text-slate-400 text-sm">Scooter: {activeRide.id}</p>
              </div>
            </div>
            
            {/* Live Cost */}
            <div className="bg-[#171a3a] p-4 rounded-2xl mb-4 text-center">
              <p className="text-slate-400 text-sm">Aktuelle Kosten</p>
              <p className="text-2xl font-bold text-amber-400">
                {Math.ceil(rideTime / 60) * 2} Coins
              </p>
              <p className="text-xs text-slate-500">+ 5 Coins Entsperrung</p>
            </div>
            
            {/* End Ride Button */}
            <button
              onClick={endRide}
              className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg
                         transition-colors"
              data-testid="end-ride-btn"
            >
              Fahrt beenden
            </button>
          </>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
