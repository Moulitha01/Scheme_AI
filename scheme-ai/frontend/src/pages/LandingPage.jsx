// frontend/src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'हिन्दी', code: 'hi' },
  { name: 'தமிழ்', code: 'ta' },
  { name: 'తెలుగు', code: 'te' },
  { name: 'বাংলা', code: 'bn' },
  { name: 'मराठी', code: 'mr' },
  { name: 'ಕನ್ನಡ', code: 'kn' },
  { name: 'ગુજરાતી', code: 'gu' },
  { name: 'മലയാളം', code: 'ml' },
  { name: 'ਪੰਜਾਬੀ', code: 'pa' },
  { name: 'اردو', code: 'ur' },
  { name: 'ଓଡ଼ିଆ', code: 'or' },
]

const FEATURES = [
  {
    icon: '💬',
    title: 'Just talk, no forms',
    desc: 'Describe your life the way you would to a neighbour. The assistant does the paperwork thinking.',
  },
  {
    icon: '🗣️',
    title: 'Your language, your words',
    desc: 'Hindi, Tamil, Telugu, Bengali and more — spoken input, spoken answers, simplified on request.',
  },
  {
    icon: '📄',
    title: 'Documents read for you',
    desc: 'Scan an Aadhaar or ration card and the fields flow straight into your application.',
  },
  {
    icon: '✅',
    title: 'Reasons you can check',
    desc: 'Every match carries a 0–100 score and a plain-language reason — no black box, no agent fee.',
  },
]

const STATS = [
  { value: '500M+', label: 'underserved citizens' },
  { value: '2,000+', label: 'central & state schemes' },
  { value: '12+', label: 'Indian languages' },
  { value: '28', label: 'states on the roadmap' },
]

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Profile Extractor',
    desc: 'AI reads your age, occupation, caste, income and state from natural conversation.',
    color: '#FF6B00',
  },
  {
    step: 2,
    title: 'RAG Search',
    desc: '2,000+ schemes are searched instantly using your profile as the query.',
    color: '#FFAA00',
  },
  {
    step: 3,
    title: 'Eligibility Scorer',
    desc: 'Each scheme gets a 0–100 match score with a plain-language reason.',
    color: '#1a56a0',
  },
  {
    step: 4,
    title: 'Voice Reply',
    desc: 'Results are spoken back in your language with apply links and document checklist.',
    color: '#1a7a4a',
  },
]

