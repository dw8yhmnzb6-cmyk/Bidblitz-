/**
 * Admin Microfinance/Loans Management
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Banknote, User, Calendar, Check, X, Send, RefreshCw, Search,
  Clock, CheckCircle, XCircle, DollarSign, TrendingUp, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const API = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  requested: { label: 'Beantragt', color: 'bg-blue-100 text-blue-700', icon: Clock },
  approved: { label: 'Genehmigt', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  disbursed: { label: 'Ausgezahlt', color: 'bg-purple-100 text-purple-700', icon: Send },
  repaying: { label: 'Rückzahlung', color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp },
  closed: { label: 'Abgeschlossen', color: 'bg-slate-100 text-slate-700', icon: CheckCircle },
  rejected: { label: 'Abgelehnt', color: 'bg-red-100 text-red-700', icon: XCircle }
};

export default function AdminLoans({ token }) {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filter, setFilter] = useState('requested');
  const [searchTerm, setSearchTerm] = useState('');
  const [aprInput, setAprInput] = useState('15.00');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchLoans();
  }, [filter]);

  const fetchLoans = async () => {
    try {
      const res = await axios.get(`${API}/api/loans/admin/all`, {
        params: filter !== 'all' ? { status: filter } : {},
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoans(res.data.loans || []);
      setStats(res.data.stats || {});
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId) => {
    try {
      await axios.post(`${API}/api/loans/admin/${loanId}/approve`,
        { apr_bps: Math.round(parseFloat(aprInput) * 100) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLoans();
      setSelectedLoan(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Fehler beim Genehmigen');
    }
  };

  const handleReject = async (loanId) => {
    if (!rejectReason.trim()) {
      alert('Bitte geben Sie einen Ablehnungsgrund an');
      return;
    }
    try {
      await axios.post(`${API}/api/loans/admin/${loanId}/reject?reason=${encodeURIComponent(rejectReason)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLoans();
      setSelectedLoan(null);
      setRejectReason('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Fehler beim Ablehnen');
    }
  };

  const handleDisburse = async (loanId) => {
    try {
      await axios.post(`${API}/api/loans/admin/${loanId}/disburse`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLoans();
      setSelectedLoan(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Fehler bei der Auszahlung');
    }
  };

  const filteredLoans = loans.filter(l =>
    l.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (cents) => `€${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
          <Banknote className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mikrofinanz</h1>
          <p className="text-slate-500 text-sm">Kreditverwaltung</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === key ? config.color + ' ring-2 ring-offset-1' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {config.label} ({stats[key] || 0})
          </button>
        ))}
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          Alle
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Suche nach Kreditnummer, Name oder E-Mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Kredit</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Kunde</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Betrag</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Laufzeit</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map((loan) => {
                const status = statusConfig[loan.status] || statusConfig.requested;
                const StatusIcon = status.icon;
                return (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{loan.loan_number}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(loan.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-800">{loan.user_name}</p>
                        <p className="text-xs text-slate-400">{loan.user_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(loan.principal_cents)}
                      </p>
                      {loan.total_due_cents && (
                        <p className="text-xs text-slate-400">
                          Gesamt: {formatCurrency(loan.total_due_cents)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600">{loan.term_days} Tage</span>
                      {loan.apr_bps && (
                        <p className="text-xs text-slate-400">{(loan.apr_bps / 100).toFixed(2)}% APR</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {loan.status === 'repaying' && (
                        <p className="text-xs text-slate-500 mt-1">
                          {formatCurrency(loan.repaid_cents || 0)} / {formatCurrency(loan.total_due_cents)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {loan.status === 'requested' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setSelectedLoan({...loan, action: 'approve'})}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedLoan({...loan, action: 'reject'})}
                              className="border-red-300 text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {loan.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleDisburse(loan.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            <Send className="w-3 h-3 mr-1" /> Auszahlen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                    Keine Kredite gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve/Reject Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            {selectedLoan.action === 'approve' ? (
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Kredit genehmigen</h2>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">Kunde: <strong>{selectedLoan.user_name}</strong></p>
                    <p className="text-sm text-slate-600">Betrag: <strong>{formatCurrency(selectedLoan.principal_cents)}</strong></p>
                    <p className="text-sm text-slate-600">Laufzeit: <strong>{selectedLoan.term_days} Tage</strong></p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Zinssatz (APR %)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={aprInput}
                      onChange={(e) => setAprInput(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setSelectedLoan(null)} className="flex-1">
                    Abbrechen
                  </Button>
                  <Button onClick={() => handleApprove(selectedLoan.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    Genehmigen
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Kredit ablehnen</h2>
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600">Kunde: <strong>{selectedLoan.user_name}</strong></p>
                    <p className="text-sm text-red-600">Betrag: <strong>{formatCurrency(selectedLoan.principal_cents)}</strong></p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Ablehnungsgrund *</label>
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="z.B. Unzureichende Bonität"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setSelectedLoan(null)} className="flex-1">
                    Abbrechen
                  </Button>
                  <Button onClick={() => handleReject(selectedLoan.id)} className="flex-1 bg-red-500 hover:bg-red-600">
                    Ablehnen
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
