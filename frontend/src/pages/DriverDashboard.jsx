/**
 * BidBlitz Driver Pro - Offer Popup with 15s Timer, Trip Flow, Earnings
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Car, MapPin, Navigation, Power, PowerOff, Clock, Euro, Star,
  Phone, CheckCircle, Loader2, ArrowLeft, Zap, Flag, Play,
  Square, DollarSign, AlertTriangle, X, Crown, Users, Wallet
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const PRISTINA = [42.6629, 21.1655];

const pickupDot = new L.DivIcon({className:'',html:'<div style="background:#10B981;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(16,185,129,0.5);"></div>',iconSize:[14,14],iconAnchor:[7,7]});
const dropoffDot = new L.DivIcon({className:'',html:'<div style="background:#3B82F6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.5);"></div>',iconSize:[14,14],iconAnchor:[7,7]});
function FlyTo({pos}){const m=useMap();useEffect(()=>{if(pos)m.flyTo(pos,14,{duration:1});},[pos,m]);return null;}

const VT_ICONS = {standard:Car, premium:Crown, van:Users};

export default function DriverDashboard() {
  const {token,user} = useAuth();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [offer, setOffer] = useState(null); // incoming ride offer
  const [offerTimer, setOfferTimer] = useState(15);
  const [acting, setActing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const [view, setView] = useState('main'); // main, register, earnings
  const [earnings, setEarnings] = useState([]);
  const [regForm, setRegForm] = useState({vehicle_type:'standard',vehicle_make:'',vehicle_model:'',vehicle_color:'',license_plate:'',phone:''});
  const headers = {Authorization:`Bearer ${token}`};

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => setUserPos([p.coords.latitude, p.coords.longitude]), () => setUserPos(PRISTINA), {enableHighAccuracy:true});
  }, []);

  // Poll for data
  const fetchData = useCallback(async () => {
    if(!token) return;
    try {
      const [dRes, rRes] = await Promise.all([
        axios.get(`${API}/taxi/driver/stats`, {headers}).catch(()=>null),
        axios.get(`${API}/taxi/driver/pending-rides`, {headers}).catch(()=>({data:{rides:[]}}))
      ]);
      if(dRes?.data?.driver) { setDriver(dRes.data.driver); setIsOnline(dRes.data.driver.is_online); }
      const rides = rRes?.data?.rides || [];
      // Check for new offers
      const assigned = rides.find(r => r.status === 'assigned');
      if(assigned && (!offer || offer.id !== assigned.id)) {
        setOffer(assigned);
        setOfferTimer(15);
      }
      const active = rides.find(r => ['accepted','arrived','started'].includes(r.status));
      if(active) setActiveRide(active);
      else if(!assigned) setActiveRide(null);
    } catch(e){}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 3000); return () => clearInterval(i); }, [fetchData]);

  // Offer countdown timer
  useEffect(() => {
    if(!offer) return;
    if(offerTimer <= 0) { setOffer(null); return; }
    const t = setTimeout(() => setOfferTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [offer, offerTimer]);

  // Send location
  useEffect(() => {
    if(!isOnline || !userPos || !token) return;
    const i = setInterval(() => {
      axios.post(`${API}/taxi/driver/location`, {lat:userPos[0],lng:userPos[1]}, {headers}).catch(()=>{});
    }, 8000);
    return () => clearInterval(i);
  }, [isOnline, userPos, token]);

  const toggleOnline = async () => {
    if(!userPos) { toast.error('GPS nicht verfügbar'); return; }
    setActing(true);
    try {
      if(isOnline) { await axios.post(`${API}/taxi/driver/offline`,{},{headers}); setIsOnline(false); toast.success('Offline'); }
      else { await axios.post(`${API}/taxi/driver/online`,{lat:userPos[0],lng:userPos[1]},{headers}); setIsOnline(true); toast.success('Online - Warten auf Fahrten'); }
    } catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }
    finally { setActing(false); }
  };

  const handleOfferAction = async (action) => {
    if(!offer) return;
    setActing(true);
    try {
      const r = await axios.post(`${API}/taxi/driver/action/${offer.id}`, {action}, {headers});
      toast.success(r.data.message);
      if(action === 'accept') { setActiveRide({...offer, status:'accepted'}); }
      setOffer(null);
      fetchData();
    } catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }
    finally { setActing(false); }
  };

  const handleRideAction = async (action) => {
    if(!activeRide) return;
    setActing(true);
    try {
      const r = await axios.post(`${API}/taxi/driver/action/${activeRide.id}`, {action}, {headers});
      toast.success(r.data.message || 'Erfolgreich');
      if(action === 'complete') {
        toast.success(`Verdienst: ${r.data.driver_earning} EUR`, {duration:5000});
        setActiveRide(null);
      }
      fetchData();
    } catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }
    finally { setActing(false); }
  };

  const handleRegister = async () => {
    setActing(true);
    try { await axios.post(`${API}/taxi/driver/register`, regForm, {headers}); toast.success('Registrierung eingereicht!'); setView('main'); fetchData(); }
    catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }
    finally { setActing(false); }
  };

  if(loading) return <div className="min-h-screen bg-[#061520] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;

  // REGISTER
  if(!driver || view === 'register') return (
    <div className="min-h-screen bg-[#061520] p-4 pb-24">
      <div className="max-w-lg mx-auto pt-6">
        <div className="text-center mb-8"><div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3"><Car className="w-8 h-8 text-emerald-400" /></div><h1 className="text-2xl font-bold text-white">Fahrer werden</h1><p className="text-slate-400 text-sm mt-1">Verdienen Sie mit BidBlitz Taxi</p></div>
        <div className="space-y-3">
          {[{k:'vehicle_type',l:'Fahrzeugtyp',t:'select',o:['standard','premium','van']},{k:'vehicle_make',l:'Marke',p:'Mercedes'},{k:'vehicle_model',l:'Modell',p:'E-Klasse'},{k:'vehicle_color',l:'Farbe',p:'Schwarz'},{k:'license_plate',l:'Kennzeichen',p:'01-234-AB'},{k:'phone',l:'Telefon',p:'+383 44 123 456'}].map(f=>(
            <div key={f.k}><label className="text-xs text-slate-400">{f.l}</label>
              {f.t==='select' ? <select value={regForm[f.k]} onChange={e=>setRegForm({...regForm,[f.k]:e.target.value})} className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm">{f.o.map(o=><option key={o} value={o} className="bg-slate-800">{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}</select>
              : <input value={regForm[f.k]} onChange={e=>setRegForm({...regForm,[f.k]:e.target.value})} placeholder={f.p} className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30" />}
            </div>))}
        </div>
        <button onClick={handleRegister} disabled={acting} className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl disabled:opacity-50">{acting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Registrieren'}</button>
      </div>
    </div>
  );

  const ACTIONS = {
    accepted:{label:'Am Abholort',action:'arrive',color:'from-blue-500 to-cyan-500',icon:Flag},
    arrived:{label:'Fahrt starten',action:'start',color:'from-amber-500 to-orange-500',icon:Play},
    started:{label:'Fahrt abschließen',action:'complete',color:'from-red-500 to-pink-500',icon:Square}
  };

  return (
    <div className="fixed inset-0 bg-[#061520]" style={{top:'64px'}} data-testid="driver-dashboard">
      <MapContainer center={userPos||PRISTINA} zoom={14} className="h-full w-full z-0" zoomControl={false} attributionControl={false}>
        <TileLayer url={DARK_TILES} />{userPos && <><Marker position={userPos} /><FlyTo pos={userPos} /></>}
        {activeRide && <><Marker position={[activeRide.pickup.lat,activeRide.pickup.lng]} icon={pickupDot} /><Marker position={[activeRide.dropoff.lat,activeRide.dropoff.lng]} icon={dropoffDot} /><Polyline positions={[[activeRide.pickup.lat,activeRide.pickup.lng],[activeRide.dropoff.lat,activeRide.dropoff.lng]]} pathOptions={{color:'#3B82F6',weight:3,dashArray:'8,8'}} /></>}
      </MapContainer>

      {/* TOP BAR */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between">
        <a href="/" className="w-11 h-11 bg-[#0a1f2e]/90 backdrop-blur rounded-full flex items-center justify-center border border-white/10"><ArrowLeft className="w-5 h-5 text-white" /></a>
        <div className={`px-4 py-2 rounded-full backdrop-blur border ${isOnline?'bg-emerald-500/20 border-emerald-500/30':'bg-red-500/20 border-red-500/30'}`}><span className={`text-sm font-bold ${isOnline?'text-emerald-400':'text-red-400'}`}>{isOnline?'ONLINE':'OFFLINE'}</span></div>
        <button onClick={toggleOnline} disabled={acting||driver?.status!=='approved'} className={`w-11 h-11 rounded-full flex items-center justify-center border disabled:opacity-50 ${isOnline?'bg-red-500/20 border-red-500/30':'bg-emerald-500/20 border-emerald-500/30'}`}>{isOnline?<PowerOff className="w-5 h-5 text-red-400" />:<Power className="w-5 h-5 text-emerald-400" />}</button>
      </div>

      {/* OFFER POPUP - 15s Timer */}
      {offer && !activeRide && (
        <div className="fixed inset-0 z-[2000] bg-black/70 flex items-end" data-testid="offer-popup">
          <div className="w-full bg-[#0a1f2e] rounded-t-3xl border-t border-emerald-500/50 p-5 animate-in slide-in-from-bottom">
            {/* Timer Bar */}
            <div className="mb-4"><div className="w-full bg-white/10 rounded-full h-2"><div className="bg-emerald-400 rounded-full h-2 transition-all" style={{width:`${(offerTimer/15)*100}%`}} /></div><p className="text-center text-emerald-400 text-xs mt-1 font-mono">{offerTimer}s</p></div>

            <div className="flex items-center justify-between mb-4">
              <div><p className="text-emerald-400 text-xs font-bold">NEUE FAHRT!</p><h2 className="text-white font-bold text-xl">{offer.rider_name}</h2><p className="text-slate-400 text-xs capitalize">{offer.vehicle_type}</p></div>
              <div className="text-right"><p className="text-3xl font-bold text-emerald-400">{(offer.estimated_fare||0).toFixed(2)}{'\u20AC'}</p><p className="text-xs text-slate-400">{offer.distance_km} km</p></div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 space-y-2">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" /><span className="text-white text-sm truncate">{offer.pickup?.address}</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-400 rounded-full" /><span className="text-white text-sm truncate">{offer.dropoff?.address}</span></div>
            </div>

            {offer.surcharge_active && <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-3"><Zap className="w-4 h-4 text-amber-400" /><span className="text-amber-300 text-xs">Nachtzuschlag +{offer.surcharge_amount?.toFixed(2)} EUR</span></div>}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>handleOfferAction('cancel')} disabled={acting} className="py-4 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-lg flex items-center justify-center gap-2"><X className="w-6 h-6" /> Ablehnen</button>
              <button onClick={()=>handleOfferAction('accept')} disabled={acting} className="py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">{acting?<Loader2 className="w-6 h-6 animate-spin" />:<><CheckCircle className="w-6 h-6" /> Annehmen</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM PANEL */}
      <div className="fixed inset-x-0 bottom-0 z-[1500] bg-[#0a1f2e]/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10">
        <div className="max-w-lg mx-auto p-5">
          {/* No active ride - show stats */}
          {!activeRide && !offer && (
            <>
              {driver?.status === 'pending' && <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 mb-3 text-center"><p className="text-amber-300 text-sm font-bold">Registrierung wird geprüft</p></div>}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><Car className="w-5 h-5 text-cyan-400 mx-auto mb-1" /><p className="text-lg font-bold text-white">{driver?.total_rides||0}</p><p className="text-[10px] text-slate-500">Fahrten</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><Euro className="w-5 h-5 text-emerald-400 mx-auto mb-1" /><p className="text-lg font-bold text-white">{((driver?.total_earnings_cents||0)/100).toFixed(0)}</p><p className="text-[10px] text-slate-500">EUR</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><Star className="w-5 h-5 text-amber-400 mx-auto mb-1" /><p className="text-lg font-bold text-white">{driver?.rating_avg||'5.0'}</p><p className="text-[10px] text-slate-500">Rating</p></div>
              </div>
              {isOnline && <div className="text-center py-3"><Loader2 className="w-6 h-6 text-emerald-400 mx-auto mb-1 animate-spin" /><p className="text-slate-400 text-sm">Warten auf Fahrten...</p></div>}
            </>
          )}

          {/* Active Ride */}
          {activeRide && !offer && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div><p className="text-emerald-400 text-xs font-bold uppercase">{activeRide.status==='accepted'?'Zum Abholort':activeRide.status==='arrived'?'Fahrgast wartet':'Unterwegs'}</p><h3 className="text-white font-bold">{activeRide.rider_name}</h3></div>
                <div className="text-right"><p className="text-xl font-bold text-emerald-400">{(activeRide.estimated_fare||0).toFixed(2)}{'\u20AC'}</p><p className="text-xs text-slate-400">{activeRide.distance_km} km</p></div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3 space-y-2">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" /><span className="text-white text-sm truncate">{activeRide.pickup?.address}</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-400 rounded-full" /><span className="text-white text-sm truncate">{activeRide.dropoff?.address}</span></div>
              </div>
              {ACTIONS[activeRide.status] && (
                <button onClick={()=>handleRideAction(ACTIONS[activeRide.status].action)} disabled={acting} className={`w-full py-4 bg-gradient-to-r ${ACTIONS[activeRide.status].color} text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg mb-2`}>
                  {acting?<Loader2 className="w-6 h-6 animate-spin" />:<>{React.createElement(ACTIONS[activeRide.status].icon,{className:'w-6 h-6'})} {ACTIONS[activeRide.status].label}</>}
                </button>
              )}
              {activeRide.status==='accepted' && <button onClick={()=>handleRideAction('cancel')} className="w-full py-2 bg-white/5 border border-white/10 text-slate-400 text-sm rounded-xl">Stornieren</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
