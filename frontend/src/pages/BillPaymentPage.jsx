/**
 * Bill Payment Page - Pay utility bills (Strom, Wasser, Internet, TV, Telefon)
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Zap, Droplets, Wifi, Phone, Tv, ArrowLeft, Search, Loader2, CheckCircle, ChevronRight, Euro, FileText } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const CAT_ICONS = { strom: Zap, wasser: Droplets, internet: Wifi, telefon: Phone, tv: Tv };
const CAT_LABELS = { strom: 'Strom', wasser: 'Wasser', internet: 'Internet', telefon: 'Telefon', tv: 'TV & Kabel' };

export default function BillPaymentPage() {
  const { token } = useAuth();
  const [step, setStep] = useState('category'); // category, provider, lookup, confirm, done
  const [providers, setProviders] = useState({});
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [customerNum, setCustomerNum] = useState('');
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get(`${API}/bills/providers`).then(r => setProviders(r.data.providers || {})).catch(() => {});
    if (token) axios.get(`${API}/bills/history`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setHistory(r.data.payments || [])).catch(() => {});
  }, [token]);

  const handleLookup = async () => {
    if (!customerNum.trim()) { toast.error('Bitte Kundennummer eingeben'); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${API}/bills/lookup`, { provider_id: selectedProvider.id, customer_number: customerNum }, { headers: { Authorization: `Bearer ${token}` } });
      setBill(r.data.bill);
      setStep('confirm');
    } catch (e) { toast.error(e.response?.data?.detail || 'Rechnung nicht gefunden'); }
    finally { setLoading(false); }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const r = await axios.post(`${API}/bills/pay`, { provider_id: selectedProvider.id, customer_number: customerNum, amount_cents: bill.amount_cents, payment_method: 'wallet' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(r.data.message);
      setStep('done');
    } catch (e) { toast.error(e.response?.data?.detail || 'Zahlung fehlgeschlagen'); }
    finally { setPaying(false); }
  };

  const reset = () => { setStep('category'); setSelectedCat(null); setSelectedProvider(null); setCustomerNum(''); setBill(null); };

  // DONE
  if (step === 'done') return (
    <div className="min-h-screen bg-emerald-500 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <CheckCircle className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Rechnung bezahlt!</h1>
        <p className="text-emerald-100">{bill?.amount_eur} EUR an {selectedProvider?.name}</p>
        <button onClick={reset} className="mt-6 px-8 py-3 bg-white text-emerald-600 font-bold rounded-xl">Weitere Rechnung</button>
      </div>
    </div>
  );

  // CONFIRM
  if (step === 'confirm' && bill) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 pb-24" data-testid="bill-confirm">
      <div className="max-w-lg mx-auto pt-4">
        <button onClick={() => setStep('lookup')} className="flex items-center gap-1 text-cyan-400 text-sm font-medium mb-6"><ArrowLeft className="w-4 h-4" /> Zurück</button>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="text-center mb-6">
            <FileText className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white">Rechnung bestätigen</h2>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-white/10"><span className="text-slate-400 text-sm">Anbieter</span><span className="text-white font-medium text-sm">{bill.provider?.name}</span></div>
            <div className="flex justify-between py-2 border-b border-white/10"><span className="text-slate-400 text-sm">Kundennr.</span><span className="text-white font-medium text-sm">{bill.customer_number}</span></div>
            <div className="flex justify-between py-2 border-b border-white/10"><span className="text-slate-400 text-sm">Fällig</span><span className="text-white font-medium text-sm">{bill.due_date}</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-400 text-sm">Betrag</span><span className="text-2xl font-bold text-emerald-400">{'\u20AC'}{bill.amount_eur}</span></div>
          </div>
          <button onClick={handlePay} disabled={paying} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20">
            {paying ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Euro className="w-5 h-5" /> Jetzt bezahlen</>}
          </button>
          <p className="text-center text-xs text-slate-500 mt-3">Wird von Ihrem BidBlitz Wallet abgebucht</p>
        </div>
      </div>
    </div>
  );

  // LOOKUP
  if (step === 'lookup' && selectedProvider) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 pb-24">
      <div className="max-w-lg mx-auto pt-4">
        <button onClick={() => setStep('provider')} className="flex items-center gap-1 text-cyan-400 text-sm font-medium mb-6"><ArrowLeft className="w-4 h-4" /> Zurück</button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: selectedProvider.color + '20' }}>
            {React.createElement(CAT_ICONS[selectedCat] || FileText, { className: 'w-7 h-7', style: { color: selectedProvider.color } })}
          </div>
          <h2 className="text-xl font-bold text-white">{selectedProvider.name}</h2>
          <p className="text-slate-400 text-sm mt-1">Kundennummer eingeben</p>
        </div>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
          <input type="text" value={customerNum} onChange={e => setCustomerNum(e.target.value)} placeholder="z.B. 1234567890" className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg text-center font-mono placeholder-white/30 mb-4" autoFocus data-testid="customer-number" />
          <button onClick={handleLookup} disabled={loading || !customerNum.trim()} className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Rechnung suchen</>}
          </button>
        </div>
      </div>
    </div>
  );

  // PROVIDER
  if (step === 'provider' && selectedCat) {
    const catProviders = providers[selectedCat] || [];
    const Icon = CAT_ICONS[selectedCat] || FileText;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 pb-24">
        <div className="max-w-lg mx-auto pt-4">
          <button onClick={() => setStep('category')} className="flex items-center gap-1 text-cyan-400 text-sm font-medium mb-6"><ArrowLeft className="w-4 h-4" /> Zurück</button>
          <h2 className="text-xl font-bold text-white mb-1">{CAT_LABELS[selectedCat]} Anbieter</h2>
          <p className="text-slate-400 text-sm mb-6">Wählen Sie Ihren Anbieter</p>
          <div className="space-y-2">
            {catProviders.map(p => (
              <button key={p.id} onClick={() => { setSelectedProvider(p); setStep('lookup'); }} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-cyan-500/30 transition-all text-left" data-testid={`provider-${p.id}`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: p.color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <div className="flex-1"><p className="font-bold text-white text-sm">{p.name}</p><p className="text-xs text-slate-500">{p.country}</p></div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // CATEGORY (default)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 pb-24" data-testid="bill-payment-page">
      <div className="max-w-lg mx-auto pt-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Rechnung bezahlen</h1>
          <p className="text-slate-400 text-sm mt-1">Strom, Wasser, Internet & mehr</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {Object.keys(PROVIDERS).map(cat => {
            const Icon = CAT_ICONS[cat] || FileText;
            return (
              <button key={cat} onClick={() => { setSelectedCat(cat); setStep('provider'); }} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-cyan-500/30 transition-all" data-testid={`cat-${cat}`}>
                <Icon className="w-7 h-7 text-cyan-400" />
                <span className="text-xs font-medium text-white">{CAT_LABELS[cat]}</span>
                <span className="text-[10px] text-slate-500">{(providers[cat] || []).length} Anbieter</span>
              </button>
            );
          })}
        </div>

        {/* Recent Payments */}
        {history.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-400 mb-3">Letzte Zahlungen</h3>
            <div className="space-y-2">
              {history.slice(0, 5).map(p => (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div><p className="text-white text-sm font-medium">{p.provider_name}</p><p className="text-xs text-slate-500">{p.customer_number} | {new Date(p.created_at).toLocaleDateString('de-DE')}</p></div>
                  <div className="text-right"><p className="text-emerald-400 font-bold">{'\u20AC'}{(p.amount_cents/100).toFixed(2)}</p><span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">{p.status}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
