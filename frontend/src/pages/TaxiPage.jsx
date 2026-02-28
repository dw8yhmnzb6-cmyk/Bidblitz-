/**
 * BidBlitz Taxi - Ride-Hailing (Uber/Bolt Style)
 * Book rides, live tracking, auto-payment
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Car, MapPin, Navigation, X, Loader2, Clock, Euro, Star, Phone, ChevronRight, ArrowLeft, Search, CheckCircle, Square } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const carIcon = new L.DivIcon({ className: '', html: '<div style="background:#3B82F6;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.5);"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg></div>', iconSize: [36, 36], iconAnchor: [18, 18] });
const userIcon = new L.DivIcon({ className: '', html: '<div style="background:#10B981;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(16,185,129,0.3);"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });

function FlyTo({ pos }) { const m = useMap(); useEffect(() => { if (pos) m.flyTo(pos, 14, { duration: 1 }); }, [pos, m]); return null; }

export default function TaxiPage() {
  const { token, user } = useAuth();
  const [step, setStep] = useState('book'); // book, searching, ride, done
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => setUserPos([p.coords.latitude, p.coords.longitude]), () => {});
    if (token) {
      axios.get(`${API}/taxi/my-ride`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.data.ride) { setActiveRide(r.data.ride); setStep('ride'); } }).catch(() => {});
      axios.get(`${API}/taxi/history`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setHistory(r.data.rides || [])).catch(() => {});
    }
  }, [token]);

  const handleEstimate = async () => {
    if (!userPos) { toast.error('Standort nicht verfügbar'); return; }
    // Simulate dropoff ~3-8km away
    const dlat = userPos[0] + (Math.random() - 0.5) * 0.06;
    const dlng = userPos[1] + (Math.random() - 0.5) * 0.06;
    try {
      const r = await axios.get(`${API}/taxi/estimate?pickup_lat=${userPos[0]}&pickup_lng=${userPos[1]}&dropoff_lat=${dlat}&dropoff_lng=${dlng}`);
      setEstimate({ ...r.data, dropoff_lat: dlat, dropoff_lng: dlng });
    } catch (e) { toast.error('Fehler bei Schätzung'); }
  };

  const handleBook = async () => {
    if (!token) { toast.error('Bitte anmelden'); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${API}/taxi/request-ride`, {
        pickup_lat: userPos[0], pickup_lng: userPos[1], pickup_address: pickup || 'Mein Standort',
        dropoff_lat: estimate.dropoff_lat, dropoff_lng: estimate.dropoff_lng, dropoff_address: dropoff || 'Ziel'
      }, { headers: { Authorization: `Bearer ${token}` } });
      setActiveRide(r.data.ride);
      setStep('searching');
      toast.success(r.data.message);
      // Simulate driver accepting after 3s
      setTimeout(() => setStep('ride'), 3000);
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!activeRide) return;
    try {
      await axios.post(`${API}/taxi/cancel-ride/${activeRide.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Fahrt storniert');
      setActiveRide(null); setStep('book'); setEstimate(null);
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const STATUS_LABELS = { requested: 'Suche Fahrer...', accepted: 'Fahrer unterwegs', arrived: 'Fahrer da!', in_progress: 'Unterwegs', completed: 'Angekommen', cancelled: 'Storniert' };

  return (
    <div className="fixed inset-0 bg-[#061520]" style={{ top: '64px' }} data-testid="taxi-page">
      {/* MAP */}
      <MapContainer center={userPos || [42.6629, 21.1655]} zoom={14} className="h-full w-full z-0" zoomControl={false} attributionControl={false}>
        <TileLayer url={DARK_TILES} />
        {userPos && <><Marker position={userPos} icon={userIcon} /><FlyTo pos={userPos} /></>}
      </MapContainer>

      {/* TOP BAR */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between">
        <a href="/" className="w-11 h-11 bg-[#0a1f2e]/90 backdrop-blur rounded-full flex items-center justify-center border border-white/10">
          <ArrowLeft className="w-5 h-5 text-white" />
        </a>
        <div className="bg-[#0a1f2e]/90 backdrop-blur px-4 py-2 rounded-full border border-white/10">
          <span className="text-sm font-bold text-white">BidBlitz Taxi</span>
        </div>
        <button className="w-11 h-11 bg-[#0a1f2e]/90 backdrop-blur rounded-full flex items-center justify-center border border-white/10">
          <Clock className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* BOOKING SHEET */}
      {step === 'book' && (
        <div className="fixed inset-x-0 bottom-0 z-[1500] bg-[#0a1f2e]/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 shadow-2xl">
          <div className="max-w-lg mx-auto p-5">
            <div className="flex justify-center pt-1 pb-3"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
            <h2 className="text-lg font-bold text-white mb-4">Wohin?</h2>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Abholort (Mein Standort)" className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40" data-testid="pickup-input" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Ziel eingeben" className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40" data-testid="dropoff-input" />
              </div>
            </div>

            {!estimate ? (
              <button onClick={handleEstimate} className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20" data-testid="estimate-btn">
                <Search className="w-5 h-5" /> Preis berechnen
              </button>
            ) : (
              <div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400 text-sm">Strecke</span>
                    <span className="text-white font-medium">{estimate.distance_km} km</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400 text-sm">Dauer</span>
                    <span className="text-white font-medium">~{Math.round(estimate.duration_min)} Min</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-white font-bold">Geschätzter Preis</span>
                    <span className="text-2xl font-bold text-emerald-400">{'\u20AC'}{estimate.fare_eur}</span>
                  </div>
                </div>
                <button onClick={handleBook} disabled={loading} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20" data-testid="book-btn">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Car className="w-6 h-6" /> Jetzt buchen</>}
                </button>
              </div>
            )}

            {/* Recent Rides */}
            {history.length > 0 && !estimate && (
              <div className="mt-4">
                <p className="text-slate-400 text-xs mb-2">Letzte Fahrten</p>
                {history.slice(0, 3).map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-white/5">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <div className="flex-1 min-w-0"><p className="text-white text-xs truncate">{r.dropoff?.address || 'Ziel'}</p></div>
                    <span className="text-emerald-400 text-xs font-bold">{r.final_fare_cents ? `${(r.final_fare_cents/100).toFixed(2)}` : (r.estimated_fare_cents/100).toFixed(2)} EUR</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCHING */}
      {step === 'searching' && (
        <div className="fixed inset-x-0 bottom-0 z-[1500] bg-[#0a1f2e]/95 backdrop-blur-xl rounded-t-3xl border-t border-blue-500/30 p-6 text-center">
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-spin" />
          <h2 className="text-white font-bold text-lg">Suche Fahrer...</h2>
          <p className="text-slate-400 text-sm mt-1">Bitte warten</p>
          <button onClick={handleCancel} className="mt-4 px-6 py-2 bg-white/10 text-slate-300 rounded-xl text-sm">Stornieren</button>
        </div>
      )}

      {/* ACTIVE RIDE */}
      {step === 'ride' && activeRide && (
        <div className="fixed inset-x-0 bottom-0 z-[1500] bg-[#0a1f2e]/95 backdrop-blur-xl rounded-t-3xl border-t border-emerald-500/30">
          <div className="max-w-lg mx-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-emerald-400 text-sm font-bold">{STATUS_LABELS[activeRide.status] || activeRide.status}</p>
                <h2 className="text-white font-bold">{activeRide.driver_name || 'Fahrer wird zugewiesen'}</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{'\u20AC'}{(activeRide.estimated_fare_cents/100).toFixed(2)}</p>
                <p className="text-xs text-slate-400">{activeRide.distance_km} km</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 space-y-2">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" /><span className="text-white text-sm truncate">{activeRide.pickup?.address}</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-400 rounded-full" /><span className="text-white text-sm truncate">{activeRide.dropoff?.address}</span></div>
            </div>

            {activeRide.status !== 'completed' && (
              <button onClick={handleCancel} className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl">
                Fahrt stornieren
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
