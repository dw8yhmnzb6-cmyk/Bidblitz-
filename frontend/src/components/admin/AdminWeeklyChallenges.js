import { useState, useEffect } from 'react';
import { Trophy, Users, Gift, Calendar, Plus, Crown, Medal, Award, Trash2, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminWeeklyChallenges() {
  const { token } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: 'Wer spart diese Woche am meisten?',
    prize_bids: 100,
    duration_days: 7
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(`${API}/weekly-challenge/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChallenges(response.data.challenges || []);
    } catch (error) {
      toast.error('Fehler beim Laden der Challenges');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (challengeId) => {
    try {
      const response = await axios.get(`${API}/weekly-challenge/admin/${challengeId}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      toast.error('Fehler beim Laden des Leaderboards');
    }
  };

  const createChallenge = async () => {
    if (!newChallenge.title) {
      toast.error('Titel ist erforderlich');
      return;
    }
    
    try {
      await axios.post(`${API}/weekly-challenge/admin/create`, newChallenge, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Challenge erstellt!');
      setShowCreateModal(false);
      setNewChallenge({
        title: '',
        description: 'Wer spart diese Woche am meisten?',
        prize_bids: 100,
        duration_days: 7
      });
      fetchChallenges();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Erstellen');
    }
  };

  const endChallenge = async (challengeId) => {
    if (!window.confirm('Challenge beenden und Preis vergeben?')) return;
    
    try {
      const response = await axios.post(`${API}/weekly-challenge/admin/${challengeId}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.winner) {
        toast.success(`🏆 Gewinner: ${response.data.winner.username} erhält ${response.data.winner.prize_awarded} Gebote!`);
      } else {
        toast.info('Challenge beendet - keine Teilnehmer');
      }
      
      fetchChallenges();
      setSelectedChallenge(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Beenden');
    }
  };

  const deleteChallenge = async (challengeId) => {
    if (!window.confirm('Challenge wirklich löschen?')) return;
    
    try {
      await axios.delete(`${API}/weekly-challenge/admin/${challengeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Challenge gelöscht');
      fetchChallenges();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Löschen');
    }
  };

  const selectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    fetchLeaderboard(challenge.id);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktiv' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Beendet' },
      ended_early: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Vorzeitig beendet' }
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return 'Abgelaufen';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}T ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-orange-500" />
            Wöchentliche Challenges
          </h2>
          <p className="text-gray-500 text-sm mt-1">Verwalte Wettbewerbe und vergebe Preise</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neue Challenge
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{challenges.length}</p>
              <p className="text-xs text-gray-500">Challenges</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {challenges.filter(c => c.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500">Aktiv</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {challenges.reduce((sum, c) => sum + (c.participant_count || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Teilnehmer</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {challenges.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.prize_bids || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Gebote vergeben</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Challenges List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Alle Challenges</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {challenges.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Keine Challenges vorhanden</p>
              </div>
            ) : (
              challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  onClick={() => selectChallenge(challenge)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChallenge?.id === challenge.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800 truncate">{challenge.title}</h4>
                        {getStatusBadge(challenge.status)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{challenge.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {challenge.participant_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {challenge.prize_bids} Gebote
                        </span>
                        {challenge.status === 'active' && (
                          <span className="flex items-center gap-1 text-orange-500">
                            <Clock className="w-3 h-3" />
                            {getTimeRemaining(challenge.end_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Top 3 Preview */}
                  {challenge.top_participants?.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      {challenge.top_participants.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {getRankIcon(i + 1)}
                          <span className="text-gray-600">{p.username}</span>
                          <span className="text-green-600 font-medium">€{p.total_savings?.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Challenge Details / Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {selectedChallenge ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedChallenge.title}</h3>
                    <p className="text-sm text-gray-500">{selectedChallenge.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedChallenge.status === 'active' && (
                      <Button
                        onClick={() => endChallenge(selectedChallenge.id)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Beenden
                      </Button>
                    )}
                    {(selectedChallenge.participant_count || 0) === 0 && (
                      <Button
                        onClick={() => deleteChallenge(selectedChallenge.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Challenge Info */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{selectedChallenge.prize_bids}</p>
                    <p className="text-xs text-gray-500">Preis (Gebote)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">{selectedChallenge.participant_count || 0}</p>
                    <p className="text-xs text-gray-500">Teilnehmer</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {selectedChallenge.status === 'active' ? getTimeRemaining(selectedChallenge.end_date) : '-'}
                    </p>
                    <p className="text-xs text-gray-500">Verbleibend</p>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="p-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  Leaderboard
                </h4>
                
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Noch keine Teilnehmer</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          entry.rank === 1 ? 'bg-yellow-50 border border-yellow-200' :
                          entry.rank === 2 ? 'bg-gray-50 border border-gray-200' :
                          entry.rank === 3 ? 'bg-amber-50 border border-amber-200' :
                          'bg-gray-50'
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{entry.username}</p>
                          <p className="text-xs text-gray-500 truncate">{entry.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">€{entry.total_savings?.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{entry.wins_count} Siege</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Wähle eine Challenge aus</p>
              <p className="text-sm mt-1">um Details und Leaderboard zu sehen</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                Neue Challenge erstellen
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                  placeholder="z.B. Woche 7 - Großes Sparen"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <input
                  type="text"
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preis (Gebote)</label>
                  <input
                    type="number"
                    value={newChallenge.prize_bids}
                    onChange={(e) => setNewChallenge({...newChallenge, prize_bids: parseInt(e.target.value) || 0})}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (Tage)</label>
                  <input
                    type="number"
                    value={newChallenge.duration_days}
                    onChange={(e) => setNewChallenge({...newChallenge, duration_days: parseInt(e.target.value) || 7})}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={createChallenge}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                Challenge erstellen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
