import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { 
  Swords, Trophy, Users, Clock, Zap, Gift, Target, 
  User, Plus, Check, X, ChevronRight, Flame, Crown
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

const translations = {
  de: {
    title: '1v1 Duelle',
    subtitle: 'Fordere andere Spieler heraus!',
    createDuel: 'Duell erstellen',
    activeDuels: 'Aktive Duelle',
    pendingChallenges: 'Herausforderungen',
    myDuels: 'Meine Duelle',
    history: 'Verlauf',
    betBids: 'Einsatz (Gebote)',
    opponent: 'Gegner',
    randomOpponent: 'Zufälliger Gegner',
    searchUser: 'Spieler suchen...',
    startDuel: 'Duell starten',
    accept: 'Annehmen',
    decline: 'Ablehnen',
    waiting: 'Wartet...',
    inProgress: 'Im Gange',
    completed: 'Beendet',
    won: 'Gewonnen',
    lost: 'Verloren',
    pot: 'Pot',
    vs: 'VS',
    you: 'Du',
    score: 'Punkte',
    timeLeft: 'Zeit übrig',
    noDuels: 'Keine aktiven Duelle',
    noChallenges: 'Keine Herausforderungen',
    challengeSent: 'Herausforderung gesendet!',
    loginRequired: 'Bitte anmelden'
  },
  en: {
    title: '1v1 Duels',
    subtitle: 'Challenge other players!',
    createDuel: 'Create Duel',
    activeDuels: 'Active Duels',
    pendingChallenges: 'Challenges',
    myDuels: 'My Duels',
    history: 'History',
    betBids: 'Bet (Bids)',
    opponent: 'Opponent',
    randomOpponent: 'Random Opponent',
    searchUser: 'Search player...',
    startDuel: 'Start Duel',
    accept: 'Accept',
    decline: 'Decline',
    waiting: 'Waiting...',
    inProgress: 'In Progress',
    completed: 'Completed',
    won: 'Won',
    lost: 'Lost',
    pot: 'Pot',
    vs: 'VS',
    you: 'You',
    score: 'Score',
    timeLeft: 'Time left',
    noDuels: 'No active duels',
    noChallenges: 'No challenges',
    challengeSent: 'Challenge sent!',
    loginRequired: 'Please login'
  },
  sq: {
    title: 'Duele 1v1',
    subtitle: 'Sfido lojtarët e tjerë!',
    createDuel: 'Krijo Duel',
    activeDuels: 'Duelet Aktive',
    pendingChallenges: 'Sfidat',
    myDuels: 'Duelet e Mia',
    history: 'Historia',
    betBids: 'Bast (Oferta)',
    opponent: 'Kundërshtari',
    randomOpponent: 'Kundërshtar i Rastësishëm',
    searchUser: 'Kërko lojtar...',
    startDuel: 'Fillo Duelin',
    accept: 'Prano',
    decline: 'Refuzo',
    waiting: 'Duke pritur...',
    inProgress: 'Në Progres',
    completed: 'Përfunduar',
    won: 'Fituar',
    lost: 'Humbur',
    pot: 'Pot',
    vs: 'VS',
    you: 'Ti',
    score: 'Pikët',
    timeLeft: 'Koha e mbetur',
    noDuels: 'Asnjë duel aktiv',
    noChallenges: 'Asnjë sfidë',
    challengeSent: 'Sfida u dërgua!',
    loginRequired: 'Ju lutem identifikohuni'
  }
};

const DuelsPage = () => {
  const { isAuthenticated, token, user } = useAuth();
  const { language, mappedLanguage } = useLanguage();
  const langKey = mappedLanguage || language;
  const t = translations[langKey] || translations.de;
  
  const [activeTab, setActiveTab] = useState('active');
  const [duels, setDuels] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState(null);

  const fetchDuels = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const [activeRes, challengesRes] = await Promise.all([
        fetch(`${API}/api/duels/my-duels`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/api/duels/challenges`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (activeRes.ok) {
        const data = await activeRes.json();
        setDuels(data.duels || []);
      }
      
      if (challengesRes.ok) {
        const data = await challengesRes.json();
        setChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error('Error fetching duels:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchDuels();
    const interval = setInterval(fetchDuels, 10000);
    return () => clearInterval(interval);
  }, [fetchDuels]);

  const handleCreateDuel = async () => {
    if (!isAuthenticated) {
      toast.error(t.loginRequired);
      return;
    }
    
    try {
      const response = await fetch(`${API}/api/duels/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          opponent_id: selectedOpponent?.id || null,
          bet_bids: betAmount
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(t.challengeSent);
        setShowCreate(false);
        setSelectedOpponent(null);
        setBetAmount(10);
        fetchDuels();
      } else {
        toast.error(data.detail || 'Error');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleRespondDuel = async (duelId, action) => {
    try {
      const response = await fetch(`${API}/api/duels/${duelId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        toast.success(action === 'accept' ? '⚔️ Duell akzeptiert!' : 'Duell abgelehnt');
        fetchDuels();
      }
    } catch (err) {
      toast.error('Error');
    }
  };

  const getStatusBadge = (status, isWinner) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">{t.waiting}</span>;
      case 'active':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full animate-pulse">{t.inProgress}</span>;
      case 'completed':
        return isWinner 
          ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1"><Crown className="w-3 h-3" />{t.won}</span>
          : <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{t.lost}</span>;
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 pt-20 px-4">
        <div className="max-w-md mx-auto text-center py-16">
          <Swords className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-gray-400">{t.loginRequired}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-900/20 to-gray-900 pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Swords className="w-10 h-10 text-red-500" />
            <h1 className="text-3xl font-black text-white">{t.title}</h1>
          </div>
          <p className="text-gray-400">{t.subtitle}</p>
        </div>

        {/* Create Duel Button */}
        {!showCreate && (
          <div className="mb-6">
            <Button 
              onClick={() => setShowCreate(true)}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-4 rounded-xl font-bold text-lg"
            >
              <Swords className="w-5 h-5 mr-2" />
              {t.createDuel}
            </Button>
          </div>
        )}

        {/* Create Duel Form */}
        {showCreate && (
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 mb-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                {t.createDuel}
              </h3>
              <button 
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Bet Amount */}
              <div>
                <label className="text-gray-300 text-sm mb-2 block">{t.betBids}</label>
                <div className="flex gap-2">
                  {[5, 10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        betAmount === amount
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opponent Selection */}
              <div>
                <label className="text-gray-300 text-sm mb-2 block">{t.opponent}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedOpponent(null)}
                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                      !selectedOpponent
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    {t.randomOpponent}
                  </button>
                </div>
              </div>

              {/* Start Button */}
              <Button 
                onClick={handleCreateDuel}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3"
              >
                <Zap className="w-5 h-5 mr-2" />
                {t.startDuel} ({betAmount} {t.betBids})
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'active', label: t.activeDuels, icon: <Flame className="w-4 h-4" /> },
            { id: 'challenges', label: t.pendingChallenges, icon: <Swords className="w-4 h-4" />, count: challenges.length },
            { id: 'history', label: t.history, icon: <Trophy className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <Swords className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
          </div>
        ) : (
          <>
            {/* Challenges */}
            {activeTab === 'challenges' && (
              <div className="space-y-4">
                {challenges.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t.noChallenges}</p>
                  </div>
                ) : (
                  challenges.map((challenge) => (
                    <div key={challenge.id} className="bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-red-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-bold">{challenge.challenger_name || 'Spieler'}</p>
                            <p className="text-gray-400 text-sm">{t.pot}: {challenge.bet_bids * 2} Gebote</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRespondDuel(challenge.id, 'accept')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleRespondDuel(challenge.id, 'decline')}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Active Duels */}
            {activeTab === 'active' && (
              <div className="space-y-4">
                {duels.filter(d => d.status === 'active' || d.status === 'pending').length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t.noDuels}</p>
                  </div>
                ) : (
                  duels.filter(d => d.status === 'active' || d.status === 'pending').map((duel) => (
                    <div key={duel.id} className="bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-red-500/30">
                      <div className="flex items-center justify-between mb-3">
                        {getStatusBadge(duel.status)}
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Gift className="w-4 h-4" />
                          {duel.total_pot} Gebote
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {/* Player 1 */}
                        <div className="text-center flex-1">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">👤</span>
                          </div>
                          <p className="text-white font-bold text-sm">{t.you}</p>
                          <p className="text-2xl font-black text-white">{duel.challenger_score || 0}</p>
                        </div>
                        
                        {/* VS */}
                        <div className="px-4">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-black text-sm">{t.vs}</span>
                          </div>
                        </div>
                        
                        {/* Player 2 */}
                        <div className="text-center flex-1">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">👤</span>
                          </div>
                          <p className="text-white font-bold text-sm">{duel.opponent_name || t.opponent}</p>
                          <p className="text-2xl font-black text-white">{duel.opponent_score || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {duels.filter(d => d.status === 'completed').length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Keine abgeschlossenen Duelle</p>
                  </div>
                ) : (
                  duels.filter(d => d.status === 'completed').map((duel) => (
                    <div key={duel.id} className="bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {duel.winner_id === user?.id ? (
                            <Crown className="w-8 h-8 text-amber-400" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-700 rounded-full" />
                          )}
                          <div>
                            <p className="text-white font-bold">vs {duel.opponent_name || 'Spieler'}</p>
                            <p className="text-gray-400 text-sm">{duel.challenger_score} - {duel.opponent_score}</p>
                          </div>
                        </div>
                        {getStatusBadge(duel.status, duel.winner_id === user?.id)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DuelsPage;
