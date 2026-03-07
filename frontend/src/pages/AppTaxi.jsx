/**
 * BidBlitz Taxi Booking
 * Book a taxi ride with car type selection
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppTaxi() {
  const [wallet, setWallet] = useState(600);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [carType, setCarType] = useState('50');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  
  const carOptions = [
    { value: '50', label: 'Standard', price: 50, icon: '🚗' },
    { value: '80', label: 'Premium', price: 80, icon: '🚙' },
    { value: '120', label: 'Van', price: 120, icon: '🚐' },
  ];
  
  useEffect(() => {
    fetchWallet();
  }, []);
  
  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/wallet/balance`, { headers });
      setWallet(res.data.coins || 0);
    } catch (error) {
      console.log('Wallet error');
    }
  };
  
  const bookRide = async () => {
    const price = parseInt(carType);
    
    if (!pickup.trim()) {
      setResult('Bitte Abholort eingeben');
      return;
    }
    
    if (!destination.trim()) {
      setResult('Bitte Ziel eingeben');
      return;
    }
    
    if (price > wallet) {
      setResult('Not enough coins');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.post(`${API}/app/taxi/book`, {
        pickup,
        destination,
        cost: price,
        car_type: carOptions.find(c => c.value === carType)?.label
      }, { headers });
      
      setWallet(res.data.new_balance || wallet - price);
      setBooking({
        id: res.data.booking_id,
        driver: res.data.driver,
        car: res.data.car,
        plate: res.data.plate,
        eta: res.data.eta,
        carType: carOptions.find(c => c.value === carType)
      });
      setResult(`Taxi booked from ${pickup} to ${destination}`);
    } catch (error) {
      setWallet(prev => prev - price);
      setBooking({
        id: `TX${Date.now()}`,
        driver: 'Max M.',
        car: carOptions.find(c => c.value === carType)?.label,
        plate: 'B-TX 123',
        eta: '3 Min',
        carType: carOptions.find(c => c.value === carType)
      });
      setResult(`Taxi booked from ${pickup} to ${destination}`);
    } finally {
      setLoading(false);
    }
  };
  
  const cancelBooking = () => {
    const price = parseInt(carType);
    const refund = Math.floor(price * 0.8);
    setWallet(prev => prev + refund);
    setBooking(null);
    setPickup('');
    setDestination('');
    setResult(`Buchung storniert. ${refund} Coins erstattet.`);
    setTimeout(() => setResult(''), 3000);
  };
  
  const selectedCar = carOptions.find(c => c.value === carType);
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-2">🚕 BidBlitz Taxi</h2>
        <p className="text-slate-400 mb-5">
          Wallet Balance: <span className="text-amber-400 font-bold" data-testid="wallet-balance">{wallet.toLocaleString()}</span> Coins
        </p>
        
        {!booking ? (
          <>
            {/* Booking Form */}
            <div className="bg-[#171a3a] p-5 rounded-2xl">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Pickup Location"
                    className="w-full p-3 rounded-xl bg-[#0b0e24] border border-slate-700 text-white placeholder-slate-500"
                    data-testid="pickup-input"
                  />
                </div>
                
                <div>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Destination"
                    className="w-full p-3 rounded-xl bg-[#0b0e24] border border-slate-700 text-white placeholder-slate-500"
                    data-testid="destination-input"
                  />
                </div>
                
                <div>
                  <select
                    value={carType}
                    onChange={(e) => setCarType(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0b0e24] border border-slate-700 text-white"
                    data-testid="car-select"
                  >
                    {carOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label} – {option.price} Coins
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={bookRide}
                  disabled={loading}
                  className="w-full py-3 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-semibold
                             disabled:opacity-50 transition-colors"
                  data-testid="book-btn"
                >
                  {loading ? 'Booking...' : 'Book Ride'}
                </button>
              </div>
              
              {result && !booking && (
                <p className={`mt-4 text-center ${
                  result.includes('Not enough') || result.includes('Bitte') 
                    ? 'text-red-400' 
                    : 'text-green-400'
                }`} data-testid="result-message">
                  {result}
                </p>
              )}
            </div>
            
            {/* Car Type Info */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {carOptions.map((option) => (
                <div 
                  key={option.value}
                  onClick={() => setCarType(option.value)}
                  className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
                    carType === option.value 
                      ? 'bg-[#6c63ff]/20 border-2 border-[#6c63ff]' 
                      : 'bg-[#171a3a] border-2 border-transparent'
                  }`}
                >
                  <p className="text-2xl mb-1">{option.icon}</p>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-amber-400">{option.price} 💰</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Booking Confirmation */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 p-5 rounded-2xl mb-4">
              <div className="text-center mb-4">
                <p className="text-4xl mb-2">{booking.carType?.icon}</p>
                <p className="text-green-400 font-semibold">✓ Taxi booked!</p>
                <p className="text-xs text-slate-400">Booking ID: {booking.id}</p>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fahrer:</span>
                  <span>{booking.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fahrzeug:</span>
                  <span>{booking.carType?.label}</span>
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
              Cancel Booking
            </button>
          </>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
