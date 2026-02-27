/**
 * Haendler-Finder - Partner Map / Merchant Finder
 * Shows partner locations on a map and allows discovery
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Search, Store, Star, ChevronRight, Phone,
  Clock, Euro, Navigation, Filter, Bike, Gift, Loader2
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Demo partners (will be replaced by API data)
const DEMO_PARTNERS = [
  { id: 'p1', name: 'Café Mozart', category: 'Gastronomie', address: 'Hauptstrasse 12, Pristina', lat: 42.663, lng: 21.165, rating: 4.8, hasScooterParking: true, hasVouchers: true, discount: '10% Rabatt mit BidBlitz', phone: '+383 44 123 456', hours: 'Mo-Sa 8:00-22:00' },
  { id: 'p2', name: 'TechStore Pro', category: 'Elektronik', address: 'Nena Tereze Blvd, Pristina', lat: 42.660, lng: 21.160, rating: 4.5, hasScooterParking: true, hasVouchers: false, discount: '5% auf alle Produkte', phone: '+383 44 234 567', hours: 'Mo-Fr 9:00-19:00' },
  { id: 'p3', name: 'Restaurant Peja', category: 'Gastronomie', address: 'Bill Clinton Blvd, Pristina', lat: 42.658, lng: 21.155, rating: 4.9, hasScooterParking: false, hasVouchers: true, discount: 'Gratis Dessert ab 20 EUR', phone: '+383 44 345 678', hours: 'Mo-So 11:00-23:00' },
  { id: 'p4', name: 'Fashion House KS', category: 'Mode', address: 'Rexhep Luci 5, Pristina', lat: 42.665, lng: 21.170, rating: 4.3, hasScooterParking: true, hasVouchers: true, discount: '15% fuer VIP Mitglieder', phone: '+383 44 456 789', hours: 'Mo-Sa 10:00-20:00' },
  { id: 'p5', name: 'Gym Fitness Center', category: 'Sport', address: 'Agim Ramadani, Pristina', lat: 42.662, lng: 21.168, rating: 4.6, hasScooterParking: true, hasVouchers: false, discount: 'Probetraining gratis', phone: '+383 44 567 890', hours: 'Mo-Fr 6:00-22:00, Sa 8:00-18:00' },
  { id: 'p6', name: 'Dubai Mall Store', category: 'Elektronik', address: 'Dubai Marina Walk', lat: 25.078, lng: 55.138, rating: 4.7, hasScooterParking: true, hasVouchers: true, discount: '10% mit BidBlitz Pay', phone: '+971 4 123 4567', hours: 'Mo-So 10:00-22:00' },
  { id: 'p7', name: 'Shisha Lounge', category: 'Gastronomie', address: 'JBR Beach, Dubai', lat: 25.079, lng: 55.132, rating: 4.4, hasScooterParking: true, hasVouchers: true, discount: 'Happy Hour 16-18 Uhr', phone: '+971 4 234 5678', hours: 'Mo-So 14:00-02:00' },
  { id: 'p8', name: 'Gold Souk Juwelier', category: 'Schmuck', address: 'Downtown Dubai', lat: 25.197, lng: 55.274, rating: 4.9, hasScooterParking: false, hasVouchers: true, discount: '5% auf Goldschmuck', phone: '+971 4 345 6789', hours: 'Mo-Sa 10:00-21:00' },
];

const categories = ['Alle', 'Gastronomie', 'Elektronik', 'Mode', 'Sport', 'Schmuck'];

export default function HaendlerFinder() {
  const [partners, setPartners] = useState(DEMO_PARTNERS);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');

  const filtered = partners.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'Alle' || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-24" data-testid="haendler-finder-page">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white px-6 py-10 text-center">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Store className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Haendler-Finder</h1>
        <p className="text-amber-100 text-sm">Partner-Geschaefte in deiner Naehe entdecken</p>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Haendler suchen..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm"
            data-testid="partner-search"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4 text-sm text-slate-500">
          <span>{filtered.length} Haendler gefunden</span>
          <span className="flex items-center gap-1"><Bike className="w-4 h-4" /> {filtered.filter(p => p.hasScooterParking).length} mit Scooter-Parkplatz</span>
        </div>

        {/* Partner List */}
        <div className="mt-4 space-y-3">
          {filtered.map(partner => (
            <div
              key={partner.id}
              className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-amber-200 transition-all cursor-pointer"
              onClick={() => setSelectedPartner(selectedPartner?.id === partner.id ? null : partner)}
              data-testid={`partner-${partner.id}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-sm">{partner.name}</h3>
                      {partner.hasVouchers && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">GUTSCHEIN</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{partner.category}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {partner.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-slate-700">{partner.rating}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2 mt-2">
                  {partner.hasScooterParking && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full">
                      <Bike className="w-3 h-3" /> Scooter-Parkplatz
                    </span>
                  )}
                  {partner.discount && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-[10px] font-medium rounded-full">
                      <Gift className="w-3 h-3" /> {partner.discount}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedPartner?.id === partner.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" /> {partner.hours}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${partner.phone}`} className="text-blue-600">{partner.phone}</a>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a href={`https://maps.google.com/?q=${partner.lat},${partner.lng}`} target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl">
                      <Navigation className="w-4 h-4" /> Route
                    </a>
                    <a href={`tel:${partner.phone}`}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl">
                      <Phone className="w-4 h-4" /> Anrufen
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Become Partner CTA */}
        <div className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white text-center">
          <Store className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-lg">Haendler werden?</h3>
          <p className="text-amber-100 text-sm mt-1">Registrieren Sie Ihr Geschaeft als BidBlitz Partner und profitieren Sie von mehr Kunden.</p>
          <Link to="/partner-landing" className="inline-flex items-center gap-1 mt-4 px-6 py-2.5 bg-white text-amber-600 font-bold rounded-xl text-sm">
            Jetzt bewerben <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
