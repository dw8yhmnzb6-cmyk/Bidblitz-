/**
 * BidBlitz Mobility - Scooter App
 * User interface for renting scooters
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  Bike, QrCode, MapPin, Clock, Euro, Battery, X, Play, Square,
  Navigation, History, AlertCircle, CheckCircle, Loader2, Zap,
  ChevronRight, Phone, CreditCard, Shield, Star
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Custom scooter icon for map
const scooterIcon = new L.DivIcon({
  className: 'scooter-marker',
  html: `<div style="
    background: linear-gradient(135deg, #10B981, #059669);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1z"/>
      <path d="M5 6h5v2H5zm14 7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const userIcon = new L.DivIcon({
  className: 'user-marker',
  html: `<div style="
    background: #3B82F6;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Map center component
function MapCenterButton({ position }) {
  const map = useMap();
  
  const handleCenter = () => {
    if (position) {
      map.flyTo(position, 16, { duration: 1 });
    }
  };
  
  return (
    <button
      onClick={handleCenter}
      className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-gray-50"
      title="Zu meinem Standort"
    >
      <Navigation className="w-5 h-5 text-blue-600" />
    </button>
  );
}

// Active Ride Display Component
function ActiveRideDisplay({ session, device, onEnd, loading }) {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    if (!session?.started_at) return;
    
    const start = new Date(session.started_at).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session?.started_at]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const pricing = session?.pricing_snapshot || {};
  const estimatedCost = (pricing.unlock_cents || 100) + Math.floor(elapsed / 60) * (pricing.per_minute_cents || 15);
  
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-green-600 to-green-500 text-white p-4 rounded-t-3xl shadow-2xl">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{device?.name || 'Scooter'}</h3>
              <p className="text-green-100 text-sm">{device?.serial}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold">{formatTime(elapsed)}</div>
            <p className="text-green-100 text-sm">Fahrzeit</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Euro className="w-5 h-5 mx-auto mb-1" />
            <div className="font-bold">€{(estimatedCost / 100).toFixed(2)}</div>
            <p className="text-xs text-green-100">Geschätzt</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1" />
            <div className="font-bold">{pricing.per_minute_cents || 15}¢</div>
            <p className="text-xs text-green-100">Pro Minute</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Battery className="w-5 h-5 mx-auto mb-1" />
            <div className="font-bold">{device?.battery_percent || '~'}%</div>
            <p className="text-xs text-green-100">Akku</p>
          </div>
        </div>
        
        {/* End Ride Button */}
        <button
          onClick={onEnd}
          disabled={loading}
          className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Square className="w-6 h-6" />
              Fahrt beenden
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// QR Scanner Modal
function QRScannerModal({ isOpen, onClose, onScan }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-bold">QR-Code scannen</h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <p className="text-white/70 text-sm mt-1">
          Scannen Sie den QR-Code am Scooter
        </p>
      </div>
      
      {/* Scanner */}
      <div className="h-full flex items-center justify-center">
        <Scanner
          onScan={(result) => {
            if (result && result[0]?.rawValue) {
              onScan(result[0].rawValue);
            }
          }}
          onError={(error) => console.error('Scanner error:', error)}
          styles={{
            container: { width: '100%', height: '100%' },
            video: { objectFit: 'cover' }
          }}
          components={{
            audio: false,
            torch: true
          }}
        />
      </div>
      
      {/* Scan Frame Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white rounded-2xl relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-xl" />
        </div>
      </div>
      
      {/* Bottom hint */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/60 text-sm">
          Oder geben Sie den Code manuell ein
        </p>
      </div>
    </div>
  );
}

