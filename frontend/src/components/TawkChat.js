import { useRef, useEffect, memo } from 'react';
import TawkMessengerReact from '@tawk.to/tawk-messenger-react';
import { useAuth } from '../context/AuthContext';

/**
 * Tawk.to Live Chat Widget Component
 * 
 * Integrates Tawk.to live chat for customer support.
 * Automatically passes user info when logged in.
 * 
 * To set up:
 * 1. Create account at tawk.to
 * 2. Get your Property ID and Widget ID from Dashboard > Administration > Chat Widget
 * 3. Add to .env: REACT_APP_TAWK_PROPERTY_ID and REACT_APP_TAWK_WIDGET_ID
 */
const TawkChat = memo(() => {
  const tawkMessengerRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  // Get credentials from environment
  const propertyId = process.env.REACT_APP_TAWK_PROPERTY_ID;
  const widgetId = process.env.REACT_APP_TAWK_WIDGET_ID;

  // Set user attributes when widget loads
  const handleOnLoad = () => {
    if (isAuthenticated && user && tawkMessengerRef.current) {
      try {
        // Set visitor name and email for support agents
        tawkMessengerRef.current.setAttributes({
          name: user.username || user.email?.split('@')[0] || 'Besucher',
          email: user.email || '',
          // Custom attributes for support context
          userId: user.id || '',
          bidBalance: user.bid_balance || 0,
          vipStatus: user.is_vip ? 'VIP' : 'Standard',
        }, (error) => {
          if (error) {
            console.warn('Tawk.to: Could not set user attributes', error);
          }
        });
      } catch (err) {
        console.warn('Tawk.to: Error setting attributes', err);
      }
    }
  };

  // Handle chat events (optional - for analytics)
  const handleChatStarted = () => {
    console.log('Tawk.to: Chat started');
  };

  const handleChatEnded = () => {
    console.log('Tawk.to: Chat ended');
  };

  // Don't render if credentials are missing
  if (!propertyId || !widgetId) {
    // Silent fail in production, warn in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Tawk.to: Missing credentials. Set REACT_APP_TAWK_PROPERTY_ID and REACT_APP_TAWK_WIDGET_ID in .env'
      );
    }
    return null;
  }

  return (
    <TawkMessengerReact
      ref={tawkMessengerRef}
      propertyId={propertyId}
      widgetId={widgetId}
      onLoad={handleOnLoad}
      onChatStarted={handleChatStarted}
      onChatEnded={handleChatEnded}
    />
  );
});

TawkChat.displayName = 'TawkChat';

export default TawkChat;
