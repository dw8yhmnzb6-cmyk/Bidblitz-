/**
 * Discover Restaurants Page
 * Browse restaurants by category, location, and rating
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, MapPin, Star, Filter, ChevronRight, Ticket, 
  Heart, Award, TrendingUp, Clock, Utensils
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const translations = {
  de: {
    title: 'Restaurants entdecken',
    subtitle: 'Finde die besten Deals in deiner Nähe',
    search: 'Restaurant suchen...',
    categories: 'Kategorien',
    featured: 'Empfohlen',
    topRated: 'Top bewertet',
    nearYou: 'In deiner Nähe',
    allRestaurants: 'Alle Restaurants',
    vouchers: 'Gutscheine',
    reviews: 'Bewertungen',
    recommend: 'empfehlen',
    viewAll: 'Alle anzeigen',
    noResults: 'Keine Restaurants gefunden',
    filterBy: 'Filtern nach',
    priceRange: 'Preisklasse',
    minRating: 'Mindestbewertung',
    premium: 'Premium Partner'
  },
  en: {
    title: 'Discover Restaurants',
    subtitle: 'Find the best deals near you',
    search: 'Search restaurants...',
    categories: 'Categories',
    featured: 'Featured',
    topRated: 'Top Rated',
    nearYou: 'Near You',
    allRestaurants: 'All Restaurants',
    vouchers: 'Vouchers',
    reviews: 'Reviews',
    recommend: 'recommend',
    viewAll: 'View all',
    noResults: 'No restaurants found',
    filterBy: 'Filter by',
    priceRange: 'Price Range',
    minRating: 'Min Rating',
    premium: 'Premium Partner'
  }
};

const CATEGORIES = [
  { id: 'italian', name: 'Italienisch', icon: '🍕', color: '#E53935' },
  { id: 'german', name: 'Deutsch', icon: '🥨', color: '#FFC107' },
  { id: 'asian', name: 'Asiatisch', icon: '🍜', color: '#FF5722' },
  { id: 'burger', name: 'Burger', icon: '🍔', color: '#795548' },
  { id: 'sushi', name: 'Sushi', icon: '🍣', color: '#E91E63' },
  { id: 'mexican', name: 'Mexikanisch', icon: '🌮', color: '#4CAF50' },
  { id: 'turkish', name: 'Türkisch', icon: '🥙', color: '#9C27B0' },
  { id: 'cafe', name: 'Café', icon: '☕', color: '#8D6E63' },
];

export default function DiscoverRestaurants() {
  const { language } = useLanguage();
  const t = translations[language] || translations.de;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRating: 0,
    priceRange: null,
    city: null
  });

  useEffect(() => {
    fetchFeatured();
    fetchRestaurants();
  }, [selectedCategory, filters]);

  const fetchFeatured = async () => {
    try {
      const response = await axios.get(`${API}/api/restaurants/featured`);
      setFeatured(response.data || []);
    } catch (err) {
      console.error('Error fetching featured:', err);
    }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (filters.minRating) params.append('min_rating', filters.minRating);
      if (filters.priceRange) params.append('price_range', filters.priceRange);
      
      const response = await axios.get(`${API}/api/restaurants/discover?${params}`);
      setRestaurants(response.data?.restaurants || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const RestaurantCard = ({ restaurant, featured = false }) => (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className={`block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden ${
        featured ? 'border-2 border-amber-400' : ''
      }`}
    >
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-br from-amber-100 to-orange-100">
        {restaurant.cover_image ? (
          <img 
            src={restaurant.cover_image} 
            alt={restaurant.restaurant_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="w-12 h-12 text-amber-300" />
          </div>
        )}
        
        {/* Premium Badge */}
        {restaurant.is_premium && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Award className="w-3 h-3" />
            Premium
          </div>
        )}
        
        {/* Voucher Count */}
        {restaurant.available_vouchers > 0 && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Ticket className="w-3 h-3" />
            {restaurant.available_vouchers}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1">{restaurant.restaurant_name}</h3>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          {restaurant.avg_rating > 0 ? (
            <>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold">{restaurant.avg_rating?.toFixed(1)}</span>
              </div>
              <span className="text-gray-400 text-sm">
                ({restaurant.total_reviews} {t.reviews})
              </span>
            </>
          ) : (
            <span className="text-gray-400 text-sm">Neu</span>
          )}
        </div>
        
        {/* Categories */}
        {restaurant.categories && (
          <div className="flex gap-1 mb-2">
            {restaurant.categories.slice(0, 2).map(catId => {
              const cat = CATEGORIES.find(c => c.id === catId);
              return cat ? (
                <span key={catId} className="text-sm">{cat.icon}</span>
              ) : null;
            })}
          </div>
        )}
        
        {/* Address */}
        {restaurant.address && (
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{restaurant.address}</span>
          </div>
        )}
        
        {/* Recommend Rate */}
        {restaurant.recommend_percent > 0 && (
          <div className="mt-2 text-green-600 text-sm font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {restaurant.recommend_percent}% {t.recommend}
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 pb-12">
        <h1 className="text-2xl font-bold mb-1">{t.title}</h1>
        <p className="text-amber-100">{t.subtitle}</p>
        
        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white text-gray-800"
          />
        </div>
      </div>
      
      {/* Categories Slider */}
      <div className="-mt-6 px-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t.categories}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedCategory 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  selectedCategory === cat.id 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="px-4 space-y-6">
        {/* Featured Section */}
        {featured.length > 0 && !selectedCategory && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                {t.featured}
              </h2>
              <Link to="/restaurants/featured" className="text-amber-500 text-sm font-medium flex items-center gap-1">
                {t.viewAll}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featured.slice(0, 4).map(r => (
                <RestaurantCard key={r.id} restaurant={r} featured />
              ))}
            </div>
          </section>
        )}
        
        {/* All Restaurants */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">
              {selectedCategory 
                ? CATEGORIES.find(c => c.id === selectedCategory)?.name 
                : t.allRestaurants}
            </h2>
            <span className="text-gray-500 text-sm">{restaurants.length} Ergebnisse</span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurants.map(r => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Utensils className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t.noResults}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
