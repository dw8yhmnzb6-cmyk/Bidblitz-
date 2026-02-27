/**
 * Group Rides Page - Create and join group scooter rides
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, Plus, Copy, LogOut, Crown, Loader2, UserPlus, Share2, ArrowLeft, Bike, Check } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function GroupRidesPage() {
  const { token, user } = useAuth();
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [view, setView] = useState('main'); // main, create

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get(`${API}/scooter-features/groups/my-group`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMyGroup(res.data.group))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (paymentMode) => {
    setCreating(true);
    try {
      const res = await axios.post(`${API}/scooter-features/groups/create`, {
        payment_mode: paymentMode, max_riders: 5
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(res.data.message);
      setMyGroup(res.data.group);
      setView('main');
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setCreating(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const res = await axios.post(`${API}/scooter-features/groups/join`, { group_code: joinCode }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(res.data.message);
      // Refresh
      const grp = await axios.get(`${API}/scooter-features/groups/my-group`, { headers: { Authorization: `Bearer ${token}` } });
      setMyGroup(grp.data.group);
      setJoinCode('');
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!myGroup) return;
    try {
      await axios.post(`${API}/scooter-features/groups/${myGroup.id}/leave`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Gruppe verlassen');
      setMyGroup(null);
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(myGroup?.code || '');
    toast.success('Code kopiert!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;

  // Create View
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white p-4 pb-24" data-testid="group-create-view">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-violet-600 text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurueck
        </button>
        <div className="text-center mb-8">
          <Users className="w-14 h-14 text-violet-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-800">Gruppe erstellen</h1>
          <p className="text-slate-500 text-sm mt-1">Wer zahlt die Fahrten?</p>
        </div>
        <div className="space-y-4 max-w-sm mx-auto">
          <button onClick={() => handleCreate('leader_pays')} disabled={creating}
            className="w-full p-5 bg-white rounded-2xl border-2 border-violet-200 hover:border-violet-500 transition-all text-left">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6 text-amber-500" />
              <h3 className="font-bold text-slate-800">Ich zahle fuer alle</h3>
            </div>
            <p className="text-sm text-slate-500">Alle Fahrten werden von deinem Wallet abgebucht</p>
          </button>
          <button onClick={() => handleCreate('split')} disabled={creating}
            className="w-full p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-violet-500 transition-all text-left">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-violet-500" />
              <h3 className="font-bold text-slate-800">Jeder zahlt selbst</h3>
            </div>
            <p className="text-sm text-slate-500">Jedes Gruppenmitglied zahlt seine eigene Fahrt</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white p-4 pb-24" data-testid="group-rides-page">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Gruppen-Fahrten</h1>
          <p className="text-slate-500 text-sm mt-1">Fahr zusammen mit Freunden</p>
        </div>

        {/* Active Group */}
        {myGroup ? (
          <div className="bg-white rounded-2xl border border-violet-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg">{myGroup.name}</h2>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">{myGroup.payment_mode === 'leader_pays' ? 'Leader zahlt' : 'Jeder zahlt'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-3 mt-3">
                <span className="text-2xl font-mono font-bold tracking-wider flex-1">{myGroup.code}</span>
                <button onClick={copyCode} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                  <Copy className="w-5 h-5" />
                </button>
                <button onClick={() => { if (navigator.share) navigator.share({ title: 'BidBlitz Gruppen-Fahrt', text: `Tritt meiner Scooter-Gruppe bei! Code: ${myGroup.code}` }); }}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-violet-200 text-xs mt-2">Teile den Code mit deinen Freunden</p>
            </div>

            {/* Members */}
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Mitglieder ({myGroup.members?.length || 0}/{myGroup.max_riders})</h3>
              <div className="space-y-2">
                {(myGroup.members || []).map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-600">
                      {m.name?.charAt(0) || '?'}
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-800">{m.name}</span>
                    {m.role === 'leader' && <Crown className="w-4 h-4 text-amber-500" />}
                    {m.session_id && <Bike className="w-4 h-4 text-emerald-500" />}
                  </div>
                ))}
              </div>
              <button onClick={handleLeave} className="mt-4 w-full py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100">
                <LogOut className="w-4 h-4 inline mr-1" /> {myGroup.leader_id === user?.id ? 'Gruppe aufloesen' : 'Gruppe verlassen'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Create Group */}
            <button onClick={() => setView('create')}
              className="w-full p-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl text-white flex items-center gap-4 mb-4 hover:opacity-90 transition-all"
              data-testid="create-group-btn">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Plus className="w-6 h-6" /></div>
              <div className="text-left"><h3 className="font-bold">Gruppe erstellen</h3><p className="text-violet-200 text-sm">Lade bis zu 5 Freunde ein</p></div>
            </button>

            {/* Join Group */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><UserPlus className="w-5 h-5 text-violet-500" /> Gruppe beitreten</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Gruppen-Code eingeben"
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono uppercase tracking-wider"
                  maxLength={6}
                  data-testid="join-code-input"
                />
                <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
                  className="px-5 py-3 bg-violet-600 text-white font-bold rounded-xl disabled:opacity-50"
                  data-testid="join-group-btn">
                  {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* How it works */}
        <div className="mt-6 bg-violet-50 border border-violet-200 rounded-2xl p-5">
          <h3 className="font-bold text-violet-800 text-sm mb-3">So funktioniert es</h3>
          <div className="space-y-2 text-sm text-violet-700">
            <p>1. Erstelle eine Gruppe und teile den Code</p>
            <p>2. Freunde treten mit dem Code bei (max. 5)</p>
            <p>3. Jeder mietet einen eigenen Scooter</p>
            <p>4. Leader zahlt fuer alle oder jeder zahlt selbst</p>
          </div>
        </div>
      </div>
    </div>
  );
}
