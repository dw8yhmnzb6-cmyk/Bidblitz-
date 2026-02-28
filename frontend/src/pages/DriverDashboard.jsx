/**
 * BidBlitz Taxi - Driver Dashboard
 * Accept rides, navigate, track earnings
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Car, MapPin, Navigation, Power, PowerOff, Clock, Euro, Star,
  Phone, CheckCircle, Loader2, ChevronRight, ArrowLeft, User,
  AlertTriangle, X, Zap, Flag, Play, Square, DollarSign
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const pickupIcon = new L.DivIcon({ className:'', html:'<div style="background:#10B981;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(16,185,129,0.5);"></div>', iconSize:[14,14], iconAnchor:[7,7] });
const dropoffIcon = new L.DivIcon({ className:'', html:'<div style="background:#3B82F6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.5);"></div>', iconSize:[14,14], iconAnchor:[7,7] });

function FlyTo({pos}){const m=useMap();useEffect(()=>{if(pos)m.flyTo(pos,14,{duration:1});},[pos,m]);return null;}

export default function DriverDashboard() {
  const { token, user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [rides, setRides] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [view, setView] = useState('main'); // main, register
  const [regForm, setRegForm] = useState({ vehicle_type:'standard', vehicle_make:'', vehicle_model:'', vehicle_color:'', license_plate:'', phone:'' });
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => setUserPos([p.coords.latitude, p.coords.longitude]), () => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [dRes, rRes] = await Promise.all([
        axios.get(`${API}/taxi/driver/stats`, { headers }).catch(() => null),
        axios.get(`${API}/taxi/driver/pending-rides`, { headers }).catch(() => ({ data: { rides: [] } }))
      ]);
      if (dRes?.data?.driver) { setDriver(dRes.data.driver); setIsOnline(dRes.data.driver.is_online); }
      setRides(rRes?.data?.rides || []);
    } catch (e) {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 5000); return () => clearInterval(i); }, [fetchData]);

  // Send location every 10s when online
  useEffect(() => {
    if (!isOnline || !userPos || !token) return;
    const i = setInterval(() => {
      axios.post(`${API}/taxi/driver/location`, { lat: userPos[0], lng: userPos[1] }, { headers }).catch(() => {});
    }, 10000);
    return () => clearInterval(i);
  }, [isOnline, userPos, token]);

  const toggleOnline = async () => {
    if (!userPos) { toast.error('GPS nicht verfügbar'); return; }
    setActing(true);
    try {
      if (isOnline) {
        await axios.post(`${API}/taxi/driver/offline`, {}, { headers });
        setIsOnline(false); toast.success('Offline');
      } else {
        await axios.post(`${API}/taxi/driver/online`, { lat: userPos[0], lng: userPos[1] }, { headers });
        setIsOnline(true); toast.success('Online - Warten auf Fahrten');
      }
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setActing(false); }
  };

  const handleAction = async (rideId, action) => {
    setActing(true);
    try {
      const r = await axios.post(`${API}/taxi/driver/action/${rideId}`, { action }, { headers });
      toast.success(r.data.message);
      if (action === 'complete') {
        toast.success(`Verdienst: ${r.data.driver_earning} EUR`, { duration: 5000 });
      }
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setActing(false); }
  };

  const handleRegister = async () => {
    setActing(true);
    try {
      await axios.post(`${API}/taxi/driver/register`, regForm, { headers });
      toast.success('Registrierung eingereicht!');
      setView('main');
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setActing(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#061520] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;

  // Register view
  if (!driver || view === 'register') return (
    <div className="min-h-screen bg-[#061520] p-4 pb-24" data-testid="driver-register">
      <div className="max-w-lg mx-auto pt-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3"><Car className="w-8 h-8 text-emerald-400" /></div>
          <h1 className="text-2xl font-bold text-white">Fahrer werden</h1>
          <p className="text-slate-400 text-sm mt-1">Verdienen Sie mit BidBlitz Taxi</p>
        </div>
        <div className="space-y-3">
          {[
            { key:'vehicle_type', label:'Fahrzeugtyp', type:'select', options:['standard','premium','van'] },
            { key:'vehicle_make', label:'Marke', placeholder:'z.B. Mercedes' },
            { key:'vehicle_model', label:'Modell', placeholder:'z.B. E-Klasse' },
            { key:'vehicle_color', label:'Farbe', placeholder:'z.B. Schwarz' },
            { key:'license_plate', label:'Kennzeichen', placeholder:'z.B. 01-234-AB' },
            { key:'phone', label:'Telefon', placeholder:'+383 44 123 456' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-slate-400 font-medium">{f.label}</label>
              {f.type === 'select' ? (
                <select value={regForm[f.key]} onChange={e => setRegForm({...regForm, [f.key]: e.target.value})} className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm">
                  {f.options.map(o => <option key={o} value={o} className="bg-slate-800">{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
                </select>
              ) : (
                <input value={regForm[f.key]} onChange={e => setRegForm({...regForm, [f.key]: e.target.value})} placeholder={f.placeholder} className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30" />
              )}
            </div>
          ))}
        </div>
        <button onClick={handleRegister} disabled={acting} className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
          {acting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Car className="w-5 h-5" /> Registrieren</>}
        </button>
      </div>
    </div>
  );

  const activeRide = rides.find(r => ['assigned','accepted','arrived','started'].includes(r.status));
  const STATUS_ACTIONS = {
    assigned: { label: 'Annehmen', action: 'accept', color: 'from-emerald-500 to-teal-500', icon: CheckCircle },
    accepted: { label: 'Am Abholort', action: 'arrive', color: 'from-blue-500 to-cyan-500', icon: Flag },
    arrived: { label: 'Fahrt starten', action: 'start', color: 'from-amber-500 to-orange-500', icon: Play },
    started: { label: 'Fahrt beenden', action: 'complete', color: 'from-red-500 to-pink-500', icon: Square },
  };

  return (
    <div className="fixed inset-0 bg-[#061520]" style={{ top: '64px' }} data-testid="driver-dashboard">
      {/* MAP */}
      <MapContainer center={userPos || [42.6629, 21.1655]} zoom={14} className="h-full w-full z-0" zoomControl={false} attributionControl={false}>
        <TileLayer url={DARK_TILES} />
        {userPos && <><Marker position={userPos} /><FlyTo pos={userPos} /></>}
        {activeRide && (
          <>
            <Marker position={[activeRide.pickup.lat, activeRide.pickup.lng]} icon={pickupIcon} />
            <Marker position={[activeRide.dropoff.lat, activeRide.dropoff.lng]} icon={dropoffIcon} />
          </>
        )}
      </MapContainer>

      {/* TOP BAR */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between">
        <a href="/" className="w-11 h-11 bg-[#0a1f2e]/90 backdrop-blur rounded-full flex items-center justify-center border border-white/10">
          <ArrowLeft className="w-5 h-5 text-white" />
        </a>
        <div className={`px-4 py-2 rounded-full backdrop-blur border ${isOnline ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
          <span className={`text-sm font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <button onClick={toggleOnline} disabled={acting || driver?.status !== 'approved'} className={`w-11 h-11 rounded-full flex items-center justify-center border ${isOnline ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/20 border-emerald-500/30'} disabled:opacity-50`}>
          {isOnline ? <PowerOff className="w-5 h-5 text-red-400" /> : <Power className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Driver Status Banner */}
      {driver?.status === 'pending' && (
        <div className="absolute top-16 left-3 right-3 z-[1000] bg-amber-500/20 backdrop-blur border border-amber-500/30 rounded-xl p-3 text-center">
          <p className="text-amber-300 text-sm font-bold">Registrierung wird geprüft</p>
          <p className="text-amber-200 text-xs">Sie werden benachrichtigt wenn Sie freigeschaltet werden</p>
        </div>
      )}

      {/* BOTTOM PANEL */}
      <div className="fixed inset-x-0 bottom-0 z-[1500] bg-[#0a1f2e]/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10">
        <div className="max-w-lg mx-auto p-5">
          {/* Stats Row */}
          {!activeRide && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <Car className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{driver?.total_rides || 0}</p>
                  <p className="text-[10px] text-slate-500">Fahrten</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <Euro className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{((driver?.total_earnings_cents || 0) / 100).toFixed(0)}</p>
                  <p className="text-[10px] text-slate-500">Verdienst EUR</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{driver?.rating_avg || '5.0'}</p>
                  <p className="text-[10px] text-slate-500">Bewertung</p>
                </div>
              </div>
              {isOnline && rides.length === 0 && (
                <div className="text-center py-4">
                  <Loader2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-spin" />
                  <p className="text-slate-400 text-sm">Warten auf Fahrten...</p>
                </div>
              )}
            </>
          )}

          {/* Active Ride */}
          {activeRide && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-emerald-400 text-xs font-bold uppercase">{activeRide.status === 'assigned' ? 'Neue Fahrt!' : activeRide.status === 'accepted' ? 'Zum Abholort' : activeRide.status === 'arrived' ? 'Fahrgast wartet' : 'Unterwegs'}</p>
                  <h3 className="text-white font-bold">{activeRide.rider_name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-400">{'\u20AC'}{activeRide.estimated_fare?.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{activeRide.distance_km} km</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3 space-y-2">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full flex-shrink-0" /><span className="text-white text-sm truncate">{activeRide.pickup?.address}</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-400 rounded-full flex-shrink-0" /><span className="text-white text-sm truncate">{activeRide.dropoff?.address}</span></div>
              </div>

              {activeRide.surcharge_active && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-3">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 text-xs font-medium">Nachtzuschlag aktiv (+{activeRide.surcharge_amount?.toFixed(2)} EUR)</span>
                </div>
              )}

              {STATUS_ACTIONS[activeRide.status] && (
                <button onClick={() => handleAction(activeRide.id, STATUS_ACTIONS[activeRide.status].action)} disabled={acting}
                  className={`w-full py-4 bg-gradient-to-r ${STATUS_ACTIONS[activeRide.status].color} text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg mb-2`}>
                  {acting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{React.createElement(STATUS_ACTIONS[activeRide.status].icon, {className:'w-6 h-6'})} {STATUS_ACTIONS[activeRide.status].label}</>}
                </button>
              )}

              {['assigned','accepted'].includes(activeRide.status) && (
                <button onClick={() => handleAction(activeRide.id, 'cancel')} className="w-full py-2 bg-white/5 border border-white/10 text-slate-400 text-sm rounded-xl">
                  Stornieren
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
