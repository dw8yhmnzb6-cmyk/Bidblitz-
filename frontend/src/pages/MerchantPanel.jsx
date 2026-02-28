/**
 * Merchant Panel Pro - QR Scanner for cash topups + commission tracking
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { QrCode, Euro, CheckCircle, Loader2, Store, History, X, User, ArrowLeft } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MerchantPanel() {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState(null);
  const [txns, setTxns] = useState([]);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/merchant/my-stats`, { headers }).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${API}/merchant/my-transactions`, { headers }).then(r => setTxns(r.data.transactions || [])).catch(() => {});
  }, [token]);

  const handleTopup = async () => {
    if (!userId.trim() || !amount) { toast.error('User-ID und Betrag eingeben'); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${API}/merchant/cash-topup`, { user_id: userId, amount: parseFloat(amount) }, { headers });
      setDone(r.data);
      setCustomerName(r.data.customer_name);
      toast.success(r.data.message);
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setLoading(false); }
  };

  // SUCCESS SCREEN
  if (done) return (
    <div className="min-h-screen bg-emerald-500 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <CheckCircle className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Aufladung erfolgreich!</h1>
        <p className="text-emerald-100 text-lg mb-1">{done.customer_name}</p>
        <div className="bg-white/20 rounded-xl p-4 mt-4 space-y-2">
          <div className="flex justify-between"><span className="text-emerald-100">Brutto</span><span className="font-bold">{done.gross_amount?.toFixed(2)} EUR</span></div>
          <div className="flex justify-between"><span className="text-emerald-100">Gutgeschrieben</span><span className="font-bold">{done.net_credited?.toFixed(2)} EUR</span></div>
          <div className="flex justify-between border-t border-white/20 pt-2"><span className="text-emerald-100">Ihre Provision</span><span className="font-bold text-lg">+{done.commission?.toFixed(2)} EUR</span></div>
        </div>
        <button onClick={() => { setDone(null); setUserId(''); setAmount(''); }} className="mt-6 px-8 py-3 bg-white text-emerald-600 font-bold rounded-xl w-full">Nächste Aufladung</button>
      </div>
    </div>
  );

  // QR SCANNER
  if (scanning) return (
    <div className="fixed inset-0 z-[3000] bg-[#061520]" data-testid="merchant-scanner">
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => setScanning(false)} className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center"><X className="w-6 h-6 text-white" /></button>
        <p className="text-white font-bold">Kunden-QR scannen</p>
        <div className="w-11" />
      </div>
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="w-64 h-64 border-4 border-white/30 rounded-2xl relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-400 animate-pulse" />
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 text-white/40 text-xs">Kamera wird geladen...</p>
        </div>
      </div>
      <div className="p-6">
        <p className="text-white/40 text-center text-sm mb-3">Oder Kunden-ID manuell eingeben:</p>
        <input type="text" placeholder="User-ID eingeben" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm text-center font-mono placeholder-white/30"
          onKeyPress={(e) => { if (e.key === 'Enter' && e.target.value) { setUserId(e.target.value); setScanning(false); } }} />
      </div>
    </div>
  );

  // MAIN
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 pb-24" data-testid="merchant-panel">
      <div className="max-w-lg mx-auto pt-4">
        <a href="/" className="flex items-center gap-1 text-amber-400 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Zurück</a>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3"><Store className="w-7 h-7 text-white" /></div>
          <h1 className="text-xl font-bold text-white">Merchant Panel</h1>
          <p className="text-slate-400 text-sm">Kunden-Wallet aufladen</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><p className="text-slate-400 text-xs">Aufladungen</p><p className="text-xl font-bold text-white">{stats.total_topups || 0}</p></div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center"><p className="text-emerald-400 text-xs">Provisionen</p><p className="text-xl font-bold text-emerald-400">{((stats.total_commission_cents||0)/100).toFixed(2)} EUR</p></div>
          </div>
        )}

        {/* Topup Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="mb-4">
            <label className="text-xs text-slate-400 font-medium">Kunden-ID</label>
            <div className="flex gap-2 mt-1">
              <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="User-ID" className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 font-mono" />
              <button onClick={() => setScanning(true)} className="px-4 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center hover:bg-amber-500/30"><QrCode className="w-5 h-5 text-amber-400" /></button>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-slate-400 font-medium">Betrag (EUR)</label>
            <div className="flex items-center gap-2 mt-1">
              <Euro className="w-5 h-5 text-slate-400" />
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="1" className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-2xl font-bold placeholder-white/30" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[5, 10, 20, 50].map(a => (<button key={a} onClick={() => setAmount(String(a))} className={`py-2.5 rounded-xl text-sm font-bold border ${amount === String(a) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white/5 text-white border-white/10'}`}>{a}{'\u20AC'}</button>))}
          </div>
          <button onClick={handleTopup} disabled={loading || !userId || !amount} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Euro className="w-5 h-5" /> Aufladen</>}
          </button>
        </div>

        {/* Transactions */}
        {txns.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2"><History className="w-4 h-4" /> Letzte Transaktionen</h3>
            <div className="space-y-2">
              {txns.slice(0, 10).map(t => (
                <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div><p className="text-white text-sm">{t.type === 'commission' ? 'Provision' : 'Aufladung'}</p><p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString('de-DE')}</p></div>
                  <span className={`font-bold ${t.type === 'commission' ? 'text-emerald-400' : 'text-white'}`}>{t.type === 'commission' ? '+' : ''}{(t.amount_cents / 100).toFixed(2)}{'\u20AC'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
