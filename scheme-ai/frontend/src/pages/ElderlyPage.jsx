// frontend/src/pages/ElderlyPage.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLanguage } from '../context/LanguageContext'

// Voice/speech-recognition codes, keyed by the SAME codes used in
// LanguageContext (en, hi, ta, te, bn, mr, kn, gu, ml, pa, ur, or).
const VOICE_CODE = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', mr: 'mr-IN',
  kn: 'kn-IN', gu: 'gu-IN', ml: 'ml-IN', pa: 'pa-IN', ur: 'ur-IN', or: 'or-IN',
}

export default function ElderlyPage() {
  const navigate = useNavigate()
  const { language, languageCode, setLanguage, t, LANGUAGES } = useLanguage()
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const recognitionRef = useRef(null)

  const voiceCode = VOICE_CODE[languageCode] || VOICE_CODE.en

  useEffect(() => {
    if (reply) {
      const u = new SpeechSynthesisUtterance(reply)
      u.lang = voiceCode; u.rate = 0.82; u.pitch = 1.1
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply])

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = voiceCode; r.interimResults = false
    r.onresult = async (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      await sendMessage(text)
    }
    r.onstart = () => setRecording(true)
    r.onend = () => setRecording(false)
    recognitionRef.current = r
    r.start()
  }

  const sendMessage = async (text) => {
    setLoading(true)
    try {
      const { data } = await axios.post('/api/chat/message', { message: text, language: language.name, languageCode, sessionId })
      setSessionId(data.sessionId)
      setReply(data.reply)
      setSchemes(data.schemes || [])
    } catch {
      setReply(t('elderly.errorMsg', 'Sorry, please try again.'))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#fff' }}>

      {/* Tricolor top */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '1px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* Header — matches LandingPage navbar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100,
        padding: '0 5%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', fontSize: 14, color: '#555', cursor: 'pointer', fontWeight: 500 }}>
          ← {t('elderly.back', 'Back')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🏛️</div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Scheme<span style={{ color: '#FF6B00' }}>-AI</span></span>
        </div>
        <div style={{
          background: '#fff8f0', border: '1px solid #ffd0a0',
          borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#FF6B00', fontWeight: 600,
        }}>🌐 {language.name}</div>
      </div>

      {/* ── Navy gradient hero — matches LandingPage hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1050 0%, #2a1a80 40%, #1a56a0 100%)',
        padding: '32px 5% 56px',
      }}>
        {/* Language pills — same treatment as the landing hero */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 36 }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLanguage(l.code)}
              style={{
                background: languageCode === l.code ? 'rgba(255,170,0,0.25)' : 'rgba(255,255,255,0.08)',
                color: languageCode === l.code ? '#FFAA00' : '#b0c4e8',
                border: languageCode === l.code ? '1px solid rgba(255,170,0,0.4)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '6px 16px', fontSize: 13,
                fontWeight: languageCode === l.code ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {l.name}
            </button>
          ))}
        </div>

        {/* Glass greeting card — same treatment as the landing voice-demo card */}
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
            padding: '32px 28px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🙏</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFAA00', margin: '0 0 10px' }}>
              {t('elderly.greetingTitle', 'Welcome')}!
            </h2>
            <p style={{ fontSize: 16, color: '#d0e4f8', margin: '0 0 18px', lineHeight: 1.6 }}>
              {t('elderly.greetingBody', 'Press the microphone and tell us about yourself')}
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 12,
              padding: '12px 16px', fontSize: 13, color: '#b0c4e8', lineHeight: 1.6,
            }}>
              💡 {t('elderly.trySaying', 'Try saying:')}<br />
              <em style={{ color: '#FFAA00', fontWeight: 600 }}>
                {t('elderly.example', 'Example: "My name is Raman, age 65, Tamil Nadu, farmer"')}
              </em>
            </div>

            {/* Mic button */}
            <div style={{ marginTop: 28 }}>
              <button
                onClick={recording ? () => { recognitionRef.current?.stop(); setRecording(false) } : startRecording}
                style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: recording
                    ? 'linear-gradient(135deg, #c0392b, #e74c3c)'
                    : 'linear-gradient(135deg, #FF6B00, #FFAA00)',
                  border: `4px solid ${recording ? 'rgba(231,76,60,0.4)' : 'rgba(255,170,0,0.35)'}`,
                  fontSize: 48, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: recording
                    ? '0 0 32px rgba(231,76,60,0.5)'
                    : '0 8px 28px rgba(255,107,0,0.45)',
                  transition: 'all 0.3s',
                  animation: recording ? 'pulse 1s infinite' : 'none',
                }}>
                🎙️
              </button>
              <p style={{ fontSize: 16, fontWeight: 700, color: recording ? '#ff8a75' : '#FFAA00', marginTop: 14 }}>
                {recording ? `🔴 ${t('elderly.listening', 'Listening...')}` : t('elderly.pressToSpeak', 'Press to speak')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content below hero, light background like landing sections ── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 5%', background: '#fafafa' }}>

        {/* Transcript */}
        {transcript && (
          <div style={{
            background: '#fff8f0', border: '2px solid #ffd0a0', borderRadius: 16,
            padding: 20, marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 6px', fontWeight: 600 }}>
              {t('elderly.youSaid', 'You said:')}
            </p>
            <p style={{ fontSize: 18, color: '#1a1a2e', fontWeight: 600, margin: 0 }}>"{transcript}"</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
            <p style={{ fontSize: 18, color: '#555' }}>{t('elderly.findingSchemes', 'Finding your schemes...')}</p>
          </div>
        )}

        {/* AI Reply — navy gradient card, same treatment as landing's dark sections */}
        {reply && !loading && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1050, #2a1a80)',
            borderRadius: 20, padding: 24, marginBottom: 24,
            boxShadow: '0 8px 32px rgba(26,16,80,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>🏛️</span>
              <span style={{ fontSize: 14, color: '#FFAA00', fontWeight: 700 }}>
                {t('elderly.replyLabel', 'Scheme-AI Reply:')}
              </span>
            </div>
            <p style={{ fontSize: 18, color: '#fff', lineHeight: 1.7, margin: 0 }}>{reply}</p>
            <button
              onClick={() => {
                const u = new SpeechSynthesisUtterance(reply)
                u.lang = voiceCode; u.rate = 0.82
                window.speechSynthesis.cancel()
                window.speechSynthesis.speak(u)
              }}
              style={{
                marginTop: 16, background: 'rgba(255,170,0,0.2)',
                border: '1px solid rgba(255,170,0,0.4)',
                color: '#FFAA00', borderRadius: 10, padding: '8px 18px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
              🔊 {t('elderly.playAgain', 'Play again')}
            </button>
          </div>
        )}

        {/* Schemes */}
        {schemes.length > 0 && !loading && (
          <div>
            {/* Central */}
            {schemes.filter(s => s.state === 'Central' || !s.state).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  background: '#fff8f0', border: '2px solid #ffd0a0', borderRadius: 14,
                  padding: '12px 18px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#a05000' }}>
                    🏛️ {t('elderly.centralSchemes', 'Central Government Schemes')}
                  </span>
                  <span style={{ marginLeft: 'auto', background: '#FF6B00', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                    {schemes.filter(s => s.state === 'Central' || !s.state).length}
                  </span>
                </div>
                {schemes.filter(s => s.state === 'Central' || !s.state).map((s, i) => (
                  <SchemeCard key={i} scheme={s} t={t} />
                ))}
              </div>
            )}
            {/* State */}
            {schemes.filter(s => s.state && s.state !== 'Central').length > 0 && (
              <div>
                <div style={{
                  background: '#f0fff5', border: '2px solid #90d0a0', borderRadius: 14,
                  padding: '12px 18px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a5a30' }}>
                    🗺️ {t('elderly.stateSchemes', 'State Schemes')}
                  </span>
                  <span style={{ marginLeft: 'auto', background: '#1a7a4a', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                    {schemes.filter(s => s.state && s.state !== 'Central').length}
                  </span>
                </div>
                {schemes.filter(s => s.state && s.state !== 'Central').map((s, i) => (
                  <SchemeCard key={i} scheme={s} isState t={t} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help line */}
        <div style={{
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: 14,
          padding: '16px 20px', textAlign: 'center', marginTop: 32,
          fontSize: 15, color: '#666', lineHeight: 1.6,
        }}>
          {t('elderly.helpLine', '📞 Need help? — Show this to a family member or village panchayat officer')}
        </div>
      </div>

      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '1px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>
    </div>
  )
}

function SchemeCard({ scheme, isState, t }) {
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${isState ? '#c0e8cc' : '#e8e8e8'}`,
      borderRadius: 16, padding: 20, marginBottom: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', margin: 0, flex: 1, paddingRight: 12 }}>
          {scheme.name}
        </h3>
        <span style={{
          background: scheme.eligibility >= 80 ? '#e8f8e8' : '#fff8e8',
          color: scheme.eligibility >= 80 ? '#1a7a1a' : '#a07000',
          fontWeight: 800, fontSize: 16, padding: '4px 12px',
          borderRadius: 20, flexShrink: 0,
          border: `1px solid ${scheme.eligibility >= 80 ? '#90d090' : '#e0c060'}`,
        }}>{scheme.eligibility}%</span>
      </div>
      <p style={{ fontSize: 14, color: '#888', margin: '0 0 10px' }}>{scheme.ministry}</p>
      {scheme.benefit && scheme.benefit !== 'Check official portal' && (
        <div style={{
          background: '#f0faf0', border: '1px solid #c0e8c0',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a7a1a', margin: 0 }}>✓ {scheme.benefit}</p>
        </div>
      )}
      {scheme.reason && (
        <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic', margin: '0 0 12px' }}>"{scheme.reason}"</p>
      )}
      {scheme.applyLink && (
        <a href={scheme.applyLink} target="_blank" rel="noreferrer"
          style={{
            display: 'inline-block', background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
            color: '#fff', borderRadius: 10, padding: '10px 20px',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
          }}>
          📝 {t('elderly.applyNow', 'Apply Now')}
        </a>
      )}
    </div>
  )
}