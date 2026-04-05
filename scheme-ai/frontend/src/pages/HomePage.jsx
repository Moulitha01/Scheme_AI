import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'

const STATS = [
  { num: '1,000+', label: 'Welfare Schemes' },
  { num: '500M+', label: 'Citizens Targeted' },
  { num: '22+', label: 'Indian Languages' },
  { num: '30s', label: 'Avg. Time to Apply' },
]

const FEATURES = [
  {
    icon: '🎙️',
    color: 'from-[#FF8A00]/20 to-[#FF8A00]/6',
    border: 'hover:border-[#FF8A00]/40',
    tag: 'Pillar 1',
    title: 'Voice-First Intake',
    desc: 'Speak your life situation in any Indian language. AI silently extracts your eligibility profile — zero forms, zero dropdowns, zero literacy required.',
  },
  {
    icon: '🔍',
    color: 'from-[#22c55e]/20 to-[#16a34a]/6',
    border: 'hover:border-[#16a34a]/40',
    tag: 'Pillar 2',
    title: 'Live RAG Scheme Match',
    desc: 'LangChain + ChromaDB retrieves real-time govt. gazette PDFs. Each match shows eligibility score with plain-language reason — no legal jargon.',
  },
  {
    icon: '📄',
    color: 'from-[#F59E0B]/20 to-[#D97706]/6',
    border: 'hover:border-[#D97706]/40',
    tag: 'Pillar 3',
    title: 'Aadhaar OCR Auto-Fill',
    desc: 'Upload your Aadhaar / Voter ID photo. Tesseract.js extracts Name, DOB, Address and auto-populates all govt. PDF forms — eliminates #1 rejection cause.',
  },
  {
    icon: '✍️',
    color: 'from-[#2DD4BF]/20 to-[#14B8A6]/6',
    border: 'hover:border-[#14B8A6]/40',
    tag: 'Pillar 4',
    title: 'Signature Highlighter',
    desc: 'AI marks exactly where to sign or thumbprint on every form — zero confusion for first-time applicants navigating complex paperwork.',
  },
  {
    icon: '🤖',
    color: 'from-[#7C3AED]/20 to-[#6D28D9]/6',
    border: 'hover:border-[#7C3AED]/40',
    tag: 'Innovation',
    title: 'Emotional AI',
    desc: "Claude's 5th prompt layer detects confusion or frustration in real-time and auto-simplifies the response. No other govt. tool does this.",
  },
  {
    icon: '🤝',
    color: 'from-[#3B82F6]/20 to-[#2563EB]/6',
    border: 'hover:border-[#2563EB]/40',
    tag: 'V2 Feature',
    title: 'Caregiver Mode',
    desc: 'NGO workers or family members can co-navigate on behalf of elderly or illiterate citizens — critical for last-mile trust and reach.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'You Speak, We Listen',
    desc: 'Tell the AI your situation in your language — Tamil, Hindi, Bengali, Telugu and 18 more. Web Speech API + Whisper ASR transcribes your voice.',
    detail: 'Whisper ASR · 22+ languages · Real-time',
    color: 'text-[#FF8A00] border-[#FF8A00]/40',
  },
  {
    step: '02',
    title: 'AI Builds Your Profile',
    desc: "Claude's 5-layer prompt chain silently extracts age, income, state, caste, occupation and life events from natural conversation — no forms.",
    detail: 'Claude Sonnet · Profile Extract · Zero Forms',
    color: 'text-[#F59E0B] border-[#F59E0B]/40',
  },
  {
    step: '03',
    title: 'Schemes Are Matched',
    desc: 'RAG engine retrieves top-20 matching schemes from 500k+ govt. gazette vectors in ChromaDB using HuggingFace embeddings.',
    detail: 'LangChain RAG · ChromaDB · Live Data',
    color: 'text-[#22c55e] border-[#22c55e]/40',
  },
  {
    step: '04',
    title: 'Forms Are Auto-Filled',
    desc: 'Upload any ID document — Tesseract.js extracts your data and PDFLib auto-injects it into official government application forms.',
    detail: 'Tesseract.js · PDFLib · Google Vision',
    color: 'text-[#2DD4BF] border-[#2DD4BF]/40',
  },
  {
    step: '05',
    title: 'Share in 30 Seconds',
    desc: 'Pre-filled form is ready to share via WhatsApp or download. For villages with no internet, an SMS fallback delivers the roadmap.',
    detail: 'WhatsApp Share · SMS Fallback · Offline PWA',
    color: 'text-[#60A5FA] border-[#60A5FA]/40',
  },
]

