import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RiUserLine, RiPhoneLine, RiArrowRightLine, RiGovernmentLine, RiShieldCheckLine } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'

const LANGUAGES = [
  { code: 'en-IN', short: 'en', label: 'English', name: 'English', flag: '🇬🇧' },
  { code: 'hi-IN', short: 'hi', label: 'हिन्दी', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta-IN', short: 'ta', label: 'தமிழ்', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', short: 'te', label: 'తెలుగు', name: 'Telugu', flag: '🇮🇳' },
  { code: 'bn-IN', short: 'bn', label: 'বাংলা', name: 'Bengali', flag: '🇮🇳' },
  { code: 'mr-IN', short: 'mr', label: 'मराठी', name: 'Marathi', flag: '🇮🇳' },
  { code: 'gu-IN', short: 'gu', label: 'ગુજરાતી', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'kn-IN', short: 'kn', label: 'ಕನ್ನಡ', name: 'Kannada', flag: '🇮🇳' },
]
const STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan',
  'Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal',
]

export default function LoginPage() {
  const [tab, setTab] = useState('login')   // 'login' | 'register'
  const [step, setStep] = useState(1)        // register: step 1 = basic, step 2 = profile
  const [loading, setLoading] = useState(false)

  // Login fields
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

  // Register step 2 fields
  const [language, setLanguage] = useState('English')
  const [state, setState] = useState('')
  const [occupation, setOccupation] = useState('')

  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  // ── LOGIN ──
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return toast.error('Please enter your phone number')
    setLoading(true)

    try {
      // Check localStorage for existing user by phone
      const stored = localStorage.getItem(`scheme-ai-user-${phone}`)
      if (stored) {
        const userData = JSON.parse(stored)
        login(userData)
        toast.success(`Welcome back, ${userData.name}! 🙏`)
        navigate('/chat')
      } else {
        toast.error('No account found. Please register first.')
        setTab('register')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── REGISTER STEP 1 ──
  const handleStep1 = (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Please enter your name')
    if (!phone.trim() || phone.length < 10) return toast.error('Please enter a valid 10-digit phone number')
    const exists = localStorage.getItem(`scheme-ai-user-${phone}`)
    if (exists) {
      toast.error('Account already exists. Please login.')
      setTab('login')
      return
    }
    setStep(2)
  }

  // ── REGISTER STEP 2 ──
  const handleRegister = async (e) => {
    e.preventDefault()
    if (!language) return toast.error('Please select your preferred language')
    setLoading(true)

    try {
      const userData = {
        id: crypto.randomUUID(),
        name: name.trim(),
        phone: phone.trim(),
        language,
        profile: { state, occupation },
        createdAt: new Date().toISOString(),
      }
      // Save to localStorage by phone for lookup
      localStorage.setItem(`scheme-ai-user-${phone}`, JSON.stringify(userData))
      login(userData)
      toast.success(`Welcome to Scheme-AI, ${name}! 🇮🇳`)
      navigate('/chat')
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-saffron/8 blur-[80px] -top-20 -left-20 animate-float" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-scheme-green/6 blur-[80px] bottom-0 right-0" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-saffron to-gold flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_8px_32px_rgba(255,107,0,0.3)]">
            🇮🇳
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Scheme<span className="text-saffron">-AI</span>
          </h1>
          <p className="text-sm text-[#8A9BB0] mt-1">Welfare Eligibility Navigator</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-7"
        >
          {/* Tabs */}
          <div className="flex bg-navy rounded-xl p-1 mb-6">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setStep(1) }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 capitalize ${
                  tab === t
                    ? 'bg-saffron text-navy shadow'
                    : 'text-[#8A9BB0] hover:text-white'
                }`}
              >
                {t === 'login' ? '🔑 Login' : '✨ Register'}
              </button>
            ))}
          </div>

          {/* ── LOGIN FORM ── */}
          <AnimatePresence mode="wait">
            {tab === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wider mb-2 block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB0]" size={16} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter your 10-digit mobile number"
                      className="input-field pl-9"
                      maxLength={10}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5 mt-2 text-sm"
                >
                  {loading ? '⌛ Logging in...' : <>Login to Scheme-AI <RiArrowRightLine /></>}
                </button>

                <p className="text-xs text-center text-[#8A9BB0]">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setTab('register')} className="text-saffron font-semibold hover:underline">
                    Register here
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── REGISTER FORM ── */}
            {tab === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-5">
                  {[1, 2].map(s => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                        step >= s ? 'bg-saffron text-navy' : 'bg-navy-border text-[#8A9BB0]'
                      }`}>
                        {step > s ? '✓' : s}
                      </div>
                      <div className={`text-xs font-medium ${step >= s ? 'text-white' : 'text-[#8A9BB0]'}`}>
                        {s === 1 ? 'Basic Info' : 'Preferences'}
                      </div>
                      {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-saffron' : 'bg-navy-border'}`} />}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.form
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onSubmit={handleStep1}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wider mb-2 block">Full Name</label>
                        <div className="relative">
                          <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB0]" size={16} />
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="input-field pl-9"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wider mb-2 block">Phone Number</label>
                        <div className="relative">
                          <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB0]" size={16} />
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                            className="input-field pl-9"
                            maxLength={10}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary w-full justify-center py-3.5 text-sm">
                        Continue <RiArrowRightLine />
                      </button>
                    </motion.form>
                  )}

                  {step === 2 && (
                    <motion.form
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wider mb-2 block">
                          Preferred Language *
                        </label>
                        <select
                          value={language}
                          onChange={e => setLanguage(e.target.value)}
                          className="input-field font-devanagari"
                        >
                          {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-[#8A9BB0] mt-1">AI will always respond in this language</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wider mb-2 block">
                          Your State (Optional)
                        </label>
                        <select value={state} onChange={e => setState(e.target.value)} className="input-field">
                          <option value="">Select your state</option>
                          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wider mb-2 block">
                          Occupation (Optional)
                        </label>
                        <select value={occupation} onChange={e => setOccupation(e.target.value)} className="input-field">
                          <option value="">Select occupation</option>
                          {['Farmer','Student','Daily Wage Worker','Unemployed','Small Business Owner','Government Employee','Other'].map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center py-3 text-sm">
                          ← Back
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3 text-sm">
                          {loading ? '⌛ Creating...' : <>Create Account <RiArrowRightLine /></>}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 mt-4 text-[11px] text-[#8A9BB0]"
        >
          <RiShieldCheckLine className="text-scheme-green-light" size={13} />
          Your data is stored securely on your device. No sensitive information leaves your browser.
        </motion.div>
      </div>
    </div>
  )
}
