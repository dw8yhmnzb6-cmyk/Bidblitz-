import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "/api";

function money(cents) {
  const eur = (Number(cents || 0) / 100).toFixed(2);
  return `${eur} €`;
}

export default function HotelsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [guests, setGuests] = useState(1);
  const [maxPrice, setMaxPrice] = useState("");

  const params = useMemo(() => {
    const p = {};
    if (region) p.region = region;
    if (city) p.city = city;
    if (q) p.q = q;
    if (guests) p.guests = guests;
    if (maxPrice !== "") p.max_price_cents = Math.round(Number(maxPrice) * 100);
    p.limit = 50;
    return p;
  }, [region, city, q, guests, maxPrice]);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/hotels-airbnb/listings`, { params });
      setItems(res.data.listings || res.data || []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Hotels</h1>
          <Link
            to="/"
            className="text-sm px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
          >
            Zurück
          </Link>
        </div>

        {/* Filter Card */}
        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-white/70">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Alle</option>
                <option value="Kosovo">Kosovo</option>
                <option value="Deutschland">Deutschland</option>
                <option value="UAE">UAE</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/70">Stadt</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="z.B. Pristina"
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-white/70">Suche</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Hotel, Adresse, Beschreibung…"
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-white/70">Gäste</label>
              <input
                type="number"
                min="1"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value || 1))}
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-white/70">Max €/Nacht</label>
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="z.B. 80"
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold"
            >
              Suchen
            </button>
            <button
              onClick={() => { setRegion(""); setCity(""); setQ(""); setGuests(1); setMaxPrice(""); }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-5">
          {loading ? (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              Lädt…
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              Keine Treffer. Filter lockern oder anderes Stichwort.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((it) => (
                <Link
                  key={it.id}
                  to={`/hotels/${it.id}`}
                  className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  {/* Image */}
                  {it.photos && it.photos[0] && (
                    <div className="h-40 rounded-xl overflow-hidden mb-3">
                      <img 
                        src={it.photos[0]} 
                        alt={it.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold group-hover:underline">
                        {it.title}
                      </div>
                      <div className="text-sm text-white/70">
                        {it.city} · {it.region}
                      </div>
                      {it.rating && (
                        <div className="text-sm text-amber-400 mt-1">
                          ★ {it.rating} ({it.reviews} Bewertungen)
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/70">ab</div>
                      <div className="text-lg font-bold">{money(it.price_per_night_cents)}</div>
                      <div className="text-xs text-white/60">pro Nacht</div>
                    </div>
                  </div>

                  {it.description ? (
                    <div className="mt-3 text-sm text-white/75 line-clamp-2">
                      {it.description}
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                    <span>Max Gäste: {it.max_guests}</span>
                    <span>Details →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
