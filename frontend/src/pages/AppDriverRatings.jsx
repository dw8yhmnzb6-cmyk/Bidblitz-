/**
 * BidBlitz Driver Ratings
 * View and manage driver ratings
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppDriverRatings() {
  const [drivers, setDrivers] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [activeTab, setActiveTab] = useState('top');
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/app/drivers/top`);
      setDrivers(res.data.drivers || []);
    } catch (error) {
      // Sample data
      setDrivers([
        { id: 1, name: 'Max M.', rating: 4.9, trips: 1250, vehicle: 'BMW 3er', avatar: '👨' },
        { id: 2, name: 'Anna K.', rating: 4.8, trips: 890, vehicle: 'Mercedes C', avatar: '👩' },
        { id: 3, name: 'Tom B.', rating: 4.7, trips: 2100, vehicle: 'VW Passat', avatar: '👨' },
        { id: 4, name: 'Lisa S.', rating: 4.6, trips: 560, vehicle: 'Audi A4', avatar: '👩' },
        { id: 5, name: 'Ben R.', rating: 4.5, trips: 1800, vehicle: 'BMW 5er', avatar: '👨' },
      ]);
    }
    
    // Load my ratings from localStorage
    const saved = localStorage.getItem('myDriverRatings');
    if (saved) {
      setMyRatings(JSON.parse(saved));
    } else {
      setMyRatings([
        { driverId: 1, driver: 'Max M.', rating: 5, date: '06.03.2026', comment: 'Sehr freundlich!' },
        { driverId: 2, driver: 'Anna K.', rating: 4, date: '04.03.2026', comment: '' },
      ]);
    }
  };
  
  const renderStars = (rating) => {
    return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
  };
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-5">⭐ Fahrer-Bewertungen</h2>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab('top')}
            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'top' ? 'bg-[#6c63ff]' : 'bg-[#171a3a]'
            }`}
          >
            🏆 Top Fahrer
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'my' ? 'bg-[#6c63ff]' : 'bg-[#171a3a]'
            }`}
          >
            📝 Meine Bewertungen
          </button>
        </div>
        
        {activeTab === 'top' ? (
          /* Top Drivers */
          <div className="space-y-3">
            {drivers.map((driver, index) => (
              <div 
                key={driver.id}
                className="bg-[#171a3a] p-4 rounded-2xl flex items-center gap-4"
              >
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-2xl">
                    {driver.avatar}
                  </div>
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0b0e24] rounded-full flex items-center justify-center text-sm">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="font-semibold">{driver.name}</p>
                  <p className="text-sm text-slate-400">{driver.vehicle}</p>
                  <p className="text-xs text-slate-500">{driver.trips} Fahrten</p>
                </div>
                
                <div className="text-right">
                  <p className="text-amber-400 font-bold">{driver.rating}</p>
                  <p className="text-xs text-amber-400">{renderStars(driver.rating)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* My Ratings */
          <div className="space-y-3">
            {myRatings.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-4xl mb-2">⭐</p>
                <p>Noch keine Bewertungen abgegeben</p>
              </div>
            ) : (
              myRatings.map((rating, index) => (
                <div 
                  key={index}
                  className="bg-[#171a3a] p-4 rounded-2xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{rating.driver}</p>
                      <p className="text-xs text-slate-500">{rating.date}</p>
                    </div>
                    <div className="text-amber-400">
                      {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-slate-400 italic">"{rating.comment}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Info */}
        <div className="mt-5 bg-[#171a3a] p-4 rounded-xl text-sm text-slate-400">
          <h4 className="font-semibold text-white mb-2">Wie funktioniert das?</h4>
          <p>• Nach jeder Fahrt kannst du den Fahrer bewerten</p>
          <p>• Top-Fahrer erhalten einen Bonus</p>
          <p>• Deine Bewertungen helfen anderen Nutzern</p>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
