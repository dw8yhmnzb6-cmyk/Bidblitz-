/**
 * Meine Ratenzahlungen - Übersicht und Verwaltung
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { 
  CreditCard, Calendar, CheckCircle, Clock, AlertTriangle,
  ChevronRight, Euro, Loader2, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function MyInstallments() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchPlans();
  }, [isAuthenticated, token]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/bnpl/my-plans?token=${token}`);
      const data = await res.json();
      
      if (res.ok) {
        setPlans(data.plans || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const payInstallment = async (planId) => {
    try {
      setPaying(planId);
      const res = await fetch(`${API}/api/bnpl/pay-installment?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          payment_method: 'balance'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Zahlung fehlgeschlagen');
      }

      toast.success(data.message);
      fetchPlans();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPaying(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-emerald-400 bg-emerald-500/20';
      case 'overdue': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'completed': return 'Abgeschlossen';
      case 'overdue': return 'Überfällig';
      default: return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Meine Ratenzahlungen</h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Übersicht und Verwaltung Ihrer Ratenzahlungspläne
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <CreditCard className="w-6 h-6 text-blue-500 mb-2" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aktive Pläne</p>
              <p className="text-2xl font-bold">{stats.active_plans}</p>
            </div>
            
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <Euro className="w-6 h-6 text-amber-500 mb-2" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Offen</p>
              <p className="text-2xl font-bold">€{stats.total_remaining?.toFixed(2)}</p>
            </div>
            
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Abgeschlossen</p>
              <p className="text-2xl font-bold">{stats.completed_plans}</p>
            </div>
            
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <Calendar className="w-6 h-6 text-purple-500 mb-2" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gesamt</p>
              <p className="text-2xl font-bold">{stats.total_plans}</p>
            </div>
          </div>
        )}

        {/* Plans List */}
        {plans.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Keine Ratenzahlungen</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Sie haben noch keine Ratenzahlungspläne erstellt.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const nextInstallment = plan.installments?.find(i => i.status === 'pending');
              const paidCount = plan.installments?.filter(i => i.status === 'paid').length || 0;
              
              return (
                <div 
                  key={plan.id}
                  className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}
                >
                  {/* Plan Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(plan.status)}`}>
                          {getStatusLabel(plan.status)}
                        </span>
                        <h3 className="text-lg font-medium mt-2">
                          {plan.item_type === 'bid_package' ? 'Gebote-Paket' : 'Gewonnene Auktion'}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Erstellt am {formatDate(plan.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gesamt</p>
                        <p className="text-xl font-bold text-emerald-500">€{plan.total_amount?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-4 py-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {paidCount} von {plan.installment_count} Raten bezahlt
                      </span>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        €{plan.paid_amount?.toFixed(2)} / €{plan.total_amount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(plan.paid_amount / plan.total_amount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Payment */}
                  {plan.status === 'active' && nextInstallment && (
                    <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="font-medium">Nächste Rate</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Fällig am {formatDate(nextInstallment.due_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">€{nextInstallment.amount?.toFixed(2)}</span>
                          <Button
                            onClick={() => payInstallment(plan.id)}
                            disabled={paying === plan.id}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            {paying === plan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                Jetzt bezahlen
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completed Badge */}
                  {plan.status === 'completed' && (
                    <div className="px-4 py-3 bg-emerald-500/10 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-emerald-400 font-medium">Vollständig bezahlt</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
