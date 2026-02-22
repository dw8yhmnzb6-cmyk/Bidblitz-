/**
 * Support Button Component
 * Floating button with Chat, Hotline, Ticket options
 */
import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Phone, Mail, X, Send, ChevronDown,
  Headphones, Ticket, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SupportButton() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // chat, hotline, ticket
  const [settings, setSettings] = useState({ hotline: '', email: '' });
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef(null);
  
  // Ticket state
  const [tickets, setTickets] = useState([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('general');
  const [sendingTicket, setSendingTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');

  // Load support settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get(`${API}/api/support/settings`);
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to load support settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Load chat messages
  useEffect(() => {
    if (isOpen && activeTab === 'chat' && token) {
      loadChatMessages();
    }
  }, [isOpen, activeTab, token]);

  // Load tickets
  useEffect(() => {
    if (isOpen && activeTab === 'ticket' && token) {
      loadTickets();
    }
  }, [isOpen, activeTab, token]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadChatMessages = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/api/support/chat/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const loadTickets = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !token) return;
    setSendingChat(true);
    try {
      await axios.post(`${API}/api/support/chat/message`, 
        { message: chatInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatInput('');
      loadChatMessages();
    } catch (error) {
      toast.error('Nachricht konnte nicht gesendet werden');
    } finally {
      setSendingChat(false);
    }
  };

  const createTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim() || !token) return;
    setSendingTicket(true);
    try {
      await axios.post(`${API}/api/support/tickets`, 
        { subject: ticketSubject, message: ticketMessage, category: ticketCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Ticket erstellt!');
      setShowNewTicket(false);
      setTicketSubject('');
      setTicketMessage('');
      loadTickets();
    } catch (error) {
      toast.error('Ticket konnte nicht erstellt werden');
    } finally {
      setSendingTicket(false);
    }
  };

  const replyToTicket = async () => {
    if (!ticketReply.trim() || !selectedTicket || !token) return;
    try {
      await axios.post(`${API}/api/support/tickets/${selectedTicket.id}/reply`,
        { message: ticketReply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTicketReply('');
      // Reload ticket
      const response = await axios.get(`${API}/api/support/tickets/${selectedTicket.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTicket(response.data);
      loadTickets();
    } catch (error) {
      toast.error('Antwort konnte nicht gesendet werden');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Offen';
      case 'in_progress': return 'In Bearbeitung';
      case 'resolved': return 'Gelöst';
      case 'closed': return 'Geschlossen';
      default: return status;
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 sm:bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}
        data-testid="support-button"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Headphones className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Support Modal */}
      {isOpen && (
        <div className="fixed bottom-36 sm:bottom-24 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Support & Hilfe
            </h3>
            <p className="text-sm text-blue-100">Wie können wir Ihnen helfen?</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('hotline')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'hotline' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Phone className="w-4 h-4" />
              Hotline
            </button>
            <button
              onClick={() => setActiveTab('ticket')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'ticket' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Ticket
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                {!token ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Bitte melden Sie sich an, um den Chat zu nutzen.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 p-4 space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Starten Sie eine Konversation</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              msg.sender === 'user' 
                                ? 'bg-blue-500 text-white rounded-br-sm' 
                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                            }`}>
                              <p className="text-sm">{msg.message}</p>
                              <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 border-t flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                        placeholder="Nachricht schreiben..."
                        className="flex-1"
                      />
                      <Button onClick={sendChatMessage} disabled={sendingChat} size="icon">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hotline Tab */}
            {activeTab === 'hotline' && (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-800">Telefonischer Support</h4>
                  <p className="text-gray-500 text-sm mb-4">Rufen Sie uns an - wir helfen sofort!</p>
                </div>
                <a 
                  href={`tel:${settings.hotline?.replace(/\s/g, '')}`}
                  className="block w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors"
                >
                  {settings.hotline || '+49 123 456789'}
                </a>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Mo-Fr 9:00 - 18:00 Uhr</span>
                </div>
                {settings.email && (
                  <a 
                    href={`mailto:${settings.email}`}
                    className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="w-4 h-4" />
                    {settings.email}
                  </a>
                )}
              </div>
            )}

            {/* Ticket Tab */}
            {activeTab === 'ticket' && (
              <div className="p-4">
                {!token ? (
                  <div className="text-center text-gray-500 py-8">
                    <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Bitte melden Sie sich an, um Tickets zu erstellen.</p>
                  </div>
                ) : selectedTicket ? (
                  /* Ticket Detail View */
                  <div className="space-y-3">
                    <button 
                      onClick={() => setSelectedTicket(null)}
                      className="text-sm text-blue-600 flex items-center gap-1"
                    >
                      ← Zurück
                    </button>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">#{selectedTicket.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedTicket.status)}`}>
                          {getStatusLabel(selectedTicket.status)}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-800">{selectedTicket.subject}</h4>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {selectedTicket.messages?.map((msg) => (
                        <div key={msg.id} className={`p-3 rounded-lg ${msg.sender === 'admin' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{msg.sender_name}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(msg.created_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                    {selectedTicket.status !== 'closed' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Input
                          value={ticketReply}
                          onChange={(e) => setTicketReply(e.target.value)}
                          placeholder="Antwort schreiben..."
                          className="flex-1"
                        />
                        <Button onClick={replyToTicket} size="icon">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : showNewTicket ? (
                  /* New Ticket Form */
                  <div className="space-y-3">
                    <button 
                      onClick={() => setShowNewTicket(false)}
                      className="text-sm text-blue-600 flex items-center gap-1"
                    >
                      ← Zurück
                    </button>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                    >
                      <option value="general">Allgemeine Anfrage</option>
                      <option value="payment">Zahlung / Guthaben</option>
                      <option value="technical">Technisches Problem</option>
                      <option value="account">Konto / Profil</option>
                    </select>
                    <Input
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Betreff"
                    />
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Beschreiben Sie Ihr Anliegen..."
                      className="w-full p-3 border rounded-lg text-sm min-h-[100px] resize-none"
                    />
                    <Button 
                      onClick={createTicket} 
                      disabled={sendingTicket || !ticketSubject.trim() || !ticketMessage.trim()}
                      className="w-full"
                    >
                      {sendingTicket ? 'Wird gesendet...' : 'Ticket erstellen'}
                    </Button>
                  </div>
                ) : (
                  /* Ticket List */
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setShowNewTicket(true)}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Neues Ticket erstellen
                    </Button>
                    {tickets.length === 0 ? (
                      <div className="text-center text-gray-400 py-6">
                        <p className="text-sm">Keine Tickets vorhanden</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Meine Tickets</p>
                        {tickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className="w-full text-left p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-500">#{ticket.id}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                                {getStatusLabel(ticket.status)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(ticket.created_at).toLocaleDateString('de-DE')}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
