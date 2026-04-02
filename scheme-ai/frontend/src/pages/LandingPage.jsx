// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const LANGUAGES = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
  { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు', flag: '🇮🇳' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1529] to-[#111827] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          <span className="font-bold text-lg">Scheme-AI</span>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-full text-sm font-semibold"
        >
          Login
        </button>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">🇮🇳</div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Government Schemes Easily
          </h1>

          <p className="text-gray-400 mb-8 max-w-xl">
            AI-powered platform to discover welfare schemes in your language
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold"
            >
              Get Started
            </button>

            <button
              onClick={() => navigate('/elderly')}
              className="px-8 py-3 border border-orange-400 text-orange-400 rounded-full"
            >
              🎙️ Voice Mode
            </button>
          </div>
        </motion.div>
      </section>

      {/* Language Section */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">🌐 Choose Language</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {LANGUAGES.map((l, i) => (
              <motion.div
                key={l.code}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-400 cursor-pointer"
              >
                <div className="text-3xl">{l.flag}</div>
                <div className="text-sm mt-2 text-gray-300">{l.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Features</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '🎙️', title: 'Voice Access', desc: 'Use voice commands easily' },
              { emoji: '🤖', title: 'AI Powered', desc: 'Smart scheme recommendations' },
              { emoji: '🌐', title: 'Multi Language', desc: 'Available in many languages' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="text-center py-10 bg-gradient-to-r from-orange-500 to-green-600">
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-white text-orange-600 rounded-full font-bold"
        >
          Start Now
        </button>
      </section>
    </div>
  )
}