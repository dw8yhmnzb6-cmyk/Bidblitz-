/**
 * BidBlitz Mobility - Premium Dark Scooter App
 * Deep Navy (#061520) theme with glass morphism
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  Bike, QrCode, MapPin, Clock, Euro, Battery, X, Square,
  Navigation, History, Loader2, Zap, Menu, Wallet,
  HelpCircle, Settings, Bell, AlertTriangle, Volume2,
  Users, Star, Crown, CreditCard, Shield, ChevronRight,
  ArrowLeft, Search
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Dark map tiles
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' });

const scooterIcon = (battery) => {
  const color = battery > 50 ? '#10B981' : battery > 20 ? '#F59E0B' : '#EF4444';
  const glow = battery > 50 ? '0 0 12px #10B981' : battery > 20 ? '0 0 12px #F59E0B' : '0 0 12px #EF4444';
  return new L.DivIcon({
    className: '',
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.3);box-shadow:${glow},0 2px 8px rgba(0,0,0,0.5);"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1z"/><path d="M5 6h5v2H5zm14 7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg></div>`,
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18]
  });
};
const userIcon = new L.DivIcon({ className: '', html: '<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 0 20px rgba(59,130,246,0.5);"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

function FlyTo({ pos }) { const m = useMap(); useEffect(() => { if (pos) m.flyTo(pos, 15, { duration: 1 }); }, [pos, m]); return null; }

// ==================== SIDEBAR ====================
function Sidebar({ isOpen, onClose, user, stats, sub, walletBalance }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-[#0a1f2e] shadow-2xl flex flex-col border-r border-white/5">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white">{user?.name?.charAt(0) || '?'}</div>
            <div><h2 className="font-bold text-lg text-white">{user?.name || 'Gast'}</h2><p className="text-emerald-200 text-sm">{user?.email}</p></div>
          </div>
          <div className="flex gap-6 text-white">
            <div><p className="text-2xl font-bold">{stats.km}</p><p className="text-xs text-emerald-200">km</p></div>
            <div><p className="text-2xl font-bold">{stats.rides}</p><p className="text-xs text-emerald-200">Fahrten</p></div>
          </div>
        </div>
        {sub && <div className="mx-4 mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /><div><p className="text-sm font-bold text-amber-300">{sub.plan_name} Abo</p></div></div>}
        <div className="mx-4 mt-3 p-3 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-sm text-slate-400">Wallet</p>
          <p className="text-lg font-bold text-white">{'\u20AC'}{(walletBalance / 100).toFixed(2)}</p>
          <Link to="/pay" onClick={onClose} className="mt-2 block w-full py-2 bg-emerald-500 text-white text-center text-sm font-bold rounded-lg">Aufladen</Link>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {[
            { icon: Wallet, label: 'Wallet', to: '/pay' },
            { icon: Crown, label: 'Scooter-Abo', to: '/scooter-abo' },
            { icon: Users, label: 'Gruppen-Fahrt', to: '/gruppen-fahrt' },
            { icon: History, label: 'Fahrt-Verlauf', to: '/dashboard' },
            { icon: Star, label: 'Bewertungen', to: '/scooter-bewertungen' },
            { icon: Shield, label: 'Sicher fahren', to: '/scooter-guide' },
            { icon: HelpCircle, label: 'Hilfe', to: '/support-tickets' },
            { icon: Settings, label: 'Einstellungen', to: '/profile' },
          ].map((item, i) => (
            <Link key={i} to={item.to} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <item.icon className="w-5 h-5 text-slate-400" /><span className="text-slate-300 font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-white/5"><p className="text-xs text-slate-600 text-center">Alpha Scooter v1.0</p></div>
      </div>
    </div>
  );
}

// ==================== SCOOTER DETAIL ====================
function ScooterSheet({ device, onClose, onReserve, onRing, onReport, onUnlock, loading, hasAbo }) {
  if (!device) return null;
  const bat = device.battery_percent || 0;
  const bColor = bat > 50 ? 'text-emerald-400' : bat > 20 ? 'text-amber-400' : 'text-red-400';
  const fee = hasAbo ? 0 : (device.unlock_fee_cents || 100);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1500]" data-testid="scooter-sheet">
      <div className="bg-[#0a1f2e]/95 backdrop-blur-xl rounded-t-3xl shadow-2xl max-w-lg mx-auto border-t border-white/10">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
        <div className="px-5 pb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{device.name || device.serial}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className={`flex items-center gap-1 font-medium ${bColor}`}><Battery className="w-4 h-4" />{bat}%</span>
                <span className="text-slate-400">{device.range_km || '?'} km</span>
                {device.avg_rating > 0 && <span className="flex items-center gap-0.5 text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" />{device.avg_rating}</span>}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {hasAbo ? <><span className="line-through">{(fee/100).toFixed(2)}{'\u20AC'}</span> <span className="text-emerald-400 font-bold">GRATIS</span></> : <>{(fee/100).toFixed(2)}{'\u20AC'}</>}
                {' + '}{((device.per_minute_cents||25)/100).toFixed(2)}{'\u20AC'}/Min
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          {hasAbo && <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-3 text-xs"><Crown className="w-4 h-4 text-amber-400" /><span className="text-amber-300 font-medium">Abo aktiv</span></div>}

          <div className="flex gap-2 mb-3">
            <button onClick={() => onRing(device.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm font-medium hover:bg-white/10"><Volume2 className="w-4 h-4" /> Klingeln</button>
            <button onClick={() => onReport(device.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm font-medium hover:bg-white/10"><AlertTriangle className="w-4 h-4" /> Problem</button>
          </div>

          <button onClick={() => onReserve(device.id)} disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20 mb-2"
          >{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reservieren <span className="text-sm font-normal opacity-80">10 Min kostenlos</span></>}</button>

          <button onClick={() => onUnlock(device.id)} disabled={loading}
            className="w-full py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-white/15"
          ><Zap className="w-5 h-5 text-amber-400" /> Entsperren & Losfahren</button>
        </div>
      </div>
    </div>
  );
}

// ==================== ACTIVE RIDE ====================
function ActiveRide({ session, device, onEnd, loading }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!session) return;
    const start = new Date(session.started_at || session.requested_at).getTime();
    const i = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(i);
  }, [session]);

  const p = session?.pricing_snapshot || {};
  const total = (p.unlock_cents || 0) + Math.floor(elapsed / 60) * (p.per_minute_cents || 25);
  const m = Math.floor(elapsed / 60), s = elapsed % 60;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1500] bg-[#0a1f2e]/95 backdrop-blur-xl text-white p-5 rounded-t-3xl shadow-2xl border-t border-emerald-500/30" data-testid="active-ride">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center"><Bike className="w-6 h-6 text-emerald-400" /></div>
            <div><h3 className="font-bold">{device?.name || 'Scooter'}</h3><p className="text-emerald-400 text-xs">{device?.serial}</p></div>
          </div>
          <div className="text-right"><div className="text-3xl font-mono font-bold text-emerald-400">{m}:{s.toString().padStart(2, '0')}</div><p className="text-slate-500 text-xs">Fahrzeit</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: Euro, val: `${'\u20AC'}${(total/100).toFixed(2)}`, label: 'Gesamt', color: 'text-amber-400' },
            { icon: Zap, val: `${p.per_minute_cents||25}ct`, label: '/Min', color: 'text-cyan-400' },
            { icon: Battery, val: `${device?.battery_percent||'~'}%`, label: 'Akku', color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-0.5 ${s.color}`} />
              <div className="font-bold text-sm text-white">{s.val}</div>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={onEnd} disabled={loading} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Square className="w-6 h-6" /> Fahrt beenden</>}
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function ScooterApp() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [activeDevice, setActiveDevice] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [mapCenter, setMapCenter] = useState([42.6629, 21.1655]);
  const [flyTo, setFlyTo] = useState(null);
  const [geoZones, setGeoZones] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const totalRides = sessions.filter(s => s.status === 'ended').length;
  const totalKm = Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0) / 60 * 0.5, 0));

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => { const loc = [p.coords.latitude, p.coords.longitude]; setUserPos(loc); setMapCenter(loc); setFlyTo(loc); }, () => {}, { enableHighAccuracy: true });
  }, []);

  const fetchDevices = useCallback(async () => {
    try { const r = await axios.get(`${API}/devices/available`, { params: userPos ? { lat: userPos[0], lng: userPos[1], radius_km: 50 } : {} }); setDevices(r.data.devices || []); } catch (e) {}
  }, [userPos]);

  const fetchGeoZones = useCallback(async () => {
    try { const r = await axios.get(`${API}/geofencing/zones`); setGeoZones(r.data.zones || []); } catch (e) {}
  }, []);

  const checkSession = useCallback(async () => {
    if (!token) return;
    try {
      const [sessRes, subRes, walletRes] = await Promise.all([
        axios.get(`${API}/devices/my-sessions`, { headers }),
        axios.get(`${API}/scooter-features/my-subscription`, { headers }).catch(() => ({ data: { subscription: null } })),
        axios.get(`${API}/bidblitz-pay/main-balance`, { headers }).catch(() => ({ data: { bidblitz_balance: 0 } }))
      ]);
      const all = sessRes.data.sessions || [];
      setSessions(all);
      const active = all.find(s => ['requested', 'active'].includes(s.status));
      if (active) { setActiveSession(active); setActiveDevice(devices.find(d => d.id === active.device_id)); }
      setSubscription(subRes.data.subscription);
      setWalletBalance(Math.round((walletRes.data.bidblitz_balance || 0) * 100));
    } catch (e) {}
  }, [token, devices]);

  useEffect(() => { fetchDevices(); fetchGeoZones(); }, [fetchDevices, fetchGeoZones]);
  useEffect(() => { checkSession(); }, [checkSession]);
  useEffect(() => { const i = setInterval(fetchDevices, 30000); return () => clearInterval(i); }, [fetchDevices]);

  const hasAbo = subscription?.status === 'active';

  const handleReserve = async (id) => { if (!token) { navigate('/login'); return; } setLoading(true); try { await axios.post(`${API}/devices/reserve/${id}`, {}, { headers }); toast.success('Reserviert! 10 Min kostenlos.'); setSelectedDevice(null); fetchDevices(); } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); } finally { setLoading(false); } };
  const handleRing = async (id) => { try { await axios.post(`${API}/devices/ring/${id}`, {}, { headers }); toast.success('Scooter klingelt!'); } catch (e) { toast.error('Fehler'); } };
  const handleReport = async (id) => { try { await axios.post(`${API}/devices/report/${id}`, {}, { headers }); toast.success('Problem gemeldet!'); setSelectedDevice(null); } catch (e) { toast.error('Fehler'); } };
  const handleUnlock = async (id) => { if (!token) { navigate('/login'); return; } setLoading(true); try { const r = await axios.post(`${API}/devices/unlock/request`, { device_id: id }, { headers }); toast.success('Scooter entsperrt!'); setSelectedDevice(null); if (r.data.session_id) await axios.post(`${API}/devices/unlock/${r.data.session_id}/confirm`, {}, { headers }); checkSession(); fetchDevices(); } catch (e) { const msg = e.response?.data?.detail || 'Fehler'; toast.error(msg.includes('Guthaben') ? msg : msg, msg.includes('Guthaben') ? { action: { label: 'Aufladen', onClick: () => navigate('/pay') } } : undefined); } finally { setLoading(false); } };
  const handleEndRide = async () => { if (!activeSession) return; setLoading(true); try { const r = await axios.post(`${API}/devices/unlock/${activeSession.id}/end`, {}, { headers }); toast.success(`Fahrt beendet! ${r.data.duration_formatted} - ${r.data.cost_formatted}`); setActiveSession(null); setActiveDevice(null); fetchDevices(); checkSession(); } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); } finally { setLoading(false); } };

  return (
    <div className="fixed inset-0 bg-[#061520]" data-testid="scooter-app" style={{ top: '64px' }}>
      {/* DARK MAP */}
      <MapContainer center={mapCenter} zoom={14} className="h-full w-full z-0" zoomControl={false} attributionControl={false}>
        <TileLayer url={DARK_TILES} />
        {flyTo && <FlyTo pos={flyTo} />}
        {userPos && <Marker position={userPos} icon={userIcon} />}
        {devices.map(d => d.lat && d.lng && (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={scooterIcon(d.battery_percent || 50)}
            eventHandlers={{ click: () => setSelectedDevice(d) }}>
            <Popup><div className="text-center min-w-[120px]"><p className="font-bold text-sm">{d.name || d.serial}</p><p className="text-xs text-slate-500">{d.battery_percent}% | {d.range_km}km</p><button onClick={() => setSelectedDevice(d)} className="mt-1 px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg font-bold w-full">Details</button></div></Popup>
          </Marker>
        ))}
        {geoZones.map(z => (
          <Circle key={z.id} center={[z.center_lat, z.center_lng]} radius={z.radius_meters}
            pathOptions={{ color: z.type === 'no_parking' ? '#EF4444' : z.type === 'speed_limit' ? '#F59E0B' : z.type === 'parking' ? '#10B981' : '#3B82F6', fillColor: z.type === 'no_parking' ? '#EF4444' : z.type === 'speed_limit' ? '#F59E0B' : z.type === 'parking' ? '#10B981' : '#3B82F6', fillOpacity: 0.1, weight: 1 }}>
            <Popup><b>{z.name}</b><br/>{z.description || z.type}</Popup>
          </Circle>
        ))}
      </MapContainer>

      {/* TOP BAR */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between">
        <button onClick={() => setShowSidebar(true)} className="w-11 h-11 bg-[#0a1f2e]/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center border border-white/10"><Menu className="w-5 h-5 text-white" /></button>
        <div className="bg-[#0a1f2e]/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <span className="text-sm font-medium text-white">{devices.length} Scooter</span>
        </div>
        <button onClick={() => { if (userPos) setFlyTo([...userPos]); }} className="w-11 h-11 bg-[#0a1f2e]/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center border border-white/10"><Navigation className="w-5 h-5 text-cyan-400" /></button>
      </div>

      {/* ABO BADGE */}
      {hasAbo && <Link to="/scooter-abo" className="absolute top-16 right-3 z-[1000] w-11 h-11 bg-amber-500/20 backdrop-blur rounded-full shadow-lg flex items-center justify-center border border-amber-500/30"><Crown className="w-5 h-5 text-amber-400" /></Link>}

      {/* SCAN BUTTON */}
      {!activeSession && !selectedDevice && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
          <button onClick={() => setShowScanner(true)} className="flex items-center gap-3 px-8 py-4 bg-[#0a1f2e]/90 backdrop-blur-md rounded-full shadow-xl border border-white/10 hover:border-emerald-500/30 transition-all">
            <QrCode className="w-6 h-6 text-emerald-400" /><span className="text-lg font-bold text-white">Scannen</span>
          </button>
        </div>
      )}

      {/* DETAIL SHEET */}
      {selectedDevice && !activeSession && <ScooterSheet device={selectedDevice} onClose={() => setSelectedDevice(null)} onReserve={handleReserve} onRing={handleRing} onReport={handleReport} onUnlock={handleUnlock} loading={loading} hasAbo={hasAbo} />}

      {/* ACTIVE RIDE */}
      {activeSession && <ActiveRide session={activeSession} device={activeDevice} onEnd={handleEndRide} loading={loading} />}

      {/* QR SCANNER */}
      {showScanner && (
        <div className="fixed inset-0 z-[3000] bg-[#061520]">
          <div className="p-4 flex items-center justify-between"><button onClick={() => setShowScanner(false)} className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center"><X className="w-6 h-6 text-white" /></button><p className="text-white font-bold">QR-Code scannen</p><div className="w-11" /></div>
          <div className="flex-1 flex items-center justify-center px-8" style={{height:'calc(100vh - 200px)'}}>
            <div className="w-72 h-72 rounded-2xl overflow-hidden relative">
              <Scanner onScan={(r) => { if (r?.[0]) { const t = r[0].rawValue; const d = devices.find(x => t.includes(x.serial) || t.includes(x.id)); if (d) { setShowScanner(false); handleUnlock(d.id); } else toast.error('Nicht gefunden'); }}} constraints={{ facingMode: 'environment' }} styles={{ container: { width: '100%', height: '100%' } }} />
              <div className="absolute inset-0 pointer-events-none"><div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" /><div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" /><div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" /><div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" /></div>
            </div>
          </div>
          <div className="p-6"><p className="text-white/40 text-center text-sm mb-3">Oder Seriennummer eingeben:</p><input type="text" placeholder="z.B. SCOOTER-DEMO-001" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm text-center" onKeyPress={(e) => { if (e.key === 'Enter') { const d = devices.find(x => x.serial.toLowerCase() === e.target.value.trim().toLowerCase()); if (d) { setShowScanner(false); handleUnlock(d.id); } else toast.error('Nicht gefunden'); }}} /></div>
        </div>
      )}

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} user={user} stats={{ km: totalKm, rides: totalRides }} sub={subscription} walletBalance={walletBalance} />
    </div>
  );
}
