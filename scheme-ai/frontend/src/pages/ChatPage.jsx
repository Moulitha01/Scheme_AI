// frontend/src/pages/ChatPage.jsx

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useLanguage } from '../context/LanguageContext'

/* ── Voice / theming config ─────────────────────────────── */
const VOICE_CONFIG = {
  en: { code: 'en-IN', color: '#FF9D00' },
  hi: { code: 'hi-IN', color: '#FF9D00' },
  ta: { code: 'ta-IN', color: '#5B5FEF' },
  te: { code: 'te-IN', color: '#4C8BF5' },
  bn: { code: 'bn-IN', color: '#5B5FEF' },
  mr: { code: 'mr-IN', color: '#FF9D00' },
  kn: { code: 'kn-IN', color: '#4C8BF5' },
  gu: { code: 'gu-IN', color: '#8B5CF6' },
  ml: { code: 'ml-IN', color: '#4C8BF5' },
  pa: { code: 'pa-IN', color: '#FF7A00' },
  ur: { code: 'ur-IN', color: '#5B5FEF' },
  or: { code: 'or-IN', color: '#FF8A00' },
}

const CAT = {
  Agriculture: { icon: '🌾', color: '#22A06B' },
  Health: { icon: '🏥', color: '#E05252' },
  Education: { icon: '📚', color: '#4C6FFF' },
  Housing: { icon: '🏠', color: '#FF9D00' },
  Finance: { icon: '💳', color: '#805AD5' },
  Employment: { icon: '👷', color: '#22A06B' },
  'Women & Child': { icon: '👩', color: '#E05252' },
  Disability: { icon: '♿', color: '#4C6FFF' },
  default: { icon: '📋', color: '#FF8A00' },
}

function speak(text, code) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const u = new SpeechSynthesisUtterance(text)
  u.lang = code
  u.rate = 0.88

  window.speechSynthesis.speak(u)
}

/* ── Scheme Card ─────────────────────────────────────────── */
function SchemeCard({ scheme, index, isState = false, t }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CAT[scheme.category] || CAT.default
  const score = scheme.eligibility || 40

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        background: 'rgba(255,255,255,0.97)',
        border: `1px solid ${
          isState ? 'rgba(58, 190, 120, 0.35)' : 'rgba(255,255,255,0.8)'
        }`,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(25, 30, 100, 0.08)',
      }}
    >
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              background: `${cat.color}15`,
              border: `1px solid ${cat.color}20`,
            }}
          >
            {cat.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#171942',
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {scheme.name}
              </h4>

              <span
                style={{
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background:
                    score >= 70
                      ? '#e9f9ef'
                      : score >= 55
                      ? '#fff7e8'
                      : '#fff1e8',
                  color:
                    score >= 70
                      ? '#168348'
                      : score >= 55
                      ? '#A66A00'
                      : '#A65300',
                  border: `1px solid ${
                    score >= 70
                      ? '#a4dfba'
                      : score >= 55
                      ? '#f0d18c'
                      : '#ffd0aa'
                  }`,
                }}
              >
                {score}%
              </span>
            </div>

            <p
              style={{
                fontSize: 12,
                color: cat.color,
                marginTop: 3,
                marginBottom: 0,
              }}
            >
              {scheme.ministry}
            </p>
          </div>
        </div>

        {scheme.benefit && scheme.benefit !== 'See official portal' && (
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 12,
              background: '#f8f9ff',
              border: '1px solid #e9e9f5',
            }}
          >
            <span>💰</span>

            <div>
              <p
                style={{
                  fontSize: 10,
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  margin: 0,
                }}
              >
                {t('chat.benefit', 'Benefit')}
              </p>

              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#168348',
                  margin: 0,
                }}
              >
                {scheme.benefit}
              </p>
            </div>
          </div>
        )}

        {scheme.reason && (
          <p
            style={{
              fontSize: 12,
              color: '#85859A',
              marginTop: 8,
              fontStyle: 'italic',
              marginBottom: 0,
            }}
          >
            "{scheme.reason}"
          </p>
        )}
      </div>

      {/* Expand */}
      <div style={{ borderTop: '1px solid #eeeeF5' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 16px',
            fontSize: 12,
            color: '#777890',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span>{t('chat.howToApply', 'How to Apply')}</span>

          <motion.span animate={{ rotate: expanded ? 180 : 0 }}>
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                overflow: 'hidden',
                padding: '0 16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {[
                t('chat.step1', 'Verify eligibility documents'),
                t('chat.step2', 'Fill the application form'),
                t('chat.step3', 'Submit at official portal'),
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#66677A',
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      background: `${cat.color}15`,
                      color: cat.color,
                    }}
                  >
                    {i + 1}
                  </span>

                  {s}
                </div>
              ))}

              {scheme.applyLink && (
                <a
                  href={scheme.applyLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    marginTop: 4,
                    color: cat.color,
                    textDecoration: 'underline',
                  }}
                >
                  🔗 {t('chat.officialPortal', 'Official Portal')} →
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          padding: '0 16px 16px',
          display: 'flex',
          gap: 8,
        }}
      >
        {scheme.applyLink && (
          <a
            href={scheme.applyLink}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              border: `1px solid ${cat.color}40`,
              color: cat.color,
              background: `${cat.color}10`,
            }}
          >
            🌐 {t('chat.applyOnline', 'Apply Online')}
          </a>
        )}

        {scheme.applyLink && (
          <a
            href={scheme.applyLink}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              color: '#fff',
              background:
                'linear-gradient(135deg, #FF8A00, #FFB000)',
              boxShadow: '0 4px 12px rgba(255,138,0,0.22)',
            }}
          >
            📝 {t('chat.fillForm', 'Fill Form')}
          </a>
        )}
      </div>
    </motion.div>
  )
}

