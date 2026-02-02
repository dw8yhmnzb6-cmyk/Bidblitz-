import { createContext, useContext, useState, useEffect } from 'react';
import { translations, getTranslation, languageList, getMappedLanguage } from '../i18n/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'de';
  });

  // Get mapped language for translation purposes (e.g., xk -> sq)
  const mappedLanguage = getMappedLanguage(language);

  useEffect(() => {
    localStorage.setItem('language', language);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = mappedLanguage;
    // Update text direction for RTL languages (Arabic)
    document.documentElement.dir = (mappedLanguage === 'ar' || language === 'ae') ? 'rtl' : 'ltr';
  }, [language, mappedLanguage]);

  const t = (key) => {
    return getTranslation(language, key);
  };

  const changeLanguage = (lang) => {
    if (languageList[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      mappedLanguage, // Add mapped language for direct access
      t, 
      changeLanguage, 
      languages: Object.keys(languageList) 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
