// src/components/LanguageSwitcher.jsx
import { useState } from 'react'
import { useLang } from '../context/LanguageContext'

export default function LanguageSwitcher({ className = '' }) {
  const { lang, changeLang, LANGUAGES } = useLang()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find((l) => l.code === lang)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-all shadow-sm"
      >
        <span>{current?.flag}</span>
        <span>{current?.label}</span>
        <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { changeLang(l.code); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors
                ${lang === l.code ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700'}`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && <span className="ml-auto text-orange-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}