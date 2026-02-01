import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Star, Crown, Zap, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Translations
const leaderboardTexts = {
  de: {
    title: 'Wochen-Rangliste',
    subtitle: 'Top 10 gewinnen jede Woche Gratis-Gebote!',
    rank: 'Rang',
    player: 'Spieler',
    bids: 'Gebote',
    prize: 'Preis',
    yourRank: 'Dein Rang',
    thisWeek: 'Diese Woche',
    endsIn: 'Endet in',
    days: 'Tage',
    hours: 'Std',
    notRanked: 'Noch nicht platziert',
    startBidding: 'Jetzt bieten um zu gewinnen!',
    weeklyPrizes: 'Wöchentliche Preise',
    place: 'Platz',
    freeBids: 'Gratis-Gebote',
    loading: 'Lädt...'
  },
  en: {
    title: 'Weekly Leaderboard',
    subtitle: 'Top 10 win free bids every week!',
    rank: 'Rank',
    player: 'Player',
    bids: 'Bids',
    prize: 'Prize',
    yourRank: 'Your Rank',
    thisWeek: 'This Week',
    endsIn: 'Ends in',
    days: 'Days',
    hours: 'Hrs',
    notRanked: 'Not ranked yet',
    startBidding: 'Start bidding to win!',
    weeklyPrizes: 'Weekly Prizes',
    place: 'Place',
    freeBids: 'Free Bids',
    loading: 'Loading...'
  },
  tr: {
    title: 'Haftalık Sıralama',
    subtitle: 'İlk 10 her hafta ücretsiz teklif kazanır!',
    rank: 'Sıra',
    player: 'Oyuncu',
    bids: 'Teklifler',
    prize: 'Ödül',
    yourRank: 'Sıralamanız',
    thisWeek: 'Bu Hafta',
    endsIn: 'Bitiyor',
    days: 'Gün',
    hours: 'Sa',
    notRanked: 'Henüz sıralamada değil',
    startBidding: 'Kazanmak için teklif verin!',
    weeklyPrizes: 'Haftalık Ödüller',
    place: 'Sıra',
    freeBids: 'Ücretsiz Teklif',
    loading: 'Yükleniyor...'
  },
  sq: {
    title: 'Renditja Javore',
    subtitle: 'Top 10 fitojnë oferta falas çdo javë!',
    rank: 'Renditja',
    player: 'Lojtari',
    bids: 'Oferta',
    prize: 'Çmimi',
    yourRank: 'Renditja Juaj',
    thisWeek: 'Këtë Javë',
    endsIn: 'Përfundon',
    days: 'Ditë',
    hours: 'Orë',
    notRanked: 'Ende pa renditje',
    startBidding: 'Filloni të ofertoni për të fituar!',
    weeklyPrizes: 'Çmimet Javore',
    place: 'Vendi',
    freeBids: 'Oferta Falas',
    loading: 'Duke ngarkuar...'
  },
  fr: {
    title: 'Classement Hebdomadaire',
    subtitle: 'Le Top 10 gagne des enchères gratuites chaque semaine!',
    rank: 'Rang',
    player: 'Joueur',
    bids: 'Enchères',
    prize: 'Prix',
    yourRank: 'Votre Rang',
    thisWeek: 'Cette Semaine',
    endsIn: 'Se termine dans',
    days: 'Jours',
    hours: 'H',
    notRanked: 'Pas encore classé',
    startBidding: 'Commencez à enchérir pour gagner!',
    weeklyPrizes: 'Prix Hebdomadaires',
    place: 'Place',
    freeBids: 'Enchères Gratuites',
    loading: 'Chargement...'
  }
};

export default function Leaderboard() {
  const { language } = useLanguage();
  const { isAuthenticated, token } = useAuth();
  const t = leaderboardTexts[language] || leaderboardTexts.de;
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [weekEnd, setWeekEnd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyRank();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!weekEnd) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(weekEnd);
      const diff = end - now;
      
      if (diff <= 0) {
        fetchLeaderboard();
        return;
      }
      
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      });
    }, 60000);
    
    // Initial calculation
    const now = new Date();
    const end = new Date(weekEnd);
    const diff = end - now;
    setTimeLeft({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    });
    
    return () => clearInterval(interval);
  }, [weekEnd]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard/weekly`);
      setLeaderboard(response.data.leaderboard);
      setWeekEnd(response.data.week_end);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRank = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard/my-rank`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRank(response.data);
    } catch (error) {
      console.error('Error fetching my rank:', error);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    if (rank <= 10) return <Star className="w-5 h-5 text-purple-400" />;
    return <span className="text-gray-500">{rank}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-300/20 border-gray-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/50';
    return 'bg-white/5 border-white/10';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="leaderboard-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
          </div>
          <p className="text-gray-400">{t.subtitle}</p>
          
          {/* Countdown */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300">
              {t.endsIn}: <span className="font-bold">{timeLeft.days} {t.days} {timeLeft.hours} {t.hours}</span>
            </span>
          </div>
        </div>

        {/* My Rank Card */}
        {isAuthenticated && myRank && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t.yourRank}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-4xl font-bold text-white">#{myRank.rank}</span>
                  {myRank.badge && <span className="text-3xl">{myRank.badge}</span>}
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {myRank.total_bids} {t.bids} {t.thisWeek}
                </p>
              </div>
              {myRank.in_top_10 && myRank.prize_bids > 0 && (
                <div className="text-right">
                  <p className="text-gray-400 text-sm">{t.prize}</p>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Zap className="w-6 h-6" />
                    <span className="text-2xl font-bold">+{myRank.prize_bids}</span>
                  </div>
                </div>
              )}
            </div>
            {!myRank.in_top_10 && (
              <Link to="/auctions" className="mt-4 block">
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                  <span>{t.startBidding}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="rounded-2xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 text-gray-400 text-sm font-medium">
            <div>{t.rank}</div>
            <div>{t.player}</div>
            <div className="text-center">{t.bids}</div>
            <div className="text-right">{t.prize}</div>
          </div>
          
          {/* Rows */}
          <div className="divide-y divide-white/5">
            {leaderboard.slice(0, 10).map((entry) => (
              <div 
                key={entry.user_id}
                className={`grid grid-cols-4 gap-4 p-4 items-center border-l-4 ${getRankBg(entry.rank)}`}
              >
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  {entry.rank > 3 && <span className="text-white font-bold">#{entry.rank}</span>}
                </div>
                <div className="text-white font-medium">
                  {entry.display_name}
                </div>
                <div className="text-center">
                  <span className="text-white font-bold">{entry.total_bids}</span>
                </div>
                <div className="text-right">
                  {entry.prize_bids > 0 && (
                    <span className="inline-flex items-center gap-1 text-yellow-400 font-bold">
                      <Zap className="w-4 h-4" />
                      +{entry.prize_bids}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prize Info */}
        <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            {t.weeklyPrizes}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { place: '1.', bids: 50, icon: '🥇' },
              { place: '2.', bids: 30, icon: '🥈' },
              { place: '3.', bids: 20, icon: '🥉' },
              { place: '4-5.', bids: 10, icon: '🏅' },
              { place: '6-10.', bids: 5, icon: '⭐' },
            ].map((prize, i) => (
              <div key={i} className="text-center p-3 bg-white/5 rounded-lg">
                <span className="text-2xl">{prize.icon}</span>
                <p className="text-gray-400 text-sm mt-1">{t.place} {prize.place}</p>
                <p className="text-yellow-400 font-bold">{prize.bids} {t.freeBids}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
