/**
 * BidBlitz Mobility - Organization Management
 * Super Admin can manage partner organizations
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  Building2, Plus, Edit, Trash2, Users, Bike, Euro, Settings,
  Search, Filter, MoreVertical, Check, X, Loader2, Mail,
  Clock, Shield, ChevronDown, Eye, UserPlus
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Create/Edit Organization Modal
const OrgModal = ({ isOpen, onClose, org, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    description: '',
    logo_url: ''
  });
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (org) {
      setFormData({
        name: org.name || '',
        slug: org.slug || '',
        contact_email: org.contact_email || '',
        description: org.description || '',
        logo_url: org.logo_url || ''
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        contact_email: '',
        description: '',
        logo_url: ''
      });
    }
  }, [org]);
  
  const handleSlugify = (name) => {
    return name.toLowerCase()
      .replace(/[äöü]/g, c => ({ä:'ae',ö:'oe',ü:'ue'})[c])
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData, org?.id);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {org ? 'Organisation bearbeiten' : 'Neue Organisation'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: org ? formData.slug : handleSlugify(e.target.value)
                });
              }}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="z.B. Scooter Partner GmbH"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug (URL-Kennung) *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: handleSlugify(e.target.value)})}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
              placeholder="scooter-partner"
              pattern="[a-z0-9-]+"
              required
              disabled={!!org}
            />
            <p className="text-xs text-gray-500 mt-1">Nur Kleinbuchstaben, Zahlen und Bindestriche</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kontakt-E-Mail *
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="partner@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              placeholder="Kurze Beschreibung der Organisation..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {org ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Settings Modal
const SettingsModal = ({ isOpen, onClose, org, onSave }) => {
  const [settings, setSettings] = useState({
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    unlock_fee_cents: 100,
    per_minute_cents: 15,
    max_session_minutes: 120
  });
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (org?.settings) {
      setSettings(org.settings);
    }
  }, [org]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(org.id, settings);
      onClose();
    } finally {
      setSaving(false);
    }
  };
  
  if (!isOpen || !org) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Einstellungen: {org.name}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Währung
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zeitzone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="Europe/Berlin">Berlin (CET)</option>
                <option value="Asia/Dubai">Dubai (GST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Preisgestaltung
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Entsperrgebühr (Cent)
                </label>
                <input
                  type="number"
                  value={settings.unlock_fee_cents}
                  onChange={(e) => setSettings({...settings, unlock_fee_cents: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  min={0}
                />
                <p className="text-xs text-gray-400 mt-1">= €{(settings.unlock_fee_cents / 100).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Pro Minute (Cent)
                </label>
                <input
                  type="number"
                  value={settings.per_minute_cents}
                  onChange={(e) => setSettings({...settings, per_minute_cents: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  min={0}
                />
                <p className="text-xs text-gray-400 mt-1">= €{(settings.per_minute_cents / 100).toFixed(2)}/Min</p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max. Sitzungsdauer (Minuten)
            </label>
            <input
              type="number"
              value={settings.max_session_minutes}
              onChange={(e) => setSettings({...settings, max_session_minutes: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              min={1}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminOrganizations() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [search, setSearch] = useState('');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [settingsOrg, setSettingsOrg] = useState(null);
  
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/organizations/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(res.data.organizations || []);
    } catch (error) {
      toast.error('Fehler beim Laden der Organisationen');
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);
  
  const handleSaveOrg = async (data, orgId) => {
    try {
      if (orgId) {
        // Update
        await axios.patch(`${API}/organizations/${orgId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Organisation aktualisiert');
      } else {
        // Create
        await axios.post(`${API}/organizations/create`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Organisation erstellt');
      }
      fetchOrganizations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Speichern');
      throw error;
    }
  };
  
  const handleSaveSettings = async (orgId, settings) => {
    try {
      // Note: This would need a specific endpoint, using patch for now
      await axios.patch(`${API}/organizations/${orgId}`, { settings }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Einstellungen gespeichert');
      fetchOrganizations();
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen');
    }
  };
  
  const handleStatusChange = async (orgId, newStatus) => {
    try {
      await axios.patch(`${API}/organizations/${orgId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Status geändert zu: ${newStatus}`);
      fetchOrganizations();
    } catch (error) {
      toast.error('Fehler beim Ändern des Status');
    }
  };
  
  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.slug.toLowerCase().includes(search.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-emerald-600" />
            Partner-Organisationen
          </h2>
          <p className="text-gray-500 mt-1">{organizations.length} Organisationen verwalten</p>
        </div>
        <button
          onClick={() => { setEditingOrg(null); setShowOrgModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Neue Organisation
        </button>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Organisation suchen..."
          className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      
      {/* Mobile: Card Layout */}
      <div className="sm:hidden space-y-3">
        {filteredOrgs.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">
            {search ? 'Keine Organisationen gefunden' : 'Noch keine Organisationen'}
          </p>
        ) : (
          filteredOrgs.map(org => (
            <div key={org.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.slug}</p>
                  </div>
                </div>
                <select
                  value={org.status}
                  onChange={(e) => handleStatusChange(org.id, e.target.value)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border-0 cursor-pointer ${
                    org.status === 'active' ? 'bg-green-100 text-green-700' :
                    org.status === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  <option value="active">Aktiv</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Gesperrt</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Geräte</p>
                  <p className="font-bold text-gray-900 dark:text-white">{org.stats?.total_devices || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Fahrten</p>
                  <p className="font-bold text-gray-900 dark:text-white">{org.stats?.total_sessions || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Umsatz</p>
                  <p className="font-bold text-emerald-600">€{((org.stats?.total_revenue_cents || 0) / 100).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSettingsOrg(org)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300"
                >
                  <Settings className="w-3 h-3" /> Einstellungen
                </button>
                <button
                  onClick={() => { setEditingOrg(org); setShowOrgModal(true); }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300"
                >
                  <Edit className="w-3 h-3" /> Bearbeiten
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Organisation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Geräte</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Fahrten</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Umsatz</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {search ? 'Keine Organisationen gefunden' : 'Noch keine Organisationen'}
                  </td>
                </tr>
              ) : (
                filteredOrgs.map(org => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                          <p className="text-sm text-gray-500">{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={org.status}
                        onChange={(e) => handleStatusChange(org.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                          org.status === 'active' ? 'bg-green-100 text-green-700' :
                          org.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        <option value="active">Aktiv</option>
                        <option value="trial">Trial</option>
                        <option value="suspended">Gesperrt</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-900 dark:text-white">{org.stats?.total_devices || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-900 dark:text-white">{org.stats?.total_sessions || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-emerald-600">
                        €{((org.stats?.total_revenue_cents || 0) / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSettingsOrg(org)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => { setEditingOrg(org); setShowOrgModal(true); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modals */}
      <OrgModal
        isOpen={showOrgModal}
        onClose={() => { setShowOrgModal(false); setEditingOrg(null); }}
        org={editingOrg}
        onSave={handleSaveOrg}
      />
      
      <SettingsModal
        isOpen={!!settingsOrg}
        onClose={() => setSettingsOrg(null)}
        org={settingsOrg}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
