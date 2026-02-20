import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { 
  Activity, AlertTriangle, AlertCircle, Info, CheckCircle,
  Trash2, RefreshCw, FileText, Clock, Wrench, Play,
  ChevronDown, ChevronUp, Database, Users, Key, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Status configuration for health checks
const STATUS_CONFIG = {
  ok: { 
    label: 'OK', 
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle 
  },
  warning: { 
    label: 'Warnung', 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: AlertTriangle 
  },
  error: { 
    label: 'Fehler', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle 
  }
};

// Check type icons
const CHECK_ICONS = {
  database: Database,
  enterprise_logins: Users,
  expired_sessions: Key,
  orphaned_data: Trash2,
  pending_payouts: CreditCard
};

export function AdminSystemHealth({ token }) {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [expandedReport, setExpandedReport] = useState(null);
  const [fixing, setFixing] = useState(false);

  // Fetch health stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/health/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching health stats:', err);
    }
  }, []);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/health/reports?limit=20`);
      setReports(response.data.reports || []);
    } catch (err) {
      toast.error('Fehler beim Laden der Reports');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run health check now
  const runHealthCheck = async () => {
    setRunningCheck(true);
    try {
      const response = await axios.get(`${API}/health/run`);
      toast.success(`Health Check abgeschlossen: ${response.data.issue_count} Probleme gefunden`);
      fetchStats();
      fetchReports();
    } catch (err) {
      toast.error('Fehler beim Ausführen des Health Checks');
    } finally {
      setRunningCheck(false);
    }
  };

  // Auto-fix issues in a report
  const fixReportIssues = async (reportId) => {
    setFixing(true);
    try {
      const response = await axios.post(`${API}/health/fix/${reportId}`);
      toast.success(`${response.data.fixes_applied} Probleme behoben`);
      fetchStats();
      fetchReports();
    } catch (err) {
      toast.error('Fehler beim Beheben der Probleme');
    } finally {
      setFixing(false);
    }
  };

  // Delete old reports
  const cleanupReports = async () => {
    try {
      const response = await axios.delete(`${API}/health/reports/cleanup?days=30`);
      toast.success(`${response.data.deleted_count} alte Reports gelöscht`);
      fetchReports();
    } catch (err) {
      toast.error('Fehler beim Löschen alter Reports');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, [fetchStats, fetchReports]);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-600" />
            System Health Check
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Automatische Systemprüfung - täglich um 3:00 Uhr UTC
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runHealthCheck}
            disabled={runningCheck}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {runningCheck ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Jetzt prüfen
          </Button>
          <Button
            variant="outline"
            onClick={cleanupReports}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Alte löschen
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <Info className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-blue-900">
              {stats.reports_by_status?.ok || 0}
            </div>
            <div className="text-sm text-blue-600">OK Reports</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-yellow-900">
              {stats.reports_by_status?.warning || 0}
            </div>
            <div className="text-sm text-yellow-600">Warnungen</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <AlertCircle className="w-6 h-6 text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-orange-900">
              {stats.total_issues_24h || 0}
            </div>
            <div className="text-sm text-orange-600">Probleme (24h)</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
            <div className="text-2xl font-bold text-red-900">
              {stats.reports_by_status?.error || 0}
            </div>
            <div className="text-sm text-red-600">Kritische Fehler</div>
          </div>
        </div>
      )}

      {/* Latest Report Summary */}
      {stats?.latest_report && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Letzter Report
            <span className="text-sm text-gray-400">
              ({formatTime(stats.latest_report.timestamp)})
            </span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.latest_report.checks && Object.entries(stats.latest_report.checks).map(([key, check]) => {
              const config = STATUS_CONFIG[check.status] || STATUS_CONFIG.ok;
              const Icon = CHECK_ICONS[key] || Info;
              return (
                <div 
                  key={key}
                  className={`rounded-lg p-3 ${config.color} border`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm font-semibold">{check.message}</div>
                </div>
              );
            })}
          </div>

          {stats.latest_report.auto_fixable_count > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {stats.latest_report.auto_fixable_count} automatisch behebbare Probleme
              </span>
              <Button
                size="sm"
                onClick={() => fixReportIssues(stats.latest_report.id)}
                disabled={fixing}
                className="bg-green-600 hover:bg-green-700"
              >
                {fixing ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Wrench className="w-4 h-4 mr-1" />
                )}
                Alle beheben
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reports History */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Report-Verlauf</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={fetchReports}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Lade Reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Noch keine Reports vorhanden
          </div>
        ) : (
          <div className="divide-y">
            {reports.map((report) => {
              const statusConfig = STATUS_CONFIG[report.overall_status] || STATUS_CONFIG.ok;
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedReport === report.id;

              return (
                <div key={report.id} className="hover:bg-gray-50">
                  <div 
                    className="px-6 py-4 cursor-pointer flex items-center gap-4"
                    onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                  >
                    <StatusIcon className={`w-5 h-5 ${statusConfig.color.includes('green') ? 'text-green-600' : statusConfig.color.includes('yellow') ? 'text-yellow-600' : 'text-red-600'}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-sm text-gray-600">
                          {report.issue_count} Probleme
                        </span>
                        {report.auto_fixable_count > 0 && (
                          <span className="text-xs text-green-600">
                            ({report.auto_fixable_count} behebbar)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatTime(report.timestamp)}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-4 bg-gray-50 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {report.checks && Object.entries(report.checks).map(([key, check]) => (
                          <div key={key} className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center gap-2 mb-1">
                              {check.status === 'ok' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : check.status === 'warning' ? (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-medium text-sm capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{check.message}</div>
                            
                            {check.issues && check.issues.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {check.issues.map((issue, idx) => (
                                  <div key={idx} className="text-xs bg-red-50 text-red-700 rounded p-2 flex justify-between items-center">
                                    <span>{issue.message}</span>
                                    {issue.auto_fixable && (
                                      <span className="text-green-600 font-medium">✓ behebbar</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {report.auto_fixable_count > 0 && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              fixReportIssues(report.id);
                            }}
                            disabled={fixing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Wrench className="w-4 h-4 mr-1" />
                            {report.auto_fixable_count} Probleme beheben
                          </Button>
                        </div>
                      )}
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

export default AdminSystemHealth;
