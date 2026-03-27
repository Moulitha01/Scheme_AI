// src/pages/IntroPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const LANGUAGES = [
  { code: 'hi-IN', short: 'hi', label: 'हिन्दी', name: 'Hindi',     color: '#FF6B00', tagline: 'सरकारी योजनाएँ आपकी भाषा में' },
  { code: 'ta-IN', short: 'ta', label: 'தமிழ்', name: 'Tamil',      color: '#FF3D71', tagline: 'அரசு திட்டங்கள் உங்கள் மொழியில்' },
  { code: 'te-IN', short: 'te', label: 'తెలుగు', name: 'Telugu',    color: '#00D68F', tagline: 'ప్రభుత్వ పథకాలు మీ భాషలో' },
  { code: 'kn-IN', short: 'kn', label: 'ಕನ್ನಡ', name: 'Kannada',   color: '#0095FF', tagline: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ' },
  { code: 'bn-IN', short: 'bn', label: 'বাংলা', name: 'Bengali',    color: '#FFAA00', tagline: 'সরকারি প্রকল্প আপনার ভাষায়' },
  { code: 'mr-IN', short: 'mr', label: 'मराठी', name: 'Marathi',    color: '#FF6B00', tagline: 'सरकारी योजना आपल्या भाषेत' },
  { code: 'gu-IN', short: 'gu', label: 'ગુજરાતી', name: 'Gujarati', color: '#00D68F', tagline: 'સરકારી યોજनाઓ તમારી ભાષામાં' },
  { code: 'ml-IN', short: 'ml', label: 'മലയാളം', name: 'Malayalam', color: '#0095FF', tagline: 'സർക്കാർ പദ്ധതികൾ നിങ്ങളുടെ ഭാഷയിൽ' },
  { code: 'en-IN', short: 'en', label: 'English', name: 'English',  color: '#FFAA00', tagline: 'Government schemes in your language' },
]

function speak(text, langCode) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = langCode; u.rate = 0.88; u.pitch = 1.05
  window.speechSynthesis.speak(u)
}

// Animated background mesh
function MeshBackground({ color }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 20% 50%, ${color}15 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 20%, ${color}10 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 80%, #ffffff08 0%, transparent 40%)`,
        transition: 'background 0.8s ease',
      }} />
      {/* Floating orbs */}
      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full opacity-10"
          style={{
            width: 80 + i * 40,
            height: 80 + i * 40,
            background: color,
            left: `${10 + i * 15}%`,
            top: `${15 + (i % 3) * 25}%`,
            filter: 'blur(40px)',
          }}
          animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
  )
}

