/**
 * BidBlitz Notifications Center
 * Push notifications and alerts
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    fetchNotifications();
    // Check for new notifications every 30 seconds
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
      // Generate sample notifications
      const sampleNotifications = [
        { id: 1, type: 'mining', title: '⛏️ Mining Reward bereit!', message: 'Dein täglicher Mining-Reward wartet auf dich.', time: '2 Min', read: false },
        { id: 2, type: 'game', title: '🎰 Jackpot Update', message: 'Der Jackpot ist auf 5.000 Coins gestiegen!', time: '15 Min', read: false },
        { id: 3, type: 'referral', title: '👥 Neuer Referral!', message: 'Ein Freund hat deinen Code verwendet. +100 Coins!', time: '1 Std', read: true },
        { id: 4, type: 'vip', title: '✨ VIP Upgrade!', message: 'Du bist jetzt VIP 2! +10% Mining Bonus aktiviert.', time: '3 Std', read: true },
        { id: 5, type: 'system', title: '🎁 Täglicher Bonus', message: 'Vergiss nicht, deinen täglichen Bonus abzuholen!', time: '5 Std', read: true },
        { id: 6, type: 'achievement', title: '🏆 Achievement!', message: 'Du hast "Gamer" freigeschaltet!', time: '1 Tag', read: true },
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
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'mining': return 'border-cyan-500/30 bg-cyan-500/10';
      case 'game': return 'border-purple-500/30 bg-purple-500/10';
      case 'referral': return 'border-green-500/30 bg-green-500/10';
      case 'vip': return 'border-amber-500/30 bg-amber-500/10';
      case 'achievement': return 'border-pink-500/30 bg-pink-500/10';
      default: return 'border-slate-500/30 bg-slate-500/10';
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0b0e24] text-white pb-20">
      <div className="p-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold">🔔 Benachrichtigungen</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 rounded-full text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        
        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-full mb-4 py-2 bg-[#171a3a] hover:bg-[#252b4d] rounded-xl text-sm text-slate-400"
            data-testid="mark-all-read"
          >
            Alle als gelesen markieren
          </button>
        )}
        
        {/* Notifications List */}
        <div className="space-y-3" data-testid="notifications-list">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-4xl mb-2">🔕</p>
              <p>Keine Benachrichtigungen</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  notif.read 
                    ? 'bg-[#171a3a] border-slate-700/30 opacity-60' 
                    : getTypeColor(notif.type)
                }`}
                data-testid={`notification-${notif.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`font-semibold ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">{notif.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{notif.time}</p>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-auto"></div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Notification Settings */}
        <div className="mt-6 bg-[#171a3a] p-4 rounded-xl">
          <h3 className="font-semibold mb-3">⚙️ Einstellungen</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Mining Benachrichtigungen</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#6c63ff]" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Spiel Benachrichtigungen</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#6c63ff]" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Referral Benachrichtigungen</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#6c63ff]" />
            </label>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
