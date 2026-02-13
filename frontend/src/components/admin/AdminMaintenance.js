import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Wrench, Power, Clock, AlertTriangle, CheckCircle, RefreshCw, Save, Calendar, Trash2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AdminMaintenance({ token }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    message: 'Wir führen gerade Wartungsarbeiten durch. Bitte versuchen Sie es später erneut.',
    estimated_minutes: 30
  });
  const [scheduleForm, setScheduleForm] = useState({
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    message: 'Geplante Wartungsarbeiten. Bieten ist vorübergehend pausiert.'
  });

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/maintenance/admin/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data);
      if (res.data.message) {
        setForm(prev => ({ ...prev, message: res.data.message }));
      }
      // Pre-fill schedule form if scheduled
      if (res.data.scheduled) {
        const scheduled = res.data.scheduled;
        const startDt = new Date(scheduled.start_time);
        const endDt = new Date(scheduled.end_time);
        setScheduleForm({
          start_date: startDt.toISOString().split('T')[0],
          start_time: startDt.toTimeString().slice(0, 5),
          end_date: endDt.toISOString().split('T')[0],
          end_time: endDt.toTimeString().slice(0, 5),
          message: scheduled.message || scheduleForm.message
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleToggle = async (enable) => {
    setSaving(true);
    try {
      await axios.post(
        `${API}/maintenance/toggle`,
        null,
        {
          params: {
            enabled: enable,
            message: form.message,
            estimated_minutes: enable ? form.estimated_minutes : null
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success(enable ? 'Wartungsmodus aktiviert' : 'Wartungsmodus deaktiviert');
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Umschalten');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleForm.start_date || !scheduleForm.start_time || !scheduleForm.end_date || !scheduleForm.end_time) {
      toast.error('Bitte alle Datum- und Zeitfelder ausfüllen');
      return;
    }

    setSaving(true);
    try {
      const startDateTime = new Date(`${scheduleForm.start_date}T${scheduleForm.start_time}:00`);
      const endDateTime = new Date(`${scheduleForm.end_date}T${scheduleForm.end_time}:00`);

      await axios.post(
        `${API}/maintenance/schedule`,
        {
          message: scheduleForm.message,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Wartung erfolgreich geplant');
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Planen');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSchedule = async () => {
    setSaving(true);
    try {
      await axios.delete(`${API}/maintenance/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Geplante Wartung abgebrochen');
      setScheduleForm({
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        message: 'Geplante Wartungsarbeiten. Bieten ist vorübergehend pausiert.'
      });
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Abbrechen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  const isScheduledActive = status?.scheduled && 
    new Date(status.scheduled.start_time) <= new Date() && 
    new Date(status.scheduled.end_time) >= new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          Wartungsmodus
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          className="border-slate-200 text-slate-600"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Aktualisieren
        </Button>
      </div>

      {/* Current Status Card */}
      <div className={`rounded-2xl p-6 shadow-lg border-2 ${
        status?.enabled || isScheduledActive
          ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' 
          : 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              status?.enabled || isScheduledActive
                ? 'bg-red-100' 
                : 'bg-emerald-100'
            }`}>
              {status?.enabled || isScheduledActive ? (
                <AlertTriangle className="w-7 h-7 text-red-600" />
              ) : (
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">
                {isScheduledActive ? 'Geplante Wartung AKTIV' : (status?.enabled ? 'Wartungsmodus AKTIV' : 'System Online')}
              </p>
              <p className="text-sm text-slate-500">
                {isScheduledActive 
                  ? 'Geplante Wartung läuft gerade'
                  : (status?.enabled 
                    ? 'Benutzer sehen die Wartungsseite' 
                    : 'Alle Funktionen verfügbar')}
              </p>
            </div>
          </div>
          
          {/* Quick Toggle */}
          {!isScheduledActive && (
            <Button
              onClick={() => handleToggle(!status?.enabled)}
              disabled={saving}
              className={status?.enabled 
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white'
                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white'
              }
              data-testid="maintenance-toggle-btn"
            >
              <Power className="w-4 h-4 mr-2" />
              {saving ? 'Wird gespeichert...' : (status?.enabled ? 'Deaktivieren' : 'Aktivieren')}
            </Button>
          )}
        </div>

        {/* Status Details */}
        {(status?.enabled || isScheduledActive) && (
          <div className="mt-4 pt-4 border-t border-red-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Aktiviert von</p>
              <p className="font-medium text-slate-800">{status.updated_by || status.scheduled?.created_by || 'Unbekannt'}</p>
            </div>
            <div>
              <p className="text-slate-500">{isScheduledActive ? 'Gestartet' : 'Aktiviert am'}</p>
              <p className="font-medium text-slate-800">
                {isScheduledActive 
                  ? new Date(status.scheduled.start_time).toLocaleString('de-DE')
                  : (status.updated_at ? new Date(status.updated_at).toLocaleString('de-DE') : '-')}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Geschätztes Ende</p>
              <p className="font-medium text-slate-800">
                {isScheduledActive 
                  ? new Date(status.scheduled.end_time).toLocaleString('de-DE')
                  : (status.estimated_end ? new Date(status.estimated_end).toLocaleString('de-DE') : 'Nicht angegeben')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scheduled Maintenance Card */}
      {status?.scheduled && !isScheduledActive && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border-2 border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <CalendarClock className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">Wartung geplant</p>
                <p className="text-sm text-slate-500">Automatisch aktiviert zum geplanten Zeitpunkt</p>
              </div>
            </div>
            <Button
              onClick={handleCancelSchedule}
              disabled={saving}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              data-testid="cancel-schedule-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Startzeit</p>
              <p className="font-medium text-slate-800">
                {new Date(status.scheduled.start_time).toLocaleString('de-DE')}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Endzeit</p>
              <p className="font-medium text-slate-800">
                {new Date(status.scheduled.end_time).toLocaleString('de-DE')}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Geplant von</p>
              <p className="font-medium text-slate-800">{status.scheduled.created_by}</p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form - Manual */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Sofort aktivieren
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 font-medium">Nachricht für Benutzer</Label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              className="w-full mt-1 p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:border-amber-400 focus:ring-amber-400 resize-none"
              placeholder="Diese Nachricht wird den Benutzern angezeigt..."
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700 font-medium">Geschätzte Dauer (Minuten)</Label>
              <Input
                type="number"
                value={form.estimated_minutes}
                onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value) || 0 })}
                min={0}
                className="bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-400"
              />
              <p className="text-xs text-slate-400 mt-1">0 = Keine Zeitangabe anzeigen</p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => handleToggle(true)}
                disabled={saving || status?.enabled || isScheduledActive}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Sofort aktivieren
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Maintenance Form */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Wartung planen
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 font-medium">Nachricht für Benutzer</Label>
            <textarea
              value={scheduleForm.message}
              onChange={(e) => setScheduleForm({ ...scheduleForm, message: e.target.value })}
              rows={2}
              className="w-full mt-1 p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-400 focus:ring-blue-400 resize-none"
              placeholder="Diese Nachricht wird den Benutzern während der geplanten Wartung angezeigt..."
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700 font-medium">Startdatum & -zeit</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="date"
                  value={scheduleForm.start_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400"
                />
                <Input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400 w-28"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-700 font-medium">Enddatum & -zeit</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="date"
                  value={scheduleForm.end_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_date: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400"
                />
                <Input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400 w-28"
                />
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSchedule}
            disabled={saving || isScheduledActive}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white"
            data-testid="schedule-maintenance-btn"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {status?.scheduled ? 'Planung aktualisieren' : 'Wartung planen'}
          </Button>
        </div>
      </div>

      {/* Warning Info */}
      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">Wichtige Hinweise</p>
            <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
              <li>Im Wartungsmodus können Benutzer keine Auktionen sehen oder Gebote abgeben</li>
              <li>Admin-Benutzer haben weiterhin vollen Zugriff auf alle Funktionen</li>
              <li>Aktive Auktionen werden nicht automatisch pausiert - beenden Sie diese vorher</li>
              <li>Der Wartungsmodus wird sofort nach Aktivierung wirksam</li>
              <li><strong>Geplante Wartung</strong> wird automatisch zum festgelegten Zeitpunkt aktiviert und deaktiviert</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
