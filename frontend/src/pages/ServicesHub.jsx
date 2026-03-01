/**
 * All-in-One Services Page - Hotels, Insurance, Crypto, Marketplace, Parking, P2P
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Building2, Shield, Bitcoin, Tag, ParkingCircle, Send, Star, Euro, Clock, ChevronRight, Loader2, CheckCircle, ArrowLeft, Search, MapPin } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

function HotelView({ token }) {
  const [hotels, setHotels] = useState([]);
  useEffect(() => { axios.get(`${API}/services/hotels`).then(r => setHotels(r.data.hotels || [])); }, []);
  return (<div className="space-y-3">{hotels.map(h => (
    <div key={h.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex">
      <img src={h.image} className="w-24 h-24 object-cover" loading="lazy" />
      <div className="p-3 flex-1"><h3 className="text-white font-bold text-sm">{h.name}</h3><p className="text-slate-400 text-xs">{h.city} | {'⭐'.repeat(Math.min(h.stars,5))}</p><div className="flex items-center justify-between mt-2"><span className="text-emerald-400 font-bold">ab {h.price_from} EUR</span><span className="text-amber-400 text-xs flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400" />{h.rating}</span></div></div>
    </div>))}</div>);
}

function InsuranceView({ token }) {
  const [plans, setPlans] = useState([]);
  useEffect(() => { axios.get(`${API}/services/insurance/plans`).then(r => setPlans(r.data.plans || [])); }, []);
  const buy = async (id) => { try { await axios.post(`${API}/services/insurance/buy`, {plan_id:id}, {headers:{Authorization:`Bearer ${token}`}}); toast.success('Versicherung abgeschlossen!'); } catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }};
  return (<div className="space-y-3">{plans.map(p => (
    <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between mb-2"><h3 className="text-white font-bold text-sm">{p.name}</h3><span className="text-emerald-400 font-bold">{p.price} EUR</span></div>
      <p className="text-slate-400 text-xs mb-2">{p.coverage}</p><p className="text-slate-500 text-[10px] mb-3">{p.duration}</p>
      <button onClick={()=>buy(p.id)} className="w-full py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold rounded-lg">Abschließen</button>
    </div>))}</div>);
}

function CryptoView({ token }) {
  const [wallet, setWallet] = useState({btc:0,eth:0,usdt:0});
  const [rates, setRates] = useState({});
  const [coin, setCoin] = useState('btc');
  const [amount, setAmount] = useState('');
  useEffect(() => { if(token) axios.get(`${API}/services/crypto/balance`, {headers:{Authorization:`Bearer ${token}`}}).then(r => { setWallet(r.data.wallet||{}); setRates(r.data.rates||{}); }); }, [token]);
  const buy = async () => { try { await axios.post(`${API}/services/crypto/buy`, {coin, amount_eur:parseFloat(amount)}, {headers:{Authorization:`Bearer ${token}`}}); toast.success('Gekauft!'); setAmount(''); } catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }};
  return (<div>
    <div className="grid grid-cols-3 gap-2 mb-4">{[['btc','Bitcoin','#F7931A'],['eth','Ethereum','#627EEA'],['usdt','USDT','#26A17B']].map(([c,n,col]) => (
      <div key={c} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><p className="text-xs" style={{color:col}}>{n}</p><p className="text-white font-bold">{(wallet[c]||0).toFixed(c==='btc'?6:4)}</p><p className="text-slate-500 text-[10px]">{rates[c+'_eur']||0} EUR</p></div>
    ))}</div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex gap-2 mb-3">{['btc','eth','usdt'].map(c => (<button key={c} onClick={()=>setCoin(c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${coin===c?'bg-amber-500 text-white':'bg-white/5 text-slate-400 border border-white/10'}`}>{c.toUpperCase()}</button>))}</div>
      <div className="flex gap-2"><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="EUR Betrag" className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /><button onClick={buy} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl">Kaufen</button></div>
    </div>
  </div>);
}

function MarketplaceView({ token }) {
  const [listings, setListings] = useState([]);
  useEffect(() => { axios.get(`${API}/services/marketplace`).then(r => setListings(r.data.listings||[])); }, []);
  const buyV = async (id) => { try { await axios.post(`${API}/services/marketplace/buy/${id}`, {}, {headers:{Authorization:`Bearer ${token}`}}); toast.success('Gekauft!'); } catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }};
  return (<div>{listings.length===0?<p className="text-slate-500 text-center py-8">Keine Gutscheine zum Verkauf</p>:listings.map(l => (
    <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2 flex justify-between items-center">
      <div><p className="text-white font-bold text-sm">{l.title}</p><p className="text-slate-400 text-xs">Wert: {l.value_eur} EUR | von {l.seller_name}</p></div>
      <button onClick={()=>buyV(l.id)} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg">{l.price_eur} EUR</button>
    </div>))}</div>);
}

function ParkingView({ token }) {
  const [spots, setSpots] = useState([]);
  useEffect(() => { axios.get(`${API}/services/parking/nearby`).then(r => setSpots(r.data.spots||[])); }, []);
  const book = async (id) => { try { await axios.post(`${API}/services/parking/start`, {spot_id:id,duration_hours:1}, {headers:{Authorization:`Bearer ${token}`}}); toast.success('Parkplatz gebucht!'); } catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }};
  return (<div className="space-y-2">{spots.map(s => (
    <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
      <div><p className="text-white font-bold text-sm">{s.name}</p><p className="text-slate-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{s.address}</p><p className="text-emerald-400 text-xs mt-1">{s.free_spots}/{s.total} frei | {s.price_per_hour} EUR/h</p></div>
      <button onClick={()=>book(s.id)} className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg">Buchen</button>
    </div>))}</div>);
}

function TransferView({ token }) {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transfers, setTransfers] = useState([]);
  useEffect(() => { if(token) axios.get(`${API}/services/transfers`, {headers:{Authorization:`Bearer ${token}`}}).then(r => setTransfers(r.data.transfers||[])); }, [token]);
  const send = async () => { try { await axios.post(`${API}/services/transfer`, {to_email:email,amount:parseFloat(amount),note}, {headers:{Authorization:`Bearer ${token}`}}); toast.success('Gesendet!'); setEmail(''); setAmount(''); setNote(''); } catch(e) { toast.error(e.response?.data?.detail||'Fehler'); }};
  return (<div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email des Empfängers" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30" />
      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Betrag EUR" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30" />
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Nachricht (optional)" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30" />
      <button onClick={send} className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Send className="w-5 h-5" /> Senden</button>
    </div>
    {transfers.slice(0,5).map(t => (<div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex justify-between"><div><p className="text-white text-sm">{t.from_name} → {t.to_name}</p><p className="text-slate-500 text-xs">{t.note||''}</p></div><span className="text-emerald-400 font-bold">{(t.amount_cents/100).toFixed(2)} EUR</span></div>))}
  </div>);
}

const TABS = [
  {id:'hotels', label:'Hotels', icon:Building2, color:'text-blue-400'},
  {id:'insurance', label:'Versicherung', icon:Shield, color:'text-emerald-400'},
  {id:'crypto', label:'Krypto', icon:Bitcoin, color:'text-amber-400'},
  {id:'marketplace', label:'Marktplatz', icon:Tag, color:'text-pink-400'},
  {id:'parking', label:'Parken', icon:ParkingCircle, color:'text-cyan-400'},
  {id:'transfer', label:'Senden', icon:Send, color:'text-violet-400'},
];

export default function ServicesHub() {
  const { token } = useAuth();
  const [tab, setTab] = useState('hotels');
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 pb-24" data-testid="services-hub">
      <div className="px-4 pt-6 pb-4 text-center"><h1 className="text-xl font-bold text-white">Services</h1><p className="text-slate-400 text-sm">Hotels, Versicherung, Krypto & mehr</p></div>
      <div className="flex gap-1 px-4 mb-4 overflow-x-auto scrollbar-hide">{TABS.map(t => (
        <button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${tab===t.id?'bg-white/10 text-white border border-white/20':'text-slate-500'}`}><t.icon className={`w-4 h-4 ${t.color}`} />{t.label}</button>
      ))}</div>
      <div className="px-4 max-w-lg mx-auto">
        {tab==='hotels' && <HotelView token={token} />}
        {tab==='insurance' && <InsuranceView token={token} />}
        {tab==='crypto' && <CryptoView token={token} />}
        {tab==='marketplace' && <MarketplaceView token={token} />}
        {tab==='parking' && <ParkingView token={token} />}
        {tab==='transfer' && <TransferView token={token} />}
      </div>
    </div>);
}
