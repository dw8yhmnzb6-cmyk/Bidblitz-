// BidBlitz Hotels/Airbnb Page
// Airbnb-style listing search and booking with Genius Level discounts

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { 
  Search, MapPin, Users, Star, Heart, Filter, ChevronDown, 
  Calendar, Wifi, Car, Waves, Dumbbell, Coffee, Sparkles,
  ArrowLeft, X, Check
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

// Price formatter
const formatPrice = (cents) => {
  return (cents / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
};

// Region data
const REGIONS = [
  { id: "UAE", name: "VAE", flag: "🇦🇪", cities: ["Dubai", "Abu Dhabi"] },
  { id: "Kosovo", name: "Kosovo", flag: "🇽🇰", cities: ["Prishtina", "Prizren", "Peja"] },
  { id: "Deutschland", name: "Deutschland", flag: "🇩🇪", cities: ["Berlin", "München", "Hamburg"] },
];

export default function HotelsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geniusLevel, setGeniusLevel] = useState(null);
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get("region") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [guests, setGuests] = useState(parseInt(searchParams.get("guests")) || 2);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Favorites
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("hotel_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchListings();
    fetchGeniusLevel();
  }, [selectedRegion, selectedCity, guests]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let url = `${API}/api/hotels-airbnb/listings?`;
      if (selectedRegion) url += `region=${selectedRegion}&`;
      if (selectedCity) url += `city=${selectedCity}&`;
      if (guests) url += `guests=${guests}&`;
      if (searchQuery) url += `q=${searchQuery}&`;
      
      const res = await axios.get(url);
      setListings(res.data.listings || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeniusLevel = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const res = await axios.get(`${API}/api/hotels-airbnb/user/level`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeniusLevel(res.data);
    } catch (err) {
      // Not logged in
    }
  };

  const toggleFavorite = (id) => {
    const newFavorites = favorites.includes(id) 
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem("hotel_favorites", JSON.stringify(newFavorites));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Unterkünfte</h1>
              <p className="text-sm text-white/80">Finden Sie Ihr perfektes Zuhause unterwegs</p>
            </div>
          </div>

          {/* Genius Level Badge */}
          {geniusLevel && (
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold">Genius Level {geniusLevel.level}</p>
                  <p className="text-sm text-white/80">{geniusLevel.discount} Rabatt auf alle Buchungen</p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/genius")}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30"
              >
                Details
              </button>
            </div>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl p-2 shadow-lg">
            <div className="flex flex-col md:flex-row gap-2">
              {/* Location */}
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                <MapPin className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Wohin möchten Sie?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>
              
              {/* Guests */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                <Users className="w-5 h-5 text-slate-400" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="bg-transparent text-slate-800 outline-none"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? "Gast" : "Gäste"}</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <button 
                type="submit"
                className="px-6 py-2 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-600 flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden md:inline">Suchen</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Region Filter Pills */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => { setSelectedRegion(""); setSelectedCity(""); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              !selectedRegion ? "bg-rose-500 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Alle Regionen
          </button>
          {REGIONS.map(region => (
            <button
              key={region.id}
              onClick={() => { setSelectedRegion(region.id); setSelectedCity(""); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedRegion === region.id ? "bg-rose-500 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              <span>{region.flag}</span>
              <span>{region.name}</span>
            </button>
          ))}
        </div>

        {/* City Filter (if region selected) */}
        {selectedRegion && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
            {REGIONS.find(r => r.id === selectedRegion)?.cities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(selectedCity === city ? "" : city)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCity === city ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Listings Grid */}
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Keine Unterkünfte gefunden</h3>
            <p className="text-slate-500">Versuchen Sie andere Filter oder Suchbegriffe</p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 mb-4">{listings.length} Unterkünfte gefunden</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  isFavorite={favorites.includes(listing.id)}
                  onToggleFavorite={() => toggleFavorite(listing.id)}
                  geniusDiscount={geniusLevel?.discount}
                  onClick={() => navigate(`/hotels/${listing.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Listing Card Component
function ListingCard({ listing, isFavorite, onToggleFavorite, geniusDiscount, onClick }) {
  const pricePerNight = listing.price_per_night_cents / 100;
  
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={listing.photos?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"} 
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Favorite Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-600"}`} />
        </button>

        {/* Genius Badge */}
        {geniusDiscount && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-amber-400 text-white text-xs font-bold rounded-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {geniusDiscount}
          </div>
        )}

        {/* Property Type */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur text-white text-xs rounded-lg capitalize">
          {listing.property_type || "Apartment"}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.city}, {listing.region}
            </p>
            <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-rose-600 transition-colors">
              {listing.title}
            </h3>
          </div>
          {listing.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold">{listing.rating}</span>
              <span className="text-slate-400">({listing.reviews})</span>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{listing.description}</p>

        {/* Amenities */}
        <div className="flex gap-2 mb-3">
          {listing.amenities?.slice(0, 3).map((amenity, i) => (
            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
              {amenity}
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-slate-800">{pricePerNight.toFixed(0)} €</span>
            <span className="text-slate-500 text-sm"> / Nacht</span>
          </div>
          <div className="text-xs text-slate-400">
            Max. {listing.max_guests} Gäste
          </div>
        </div>
      </div>
    </div>
  );
}
