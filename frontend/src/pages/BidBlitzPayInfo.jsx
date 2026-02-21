import React, { useState } from 'react';
import { 
  Shield, Zap, CreditCard, Gift, QrCode, 
  Users, ArrowRight, Check, ChevronDown, ChevronUp,
  Wallet, RefreshCw, Lock, Sparkles, Send, Smartphone
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const BidBlitzPayInfo = () => {
  const navigate = useNavigate();
  const [language] = useState(() => localStorage.getItem('language') || 'de');
  const [openFaq, setOpenFaq] = useState(null);

  const translations = {
    de: {
      heroTitle: 'BidBlitz Pay',
      heroSubtitle: 'Einfach. Sicher. Schnell.',
      heroDescription: 'Dein digitales Wallet für Auktionen, Überweisungen und mehr.',
      startNow: 'Jetzt starten',
      learnMore: 'Mehr erfahren',
      
      featuresTitle: 'So funktioniert\'s',
      featuresSubtitle: 'Alle Vorteile auf einen Blick',
      
      feature1Title: 'Digitales Wallet',
      feature1Desc: 'Smartphone statt Portemonnaie',
      
      feature2Title: 'Geld senden',
      feature2Desc: 'Sofort & kostenlos',
      
      feature3Title: 'Kontakte speichern',
      feature3Desc: 'Mit einem Klick überweisen',
      
      feature4Title: 'Übersicht',
      feature4Desc: 'Alle Zahlungen im Blick',
      
      feature5Title: 'Bonus',
      feature5Desc: 'Bis zu 6% extra',
      
      feature6Title: 'Sicher',
      feature6Desc: 'Modernste Verschlüsselung',
      
      howToTitle: 'In 3 Schritten starten',
      step1Title: 'Registrieren',
      step1Desc: 'Kostenlos mit E-Mail',
      step2Title: 'Aufladen',
      step2Desc: 'Per Karte oder Überweisung',
      step3Title: 'Loslegen',
      step3Desc: 'Senden, bieten, bezahlen',
      
      benefitsTitle: 'Deine Vorteile',
      benefit1: 'Kostenlose Überweisungen',
      benefit2: 'Bis zu 6% Bonus',
      benefit3: 'Gratis-Gebote',
      benefit4: 'Tägliche Belohnungen',
      benefit5: 'Ranglisten & Abzeichen',
      benefit6: 'Freunde einladen',
      
      securityTitle: 'Sicherheit',
      securityDesc: 'Dein Geld ist bei uns sicher.',
      security1: 'SSL-Verschlüsselung',
      security2: 'Zwei-Faktor-Auth',
      security3: 'EU-Server',
      security4: 'DSGVO-konform',
      
      faqTitle: 'FAQ',
      faq1Q: 'Wie lade ich auf?',
      faq1A: 'Per Kreditkarte, Überweisung, PayPal oder bar im Geschäft.',
      faq2Q: 'Ist es kostenlos?',
      faq2A: 'Ja! Registrierung und Nutzung sind komplett kostenlos.',
      faq3Q: 'Wie sicher ist mein Geld?',
      faq3A: 'Modernste Verschlüsselung und sichere EU-Server schützen dich.',
      faq4Q: 'An wen kann ich senden?',
      faq4A: 'An jeden BidBlitz-Nutzer per E-Mail oder Kundennummer.',
      faq5Q: 'Was sind Gratis-Gebote?',
      faq5A: 'Kostenlose Gebote für Auktionen bei Aufladungen und Aktionen.',
      
      ctaTitle: 'Bereit?',
      ctaDesc: 'Erstelle jetzt dein kostenloses Konto.',
      ctaButton: 'Registrieren',
      ctaLogin: 'Schon Mitglied? Anmelden',
      
      footerNote: 'BidBlitz Pay - Die smarte Art zu bezahlen'
    },
    en: {
      heroTitle: 'BidBlitz Pay',
      heroSubtitle: 'Simple. Secure. Fast.',
      heroDescription: 'Your digital wallet for auctions, transfers and more.',
      startNow: 'Get Started',
      learnMore: 'Learn More',
      featuresTitle: 'How it works',
      featuresSubtitle: 'All benefits at a glance',
      feature1Title: 'Digital Wallet',
      feature1Desc: 'Phone instead of wallet',
      feature2Title: 'Send Money',
      feature2Desc: 'Instant & free',
      feature3Title: 'Save Contacts',
      feature3Desc: 'One-click transfers',
      feature4Title: 'Overview',
      feature4Desc: 'All payments tracked',
      feature5Title: 'Bonus',
      feature5Desc: 'Up to 6% extra',
      feature6Title: 'Secure',
      feature6Desc: 'Latest encryption',
      howToTitle: 'Start in 3 Steps',
      step1Title: 'Register',
      step1Desc: 'Free with email',
      step2Title: 'Top Up',
      step2Desc: 'Card or transfer',
      step3Title: 'Go!',
      step3Desc: 'Send, bid, pay',
      benefitsTitle: 'Your Benefits',
      benefit1: 'Free transfers',
      benefit2: 'Up to 6% bonus',
      benefit3: 'Free bids',
      benefit4: 'Daily rewards',
      benefit5: 'Rankings & badges',
      benefit6: 'Invite friends',
      securityTitle: 'Security',
      securityDesc: 'Your money is safe with us.',
      security1: 'SSL encryption',
      security2: 'Two-factor auth',
      security3: 'EU servers',
      security4: 'GDPR compliant',
      faqTitle: 'FAQ',
      faq1Q: 'How to top up?',
      faq1A: 'Credit card, transfer, PayPal or cash in-store.',
      faq2Q: 'Is it free?',
      faq2A: 'Yes! Registration and use are completely free.',
      faq3Q: 'How safe is my money?',
      faq3A: 'Latest encryption and secure EU servers protect you.',
      faq4Q: 'Who can I send to?',
      faq4A: 'Any BidBlitz user via email or customer number.',
      faq5Q: 'What are free bids?',
      faq5A: 'Free auction bids with top-ups and promotions.',
      ctaTitle: 'Ready?',
      ctaDesc: 'Create your free account now.',
      ctaButton: 'Register',
      ctaLogin: 'Already a member? Log in',
      footerNote: 'BidBlitz Pay - The smart way to pay'
    }
  };

  const t = translations[language] || translations.de;

  const features = [
    { icon: Wallet, title: t.feature1Title, desc: t.feature1Desc, color: 'bg-gradient-to-br from-amber-400 to-orange-500' },
    { icon: Send, title: t.feature2Title, desc: t.feature2Desc, color: 'bg-gradient-to-br from-green-400 to-emerald-500' },
    { icon: Users, title: t.feature3Title, desc: t.feature3Desc, color: 'bg-gradient-to-br from-blue-400 to-indigo-500' },
    { icon: CreditCard, title: t.feature4Title, desc: t.feature4Desc, color: 'bg-gradient-to-br from-purple-400 to-violet-500' },
    { icon: Gift, title: t.feature5Title, desc: t.feature5Desc, color: 'bg-gradient-to-br from-pink-400 to-rose-500' },
    { icon: Shield, title: t.feature6Title, desc: t.feature6Desc, color: 'bg-gradient-to-br from-teal-400 to-cyan-500' },
  ];

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500 via-orange-500 to-orange-600">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/4 translate-y-1/4" />
        
        <div className="relative px-5 pt-16 pb-12">
          {/* Logo Badge */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
              <Wallet className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-black text-white text-center mb-3">
            {t.heroTitle}
          </h1>
          
          {/* Subtitle Badge */}
          <div className="flex justify-center mb-5">
            <span className="bg-black/20 backdrop-blur-sm text-white px-5 py-2 rounded-full text-lg font-bold">
              {t.heroSubtitle}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-white/90 text-center text-base mb-8 px-4 max-w-sm mx-auto">
            {t.heroDescription}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 px-4 max-w-sm mx-auto">
            <Button 
              onClick={() => navigate('/register')}
              className="w-full bg-white text-orange-600 hover:bg-gray-100 text-lg py-6 rounded-xl font-bold shadow-lg"
            >
              {t.startNow}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="ghost"
              onClick={() => navigate('/login')}
              className="w-full text-white hover:bg-white/10 text-base py-5 rounded-xl"
            >
              {t.ctaLogin}
            </Button>
          </div>
          
          {/* Phone Preview - Simplified for Mobile */}
          <div className="mt-10 flex justify-center">
            <div className="relative w-48">
              <div className="bg-gray-900 rounded-[28px] p-2 shadow-2xl">
                <div className="bg-gradient-to-b from-orange-100 to-amber-100 rounded-[22px] overflow-hidden">
                  {/* Notch */}
                  <div className="h-5 bg-gray-900 flex justify-center items-center">
                    <div className="w-14 h-3 bg-gray-800 rounded-full" />
                  </div>
                  {/* App Preview */}
                  <div className="p-3 space-y-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500">Guthaben</p>
                      <p className="text-xl font-bold text-gray-900">€2,059</p>
                    </div>
                    <div className="bg-white rounded-xl p-2 shadow-sm flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">1,345</p>
                        <p className="text-[8px] text-gray-500">Gebote</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {['Senden', 'Aufladen', 'Scannen'].map((item, i) => (
                        <div key={i} className="bg-white rounded-lg p-1.5 text-center shadow-sm">
                          <div className="w-5 h-5 bg-orange-100 rounded-full mx-auto mb-1 flex items-center justify-center">
                            {i === 0 && <ArrowRight className="w-3 h-3 text-orange-600" />}
                            {i === 1 && <CreditCard className="w-3 h-3 text-orange-600" />}
                            {i === 2 && <QrCode className="w-3 h-3 text-orange-600" />}
                          </div>
                          <p className="text-[7px] text-gray-600">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Grid */}
      <section id="features" className="py-12 px-5 bg-gray-900">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">
            {t.featuresTitle}
          </h2>
          <p className="text-gray-400 text-sm">{t.featuresSubtitle}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-gray-800 rounded-2xl p-4 border border-gray-700"
            >
              <div className={`w-11 h-11 ${feature.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How To Section - Mobile Cards */}
      <section className="py-12 px-5 bg-gradient-to-b from-orange-500 to-amber-500">
        <h2 className="text-2xl font-black text-white text-center mb-8">
          {t.howToTitle}
        </h2>
        
        <div className="space-y-4 max-w-sm mx-auto">
          {[
            { num: '1', title: t.step1Title, desc: t.step1Desc, icon: Smartphone },
            { num: '2', title: t.step2Title, desc: t.step2Desc, icon: CreditCard },
            { num: '3', title: t.step3Title, desc: t.step3Desc, icon: Sparkles },
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <step.icon className="w-7 h-7 text-orange-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {step.num}
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">{step.title}</h3>
                <p className="text-white/80 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section - Compact List */}
      <section className="py-12 px-5 bg-gray-900">
        <h2 className="text-2xl font-black text-white text-center mb-8">
          {t.benefitsTitle}
        </h2>
        
        <div className="space-y-2 max-w-sm mx-auto">
          {[t.benefit1, t.benefit2, t.benefit3, t.benefit4, t.benefit5, t.benefit6].map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3 border border-gray-700">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-gray-200 text-sm font-medium">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section - Dark */}
      <section className="py-12 px-5 bg-black">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500 rounded-xl mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">{t.securityTitle}</h2>
          <p className="text-gray-400 text-sm">{t.securityDesc}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {[t.security1, t.security2, t.security3, t.security4].map((item, index) => (
            <div key={index} className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-white text-xs font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section - Accordion */}
      <section className="py-12 px-5 bg-gray-900">
        <h2 className="text-2xl font-black text-white text-center mb-8">
          {t.faqTitle}
        </h2>
        
        <div className="space-y-3 max-w-sm mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <span className="font-bold text-white text-sm pr-2">{faq.q}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4 text-gray-400 text-sm">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section - Final */}
      <section className="py-12 px-5 bg-gradient-to-b from-orange-500 to-amber-600">
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-3xl font-black text-white mb-3">{t.ctaTitle}</h2>
          <p className="text-white/90 mb-6">{t.ctaDesc}</p>
          
          <Button 
            onClick={() => navigate('/register')}
            className="w-full bg-white text-orange-600 hover:bg-gray-100 text-lg py-6 rounded-xl font-bold shadow-lg mb-3"
          >
            {t.ctaButton}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate('/login')}
            className="w-full text-white hover:bg-white/10 text-base py-4 rounded-xl"
          >
            {t.ctaLogin}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <div className="bg-black py-6 text-center">
        <p className="text-gray-500 text-sm">{t.footerNote}</p>
      </div>
    </div>
  );
};

export default BidBlitzPayInfo;
