// src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

/* ── Language config ─────────────────────────────────────── */
const LANGS = {
  English: { code: 'en-IN', color: '#FFAA00', placeholder: 'Type your message...', typing: 'Finding schemes...' },
  'हिन्दी': { code: 'hi-IN', color: '#FF6B00', placeholder: 'अपना संदेश लिखें...', typing: 'योजनाएँ खोज रहे हैं...' },
  'தமிழ்': { code: 'ta-IN', color: '#FF3D71', placeholder: 'உங்கள் செய்தியை டைப் செய்யவும்...', typing: 'திட்டங்கள் தேடுகிறோம்...' },
  'తెలుగు': { code: 'te-IN', color: '#00D68F', placeholder: 'మీ సందేశాన్ని టైప్ చేయండి...', typing: 'పథకాలు వెతుకుతున్నాం...' },
  'বাংলা': { code: 'bn-IN', color: '#0095FF', placeholder: 'আপনার বার্তা লিখুন...', typing: 'প্রকল্প খুঁজছি...' },
  'मराठी': { code: 'mr-IN', color: '#FF6B00', placeholder: 'तुमचा संदेश टाइप करा...', typing: 'योजना शोधत आहे...' },
  'ಕನ್ನಡ': { code: 'kn-IN', color: '#00D68F', placeholder: 'ನಿಮ್ಮ ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...', typing: 'ಯೋಜನೆಗಳು ಹುಡುಕುತ್ತಿದ್ದೇವೆ...' },
}

const CAT = {
  Agriculture:     { icon: '🌾', color: '#00D68F' },
  Health:          { icon: '🏥', color: '#FF3D71' },
  Education:       { icon: '📚', color: '#0095FF' },
  Housing:         { icon: '🏠', color: '#FFAA00' },
  Finance:         { icon: '💳', color: '#8B5CF6' },
  Employment:      { icon: '👷', color: '#00D68F' },
  'Women & Child': { icon: '👩', color: '#FF3D71' },
  default:         { icon: '📋', color: '#FF6B00' },
}

function speak(text, code) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = code; u.rate = 0.88
  window.speechSynthesis.speak(u)
}

/* ── Scheme Card ─────────────────────────────────────────── */
function SchemeCard({ scheme, index }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CAT[scheme.category] || CAT.default
  const score = scheme.eligibility || 40

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl overflow-hidden border"
      style={{ background: `${cat.color}08`, borderColor: `${cat.color}25` }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${cat.color}20` }}>
            {cat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-white text-sm leading-tight">{scheme.name}</h4>
              <span className="flex-shrink-0 text-xs font-black px-2 py-0.5 rounded-full"
                style={{
                  background: score >= 70 ? '#00D68F20' : score >= 55 ? '#FFAA0020' : '#FF6B0020',
                  color: score >= 70 ? '#00D68F' : score >= 55 ? '#FFAA00' : '#FF6B00',
                  border: `1px solid ${score >= 70 ? '#00D68F40' : score >= 55 ? '#FFAA0040' : '#FF6B0040'}`,
                }}>
                {score}%
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: cat.color }}>{scheme.ministry}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span>💰</span>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Benefit</p>
            <p className="text-xs font-bold text-white">{scheme.benefit}</p>
          </div>
        </div>

        {scheme.reason && (
          <p className="text-xs text-gray-500 mt-2 italic">"{scheme.reason}"</p>
        )}
      </div>

      {/* Expand */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-500 hover:text-white transition-colors">
          <span>How to Apply</span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }}>▼</motion.span>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-3 space-y-1.5">
              {['Verify eligibility documents', 'Fill the application form', 'Submit at official portal'].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: `${cat.color}20`, color: cat.color }}>{i + 1}</span>
                  {s}
                </div>
              ))}
              {scheme.applyLink && (
                <a href={scheme.applyLink} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs underline mt-1"
                  style={{ color: cat.color }}>
                  🔗 Official Portal →
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        {scheme.applyLink && (
          <a href={scheme.applyLink} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-bold border transition-all"
            style={{ borderColor: `${cat.color}40`, color: cat.color, background: `${cat.color}10` }}>
            🌐 Apply Online
          </a>
        )}
        <button className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all"
          style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}99)` }}>
          📝 Fill Form
        </button>
      </div>
    </motion.div>
  )
}