export default function IntroPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('splash') // splash | pick | choose
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [cycleIdx, setCycleIdx] = useState(0)
  const splashTimer = useRef(null)

  const currentColor = selected
    ? LANGUAGES.find(l => l.short === selected)?.color
    : LANGUAGES[cycleIdx]?.color || '#FF6B00'

  // Auto-advance splash after 2.5s
  useEffect(() => {
    splashTimer.current = setTimeout(() => setPhase('pick'), 2500)
    return () => clearTimeout(splashTimer.current)
  }, [])

  // Cycle languages on splash
  useEffect(() => {
    if (phase !== 'splash') return
    const t = setInterval(() => setCycleIdx(i => (i + 1) % LANGUAGES.length), 280)
    return () => clearInterval(t)
  }, [phase])

  const handleSelect = (lang) => {
    setSelected(lang.short)
    localStorage.setItem('schemeai_lang', lang.short)
    localStorage.setItem('schemeai_lang_code', lang.code)
    speak(lang.tagline, lang.code)
    setPhase('choose')
  }

  const handleUserType = (type, lang) => {
    localStorage.setItem('schemeai_lang', lang.short)
    setTimeout(() => navigate(type === 'voice' ? '/elderly' : '/home'), 300)
  }

  const currentLang = LANGUAGES.find(l => l.short === selected)

  return (
    <div className="min-h-screen overflow-hidden relative" style={{
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 40%, #111827 100%)',
    }}>
      <MeshBackground color={currentColor} />

      {/* Tricolor top strip */}
      <div className="h-1 w-full flex">
        <div className="flex-1" style={{ background: '#FF6B00' }} />
        <div className="flex-1 bg-white opacity-80" />
        <div className="flex-1" style={{ background: '#138808' }} />
      </div>

      <AnimatePresence mode="wait">

        {/* ── SPLASH ── */}
        {phase === 'splash' && (
          <motion.div key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10"
            onClick={() => { clearTimeout(splashTimer.current); setPhase('pick') }}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl mb-8 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', boxShadow: '0 0 60px #FF6B0040' }}
            >
              🏛️
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-black text-white mb-3 tracking-tight"
              style={{ textShadow: '0 0 40px #FF6B0040' }}
            >
              Scheme<span style={{ color: '#FF6B00' }}>-AI</span>
            </motion.h1>

            {/* Cycling language text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="h-12 flex items-center justify-center overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.p key={cycleIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-xl font-bold"
                  style={{ color: LANGUAGES[cycleIdx].color }}
                >
                  {LANGUAGES[cycleIdx].label}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-400 text-sm mt-4"
            >
              India's AI welfare navigator • 9 languages
            </motion.p>

            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-12 text-gray-600 text-xs"
            >
              tap to continue
            </motion.div>
          </motion.div>
        )}

        {/* ── LANGUAGE PICKER ── */}
        {phase === 'pick' && (
          <motion.div key="pick"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="min-h-screen flex flex-col relative z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)' }}>🏛️</div>
                <span className="font-black text-white">Scheme<span style={{ color: '#FF6B00' }}>-AI</span></span>
              </div>
              <div className="text-xs text-gray-500">Choose your language</div>
            </div>

            {/* Title */}
            <div className="text-center px-5 pt-4 pb-6">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                🌐 Choose Your Language
              </h2>
              <p className="text-gray-400 text-sm">Hover to hear • Select to continue</p>
            </div>

            {/* Language grid */}
            <div className="flex-1 px-4 pb-8">
              <div className="grid grid-cols-3 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {LANGUAGES.map((lang, i) => (
                  <motion.button
                    key={lang.short}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', damping: 15 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => { setHovered(lang.short); speak(lang.tagline, lang.code) }}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleSelect(lang)}
                    className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden"
                    style={{
                      background: hovered === lang.short
                        ? `${lang.color}20`
                        : 'rgba(255,255,255,0.04)',
                      borderColor: hovered === lang.short ? lang.color : 'rgba(255,255,255,0.08)',
                      boxShadow: hovered === lang.short ? `0 0 20px ${lang.color}30` : 'none',
                    }}
                  >
                    {/* Audio wave on hover */}
                    {hovered === lang.short && (
                      <div className="absolute top-2 right-2 flex items-end gap-0.5 h-3">
                        {[1,2,3,2,1].map((h, i) => (
                          <motion.div key={i}
                            className="w-0.5 rounded-full"
                            style={{ background: lang.color }}
                            animate={{ height: [h * 3, h * 8, h * 3] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                          />
                        ))}
                      </div>
                    )}

                    <span className="text-2xl md:text-3xl font-black text-white leading-none">
                      {lang.label}
                    </span>
                    <span className="text-xs font-medium" style={{ color: lang.color }}>
                      {lang.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── USER TYPE CHOOSER ── */}
        {phase === 'choose' && currentLang && (
          <motion.div key="choose"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10"
          >
            {/* Selected badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border mb-10"
              style={{
                background: `${currentLang.color}15`,
                borderColor: `${currentLang.color}40`,
                boxShadow: `0 0 30px ${currentLang.color}20`,
              }}
            >
              <span className="text-2xl font-black" style={{ color: currentLang.color }}>
                {currentLang.label}
              </span>
              <span className="text-white font-semibold">{currentLang.name} selected</span>
              <button onClick={() => setPhase('pick')}
                className="text-gray-500 hover:text-white text-xs underline ml-2 transition-colors">
                Change
              </button>
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-2">
              Who are you?
            </h2>
            <p className="text-gray-400 text-sm text-center mb-10">
              {currentLang.tagline}
            </p>

            <div className="w-full max-w-md space-y-4">

              {/* Voice / Elderly */}
              <motion.button
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUserType('voice', currentLang)}
                onMouseEnter={() => speak(currentLang.tagline, currentLang.code)}
                className="w-full p-6 rounded-3xl border-2 text-left transition-all group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,107,0,0.15), rgba(255,107,0,0.05))',
                  borderColor: 'rgba(255,107,0,0.4)',
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.2), transparent)' }} />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: 'rgba(255,107,0,0.2)', border: '1px solid rgba(255,107,0,0.4)' }}>
                    🎙️
                  </div>
                  <div>
                    <p className="font-black text-white text-xl">Voice Mode</p>
                    <p className="text-orange-400 text-sm font-semibold">Speak — no typing needed</p>
                    <p className="text-gray-500 text-xs mt-1">{currentLang.tagline}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)' }}>
                      👴👵 Elderly
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Literate / Chat */}
              <motion.button
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUserType('literate', currentLang)}
                className="w-full p-6 rounded-3xl border-2 text-left transition-all group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,214,143,0.15), rgba(0,214,143,0.05))',
                  borderColor: 'rgba(0,214,143,0.4)',
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, rgba(0,214,143,0.2), transparent)' }} />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: 'rgba(0,214,143,0.2)', border: '1px solid rgba(0,214,143,0.4)' }}>
                    💬
                  </div>
                  <div>
                    <p className="font-black text-white text-xl">Chat Mode</p>
                    <p className="font-semibold text-sm" style={{ color: '#00D68F' }}>Type & explore schemes</p>
                    <p className="text-gray-500 text-xs mt-1">For literate users who prefer typing</p>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Helper note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 px-5 py-3 rounded-2xl text-center max-w-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-xs text-gray-400">
                📞 <span className="text-white font-semibold">Need help?</span> Give your phone to a family member or Gram Panchayat officer
              </p>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Tricolor bottom strip */}
      <div className="fixed bottom-0 left-0 right-0 h-1 flex z-50">
        <div className="flex-1" style={{ background: '#FF6B00' }} />
        <div className="flex-1 bg-white opacity-60" />
        <div className="flex-1" style={{ background: '#138808' }} />
      </div>
    </div>
  )
}