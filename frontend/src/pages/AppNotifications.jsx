/**
 * BidBlitz Notifications Center
 * Modern push notifications and alerts with glassmorphism
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.get(`${API}/app/notifications`, { headers });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (error) {
      const sampleNotifications = [
        { id: 1, type: 'mining', title: 'Mining Reward bereit!', message: 'Dein täglicher Mining-Reward wartet auf dich.', time: '2 Min', read: false },
        { id: 2, type: 'game', title: 'Jackpot Update', message: 'Der Jackpot ist auf 5.000 Coins gestiegen!', time: '15 Min', read: false },
        { id: 3, type: 'referral', title: 'Neuer Referral!', message: 'Ein Freund hat deinen Code verwendet. +100 Coins!', time: '1 Std', read: true },
        { id: 4, type: 'vip', title: 'VIP Upgrade!', message: 'Du bist jetzt VIP 2! +10% Mining Bonus aktiviert.', time: '3 Std', read: true },
        { id: 5, type: 'system', title: 'Täglicher Bonus', message: 'Vergiss nicht, deinen täglichen Bonus abzuholen!', time: '5 Std', read: true },
        { id: 6, type: 'achievement', title: 'Achievement!', message: 'Du hast "Gamer" freigeschaltet!', time: '1 Tag', read: true },
      ];
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter(n => !n.read).length);
    }
  };
  
  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/notifications/read/${notificationId}`, {}, { headers });
    } catch (error) {
      console.log('Mark read error');
    }
  };
  
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/notifications/read-all`, {}, { headers });
    } catch (error) {
      console.log('Mark all read error');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      mining: '⛏️',
      game: '🎰',
      referral: '👥',
      vip: '⭐',
      achievement: '🏆',
      system: '🔔'
    };
    return icons[type] || '📬';
  };
  
  const getTypeStyle = (type, isRead) => {
    if (isRead) return 'bg-white/5 border-white/5';
    
    const styles = {
      mining: 'bg-cyan-500/10 border-cyan-500/30',
      game: 'bg-purple-500/10 border-purple-500/30',
      referral: 'bg-emerald-500/10 border-emerald-500/30',
      vip: 'bg-amber-500/10 border-amber-500/30',
      achievement: 'bg-pink-500/10 border-pink-500/30',
      system: 'bg-blue-500/10 border-blue-500/30'
    };
    return styles[type] || 'bg-slate-500/10 border-slate-500/30';
  };

  const filterTypes = [
    { id: 'all', label: 'Alle', icon: '📬' },
    { id: 'mining', label: 'Mining', icon: '⛏️' },
    { id: 'game', label: 'Games', icon: '🎰' },
    { id: 'referral', label: 'Referral', icon: '👥' },
  ];

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e24] via-[#0f1332] to-[#0b0e24] text-white pb-24">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-60 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/super-app" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <span className="text-lg">←</span>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">Benachrichtigungen</h2>
              <p className="text-xs text-slate-400">Bleib auf dem Laufenden</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-sm font-bold border border-red-500/30">
                {unreadCount} neu
              </span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-5 px-5">
          {filterTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === type.id 
                  ? 'bg-[#6c63ff] text-white' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
        
        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-full mb-5 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-slate-300 font-medium transition-all border border-white/10 flex items-center justify-center gap-2"
            data-testid="mark-all-read"
          >
            <span>✓</span>
            Alle als gelesen markieren
          </button>
        )}
        
        {/* Notifications List */}
        <div className="space-y-3" data-testid="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔕</span>
              </div>
              <p className="text-slate-400 font-medium">Keine Benachrichtigungen</p>
              <p className="text-xs text-slate-500 mt-1">Hier erscheinen deine Updates</p>
            </div>
          ) : (
            filteredNotifications.map((notif, index) => (
              <div 
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                  getTypeStyle(notif.type, notif.read)
                } ${!notif.read ? 'ring-1 ring-white/10' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`notification-${notif.id}`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    notif.read ? 'bg-white/5' : 'bg-white/10'
                  }`}>
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold truncate ${notif.read ? 'text-slate-400' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <div className="w-2.5 h-2.5 bg-[#6c63ff] rounded-full flex-shrink-0 animate-pulse"></div>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${notif.read ? 'text-slate-500' : 'text-slate-300'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{notif.time}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Notification Settings */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚙️</span>
            <h3 className="font-semibold">Benachrichtigungs-Einstellungen</h3>
          </div>
          <div className="space-y-4">
            {[
              { id: 'mining', label: 'Mining Benachrichtigungen', icon: '⛏️', desc: 'Rewards & Updates' },
              { id: 'games', label: 'Spiel Benachrichtigungen', icon: '🎮', desc: 'Jackpots & Gewinne' },
              { id: 'referral', label: 'Referral Benachrichtigungen', icon: '👥', desc: 'Neue Einladungen' },
            ].map(setting => (
              <label key={setting.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{setting.icon}</span>
                  <div>
                    <span className="text-sm font-medium">{setting.label}</span>
                    <p className="text-xs text-slate-500">{setting.desc}</p>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-[#6c63ff] transition-all"></div>
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
