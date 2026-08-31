// frontend/src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOTP = async () => {
    if (phone.length < 10) { setError('Please enter a valid 10-digit mobile number'); return }
    setLoading(true); setError('')
    try {
      await axios.post('/api/users/send-otp', { phone })
      setStep('otp')
    } catch { setError('Could not send OTP. Please try again.') }
    finally { setLoading(false) }
  }

  const verifyOTP = async () => {
    if (otp.length < 4) { setError('Please enter the OTP'); return }
    setLoading(true); setError('')
    try {
      await axios.post('/api/users/verify-otp', { phone, otp })
      navigate('/dashboard')
    } catch { setError('Invalid OTP. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#f8f9fc', display: 'flex', flexDirection: 'column' }}>
      {/* Tricolor */}
      <div style={{ height: 5, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '2px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', height: 60, background: '#fff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏛️</div>
          <span style={{ fontWeight: 800, fontSize: 20 }}>Scheme<span style={{ color: '#FF6B00' }}>-AI</span></span>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: 14, color: '#555', cursor: 'pointer' }}>← Back to Home</button>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 5%' }}>
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 24, padding: '40px 36px', maxWidth: 420, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>🏛️</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>Sign in to Scheme-AI</h1>
            <p style={{ fontSize: 14, color: '#888', margin: 0 }}>No password needed — just your mobile number</p>
          </div>

          {error && (
            <div style={{ background: '#fde8e8', border: '1px solid #f5b7b1', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#c0392b' }}>
              ⚠️ {error}
            </div>
          )}

          {step === 'phone' ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#333', display: 'block', marginBottom: 8 }}>Mobile Number</label>
                <div style={{ display: 'flex', border: '2px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', transition: 'border 0.2s' }}>
                  <span style={{ background: '#f8f8f8', padding: '14px 16px', fontSize: 15, color: '#555', borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>🇮🇳 +91</span>
                  <input
                    type="tel" maxLength={10} value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && sendOTP()}
                    placeholder="Enter 10-digit number"
                    style={{ flex: 1, padding: '14px 16px', border: 'none', fontSize: 16, outline: 'none', color: '#1a1a2e' }}
                  />
                </div>
              </div>
              <button onClick={sendOTP} disabled={loading || phone.length < 10}
                style={{
                  width: '100%', background: phone.length >= 10 ? 'linear-gradient(135deg, #FF6B00, #FFAA00)' : '#e0e0e0',
                  color: phone.length >= 10 ? '#fff' : '#aaa', border: 'none', borderRadius: 12,
                  padding: '16px', fontSize: 16, fontWeight: 700, cursor: phone.length >= 10 ? 'pointer' : 'default',
                }}>
                {loading ? '⏳ Sending OTP...' : 'Send OTP →'}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#333', display: 'block', marginBottom: 8 }}>Enter OTP sent to +91 {phone}</label>
                <input
                  type="tel" maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                  placeholder="Enter OTP"
                  style={{ width: '100%', padding: '16px', border: '2px solid #e0e0e0', borderRadius: 12, fontSize: 24, textAlign: 'center', letterSpacing: 8, fontWeight: 700, outline: 'none', boxSizing: 'border-box', color: '#1a1a2e' }}
                />
              </div>
              <button onClick={verifyOTP} disabled={loading || otp.length < 4}
                style={{
                  width: '100%', background: otp.length >= 4 ? 'linear-gradient(135deg, #FF6B00, #FFAA00)' : '#e0e0e0',
                  color: otp.length >= 4 ? '#fff' : '#aaa', border: 'none', borderRadius: 12,
                  padding: '16px', fontSize: 16, fontWeight: 700, cursor: otp.length >= 4 ? 'pointer' : 'default', marginBottom: 12,
                }}>
                {loading ? '⏳ Verifying...' : 'Verify & Sign In ✓'}
              </button>
              <button onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                style={{ width: '100%', background: 'none', border: '1px solid #e0e0e0', borderRadius: 12, padding: '12px', fontSize: 14, color: '#555', cursor: 'pointer' }}>
                ← Change number
              </button>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={() => navigate('/chat')}
              style={{ background: 'none', border: 'none', fontSize: 14, color: '#FF6B00', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
              Skip — use without signing in →
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 5, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '2px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>
    </div>
  )
}