import { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, Activity, Clock, UserPlus, Mail, Send, Eye, 
  BarChart3, RefreshCw, Gavel
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AdminEmail({ token, emailTemplates, emailUserStats, emailCampaigns, fetchData, getTemplateHtml }) {
  const [emailForm, setEmailForm] = useState({
    subject: '',
    html_content: '',
    target_group: 'all',
    test_email: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">E-Mail Marketing</h1>
          <p className="text-[#94A3B8]">Newsletter und Werbe-E-Mails versenden</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-white/10 text-white">
          <RefreshCw className="w-4 h-4 mr-2" />Aktualisieren
        </Button>
      </div>

      {/* User Statistics Cards */}
      {emailUserStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-[#7C3AED] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{emailUserStats.total}</p>
            <p className="text-[#94A3B8] text-sm">Alle Benutzer</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#10B981]">{emailUserStats.active}</p>
            <p className="text-[#94A3B8] text-sm">Aktive (7 Tage)</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#F59E0B]">{emailUserStats.inactive}</p>
            <p className="text-[#94A3B8] text-sm">Inaktive (30+ Tage)</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Gavel className="w-6 h-6 text-[#FFD700] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#FFD700]">{emailUserStats.winners}</p>
            <p className="text-[#94A3B8] text-sm">Gewinner</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <UserPlus className="w-6 h-6 text-[#06B6D4] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#06B6D4]">{emailUserStats.new_users}</p>
            <p className="text-[#94A3B8] text-sm">Neue (7 Tage)</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Composer */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#7C3AED]" />
            E-Mail erstellen
          </h2>

          {/* Template Selection */}
          <div>
            <Label className="text-white">Vorlage wählen</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(emailTemplates || []).map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    if (template.id !== 'custom') {
                      setEmailForm(prev => ({
                        ...prev,
                        subject: template.subject,
                        html_content: getTemplateHtml(template.id)
                      }));
                    }
                  }}
                  className="p-3 rounded-lg border border-white/10 hover:border-[#7C3AED] transition-colors text-left"
                >
                  <p className="text-white text-sm font-medium">{template.name}</p>
                  <p className="text-[#94A3B8] text-xs mt-1">{template.preview}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target Group */}
          <div>
            <Label className="text-white">Zielgruppe</Label>
            <Select value={emailForm.target_group} onValueChange={(v) => setEmailForm(prev => ({...prev, target_group: v}))}>
              <SelectTrigger className="mt-2 bg-[#181824] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#181824] border-white/10">
                <SelectItem value="all">Alle Benutzer ({emailUserStats?.total || 0})</SelectItem>
                <SelectItem value="active">Aktive Benutzer ({emailUserStats?.active || 0})</SelectItem>
                <SelectItem value="inactive">Inaktive Benutzer ({emailUserStats?.inactive || 0})</SelectItem>
                <SelectItem value="winners">Gewinner ({emailUserStats?.winners || 0})</SelectItem>
                <SelectItem value="new_users">Neue Benutzer ({emailUserStats?.new_users || 0})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div>
            <Label className="text-white">Betreff</Label>
            <Input
              value={emailForm.subject}
              onChange={(e) => setEmailForm(prev => ({...prev, subject: e.target.value}))}
              placeholder="z.B. 🔥 Neue Auktionen diese Woche!"
              className="mt-2 bg-[#181824] border-white/10 text-white"
            />
          </div>

          {/* HTML Content */}
          <div>
            <Label className="text-white">E-Mail Inhalt (HTML)</Label>
            <textarea
              value={emailForm.html_content}
              onChange={(e) => setEmailForm(prev => ({...prev, html_content: e.target.value}))}
              placeholder="<h1>Hallo {name}!</h1><p>Ihre Nachricht hier...</p>"
              className="mt-2 w-full h-48 rounded-lg bg-[#181824] border border-white/10 text-white p-3 text-sm font-mono"
            />
            <p className="text-[#94A3B8] text-xs mt-1">Verwenden Sie {'{name}'} für personalisierte Anrede</p>
          </div>

          {/* Test Email */}
          <div className="p-4 rounded-lg bg-[#181824] border border-white/10">
            <Label className="text-white">Test-E-Mail senden</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="email"
                value={emailForm.test_email}
                onChange={(e) => setEmailForm(prev => ({...prev, test_email: e.target.value}))}
                placeholder="ihre@email.de"
                className="flex-1 bg-[#0F0F16] border-white/10 text-white"
              />
              <Button
                onClick={async () => {
                  if (!emailForm.test_email || !emailForm.subject) {
                    toast.error('Bitte E-Mail und Betreff eingeben');
                    return;
                  }
                  setSendingEmail(true);
                  try {
                    await axios.post(`${API}/admin/email/send-test`, {
                      to_email: emailForm.test_email,
                      subject: emailForm.subject,
                      html_content: emailForm.html_content || '<p>Test E-Mail</p>'
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    toast.success('Test-E-Mail gesendet!');
                  } catch (error) {
                    toast.error(error.response?.data?.detail || 'Fehler beim Senden');
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                disabled={sendingEmail}
                variant="outline"
                className="border-[#06B6D4] text-[#06B6D4]"
              >
                <Eye className="w-4 h-4 mr-1" />
                Testen
              </Button>
            </div>
          </div>

          {/* Send Campaign Button */}
          <Button
            onClick={async () => {
              if (!emailForm.subject || !emailForm.html_content) {
                toast.error('Bitte Betreff und Inhalt eingeben');
                return;
              }
              if (!window.confirm(`Kampagne an ${emailUserStats?.[emailForm.target_group] || 'alle'} Benutzer senden?`)) {
                return;
              }
              setSendingEmail(true);
              try {
                const result = await axios.post(`${API}/admin/email/send-campaign`, {
                  subject: emailForm.subject,
                  html_content: emailForm.html_content,
                  target_group: emailForm.target_group
                }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success(result.data.message);
                fetchData();
              } catch (error) {
                toast.error(error.response?.data?.detail || 'Fehler beim Senden');
              } finally {
                setSendingEmail(false);
              }
            }}
            disabled={sendingEmail || !emailForm.subject}
            className="w-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:opacity-90"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendingEmail ? 'Wird gesendet...' : 'Kampagne senden'}
          </Button>
        </div>

        {/* Past Campaigns */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#10B981]" />
            Vergangene Kampagnen
          </h2>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {(emailCampaigns || []).length === 0 ? (
              <p className="text-[#94A3B8] text-center py-8">Noch keine Kampagnen gesendet</p>
            ) : (
              (emailCampaigns || []).map(campaign => (
                <div key={campaign.id} className="p-4 rounded-lg bg-[#181824] border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{campaign.subject}</p>
                      <p className="text-[#94A3B8] text-sm mt-1">
                        Zielgruppe: <span className="text-[#7C3AED]">{campaign.target_group}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#10B981] font-bold">{campaign.sent_count}/{campaign.total_recipients}</p>
                      <p className="text-[#94A3B8] text-xs">gesendet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                    <span>{new Date(campaign.created_at).toLocaleString('de-DE', {dateStyle: 'short', timeStyle: 'short'})}</span>
                    <span>von {campaign.sent_by}</span>
                    {campaign.failed_count > 0 && (
                      <span className="text-[#EF4444]">{campaign.failed_count} fehlgeschlagen</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
