/**
 * OnboardingTour Component
 * Shows a step-by-step tutorial for new users explaining how penny auctions work
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, ChevronRight, ChevronLeft, Zap, Trophy, Clock, Gift, Target, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

const translations = {
  de: {
    welcome: 'Willkommen bei BidBlitz!',
    welcomeDesc: 'Lerne in 30 Sekunden, wie du bis zu 99% sparen kannst.',
    step1Title: '1. Wie funktioniert es?',
    step1Desc: 'Bei jeder Auktion startet der Preis bei €0,00. Jedes Gebot erhöht den Preis um nur 1 Cent und verlängert den Timer um 10-20 Sekunden.',
    step2Title: '2. So gewinnst du',
    step2Desc: 'Wer das letzte Gebot abgibt, wenn der Timer abläuft, gewinnt das Produkt zum aktuellen Preis - oft nur wenige Euro!',
    step3Title: '3. Deine Strategie',
    step3Desc: 'Nutze den Bid Buddy (Autobidder) - er bietet automatisch für dich, wenn du überboten wirst. So verpasst du keine Auktion!',
    step4Title: '4. Starte jetzt!',
    step4Desc: 'Du erhältst 5 kostenlose Gebote zum Testen. Klicke auf "Jetzt bieten" bei einer Auktion und erlebe den Nervenkitzel!',
    skip: 'Überspringen',
    next: 'Weiter',
    back: 'Zurück',
    startBidding: 'Jetzt starten!',
    freeBids: '5 Gratis-Gebote',
    gotIt: 'Verstanden!'
  },
  en: {
    welcome: 'Welcome to BidBlitz!',
    welcomeDesc: 'Learn how to save up to 99% in just 30 seconds.',
    step1Title: '1. How does it work?',
    step1Desc: 'Each auction starts at €0.00. Every bid raises the price by just 1 cent and extends the timer by 10-20 seconds.',
    step2Title: '2. How to win',
    step2Desc: 'The last person to bid when the timer runs out wins the product at the current price - often just a few euros!',
    step3Title: '3. Your strategy',
    step3Desc: 'Use the Bid Buddy (auto-bidder) - it automatically bids for you when you\'re outbid. Never miss an auction!',
    step4Title: '4. Start now!',
    step4Desc: 'You get 5 free bids to try it out. Click "Bid now" on any auction and experience the thrill!',
    skip: 'Skip',
    next: 'Next',
    back: 'Back',
    startBidding: 'Start now!',
    freeBids: '5 Free Bids',
    gotIt: 'Got it!'
  },
  tr: {
    welcome: 'BidBlitz\'e Hoş Geldiniz!',
    welcomeDesc: '30 saniyede %99\'a kadar nasıl tasarruf edeceğinizi öğrenin.',
    step1Title: '1. Nasıl çalışır?',
    step1Desc: 'Her müzayede €0,00\'dan başlar. Her teklif fiyatı sadece 1 sent artırır ve zamanlayıcıyı 10-20 saniye uzatır.',
    step2Title: '2. Nasıl kazanılır',
    step2Desc: 'Zamanlayıcı sona erdiğinde son teklifi veren kişi, ürünü mevcut fiyattan kazanır - genellikle sadece birkaç euro!',
    step3Title: '3. Stratejiniz',
    step3Desc: 'Bid Buddy\'yi kullanın - geçildiğinizde otomatik olarak sizin için teklif verir. Hiçbir müzayedeyi kaçırmayın!',
    step4Title: '4. Şimdi başlayın!',
    step4Desc: 'Denemek için 5 ücretsiz teklif alırsınız. Herhangi bir müzayedede "Şimdi teklif ver"e tıklayın!',
    skip: 'Atla',
    next: 'İleri',
    back: 'Geri',
    startBidding: 'Şimdi başla!',
    freeBids: '5 Ücretsiz Teklif',
    gotIt: 'Anladım!'
  },
  sq: {
    welcome: 'Mirë se vini në BidBlitz!',
    welcomeDesc: 'Mësoni si të kurseni deri në 99% në vetëm 30 sekonda.',
    step1Title: '1. Si funksionon?',
    step1Desc: 'Çdo ankand fillon në €0,00. Çdo ofertë rrit çmimin me vetëm 1 cent dhe zgjat kohëmatësin me 10-20 sekonda.',
    step2Title: '2. Si të fitoni',
    step2Desc: 'Personi i fundit që oferton kur kohëmatësi mbaron fiton produktin me çmimin aktual - shpesh vetëm disa euro!',
    step3Title: '3. Strategjia juaj',
    step3Desc: 'Përdorni Bid Buddy - ai oferton automatikisht për ju kur tejkaloheni. Mos humbisni asnjë ankand!',
    step4Title: '4. Filloni tani!',
    step4Desc: 'Merrni 5 oferta falas për ta provuar. Klikoni "Oferto tani" në çdo ankand!',
    skip: 'Kalo',
    next: 'Tjetër',
    back: 'Prapa',
    startBidding: 'Fillo tani!',
    freeBids: '5 Oferta Falas',
    gotIt: 'E kuptova!'
  },
  fr: {
    welcome: 'Bienvenue sur BidBlitz!',
    welcomeDesc: 'Apprenez à économiser jusqu\'à 99% en 30 secondes.',
    step1Title: '1. Comment ça marche?',
    step1Desc: 'Chaque enchère commence à 0,00€. Chaque offre augmente le prix de seulement 1 centime et prolonge le minuteur de 10-20 secondes.',
    step2Title: '2. Comment gagner',
    step2Desc: 'La dernière personne à enchérir quand le minuteur expire gagne le produit au prix actuel - souvent quelques euros!',
    step3Title: '3. Votre stratégie',
    step3Desc: 'Utilisez le Bid Buddy - il enchérit automatiquement pour vous. Ne manquez jamais une enchère!',
    step4Title: '4. Commencez maintenant!',
    step4Desc: 'Vous recevez 5 enchères gratuites pour essayer. Cliquez sur "Enchérir" sur n\'importe quelle enchère!',
    skip: 'Passer',
    next: 'Suivant',
    back: 'Retour',
    startBidding: 'Commencer!',
    freeBids: '5 Enchères Gratuites',
    gotIt: 'Compris!'
  }
};

const OnboardingTour = () => {
  const { isAuthenticated, user, token } = useAuth();
  const { language } = useLanguage();
  const t = translations[language] || translations.de;
  
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Check if user should see onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      // Check localStorage first
      const hasSeenTour = localStorage.getItem('bidblitz_onboarding_completed');
      if (hasSeenTour) return;
      
      // For authenticated users, check if they're new
      if (isAuthenticated && user) {
        // Show tour if user has less than 5 bids placed (new user)
        const totalBids = user.total_bids_placed || 0;
        if (totalBids < 5) {
          setTimeout(() => setShowTour(true), 2000); // Show after 2 seconds
        }
      } else {
        // For non-authenticated users, show after 5 seconds
        setTimeout(() => setShowTour(true), 5000);
      }
    };
    
    checkOnboarding();
  }, [isAuthenticated, user]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowTour(false);
      localStorage.setItem('bidblitz_onboarding_completed', 'true');
    }, 300);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      title: t.step1Title,
      description: t.step1Desc,
      icon: <Zap className="w-12 h-12 text-yellow-400" />,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: t.step2Title,
      description: t.step2Desc,
      icon: <Trophy className="w-12 h-12 text-green-400" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: t.step3Title,
      description: t.step3Desc,
      icon: <Target className="w-12 h-12 text-purple-400" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: t.step4Title,
      description: t.step4Desc,
      icon: <Gift className="w-12 h-12 text-cyan-400" />,
      color: 'from-cyan-500 to-blue-500'
    }
  ];

  if (!showTour) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      data-testid="onboarding-tour"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-lg bg-gradient-to-br ${steps[currentStep].color} rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
        isClosing ? 'scale-95' : 'scale-100'
      }`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        {/* Content */}
        <div className="p-8 text-center text-white">
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep ? 'w-8 bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/20 animate-pulse">
              {steps[currentStep].icon}
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold mb-4">
            {steps[currentStep].title}
          </h2>
          
          {/* Description */}
          <p className="text-white/90 text-lg leading-relaxed mb-8">
            {steps[currentStep].description}
          </p>
          
          {/* Free bids badge */}
          {currentStep === 3 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6 animate-bounce">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">{t.freeBids}</span>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handleBack}
              variant="ghost"
              className={`text-white hover:bg-white/20 ${currentStep === 0 ? 'invisible' : ''}`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              {t.back}
            </Button>
            
            <Button
              onClick={handleClose}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/20"
            >
              {t.skip}
            </Button>
            
            <Button
              onClick={handleNext}
              className="bg-white text-gray-900 hover:bg-white/90 font-bold px-6"
            >
              {currentStep === 3 ? t.startBidding : t.next}
              {currentStep < 3 && <ChevronRight className="w-5 h-5 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
