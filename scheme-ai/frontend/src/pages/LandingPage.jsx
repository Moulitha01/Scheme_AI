// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLang } from '../context/LanguageContext'
import { t } from '../translations'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function LandingPage() {
  const navigate = useNavigate()
  const { lang, changeLang, LANGUAGES } = useLang()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1529] to-[#111827] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          <span className="font-bold text-white text-lg">Scheme-AI</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-semibold transition-colors"
          >
            {t(lang, 'login')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-6xl mb-4">🇮🇳</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {t(lang, 'heroTitle')}
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
            {t(lang, 'heroSubtitle')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold text-lg shadow-lg transition-all hover:scale-105"
            >
              {t(lang, 'getStarted')}
            </button>
            <button
              onClick={() => navigate('/elderly')}
              className="px-8 py-3 border-2 border-orange-400 text-orange-400 rounded-full font-semibold text-lg hover:bg-orange-500/10 transition-all"
            >
              🎙️ Voice Mode
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Language Picker Section ── */}
      <section className="px-6 py-16 bg-[#0d1529]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-3">
              🌐 {t(lang, 'chooseLanguage')}
            </h2>
            <p className="text-gray-400 mb-10 text-lg">{t(lang, 'languageSubtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {LANGUAGES.map((l, i) => (
              <motion.button
                key={l.code}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                onClick={() => changeLang(l.code)}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all hover:scale-105 cursor-pointer
                  ${lang === l.code
                    ? 'border-orange-500 bg-orange-500/10 shadow-lg'
                    : 'border-white/10 bg-white/5 hover:border-orange-300 hover:bg-orange-500/10'
                  }`}
              >
                <span className="text-3xl">{l.flag}</span>
                <span className={`font-semibold text-sm ${lang === l.code ? 'text-orange-400' : 'text-gray-300'}`}>
                  {l.label}
                </span>
                {lang === l.code && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">✓</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-[#0a0f1e]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">{t(lang, 'featuresTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: '🎙️', title: t(lang, 'feature1Title'), desc: t(lang, 'feature1Desc') },
              { emoji: '🤖', title: t(lang, 'feature2Title'), desc: t(lang, 'feature2Desc') },
              { emoji: '🌐', title: t(lang, 'feature3Title'), desc: t(lang, 'feature3Desc') },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
              >
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-12 bg-gradient-to-r from-orange-500 to-green-600 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">{t(lang, 'getStarted')} →</h2>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-white text-orange-600 rounded-full font-bold text-lg hover:scale-105 transition-all"
        >
          {t(lang, 'login')}
        </button>
      </section>
    </div>
  )
}