const SAMPLE_SCHEMES = [
  { name: 'PM-KISAN Samman Nidhi', ministry: 'Ministry of Agriculture', benefit: '₹6,000/year', match: 95, tag: 'Central' },
  { name: 'Uzhavar Pathukappu', ministry: 'Govt of Tamil Nadu', benefit: '₹2 lakh insurance', match: 92, tag: 'Tamil Nadu' },
  { name: 'Ayushman Bharat PM-JAY', ministry: 'Ministry of Health', benefit: '₹5 lakh/year health', match: 88, tag: 'Central' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [selectedLang, setSelectedLang] = useState('English')
  const [voiceActive, setVoiceActive] = useState(false)
  const [sampleText, setSampleText] = useState('')

  const sampleAnswers = [
    '"You qualify for 4 schemes. The nearest one gives your family ₹1,000 every month and needs only your ration card."',
    '"As a 65-year-old farmer from Tamil Nadu, you are eligible for PM-KISAN and Uzhavar Pathukappu Thittam."',
    '"Your daughter qualifies for the Moovalur Ramamirtham Ammaiyar scheme — free bicycle + ₹1,000 cash."',
  ]

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % sampleAnswers.length
      setSampleText(sampleAnswers[i])
    }, 3000)
    setSampleText(sampleAnswers[0])
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff', color: '#1a1a2e', overflowX: 'hidden' }}>

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
          {['Home', 'Talk to AI', 'Schemes', 'Scan ID', 'Dashboard'].map((tab, i) => (
            <button key={tab}
              onClick={() => i === 1 ? navigate('/chat') : i === 2 ? navigate('/schemes') : i === 3 ? navigate('/ocr') : i === 4 ? navigate('/dashboard') : null}
              style={{
                background: i === 0 ? '#fff8f0' : 'transparent',
                color: i === 0 ? '#FF6B00' : '#555',
                border: i === 0 ? '1px solid #ffd0a0' : '1px solid transparent',
                borderRadius: 8, padding: '6px 14px', fontSize: 13,
                fontWeight: i === 0 ? 600 : 400, cursor: 'pointer',
              }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
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
            🎙️ Speak now
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
            <span style={{ fontSize: 10, color: '#FFAA00', fontWeight: 600, letterSpacing: 1 }}>✦ HACKATHON 3.0 — GENERATIVE AI FOR SOCIAL IMPACT</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>
            Speak once.<br />
            Claim everything{' '}
            <span style={{ color: '#FFAA00' }}>you<br />are owed.</span>
          </h1>

          <p style={{ fontSize: 16, color: '#b0c4e8', lineHeight: 1.7, maxWidth: 480, margin: '0 0 32px' }}>
            Lakh-crore worth of Indian welfare benefits go unclaimed every year — not because people don't qualify, but because nobody told them. Scheme-AI listens to your story and finds the schemes hiding inside it.
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
              Start talking →
            </button>
            <button onClick={() => navigate('/schemes')}
              style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10,
                padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}>
              Browse schemes
            </button>
          </div>

          {/* Language pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map(l => (
              <button key={l.code}
                onClick={() => setSelectedLang(l.name)}
                style={{
                  background: selectedLang === l.name ? 'rgba(255,170,0,0.25)' : 'rgba(255,255,255,0.08)',
                  color: selectedLang === l.name ? '#FFAA00' : '#b0c4e8',
                  border: selectedLang === l.name ? '1px solid rgba(255,170,0,0.4)' : '1px solid rgba(255,255,255,0.1)',
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
              Tap and speak in any language
            </p>

            {/* Mic button */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <motion.button
                onClick={() => { setVoiceActive(v => !v); navigate('/chat') }}
                animate={{ scale: voiceActive ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.6, repeat: voiceActive ? Infinity : 0 }}
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: voiceActive ? '#FF6B00' : 'rgba(255,107,0,0.2)',
                  border: '2px solid rgba(255,107,0,0.5)',
                  fontSize: 28, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: voiceActive ? '0 0 30px rgba(255,107,0,0.5)' : 'none',
                }}>
                🎙️
              </motion.button>
            </div>

            {/* Sample answer */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 12,
              padding: '14px 16px', minHeight: 80,
            }}>
              <p style={{ fontSize: 11, color: '#7090b0', marginBottom: 6 }}>Sample answer</p>
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
        {STATS.map((s, i) => (
          <div key={i} style={{
            flex: 1, minWidth: 120, textAlign: 'center',
            borderRight: i < STATS.length - 1 ? '1px solid #f0f0f0' : 'none',
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
          Built for the person who has never filled a form online
        </h2>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 40 }}>
          Most welfare tech is built for people who already know how to navigate bureaucracy. We built this for everyone else.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
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
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '60px 5%', background: '#fff' }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#FF6B00', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            The 4-layer prompt chain
          </span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 40 }}>
          What happens between your sentence and your answer
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, position: 'relative' }}>
              {/* Line connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: step.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, flexShrink: 0, zIndex: 1,
                }}>{step.step}</div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: '#f0f0f0', margin: '4px 0' }} />
                )}
              </div>
              <div style={{ paddingBottom: i < HOW_IT_WORKS.length - 1 ? 32 : 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', margin: '8px 0 6px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live scheme preview ── */}
      <section style={{ padding: '60px 5%', background: '#f8f8ff' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
          See it in action
        </h2>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 32 }}>
          Here's what a 65-year-old farmer from Tamil Nadu would see:
        </p>

        {/* Chat bubble */}
        <div style={{ maxWidth: 600, marginBottom: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
            color: '#fff', borderRadius: '20px 20px 4px 20px',
            padding: '12px 18px', fontSize: 14, fontWeight: 500,
            display: 'inline-block', marginBottom: 12,
          }}>
            I am a 65 year old farmer from Tamil Nadu
          </div>
          <div style={{
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: '4px 20px 20px 20px',
            padding: '12px 18px', fontSize: 14, color: '#333', lineHeight: 1.6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            As a 65-year-old farmer in Tamil Nadu, you may be eligible for the PM-KISAN scheme (₹6,000/year) and the Uzhavar Pathukappu Thittam (₹2 lakh accident insurance). Which state scheme would you like to apply for first?
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a05000' }}>Central Government Schemes</span>
            <span style={{
              marginLeft: 'auto', background: '#FF6B00', color: '#fff',
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            }}>2 schemes</span>
          </div>

          {SAMPLE_SCHEMES.filter(s => s.tag === 'Central').map((s, i) => (
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
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{s.name}</div>
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a5a30' }}>Tamil Nadu State Schemes</span>
            <span style={{
              marginLeft: 'auto', background: '#1a7a4a', color: '#fff',
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            }}>1 scheme</span>
          </div>

          {SAMPLE_SCHEMES.filter(s => s.tag === 'Tamil Nadu').map((s, i) => (
            <div key={i} style={{
              background: '#fff', border: '1px solid #c0e8cc', borderRadius: 12,
              padding: 16, display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 40, height: 40, background: '#f0fff5', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>🌾</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#1a7a4a', marginTop: 2 }}>{s.ministry}</div>
                <div style={{ fontSize: 13, color: '#1a7a1a', fontWeight: 600, marginTop: 4 }}>✓ {s.benefit}</div>
              </div>
              <div style={{
                background: '#e8f8e8', color: '#1a7a1a',
                fontWeight: 700, fontSize: 14, padding: '4px 10px', borderRadius: 20,
                border: '1px solid #90d090',
              }}>{s.match}%</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1050, #2a1a80)',
        padding: '60px 5%', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Your benefits are waiting.
        </h2>
        <p style={{ fontSize: 16, color: '#b0c4e8', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
          Start a conversation — no registration, no paperwork. Just speak.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/chat')}
            style={{
              background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '16px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255,107,0,0.4)',
            }}>
            🎙️ Start talking now
          </button>
          <button onClick={() => navigate('/elderly')}
            style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12,
              padding: '16px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}>
            👴 Voice-only mode
          </button>
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
          <span style={{ color: '#555', fontSize: 12 }}>• Welfare Navigator</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'About', 'Contact'].map(link => (
            <a key={link} href="#" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>{link}</a>
          ))}
        </div>
        <div style={{ color: '#555', fontSize: 12 }}>
          © 2026 Scheme-AI • Built for India
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