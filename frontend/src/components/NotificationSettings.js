import { usePushNotifications } from '../services/pushNotifications';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

/**
 * Notification Settings Component
 * Shows in user dashboard/settings to enable/disable push notifications
 */
export function NotificationSettings({ language = 'de' }) {
  const { 
    isSupported, 
    permission, 
    enabled, 
    requestPermission, 
    enable, 
    disable 
  } = usePushNotifications();

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error(language === 'en' 
        ? 'Your browser does not support notifications' 
        : 'Dein Browser unterstützt keine Benachrichtigungen');
      return;
    }

    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) {
        toast.success(language === 'en' 
          ? 'Notifications enabled!' 
          : 'Benachrichtigungen aktiviert!');
      } else {
        toast.error(language === 'en' 
          ? 'Permission denied. Please enable in browser settings.' 
          : 'Berechtigung verweigert. Bitte in Browser-Einstellungen aktivieren.');
      }
    } else if (enabled) {
      disable();
      toast.info(language === 'en' 
        ? 'Notifications disabled' 
        : 'Benachrichtigungen deaktiviert');
    } else {
      enable();
      toast.success(language === 'en' 
        ? 'Notifications enabled!' 
        : 'Benachrichtigungen aktiviert!');
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl text-slate-500">
        <BellOff className="w-5 h-5" />
        <span className="text-sm">
          {language === 'en' 
            ? 'Push notifications not supported' 
            : 'Push-Benachrichtigungen nicht unterstützt'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-3">
        {enabled ? (
          <div className="p-2 bg-emerald-100 rounded-lg">
            <BellRing className="w-5 h-5 text-emerald-600" />
          </div>
        ) : (
          <div className="p-2 bg-slate-100 rounded-lg">
            <Bell className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <div>
          <p className="font-medium text-slate-800">
            {language === 'en' ? 'Push Notifications' : 'Push-Benachrichtigungen'}
          </p>
          <p className="text-sm text-slate-500">
            {enabled 
              ? (language === 'en' ? 'Get notified about auctions' : 'Erhalte Benachrichtigungen über Auktionen')
              : (language === 'en' ? 'Currently disabled' : 'Derzeit deaktiviert')}
          </p>
        </div>
      </div>
      <Button
        variant={enabled ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggle}
        className={enabled ? 'border-slate-300' : 'bg-emerald-500 hover:bg-emerald-600'}
      >
        {enabled 
          ? (language === 'en' ? 'Disable' : 'Deaktivieren')
          : (language === 'en' ? 'Enable' : 'Aktivieren')}
      </Button>
    </div>
  );
}

/**
 * Compact notification toggle for navbar/header
 */
export function NotificationToggle({ language = 'de' }) {
  const { isSupported, enabled, requestPermission, enable, disable } = usePushNotifications();

  const handleClick = async () => {
    if (!isSupported) return;
    
    if (enabled) {
      disable();
    } else {
      const granted = await requestPermission();
      if (granted) {
        toast.success(language === 'en' 
          ? '🔔 Notifications enabled!' 
          : '🔔 Benachrichtigungen aktiviert!');
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-lg transition-colors ${
        enabled 
          ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
      }`}
      title={enabled 
        ? (language === 'en' ? 'Notifications on' : 'Benachrichtigungen an')
        : (language === 'en' ? 'Enable notifications' : 'Benachrichtigungen aktivieren')}
    >
      {enabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
    </button>
  );
}

export default NotificationSettings;
