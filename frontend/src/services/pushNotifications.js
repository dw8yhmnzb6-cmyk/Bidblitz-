/**
 * Push Notification Service
 * 
 * Handles browser push notifications for auction events.
 * Supports: Outbid alerts, Wishlist auctions starting, Auction won.
 */

const NOTIFICATION_PERMISSION_KEY = 'bidblitz_notifications_enabled';

class PushNotificationService {
  constructor() {
    this.permission = Notification.permission;
    this.enabled = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true';
  }

  /**
   * Check if browser supports notifications
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Request permission for notifications
   */
  async requestPermission() {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        this.enabled = true;
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled() {
    return this.isSupported() && this.permission === 'granted' && this.enabled;
  }

  /**
   * Disable notifications
   */
  disable() {
    this.enabled = false;
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false');
  }

  /**
   * Enable notifications (if permission granted)
   */
  enable() {
    if (this.permission === 'granted') {
      this.enabled = true;
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
    }
  }

  /**
   * Send a notification
   */
  notify(title, options = {}) {
    if (!this.isEnabled()) return null;

    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Handle click
      if (options.onClick) {
        notification.onclick = options.onClick;
      }
      
      // Auto close after timeout
      if (options.autoClose !== false) {
        setTimeout(() => notification.close(), options.autoCloseTime || 5000);
      }
      
      return notification;
    } catch (err) {
      console.error('Error showing notification:', err);
      return null;
    }
  }

  // Pre-built notification types
  
  /**
   * Notify user they were outbid
   */
  notifyOutbid(auctionTitle, newPrice, auctionUrl) {
    return this.notify('Du wurdest überboten! 🔔', {
      body: `${auctionTitle} - Neuer Preis: €${newPrice.toFixed(2)}`,
      tag: 'outbid',
      requireInteraction: true,
      onClick: () => {
        window.focus();
        if (auctionUrl) window.location.href = auctionUrl;
      }
    });
  }

  /**
   * Notify user their wishlist auction is starting
   */
  notifyWishlistAuction(auctionTitle, auctionUrl) {
    return this.notify('Wunschliste-Auktion startet! ⭐', {
      body: `${auctionTitle} beginnt jetzt!`,
      tag: 'wishlist',
      requireInteraction: true,
      onClick: () => {
        window.focus();
        if (auctionUrl) window.location.href = auctionUrl;
      }
    });
  }

  /**
   * Notify user they won an auction
   */
  notifyAuctionWon(auctionTitle, price, savings) {
    return this.notify('Glückwunsch! Du hast gewonnen! 🎉', {
      body: `${auctionTitle} für nur €${price.toFixed(2)} (${savings}% gespart!)`,
      tag: 'won',
      requireInteraction: true,
      autoClose: false
    });
  }

  /**
   * Notify about auction ending soon
   */
  notifyAuctionEndingSoon(auctionTitle, minutesLeft, auctionUrl) {
    return this.notify(`Auktion endet in ${minutesLeft} Min! ⏰`, {
      body: auctionTitle,
      tag: 'ending-soon',
      onClick: () => {
        window.focus();
        if (auctionUrl) window.location.href = auctionUrl;
      }
    });
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationService();

// React hook for push notifications
import { useState, useEffect, useCallback } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState(pushNotifications.permission);
  const [enabled, setEnabled] = useState(pushNotifications.isEnabled());

  const requestPermission = useCallback(async () => {
    const granted = await pushNotifications.requestPermission();
    setPermission(pushNotifications.permission);
    setEnabled(granted);
    return granted;
  }, []);

  const enable = useCallback(() => {
    pushNotifications.enable();
    setEnabled(pushNotifications.isEnabled());
  }, []);

  const disable = useCallback(() => {
    pushNotifications.disable();
    setEnabled(false);
  }, []);

  useEffect(() => {
    setPermission(pushNotifications.permission);
    setEnabled(pushNotifications.isEnabled());
  }, []);

  return {
    isSupported: pushNotifications.isSupported(),
    permission,
    enabled,
    requestPermission,
    enable,
    disable,
    notify: pushNotifications.notify.bind(pushNotifications),
    notifyOutbid: pushNotifications.notifyOutbid.bind(pushNotifications),
    notifyWishlistAuction: pushNotifications.notifyWishlistAuction.bind(pushNotifications),
    notifyAuctionWon: pushNotifications.notifyAuctionWon.bind(pushNotifications),
    notifyAuctionEndingSoon: pushNotifications.notifyAuctionEndingSoon.bind(pushNotifications)
  };
}

export default pushNotifications;
