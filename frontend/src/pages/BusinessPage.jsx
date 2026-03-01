/**
 * Business Pages - Create/Join Business, Invite Codes, Members
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Building2, Copy, Share2, Users, Plus, X, Crown, ChevronRight, ArrowLeft, Loader2, Check, Shield } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function BusinessPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState('home');
  const [businesses, setBusinesses] = useState([]);
  const [invites, setInvites] = useState([]);
  const [members, setMembers] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizTax, setBizTax] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.all([
      axios.get(`${API}/business/me`, { headers }).then(r => setBusinesses(r.data.memberships || [])),
      axios.get(`${API}/business/invites`, { headers }).then(r => setInvites(r.data.invites || [])).catch(() => {}),
      axios.get(`${API}/business/members`, { headers }).then(r => setMembers(r.data.members || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [token]);

  const createBiz = async () => {
    if (!bizName.trim()) { toast.error('Name eingeben'); return; }
    setCreating(true);
    try {
      const r = await axios.post(`${API}/business/create`, { name: bizName, tax_id: bizTax || null }, { headers });
      toast.success(r.data.message);
      setTab('home');
      const m = await axios.get(`${API}/business/me`, { headers });
      setBusinesses(m.data.memberships || []);
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
    finally { setCreating(false); }
  };

  const createInvite = async () => {
    try {
      const r = await axios.post(`${API}/business/invites`, { expires_in_days: 30, max_uses: 50 }, { headers });
      toast.success(`Code: ${r.data.code}`);
      navigator.clipboard?.writeText(r.data.code);
      const i = await axios.get(`${API}/business/invites`, { headers });
      setInvites(i.data.invites || []);
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const joinBiz = async () => {
    if (!joinCode.trim()) return;
    try {
      const r = await axios.post(`${API}/business/join`, { code: joinCode }, { headers });
      toast.success(r.data.message || 'Beigetreten!');
      setJoinCode('');
      const m = await axios.get(`${API}/business/me`, { headers });
      setBusinesses(m.data.memberships || []);
    } catch (e) { toast.error(e.response?.data?.detail || 'Fehler'); }
  };

  const disableInvite = async (id) => {
    await axios.patch(`${API}/business/invites/${id}/disable`, {}, { headers });
    toast.success('Deaktiviert');
    const i = await axios.get(`${API}/business/invites`, { headers });
    setInvites(i.data.invites || []);
  };

  const removeMember = async (uid) => {
    await axios.delete(`${API}/business/members/${uid}`, { headers });
    toast.success('Entfernt');
    const m = await axios.get(`${API}/business/members`, { headers });
    setMembers(m.data.members || []);
  };

  if (loading) return <div className="min-h-screen bg-[#061520] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 pb-24" data-testid="business-page">
      <div className="px-4 pt-6 pb-4 text-center">
        <Building2 className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
        <h1 className="text-xl font-bold text-white">Firmenkonto</h1>
      </div>

      <div className="flex border-b border-white/10 px-4 mb-4">
        {[{id:'home',l:'Übersicht'},{id:'invites',l:'Einladungen'},{id:'members',l:'Mitglieder'},{id:'join',l:'Beitreten'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-3 text-xs font-medium text-center ${tab === t.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>{t.l}</button>
        ))}
      </div>

      <div className="px-4 max-w-lg mx-auto">
        {tab === 'home' && (
          <div className="space-y-4">
            {businesses.length > 0 ? businesses.map(b => (
              <div key={b.business_id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-cyan-400" /></div>
                  <div><p className="text-white font-bold">{b.business_name}</p><p className="text-slate-400 text-xs capitalize">{b.role}</p></div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Noch kein Firmenkonto</p>
              </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-bold text-sm">Neues Firmenkonto</h3>
              <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Firmenname" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30" />
              <input value={bizTax} onChange={e => setBizTax(e.target.value)} placeholder="Steuer-ID (optional)" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30" />
              <button onClick={createBiz} disabled={creating} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl disabled:opacity-50">{creating ? 'Erstelle...' : 'Firmenkonto erstellen'}</button>
            </div>
          </div>
        )}

        {tab === 'invites' && (
          <div className="space-y-3">
            <button onClick={createInvite} className="w-full py-3 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold rounded-xl flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Neuen Code erstellen</button>
            {invites.map(inv => (
              <div key={inv.invite_id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{inv.status}</span>
                  <span className="text-slate-500 text-xs">{inv.uses_count}/{inv.max_uses} genutzt</span>
                </div>
                {inv.note && <p className="text-white text-sm mb-2">{inv.note}</p>}
                <p className="text-slate-400 text-xs">Gültig bis: {inv.expires_at?.split('T')[0]}</p>
                {inv.status === 'active' && (
                  <button onClick={() => disableInvite(inv.invite_id)} className="mt-2 text-red-400 text-xs">Deaktivieren</button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-2">
            {members.length === 0 ? <p className="text-slate-500 text-center py-8">Keine Mitglieder</p> : members.map(m => (
              <div key={m.user_id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{m.name || m.email}</p>
                  <p className="text-slate-500 text-xs capitalize">{m.role}</p>
                </div>
                {m.role !== 'business_admin' && (
                  <button onClick={() => removeMember(m.user_id)} className="text-red-400 text-xs">Entfernen</button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'join' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-bold mb-3">Mit Code beitreten</h3>
            <p className="text-slate-400 text-xs mb-3">Format: BBX-XXXX-XXXX</p>
            <div className="flex gap-2">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="BBX-XXXX-XXXX" maxLength={14} className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-center uppercase" />
              <button onClick={joinBiz} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl"><Check className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
