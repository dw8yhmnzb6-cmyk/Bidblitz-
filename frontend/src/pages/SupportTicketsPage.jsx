/**
 * User Support Tickets Page - Create and manage support tickets
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  MessageSquare, Plus, Clock, AlertCircle, CheckCircle,
  Hourglass, XCircle, Send, ArrowLeft, ChevronRight, Loader2
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const statusConfig = {
  open: { label: 'Offen', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  in_progress: { label: 'In Bearbeitung', color: 'bg-yellow-100 text-yellow-700', icon: Hourglass },
  waiting: { label: 'Antwort ausstehend', color: 'bg-purple-100 text-purple-700', icon: Clock },
  resolved: { label: 'Gelöst', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  closed: { label: 'Geschlossen', color: 'bg-slate-100 text-slate-700', icon: XCircle }
};

const categoryOptions = [
  { value: 'general', label: 'Allgemein' },
  { value: 'billing', label: 'Abrechnung' },
  { value: 'device', label: 'Gerät / Scooter' },
  { value: 'account', label: 'Mein Konto' },
  { value: 'auction', label: 'Auktion' },
  { value: 'other', label: 'Sonstiges' }
];

export default function SupportTicketsPage() {
  const { token, isAuthenticated } = useAuth();
  const [view, setView] = useState('list'); // list, detail, create
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Create form
  const [form, setForm] = useState({ subject: '', message: '', category: 'general', priority: 'normal' });

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data.tickets || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openTicket = async (ticketId) => {
    try {
      const res = await axios.get(`${API}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTicket(res.data.ticket);
      setMessages(res.data.messages || []);
      setView('detail');
    } catch (e) {
      toast.error('Fehler beim Laden');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Bitte Betreff und Nachricht ausfüllen');
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API}/tickets`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ticket erstellt!');
      setForm({ subject: '', message: '', category: 'general', priority: 'normal' });
      setView('list');
      fetchTickets();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Fehler');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await axios.post(`${API}/tickets/${selectedTicket.id}/messages`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      openTicket(selectedTicket.id);
    } catch (e) {
      toast.error('Fehler beim Senden');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <p className="text-slate-500">Bitte melden Sie sich an.</p>
      </div>
    );
  }

  // CREATE VIEW
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-slate-50 p-4 pb-24" data-testid="support-create-page">
        <div className="max-w-lg mx-auto">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-violet-600 text-sm font-medium mb-4">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>
          <h1 className="text-xl font-bold text-slate-800 mb-6">Neues Support-Ticket</h1>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
              >
                {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Betreff *</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({...form, subject: e.target.value})}
                placeholder="Kurze Beschreibung des Problems"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                required
                data-testid="ticket-subject-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nachricht *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                placeholder="Beschreiben Sie Ihr Anliegen..."
                rows={5}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none"
                required
                data-testid="ticket-message-input"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="ticket-submit-btn"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Ticket erstellen
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  if (view === 'detail' && selectedTicket) {
    const status = statusConfig[selectedTicket.status] || statusConfig.open;
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-slate-50 flex flex-col" data-testid="support-detail-page">
        <div className="p-4 max-w-lg mx-auto w-full">
          <button onClick={() => { setView('list'); setSelectedTicket(null); }} className="flex items-center gap-1 text-violet-600 text-sm font-medium mb-4">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>
          <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="font-bold text-slate-800 text-sm">{selectedTicket.subject}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">{selectedTicket.ticket_number} · {selectedTicket.category}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 max-w-lg mx-auto w-full space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.sender === 'user' ? 'bg-violet-500 text-white' :
                msg.sender === 'system' ? 'bg-slate-200 text-slate-700' :
                'bg-white border border-slate-200 text-slate-800'
              }`}>
                <p className="text-sm break-words">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-violet-200' : 'text-slate-400'}`}>
                  {msg.sender_name} · {new Date(msg.created_at).toLocaleString('de-DE')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Input */}
        {selectedTicket.status !== 'closed' && (
          <div className="p-4 border-t border-slate-100 bg-white max-w-lg mx-auto w-full">
            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nachricht schreiben..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                data-testid="ticket-reply-input"
              />
              <button
                onClick={handleReply}
                disabled={sending}
                className="px-4 py-2.5 bg-violet-600 text-white rounded-xl disabled:opacity-50"
                data-testid="ticket-reply-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-slate-50 p-4 pb-24" data-testid="support-tickets-page">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Meine Tickets</h1>
              <p className="text-xs text-slate-500">{tickets.length} Anfragen</p>
            </div>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl"
            data-testid="create-ticket-btn"
          >
            <Plus className="w-4 h-4" /> Neues Ticket
          </button>
        </div>

        {/* Tickets */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Keine Tickets vorhanden</p>
            <p className="text-slate-400 text-sm mt-1">Erstellen Sie ein Ticket bei Fragen oder Problemen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.open;
              const StatusIcon = status.icon;
              return (
                <div
                  key={ticket.id}
                  onClick={() => openTicket(ticket.id)}
                  className="bg-white rounded-xl border border-slate-100 p-4 cursor-pointer hover:border-violet-200 transition-all active:scale-[0.98]"
                  data-testid={`ticket-${ticket.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-slate-800 text-sm line-clamp-1">{ticket.subject}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 flex-shrink-0 ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{ticket.ticket_number} · {new Date(ticket.created_at).toLocaleDateString('de-DE')}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