// Ride History Component
function RideHistory({ sessions, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50" onClick={onClose}>
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Fahrtenverlauf</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Fahrten</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{session.device_type}</p>
                      <p className="text-sm text-gray-500">{session.device_serial}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.status === 'ended' ? 'bg-green-100 text-green-700' :
                      session.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {session.status === 'ended' ? 'Beendet' : 
                       session.status === 'active' ? 'Aktiv' : session.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.duration_seconds ? 
                        `${Math.floor(session.duration_seconds / 60)} Min` : 
                        'Läuft...'}
                    </span>
                    {session.cost_cents && (
                      <span className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        €{(session.cost_cents / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(session.requested_at).toLocaleString('de-DE')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Scooter App Component
export default function ScooterApp() {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [activeDevice, setActiveDevice] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // Default map center (Dubai)
  const defaultCenter = [25.0775, 55.1345]; // Dubai Marina - scooter location
  
  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.log('Location error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);
  
  // Fetch available devices
  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/devices/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(res.data.devices || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  }, [token]);
  
  // Check for active session
  const checkActiveSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/devices/active-session`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.has_active) {
        setActiveSession(res.data.session);
        setActiveDevice(res.data.device);
      } else {
        setActiveSession(null);
        setActiveDevice(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  }, [token]);
  
  // Fetch ride history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/devices/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data.sessions || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [token]);
  
  // Initial data load
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDevices(),
        checkActiveSession(),
        fetchHistory()
      ]);
      setLoading(false);
    };
    
    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDevices();
      checkActiveSession();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, fetchDevices, checkActiveSession, fetchHistory]);
  
  // Unlock scooter
  const handleUnlock = async (deviceId) => {
    setUnlocking(true);
    try {
      const res = await axios.post(`${API}/devices/unlock`, 
        { device_id: deviceId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (res.data.success) {
        toast.success('🛴 Scooter entsperrt! Gute Fahrt!');
        setActiveSession({ id: res.data.session_id, ...res.data });
        setShowScanner(false);
        setSelectedDevice(null);
        await checkActiveSession();
        await fetchDevices();
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Entsperren fehlgeschlagen';
      toast.error(msg);
    } finally {
      setUnlocking(false);
    }
  };
  
  // End ride
  const handleEndRide = async () => {
    if (!activeSession?.id) return;
    
    setEnding(true);
    try {
      const res = await axios.post(`${API}/devices/sessions/${activeSession.id}/end`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (res.data.success) {
        toast.success(
          <div>
            <p className="font-bold">Fahrt beendet!</p>
            <p>Dauer: {res.data.duration.formatted}</p>
            <p>Kosten: {res.data.cost.formatted}</p>
          </div>
        );
        setActiveSession(null);
        setActiveDevice(null);
        await fetchDevices();
        await fetchHistory();
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Fehler beim Beenden';
      toast.error(msg);
    } finally {
      setEnding(false);
    }
  };
  
  // Handle QR scan
  const handleQRScan = (data) => {
    // Extract device ID from QR code
    // Expected format: "bidblitz://scooter/{device_id}" or just device_id
    let deviceId = data;
    
    if (data.includes('scooter/')) {
      deviceId = data.split('scooter/')[1];
    }
    
    // Find device
    const device = devices.find(d => d.id === deviceId || d.serial === data);
    
    if (device) {
      setShowScanner(false);
      handleUnlock(device.id);
    } else {
      toast.error('Scooter nicht gefunden oder nicht verfügbar');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Lade Scooter...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">BidBlitz Mobility</h1>
            <p className="text-green-100">Scooter mieten</p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 bg-white/20 rounded-full"
          >
            <History className="w-6 h-6" />
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-green-100">Verfügbar</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-green-100">Fahrten</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">€1</div>
            <p className="text-xs text-green-100">Start</p>
          </div>
        </div>
      </div>
      
      {/* Map */}
      <div className="relative" style={{ height: 'calc(100vh - 380px)', minHeight: '300px' }}>
        <MapContainer
          center={userPosition || defaultCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          {/* User position */}
          {userPosition && (
            <Marker position={userPosition} icon={userIcon}>
              <Popup>Ihr Standort</Popup>
            </Marker>
          )}
          
          {/* Scooter markers */}
          {devices.map((device) => (
            device.lat && device.lng && (
              <Marker
                key={device.id}
                position={[device.lat, device.lng]}
                icon={scooterIcon}
                eventHandlers={{
                  click: () => setSelectedDevice(device)
                }}
              >
                <Popup>
                  <div className="text-center min-w-[150px]">
                    <p className="font-bold">{device.name}</p>
                    <p className="text-sm text-gray-500">{device.serial}</p>
                    <p className="text-sm text-gray-500">{device.location}</p>
                    <button
                      onClick={() => handleUnlock(device.id)}
                      disabled={unlocking}
                      className="mt-2 w-full py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700"
                    >
                      Entsperren
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
          
          <MapCenterButton position={userPosition} />
        </MapContainer>
      </div>
      
      {/* Bottom Actions */}
      {!activeSession && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setShowScanner(true)}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
            >
              <QrCode className="w-6 h-6" />
              QR-Code scannen
            </button>
            
            {/* Pricing info */}
            <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500">
              <span>€1.00 Entsperren</span>
              <span>•</span>
              <span>€0.15/Min</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Active Ride Display */}
      {activeSession && (
        <ActiveRideDisplay
          session={activeSession}
          device={activeDevice}
          onEnd={handleEndRide}
          loading={ending}
        />
      )}
      
      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />
      
      {/* History Modal */}
      {showHistory && (
        <RideHistory
          sessions={sessions}
          onClose={() => setShowHistory(false)}
        />
      )}
      
      {/* Device Selection Modal */}
      {selectedDevice && !activeSession && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end" onClick={() => setSelectedDevice(null)}>
          <div 
            className="w-full bg-white rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <Bike className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedDevice.name}</h3>
                <p className="text-gray-500">{selectedDevice.serial}</p>
                <p className="text-sm text-gray-400">{selectedDevice.location}</p>
              </div>
            </div>
            
            {/* Pricing */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h4 className="font-semibold mb-2">Preise</h4>
              <div className="flex justify-between text-sm">
                <span>Entsperren</span>
                <span className="font-semibold">€{(selectedDevice.pricing?.unlock_cents || 100) / 100}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Pro Minute</span>
                <span className="font-semibold">€{((selectedDevice.pricing?.per_minute_cents || 15) / 100).toFixed(2)}</span>
              </div>
            </div>
            
            {/* Organization */}
            {selectedDevice.organization && (
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Betrieben von {selectedDevice.organization.name}</span>
              </div>
            )}
            
            <button
              onClick={() => handleUnlock(selectedDevice.id)}
              disabled={unlocking}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {unlocking ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  Jetzt entsperren
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