const LANGUAGES = [
  { name: 'हिन्दी', romanized: 'Hindi' },
  { name: 'বাংলা', romanized: 'Bengali' },
  { name: 'తెలుగు', romanized: 'Telugu' },
  { name: 'मराठी', romanized: 'Marathi' },
  { name: 'தமிழ்', romanized: 'Tamil' },
  { name: 'ગુજરાતી', romanized: 'Gujarati' },
  { name: 'ಕನ್ನಡ', romanized: 'Kannada' },
  { name: 'ଓଡ଼ିଆ', romanized: 'Odia' },
  { name: 'ਪੰਜਾਬੀ', romanized: 'Punjabi' },
  { name: 'മലയാളം', romanized: 'Malayalam' },
  { name: 'অসমীয়া', romanized: 'Assamese' },
  { name: 'English', romanized: 'English' },
  { name: 'Bhojpuri', romanized: 'Bhojpuri' },
  { name: 'Maithili', romanized: 'Maithili' },
  { name: 'Sindhi', romanized: 'Sindhi' },
  { name: 'Konkani', romanized: 'Konkani' },
  { name: 'Nepali', romanized: 'Nepali' },
  { name: 'Dogri', romanized: 'Dogri' },
  { name: 'Kashmiri', romanized: 'Kashmiri' },
  { name: 'Santhali', romanized: 'Santhali' },
  { name: 'Manipuri', romanized: 'Meitei' },
  { name: 'Tulu', romanized: 'Tulu' },
  { name: 'Rajasthani', romanized: 'Rajasthani' },
]

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  return (
    <div className="pt-16 bg-[#071022] text-[#E6EEF6] min-h-screen">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 py-28 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#FF8A00]/8 blur-[80px] -top-32 -left-32 animate-float" />
          <div className="absolute w-[420px] h-[420px] rounded-full bg-[#22c55e]/6 blur-[70px] top-48 -right-20" style={{ animationDelay: '2s', animation: 'float 8s ease-in-out infinite' }} />
          <div className="absolute w-[320px] h-[320px] rounded-full bg-[#2DD4BF]/6 blur-[70px] bottom-20 left-1/3" style={{ animationDelay: '4s', animation: 'float 7s ease-in-out infinite' }} />
          <div className="absolute w-[700px] h-[700px] rounded-full border border-[#FF8A00]/6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 chakra-spin" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-[#22c55e]/6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'chakraSpin 15s linear infinite reverse' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 bg-[#0f1724]/60 border border-[#FF8A00]/20 text-[#FFB86B] text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-7 relative z-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00] animate-pulse" />
          Generative AI · Social Impact · HackNova 3.0
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[clamp(34px,6vw,72px)] font-extrabold leading-[1.02] tracking-[-1px] text-center max-w-[880px] relative z-10"
        >
          Every Indian Deserves<br />
          Their{' '}
          <span className="text-[#FF8A00]">Welfare Rights</span>.<br />
          <span className="text-[#22c55e]">In Their Language.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[15px] text-[#9FB3C8] text-center max-w-[560px] leading-relaxed mt-5 relative z-10"
        >
          Voice-first AI agent that helps rural citizens discover, understand & apply for 1,000+ government welfare schemes — with zero forms, zero office visits, zero literacy barriers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-3 mt-9 flex-wrap justify-center relative z-10"
        >
          <Link to="/chat" className="rounded-full px-7 py-3.5 text-sm font-semibold bg-gradient-to-br from-[#FF8A00] to-[#FFB86B] text-black shadow-[0_8px_40px_rgba(255,138,0,0.18)] focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/30">
            🎙️ Start Conversation
          </Link>
          <Link to="/schemes" className="rounded-full px-7 py-3.5 text-sm font-semibold border border-[#2DD4BF] text-[#2DD4BF] bg-transparent hover:bg-[#0f1724]/60">
            📋 Browse 1,000+ Schemes
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex gap-10 md:gap-16 mt-16 flex-wrap justify-center relative z-10"
        >
          {STATS.map(({ num, label }, i) => (
            <div key={i} className="text-center">
              <div className="text-[28px] md:text-[34px] font-extrabold tracking-tight">
                {num.includes('+') ? (
                  <>{num.replace('+', '')}<span className="text-[#FF8A00]">+</span></>
                ) : (
                  <>{num}</>
                )}
              </div>
              <div className="text-[11px] text-[#9FB3C8] uppercase tracking-[0.1em] mt-1 font-semibold">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-5 md:px-10 py-24 max-w-6xl mx-auto">
        <FadeIn className="text-center max-w-xl mx-auto mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#9FB3C8]">Core Pillars</div>
          <h2 className="text-3xl font-extrabold mb-3">
            Built for <span className="text-[#FF8A00]">Bharat</span>, Not Browsers
          </h2>
          <p className="text-[#9FB3C8]">Three pillars that eliminate every barrier between citizens and their rights.</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className={`p-7 h-full transition-all duration-300 cursor-default rounded-lg bg-[#0f1724]/80 border border-[#122033]/40 backdrop-blur-sm ${f.border} hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)]`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-5 border border-white/5`}>
                  {f.icon}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FFB86B] mb-2">{f.tag}</div>
                <h3 className="text-base font-bold mb-2.5 tracking-tight">{f.title}</h3>
                <p className="text-[13px] text-[#9FB3C8] leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 md:px-10 py-24 max-w-3xl mx-auto">
        <FadeIn className="mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#9FB3C8]">The Flow</div>
          <h2 className="text-3xl font-extrabold mb-3">
            From Voice to <span className="text-[#FF8A00]">Pre-Filled Form</span>
          </h2>
          <p className="text-[#9FB3C8] max-w-lg">A seamless 5-step journey — under 30 seconds from speaking to a ready-to-submit application.</p>
        </FadeIn>

        <div className="relative">
          <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-[#FF8A00]/40 via-[#F59E0B]/30 to-[#2DD4BF]/40" />
          {HOW_IT_WORKS.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1} className="relative flex gap-7 mb-12 last:mb-0">
              <div className={`relative z-10 w-14 h-14 rounded-full border-2 ${s.color} bg-[#071022] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0`}>
                {s.step}
              </div>
              <div className="pt-2 flex-1">
                <h3 className="text-lg font-bold tracking-tight mb-2">{s.title}</h3>
                <p className="text-[13px] text-[#9FB3C8] leading-relaxed mb-3">{s.desc}</p>
                <div className="inline-flex items-center gap-2 bg-[#0b1220]/70 border border-[#122033]/40 rounded-lg px-3 py-1.5 text-[11px] font-mono text-[#9FB3C8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00]/60" />
                  {s.detail}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── LANGUAGE SUPPORT ── */}
      <section className="px-5 py-20 text-center">
        <FadeIn>
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#9FB3C8]">Multilingual</div>
          <h2 className="text-3xl font-extrabold mb-3">
            Speak in <span className="text-[#FF8A00]">Your Language</span>
          </h2>
          <p className="text-[#9FB3C8] max-w-lg mx-auto mb-10">
            From Kanyakumari to Kashmir — every citizen deserves to be heard in their mother tongue.
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
            {LANGUAGES.map(({ name, romanized }, i) => (
              <div
                key={i}
                className="px-5 py-2.5 text-sm font-semibold hover:border-[#FF8A00]/40 hover:text-[#FF8A00] transition-all duration-200 cursor-default rounded-lg bg-[#0f1724]/70 border border-[#122033]/40"
              >
                {name}
                <span className="text-[10px] text-[#9FB3C8] ml-1.5">({romanized})</span>
              </div>
            ))}
            <div className="px-5 py-2.5 text-sm font-semibold text-[#9FB3C8] border-dashed rounded-lg bg-[#071022]/60">
              + more regional languages
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── IMPACT ── */}
      <section className="px-5 md:px-10 py-24 max-w-5xl mx-auto">
        <FadeIn className="text-center max-w-xl mx-auto mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#9FB3C8]">Impact Vision</div>
          <h2 className="text-3xl font-extrabold mb-3">
            Unlocking <span className="text-[#FF8A00]">₹ Lakh Crore</span> in Welfare
          </h2>
          <p className="text-[#9FB3C8]">Significant welfare funds go unclaimed annually due to information & access barriers. We're here to change that.</p>
        </FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '500M+', label: 'Underserved Indians Targeted', color: 'text-[#FF8A00]' },
            { num: '1,000+', label: 'Central & State Schemes', color: 'text-[#F59E0B]' },
            { num: '28', label: 'States to Scale Across', color: 'text-[#22c55e]' },
            { num: '₹ Lakh Cr', label: 'Annual Unclaimed Benefits', color: 'text-[#2DD4BF]' },
          ].map(({ num, label, color }, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="p-6 text-center rounded-lg bg-[#0f1724]/80 border border-[#122033]/40 hover:-translate-y-1 transition-transform duration-300">
                <div className={`text-[28px] md:text-[32px] font-extrabold tracking-tight ${color} mb-2`}>{num}</div>
                <div className="text-[11px] text-[#9FB3C8] leading-snug">{label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-5 py-20 max-w-3xl mx-auto text-center">
        <FadeIn>
          <div className="p-10 md:p-14 relative overflow-hidden rounded-lg border border-[#FF8A00]/20 bg-gradient-to-br from-[#071022]/60 to-transparent">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF8A00]/6 to-transparent" />
            <div className="relative z-10">
              <div className="text-4xl mb-4">🇮🇳</div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
                Ready to Discover Your Welfare Rights?
              </h2>
              <p className="text-[#9FB3C8] text-sm mb-8 max-w-md mx-auto leading-relaxed">
                Just speak. Scheme-AI does the rest — matching, filling, and guiding you to what's rightfully yours.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link to="/chat" className="px-8 py-3.5 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FFB86B] text-black shadow-[0_0_40px_rgba(255,138,0,0.25)]">
                  🎙️ Talk to Scheme-AI Now
                </Link>
                <Link to="/ocr" className="px-8 py-3.5 rounded-full border border-[#2DD4BF] text-[#2DD4BF]">
                  📤 Upload Aadhaar ID
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#122033]/40 px-5 md:px-10 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF8A00] to-[#F59E0B] flex items-center justify-center text-sm">🇮🇳</div>
          <div>
            <div className="text-sm font-bold">Scheme<span className="text-[#FF8A00]">-AI</span></div>
            <div className="text-[10px] text-[#9FB3C8]">Built at HackNova 3.0 · Jaya Engineering College</div>
          </div>
        </div>
        <div className="text-[11px] text-[#9FB3C8] text-center">
          Team: Dilli Basker M · Moulitha C · Mohan B · Jothika J
        </div>
        <div className="text-[11px] text-[#9FB3C8]">
          Powered by Groq · LangChain · MongoDB · Vite ·chromadb
        </div>
      </footer>
      <div className="h-[3px] bg-gradient-to-r from-[#FF8A00] via-[#22c55e] to-[#2DD4BF]" />
    </div>
  )
}
