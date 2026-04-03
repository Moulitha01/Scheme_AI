// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'

// ── Full language list with proper scripts (no "IN" flag) ────
const LANGUAGES = [
  { code: 'hi-IN', short: 'hi', label: 'हिन्दी',   name: 'Hindi',     color: '#FF6B00' },
  { code: 'ta-IN', short: 'ta', label: 'தமிழ்',    name: 'Tamil',     color: '#FF3D71' },
  { code: 'te-IN', short: 'te', label: 'తెలుగు',   name: 'Telugu',    color: '#00D68F' },
  { code: 'kn-IN', short: 'kn', label: 'ಕನ್ನಡ',   name: 'Kannada',   color: '#0095FF' },
  { code: 'bn-IN', short: 'bn', label: 'বাংলা',    name: 'Bengali',   color: '#FFAA00' },
  { code: 'mr-IN', short: 'mr', label: 'मराठी',    name: 'Marathi',   color: '#FF6B00' },
  { code: 'gu-IN', short: 'gu', label: 'ગુજરાતી', name: 'Gujarati',  color: '#00D68F' },
  { code: 'ml-IN', short: 'ml', label: 'മലയാളം',  name: 'Malayalam', color: '#0095FF' },
  { code: 'en-IN', short: 'en', label: 'English',  name: 'English',   color: '#FFAA00' },
]

const HERO_TEXT = {
  hi: { title: 'आपकी सरकारी योजनाएँ, आसानी से', sub: 'अपनी भाषा में सरकारी लाभ खोजें', start: 'शुरू करें', voice: '🎙️ आवाज़ मोड' },
  ta: { title: 'உங்கள் அரசு திட்டங்கள், எளிமையாக', sub: 'உங்கள் மொழியில் அரசு திட்டங்களை கண்டறியுங்கள்', start: 'தொடங்கு', voice: '🎙️ குரல் முறை' },
  te: { title: 'మీ ప్రభుత్వ పథకాలు, సులభంగా', sub: 'మీ భాషలో ప్రభుత్వ పథకాలను కనుగొనండి', start: 'ప్రారంభించు', voice: '🎙️ వాయిస్ మోడ్' },
  kn: { title: 'ನಿಮ್ಮ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ಸುಲಭವಾಗಿ', sub: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಿ', start: 'ಪ್ರಾರಂಭಿಸಿ', voice: '🎙️ ಧ್ವನಿ ಮೋಡ್' },
  bn: { title: 'আপনার সরকারি প্রকল্প, সহজে', sub: 'আপনার ভাষায় সরকারি সুবিধা খুঁজুন', start: 'শুরু করুন', voice: '🎙️ ভয়েস মোড' },
  mr: { title: 'तुमच्या सरकारी योजना, सहजपणे', sub: 'तुमच्या भाषेत सरकारी योजना शोधा', start: 'सुरू करा', voice: '🎙️ व्हॉइस मोड' },
  gu: { title: 'તમારી સરકારી યોजनाઓ, સરળ રીતે', sub: 'તમારી ભाषामां સरकारी ফायদा শোধ', start: 'શરૂ કરો', voice: '🎙️ વૉઇस মোड' },
  ml: { title: 'നിങ്ങളുടെ സർക്കാർ പദ്ധതികൾ, എളുപ്പത്തിൽ', sub: 'നിങ്ങളുടെ ഭാഷയിൽ ആനുകൂല്യങ്ങൾ കണ്ടെത്തൂ', start: 'തുടങ്ങൂ', voice: '🎙️ വോയ്സ് മോഡ്' },
  en: { title: 'Your Government Schemes, Made Easy', sub: 'Discover welfare schemes in your own language', start: 'Get Started', voice: '🎙️ Voice Mode' },
}

function speak(text, code) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = code; u.rate = 0.88
  window.speechSynthesis.speak(u)
}

