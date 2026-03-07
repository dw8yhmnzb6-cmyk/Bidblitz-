/**
 * BidBlitz Live Map
 * Shows nearby taxis and scooters on Leaflet map
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function AppMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filter, setFilter] = useState('all'); // all, taxi, scooter
  
  // Vehicle data
  const vehicles = [
    { id: 1, type: 'taxi', name: 'Taxi Driver', lat: 42.6629, lng: 21.1655, driver: 'Max M.', price: 50, eta: '3 min' },
    { id: 2, type: 'taxi', name: 'Taxi Nearby', lat: 42.6650, lng: 21.1700, driver: 'Anna K.', price: 50, eta: '5 min' },
    { id: 3, type: 'taxi', name: 'Premium Taxi', lat: 42.6610, lng: 21.1620, driver: 'Tom B.', price: 80, eta: '4 min' },
    { id: 4, type: 'scooter', name: 'Scooter SC001', lat: 42.6600, lng: 21.1600, battery: 85, price: 5 },
    { id: 5, type: 'scooter', name: 'Scooter SC002', lat: 42.6580, lng: 21.1680, battery: 62, price: 5 },
    { id: 6, type: 'scooter', name: 'Scooter SC003', lat: 42.6640, lng: 21.1750, battery: 91, price: 5 },
  ];
  
  useEffect(() => {
    loadLeaflet();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);
  
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      updateMarkers();
    }
  }, [filter]);
  
  const loadLeaflet = () => {
    // Load CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
      document.head.appendChild(link);
    }
    
    // Load JS
    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }
  };
  
  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    const L = window.L;
    
    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView([42.6629, 21.1655], 14);
    
    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(mapInstanceRef.current);
    
    // Add markers
    updateMarkers();
  };
  
  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;
    
    const L = window.L;
    const map = mapInstanceRef.current;
    
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    
    // Filter vehicles
    const filteredVehicles = filter === 'all' 
      ? vehicles 
      : vehicles.filter(v => v.type === filter);
    
    // Add markers
    filteredVehicles.forEach((vehicle) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${vehicle.type === 'taxi' ? '#fbbf24' : '#22d3ee'};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border: 3px solid white;
        ">${vehicle.type === 'taxi' ? '🚕' : '🛴'}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      
      const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
        .addTo(map);
      
      marker.on('click', () => {
        setSelectedVehicle(vehicle);
      });
    });
  };
  
  const bookVehicle = () => {
    if (selectedVehicle?.type === 'taxi') {
      navigate('/taxi');
    } else {
      navigate('/scooter');
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full"
        style={{ height: '400px' }}
        data-testid="map-container"
      />
      
      {/* Filter Buttons */}
      <div className="p-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
            filter === 'all' ? 'bg-[#6c63ff]' : 'bg-[#171a3a]'
          }`}
        >
          🗺️ Alle
        </button>
        <button
          onClick={() => setFilter('taxi')}
          className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
            filter === 'taxi' ? 'bg-amber-500' : 'bg-[#171a3a]'
          }`}
        >
          🚕 Taxis
        </button>
        <button
          onClick={() => setFilter('scooter')}
          className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
            filter === 'scooter' ? 'bg-cyan-500' : 'bg-[#171a3a]'
          }`}
        >
          🛴 Scooter
        </button>
      </div>
      
      {/* Vehicle Info */}
      <div className="px-4">
        {selectedVehicle ? (
          <div className="bg-[#171a3a] p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {selectedVehicle.type === 'taxi' ? '🚕' : '🛴'}
                </span>
                <div>
                  <p className="font-semibold">{selectedVehicle.name}</p>
                  {selectedVehicle.type === 'taxi' ? (
                    <p className="text-sm text-slate-400">Fahrer: {selectedVehicle.driver}</p>
                  ) : (
                    <p className="text-sm text-slate-400">Batterie: {selectedVehicle.battery}%</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-amber-400 font-bold">{selectedVehicle.price} 💰</p>
                {selectedVehicle.eta && (
                  <p className="text-xs text-green-400">{selectedVehicle.eta}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={bookVehicle}
              className="w-full py-3 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-semibold"
            >
              {selectedVehicle.type === 'taxi' ? 'Taxi buchen' : 'Scooter mieten'}
            </button>
          </div>
        ) : (
          <div className="bg-[#171a3a] p-4 rounded-2xl text-center text-slate-400">
            <p>Wähle ein Fahrzeug auf der Karte</p>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-[#171a3a] p-3 rounded-xl text-center">
            <p className="text-2xl">🚕</p>
            <p className="text-sm text-slate-400">Taxis in der Nähe</p>
            <p className="text-xl font-bold text-amber-400">
              {vehicles.filter(v => v.type === 'taxi').length}
            </p>
          </div>
          <div className="bg-[#171a3a] p-3 rounded-xl text-center">
            <p className="text-2xl">🛴</p>
            <p className="text-sm text-slate-400">Scooter verfügbar</p>
            <p className="text-xl font-bold text-cyan-400">
              {vehicles.filter(v => v.type === 'scooter').length}
            </p>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
