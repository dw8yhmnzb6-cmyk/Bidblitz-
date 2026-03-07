/**
 * BidBlitz Toast Notification System
 * Global toast notifications
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    
    const icons = {
      mining: '⛏️',
      game: '🎮',
      referral: '👥',
      coin: '💰',
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      achievement: '🏆',
      vip: '✨'
    };
    
    const newToast = {
      id,
      message,
      type,
      icon: icons[type] || icons.info
    };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // Convenience methods
  const miningReward = (amount) => showToast(`Mining Reward +${amount} Coins`, 'mining');
  const gameReward = (amount) => showToast(`Game Reward +${amount} Coins`, 'game');
  const referralJoined = () => showToast('New Referral Joined +100 Coins', 'referral');
  const coinEarned = (amount) => showToast(`+${amount} Coins`, 'coin');
  const success = (message) => showToast(message, 'success');
  const error = (message) => showToast(message, 'error');
  const achievement = (name) => showToast(`Achievement: ${name}`, 'achievement');
  
  return (
    <ToastContext.Provider value={{
      showToast,
      removeToast,
      miningReward,
      gameReward,
      referralJoined,
      coinEarned,
      success,
      error,
      achievement
    }}>
      {children}
      
      {/* Toast Container */}
      <div 
        className="fixed top-5 right-5 z-50 space-y-2"
        style={{ maxWidth: '320px' }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="bg-[#171a3a] p-4 rounded-xl shadow-2xl cursor-pointer
                       animate-slide-in border border-slate-700/50"
            style={{
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{toast.icon}</span>
              <p className="text-white text-sm">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
