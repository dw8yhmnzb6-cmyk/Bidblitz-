/**
 * Mobile Top-Up Page - Handy-Guthaben aufladen
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Smartphone, ChevronRight, Check, Loader2, Zap } from 'lucide-react';

const PROVIDERS = [
  { id: 'du', name: 'du', country: 'UAE', color: 'bg-green-500', amounts: [25, 50, 100, 200] },
  { id: 'etisalat', name: 'Etisalat', country: 'UAE', color: 'bg-emerald-600', amounts: [25, 50, 100, 200] },
  { id: 'ipko', name: 'IPKO', country: 'Kosovo', color: 'bg-red-500', amounts: [5, 10, 20, 50] },
  { id: 'vala', name: 'Vala', country: 'Kosovo', color: 'bg-blue-600', amounts: [5, 10, 20, 50] },
  { id: 'telekom', name: 'Telekom', country: 'Deutschland', color: 'bg-pink-500', amounts: [15, 25, 50] },
  { id: 'vodafone', name: 'Vodafone', country: 'Deutschland', color: 'bg-red-600', amounts: [15, 25, 50] },
  { id: 'o2', name: 'o2', country: 'Deutschland', color: 'bg-blue-500', amounts: [15, 25, 50] },
  { id: 'turkcell', name: 'Turkcell', country: 'Türkei', color: 'bg-yellow-500', amounts: [50, 100, 200, 500] },
];

export default function MobileTopUp() {
  const { token } = useAuth();
  const [step, setStep] = useState('provider'); // provider, amount, confirm
  const [provider, setProvider] = useState(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success(`${amount} AED/EUR Guthaben wird aufgeladen auf ${phone}`);
      setStep('provider');
      setProvider(null);
      setPhone('');
      setAmount(0);
      setLoading(false);
    }, 2000);
  };

  const countries = [...new Set(PROVIDERS.map(p => p.country))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 pb-24" data-testid="topup-page">
      <div className="max-w-lg mx-auto pt-4">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Handy aufladen</h1>
          <p className="text-sm text-slate-500 mt-1">Prepaid-Guthaben sofort aufladen</p>
        </div>

        {step === 'provider' && (
          <div className="space-y-4">
            {countries.map(country => (
              <div key={country}>
                <h3 className="text-sm font-bold text-slate-600 mb-2">{country}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {PROVIDERS.filter(p => p.country === country).map(p => (
                    <button key={p.id} onClick={() => { setProvider(p); setStep('amount'); }}
                      className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 hover:border-blue-300 transition-all text-left">
                      <div className={`w-10 h-10 ${p.color} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.country}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 'amount' && provider && (
          <div className="space-y-4">
            <button onClick={() => setStep('provider')} className="text-sm text-blue-600 font-medium">Zurück</button>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${provider.color} rounded-xl flex items-center justify-center text-white font-bold`}>
                  {provider.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{provider.name}</p>
                  <p className="text-xs text-slate-500">{provider.country}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm text-slate-600 font-medium">Telefonnummer</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+971 50 123 4567" className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              </div>
              <label className="text-sm text-slate-600 font-medium">Betrag wählen</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {provider.amounts.map(a => (
                  <button key={a} onClick={() => { setAmount(a); setStep('confirm'); }}
                    className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      amount === a ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}>
                    {a} {provider.country === 'UAE' ? 'AED' : provider.country === 'Türkei' ? 'TRY' : 'EUR'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && provider && (
          <div className="space-y-4">
            <button onClick={() => setStep('amount')} className="text-sm text-blue-600 font-medium">Zurück</button>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Bestätigung</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Anbieter</span><span className="font-medium">{provider.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Nummer</span><span className="font-medium">{phone || '-'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Betrag</span><span className="font-bold text-lg">{amount} {provider.country === 'UAE' ? 'AED' : 'EUR'}</span></div>
              </div>
              <button onClick={handleConfirm} disabled={loading || !phone}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Jetzt aufladen</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
