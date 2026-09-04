// frontend/src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

const CAT_ICONS = ['🌾', '🏥', '📚', '🏠'] // fallback if a feature icon is ever missing

export default function LandingPage() {
  const navigate = useNavigate()
  const { language, setLanguage, t, tList, LANGUAGES } = useLanguage()
  const [sampleIndex, setSampleIndex] = useState(0)
  const [showModeSelect, setShowModeSelect] = useState(
    () => typeof window !== 'undefined' && !sessionStorage.getItem('schemeai_mode_chosen')
  )

  const chooseMode = (mode) => {
    sessionStorage.setItem('schemeai_mode_chosen', mode)
    setShowModeSelect(false)
    if (mode === 'voice') navigate('/elderly')
  }

  const samples = tList('hero.samples')
  const stats = tList('stats')
  const features = tList('features.items')

  useEffect(() => {
    if (samples.length === 0) return
    const interval = setInterval(() => {
      setSampleIndex(i => (i + 1) % samples.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [samples.length])

  const sampleText = samples[sampleIndex] || ''

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff', color: '#1a1a2e', overflowX: 'hidden' }}>

      {/* ── Mode selector popup — shown once per session before anything else ── */}
      {showModeSelect && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,10,40,0.72)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#fff', borderRadius: 24, padding: '36px 32px',
              maxWidth: 480, width: '100%', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🏛️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
              {t('modeSelect.title')}
            </h2>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px' }}>
              {t('modeSelect.subtitle')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button onClick={() => chooseMode('text')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                  background: '#fff8f0', border: '2px solid #ffd0a0', borderRadius: 16,
                  padding: '16px 18px', cursor: 'pointer',
                }}>
                <span style={{ fontSize: 30 }}>💬</span>
                <span>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#a05000' }}>
                    {t('modeSelect.textChatTitle')}
                  </span>
                  <span style={{ display: 'block', fontSize: 13, color: '#a06a30', marginTop: 2 }}>
                    {t('modeSelect.textChatDesc')}
                  </span>
                </span>
              </button>

              <button onClick={() => chooseMode('voice')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                  background: 'linear-gradient(135deg, #1a1050, #2a1a80)', border: '2px solid transparent',
                  borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
                }}>
                <span style={{ fontSize: 30 }}>🎙️</span>
                <span>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    {t('modeSelect.voiceOnlyTitle')}
                  </span>
                  <span style={{ display: 'block', fontSize: 13, color: '#b0c4e8', marginTop: 2 }}>
                    {t('modeSelect.voiceOnlyDesc')}
                  </span>
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Tricolor top strip ── */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '1px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5%', height: 56, background: '#fff',
        borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🏛️</div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>
            Scheme<span style={{ color: '#FF6B00' }}>-AI</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { key: 'home', label: t('nav.home'), path: null },
            { key: 'talkToAI', label: t('nav.talkToAI'), path: '/chat' },
            { key: 'schemes', label: t('nav.schemes'), path: '/schemes' },
            { key: 'scanId', label: t('nav.scanId'), path: '/ocr' },
            { key: 'dashboard', label: t('nav.dashboard'), path: '/dashboard' },
          ].map((tab, i) => (
            <button key={tab.key}
              onClick={() => tab.path && navigate(tab.path)}
              style={{
                background: i === 0 ? '#fff8f0' : 'transparent',
                color: i === 0 ? '#FF6B00' : '#555',
                border: i === 0 ? '1px solid #ffd0a0' : '1px solid transparent',
                borderRadius: 8, padding: '6px 14px', fontSize: 13,
                fontWeight: i === 0 ? 600 : 400, cursor: 'pointer',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={language.name}
            onChange={e => setLanguage(e.target.value)}
            style={{
              border: '1px solid #e0e0e0', borderRadius: 8, padding: '6px 10px',
              fontSize: 13, color: '#333', background: '#f8f8f8', cursor: 'pointer',
            }}>
            {LANGUAGES.map(l => <option key={l.code}>{l.name}</option>)}
          </select>
          <button
            onClick={() => navigate('/chat')}
            style={{
              background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            🎙️ {t('nav.speakNow')}
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1050 0%, #2a1a80 40%, #1a56a0 100%)',
        padding: '60px 5% 80px', minHeight: 480,
        display: 'flex', alignItems: 'center', gap: 60,
        flexWrap: 'wrap',
      }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,170,0,0.15)', border: '1px solid rgba(255,170,0,0.3)',
            borderRadius: 20, padding: '4px 14px', marginBottom: 24,
          }}>
            <span style={{ fontSize: 10, color: '#FFAA00', fontWeight: 600, letterSpacing: 1 }}>{t('hero.badge')}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>
            {t('hero.titleLine1')}<br />
            {t('hero.titleLine2')}{' '}
            <span style={{ color: '#FFAA00' }}>{t('hero.titleHighlight')}</span>
          </h1>

          <p style={{ fontSize: 16, color: '#b0c4e8', lineHeight: 1.7, maxWidth: 480, margin: '0 0 32px' }}>
            {t('hero.subtitle')}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            <button onClick={() => navigate('/chat')}
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(255,107,0,0.4)',
              }}>
              {t('hero.startTalking')}
            </button>
            <button onClick={() => navigate('/elderly')}
              style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10,
                padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}>
              {t('cta.voiceOnly')}
            </button>
          </div>

          {/* Language pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map(l => (
              <button key={l.code}
                onClick={() => setLanguage(l.name)}
                style={{
                  background: language.name === l.name ? 'rgba(255,170,0,0.25)' : 'rgba(255,255,255,0.08)',
                  color: language.name === l.name ? '#FFAA00' : '#b0c4e8',
                  border: language.name === l.name ? '1px solid rgba(255,170,0,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: '5px 14px', fontSize: 13, cursor: 'pointer',
                }}>
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right — Voice demo card */}
        <div style={{ flex: '0 0 340px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 28,
          }}>
            <p style={{ fontSize: 12, color: '#7090b0', marginBottom: 20, textAlign: 'center' }}>
              {t('hero.tapToSpeak')}
            </p>

            {/* Mic button */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <motion.button
                onClick={() => navigate('/elderly')}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(255,107,0,0.2)',
                  border: '2px solid rgba(255,107,0,0.5)',
                  fontSize: 28, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                🎙️
              </motion.button>
            </div>

            {/* Sample answer */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 12,
              padding: '14px 16px', minHeight: 80,
            }}>
              <p style={{ fontSize: 11, color: '#7090b0', marginBottom: 6 }}>{t('hero.sampleAnswerLabel')}</p>
              <motion.p
                key={sampleText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: 13, color: '#d0e4f8', lineHeight: 1.6, margin: 0 }}>
                {sampleText.split('₹').map((part, i) => i === 0 ? part : (
                  <span key={i}><strong style={{ color: '#FFAA00' }}>₹{part.split(' ')[0]}</strong>{' ' + part.split(' ').slice(1).join(' ')}</span>
                ))}
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        padding: '32px 5%', display: 'flex', gap: 0, flexWrap: 'wrap',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            flex: 1, minWidth: 120, textAlign: 'center',
            borderRight: i < stats.length - 1 ? '1px solid #f0f0f0' : 'none',
            padding: '8px 20px',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B00' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Built for section ── */}
      <section style={{ padding: '60px 5%', background: '#fafafa' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
          {t('features.heading')}
        </h2>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 40 }}>
          {t('features.subheading')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              style={{
                background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16,
                padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
              <div style={{
                width: 44, height: 44, background: '#fff8f0', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 14, border: '1px solid #ffe0c0',
              }}>{f.icon || CAT_ICONS[i % CAT_ICONS.length]}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Live scheme preview ── */}
      <section style={{ padding: '60px 5%', background: '#f8f8ff' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
          {t('demo.heading')}
        </h2>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 32 }}>
          {t('demo.subheading')}
        </p>

        {/* Chat bubble */}
        <div style={{ maxWidth: 600, marginBottom: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
            color: '#fff', borderRadius: '20px 20px 4px 20px',
            padding: '12px 18px', fontSize: 14, fontWeight: 500,
            display: 'inline-block', marginBottom: 12,
          }}>
            {t('demo.userMsg')}
          </div>
          <div style={{
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: '4px 20px 20px 20px',
            padding: '12px 18px', fontSize: 14, color: '#333', lineHeight: 1.6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            {t('demo.aiMsg')}
          </div>
        </div>

        {/* Scheme cards preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
          {/* Central header */}
          <div style={{
            background: '#fff8f0', border: '1px solid #ffd0a0', borderRadius: 12,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>🏛️</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a05000' }}>{t('demo.centralHeader')}</span>
            <span style={{
              marginLeft: 'auto', background: '#FF6B00', color: '#fff',
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            }}>2</span>
          </div>

          {tList('demo.schemeCards').map((s, i) => (
            <div key={i} style={{
              background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12,
              padding: 16, display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 40, height: 40, background: '#fff8f0', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>🌾</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
                  {s.name}{s.nameLocal && s.nameLocal !== s.name ? ` (${s.nameLocal})` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#FF6B00', marginTop: 2 }}>{s.ministry}</div>
                <div style={{ fontSize: 13, color: '#1a7a1a', fontWeight: 600, marginTop: 4 }}>✓ {s.benefit}</div>
              </div>
              <div style={{
                background: s.match >= 90 ? '#e8f8e8' : '#fff8e8',
                color: s.match >= 90 ? '#1a7a1a' : '#a07000',
                fontWeight: 700, fontSize: 14, padding: '4px 10px', borderRadius: 20,
                border: `1px solid ${s.match >= 90 ? '#90d090' : '#e0c060'}`,
              }}>{s.match}%</div>
            </div>
          ))}

          {/* State header */}
          <div style={{
            background: '#f0fff5', border: '1px solid #90d0a0', borderRadius: 12,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
          }}>
            <span>🗺️</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a5a30' }}>{t('demo.stateHeader')}</span>
            <span style={{
              marginLeft: 'auto', background: '#1a7a4a', color: '#fff',
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            }}>1</span>
          </div>

          <div style={{
            background: '#fff', border: '1px solid #c0e8cc', borderRadius: 12,
            padding: 16, display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 40, height: 40, background: '#f0fff5', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🌾</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
                {t('demo.stateScheme.name')}{t('demo.stateScheme.nameLocal') !== t('demo.stateScheme.name') ? ` (${t('demo.stateScheme.nameLocal')})` : ''}
              </div>
              <div style={{ fontSize: 12, color: '#1a7a4a', marginTop: 2 }}>{t('demo.stateScheme.ministry')}</div>
              <div style={{ fontSize: 13, color: '#1a7a1a', fontWeight: 600, marginTop: 4 }}>✓ {t('demo.stateScheme.benefit')}</div>
            </div>
            <div style={{
              background: '#e8f8e8', color: '#1a7a1a',
              fontWeight: 700, fontSize: 14, padding: '4px 10px', borderRadius: 20,
              border: '1px solid #90d090',
            }}>{t('demo.stateScheme.match')}%</div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: '#0d0d1a', padding: '24px 5%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🏛️</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>Scheme<span style={{ color: '#FF6B00' }}>-AI</span></span>
          <span style={{ color: '#555', fontSize: 12 }}>{t('footer.tagline')}</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[t('footer.privacy'), t('footer.terms'), t('footer.about'), t('footer.contact')].map(link => (
            <a key={link} href="#" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>{link}</a>
          ))}
        </div>
        <div style={{ color: '#555', fontSize: 12 }}>
          {t('footer.builtFor')}
        </div>
      </footer>

      {/* Tricolor bottom */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '1px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

    </div>
  )
}