/* ── Message bubble ──────────────────────────────────────── */
function Message({ msg, langColor }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
          style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)' }}>
          🏛️
        </div>
      )}
      <div className="max-w-[75%]">
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'text-white rounded-br-sm'
            : 'text-gray-100 rounded-bl-sm'
        }`}
          style={{
            background: isUser
              ? `linear-gradient(135deg, ${langColor}, ${langColor}CC)`
              : 'rgba(255,255,255,0.07)',
            border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
          }}>
          {msg.content}
        </div>

        {/* Scheme cards below AI message */}
        {!isUser && msg.schemes && msg.schemes.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500 px-1">
              🎯 {msg.schemes.length} scheme{msg.schemes.length > 1 ? 's' : ''} found
            </p>
            {msg.schemes.map((s, i) => (
              <SchemeCard key={i} scheme={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Main ChatPage ───────────────────────────────────────── */
export default function ChatPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('schemeai_lang_name') || 'Tamil')
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([
    { id: 'init', role: 'ai', content: 'Hello! Tell me your name, age, occupation and state — I\'ll find the best government schemes for you.', schemes: [] }
  ])
  const [showLangPicker, setShowLangPicker] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  const langKey = Object.keys(LANGS).find(k => LANGS[k].code.startsWith(selectedLang.slice(0, 2))) || 'English'
  const L = LANGS[langKey] || LANGS.English

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    setInput('')
    const userMsg = { id: Date.now(), role: 'user', content: text, schemes: [] }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const { data } = await axios.post('/api/chat/message', {
        message: text,
        language: langKey,
        sessionId,
      })
      setSessionId(data.sessionId)
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: data.reply || 'I found some schemes for you!',
        schemes: data.schemes || [],
      }
      setMessages(prev => [...prev, aiMsg])
      if (data.schemes?.length > 0) {
        speak(data.reply, L.code)
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'ai',
        content: 'Sorry, something went wrong. Please try again.',
        schemes: [],
      }])
    } finally { setLoading(false) }
  }

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const r = new SR()
    r.lang = L.code
    r.interimResults = false
    r.onresult = e => {
      const text = e.results[0][0].transcript
      sendMessage(text)
    }
    r.onstart = () => setRecording(true)
    r.onend = () => setRecording(false)
    recognitionRef.current = r
    r.start()
  }

  const newChat = () => {
    setMessages([{ id: 'init', role: 'ai', content: 'Hello! Tell me your name, age, occupation and state.', schemes: [] }])
    setSessionId(null)
  }

  return (
    <div className="h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #080d1a 0%, #0a1020 50%, #0d1528 100%)',
    }}>
      {/* Tricolor top */}
      <div className="h-0.5 w-full flex flex-shrink-0">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white opacity-60" />
        <div className="flex-1 bg-green-600" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,13,26,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="text-gray-500 hover:text-white transition-colors text-sm">←</button>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)' }}>🏛️</div>
          <div>
            <h1 className="font-black text-white text-base leading-none">
              Scheme<span style={{ color: '#FF6B00' }}>-AI</span>
            </h1>
            <p className="text-[10px] text-gray-500">Welfare Navigator</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {['Talk to AI', 'Browse Schemes', 'Upload ID', 'Dashboard'].map((tab, i) => (
            <button key={tab}
              onClick={() => i === 0 ? null : navigate(i === 1 ? '/schemes' : i === 2 ? '/ocr' : '/dashboard')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: i === 0 ? '#FF6B0020' : 'transparent',
                color: i === 0 ? '#FF6B00' : '#6B7280',
                border: i === 0 ? '1px solid #FF6B0030' : '1px solid transparent',
              }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative">
            <button onClick={() => setShowLangPicker(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
              style={{ borderColor: `${L.color}40`, color: L.color, background: `${L.color}10` }}>
              🌐 {langKey}
            </button>
            <AnimatePresence>
              {showLangPicker && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute right-0 top-10 z-50 grid grid-cols-2 gap-1.5 p-3 rounded-2xl shadow-2xl w-52"
                  style={{ background: '#0d1528', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {Object.entries(LANGS).map(([name, cfg]) => (
                    <button key={name}
                      onClick={() => { setSelectedLang(cfg.code.slice(0, 2)); localStorage.setItem('schemeai_lang_name', name); setShowLangPicker(false) }}
                      className="px-2 py-1.5 rounded-xl text-xs font-bold text-left transition-all"
                      style={{
                        background: langKey === name ? `${cfg.color}20` : 'rgba(255,255,255,0.04)',
                        color: langKey === name ? cfg.color : '#6B7280',
                        border: `1px solid ${langKey === name ? cfg.color + '40' : 'transparent'}`,
                      }}>
                      {name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col p-3 gap-3"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,13,26,0.6)' }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={newChat}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', boxShadow: '0 0 20px rgba(255,107,0,0.3)' }}>
            + New Chat
          </motion.button>

          {/* Recent chats */}
          <div className="flex-1 overflow-y-auto space-y-1">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest px-2 mb-2">Recent</p>
            <div className="px-2 py-2 rounded-xl cursor-pointer"
              style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <p className="text-xs text-orange-400 font-semibold truncate">Current Chat</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{messages.filter(m => m.role === 'user').length} messages</p>
            </div>
          </div>

          {/* Suggested prompts */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest px-1 mb-2">Try saying</p>
            {[
              'I am a 65 year old farmer',
              'I am a 20 year old student',
              'I am a woman with no gas',
              'I need housing help',
            ].map((prompt, i) => (
              <button key={i} onClick={() => sendMessage(prompt)}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all mb-1">
                💬 {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map(msg => (
              <Message key={msg.id} msg={msg} langColor={L.color} />
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)' }}>🏛️</div>
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: L.color }}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                  <span className="text-xs ml-1">{L.typing}</span>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,13,26,0.8)' }}>
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              {/* Voice button */}
              <motion.button whileTap={{ scale: 0.92 }} onClick={handleVoice}
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 transition-all"
                style={{
                  background: recording ? 'rgba(239,68,68,0.2)' : `${L.color}15`,
                  border: `2px solid ${recording ? 'rgba(239,68,68,0.6)' : L.color + '40'}`,
                  boxShadow: recording ? '0 0 20px rgba(239,68,68,0.3)' : 'none',
                }}>
                {recording
                  ? <motion.div className="w-3 h-3 rounded-full bg-red-500"
                      animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
                  : '🎙️'
                }
              </motion.button>

              {/* Text input */}
              <div className="flex-1 flex items-center rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${input ? L.color + '40' : 'rgba(255,255,255,0.1)'}` }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder={L.placeholder}
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-600 outline-none"
                />
                {input && (
                  <button onClick={() => setInput('')}
                    className="px-3 text-gray-600 hover:text-white transition-colors text-lg">×</button>
                )}
              </div>

              {/* Send button */}
              <motion.button whileTap={{ scale: 0.92 }}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all disabled:opacity-30"
                style={{ background: `linear-gradient(135deg, ${L.color}, ${L.color}CC)`, boxShadow: input ? `0 0 20px ${L.color}40` : 'none' }}>
                ➤
              </motion.button>
            </div>

            <p className="text-center text-[10px] text-gray-700 mt-2">
              Press Enter to send • 🎙️ to speak • Groq AI powered
            </p>
          </div>
        </div>
      </div>

      {/* Tricolor bottom */}
      <div className="h-0.5 w-full flex flex-shrink-0">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white opacity-60" />
        <div className="flex-1 bg-green-600" />
      </div>
    </div>
  )
}