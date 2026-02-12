import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { 
  Gift, Package, Sparkles, Timer, Users, Zap, ArrowLeft, 
  Trophy, HelpCircle, Lock, Eye, Clock, User, History
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const translations = {
  de: {
    loading: 'Lade Mystery Box...',
    notFound: 'Mystery Box nicht gefunden',
    backToHome: 'Zurück zur Startseite',
    currentBid: 'Aktuelles Gebot',
    timeLeft: 'Verbleibende Zeit',
    bidNow: 'Jetzt bieten',
    pleaseLogin: 'Bitte einloggen um zu bieten',
    hint: 'Hinweis',
    whatInside: 'Was ist drin?',
    valueBetween: 'Wert zwischen',
    totalBids: 'Gebote gesamt',
    lastBidder: 'Letzter Bieter',
    bidHistory: 'Gebotsverlauf',
    noBids: 'Noch keine Gebote',
    bidPlaced: 'Gebot platziert!',
    bidError: 'Fehler beim Bieten',
    notEnoughBids: 'Nicht genügend Gebote',
    revealed: 'Enthüllt',
    mystery: 'Mystery',
    ended: 'Beendet',
    winner: 'Gewinner',
    bronze: 'Bronze Box',
    silver: 'Silber Box',
    gold: 'Gold Box',
    diamond: 'Diamant Box'
  },
  en: {
    loading: 'Loading Mystery Box...',
    notFound: 'Mystery Box not found',
    backToHome: 'Back to Home',
    currentBid: 'Current Bid',
    timeLeft: 'Time Left',
    bidNow: 'Bid Now',
    pleaseLogin: 'Please login to bid',
    hint: 'Hint',
    whatInside: "What's inside?",
    valueBetween: 'Value between',
    totalBids: 'Total Bids',
    lastBidder: 'Last Bidder',
    bidHistory: 'Bid History',
    noBids: 'No bids yet',
    bidPlaced: 'Bid placed!',
    bidError: 'Error placing bid',
    notEnoughBids: 'Not enough bids',
    revealed: 'Revealed',
    mystery: 'Mystery',
    ended: 'Ended',
    winner: 'Winner',
    bronze: 'Bronze Box',
    silver: 'Silver Box',
    gold: 'Gold Box',
    diamond: 'Diamond Box'
  },
  sq: {
    loading: 'Duke ngarkuar Kutinë Misterioze...',
    notFound: 'Kutia Misterioze nuk u gjet',
    backToHome: 'Kthehu në Ballë',
    currentBid: 'Oferta Aktuale',
    timeLeft: 'Koha e Mbetur',
    bidNow: 'Ofro Tani',
    pleaseLogin: 'Ju lutem hyni për të ofertuar',
    hint: 'Sugjerim',
    whatInside: 'Çfarë ka brenda?',
    valueBetween: 'Vlera midis',
    totalBids: 'Ofertat Totale',
    lastBidder: 'Ofertuesi i Fundit',
    bidHistory: 'Historia e Ofertave',
    noBids: 'Ende pa oferta',
    bidPlaced: 'Oferta u vendos!',
    bidError: 'Gabim gjatë ofertimit',
    notEnoughBids: 'Jo mjaft oferta',
    revealed: 'E zbuluar',
    mystery: 'Misterioze',
    ended: 'Përfundoi',
    winner: 'Fituesi',
    bronze: 'Kutia Bronze',
    silver: 'Kutia Argjend',
    gold: 'Kutia Ar',
    diamond: 'Kutia Diamant'
  }
};

translations.xk = translations.sq;

const tierColors = {
  bronze: 'from-amber-600 to-amber-700',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-amber-400 to-yellow-500',
  diamond: 'from-cyan-400 to-blue-500'
};

const tierIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎'
};

