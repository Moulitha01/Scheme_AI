// frontend/src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../translations'

export const LANGUAGES = [
  { name: 'தமிழ்', code: 'ta' },
  { name: 'English', code: 'en' },
  { name: 'മലയാളം', code: 'ml' },
  { name: 'తెలుగు', code: 'te' },
  { name: 'हिन्दी', code: 'hi' },
  { name: 'বাংলা', code: 'bn' },
  { name: 'मराठी', code: 'mr' },
  { name: 'ಕನ್ನಡ', code: 'kn' },
  { name: 'ગુજરાતી', code: 'gu' },
  { name: 'ਪੰਜਾਬੀ', code: 'pa' },
  { name: 'اردو', code: 'ur' },
  { name: 'ଓଡ଼ିଆ', code: 'or' },
]

const LanguageContext = createContext(null)

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

export function LanguageProvider({ children }) {
  const [langCode, setLangCode] = useState(() => localStorage.getItem('schemeai_lang_code') || 'en')

  useEffect(() => {
    localStorage.setItem('schemeai_lang_code', langCode)
    document.documentElement.lang = langCode
    // NOTE: intentionally NOT setting document.documentElement.dir = 'rtl' for Urdu.
    // None of this app's layouts are built RTL-aware, so flipping the document
    // direction mirrors the entire page (navbar, buttons, flex order) rather than
    // just the text. Urdu text itself still renders right-to-left correctly at
    // the character level via the Unicode bidi algorithm without this.
  }, [langCode])

  const language = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0]

  // Accepts either a language name ("தமிழ்") or a code ("ta")
  const setLanguage = (nameOrCode) => {
    const match = LANGUAGES.find(l => l.name === nameOrCode || l.code === nameOrCode)
    if (match) setLangCode(match.code)
  }

  // t('hero.title') -> current language -> falls back to English -> falls back to the key itself
  const t = (path, fallback) => {
    const own = getByPath(translations[langCode], path)
    if (own !== undefined) return own
    const en = getByPath(translations.en, path)
    if (en !== undefined) return en
    return fallback !== undefined ? fallback : path
  }

  // tList('features') -> same fallback logic, but guarantees an array back
  const tList = (path) => {
    const own = getByPath(translations[langCode], path)
    if (Array.isArray(own)) return own
    const en = getByPath(translations.en, path)
    return Array.isArray(en) ? en : []
  }

  return (
    <LanguageContext.Provider value={{ language, languageCode: langCode, setLanguage, t, tList, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a <LanguageProvider>')
  return ctx
}