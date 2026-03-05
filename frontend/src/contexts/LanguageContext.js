import { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'EN', nativeName: 'English', speechCode: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', flag: 'HI', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: 'KN', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'te', label: 'తెలుగు', flag: 'TE', nativeName: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'ta', label: 'தமிழ்', flag: 'TA', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'ml', label: 'മലയാളം', flag: 'ML', nativeName: 'മലയാളം', speechCode: 'ml-IN' },
];

const STORAGE_KEY = 'smartdine_language';

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  });

  // On mount, sync i18n with stored language
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || 'en';
    if (i18n.language !== saved) {
      i18n.changeLanguage(saved);
    }
    setCurrentLang(saved);
  }, []);

  const changeLanguage = (code) => {
    localStorage.setItem(STORAGE_KEY, code);
    i18n.changeLanguage(code);
    setCurrentLang(code);
  };

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ currentLang, currentLanguage, changeLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};
