import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { 
  Users, UserPlus, Eye, Edit, MapPin, DollarSign, 
  Activity, X, Building2, Percent
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AdminManagers({ token, language = 'de' }) {
  // States
  const [managers, setManagers] = useState([]);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showManagerDetails, setShowManagerDetails] = useState(false);
  const [showEditManagerModal, setShowEditManagerModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [managerInfluencers, setManagerInfluencers] = useState([]);
  const [managerActivities, setManagerActivities] = useState([]);
  const [loadingManagerDetails, setLoadingManagerDetails] = useState(false);
  const [managerForm, setManagerForm] = useState({
    name: '',
    email: '',
    password: '',
    cities: '',
    commission_percent: 15,
    company_commission_percent: 5
  });
  const [editManagerForm, setEditManagerForm] = useState({
    name: '',
    cities: '',
    commission_percent: 15,
    company_commission_percent: 5,
    is_active: true
  });

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch managers
  const fetchManagers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/manager/admin/list`, { headers });
      setManagers(res.data.managers || []);
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  // Load manager details
  const loadManagerDetails = useCallback(async () => {
    if (!selectedManager || !showManagerDetails) return;
    
    setLoadingManagerDetails(true);
    try {
      const infRes = await axios.get(
        `${API}/manager/admin/${selectedManager.id}/influencers`,
        { headers }
      );
      setManagerInfluencers(infRes.data.influencers || []);
      
      const actRes = await axios.get(
        `${API}/manager/admin/${selectedManager.id}/activity`,
        { headers }
      );
      setManagerActivities(actRes.data.activities || []);
    } catch (err) {
      console.error('Error loading manager details:', err);
    } finally {
      setLoadingManagerDetails(false);
    }
  }, [selectedManager, showManagerDetails, token]);

  useEffect(() => {
    loadManagerDetails();
  }, [loadManagerDetails]);

  // Create manager
  const handleCreateManager = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/manager/admin/create`, {
        ...managerForm,
        cities: managerForm.cities.split(',').map(c => c.trim()).filter(Boolean)
      }, { headers });
      toast.success(language === 'en' ? 'Manager created!' : 'Manager erstellt!');
      setShowManagerModal(false);
      setManagerForm({ name: '', email: '', password: '', cities: '', commission_percent: 15, company_commission_percent: 5 });
      fetchManagers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler');
    }
  };

  // Update manager
  const handleUpdateManager = async (e) => {
    e.preventDefault();
    if (!selectedManager) return;
    
    try {
      await axios.put(`${API}/manager/admin/${selectedManager.id}`, {
        ...editManagerForm,
        cities: editManagerForm.cities.split(',').map(c => c.trim()).filter(Boolean)
      }, { headers });
      toast.success(language === 'en' ? 'Manager updated!' : 'Manager aktualisiert!');
      setShowEditManagerModal(false);
      setSelectedManager(null);
      fetchManagers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler');
    }
  };

  // Toggle manager status
  const handleToggleManager = async (managerId, currentStatus) => {
    try {
      await axios.put(`${API}/manager/admin/${managerId}`, {
        is_active: !currentStatus
      }, { headers });
      toast.success(currentStatus ? 'Manager deaktiviert' : 'Manager aktiviert');
      fetchManagers();
    } catch (err) {
      toast.error('Fehler');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" />
            {language === 'en' ? 'Manager Management' : 'Manager-Verwaltung'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {language === 'en' 
              ? 'Managers supervise influencers and receive commissions.'
              : 'Manager verwalten Influencer und erhalten Provisionen.'}
          </p>
        </div>
        <Button
          onClick={() => setShowManagerModal(true)}
          className="btn-primary w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {language === 'en' ? 'New Manager' : 'Neuer Manager'}
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {managers.map((mgr) => (
          <div key={mgr.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{mgr.name}</p>
                <p className="text-slate-400 text-xs truncate">{mgr.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                mgr.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {mgr.is_active ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
            
            {/* Cities */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {mgr.cities?.slice(0, 3).map((city) => (
                  <span key={city} className="px-2 py-0.5 bg-violet-100 text-violet-600 rounded text-xs">
                    {city}
                  </span>
                ))}
                {(mgr.cities?.length || 0) > 3 && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                    +{mgr.cities.length - 3}
                  </span>
                )}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400">Influencer</p>
                <p className="text-lg font-bold text-slate-700">{mgr.influencer_count || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400">Inf. Prov.</p>
                <p className="text-sm font-bold text-amber-600">€{(mgr.total_influencer_commission || 0).toFixed(0)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400">Manager</p>
                <p className="text-sm font-bold text-emerald-600">€{(mgr.manager_commission || 0).toFixed(0)}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" variant="outline"
                onClick={() => { setSelectedManager(mgr); setShowManagerDetails(true); }}
                className="flex-1 border-violet-300 text-violet-600"
              >
                <Eye className="w-4 h-4 mr-1" />Details
              </Button>
              <Button 
                size="sm" variant="outline"
                onClick={() => {
                  setSelectedManager(mgr);
                  setEditManagerForm({
                    name: mgr.name || '',
                    cities: mgr.cities?.join(', ') || '',
                    commission_percent: mgr.commission_percent || 15,
                    company_commission_percent: mgr.company_commission_percent || 5,
                    is_active: mgr.is_active !== false
                  });
                  setShowEditManagerModal(true);
                }}
                className="flex-1 border-amber-300 text-amber-600"
              >
                <Edit className="w-4 h-4 mr-1" />Edit
              </Button>
            </div>
          </div>
        ))}
        {managers.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            {language === 'en' ? 'No managers yet' : 'Keine Manager vorhanden'}
          </p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-slate-500 font-medium p-4">Manager</th>
                <th className="text-left text-slate-500 font-medium p-4">{language === 'en' ? 'Cities' : 'Städte'}</th>
                <th className="text-left text-slate-500 font-medium p-4">Influencer</th>
                <th className="text-left text-slate-500 font-medium p-4">{language === 'en' ? 'Commission %' : 'Provision %'}</th>
                <th className="text-left text-slate-500 font-medium p-4">{language === 'en' ? 'Earnings' : 'Einnahmen'}</th>
                <th className="text-left text-slate-500 font-medium p-4">Status</th>
                <th className="text-left text-slate-500 font-medium p-4">{language === 'en' ? 'Actions' : 'Aktionen'}</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((mgr) => (
                <tr key={mgr.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-slate-800">{mgr.name}</p>
                      <p className="text-slate-400 text-sm">{mgr.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {mgr.cities?.slice(0, 2).map((city) => (
                        <span key={city} className="px-2 py-0.5 bg-violet-100 text-violet-600 rounded text-xs">
                          {city}
                        </span>
                      ))}
                      {(mgr.cities?.length || 0) > 2 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                          +{mgr.cities.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-700">{mgr.influencer_count || 0}</span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-amber-600">{mgr.commission_percent || 15}%</span>
                        <span className="text-slate-400">v. Inf.</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-emerald-600">{mgr.company_commission_percent || 5}%</span>
                        <span className="text-slate-400">v. Firma</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-emerald-600">€{(mgr.manager_commission || 0).toFixed(2)}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      mgr.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {mgr.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-violet-300 text-violet-600"
                        onClick={() => { setSelectedManager(mgr); setShowManagerDetails(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-amber-300 text-amber-600"
                        onClick={() => {
                          setSelectedManager(mgr);
                          setEditManagerForm({
                            name: mgr.name || '',
                            cities: mgr.cities?.join(', ') || '',
                            commission_percent: mgr.commission_percent || 15,
                            company_commission_percent: mgr.company_commission_percent || 5,
                            is_active: mgr.is_active !== false
                          });
                          setShowEditManagerModal(true);
                        }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Manager Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowManagerModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {language === 'en' ? 'New Manager' : 'Neuer Manager'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowManagerModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleCreateManager} className="space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={managerForm.name}
                  onChange={(e) => setManagerForm({...managerForm, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 text-sm font-medium">E-Mail</label>
                <input
                  type="email"
                  value={managerForm.email}
                  onChange={(e) => setManagerForm({...managerForm, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 text-sm font-medium">{language === 'en' ? 'Password' : 'Passwort'}</label>
                <input
                  type="password"
                  value={managerForm.password}
                  onChange={(e) => setManagerForm({...managerForm, password: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 text-sm font-medium">{language === 'en' ? 'Cities (comma separated)' : 'Städte (kommagetrennt)'}</label>
                <input
                  type="text"
                  value={managerForm.cities}
                  onChange={(e) => setManagerForm({...managerForm, cities: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  placeholder="Berlin, Hamburg, München"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 text-sm font-medium flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {language === 'en' ? 'From Influencer' : 'Von Influencer'}
                  </label>
                  <input
                    type="number"
                    min="0" max="100"
                    value={managerForm.commission_percent}
                    onChange={(e) => setManagerForm({...managerForm, commission_percent: parseFloat(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-700 text-sm font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {language === 'en' ? 'From Company' : 'Von Firma'}
                  </label>
                  <input
                    type="number"
                    min="0" max="100"
                    value={managerForm.company_commission_percent}
                    onChange={(e) => setManagerForm({...managerForm, company_commission_percent: parseFloat(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowManagerModal(false)} className="flex-1">
                  {language === 'en' ? 'Cancel' : 'Abbrechen'}
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {language === 'en' ? 'Create' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Manager Modal */}
      {showEditManagerModal && selectedManager && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowEditManagerModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {language === 'en' ? 'Edit Manager' : 'Manager bearbeiten'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditManagerModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleUpdateManager} className="space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={editManagerForm.name}
                  onChange={(e) => setEditManagerForm({...editManagerForm, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 text-sm font-medium">{language === 'en' ? 'Cities' : 'Städte'}</label>
                <input
                  type="text"
                  value={editManagerForm.cities}
                  onChange={(e) => setEditManagerForm({...editManagerForm, cities: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  placeholder="Berlin, Hamburg, München"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 text-sm font-medium flex items-center gap-1">
                    <Percent className="w-3 h-3 text-amber-500" />
                    {language === 'en' ? 'From Influencer' : 'Von Influencer'}
                  </label>
                  <input
                    type="number"
                    min="0" max="100"
                    value={editManagerForm.commission_percent}
                    onChange={(e) => setEditManagerForm({...editManagerForm, commission_percent: parseFloat(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-700 text-sm font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-500" />
                    {language === 'en' ? 'From Company' : 'Von Firma'}
                  </label>
                  <input
                    type="number"
                    min="0" max="100"
                    value={editManagerForm.company_commission_percent}
                    onChange={(e) => setEditManagerForm({...editManagerForm, company_commission_percent: parseFloat(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editManagerForm.is_active}
                  onChange={(e) => setEditManagerForm({...editManagerForm, is_active: e.target.checked})}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="is_active" className="text-slate-700 cursor-pointer">
                  <span className="font-medium">{language === 'en' ? 'Active' : 'Aktiv'}</span>
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditManagerModal(false)} className="flex-1">
                  {language === 'en' ? 'Cancel' : 'Abbrechen'}
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {language === 'en' ? 'Save' : 'Speichern'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Details Modal */}
      {showManagerDetails && selectedManager && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowManagerDetails(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedManager.name}</h3>
                <p className="text-slate-400">{selectedManager.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowManagerDetails(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-violet-50 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 mx-auto text-violet-500 mb-1" />
                <p className="text-2xl font-bold text-violet-600">{selectedManager.influencer_count || 0}</p>
                <p className="text-xs text-violet-400">Influencer</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <Percent className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                <p className="text-2xl font-bold text-amber-600">{selectedManager.commission_percent || 15}%</p>
                <p className="text-xs text-amber-400">v. Influencer</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <Building2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                <p className="text-2xl font-bold text-emerald-600">{selectedManager.company_commission_percent || 5}%</p>
                <p className="text-xs text-emerald-400">v. Firma</p>
              </div>
              <div className="bg-cyan-50 rounded-xl p-4 text-center">
                <DollarSign className="w-6 h-6 mx-auto text-cyan-500 mb-1" />
                <p className="text-2xl font-bold text-cyan-600">€{(selectedManager.manager_commission || 0).toFixed(0)}</p>
                <p className="text-xs text-cyan-400">Einnahmen</p>
              </div>
            </div>
            
            {/* Cities */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {language === 'en' ? 'Assigned Cities' : 'Zugewiesene Städte'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedManager.cities?.map((city) => (
                  <span key={city} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                    {city}
                  </span>
                ))}
                {(!selectedManager.cities || selectedManager.cities.length === 0) && (
                  <span className="text-slate-400 text-sm">{language === 'en' ? 'No cities assigned' : 'Keine Städte zugewiesen'}</span>
                )}
              </div>
            </div>
            
            {/* Influencers */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {language === 'en' ? 'Managed Influencers' : 'Verwaltete Influencer'}
              </h4>
              {loadingManagerDetails ? (
                <p className="text-slate-400">Laden...</p>
              ) : managerInfluencers.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {managerInfluencers.map((inf) => (
                    <div key={inf.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">{inf.name || inf.username}</p>
                        <p className="text-xs text-slate-400">{inf.city}</p>
                      </div>
                      <span className="text-emerald-600 font-bold">€{(inf.total_commission || 0).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">{language === 'en' ? 'No influencers yet' : 'Keine Influencer'}</p>
              )}
            </div>
            
            {/* Recent Activity */}
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {language === 'en' ? 'Recent Activity' : 'Letzte Aktivitäten'}
              </h4>
              {managerActivities.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {managerActivities.slice(0, 5).map((act, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-lg text-sm">
                      <p className="text-slate-700">{act.description}</p>
                      <p className="text-xs text-slate-400">{new Date(act.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">{language === 'en' ? 'No activity yet' : 'Keine Aktivitäten'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManagers;
