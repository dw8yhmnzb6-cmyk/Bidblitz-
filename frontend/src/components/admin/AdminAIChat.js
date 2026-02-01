import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { 
  MessageSquare, Send, X, Loader2, Bot, User,
  Sparkles, Minimize2, Maximize2, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminAIChat({ isOpen, onClose, onToggle }) {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen helfen?\n\nBeispiele:\n• "Erstelle 20 neue Auktionen"\n• "Zeige mir die heutigen Statistiken"\n• "Wer hat heute am meisten gekauft?"'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // First, parse the command
      const parseRes = await axios.post(`${API}/voice-command/execute`, {
        text: userMessage,
        execute: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const parsed = parseRes.data.parsed_command;

      if (parsed.action === 'unknown') {
        // Try to answer as a general question
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Ich konnte den Befehl nicht verstehen. Versuchen Sie es mit:\n• "Erstelle X Auktionen"\n• "Zeige Statistiken"\n• "Starte alle Bots"\n• "Übersetze alle Produkte"'
        }]);
      } else if (parsed.needs_confirmation) {
        // Store pending action and ask for confirmation
        setPendingAction(parsed);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${parsed.confirmation_message}\n\nMöchten Sie fortfahren?`,
          showConfirmation: true
        }]);
      } else {
        // Execute directly
        const execRes = await axios.post(`${API}/voice-command/confirm-execute`, {
          action: parsed.action,
          parameters: parsed.parameters || {}
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: execRes.data.message || 'Befehl ausgeführt!',
          success: execRes.data.success
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Fehler: ${error.response?.data?.detail || error.message}`,
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async (confirmed) => {
    if (!pendingAction) return;

    if (confirmed) {
      setLoading(true);
      try {
        const execRes = await axios.post(`${API}/voice-command/confirm-execute`, {
          action: pendingAction.action,
          parameters: pendingAction.parameters || {}
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: execRes.data.message || 'Befehl ausgeführt!',
          success: execRes.data.success
        }]);
      } catch (error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Fehler: ${error.response?.data?.detail || error.message}`,
          error: true
        }]);
      } finally {
        setLoading(false);
      }
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Aktion abgebrochen.'
      }]);
    }
    setPendingAction(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Bot className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-64' : 'w-80 md:w-96'
    }`}>
      <div className="glass-card rounded-xl overflow-hidden shadow-2xl border border-purple-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">KI-Assistent</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-3 space-y-3 bg-[#0A0A0F]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : msg.error
                        ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                        : msg.success
                          ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                          : 'bg-[#181824] text-white'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Confirmation Buttons */}
                    {msg.showConfirmation && pendingAction && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => confirmAction(true)}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-xs"
                          disabled={loading}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ja
                        </Button>
                        <Button
                          onClick={() => confirmAction(false)}
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white text-xs"
                          disabled={loading}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#181824] rounded-xl p-3">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-[#0A0A0F]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Befehl eingeben..."
                  className="flex-1 bg-[#181824] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  disabled={loading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-purple-500 hover:bg-purple-600 px-3"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
