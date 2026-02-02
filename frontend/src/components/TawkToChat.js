import { useEffect } from 'react';

/**
 * Tawk.to Live Chat Integration
 * 
 * To activate:
 * 1. Create account at tawk.to
 * 2. Get your Property ID and Widget ID from the embed code
 * 3. Pass them as props: <TawkToChat propertyId="YOUR_ID" widgetId="YOUR_WIDGET_ID" />
 * 
 * The embed code looks like:
 * https://embed.tawk.to/PROPERTY_ID/WIDGET_ID
 */

export default function TawkToChat({ propertyId, widgetId }) {
  useEffect(() => {
    // Don't load if no IDs provided
    if (!propertyId || !widgetId) {
      console.log('TawkTo: No propertyId or widgetId provided. Chat disabled.');
      return;
    }

    // Check if already loaded
    if (window.Tawk_API) {
      return;
    }

    // Load Tawk.to script
    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    
    s1.async = true;
    s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    
    s0.parentNode.insertBefore(s1, s0);

    // Set up Tawk API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Customize widget appearance
    window.Tawk_API.customStyle = {
      visibility: {
        desktop: {
          position: 'br', // bottom-right
          xOffset: 20,
          yOffset: 20
        },
        mobile: {
          position: 'br',
          xOffset: 10,
          yOffset: 10
        }
      }
    };

    // Cleanup on unmount
    return () => {
      // Tawk.to doesn't have a clean unload method
      // Script will remain loaded
    };
  }, [propertyId, widgetId]);

  // This component renders nothing visible
  return null;
}

// Helper functions to control Tawk.to programmatically
export const TawkToAPI = {
  // Maximize the chat widget
  maximize: () => {
    if (window.Tawk_API?.maximize) {
      window.Tawk_API.maximize();
    }
  },

  // Minimize the chat widget
  minimize: () => {
    if (window.Tawk_API?.minimize) {
      window.Tawk_API.minimize();
    }
  },

  // Toggle the chat widget
  toggle: () => {
    if (window.Tawk_API?.toggle) {
      window.Tawk_API.toggle();
    }
  },

  // Hide the widget completely
  hideWidget: () => {
    if (window.Tawk_API?.hideWidget) {
      window.Tawk_API.hideWidget();
    }
  },

  // Show the widget
  showWidget: () => {
    if (window.Tawk_API?.showWidget) {
      window.Tawk_API.showWidget();
    }
  },

  // Set visitor attributes
  setAttributes: (attributes) => {
    if (window.Tawk_API?.setAttributes) {
      window.Tawk_API.setAttributes(attributes, (error) => {
        if (error) console.error('TawkTo setAttributes error:', error);
      });
    }
  },

  // Add event listener
  addEvent: (eventName, callback) => {
    if (window.Tawk_API) {
      window.Tawk_API[eventName] = callback;
    }
  },

  // Send a custom message
  addTags: (tags) => {
    if (window.Tawk_API?.addTags) {
      window.Tawk_API.addTags(tags);
    }
  }
};
