/**
 * BidBlitz AI Assistant
 * Smart chatbot with keyword recognition
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function Assistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatRef = useRef(null);

  const suggestions = [
    { text: 'Bestelle mir ein Taxi', icon: '🚕' },
    { text: 'Zeig mir Spiele', icon: '🎮' },
    { text: 'Öffne mein Wallet', icon: '💳' },
    { text: 'Marketplace öffnen', icon: '🛒' },
  ];

  useEffect(() => {
    // Welcome message
    setMessages([{
      type: 'bot',
      text: 'Hallo! 👋 Ich bin dein BidBlitz Assistant. Wie kann ich dir helfen?',
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const processInput = (text) => {
    const lower = text.toLowerCase();
    
    // Keywords and responses
    if (lower.includes('taxi') || lower.includes('fahrt') || lower.includes('fahren')) {
      return { text: '🚕 Ich öffne den Taxi-Service für dich...', action: '/taxi' };
    }
    if (lower.includes('scooter') || lower.includes('roller')) {
      return { text: '🛴 Scooter-Service wird geöffnet...', action: '/scooter' };
    }
    if (lower.includes('coin') || lower.includes('wallet') || lower.includes('geld') || lower.includes('guthaben')) {
      return { text: '💳 Hier ist dein Wallet...', action: '/app-wallet' };
    }
    if (lower.includes('spiel') || lower.includes('game') || lower.includes('spielen')) {
      return { text: '🎮 Öffne den Games-Bereich...', action: '/games' };
    }
    if (lower.includes('markt') || lower.includes('market') || lower.includes('kaufen') || lower.includes('verkaufen')) {
      return { text: '🛒 Marketplace wird geladen...', action: '/market' };
    }
    if (lower.includes('store') || lower.includes('shop') || lower.includes('laden')) {
      return { text: '🛍️ Store wird geöffnet...', action: '/store' };
    }
    if (lower.includes('vip') || lower.includes('premium')) {
      return { text: '⭐ Hier sind die VIP-Optionen...', action: '/app-vip' };
    }
    if (lower.includes('freund') || lower.includes('friend')) {
      return { text: '👥 Öffne Freunde-Bereich...', action: '/friends' };
    }
    if (lower.includes('event') || lower.includes('veranstaltung')) {
      return { text: '🎉 Live Events werden geladen...', action: '/live-events' };
    }
    if (lower.includes('auktion') || lower.includes('auction') || lower.includes('bieten')) {
      return { text: '🔥 Live Auction wird geöffnet...', action: '/live-auction' };
    }
    if (lower.includes('kredit') || lower.includes('loan') || lower.includes('leihen')) {
      return { text: '💳 Kredit-Bereich wird geöffnet...', action: '/loans' };
    }
    if (lower.includes('merchant') || lower.includes('händler')) {
      return { text: '🏪 Merchant-Dashboard wird geladen...', action: '/merchant' };
    }
    if (lower.includes('profil') || lower.includes('profile') || lower.includes('konto')) {
      return { text: '👤 Dein Profil wird geöffnet...', action: '/app-profile' };
    }
    if (lower.includes('hilf') || lower.includes('help')) {
      return { 
        text: '📚 Ich kann dir helfen mit:\n• Taxi/Scooter buchen\n• Spiele spielen\n• Wallet anzeigen\n• Marketplace besuchen\n• VIP upgraden\n• Und mehr!', 
        action: null 
      };
    }
    if (lower.includes('hallo') || lower.includes('hi') || lower.includes('hey')) {
      return { text: 'Hallo! 😊 Was möchtest du tun?', action: null };
    }
    if (lower.includes('danke') || lower.includes('thanks')) {
      return { text: 'Gerne! Kann ich noch etwas für dich tun? 😊', action: null };
    }
    
    return { 
      text: '🤔 Das habe ich nicht verstanden. Versuche z.B.:\n• "Bestelle ein Taxi"\n• "Zeig mein Wallet"\n• "Öffne Spiele"', 
      action: null 
    };
  };

  const sendMessage = (text = input) => {
    if (!text.trim()) return;

    const userMsg = {
      type: 'user',
      text: text,
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Process and respond
    setTimeout(() => {
      const response = processInput(text);
      const botMsg = {
        type: 'bot',
        text: response.text,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        action: response.action
      };
      setMessages(prev => [...prev, botMsg]);

      // Navigate if action
      if (response.action) {
        setTimeout(() => {
          navigate(response.action);
        }, 1500);
      }
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e24] via-[#0f1332] to-[#0b0e24] text-white pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative p-5 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to="/super-app" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <span className="text-lg">←</span>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">🤖 Assistant</h2>
              <p className="text-xs text-slate-400">Dein smarter Helfer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-400">Online</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatRef}
          className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 overflow-y-auto mb-4"
          data-testid="chat-messages"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`mb-3 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.type === 'user' 
                    ? 'bg-[#6c63ff] rounded-br-sm' 
                    : 'bg-[#1c213f] rounded-bl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.text}</p>
                <p className="text-[10px] text-slate-400 mt-1 text-right">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(sug.text)}
              className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-all border border-white/10"
            >
              <span className="mr-1">{sug.icon}</span>
              {sug.text}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Schreibe etwas..."
            className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-[#6c63ff] focus:outline-none"
            data-testid="chat-input"
          />
          <button
            onClick={() => sendMessage()}
            className="px-6 py-4 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-semibold transition-all"
            data-testid="send-btn"
          >
            Senden
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