export default function MysteryBoxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token, updateBidsBalance } = useAuth();
  const { language, mappedLanguage } = useLanguage();
  const langKey = mappedLanguage || language || 'de';
  const t = translations[langKey] || translations.de;

  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [bidHistory, setBidHistory] = useState([]);

  useEffect(() => {
    fetchMysteryBox();
  }, [id]);

  useEffect(() => {
    if (!box || !box.end_time) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(box.end_time);
      const now = new Date();
      const diff = endTime - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [box]);

  const fetchMysteryBox = async () => {
    try {
      const response = await axios.get(`${API}/mystery-box/${id}`);
      setBox(response.data);
      setBidHistory(response.data.bids || []);
    } catch (error) {
      console.error('Error fetching mystery box:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    if (!isAuthenticated) {
      toast.error(t.pleaseLogin);
      return;
    }

    setBidding(true);
    try {
      const response = await axios.post(
        `${API}/mystery-box/${id}/bid`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t.bidPlaced);
      fetchMysteryBox();
      if (response.data.new_balance !== undefined) {
        updateBidsBalance(response.data.new_balance);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || t.bidError;
      if (errorMsg.includes('genug') || errorMsg.includes('enough')) {
        toast.error(t.notEnoughBids);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center">
          <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">{t.notFound}</h2>
          <Link to="/">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToHome}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tier = box.tier || 'bronze';
  const colorClass = tierColors[tier] || tierColors.bronze;
  const icon = box.emoji || tierIcons[tier] || '📦';
  const tierInfo = box.tier_info || {};
  const isEnded = box.status !== 'active' || (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0);

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gradient-to-b from-gray-900 to-gray-800" data-testid="mystery-box-detail">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t.backToHome}
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mystery Box Visual */}
          <div className={`relative bg-gradient-to-br ${colorClass} rounded-2xl p-8 text-white overflow-hidden`}>
            {/* Sparkle Effect */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <Sparkles 
                  key={i}
                  className="absolute w-6 h-6 text-white/30 animate-pulse"
                  style={{
                    top: `${10 + Math.random() * 80}%`,
                    left: `${10 + Math.random() * 80}%`,
                    animationDelay: `${i * 0.3}s`
                  }}
                />
              ))}
            </div>

            <div className="relative text-center">
              {/* Icon */}
              <span className="text-8xl mb-4 block">{icon}</span>
              
              {/* Title */}
              <h1 className="text-3xl font-black mb-2">
                {t[tier] || tierInfo.name || box.name}
              </h1>

              {/* Status Badge */}
              {isEnded ? (
                <span className="inline-block px-4 py-1 bg-red-500/30 rounded-full text-sm font-semibold">
                  {t.ended}
                </span>
              ) : (
                <span className="inline-block px-4 py-1 bg-green-500/30 rounded-full text-sm font-semibold">
                  {t.mystery}
                </span>
              )}

              {/* Hint/Value */}
              <div className="mt-6 bg-white/20 backdrop-blur rounded-xl p-4">
                {box.hint ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-semibold">{t.hint}</span>
                    </div>
                    <p className="text-lg italic">{box.hint}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <HelpCircle className="w-5 h-5" />
                      <span className="font-semibold">{t.whatInside}</span>
                    </div>
                    <p className="text-lg">
                      {t.valueBetween} €{tierInfo.min_value || 50} - €{tierInfo.max_value || 150}
                    </p>
                  </>
                )}
              </div>

              {/* Winner (if ended) */}
              {isEnded && box.winner_name && (
                <div className="mt-4 bg-yellow-500/30 backdrop-blur rounded-xl p-4">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                  <p className="font-bold">{t.winner}: {box.winner_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bid Info & Actions */}
          <div className="space-y-6">
            {/* Current Bid */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-1">{t.currentBid}</p>
              <p className="text-4xl font-black text-white">
                €{(box.current_price || 0).toFixed(2)}
              </p>
              
              <div className="mt-4 flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>{box.total_bids || 0} {t.totalBids}</span>
                </div>
                {box.last_bidder && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{box.last_bidder}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Time Left */}
            {!isEnded && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <p className="text-gray-400 text-sm mb-2">{t.timeLeft}</p>
                <div className="flex items-center gap-4">
                  <Timer className="w-8 h-8 text-purple-400" />
                  <div className="flex gap-2">
                    <div className="bg-purple-600/50 rounded-lg px-4 py-2 text-center">
                      <span className="text-2xl font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                      <p className="text-xs text-gray-300">Std</p>
                    </div>
                    <div className="bg-purple-600/50 rounded-lg px-4 py-2 text-center">
                      <span className="text-2xl font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                      <p className="text-xs text-gray-300">Min</p>
                    </div>
                    <div className="bg-purple-600/50 rounded-lg px-4 py-2 text-center">
                      <span className="text-2xl font-bold text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
                      <p className="text-xs text-gray-300">Sek</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bid Button */}
            {!isEnded && (
              <Button
                onClick={handleBid}
                disabled={bidding || !isAuthenticated}
                className="w-full py-6 text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                data-testid="mystery-bid-btn"
              >
                {bidding ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Gift className="w-6 h-6 mr-2" />
                    {t.bidNow}
                  </>
                )}
              </Button>
            )}

            {!isAuthenticated && !isEnded && (
              <p className="text-center text-gray-400 text-sm">{t.pleaseLogin}</p>
            )}

            {/* Bid History */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">{t.bidHistory}</h3>
              </div>
              
              {bidHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t.noBids}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bidHistory.map((bid, index) => (
                    <div 
                      key={bid.id || index}
                      className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-white">{bid.bidder_name || 'Anonym'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-purple-400 font-semibold">€{(bid.price || 0).toFixed(2)}</span>
                        {bid.created_at && (
                          <p className="text-xs text-gray-500">
                            {new Date(bid.created_at).toLocaleTimeString('de-DE')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
