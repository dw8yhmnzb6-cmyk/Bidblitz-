/**
 * POS Scanner - Scan customer QR codes for instant payments
 * Merchants scan customer's QR code from their BidBlitz app
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  ScanLine, Euro, CheckCircle, XCircle, RefreshCw, Store,
  Volume2, VolumeX, Maximize, Minimize, LogOut, Camera,
  CameraOff, AlertTriangle, User, Wifi, History, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Sound effects
const playSound = (type) => {
  const sounds = {
    success: '/sounds/success.mp3',
    scan: '/sounds/scan.mp3',
    error: '/sounds/error.mp3'
  };
  try {
    const audio = new Audio(sounds[type]);
    audio.volume = type === 'scan' ? 0.3 : 0.5;
    audio.play().catch(() => {});
  } catch (e) {}
};

export default function POSScanner() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('pos_api_key') || '');
  const [merchantName, setMerchantName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Scanner state
  const [scanning, setScanning] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  
  // Amount state
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('amount'); // 'amount' | 'scan' | 'processing' | 'success' | 'error'
  
  // Transaction state
  const [lastTransaction, setLastTransaction] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recentPayments, setRecentPayments] = useState([]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Connect with API key
  const connect = async () => {
    if (!apiKey.trim()) {
      toast.error('Bitte API-Key eingeben');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/digital/balance`, {
        headers: { 'X-API-Key': apiKey }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMerchantName(data.api_key_name || 'Händler');
        setIsConnected(true);
        localStorage.setItem('pos_api_key', apiKey);
        toast.success(`Verbunden als ${data.api_key_name}`);
        fetchRecentPayments();
      } else {
        toast.error('Ungültiger API-Key');
      }
    } catch (err) {
      toast.error('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect
  const disconnect = () => {
    setIsConnected(false);
    setStep('amount');
    localStorage.removeItem('pos_api_key');
  };

  // Fetch recent payments
  const fetchRecentPayments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/digital/payments?limit=20`, {
        headers: { 'X-API-Key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentPayments(data.payments || []);
      }
    } catch (err) {}
  };

  // Process scanned QR
  const processQR = async (qrData) => {
    if (step !== 'scan') return;
    
    if (soundEnabled) playSound('scan');
    setStep('processing');

    try {
      // Parse QR data
      let customerData;
      try {
        customerData = JSON.parse(qrData);
      } catch {
        throw new Error('Ungültiger QR-Code');
      }

      if (customerData.type !== 'bidblitz_pay') {
        throw new Error('Kein BidBlitz Zahlungs-QR');
      }

      // Check expiry
      if (customerData.expires && new Date(customerData.expires) < new Date()) {
        throw new Error('QR-Code abgelaufen');
      }

      // Process payment via API
      const res = await fetch(`${API_URL}/api/digital/scan-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_token: customerData.token,
          customer_id: customerData.user_id,
          customer_number: customerData.customer_number
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (soundEnabled) playSound('success');
        setLastTransaction({
          amount: parseFloat(amount),
          customer_name: data.customer_name,
          customer_number: customerData.customer_number,
          reference: data.payment_id,
          timestamp: new Date()
        });
        setStep('success');
        fetchRecentPayments();
        
        // Auto-reset after 5 seconds
        setTimeout(() => {
          resetToAmount();
        }, 5000);
      } else {
        throw new Error(data.detail || data.message || 'Zahlung fehlgeschlagen');
      }
    } catch (err) {
      if (soundEnabled) playSound('error');
      setErrorMessage(err.message || 'Fehler bei der Zahlung');
      setStep('error');
    }
  };

  // Handle scan result
  const handleScan = useCallback((result) => {
    if (result?.[0]?.rawValue) {
      processQR(result[0].rawValue);
    }
  }, [step, amount, apiKey, soundEnabled]);

  // Reset to amount entry
  const resetToAmount = () => {
    setStep('amount');
    setAmount('');
    setLastTransaction(null);
    setErrorMessage('');
    setScanning(true);
  };

  // Start scanning
  const startScan = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Bitte gültigen Betrag eingeben');
      return;
    }
    setStep('scan');
    setScanning(true);
  };

  // Auto-connect on load
  useEffect(() => {
    if (apiKey) connect();
  }, []);

  // Login Screen
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ScanLine className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">BidBlitz Scanner</h1>
            <p className="text-gray-500 mt-2 text-lg">Kunden-QR scannen & bezahlen</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API-Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="bbz_xxxxxxxxxxxxxxxx"
                className="w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
                onKeyDown={(e) => e.key === 'Enter' && connect()}
              />
            </div>

            <button
              onClick={connect}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Wifi className="w-6 h-6" />
                  Verbinden
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Scanner Interface
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">{merchantName}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Scanner Modus
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 hover:bg-gray-700 rounded-lg">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className="p-2 hover:bg-gray-700 rounded-lg">
            <History className="w-5 h-5" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-700 rounded-lg">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button onClick={disconnect} className="p-2 hover:bg-gray-700 rounded-lg text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Step 1: Enter Amount */}
        {step === 'amount' && (
          <div className="w-full max-w-md text-center">
            <p className="text-gray-400 mb-2">Betrag eingeben</p>
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center">
                <span className="text-4xl text-gray-500 mr-2">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-5xl sm:text-6xl font-bold text-white text-center w-48 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            
            <button
              onClick={startScan}
              disabled={!amount || parseFloat(amount) <= 0}
              className={`w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${
                amount && parseFloat(amount) > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Camera className="w-6 h-6" />
              Scanner starten
            </button>
          </div>
        )}

        {/* Step 2: Scan QR */}
        {step === 'scan' && (
          <div className="w-full max-w-lg text-center">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={resetToAmount}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                Zurück
              </button>
              <p className="text-2xl font-bold">€{parseFloat(amount).toFixed(2)}</p>
            </div>
            
            <div className="bg-gray-800 rounded-2xl overflow-hidden mb-4">
              <div className="relative aspect-square">
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-400">
                    <CameraOff className="w-16 h-16 mb-4" />
                    <p className="font-medium">Kamera nicht verfügbar</p>
                    <p className="text-sm">{cameraError}</p>
                  </div>
                ) : (
                  <Scanner
                    onScan={handleScan}
                    onError={(err) => setCameraError(err?.message || 'Kamera-Fehler')}
                    constraints={{ facingMode: 'environment' }}
                    scanDelay={500}
                    styles={{
                      container: { width: '100%', height: '100%' },
                      video: { width: '100%', height: '100%', objectFit: 'cover' }
                    }}
                  />
                )}
                
                {/* Scan Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-4 border-blue-400 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg -translate-x-1 -translate-y-1"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg translate-x-1 -translate-y-1"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg -translate-x-1 translate-y-1"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg translate-x-1 translate-y-1"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-400 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-400 flex items-center justify-center gap-2">
              <ScanLine className="w-5 h-5 animate-pulse" />
              Kunden-QR-Code scannen
            </p>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="text-center">
            <RefreshCw className="w-20 h-20 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-xl font-semibold">Verarbeitung...</p>
            <p className="text-gray-400">€{parseFloat(amount).toFixed(2)}</p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && lastTransaction && (
          <div className="text-center max-w-md">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </div>
            
            <p className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">Bezahlt!</p>
            <p className="text-5xl sm:text-6xl font-bold mb-4">€{lastTransaction.amount.toFixed(2)}</p>
            
            <div className="bg-gray-800 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-3 text-gray-300">
                <User className="w-5 h-5" />
                <span>{lastTransaction.customer_name || lastTransaction.customer_number}</span>
              </div>
            </div>
            
            <button
              onClick={resetToAmount}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-xl"
            >
              Nächste Zahlung
            </button>
          </div>
        )}

        {/* Step 5: Error */}
        {step === 'error' && (
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            
            <p className="text-3xl font-bold text-red-400 mb-2">Fehler</p>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep('scan')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold"
              >
                Erneut scannen
              </button>
              <button
                onClick={resetToAmount}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold"
              >
                Neuer Betrag
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-gray-800 shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-lg">Transaktionen</h3>
            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {recentPayments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Keine Transaktionen</p>
            ) : (
              recentPayments.filter(p => p.status === 'completed').map((payment, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-green-900/30">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">€{payment.amount?.toFixed(2)}</p>
                    <span className="text-xs text-green-400">✓ Bezahlt</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(payment.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