export default function LandingPage() {
  const navigate = useNavigate()

  // Read saved language or default to Tamil
  const savedShort = localStorage.getItem('schemeai_lang') || 'ta'
  const [selectedLang, setSelectedLang] = useState(
    LANGUAGES.find(l => l.short === savedShort) || LANGUAGES[1]
  )

  const hero = HERO_TEXT[selectedLang.short] || HERO_TEXT.en

  const changeLang = (lang) => {
    setSelectedLang(lang)
    localStorage.setItem('schemeai_lang', lang.short)
    localStorage.setItem('schemeai_lang_code', lang.code)
    speak(lang.label, lang.code)
  }

  const goVoiceMode = () => {
    // Save language before navigating so ElderlyPage picks it up
    localStorage.setItem('schemeai_lang', selectedLang.short)
    localStorage.setItem('schemeai_lang_code', selectedLang.code)
    navigate('/elderly')
  }

  return (
    <div className="min-h-screen text-white" style={{
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #111827 100%)',
    }}>

      {/* Tricolor top strip */}
      <div className="h-1 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white opacity-70" />
        <div className="flex-1 bg-green-600" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 sticky top-1 z-40"
        style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)' }}>🏛️</div>
          <span className="font-black text-white text-lg">Scheme<span className="text-orange-500">-AI</span></span>
        </div>

        {/* Language pill in navbar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer"
            style={{ background: `${selectedLang.color}20`, border: `1px solid ${selectedLang.color}40` }}
            onClick={() => document.getElementById('lang-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="font-bold text-sm" style={{ color: selectedLang.color }}>{selectedLang.label}</span>
            <span className="text-gray-500 text-xs">▼</span>
          </div>
          <button onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-full text-sm font-bold text-white transition-all"
            style={{ background: '#FF6B00' }}>
            Login
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: selectedLang.color }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-8 blur-3xl bg-green-500" />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative z-10">

          {/* Big language script display */}
          <motion.div
            key={selectedLang.short}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl md:text-8xl font-black mb-4 leading-none"
            style={{ color: selectedLang.color, textShadow: `0 0 60px ${selectedLang.color}40` }}
          >
            {selectedLang.label}
          </motion.div>

          <motion.h1
            key={`h-${selectedLang.short}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight max-w-3xl mx-auto"
          >
            {hero.title}
          </motion.h1>

          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">{hero.sub}</p>

          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-full font-black text-white text-lg shadow-2xl transition-all"
              style={{ background: `linear-gradient(135deg, #FF6B00, #FFAA00)`, boxShadow: '0 0 40px rgba(255,107,0,0.4)' }}>
              {hero.start} →
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }}
              onClick={goVoiceMode}
              className="px-8 py-4 rounded-full font-black text-lg border-2 transition-all"
              style={{ borderColor: selectedLang.color, color: selectedLang.color, background: `${selectedLang.color}10` }}>
              {hero.voice}
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── LANGUAGE PICKER ── */}
      <section id="lang-section" className="px-6 py-16" style={{ background: 'rgba(13,21,41,0.8)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-2">🌐 Choose Your Language</h2>
          <p className="text-gray-400 mb-10">Select your language — the whole app speaks it</p>

          <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
            {LANGUAGES.map((l, i) => (
              <motion.button key={l.short}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => changeLang(l)}
                onMouseEnter={() => speak(l.label, l.code)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all cursor-pointer"
                style={{
                  background: selectedLang.short === l.short ? `${l.color}20` : 'rgba(255,255,255,0.04)',
                  borderColor: selectedLang.short === l.short ? l.color : 'rgba(255,255,255,0.08)',
                  boxShadow: selectedLang.short === l.short ? `0 0 20px ${l.color}30` : 'none',
                }}
              >
                {/* Show actual script — NO "IN" flag */}
                <span className="text-3xl font-black leading-none" style={{
                  color: selectedLang.short === l.short ? l.color : 'white'
                }}>
                  {l.label}
                </span>
                <span className="text-xs font-semibold" style={{
                  color: selectedLang.short === l.short ? l.color : '#6B7280'
                }}>
                  {l.name}
                </span>
                {selectedLang.short === l.short && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: l.color, color: 'white' }}>
                    ✓ Selected
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 py-16" style={{ background: '#0a0f1e' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-12">Why Scheme-AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '🎙️', title: 'Voice First', desc: 'Just speak in your language — no forms, no typing', color: '#FF6B00' },
              { emoji: '🤖', title: 'A2A AI Agents', desc: '6 specialized agents find the best schemes for you', color: '#0095FF' },
              { emoji: '📋', title: 'Auto-fill Forms', desc: 'Scan Aadhaar — application form fills automatically', color: '#00D68F' },
              { emoji: '🌐', title: '9 Languages', desc: 'Hindi, Tamil, Telugu, Kannada, Bengali and more', color: '#FFAA00' },
              { emoji: '🏛️', title: 'Official Sources', desc: 'Data from india.gov.in and myscheme.gov.in', color: '#FF3D71' },
              { emoji: '📥', title: 'Download PDF', desc: 'Get pre-filled application PDF instantly', color: '#00D68F' },
            ].map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-6 border text-left transition-all hover:scale-[1.02]"
                style={{ background: `${f.color}08`, borderColor: `${f.color}20` }}>
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-black text-white text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCHEMES PREVIEW ── */}
      <section className="px-6 py-16" style={{ background: 'rgba(13,21,41,0.9)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-3">14+ Government Schemes</h2>
          <p className="text-gray-400 mb-10">Directly sourced from official government portals</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'PM-KISAN', icon: '🌾', color: '#00D68F', ministry: 'Agriculture' },
              { name: 'PM-JAY', icon: '🏥', color: '#FF3D71', ministry: 'Health' },
              { name: 'MGNREGA', icon: '👷', color: '#FFAA00', ministry: 'Employment' },
              { name: 'PMAY', icon: '🏠', color: '#0095FF', ministry: 'Housing' },
              { name: 'NSP', icon: '📚', color: '#FF6B00', ministry: 'Education' },
              { name: 'Ujjwala', icon: '🔥', color: '#FF3D71', ministry: 'Women & Child' },
              { name: 'MUDRA', icon: '💳', color: '#00D68F', ministry: 'Finance' },
              { name: 'APY', icon: '🏦', color: '#0095FF', ministry: 'Pension' },
            ].map((s, i) => (
              <motion.div key={s.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4 border text-center"
                style={{ background: `${s.color}10`, borderColor: `${s.color}25` }}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="font-bold text-white text-sm">{s.name}</p>
                <p className="text-xs mt-0.5" style={{ color: s.color }}>{s.ministry}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-16 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.15), rgba(19,136,8,0.15))' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(10,15,30,0.5)' }} />
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-4">
            Ready to find your schemes?
          </h2>
          <p className="text-gray-400 mb-8">Just speak in {selectedLang.name} — our AI does the rest</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button whileTap={{ scale: 0.96 }}
              onClick={goVoiceMode}
              className="px-10 py-4 rounded-full font-black text-white text-xl shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', boxShadow: '0 0 40px rgba(255,107,0,0.4)' }}>
              🎙️ {hero.voice}
            </motion.button>
          </div>
        </div>
      </section>

      {/* Tricolor bottom */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white opacity-60" />
        <div className="flex-1 bg-green-600" />
      </div>
    </div>
  )
}