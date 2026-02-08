// AI-Powered Product Recommendations Component
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, TrendingUp, Clock, Zap, ChevronRight, 
  Star, Target, AlertCircle, ShoppingCart, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AIRecommendations({ token, compact = false }) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [packageRec, setPackageRec] = useState(null);
  const [favoriteCategories, setFavoriteCategories] = useState([]);

  useEffect(() => {
    if (token) {
      fetchRecommendations();
    }
  }, [token]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const [recRes, alertRes] = await Promise.all([
        fetch(`${API}/api/ai-bid/product-recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/ai-bid/smart-alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData.recommendations || []);
        setPackageRec(recData.package_recommendation);
        setFavoriteCategories(recData.favorite_categories || []);
      }

      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setAlerts(alertData.alerts || []);
      }
    } catch (error) {
      console.error('AI Recommendations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[#7C3AED] animate-spin" />
        </div>
      </div>
    );
  }

  // Compact view for sidebar
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Smart Alerts */}
        {alerts.length > 0 && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
              Alerts
            </h3>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, idx) => (
                <Link 
                  key={idx} 
                  to={alert.auction_id ? `/auctions?id=${alert.auction_id}` : '/bids'}
                  className="block p-2 rounded-lg bg-white/50 hover:bg-white transition-colors"
                >
                  <p className="text-xs text-gray-700">{alert.message}</p>
                  {alert.product_name && (
                    <p className="text-xs text-gray-500 truncate">{alert.product_name}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top Recommendations */}
        {recommendations.length > 0 && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              Für dich empfohlen
            </h3>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <Link 
                  key={idx}
                  to={`/auctions?id=${rec.auction_id}`}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/50 hover:bg-white transition-colors"
                >
                  {rec.product_image && (
                    <img 
                      src={rec.product_image} 
                      alt="" 
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {rec.product_name}
                    </p>
                    <p className="text-xs text-green-600">
                      -{rec.savings_percent}% • €{rec.current_price?.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#7C3AED]" />
          KI-Empfehlungen für dich
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchRecommendations}
          className="text-gray-500"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-[#F59E0B]">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
            Smart Alerts ({alerts.length})
          </h3>
          <div className="grid gap-2">
            {alerts.slice(0, 4).map((alert, idx) => (
              <Link
                key={idx}
                to={alert.auction_id ? `/auctions?id=${alert.auction_id}` : '/bids'}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  alert.priority === 'high' 
                    ? 'bg-red-50 hover:bg-red-100 border border-red-200' 
                    : 'bg-white hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {alert.type === 'ending_soon' && <Clock className="w-5 h-5 text-red-500" />}
                  {alert.type === 'new_auction' && <Star className="w-5 h-5 text-yellow-500" />}
                  {alert.type === 'low_balance' && <Zap className="w-5 h-5 text-orange-500" />}
                  <div>
                    <p className="font-medium text-gray-800">{alert.message}</p>
                    {alert.product_name && (
                      <p className="text-sm text-gray-500">{alert.product_name}</p>
                    )}
                  </div>
                </div>
                {alert.seconds_left && (
                  <span className="text-sm font-bold text-red-500">
                    {formatTime(alert.seconds_left)}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Categories */}
      {favoriteCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Deine Interessen:</span>
          {favoriteCategories.map((cat, idx) => (
            <span 
              key={idx}
              className="px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-sm font-medium"
            >
              {cat.name} ({cat.activity})
            </span>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.slice(0, 6).map((rec, idx) => (
            <Link
              key={idx}
              to={`/auctions?id=${rec.auction_id}`}
              className="glass-card rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div className="relative mb-3">
                {rec.product_image ? (
                  <img 
                    src={rec.product_image} 
                    alt={rec.product_name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                {/* Match Score Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                  rec.match_score >= 80 
                    ? 'bg-green-500 text-white' 
                    : rec.match_score >= 60 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  {rec.match_score}% Match
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-800 truncate group-hover:text-[#7C3AED] transition-colors">
                {rec.product_name}
              </h4>
              
              <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
              
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-lg font-bold text-[#10B981]">
                    €{rec.current_price?.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 line-through">
                    €{rec.retail_price?.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#7C3AED]">
                    -{rec.savings_percent}%
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(rec.seconds_left)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Package Recommendation */}
      {packageRec && (
        <div className={`glass-card rounded-2xl p-5 ${
          packageRec.urgency === 'high' 
            ? 'border-2 border-[#F59E0B] bg-gradient-to-r from-yellow-50 to-orange-50' 
            : ''
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                packageRec.urgency === 'high' ? 'bg-[#F59E0B]' : 'bg-[#7C3AED]'
              }`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">
                  Empfohlen: {packageRec.package}
                </h4>
                <p className="text-sm text-gray-500">{packageRec.reason}</p>
                {packageRec.discount_hint && (
                  <p className="text-xs text-[#10B981] mt-1">{packageRec.discount_hint}</p>
                )}
              </div>
            </div>
            <Link to="/bids">
              <Button className={packageRec.urgency === 'high' ? 'bg-[#F59E0B] hover:bg-[#D97706]' : 'btn-primary'}>
                Jetzt kaufen
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* No Recommendations */}
      {recommendations.length === 0 && alerts.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-800 mb-2">
            Keine Empfehlungen verfügbar
          </h3>
          <p className="text-gray-500 text-sm">
            Biete auf einige Auktionen, damit wir deine Interessen kennenlernen können!
          </p>
          <Link to="/auctions">
            <Button className="mt-4 btn-primary">
              Auktionen entdecken
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
