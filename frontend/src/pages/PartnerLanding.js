/**
 * Partner Landing Page - Public Partner Profile
 * Target for QR codes and social media links
 * Shows partner info, vouchers, ratings, and contact
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Star, MapPin, Phone, Mail, Globe, Clock, Ticket, 
  ChevronRight, Loader2, Share2, Heart, ExternalLink,
  MessageCircle, Calendar, Award, ThumbsUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Business type icons and names
const BUSINESS_TYPES = {
  restaurant: { name: 'Restaurant', icon: '🍕' },
  bar: { name: 'Bar & Club', icon: '🍺' },
  cafe: { name: 'Café', icon: '☕' },
  gas_station: { name: 'Tankstelle', icon: '⛽' },
  cinema: { name: 'Kino', icon: '🎬' },
  retail: { name: 'Einzelhandel', icon: '🛒' },
  wellness: { name: 'Wellness & Spa', icon: '💆' },
  fitness: { name: 'Fitness-Studio', icon: '🏋️' },
  beauty: { name: 'Friseur & Beauty', icon: '💇' },
  hotel: { name: 'Hotel & Unterkunft', icon: '🏨' },
  entertainment: { name: 'Unterhaltung', icon: '🎯' },
  supermarket: { name: 'Supermarkt', icon: '🛍️' },
  pharmacy: { name: 'Apotheke', icon: '💊' },
  other: { name: 'Sonstiges', icon: '🏪' }
};

export default function PartnerLanding() {
  const { partnerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [ratings, setRatings] = useState(null);
  const [flashSales, setFlashSales] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPartnerData();
    trackVisit();
  }, [partnerId]);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch partner info, vouchers, and ratings in parallel
      const [partnerRes, vouchersRes, ratingsRes, flashRes] = await Promise.allSettled([
        axios.get(`${API}/api/partners/public/${partnerId}`),
        axios.get(`${API}/api/vouchers/partner/${partnerId}/public`),
        axios.get(`${API}/api/partner-ratings/partner/${partnerId}`),
        axios.get(`${API}/api/partner-flash-sales/active?partner_id=${partnerId}`)
      ]);

      if (partnerRes.status === 'fulfilled') {
        setPartner(partnerRes.value.data);
      } else {
        // Try alternate endpoint
        try {
          const altRes = await axios.get(`${API}/api/partner-portal/public-profile/${partnerId}`);
          setPartner(altRes.data);
        } catch {
          setError('Partner nicht gefunden');
        }
      }

      if (vouchersRes.status === 'fulfilled') {
        setVouchers(vouchersRes.value.data.vouchers || []);
      }

      if (ratingsRes.status === 'fulfilled') {
        setRatings(ratingsRes.value.data);
      }

      if (flashRes.status === 'fulfilled') {
        setFlashSales(flashRes.value.data.active_sales || []);
      }

    } catch (err) {
      console.error('Partner fetch error:', err);
      setError('Fehler beim Laden der Partner-Daten');
    } finally {
      setLoading(false);
    }
  };

  const trackVisit = async () => {
    try {
      // Track QR code / social media visit
      const urlParams = new URLSearchParams(window.location.search);
      const trackingId = urlParams.get('tid');
      const ref = urlParams.get('ref');
      
      if (trackingId) {
        await axios.post(`${API}/api/partner-social/track-click`, null, {
          params: { tracking_id: trackingId, platform: ref || 'direct' }
        });
      }
    } catch (err) {
      // Silent fail for tracking
    }
  };

  const sharePartner = async () => {
    const url = window.location.href;
    const text = `Entdecke ${partner?.business_name || partner?.name} auf BidBlitz!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: partner?.business_name || partner?.name, text, url });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link kopiert!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Partner nicht gefunden</h1>
          <p className="text-gray-500 mb-6">{error || 'Dieser Partner existiert nicht mehr.'}</p>
          <Link to="/">
            <Button className="bg-amber-500 hover:bg-amber-600">
              Zur Startseite
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const businessType = BUSINESS_TYPES[partner.business_type] || BUSINESS_TYPES.other;
  const activeFlashSale = flashSales.find(s => s.partner_id === partnerId);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="partner-landing">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Flash Sale Banner */}
          {activeFlashSale && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold">{activeFlashSale.name}</p>
                  <p className="text-sm opacity-90">
                    -{activeFlashSale.discount_percent}% - Nur noch {Math.floor(activeFlashSale.remaining_seconds / 60)} Min!
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-white text-amber-600 hover:bg-gray-100">
                Ansehen
              </Button>
            </div>
          )}

          {/* Partner Header */}
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
              {partner.logo_url ? (
                <img 
                  src={partner.logo_url} 
                  alt={partner.business_name || partner.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl">{businessType.icon}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                  {businessType.icon} {businessType.name}
                </span>
                {partner.is_verified && (
                  <span className="text-sm bg-green-500/30 px-2 py-1 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" /> Verifiziert
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {partner.business_name || partner.name}
              </h1>
              
              {/* Rating */}
              {ratings?.average_rating > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-5 h-5 ${star <= ratings.average_rating ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold">{ratings.average_rating.toFixed(1)}</span>
                  <span className="text-sm opacity-80">({ratings.total_ratings} Bewertungen)</span>
                  {ratings.recommend_rate > 0 && (
                    <span className="text-sm opacity-80 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> {ratings.recommend_rate}% empfehlen
                    </span>
                  )}
                </div>
              )}

              {/* Location */}
              {(partner.address || partner.city) && (
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <MapPin className="w-4 h-4" />
                  <span>{partner.address}{partner.city ? `, ${partner.city}` : ''}</span>
                </div>
              )}
            </div>

            {/* Share Button */}
            <Button 
              onClick={sharePartner}
              variant="ghost"
              className="text-white hover:bg-white/20"
              data-testid="share-partner-btn"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {partner.phone && (
            <a 
              href={`tel:${partner.phone}`}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
            >
              <Phone className="w-6 h-6 text-amber-500" />
              <span className="text-sm text-gray-600">Anrufen</span>
            </a>
          )}
          {partner.email && (
            <a 
              href={`mailto:${partner.email}`}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
            >
              <Mail className="w-6 h-6 text-amber-500" />
              <span className="text-sm text-gray-600">E-Mail</span>
            </a>
          )}
          {partner.website && (
            <a 
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
            >
              <Globe className="w-6 h-6 text-amber-500" />
              <span className="text-sm text-gray-600">Website</span>
            </a>
          )}
          <a 
            href={`https://wa.me/?text=Schau mal bei ${partner.business_name || partner.name} vorbei: ${window.location.href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
          >
            <MessageCircle className="w-6 h-6 text-green-500" />
            <span className="text-sm text-gray-600">Teilen</span>
          </a>
        </div>

        {/* Available Vouchers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-amber-500" />
              Verfügbare Gutscheine
            </h2>
            <Link to={`/vouchers?partner=${partnerId}`}>
              <Button variant="ghost" size="sm" className="text-amber-600">
                Alle ansehen <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {vouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.slice(0, 4).map((voucher) => (
                <Link 
                  key={voucher.id || voucher._id}
                  to={`/voucher/${voucher.id || voucher._id}`}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 group-hover:text-amber-600 transition-colors">
                      {voucher.name}
                    </h3>
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-sm font-bold">
                      €{voucher.value?.toFixed(2)}
                    </span>
                  </div>
                  {voucher.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{voucher.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {voucher.valid_until 
                        ? `Gültig bis ${new Date(voucher.valid_until).toLocaleDateString('de-DE')}`
                        : 'Unbegrenzt gültig'}
                    </span>
                    <span className="text-amber-600 text-sm font-medium group-hover:underline">
                      Jetzt sichern →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Derzeit keine Gutscheine verfügbar</p>
              <p className="text-sm">Schauen Sie später wieder vorbei!</p>
            </div>
          )}
        </section>

        {/* Reviews */}
        {ratings?.ratings?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-500" />
                Kundenbewertungen
              </h2>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-800">{ratings.average_rating?.toFixed(1)}</p>
                  <div className="flex justify-center my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= ratings.average_rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">{ratings.total_ratings} Bewertungen</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratings.distribution?.[star] || 0;
                    const percent = ratings.total_ratings > 0 ? (count / ratings.total_ratings * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4">{star}</span>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-400 rounded-full h-2 transition-all" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="space-y-4">
              {ratings.ratings.slice(0, 3).map((review, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-400">
                          {review.user_name?.charAt(0).toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{review.user_name || 'Anonym'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600">{review.comment}</p>
                  )}
                  {review.recommend && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Würde empfehlen
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Opening Hours */}
        {partner.opening_hours && (
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Öffnungszeiten
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(partner.opening_hours).map(([day, hours]) => (
                <div key={day} className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">{day}</span>
                  <span className="font-medium text-gray-800">{hours || 'Geschlossen'}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Map Placeholder */}
        {(partner.latitude && partner.longitude) && (
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              Standort
            </h3>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${partner.latitude},${partner.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center"
              >
                <MapPin className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <p className="text-gray-600">In Google Maps öffnen</p>
                <p className="text-sm text-gray-400">{partner.address}</p>
              </a>
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Jetzt Gutscheine ersteigern!</h3>
          <p className="opacity-90 mb-4">
            Spare bis zu 90% bei {partner.business_name || partner.name} mit BidBlitz
          </p>
          <Link to={`/auctions?partner=${partnerId}`}>
            <Button className="bg-white text-amber-600 hover:bg-gray-100">
              Zu den Auktionen
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link to="/" className="text-xl font-bold text-white mb-4 inline-block">
            🎯 BidBlitz
          </Link>
          <p className="text-sm">© 2026 BidBlitz. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}
