/**
 * Currency Converter - EUR/AED/USD + more
 */
import React, { useState, useEffect } from 'react';
import { ArrowUpDown, RefreshCw } from 'lucide-react';

const RATES = {
  EUR: { AED: 4.02, USD: 1.09, GBP: 0.86, CHF: 0.95, TRY: 35.2, ALL: 103.5 },
  AED: { EUR: 0.249, USD: 0.272, GBP: 0.214, CHF: 0.236, TRY: 8.76, ALL: 25.74 },
  USD: { EUR: 0.917, AED: 3.67, GBP: 0.79, CHF: 0.87, TRY: 32.3, ALL: 94.9 },
};

const FLAGS = { EUR: '\u{1F1EA}\u{1F1FA}', AED: '\u{1F1E6}\u{1F1EA}', USD: '\u{1F1FA}\u{1F1F8}', GBP: '\u{1F1EC}\u{1F1E7}', CHF: '\u{1F1E8}\u{1F1ED}', TRY: '\u{1F1F9}\u{1F1F7}', ALL: '\u{1F1E6}\u{1F1F1}' };
const NAMES = { EUR: 'Euro', AED: 'UAE Dirham', USD: 'US Dollar', GBP: 'Brit. Pfund', CHF: 'Schweizer Fr.', TRY: 'Türk. Lira', ALL: 'Alban. Lek' };

export default function CurrencyConverter() {
  const [from, setFrom] = useState('EUR');
  const [to, setTo] = useState('AED');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState(0);

  useEffect(() => {
    const a = parseFloat(amount) || 0;
    if (from === to) { setResult(a); return; }
    const rate = RATES[from]?.[to] || 1;
    setResult(Math.round(a * rate * 100) / 100);
  }, [from, to, amount]);

  const swap = () => { setFrom(to); setTo(from); };
  const currencies = Object.keys(NAMES);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 pb-24" data-testid="currency-page">
      <div className="max-w-lg mx-auto pt-4">
        <h1 className="text-xl font-bold text-slate-800 mb-6 text-center">Währungsrechner</h1>
        
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-5">
            <label className="text-xs text-slate-500 font-medium">Betrag</label>
            <div className="flex items-center gap-3 mt-1">
              <select value={from} onChange={e => setFrom(e.target.value)} className="text-lg font-bold border-0 bg-transparent">
                {currencies.map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}
              </select>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="flex-1 text-2xl font-bold text-right outline-none" placeholder="0" />
            </div>
            <p className="text-xs text-slate-400 mt-1">{NAMES[from]}</p>
          </div>
          
          <div className="flex items-center justify-center py-2 border-y border-slate-100">
            <button onClick={swap} className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
              <ArrowUpDown className="w-5 h-5 text-blue-600" />
            </button>
          </div>
          
          <div className="p-5 bg-blue-50/50">
            <label className="text-xs text-slate-500 font-medium">Ergebnis</label>
            <div className="flex items-center gap-3 mt-1">
              <select value={to} onChange={e => setTo(e.target.value)} className="text-lg font-bold border-0 bg-transparent">
                {currencies.map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}
              </select>
              <p className="flex-1 text-2xl font-bold text-right text-blue-700">{result.toLocaleString('de-DE', {minimumFractionDigits: 2})}</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">{NAMES[to]}</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">Kurse sind Richtwerte. Stand: {new Date().toLocaleDateString('de-DE')}</p>

        {/* Quick conversions */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Beliebte Kurse</h3>
          <div className="space-y-2">
            {[['EUR','AED'],['EUR','USD'],['AED','USD'],['EUR','TRY'],['EUR','ALL']].map(([f,t]) => (
              <div key={f+t} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600">{FLAGS[f]} 1 {f}</span>
                <span className="text-sm font-bold text-slate-800">= {FLAGS[t]} {RATES[f]?.[t] || '?'} {t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
