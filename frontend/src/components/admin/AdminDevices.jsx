/**
 * Admin Devices Management - Scooter/Device Unlock System
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bike, MapPin, Plus, Edit, Trash2, Power, Settings, 
  Activity, Clock, DollarSign, RefreshCw, Search,
  CheckCircle, XCircle, Wrench, Ban
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const API = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  available: { label: 'Verfügbar', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  in_use: { label: 'In Benutzung', color: 'bg-blue-100 text-blue-700', icon: Activity },
  maintenance: { label: 'Wartung', color: 'bg-yellow-100 text-yellow-700', icon: Wrench },
  disabled: { label: 'Deaktiviert', color: 'bg-red-100 text-red-700', icon: Ban }
};

const typeConfig = {
  scooter: { label: 'E-Scooter', icon: '🛴' },
  bike: { label: 'E-Bike', icon: '🚲' },
  locker: { label: 'Schließfach', icon: '🔐' },
  gate: { label: 'Tor', icon: '🚪' }
};

export default function AdminDevices({ token }) {
  const [devices, setDevices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('devices');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ serial: '', type: 'scooter', name: '', location: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesRes] = await Promise.all([
        axios.get(`${API}/api/devices/admin/list`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDevices(devicesRes.data.devices || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async () => {
    try {
      await axios.post(`${API}/api/devices/admin/create`, newDevice, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setNewDevice({ serial: '', type: 'scooter', name: '', location: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Fehler beim Erstellen');
    }
  };

  const handleUpdateStatus = async (deviceId, newStatus) => {
    try {
      await axios.patch(`${API}/api/devices/admin/${deviceId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Fehler beim Aktualisieren');
    }
  };

  const filteredDevices = devices.filter(d => 
    d.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: devices.length,
    available: devices.filter(d => d.status === 'available').length,
    in_use: devices.filter(d => d.status === 'in_use').length,
    maintenance: devices.filter(d => d.status === 'maintenance').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Geräte-Verwaltung</h1>
            <p className="text-slate-500 text-sm">Scooter, E-Bikes & mehr</p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="w-4 h-4 mr-2" /> Gerät hinzufügen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Gesamt</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 shadow-sm border border-emerald-100">
          <p className="text-emerald-600 text-sm">Verfügbar</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.available}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
          <p className="text-blue-600 text-sm">In Benutzung</p>
          <p className="text-2xl font-bold text-blue-700">{stats.in_use}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
          <p className="text-yellow-600 text-sm">Wartung</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.maintenance}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Suche nach Seriennummer, Name oder Standort..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Devices List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Gerät</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Typ</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Standort</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Sessions</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Umsatz</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDevices.map((device) => {
                const status = statusConfig[device.status] || statusConfig.available;
                const type = typeConfig[device.type] || typeConfig.scooter;
                const StatusIcon = status.icon;
                return (
                  <tr key={device.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{device.name || device.serial}</p>
                        <p className="text-xs text-slate-400">{device.serial}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <span>{type.icon}</span>
                        <span className="text-slate-600">{type.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-4 h-4" />
                        {device.location || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{device.total_sessions || 0}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-600 font-medium">
                        €{((device.total_revenue_cents || 0) / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <select
                          value={device.status}
                          onChange={(e) => handleUpdateStatus(device.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="available">Verfügbar</option>
                          <option value="maintenance">Wartung</option>
                          <option value="disabled">Deaktiviert</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    Keine Geräte gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Neues Gerät hinzufügen</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600">Seriennummer *</label>
                <Input
                  value={newDevice.serial}
                  onChange={(e) => setNewDevice({...newDevice, serial: e.target.value})}
                  placeholder="z.B. SCOOTER-001"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Typ *</label>
                <select
                  value={newDevice.type}
                  onChange={(e) => setNewDevice({...newDevice, type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="scooter">🛴 E-Scooter</option>
                  <option value="bike">🚲 E-Bike</option>
                  <option value="locker">🔐 Schließfach</option>
                  <option value="gate">🚪 Tor</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Name</label>
                <Input
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                  placeholder="z.B. E-Scooter Dubai Marina"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Standort</label>
                <Input
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                  placeholder="z.B. Dubai Marina"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button onClick={handleAddDevice} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                Hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