/* ── Scheme Section ─────────────────────────────────────── */
function SchemeSection({ title, icon, schemes, isState = false, t }) {
  const [collapsed, setCollapsed] = useState(false)

  if (!schemes || schemes.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginTop: 12 }}
    >
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 13,
          marginBottom: 8,
          cursor: 'pointer',
          background: isState
            ? 'rgba(235,250,241,0.9)'
            : 'rgba(255,247,237,0.95)',
          border: `1px solid ${
            isState ? 'rgba(60,180,110,0.35)' : 'rgba(255,150,40,0.35)'
          }`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 15 }}>{icon}</span>

          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: isState ? '#17633A' : '#A85400',
            }}
          >
            {title}
          </span>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 20,
              background: isState ? '#1A9A5B' : '#FF8A00',
              color: '#fff',
            }}
          >
            {schemes.length}{' '}
            {schemes.length > 1
              ? t('chat.schemesPlural', 'schemes')
              : t('chat.schemeSingular', 'scheme')}
          </span>
        </div>

        <motion.span
          animate={{ rotate: collapsed ? 180 : 0 }}
          style={{ color: '#999', fontSize: 12 }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {schemes.map((s, i) => (
              <SchemeCard
                key={i}
                scheme={s}
                index={i}
                isState={isState}
                t={t}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Message bubble ──────────────────────────────────────── */
function Message({ msg, langColor, t }) {
  const isUser = msg.role === 'user'

  const centralSchemes = (msg.schemes || []).filter(
    s => s.state === 'Central' || !s.state
  )

  const stateSchemes = (msg.schemes || []).filter(
    s => s.state && s.state !== 'Central'
  )

  const hasSchemes = (msg.schemes || []).length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: 8,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            background:
              'linear-gradient(135deg, #FF7900, #FFB000)',
            boxShadow: '0 5px 15px rgba(255,130,0,0.25)',
          }}
        >
          🏛️
        </div>
      )}

      <div style={{ maxWidth: '80%' }}>
        <div
          style={{
            padding: '11px 16px',
            borderRadius: isUser
              ? '20px 20px 4px 20px'
              : '4px 20px 20px 20px',
            fontSize: 14,
            lineHeight: 1.6,
            color: isUser ? '#fff' : '#30314D',
            background: isUser
              ? 'linear-gradient(135deg, #FF7900, #FFB000)'
              : 'rgba(255,255,255,0.96)',
            border: isUser
              ? 'none'
              : '1px solid rgba(225,226,240,0.9)',
            boxShadow: isUser
              ? '0 6px 20px rgba(255,125,0,0.22)'
              : '0 5px 18px rgba(35,35,90,0.07)',
          }}
        >
          {msg.content}
        </div>

        {!isUser && hasSchemes && (
          <div style={{ marginTop: 8 }}>
            <p
              style={{
                fontSize: 12,
                color: '#85869D',
                padding: '0 4px',
                marginBottom: 4,
              }}
            >
              🎯 {msg.schemes.length}{' '}
              {t('chat.matchingSchemesFound', 'matching schemes found')}
            </p>

            {centralSchemes.length > 0 && (
              <SchemeSection
                title={t(
                  'chat.centralSchemes',
                  'Central Government Schemes'
                )}
                icon="🏛️"
                schemes={centralSchemes}
                isState={false}
                t={t}
              />
            )}

            {stateSchemes.length > 0 && (
              <SchemeSection
                title={`${stateSchemes[0].state} ${t(
                  'chat.stateSchemes',
                  'State Schemes'
                )}`}
                icon="🗺️"
                schemes={stateSchemes}
                isState={true}
                t={t}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Main ChatPage ───────────────────────────────────────── */
export default function ChatPage() {
  const navigate = useNavigate()

  const { languageCode, language, t } = useLanguage()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [userState, setUserState] = useState(null)

  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'ai',
      content: t(
        'chat.greeting',
        "Hello! Tell me your name, age, occupation and state — I'll find the best government schemes for you."
      ),
      schemes: [],
    },
  ])

  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  const V = VOICE_CONFIG[languageCode] || VOICE_CONFIG.en

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async text => {
    if (!text.trim() || loading) return

    setInput('')

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      schemes: [],
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const { data } = await axios.post('/api/chat/message', {
        message: text,
        language: language.name,
        languageCode,
        sessionId,
      })

      setSessionId(data.sessionId)

      if (data.userProfile?.state) {
        setUserState(data.userProfile.state)
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content:
          data.reply ||
          t(
            'chat.foundSchemes',
            'I found some schemes for you!'
          ),
        schemes: data.schemes || [],
      }

      setMessages(prev => [...prev, aiMsg])

      if (data.schemes?.length > 0) {
        speak(data.reply, V.code)
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          content: t(
            'chat.errorMsg',
            'Sorry, something went wrong. Please try again.'
          ),
          schemes: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleVoice = () => {
    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SR) return

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const r = new SR()

    r.lang = V.code
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
    setMessages([
      {
        id: 'init',
        role: 'ai',
        content: t(
          'chat.greetingShort',
          'Hello! Tell me your name, age, occupation and state.'
        ),
        schemes: [],
      },
    ])

    setSessionId(null)
    setUserState(null)
  }

  const suggestedPrompts =
    t('chat.suggestedPrompts', null) || [
      'I am a 65 year old farmer',
      'I am a 20 year old student',
      'I am a woman with no gas',
      'I need housing help',
    ]

  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(135deg, #17135C 0%, #28207D 42%, #1959A6 100%)',
        color: '#1a1a2e',
        overflow: 'hidden',
      }}
    >
      {/* ── Tricolor top strip ── */}
      <div
        style={{
          height: 4,
          display: 'flex',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: '#FF7900',
          }}
        />

        <div
          style={{
            flex: 1,
            background: '#fff',
          }}
        />

        <div
          style={{
            flex: 1,
            background: '#138808',
          }}
        />
      </div>

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 5%',
          height: 60,
          background: 'rgba(255,255,255,0.98)',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 3px 15px rgba(20,20,80,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#777',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ←
          </button>

          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background:
                'linear-gradient(135deg, #FF7900, #FFB000)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              boxShadow: '0 4px 12px rgba(255,125,0,0.2)',
            }}
          >
            🏛️
          </div>

          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: '#171942',
                lineHeight: 1,
              }}
            >
              Scheme
              <span style={{ color: '#FF7900' }}>-AI</span>
            </div>

            <div
              style={{
                fontSize: 10,
                color: '#8B8CA0',
                marginTop: 3,
              }}
            >
              {t(
                'footer.tagline',
                '• Welfare Navigator'
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 4,
          }}
          className="header-tabs"
        >
          {[
            t('nav.talkToAI', 'Talk to AI'),
            t('nav.schemes', 'Browse Schemes'),
            t('nav.scanId', 'Upload ID'),
            t('nav.dashboard', 'Dashboard'),
          ].map((tab, i) => (
            <button
              key={tab}
              onClick={() =>
                i === 0
                  ? null
                  : navigate(
                      i === 1
                        ? '/schemes'
                        : i === 2
                        ? '/ocr'
                        : '/dashboard'
                    )
              }
              style={{
                background:
                  i === 0
                    ? '#fff5e9'
                    : 'transparent',
                color:
                  i === 0
                    ? '#FF7900'
                    : '#55566B',
                border:
                  i === 0
                    ? '1px solid #ffd3a5'
                    : '1px solid transparent',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: i === 0 ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Language */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 13px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${V.color}35`,
            color: V.color,
            background: `${V.color}0D`,
          }}
        >
          🌐 {language.name}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          padding: 12,
          gap: 12,
          background:
            'linear-gradient(135deg, #211969 0%, #27217A 45%, #1D579C 100%)',
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: 14,
            gap: 14,
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.09)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={newChat}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 11,
              fontWeight: 700,
              fontSize: 13,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              background:
                'linear-gradient(135deg, #FF7900, #FFB000)',
              boxShadow:
                '0 6px 20px rgba(255,120,0,0.30)',
            }}
          >
            {t('chat.newChat', '+ New Chat')}
          </motion.button>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.55)',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                padding: '0 4px',
                marginBottom: 8,
              }}
            >
              {t('chat.recent', 'Recent')}
            </p>

            <div
              style={{
                padding: '9px 10px',
                borderRadius: 11,
                background: 'rgba(255,255,255,0.12)',
                border:
                  '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#FFB000',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {t(
                  'chat.currentChat',
                  'Current Chat'
                )}
              </p>

              <p
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 3,
                }}
              >
                {
                  messages.filter(
                    m => m.role === 'user'
                  ).length
                }{' '}
                {t('chat.messages', 'messages')}
              </p>
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.55)',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                padding: '0 4px',
                marginBottom: 8,
              }}
            >
              {t('chat.trySaying', 'Try saying')}
            </p>

            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.72)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 4,
                }}
              >
                💬 {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 18,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,249,255,0.97))',
            border:
              '1px solid rgba(255,255,255,0.6)',
            boxShadow:
              '0 10px 35px rgba(10,10,60,0.18)',
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 5%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {messages.map(msg => (
              <Message
                key={msg.id}
                msg={msg}
                langColor={V.color}
                t={t}
              />
            ))}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#85869D',
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      'linear-gradient(135deg, #FF7900, #FFB000)',
                    boxShadow:
                      '0 5px 15px rgba(255,120,0,0.22)',
                  }}
                >
                  🏛️
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 16px',
                    borderRadius:
                      '4px 20px 20px 20px',
                    background: '#fff',
                    border:
                      '1px solid #e8e8f2',
                    boxShadow:
                      '0 4px 15px rgba(20,20,80,0.06)',
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: V.color,
                      }}
                      animate={{
                        y: [0, -6, 0],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}

                  <span
                    style={{
                      fontSize: 12,
                      marginLeft: 4,
                    }}
                  >
                    {t(
                      'chat.typing',
                      'Finding schemes...'
                    )}
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              flexShrink: 0,
              padding: 16,
              borderTop:
                '1px solid rgba(230,230,240,0.9)',
              background:
                'rgba(255,255,255,0.98)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                maxWidth: 800,
                margin: '0 auto',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleVoice}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  cursor: 'pointer',
                  background: recording
                    ? 'rgba(239,68,68,0.1)'
                    : `${V.color}12`,
                  border: `2px solid ${
                    recording
                      ? 'rgba(239,68,68,0.5)'
                      : V.color + '40'
                  }`,
                  boxShadow: recording
                    ? '0 0 20px rgba(239,68,68,0.2)'
                    : 'none',
                }}
              >
                {recording ? (
                  <motion.div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: '#ef4444',
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                    }}
                  />
                ) : (
                  '🎙️'
                )}
              </motion.button>

              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#f8f8fc',
                  border: `1px solid ${
                    input
                      ? V.color + '55'
                      : '#dedfec'
                  }`,
                  boxShadow: input
                    ? `0 0 0 3px ${V.color}0D`
                    : 'none',
                }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e =>
                    setInput(e.target.value)
                  }
                  onKeyDown={e =>
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    sendMessage(input)
                  }
                  placeholder={t(
                    'chat.placeholder',
                    'Type your message...'
                  )}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: '12px 16px',
                    fontSize: 14,
                    color: '#1a1a2e',
                  }}
                />

                {input && (
                  <button
                    onClick={() => setInput('')}
                    style={{
                      padding: '0 12px',
                      color: '#aaa',
                      background: 'transparent',
                      border: 'none',
                      fontSize: 18,
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  flexShrink: 0,
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity:
                    !input.trim() || loading
                      ? 0.3
                      : 1,
                  background:
                    'linear-gradient(135deg, #FF7900, #FFB000)',
                  boxShadow: input
                    ? '0 5px 18px rgba(255,120,0,0.30)'
                    : 'none',
                }}
              >
                ➤
              </motion.button>
            </div>

            <p
              style={{
                textAlign: 'center',
                fontSize: 10,
                color: '#aaaabd',
                marginTop: 10,
              }}
            >
              {t(
                'chat.inputHint',
                'Press Enter to send • 🎙️ to speak • Groq AI powered'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tricolor bottom strip ── */}
      <div
        style={{
          height: 4,
          display: 'flex',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: '#FF7900',
          }}
        />

        <div
          style={{
            flex: 1,
            background: '#fff',
          }}
        />

        <div
          style={{
            flex: 1,
            background: '#138808',
          }}
        />
      </div>
    </div>
  )
}