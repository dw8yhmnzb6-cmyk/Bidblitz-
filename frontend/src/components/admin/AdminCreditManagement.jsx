/**
 * AdminCreditManagement - Admin-Bereich zur Verwaltung von Kreditanträgen
 * Admins können Anträge genehmigen/ablehnen, Dokumente prüfen, Kredite aktivieren
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, FileText, CheckCircle, XCircle, Clock, Euro,
  Eye, AlertCircle, User, Calendar, Percent, ChevronRight,
  ChevronLeft, Loader2, Download, Play, RefreshCw, Search,
  Filter, Banknote
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const AdminCreditManagement = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Decision form
  const [interestRate, setInterestRate] = useState(3);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Document viewer
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`${API}/api/credit/admin/applications${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setStats(data.status_counts);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Fehler beim Laden der Anträge');
    } finally {
      setLoading(false);
    }
  }, [token, filter]);
  
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/credit/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [token]);
  
  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [fetchApplications, fetchStats]);
  
  const viewDocument = async (creditId, docType) => {
    setLoadingDoc(true);
    setViewingDoc(docType);
    
    try {
      const res = await fetch(`${API}/api/credit/admin/document/${creditId}/${docType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDocContent(data);
      } else {
        toast.error('Dokument konnte nicht geladen werden');
      }
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Fehler beim Laden des Dokuments');
    } finally {
      setLoadingDoc(false);
    }
  };
  
  const handleDecision = async (approved) => {
    if (!selectedApp) return;
    
    if (approved && (interestRate < 2 || interestRate > 5)) {
      toast.error('Zinssatz muss zwischen 2% und 5% liegen');
      return;
    }
    
    setProcessing(true);
    
    try {
      const res = await fetch(`${API}/api/credit/admin/decide`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credit_id: selectedApp.id,
          approved,
          interest_rate: interestRate,
          rejection_reason: rejectionReason,
          notes: adminNotes
        })
      });
      
      if (res.ok) {
        toast.success(approved ? 'Kredit genehmigt' : 'Kredit abgelehnt');
        setSelectedApp(null);
        fetchApplications();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Fehler bei der Entscheidung');
      }
    } catch (error) {
      console.error('Error processing decision:', error);
      toast.error('Fehler bei der Verarbeitung');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleActivate = async (creditId) => {
    setProcessing(true);
    
    try {
      const res = await fetch(`${API}/api/credit/admin/activate/${creditId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Kredit aktiviert - Geld wurde ausgezahlt');
        fetchApplications();
        if (selectedApp?.id === creditId) {
          const updatedApp = { ...selectedApp, status: 'active' };
          setSelectedApp(updatedApp);
        }
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Fehler beim Aktivieren');
      }
    } catch (error) {
      console.error('Error activating credit:', error);
      toast.error('Fehler beim Aktivieren');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleExtend = async (creditId, days = 30) => {
    try {
      const res = await fetch(`${API}/api/credit/admin/extend/${creditId}?extra_days=${days}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success(`Frist um ${days} Tage verlängert`);
        fetchApplications();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Fehler');
      }
    } catch (error) {
      console.error('Error extending credit:', error);
      toast.error('Fehler beim Verlängern');
    }
  };
  
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      repaid: 'bg-gray-100 text-gray-600',
      rejected: 'bg-red-100 text-red-800',
      defaulted: 'bg-red-200 text-red-900'
    };
    
    const labels = {
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      active: 'Aktiv',
      repaid: 'Zurückgezahlt',
      rejected: 'Abgelehnt',
      defaulted: 'Ausgefallen'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredApplications = applications.filter(app => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        app.user_email?.toLowerCase().includes(search) ||
        app.user_name?.toLowerCase().includes(search) ||
        app.id?.toLowerCase().includes(search)
      );
    }
    return true;
  });
  
  // Document Viewer Modal
  if (viewingDoc && docContent) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">{viewingDoc}</h3>
            <Button variant="ghost" onClick={() => { setViewingDoc(null); setDocContent(null); }}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-4">
            {docContent.content_type?.startsWith('image/') ? (
              <img 
                src={`data:${docContent.content_type};base64,${docContent.content}`}
                alt={viewingDoc}
                className="max-w-full mx-auto rounded-lg"
              />
            ) : docContent.content_type === 'application/pdf' ? (
              <iframe
                src={`data:application/pdf;base64,${docContent.content}`}
                className="w-full h-[70vh]"
                title={viewingDoc}
              />
            ) : (
              <p className="text-gray-500">Vorschau nicht verfügbar</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Detail View
  if (selectedApp) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedApp(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          Zurück zur Liste
        </button>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            {getStatusBadge(selectedApp.status)}
            <span className="text-white/80 text-sm">#{selectedApp.id.slice(0, 8)}</span>
          </div>
          <div className="text-4xl font-bold mb-2">€{selectedApp.amount.toFixed(2)}</div>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span><User className="w-4 h-4 inline mr-1" />{selectedApp.user_email}</span>
            <span><Calendar className="w-4 h-4 inline mr-1" />{formatDate(selectedApp.created_at)}</span>
          </div>
        </div>
        
        {/* User Info */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            Antragsteller
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 font-medium">{selectedApp.user_name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">E-Mail:</span>
              <span className="ml-2 font-medium">{selectedApp.user_email}</span>
            </div>
            <div>
              <span className="text-gray-500">Verwendungszweck:</span>
              <span className="ml-2">{selectedApp.purpose || 'Nicht angegeben'}</span>
            </div>
            <div>
              <span className="text-gray-500">Rückzahlung:</span>
              <span className="ml-2 font-medium">{selectedApp.repayment_months} Monate</span>
            </div>
          </div>
        </div>
        
        {/* Documents */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Dokumente
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['id_front', 'id_back', 'selfie_with_id', 'income_proof_1', 'income_proof_2', 'income_proof_3'].map((doc) => (
              <button
                key={doc}
                onClick={() => viewDocument(selectedApp.id, doc)}
                className="p-3 border rounded-lg hover:bg-gray-50 text-left"
              >
                <Eye className="w-5 h-5 text-gray-400 mb-1" />
                <p className="text-sm font-medium">
                  {doc === 'id_front' && 'Ausweis Vorderseite'}
                  {doc === 'id_back' && 'Ausweis Rückseite'}
                  {doc === 'selfie_with_id' && 'Selfie mit Ausweis'}
                  {doc === 'income_proof_1' && 'Einkommen Monat 1'}
                  {doc === 'income_proof_2' && 'Einkommen Monat 2'}
                  {doc === 'income_proof_3' && 'Einkommen Monat 3'}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Decision Section for Pending */}
        {selectedApp.status === 'pending' && (
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Entscheidung
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zinssatz (2-5% pro Monat)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="2"
                  max="5"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="font-bold text-lg w-16 text-center">{interestRate}%</span>
              </div>
              {selectedApp.amount < 50 && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Keine Zinsen unter €50
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin-Notizen
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border rounded-lg p-3"
                rows="2"
                placeholder="Interne Notizen..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ablehnungsgrund (falls abgelehnt)
              </label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Grund für Ablehnung..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleDecision(false)}
                disabled={processing}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Ablehnen
              </Button>
              <Button
                onClick={() => handleDecision(true)}
                disabled={processing}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {processing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                Genehmigen
              </Button>
            </div>
          </div>
        )}
        
        {/* Activate Section for Approved */}
        {selectedApp.status === 'approved' && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Kredit aktivieren</h3>
            <p className="text-sm text-blue-600 mb-4">
              €{selectedApp.amount.toFixed(2)} wird auf das Wallet des Nutzers überwiesen.
            </p>
            <Button
              onClick={() => handleActivate(selectedApp.id)}
              disabled={processing}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {processing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
              Jetzt aktivieren & auszahlen
            </Button>
          </div>
        )}
        
        {/* Actions for Active */}
        {selectedApp.status === 'active' && (
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <h3 className="font-semibold">Aktiver Kredit</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Zinssatz:</span>
                <span className="ml-2 font-medium">{selectedApp.interest_rate}%</span>
              </div>
              <div>
                <span className="text-gray-500">Monatliche Rate:</span>
                <span className="ml-2 font-medium">€{(selectedApp.monthly_payment || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Bereits gezahlt:</span>
                <span className="ml-2 font-medium text-green-600">€{(selectedApp.amount_repaid || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Restbetrag:</span>
                <span className="ml-2 font-medium text-orange-600">
                  €{Math.max(0, (selectedApp.total_repayment || selectedApp.amount) - (selectedApp.amount_repaid || 0)).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => handleExtend(selectedApp.id, 30)}
                variant="outline"
                className="flex-1"
              >
                +30 Tage verlängern
              </Button>
              <Button
                onClick={() => handleExtend(selectedApp.id, 60)}
                variant="outline"
                className="flex-1"
              >
                +60 Tage verlängern
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-orange-500" />
          Kredit-Verwaltung
        </h2>
        <Button onClick={fetchApplications} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Aktualisieren
        </Button>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-800">{stats.pending_applications || stats.by_status?.pending?.count || 0}</p>
            <p className="text-xs text-yellow-600">Ausstehend</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-800">{stats.by_status?.active?.count || 0}</p>
            <p className="text-xs text-green-600">Aktiv</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <Euro className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-800">€{(stats.total_outstanding || 0).toFixed(0)}</p>
            <p className="text-xs text-blue-600">Ausstehend</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Banknote className="w-6 h-6 text-gray-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{stats.by_status?.repaid?.count || 0}</p>
            <p className="text-xs text-gray-600">Zurückgezahlt</p>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Suche nach E-Mail, Name oder ID..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pending', 'approved', 'active', 'repaid', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                filter === status 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Alle' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Keine Kreditanträge gefunden</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  app.status === 'pending' ? 'bg-yellow-100' :
                  app.status === 'active' ? 'bg-green-100' :
                  app.status === 'approved' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Euro className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">€{app.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{app.user_email}</p>
                  <p className="text-xs text-gray-400">{formatDate(app.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(app.status)}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCreditManagement;
