/**
 * Scooter Guide - How to use BidBlitz Mobility scooters
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bike, QrCode, MapPin, Shield, Battery, Euro, 
  AlertTriangle, CheckCircle, Phone, ArrowRight, Zap,
  Volume2, Square, CreditCard
} from 'lucide-react';

const steps = [
  { icon: CreditCard, title: 'Wallet aufladen', desc: 'Laden Sie Ihr BidBlitz Wallet auf. Die Entsperrgebuehr betraegt 1 EUR, danach 0.25 EUR/Min.', color: 'bg-blue-500' },
  { icon: MapPin, title: 'Scooter finden', desc: 'Oeffnen Sie die Scooter-App und sehen Sie verfuegbare Scooter auf der Karte in Ihrer Naehe.', color: 'bg-emerald-500' },
  { icon: QrCode, title: 'QR-Code scannen', desc: 'Scannen Sie den QR-Code am Scooter oder geben Sie die Seriennummer ein, um zu entsperren.', color: 'bg-violet-500' },
  { icon: Zap, title: 'Losfahren', desc: 'Nach der Entsperrung koennen Sie sofort losfahren. Der Timer und die Kosten laufen automatisch.', color: 'bg-amber-500' },
  { icon: Square, title: 'Fahrt beenden', desc: 'Druecken Sie "Fahrt beenden" in der App. Parken Sie ordentlich und blockieren Sie keine Wege.', color: 'bg-red-500' },
];

const rules = [
  'Fahren Sie immer auf Radwegen oder Strassen, nicht auf Gehwegen',
  'Maximale Geschwindigkeit: 20 km/h',
  'Helm wird empfohlen (Pflicht unter 18)',
  'Nicht zu zweit auf einem Scooter fahren',
  'Nicht unter Alkohol- oder Drogeneinfluss fahren',
  'Ordentlich parken, keine Wege blockieren',
  'Mindestalter: 18 Jahre',
];

export default function ScooterGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-24" data-testid="scooter-guide-page">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white px-6 py-12 text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bike className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">So funktioniert BidBlitz Mobility</h1>
        <p className="text-emerald-100 text-sm sm:text-base max-w-md mx-auto">E-Scooter und E-Bikes mieten - einfach, guenstig und umweltfreundlich</p>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Steps */}
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">In 5 Schritten losfahren</h2>
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 items-start bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">SCHRITT {i + 1}</span>
                </div>
                <h3 className="font-bold text-slate-800 mt-0.5">{step.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Euro className="w-5 h-5" /> Preise</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">1{'\u20AC'}</p>
              <p className="text-emerald-100 text-sm">Entsperrgebuehr</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">0.25{'\u20AC'}</p>
              <p className="text-emerald-100 text-sm">Pro Minute</p>
            </div>
          </div>
          <p className="text-emerald-100 text-xs mt-3 text-center">Reservierung: 10 Minuten kostenlos</p>
        </div>

        {/* Safety Rules */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" /> Sicherheitsregeln
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Problem Section */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-bold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Problem mit einem Scooter?</h3>
          <p className="text-sm text-amber-700 mt-2">Melden Sie defekte oder falsch geparkte Scooter direkt in der App ueber den "Problem melden" Button oder kontaktieren Sie unseren Support.</p>
          <Link to="/support-tickets" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-amber-700 hover:text-amber-900">
            Support kontaktieren <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link to="/scooter" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all">
            <Bike className="w-5 h-5" /> Jetzt Scooter finden
          </Link>
        </div>
      </div>
    </div>
  );
}
