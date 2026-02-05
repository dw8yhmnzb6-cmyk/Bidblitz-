import { useState, useEffect } from 'react';
import { Cookie, X, Settings, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../context/LanguageContext';

// Cookie consent translations
const cookieTranslations = {
  de: {
    title: "Cookie-Einstellungen",
    description: "Wir nutzen Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. Einige Cookies sind notwendig für den Betrieb der Seite, während andere uns helfen, die Website und Ihre Erfahrung zu verbessern.",
    acceptAll: "Alle akzeptieren",
    declineAll: "Nur notwendige",
    settings: "Einstellungen",
    necessary: "Notwendige Cookies",
    necessaryDesc: "Diese Cookies sind für den Betrieb der Website erforderlich.",
    analytics: "Analyse-Cookies",
    analyticsDesc: "Helfen uns zu verstehen, wie Besucher mit der Website interagieren.",
    marketing: "Marketing-Cookies",
    marketingDesc: "Werden verwendet, um relevante Werbung anzuzeigen.",
    saveSelection: "Auswahl speichern"
  },
  en: {
    title: "Cookie Settings",
    description: "We use cookies to provide you with the best possible experience on our website. Some cookies are necessary for the operation of the site, while others help us improve the website and your experience.",
    acceptAll: "Accept All",
    declineAll: "Necessary Only",
    settings: "Settings",
    necessary: "Necessary Cookies",
    necessaryDesc: "These cookies are required for the operation of the website.",
    analytics: "Analytics Cookies",
    analyticsDesc: "Help us understand how visitors interact with the website.",
    marketing: "Marketing Cookies",
    marketingDesc: "Used to display relevant advertising.",
    saveSelection: "Save Selection"
  },
  sq: {
    title: "Cilësimet e Cookie-ve",
    description: "Ne përdorim cookies për t'ju ofruar përvojën më të mirë të mundshme në faqen tonë. Disa cookies janë të nevojshme për funksionimin e faqes, ndërsa të tjerat na ndihmojnë të përmirësojmë faqen dhe përvojën tuaj.",
    acceptAll: "Prano të gjitha",
    declineAll: "Vetëm të nevojshme",
    settings: "Cilësimet",
    necessary: "Cookies të nevojshme",
    necessaryDesc: "Këto cookies janë të nevojshme për funksionimin e faqes.",
    analytics: "Cookies analitike",
    analyticsDesc: "Na ndihmojnë të kuptojmë se si vizitorët bashkëveprojnë me faqen.",
    marketing: "Cookies marketing",
    marketingDesc: "Përdoren për të shfaqur reklama relevante.",
    saveSelection: "Ruaj zgjedhjen"
  },
  tr: {
    title: "Çerez Ayarları",
    description: "Web sitemizde size mümkün olan en iyi deneyimi sunmak için çerezler kullanıyoruz. Bazı çerezler sitenin çalışması için gereklidir, diğerleri ise web sitesini ve deneyiminizi geliştirmemize yardımcı olur.",
    acceptAll: "Tümünü Kabul Et",
    declineAll: "Sadece Gerekli",
    settings: "Ayarlar",
    necessary: "Gerekli Çerezler",
    necessaryDesc: "Bu çerezler web sitesinin çalışması için gereklidir.",
    analytics: "Analitik Çerezler",
    analyticsDesc: "Ziyaretçilerin web sitesiyle nasıl etkileşime girdiğini anlamamıza yardımcı olur.",
    marketing: "Pazarlama Çerezleri",
    marketingDesc: "İlgili reklamları göstermek için kullanılır.",
    saveSelection: "Seçimi Kaydet"
  },
  fr: {
    title: "Paramètres des Cookies",
    description: "Nous utilisons des cookies pour vous offrir la meilleure expérience possible sur notre site. Certains cookies sont nécessaires au fonctionnement du site, tandis que d'autres nous aident à améliorer le site et votre expérience.",
    acceptAll: "Tout accepter",
    declineAll: "Uniquement nécessaires",
    settings: "Paramètres",
    necessary: "Cookies nécessaires",
    necessaryDesc: "Ces cookies sont requis pour le fonctionnement du site.",
    analytics: "Cookies analytiques",
    analyticsDesc: "Nous aident à comprendre comment les visiteurs interagissent avec le site.",
    marketing: "Cookies marketing",
    marketingDesc: "Utilisés pour afficher des publicités pertinentes.",
    saveSelection: "Enregistrer la sélection"
  },
  ar: {
    title: "إعدادات ملفات تعريف الارتباط",
    description: "نستخدم ملفات تعريف الارتباط لتقديم أفضل تجربة ممكنة على موقعنا. بعض ملفات تعريف الارتباط ضرورية لتشغيل الموقع، بينما تساعدنا أخرى في تحسين الموقع وتجربتك.",
    acceptAll: "قبول الكل",
    declineAll: "الضرورية فقط",
    settings: "الإعدادات",
    necessary: "ملفات تعريف الارتباط الضرورية",
    necessaryDesc: "هذه الملفات مطلوبة لتشغيل الموقع.",
    analytics: "ملفات تعريف الارتباط التحليلية",
    analyticsDesc: "تساعدنا على فهم كيفية تفاعل الزوار مع الموقع.",
    marketing: "ملفات تعريف الارتباط التسويقية",
    marketingDesc: "تُستخدم لعرض إعلانات ذات صلة.",
    saveSelection: "حفظ الاختيار"
  }
};

export const CookieConsent = () => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  // Get translations for current language, fallback to German
  const t = cookieTranslations[language] || cookieTranslations.de;

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
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
        className="w-full max-w-3xl bg-obsidian-paper border border-white/10 rounded-xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-500"
        data-testid="cookie-consent-banner"
      >
        {!showSettings ? (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-md bg-acid/20 flex items-center justify-center flex-shrink-0 border border-acid/30">
                <Cookie className="w-6 h-6 text-acid" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-bold text-white mb-2">{t.title}</h3>
                <p className="text-gray-400 text-sm mb-4 font-body">{t.description}</p>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleAcceptAll}
                    className="bg-acid hover:bg-acid-hover text-black font-heading font-bold uppercase tracking-wider hover:shadow-neon-acid transition-all"
                    data-testid="accept-all-cookies"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t.acceptAll}
                  </Button>
                  <Button 
                    onClick={handleDeclineAll}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 hover:border-acid/30 font-body"
                    data-testid="decline-cookies"
                  >
                    {t.declineAll}
                  </Button>
                  <Button 
                    onClick={() => setShowSettings(true)}
                    variant="ghost"
                    className="text-gray-400 hover:text-acid font-body"
                    data-testid="cookie-settings"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t.settings}
                  </Button>
                </div>
              </div>
              <button 
                onClick={handleDeclineAll}
                className="text-gray-500 hover:text-acid transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-heading font-bold text-white">{t.title}</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-acid transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {/* Necessary */}
              <div className="flex items-center justify-between p-4 rounded-md bg-obsidian-subtle border border-white/5">
                <div>
                  <h4 className="text-white font-heading font-medium">{t.necessary}</h4>
                  <p className="text-gray-500 text-sm font-body">{t.necessaryDesc}</p>
                </div>
                <div className="w-12 h-6 rounded-full bg-acid flex items-center justify-end px-1">
                  <div className="w-4 h-4 rounded-full bg-black"></div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 rounded-md bg-obsidian-subtle border border-white/5">
                <div>
                  <h4 className="text-white font-heading font-medium">{t.analytics}</h4>
                  <p className="text-gray-500 text-sm font-body">{t.analyticsDesc}</p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, analytics: !preferences.analytics})}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    preferences.analytics ? 'bg-acid justify-end' : 'bg-obsidian border border-white/20 justify-start'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${preferences.analytics ? 'bg-black' : 'bg-white'}`}></div>
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-4 rounded-md bg-obsidian-subtle border border-white/5">
                <div>
                  <h4 className="text-white font-heading font-medium">{t.marketing}</h4>
                  <p className="text-gray-500 text-sm font-body">{t.marketingDesc}</p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, marketing: !preferences.marketing})}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    preferences.marketing ? 'bg-acid justify-end' : 'bg-obsidian border border-white/20 justify-start'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${preferences.marketing ? 'bg-black' : 'bg-white'}`}></div>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleAcceptSelected}
                className="bg-acid hover:bg-acid-hover text-black font-heading font-bold uppercase tracking-wider flex-1 hover:shadow-neon-acid transition-all"
              >
                {t.saveSelection}
              </Button>
              <Button 
                onClick={handleAcceptAll}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:border-acid/30 flex-1 font-body"
              >
                {t.acceptAll}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
