/**
 * OutbidNotification Component
 * Shows a real-time notification when user gets outbid
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Zap, ArrowRight, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL;

const translations = {
  de: {
    outbid: 'Du wurdest überboten!',
    at: 'bei',
    currentPrice: 'Aktueller Preis',
    bidNow: 'Jetzt bieten',
    dismiss: 'Später',
    hurry: 'Schnell sein!'
  },
  en: {
    outbid: 'You\'ve been outbid!',
    at: 'on',
    currentPrice: 'Current price',
    bidNow: 'Bid now',
    dismiss: 'Later',
    hurry: 'Hurry!'
  },
  tr: {
    outbid: 'Geçildiniz!',
    at: 'üzerinde',
    currentPrice: 'Mevcut fiyat',
    bidNow: 'Şimdi teklif ver',
    dismiss: 'Sonra',
    hurry: 'Acele edin!'
  },
  sq: {
    outbid: 'U tejkaluat!',
    at: 'në',
    currentPrice: 'Çmimi aktual',
    bidNow: 'Oferto tani',
    dismiss: 'Më vonë',
    hurry: 'Shpejt!'
  },
  fr: {
    outbid: 'Vous avez été surenchéri!',
    at: 'sur',
    currentPrice: 'Prix actuel',
    bidNow: 'Enchérir',
    dismiss: 'Plus tard',
    hurry: 'Vite!'
  }
};

const OutbidNotification = () => {
  const { isAuthenticated, token, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = translations[language] || translations.de;
  
  const [notifications, setNotifications] = useState([]);

  // Poll for outbid notifications (simpler than WebSocket, more reliable)
  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) return;

    const checkOutbids = async () => {
      try {
        const response = await fetch(`${API}/api/notifications/outbids`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.outbids && data.outbids.length > 0) {
            // Add new notifications
            const newNotifs = data.outbids.map(outbid => ({
              id: outbid.id || Date.now(),
              auctionId: outbid.auction_id,
              auctionName: outbid.auction_name,
              productImage: outbid.product_image,
              currentPrice: outbid.current_price,
              outbidder: outbid.outbidder_name,
              timestamp: new Date()
            }));
            
            setNotifications(prev => {
              // Only add if not already shown
              const existingIds = new Set(prev.map(n => n.auctionId));
              const toAdd = newNotifs.filter(n => !existingIds.has(n.auctionId));
              return [...prev, ...toAdd];
            });
          }
        }
      } catch (err) {
        // Silent fail - don't show network error for background polling
        console.log('Outbid check skipped');
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkOutbids, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, token, user?.id]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleBidNow = (auctionId) => {
    navigate(`/auctions/${auctionId}`);
    setNotifications(prev => prev.filter(n => n.auctionId !== auctionId));
  };

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNotifications(prev => 
        prev.filter(n => (now - n.timestamp) < 30000)
      );
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm" data-testid="outbid-notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-gradient-to-r from-red-600 to-orange-500 rounded-xl shadow-2xl overflow-hidden animate-slide-in-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/20">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-300 animate-bounce" />
              <span className="text-white font-bold text-sm">{t.outbid}</span>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <div className="flex gap-3">
              {/* Product image */}
              {notification.productImage && (
                <img
                  src={notification.productImage}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg bg-white/10"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {notification.auctionName}
                </p>
                <p className="text-white/80 text-xs mt-1">
                  {t.currentPrice}: <span className="font-bold text-yellow-300">€{notification.currentPrice?.toFixed(2)}</span>
                </p>
                {notification.outbidder && (
                  <p className="text-white/60 text-xs mt-1">
                    von {notification.outbidder}
                  </p>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => handleBidNow(notification.auctionId)}
                className="flex-1 bg-white text-red-600 hover:bg-yellow-100 font-bold text-sm py-2"
              >
                <Zap className="w-4 h-4 mr-1" />
                {t.bidNow}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                onClick={() => dismissNotification(notification.id)}
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/20 text-sm"
              >
                {t.dismiss}
              </Button>
            </div>
          </div>
          
          {/* Urgency indicator */}
          <div className="h-1 bg-yellow-400 animate-pulse" />
        </div>
      ))}
    </div>
  );
};

export default OutbidNotification;
