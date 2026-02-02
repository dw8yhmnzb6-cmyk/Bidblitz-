import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Star, Plus, CheckCircle, Trash2, Edit, X, Save, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AdminInfluencers({ token, influencers, setInfluencers, fetchData }) {
  const [showInfluencerModal, setShowInfluencerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [managers, setManagers] = useState([]);
  const [influencerForm, setInfluencerForm] = useState({
    name: '', code: '', commission_percent: 10, email: '', instagram: '', youtube: '', tiktok: '', city: ''
  });
  const [editForm, setEditForm] = useState({
    name: '', commission_percent: 10, email: '', instagram: '', youtube: '', tiktok: '', city: '', manager_id: '', is_active: true
  });

  // Fetch managers for dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await axios.get(`${API}/manager/admin/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setManagers(res.data.managers || []);
      } catch (error) {
        console.error('Error fetching managers:', error);
      }
    };
    fetchManagers();
  }, [token]);

  const handleCreateInfluencer = async () => {
    try {
      const res = await axios.post(`${API}/influencer/admin/create`, influencerForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Influencer erstellt');
      setInfluencers([...influencers, res.data]);
      setShowInfluencerModal(false);
      setInfluencerForm({ name: '', code: '', commission_percent: 10, email: '', instagram: '', youtube: '', tiktok: '', city: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Erstellen');
    }
  };

  const handleEditInfluencer = (influencer) => {
    setSelectedInfluencer(influencer);
    setEditForm({
      name: influencer.name || '',
      commission_percent: influencer.commission_percent || 10,
      email: influencer.email || '',
      instagram: influencer.instagram || '',
      youtube: influencer.youtube || '',
      tiktok: influencer.tiktok || '',
      city: influencer.city || '',
      manager_id: influencer.manager_id || '',
      is_active: influencer.is_active !== false
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInfluencer) return;
    try {
      await axios.put(`${API}/influencer/admin/${selectedInfluencer.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Influencer aktualisiert');
      setInfluencers(influencers.map(i => 
        i.id === selectedInfluencer.id ? { ...i, ...editForm } : i
      ));
      setShowEditModal(false);
      setSelectedInfluencer(null);
      if (fetchData) fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Speichern');
    }
  };

  const handleToggleInfluencer = async (influencerId, isActive) => {
    try {
      await axios.put(`${API}/influencer/admin/${influencerId}`, { is_active: !isActive }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isActive ? 'Influencer deaktiviert' : 'Influencer aktiviert');
      setInfluencers(influencers.map(i => 
        i.id === influencerId ? { ...i, is_active: !isActive } : i
      ));
    } catch (error) {
      toast.error('Fehler');
    }
  };

  const handleDeleteInfluencer = async (influencerId) => {
    if (!window.confirm('Influencer wirklich löschen?')) return;
    try {
      await axios.delete(`${API}/influencer/admin/${influencerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Influencer gelöscht');
      setInfluencers(influencers.filter(i => i.id !== influencerId));
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-[#FFD700]" />
          Influencer verwalten
        </h1>
        <Button
          onClick={() => setShowInfluencerModal(true)}
          className="bg-[#10B981] hover:bg-[#10B981]/80"
          data-testid="new-influencer-btn"
        >
          <Plus className="w-4 h-4 mr-1" />
          Neuer Influencer
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[#94A3B8] text-sm">Gesamt Influencer</p>
          <p className="text-2xl font-bold text-white">{influencers.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[#94A3B8] text-sm">Gesamt Kunden</p>
          <p className="text-2xl font-bold text-[#06B6D4]">
            {influencers.reduce((sum, i) => sum + (i.total_customers || 0), 0)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[#94A3B8] text-sm">Gesamt Umsatz</p>
          <p className="text-2xl font-bold text-[#10B981]">
            €{influencers.reduce((sum, i) => sum + (i.total_revenue || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[#94A3B8] text-sm">Ausstehende Provision</p>
          <p className="text-2xl font-bold text-[#F59E0B]">
            €{influencers.reduce((sum, i) => sum + (i.total_commission || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Commission Tiers Info */}
      <div className="glass-card rounded-xl p-4 border-l-4 border-[#FFD700]">
        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-[#FFD700]" />
          Staffelprovisionen - Je mehr Kunden, desto mehr Provision!
        </h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="px-3 py-1 rounded-full bg-[#CD7F32]/20 text-[#CD7F32]">🥉 Bronze: 0-10 Kunden (Basis)</span>
          <span className="px-3 py-1 rounded-full bg-[#C0C0C0]/20 text-[#C0C0C0]">🥈 Silber: 11-50 (+2%)</span>
          <span className="px-3 py-1 rounded-full bg-[#FFD700]/20 text-[#FFD700]">🥇 Gold: 51-100 (+3%)</span>
          <span className="px-3 py-1 rounded-full bg-[#E5E4E2]/20 text-[#E5E4E2]">💎 Platin: 100+ (+5%)</span>
        </div>
      </div>

      {/* Influencer List */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#181824] border-b border-white/10">
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Name</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Code</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Stadt</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Tier</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Provision</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Kunden</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Umsatz</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Status</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {influencers.map((influencer) => (
              <tr key={influencer.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{influencer.name}</p>
                    {influencer.instagram && (
                      <p className="text-[#94A3B8] text-xs">@{influencer.instagram}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="bg-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded text-sm font-bold">
                    {influencer.code}
                  </code>
                </td>
                <td className="px-4 py-3">
                  {influencer.city ? (
                    <span className="flex items-center gap-1 text-[#7C3AED] text-sm">
                      <MapPin className="w-3 h-3" />
                      {influencer.city}
                    </span>
                  ) : (
                    <span className="text-[#94A3B8] text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    influencer.commission_tier === 'Platin' ? 'bg-[#E5E4E2]/20 text-[#E5E4E2]' :
                    influencer.commission_tier === 'Gold' ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                    influencer.commission_tier === 'Silber' ? 'bg-[#C0C0C0]/20 text-[#C0C0C0]' :
                    'bg-[#CD7F32]/20 text-[#CD7F32]'
                  }`}>
                    {influencer.commission_tier === 'Platin' ? '💎' : 
                     influencer.commission_tier === 'Gold' ? '🥇' :
                     influencer.commission_tier === 'Silber' ? '🥈' : '🥉'} {influencer.commission_tier || 'Bronze'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-white font-bold">{influencer.effective_commission || influencer.commission_percent}%</span>
                    {influencer.tier_bonus > 0 && (
                      <span className="text-[#10B981] text-xs ml-1">(+{influencer.tier_bonus}%)</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#06B6D4] font-medium">{influencer.total_customers || 0}</td>
                <td className="px-4 py-3 text-[#10B981] font-medium">€{(influencer.total_revenue || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${influencer.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {influencer.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditInfluencer(influencer)}
                      className="text-[#7C3AED] hover:bg-[#7C3AED]/10"
                      title="Bearbeiten"
                      data-testid={`edit-influencer-${influencer.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleInfluencer(influencer.id, influencer.is_active)}
                      className={influencer.is_active ? 'text-green-400' : 'text-gray-400'}
                      title={influencer.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteInfluencer(influencer.id)}
                      className="text-red-400 hover:bg-red-400/10"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {influencers.length === 0 && (
          <div className="p-8 text-center">
            <Star className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <p className="text-[#94A3B8]">Noch keine Influencer vorhanden</p>
          </div>
        )}
      </div>

      {/* New Influencer Modal */}
      {showInfluencerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F0F16] rounded-xl p-6 max-w-md w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#FFD700]" />
              Neuer Influencer
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Name *</Label>
                <Input
                  value={influencerForm.name}
                  onChange={(e) => setInfluencerForm({...influencerForm, name: e.target.value})}
                  placeholder="z.B. Max Mustermann"
                  className="bg-[#181824] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Code * (erscheint als Gutscheincode)</Label>
                <Input
                  value={influencerForm.code}
                  onChange={(e) => setInfluencerForm({...influencerForm, code: e.target.value.toLowerCase()})}
                  placeholder="z.B. maxpower"
                  className="bg-[#181824] border-white/10 text-white"
                />
                <p className="text-[#94A3B8] text-xs mt-1">Kunden geben diesen Code ein um Rabatt zu bekommen</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Provision (%)</Label>
                  <Input
                    type="number"
                    value={influencerForm.commission_percent}
                    onChange={(e) => setInfluencerForm({...influencerForm, commission_percent: parseFloat(e.target.value) || 0})}
                    placeholder="10"
                    className="bg-[#181824] border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Stadt</Label>
                  <Input
                    value={influencerForm.city}
                    onChange={(e) => setInfluencerForm({...influencerForm, city: e.target.value})}
                    placeholder="z.B. Berlin"
                    className="bg-[#181824] border-white/10 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white">E-Mail</Label>
                <Input
                  type="email"
                  value={influencerForm.email}
                  onChange={(e) => setInfluencerForm({...influencerForm, email: e.target.value})}
                  placeholder="influencer@email.com"
                  className="bg-[#181824] border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-white text-xs">Instagram</Label>
                  <Input
                    value={influencerForm.instagram}
                    onChange={(e) => setInfluencerForm({...influencerForm, instagram: e.target.value})}
                    placeholder="@username"
                    className="bg-[#181824] border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-white text-xs">YouTube</Label>
                  <Input
                    value={influencerForm.youtube}
                    onChange={(e) => setInfluencerForm({...influencerForm, youtube: e.target.value})}
                    placeholder="Channel"
                    className="bg-[#181824] border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-white text-xs">TikTok</Label>
                  <Input
                    value={influencerForm.tiktok}
                    onChange={(e) => setInfluencerForm({...influencerForm, tiktok: e.target.value})}
                    placeholder="@username"
                    className="bg-[#181824] border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInfluencerModal(false);
                  setInfluencerForm({ name: '', code: '', commission_percent: 10, email: '', instagram: '', youtube: '', tiktok: '', city: '' });
                }}
                className="border-white/20 text-white"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleCreateInfluencer}
                disabled={!influencerForm.name || !influencerForm.code}
                className="bg-[#10B981] hover:bg-[#10B981]/80"
              >
                <Plus className="w-4 h-4 mr-1" />
                Erstellen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Influencer Modal */}
      {showEditModal && selectedInfluencer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F0F16] rounded-xl p-6 max-w-lg w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#7C3AED]" />
                Influencer bearbeiten
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedInfluencer(null);
                }}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Influencer Code (read-only) */}
            <div className="mb-4 p-3 bg-[#181824] rounded-lg">
              <p className="text-[#94A3B8] text-xs mb-1">Influencer-Code (nicht änderbar)</p>
              <code className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded text-lg font-bold">
                {selectedInfluencer.code}
              </code>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="bg-[#181824] border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Provision (%)</Label>
                  <Input
                    type="number"
                    value={editForm.commission_percent}
                    onChange={(e) => setEditForm({...editForm, commission_percent: parseFloat(e.target.value) || 0})}
                    className="bg-[#181824] border-white/10 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-white">E-Mail</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="bg-[#181824] border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Stadt
                  </Label>
                  <Input
                    value={editForm.city}
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    placeholder="z.B. Berlin"
                    className="bg-[#181824] border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Manager
                  </Label>
                  <Select
                    value={editForm.manager_id || "none"}
                    onValueChange={(value) => setEditForm({...editForm, manager_id: value === "none" ? "" : value})}
                  >
                    <SelectTrigger className="bg-[#181824] border-white/10 text-white">
                      <SelectValue placeholder="Kein Manager" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181824] border-white/10">
                      <SelectItem value="none" className="text-white">Kein Manager</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id} className="text-white">
                          {manager.name} ({manager.cities?.join(', ') || 'Keine Stadt'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-white text-xs">Instagram</Label>
                  <Input
                    value={editForm.instagram}
                    onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                    placeholder="@username"
                    className="bg-[#181824] border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white text-xs">YouTube</Label>
                  <Input
                    value={editForm.youtube}
                    onChange={(e) => setEditForm({...editForm, youtube: e.target.value})}
                    placeholder="Channel"
                    className="bg-[#181824] border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white text-xs">TikTok</Label>
                  <Input
                    value={editForm.tiktok}
                    onChange={(e) => setEditForm({...editForm, tiktok: e.target.value})}
                    placeholder="@username"
                    className="bg-[#181824] border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-[#181824] rounded-lg">
                <Label className="text-white mb-2 block">Status</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditForm({...editForm, is_active: true})}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      editForm.is_active 
                        ? 'bg-green-500 text-white' 
                        : 'bg-[#0F0F16] text-[#94A3B8] hover:bg-[#252532]'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Aktiv
                  </button>
                  <button
                    onClick={() => setEditForm({...editForm, is_active: false})}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      !editForm.is_active 
                        ? 'bg-red-500 text-white' 
                        : 'bg-[#0F0F16] text-[#94A3B8] hover:bg-[#252532]'
                    }`}
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Inaktiv
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedInfluencer(null);
                }}
                className="border-white/20 text-white"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-[#7C3AED] hover:bg-[#7C3AED]/80"
              >
                <Save className="w-4 h-4 mr-1" />
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
