import { useState, useEffect } from 'react';
import { Cookie, X, Settings, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    setVisible(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setVisible(false);
  };

  const handleDeclineAll = () => {
    const minimal = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem('cookieConsent', JSON.stringify(minimal));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div 
        className="w-full max-w-3xl bg-[#0F0F16] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-500"
        data-testid="cookie-consent-banner"
      >
        {!showSettings ? (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-[#FFD700]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Cookie-Einstellungen</h3>
                <p className="text-[#94A3B8] text-sm mb-4">
                  Wir nutzen Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
                  Einige Cookies sind notwendig für den Betrieb der Seite, während andere uns helfen, 
                  die Website und Ihre Erfahrung zu verbessern.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleAcceptAll}
                    className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold"
                    data-testid="accept-all-cookies"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Alle akzeptieren
                  </Button>
                  <Button 
                    onClick={handleDeclineAll}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    data-testid="decline-cookies"
                  >
                    Nur notwendige
                  </Button>
                  <Button 
                    onClick={() => setShowSettings(true)}
                    variant="ghost"
                    className="text-[#94A3B8] hover:text-white"
                    data-testid="cookie-settings"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Einstellungen
                  </Button>
                </div>
              </div>
              <button 
                onClick={handleDeclineAll}
                className="text-[#94A3B8] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Cookie-Einstellungen</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-[#94A3B8] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {/* Necessary */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#181824]">
                <div>
                  <h4 className="text-white font-medium">Notwendige Cookies</h4>
                  <p className="text-[#94A3B8] text-sm">
                    Diese Cookies sind für den Betrieb der Website erforderlich.
                  </p>
                </div>
                <div className="w-12 h-6 rounded-full bg-[#10B981] flex items-center justify-end px-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#181824]">
                <div>
                  <h4 className="text-white font-medium">Analyse-Cookies</h4>
                  <p className="text-[#94A3B8] text-sm">
                    Helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                  </p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, analytics: !preferences.analytics})}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    preferences.analytics ? 'bg-[#10B981] justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#181824]">
                <div>
                  <h4 className="text-white font-medium">Marketing-Cookies</h4>
                  <p className="text-[#94A3B8] text-sm">
                    Werden verwendet, um relevante Werbung anzuzeigen.
                  </p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, marketing: !preferences.marketing})}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    preferences.marketing ? 'bg-[#10B981] justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleAcceptSelected}
                className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold flex-1"
              >
                Auswahl speichern
              </Button>
              <Button 
                onClick={handleAcceptAll}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 flex-1"
              >
                Alle akzeptieren
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
