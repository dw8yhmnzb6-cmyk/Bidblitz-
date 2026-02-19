/**
 * NotificationCenter - User notifications component
 * Shows deposit maturity alerts, referral rewards, etc.
 */
import { useState, useEffect } from 'react';
import { Bell, Gift, TrendingUp, Check, X, Clock, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

const translations = {
  de: {
    title: 'Benachrichtigungen',
    markAllRead: 'Alle als gelesen markieren',
    noNotifications: 'Keine Benachrichtigungen',
    noNotificationsDesc: 'Du wirst benachrichtigt, wenn etwas Wichtiges passiert.',
    unread: 'ungelesen',
    depositMaturing: 'Einlage fällig',
    depositMatured: 'Einlage verfügbar',
    referralReward: 'Empfehlungsbonus',
    bonusPromo: 'Bonus-Aktion'
  },
  en: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',
    noNotificationsDesc: 'You will be notified when something important happens.',
    unread: 'unread',
    depositMaturing: 'Deposit maturing',
    depositMatured: 'Deposit available',
    referralReward: 'Referral bonus',
    bonusPromo: 'Bonus promotion'
  },
  sq: {
    title: 'Njoftimet',
    markAllRead: 'Shëno të gjitha si të lexuara',
    noNotifications: 'Nuk ka njoftime',
    noNotificationsDesc: 'Do të njoftoheni kur të ndodhë diçka e rëndësishme.',
    unread: 'të palexuara',
    depositMaturing: 'Depozita maturohet',
    depositMatured: 'Depozita e disponueshme',
    referralReward: 'Bonus referimi',
    bonusPromo: 'Promovim bonus'
  },
  tr: {
    title: 'Bildirimler',
    markAllRead: 'Tümünü okundu işaretle',
    noNotifications: 'Bildirim yok',
    noNotificationsDesc: 'Önemli bir şey olduğunda bilgilendirileceksiniz.',
    unread: 'okunmamış',
    depositMaturing: 'Yatırım vadesi doluyor',
    depositMatured: 'Yatırım hazır',
    referralReward: 'Davet bonusu',
    bonusPromo: 'Bonus promosyonu'
  }
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NotificationCenter = ({ language = 'de', token, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const t = translations[language] || translations.de;

  const fetchNotifications = async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API}/referral/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, token]);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API}/referral/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API}/referral/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Alle Benachrichtigungen als gelesen markiert');
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'deposit_maturity':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'deposit_matured':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'referral_reward':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'bonus_promo':
        return <Gift className="w-5 h-5 text-pink-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'deposit_maturity':
        return t.depositMaturing;
      case 'deposit_matured':
        return t.depositMatured;
      case 'referral_reward':
        return t.referralReward;
      case 'bonus_promo':
        return t.bonusPromo;
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-hidden" data-testid="notification-center">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-800">{t.title}</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {t.markAllRead}
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">{t.noNotifications}</p>
              <p className="text-gray-500 text-sm mt-1">{t.noNotificationsDesc}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.type === 'deposit_matured' ? 'bg-green-100' :
                      notification.type === 'deposit_maturity' ? 'bg-amber-100' :
                      notification.type === 'referral_reward' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          notification.type === 'deposit_matured' ? 'bg-green-100 text-green-700' :
                          notification.type === 'deposit_maturity' ? 'bg-amber-100 text-amber-700' :
                          notification.type === 'referral_reward' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="font-medium text-gray-800 text-sm">
                        {notification[`title_${language}`] || notification.title_de}
                      </p>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {notification[`message_${language}`] || notification.message_de}
                      </p>
                      {(notification.amount || notification.interest) && (
                        <div className="flex items-center gap-3 mt-2">
                          {notification.amount && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              €{notification.amount.toFixed(2)}
                            </span>
                          )}
                          {notification.interest && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                              +€{notification.interest.toFixed(2)} Zinsen
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
