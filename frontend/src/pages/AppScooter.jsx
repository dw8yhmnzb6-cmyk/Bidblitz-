/**
 * BidBlitz Scooter with QR Scanner
 * Scan QR code to unlock scooter
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppScooter() {
  const [wallet, setWallet] = useState(500);
  const [status, setStatus] = useState('');
  const [rideActive, setRideActive] = useState(false);
  const [rideTime, setRideTime] = useState(0);
  const [scannedId, setScannedId] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef(null);
  const readerRef = useRef(null);
  
  const UNLOCK_PRICE = 5;
  const PRICE_PER_MINUTE = 2;
  
  useEffect(() => {
    fetchWallet();
    loadQRScanner();
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);
  
  useEffect(() => {
    let interval;
    if (rideActive) {
      interval = setInterval(() => {
        setRideTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rideActive]);
  
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
  
  const loadQRScanner = () => {
    if (window.Html5QrcodeScanner) {
      initScanner();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode';
      script.onload = initScanner;
      document.head.appendChild(script);
    }
  };
  
  const initScanner = () => {
    if (!readerRef.current || scannerRef.current) return;
    
    setTimeout(() => {
      try {
        scannerRef.current = new window.Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } }
        );
        
        scannerRef.current.render(onScanSuccess, onScanError);
        setScannerReady(true);
      } catch (error) {
        console.log('Scanner init error');
      }
    }, 500);
  };
  
  const onScanSuccess = (decodedText) => {
    if (rideActive) return;
    
    // Unlock scooter
    if (wallet < UNLOCK_PRICE) {
      setStatus('Not enough coins to unlock');
      return;
    }
    
    setScannedId(decodedText);
    setWallet(prev => prev - UNLOCK_PRICE);
    setRideActive(true);
    setRideTime(0);
    setStatus(`Scooter ${decodedText} started`);
    
    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }
  };
  
  const onScanError = (error) => {
    // Ignore scan errors
  };
  
  const simulateScan = () => {
    const fakeId = `SC00${Math.floor(Math.random() * 9) + 1}`;
    onScanSuccess(fakeId);
  };
  
  const stopRide = async () => {
    if (!rideActive) {
      setStatus('No active ride');
      return;
    }
    
    const minutes = Math.max(1, Math.ceil(rideTime / 60));
    const rideCost = minutes * PRICE_PER_MINUTE;
    
    setWallet(prev => Math.max(0, prev - rideCost));
    setStatus(`Ride finished. Cost: ${rideCost + UNLOCK_PRICE} coins (${UNLOCK_PRICE} unlock + ${rideCost} for ${minutes} min)`);
    setRideActive(false);
    setScannedId('');
    
    // Reinitialize scanner
    setTimeout(() => {
      initScanner();
    }, 1000);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-2">🛴 BidBlitz Scooter</h2>
        <p className="text-slate-400 mb-5">
          Wallet: <span className="text-amber-400 font-bold">{wallet.toLocaleString()}</span> Coins
        </p>
        
        {!rideActive ? (
          <>
            {/* QR Scanner */}
            <div className="bg-[#171a3a] p-4 rounded-2xl mb-4">
              <h3 className="font-semibold mb-3 text-center">📷 Scan QR Code to Unlock</h3>
              <div 
                id="qr-reader" 
                ref={readerRef}
                className="mx-auto rounded-xl overflow-hidden"
                style={{ maxWidth: '300px' }}
              />
              
              {/* Simulate Button for Testing */}
              <button
                onClick={simulateScan}
                className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm"
              >
                🔧 Simulate Scan (Test)
              </button>
            </div>
            
            {/* Pricing Info */}
            <div className="bg-[#171a3a] p-4 rounded-xl text-sm">
              <h4 className="font-semibold mb-2">Preise:</h4>
              <p className="text-slate-400">• Entsperrung: {UNLOCK_PRICE} Coins</p>
              <p className="text-slate-400">• Pro Minute: {PRICE_PER_MINUTE} Coins</p>
            </div>
          </>
        ) : (
          <>
            {/* Active Ride */}
            <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-900/20 border border-cyan-500/30 p-6 rounded-2xl mb-4">
              <div className="text-center">
                <p className="text-5xl mb-3">🛴</p>
                <p className="text-cyan-400 font-semibold mb-1">Ride Active</p>
                <p className="text-sm text-slate-400 mb-4">Scooter: {scannedId}</p>
                
                <div className="text-5xl font-bold mb-4" data-testid="ride-timer">
                  {formatTime(rideTime)}
                </div>
                
                <div className="bg-[#0b0e24] p-3 rounded-xl">
                  <p className="text-sm text-slate-400">Current Cost</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {UNLOCK_PRICE + Math.max(1, Math.ceil(rideTime / 60)) * PRICE_PER_MINUTE} Coins
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={stopRide}
              className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg"
              data-testid="stop-btn"
            >
              Stop Ride
            </button>
          </>
        )}
        
        {/* Status Message */}
        {status && (
          <p className={`mt-4 p-3 rounded-xl text-center ${
            status.includes('finished') ? 'bg-green-500/20 text-green-400' :
            status.includes('Not enough') || status.includes('No active') ? 'bg-red-500/20 text-red-400' :
            'bg-cyan-500/20 text-cyan-400'
          }`} data-testid="status-message">
            {status}
          </p>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
