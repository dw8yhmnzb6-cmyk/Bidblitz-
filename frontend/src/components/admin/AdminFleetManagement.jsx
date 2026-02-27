/**
 * BidBlitz Mobility - Fleet Management
 * Manage scooters and devices across organizations
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  Bike, Plus, Edit, Trash2, MapPin, Battery, Wrench,
  Search, Filter, Check, X, Loader2, QrCode, Eye,
  Power, AlertTriangle, CheckCircle, Clock, RefreshCw
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    available: { label: 'Verfügbar', color: 'green', icon: CheckCircle },
    in_use: { label: 'In Benutzung', color: 'blue', icon: Bike },
    maintenance: { label: 'Wartung', color: 'yellow', icon: Wrench },
    disabled: { label: 'Deaktiviert', color: 'red', icon: X }
  };
  const { label, color, icon: Icon } = config[status] || config.available;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// Device Modal (Create/Edit)
const DeviceModal = ({ isOpen, onClose, device, onSave }) => {
  const [formData, setFormData] = useState({
    serial: '',
    type: 'scooter',
    name: '',
    location: '',
    lat: '',
    lng: '',
    pricing_unlock_cents: '',
    pricing_per_minute_cents: ''
  });
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (device) {
      setFormData({
        serial: device.serial || '',
        type: device.type || 'scooter',
        name: device.name || '',
        location: device.location || '',
        lat: device.lat || '',
        lng: device.lng || '',
        pricing_unlock_cents: device.pricing?.unlock_cents || '',
        pricing_per_minute_cents: device.pricing?.per_minute_cents || ''
      });
    } else {
      setFormData({
        serial: '',
        type: 'scooter',
        name: '',
        location: '',
        lat: '',
        lng: '',
        pricing_unlock_cents: '',
        pricing_per_minute_cents: ''
      });
    }
  }, [device]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        pricing_unlock_cents: formData.pricing_unlock_cents ? parseInt(formData.pricing_unlock_cents) : null,
        pricing_per_minute_cents: formData.pricing_per_minute_cents ? parseInt(formData.pricing_per_minute_cents) : null
      };
      await onSave(data, device?.id);
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
            {device ? 'Gerät bearbeiten' : 'Neues Gerät'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seriennummer *
              </label>
              <input
                type="text"
                value={formData.serial}
                onChange={(e) => setFormData({...formData, serial: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono"
                placeholder="SCOOT-001"
                required
                disabled={!!device}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="scooter">🛴 Scooter</option>
                <option value="bike">🚲 Fahrrad</option>
                <option value="ebike">⚡ E-Bike</option>
                <option value="locker">🔐 Schließfach</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="BidBlitz Scooter #1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Standort
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Dubai Marina"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({...formData, lat: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="25.0775"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({...formData, lng: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="55.1346"
              />
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Preisüberschreibung (optional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Entsperrgebühr (Cent)
                </label>
                <input
                  type="number"
                  value={formData.pricing_unlock_cents}
                  onChange={(e) => setFormData({...formData, pricing_unlock_cents: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Org-Standard"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Pro Minute (Cent)
                </label>
                <input
                  type="number"
                  value={formData.pricing_per_minute_cents}
                  onChange={(e) => setFormData({...formData, pricing_per_minute_cents: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Org-Standard"
                />
              </div>
            </div>
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
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {device ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminFleetManagement() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/devices/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(res.data.devices || []);
    } catch (error) {
      toast.error('Fehler beim Laden der Geräte');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);
  
  const handleSaveDevice = async (data, deviceId) => {
    try {
      if (deviceId) {
        await axios.patch(`${API}/devices/${deviceId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Gerät aktualisiert');
      } else {
        await axios.post(`${API}/devices/create`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Gerät erstellt');
      }
      fetchDevices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Speichern');
      throw error;
    }
  };
  
  const handleStatusChange = async (deviceId, newStatus) => {
    try {
      await axios.patch(`${API}/devices/${deviceId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Status geändert`);
      fetchDevices();
    } catch (error) {
      toast.error('Fehler beim Ändern des Status');
    }
  };
  
  const handleDelete = async (deviceId) => {
    if (!window.confirm('Gerät wirklich deaktivieren?')) return;
    
    try {
      await axios.delete(`${API}/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Gerät deaktiviert');
      fetchDevices();
    } catch (error) {
      toast.error('Fehler beim Deaktivieren');
    }
  };
  
  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.name?.toLowerCase().includes(search.toLowerCase()) ||
      device.serial?.toLowerCase().includes(search.toLowerCase()) ||
      device.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  // Stats
  const stats = {
    total: devices.length,
    available: devices.filter(d => d.status === 'available').length,
    inUse: devices.filter(d => d.status === 'in_use').length,
    maintenance: devices.filter(d => d.status === 'maintenance').length
  };
  
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
            <Bike className="w-7 h-7 text-emerald-600" />
            Flottenmanagement
          </h2>
          <p className="text-gray-500 mt-1">{devices.length} Geräte verwalten</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRefreshing(true); fetchDevices(); }}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setEditingDevice(null); setShowDeviceModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Neues Gerät
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Gesamt</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600">Verfügbar</p>
          <p className="text-2xl font-bold text-green-700">{stats.available}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600">In Benutzung</p>
          <p className="text-2xl font-bold text-blue-700">{stats.inUse}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-600">Wartung</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.maintenance}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Gerät suchen..."
            className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Alle Status</option>
          <option value="available">Verfügbar</option>
          <option value="in_use">In Benutzung</option>
          <option value="maintenance">Wartung</option>
          <option value="disabled">Deaktiviert</option>
        </select>
      </div>
      
      {/* Devices Grid */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <Bike className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Keine Geräte gefunden</p>
          <button
            onClick={() => setShowDeviceModal(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm"
          >
            Erstes Gerät hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => (
            <div
              key={device.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <Bike className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{device.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{device.serial}</p>
                    </div>
                  </div>
                  <StatusBadge status={device.status} />
                </div>
                
                <div className="space-y-2 text-sm">
                  {device.location && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{device.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Battery className="w-4 h-4" />
                    <span>{device.battery_percent ?? '~'}% Akku</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Fahrten: {device.stats?.total_sessions || 0}</span>
                    <span className="text-emerald-600 font-medium">
                      €{((device.stats?.total_revenue_cents || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <select
                  value={device.status}
                  onChange={(e) => handleStatusChange(device.id, e.target.value)}
                  className="text-xs px-2 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="available">Verfügbar</option>
                  <option value="maintenance">Wartung</option>
                  <option value="disabled">Deaktiviert</option>
                </select>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingDevice(device); setShowDeviceModal(true); }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                    title="Deaktivieren"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Device Modal */}
      <DeviceModal
        isOpen={showDeviceModal}
        onClose={() => { setShowDeviceModal(false); setEditingDevice(null); }}
        device={editingDevice}
        onSave={handleSaveDevice}
      />
    </div>
  );
}
