/**
 * Price Guarantee Badge - Shows money-back guarantee for auctions
 * Builds trust with "guaranteed under market price" message
 */
import { memo } from 'react';
import { Shield, CheckCircle, BadgeCheck } from 'lucide-react';

const translations = {
  de: {
    title: 'Preis-Garantie',
    subtitle: 'Garantiert unter Marktpreis',
    description: 'Oder Geld zurück!',
    features: [
      'Mindestens 50% unter UVP',
      '14 Tage Rückgaberecht',
      'Sichere Zahlung'
    ],
    badge: 'GEPRÜFT'
  },
  en: {
    title: 'Price Guarantee',
    subtitle: 'Guaranteed Below Market',
    description: 'Or money back!',
    features: [
      'At least 50% below RRP',
      '14-day return policy',
      'Secure payment'
    ],
    badge: 'VERIFIED'
  },
  tr: {
    title: 'Fiyat Garantisi',
    subtitle: 'Piyasa Fiyatının Altında',
    description: 'Veya paranız iade!',
    features: [
      'En az %50 indirimli',
      '14 gün iade hakkı',
      'Güvenli ödeme'
    ],
    badge: 'ONAYLI'
  },
  sq: {
    title: 'Garancia e Çmimit',
    subtitle: 'Nën çmimin e tregut',
    description: 'Ose paratë kthehen!',
    features: [
      'Të paktën 50% nën çmimin',
      '14 ditë kthim',
      'Pagesë e sigurt'
    ],
    badge: 'I VERIFIKUAR'
  },
  xk: {
    title: 'Garancia e Çmimit',
    subtitle: 'Nën çmimin e tregut',
    description: 'Ose paratë kthehen!',
    features: [
      'Të paktën 50% nën çmimin',
      '14 ditë kthim',
      'Pagesë e sigurt'
    ],
    badge: 'I VERIFIKUAR'
  },
  fr: {
    title: 'Garantie Prix',
    subtitle: 'Garanti sous le marché',
    description: 'Ou remboursé!',
    features: [
      'Au moins 50% sous le prix',
      'Retour sous 14 jours',
      'Paiement sécurisé'
    ],
    badge: 'VÉRIFIÉ'
  }
};

// Compact badge for auction cards
export const PriceGuaranteeBadge = memo(({ language = 'de', size = 'sm' }) => {
  const t = translations[language] || translations.de;
  
  if (size === 'sm') {
    return (
      <div 
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 
          text-white text-[10px] font-bold rounded-full shadow-sm"
        data-testid="price-guarantee-badge-sm"
      >
        <Shield className="w-3 h-3" />
        <span>{t.badge}</span>
      </div>
    );
  }
  
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 
        text-white text-xs font-bold rounded-full shadow-md"
      data-testid="price-guarantee-badge"
    >
      <Shield className="w-4 h-4" />
      <span>{t.title}</span>
      <BadgeCheck className="w-4 h-4 text-yellow-300" />
    </div>
  );
});

// Full section for homepage/landing page
export const PriceGuaranteeSection = memo(({ language = 'de' }) => {
  const t = translations[language] || translations.de;
  
  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 
        text-white rounded-2xl p-6 sm:p-8 shadow-2xl"
      data-testid="price-guarantee-section"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        {/* Shield icon */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative p-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <h3 className="text-2xl sm:text-3xl font-black">{t.title}</h3>
            <BadgeCheck className="w-7 h-7 text-yellow-400" />
          </div>
          <p className="text-emerald-300 text-lg font-semibold mb-1">{t.subtitle}</p>
          <p className="text-white/80 text-sm mb-4">{t.description}</p>
          
          {/* Feature list */}
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {t.features.map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-sm"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Trust badge */}
        <div className="flex-shrink-0 hidden lg:block">
          <div className="text-center p-4 border-2 border-emerald-400/30 rounded-xl bg-white/5">
            <p className="text-4xl font-black text-emerald-400">100%</p>
            <p className="text-sm text-white/80">{t.badge}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

PriceGuaranteeBadge.displayName = 'PriceGuaranteeBadge';
PriceGuaranteeSection.displayName = 'PriceGuaranteeSection';

export default PriceGuaranteeSection;
