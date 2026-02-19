/**
 * MonthlyLeaderboard - Top Bidders Leaderboard Component
 * Shows top 10 bidders of the month with prizes
 */
import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Gift, ChevronRight, Sparkles, Users } from 'lucide-react';

const translations = {
  de: {
    title: 'Bieter des Monats',
    subtitle: 'Top 10 Rangliste',
    yourRank: 'Dein Rang',
    totalBids: 'Gebote',
    auctions: 'Auktionen',
    prize: 'Preis',
    freeBids: 'Gratis-Gebote',
    bonus: 'Bonus',
    notRanked: 'Noch nicht platziert',
    bidMore: 'Biete mehr um aufzusteigen!',
    monthlyPrizes: 'Monatliche Preise',
    rank: 'Platz'
  },
  en: {
    title: 'Bidder of the Month',
    subtitle: 'Top 10 Leaderboard',
    yourRank: 'Your Rank',
    totalBids: 'Bids',
    auctions: 'Auctions',
    prize: 'Prize',
    freeBids: 'Free Bids',
    bonus: 'Bonus',
    notRanked: 'Not ranked yet',
    bidMore: 'Bid more to climb up!',
    monthlyPrizes: 'Monthly Prizes',
    rank: 'Rank'
  },
  sq: {
    title: 'Ofertuesi i Muajit',
    subtitle: 'Top 10 Renditja',
    yourRank: 'Rangu Yt',
    totalBids: 'Oferta',
    auctions: 'Ankande',
    prize: 'Çmim',
    freeBids: 'Oferta Falas',
    bonus: 'Bonus',
    notRanked: 'Ende nuk je renditur',
    bidMore: 'Ofertohu më shumë për të ngjitur!',
    monthlyPrizes: 'Çmimet Mujore',
    rank: 'Vendi'
  },
  tr: {
    title: 'Ayın Teklif Vereni',
    subtitle: 'Top 10 Sıralama',
    yourRank: 'Sıralaman',
    totalBids: 'Teklifler',
    auctions: 'Açık Artırmalar',
    prize: 'Ödül',
    freeBids: 'Ücretsiz Teklifler',
    bonus: 'Bonus',
    notRanked: 'Henüz sıralamada yok',
    bidMore: 'Yükselmek için daha fazla teklif ver!',
    monthlyPrizes: 'Aylık Ödüller',
    rank: 'Sıra'
  }
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getRankIcon = (rank) => {
  switch (rank) {
    case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
    case 2: return <Medal className="w-6 h-6 text-gray-400" />;
    case 3: return <Medal className="w-6 h-6 text-amber-600" />;
    default: return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">#{rank}</span>;
  }
};

const getRankBg = (rank) => {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300';
    case 2: return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300';
    case 3: return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300';
    default: return 'bg-white border-gray-200';
  }
};

const MonthlyLeaderboard = ({ language = 'de', token, className = '' }) => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const t = translations[language] || translations.de;

  const fetchData = async () => {
    try {
      const [lbRes, rankRes] = await Promise.all([
        fetch(`${API}/gamification/leaderboard?language=${language}`),
        token ? fetch(`${API}/gamification/leaderboard/my-rank`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }) : Promise.resolve(null)
      ]);
      
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData);
      }
      
      if (rankRes && rankRes.ok) {
        const rankData = await rankRes.json();
        setMyRank(rankData);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [language, token]);

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!leaderboard) return null;

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`} data-testid="monthly-leaderboard">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-7 h-7" />
              {t.title}
            </h2>
            <p className="text-amber-100 flex items-center gap-2 mt-1">
              <Users className="w-4 h-4" />
              {leaderboard.month_name} {leaderboard.year} • {t.subtitle}
            </p>
          </div>
          <Sparkles className="w-10 h-10 text-yellow-300/50" />
        </div>
      </div>

      <div className="p-4">
        {/* User's Rank */}
        {myRank && (
          <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">{t.yourRank}</p>
                <p className="text-3xl font-bold text-blue-700">
                  #{myRank.rank}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">{myRank.total_bids} {t.totalBids}</p>
                {myRank.is_prize_position && myRank.potential_prize && (
                  <div className="mt-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    {myRank.potential_prize.free_bids} {t.freeBids}!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prizes Info */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {leaderboard.prizes.map((prize) => (
            <div 
              key={prize.rank} 
              className={`text-center p-3 rounded-xl ${
                prize.rank === 1 ? 'bg-yellow-50 border border-yellow-200' :
                prize.rank === 2 ? 'bg-gray-50 border border-gray-200' :
                'bg-amber-50 border border-amber-200'
              }`}
            >
              <div className="flex justify-center mb-1">
                {getRankIcon(prize.rank)}
              </div>
              <p className="text-xs font-medium text-gray-600">{prize.title}</p>
              <p className="text-sm font-bold text-gray-800">{prize.free_bids} Gebote</p>
              <p className="text-xs text-green-600">+€{prize.bonus}</p>
            </div>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {leaderboard.leaderboard.map((entry) => (
            <div 
              key={entry.rank}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${getRankBg(entry.rank)}`}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                {entry.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{entry.username}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {entry.total_bids} {t.totalBids}
                  </span>
                  <span>{entry.auctions_count} {t.auctions}</span>
                </div>
              </div>
              
              {entry.is_winner && entry.prize && (
                <div className="flex-shrink-0 text-right">
                  <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    {entry.prize.free_bids}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {leaderboard.leaderboard.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">{t.notRanked}</p>
            <p className="text-gray-500 text-sm">{t.bidMore}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyLeaderboard;
