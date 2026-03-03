import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "/api";

function money(cents) {
  const eur = (Number(cents || 0) / 100).toFixed(2);
  return `${eur} €`;
}

function isoTodayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [it, setIt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geniusLevel, setGeniusLevel] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // booking form
  const [checkin, setCheckin] = useState(isoTodayPlus(1));
  const [checkout, setCheckout] = useState(isoTodayPlus(2));
  const [guests, setGuests] = useState(2);

  const nights = useMemo(() => {
    try {
      const a = new Date(checkin);
      const b = new Date(checkout);
      const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    } catch {
      return 0;
    }
  }, [checkin, checkout]);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/hotels-airbnb/listings/${id}`);
      setIt(res.data);
    } catch (e) {
      console.error(e);
      setIt(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadGeniusLevel() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/api/hotels-airbnb/user/level`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeniusLevel(res.data);
    } catch {}
  }

  useEffect(() => { 
    load(); 
    loadGeniusLevel();
  }, [id]);

  // Calculate price with Genius discount
  const priceCalc = useMemo(() => {
    if (!it || nights <= 0) return null;
    
    const pricePerNight = it.price_per_night_cents / 100;
    const subtotal = pricePerNight * nights;
    const discountPct = geniusLevel ? parseInt(geniusLevel.discount) : 10;
    const discount = subtotal * (discountPct / 100);
    const total = subtotal - discount;
    
    return {
      pricePerNight,
      subtotal,
      discountPct,
      discount,
      total
    };
  }, [it, nights, geniusLevel]);

  async function book() {
    if (!it) return;
    if (nights <= 0) {
      toast.error("Checkout muss nach Check-in sein.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bitte einloggen um zu buchen");
      navigate("/login");
      return;
    }

    setBooking(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/hotels-airbnb/bookings`,
        {
          listing_id: it.id,
          checkin,
          checkout,
          guests,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBookingResult(res.data);
      toast.success("Buchung erfolgreich!");
      
      if (res.data.level_up?.happened) {
        toast.success(res.data.level_up.message, { duration: 5000 });
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Fehler beim Buchen.");
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/hotels"
            className="text-sm px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
          >
            ← Hotels
          </Link>
          <Link
            to="/"
            className="text-sm px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
          >
            Home
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            Lädt…
          </div>
        ) : !it ? (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            Nicht gefunden.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Image Gallery */}
              {it.photos && it.photos.length > 0 && (
                <div className="rounded-2xl overflow-hidden">
                  <img 
                    src={it.photos[0]} 
                    alt={it.title}
                    className="w-full h-64 object-cover"
                  />
                  {it.photos.length > 1 && (
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {it.photos.slice(1, 4).map((photo, i) => (
                        <img 
                          key={i}
                          src={photo} 
                          alt=""
                          className="w-full h-20 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                {/* Genius Badge */}
                {geniusLevel && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg mb-3">
                    <span className="text-amber-400">★</span>
                    <span className="text-amber-400 font-semibold">Genius {geniusLevel.discount} Rabatt</span>
                  </div>
                )}

                <div className="text-2xl font-bold">{it.title}</div>
                <div className="mt-1 text-white/70">
                  {it.city} · {it.region}
                </div>

                {it.rating && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-amber-400">★ {it.rating}</span>
                    <span className="text-white/60">({it.reviews} Bewertungen)</span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-white/70">Preis pro Nacht</div>
                  <div className="text-xl font-bold">{money(it.price_per_night_cents)}</div>
                </div>

                {it.description && (
                  <div className="mt-4 text-sm text-white/80 whitespace-pre-wrap">
                    {it.description}
                  </div>
                )}

                {/* Amenities */}
                {it.amenities && it.amenities.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-white/70 mb-2">Ausstattung</div>
                    <div className="flex flex-wrap gap-2">
                      {it.amenities.map((amenity, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1.5 bg-white/10 rounded-lg text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 text-xs text-white/60">
                  Max Gäste: {it.max_guests} · Gastgeber: {it.host_name || "Host"}
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 h-fit sticky top-4">
              <div className="text-lg font-semibold">Buchen</div>

              <div className="mt-3">
                <label className="text-xs text-white/70">Check-in</label>
                <input
                  type="date"
                  value={checkin}
                  min={isoTodayPlus(0)}
                  onChange={(e) => setCheckin(e.target.value)}
                  className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="mt-3">
                <label className="text-xs text-white/70">Check-out</label>
                <input
                  type="date"
                  value={checkout}
                  min={checkin}
                  onChange={(e) => setCheckout(e.target.value)}
                  className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="mt-3">
                <label className="text-xs text-white/70">Gäste</label>
                <input
                  type="number"
                  min="1"
                  max={it.max_guests}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value || 1))}
                  className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              {/* Price Breakdown */}
              {priceCalc && (
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{priceCalc.pricePerNight.toFixed(0)} € × {nights} Nächte</span>
                    <span>{priceCalc.subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Genius Rabatt ({priceCalc.discountPct}%)</span>
                    <span>-{priceCalc.discount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-white/10">
                    <span>Gesamt</span>
                    <span>{priceCalc.total.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              <button
                onClick={book}
                disabled={booking || !priceCalc}
                className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                {booking ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Jetzt buchen"
                )}
              </button>

              <div className="mt-3 text-xs text-white/60 text-center">
                Kostenlose Stornierung bis 24h vorher
              </div>
            </div>
          </div>
        )}

        {/* Booking Success Modal */}
        {bookingResult && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold">Buchung bestätigt!</h2>
                <p className="text-white/60 mt-2">Ihre Reservierung wurde erfolgreich erstellt.</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-white/60">Unterkunft</span>
                  <span className="font-medium">{bookingResult.booking.listing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Check-in</span>
                  <span className="font-medium">{bookingResult.booking.checkin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Check-out</span>
                  <span className="font-medium">{bookingResult.booking.checkout}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Nächte</span>
                  <span className="font-medium">{bookingResult.booking.nights}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Genius Rabatt</span>
                  <span className="font-medium">{bookingResult.booking.genius_discount}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                  <span>Bezahlt</span>
                  <span>{bookingResult.booking.final_price}</span>
                </div>
              </div>

              {bookingResult.level_up?.happened && (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 mb-6 text-center">
                  <span className="text-2xl">🎉</span>
                  <p className="font-bold text-amber-400 mt-2">{bookingResult.level_up.message}</p>
                  <p className="text-sm text-amber-400/80">Nächste Buchung: {bookingResult.level_up.new_discount} Rabatt!</p>
                </div>
              )}

              <button
                onClick={() => { setBookingResult(null); navigate("/hotels"); }}
                className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-xl font-semibold"
              >
                Fertig
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
