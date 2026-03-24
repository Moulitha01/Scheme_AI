import { createContext, useContext, useState } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'English', voice: 'en-IN', flag: '🇮🇳' },
  { code: 'hi', label: 'हिंदी', voice: 'hi-IN', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', voice: 'ta-IN', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', voice: 'te-IN', flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা', voice: 'bn-IN', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', voice: 'mr-IN', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી', voice: 'gu-IN', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', voice: 'kn-IN', flag: '🇮🇳' },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('schemeai_lang') || 'hi';
  });

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('schemeai_lang', code);
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[1];

  return (
    <LanguageContext.Provider value={{ lang, changeLang, currentLang, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}