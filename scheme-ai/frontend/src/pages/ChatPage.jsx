import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiMicLine,
  RiMicOffLine,
  RiSendPlaneFill,
  RiTranslate2,
  RiDeleteBin6Line
} from 'react-icons/ri'
import axios from 'axios'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { useAuthStore, useChatStore, useSchemeStore } from '../store'

const QUICK_PROMPTS = [
  '👩‍🌾 I am a farmer needing crop support',
  '🎓 Help me find education scholarships',
  '🏠 I need housing scheme assistance',
  '👩‍⚕️ Looking for health insurance schemes',
  '👴 Pension schemes for elderly parents',
  '💼 Schemes for unemployed youth',
]

const LANG_CODES = {
  English: 'en-IN',
  हिन्दी: 'hi-IN',
  தமிழ்: 'ta-IN',
  తెలుగు: 'te-IN',
  বাংলা: 'bn-IN',
  मराठी: 'mr-IN',
  ಕನ್ನಡ: 'kn-IN',
}

const LANGUAGES = Object.keys(LANG_CODES)

const INITIAL_MSG = {
  id: 'init',
  role: 'ai',
  content: `नमस्ते! 🙏 I'm **Scheme-AI**, your personal welfare navigator.

Tell me about yourself and your needs — I'll find every government scheme you're eligible for.

You can speak or type in **any Indian language**.`,
  timestamp: new Date().toISOString(),
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)

  const recognitionRef = useRef(null)
  const bottomRef = useRef(null)

  // Stores
  const { user, sessionId, updateLanguage } = useAuthStore()
  const { messages, addMessage, setMessages, setUserProfile, clearChat } =
    useChatStore()
  const { applyScheme } = useSchemeStore()

  // ✅ SINGLE SOURCE OF TRUTH
  const selectedLang = user?.language || 'English'

  // Init chat
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([INITIAL_MSG])
    }
  }, [])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ✅ LANGUAGE CHANGE FIXED
  const handleLangChange = (lang) => {
    updateLanguage(lang)
    localStorage.setItem('lang', LANG_CODES[lang])
    toast.success(`Language set to ${lang}`)
  }

  // Send message
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    addMessage(userMsg)
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post('/api/chat/message', {
        message: text,
        sessionId,
        language: selectedLang,
      })

      addMessage({
        id: Date.now().toString(),
        role: 'ai',
        content: data.reply,
        schemes: data.schemes || [],
        timestamp: new Date().toISOString(),
      })

      if (data.userProfile) setUserProfile(data.userProfile)
    } catch {
      toast.error('Server error')
    } finally {
      setLoading(false)
    }
  }

  // ✅ VOICE FIXED
  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SR) {
      toast.error('Use Chrome for voice')
      return
    }

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const recognition = new SR()
    recognition.lang = LANG_CODES[selectedLang] || 'en-IN'

    recognition.onstart = () => {
      setRecording(true)
      toast.success(`Listening in ${selectedLang}`)
    }

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setInput(text)
      sendMessage(text) // auto send
    }

    recognition.onerror = () => {
      toast.error('Voice failed')
      setRecording(false)
    }

    recognition.onend = () => setRecording(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleClearChat = () => {
    clearChat()
    setMessages([INITIAL_MSG])
  }

  return (
    <div className="pt-[67px] h-screen flex flex-col">
      {/* HEADER */}
      <div className="bg-navy-mid border-b px-4 py-3 flex justify-between">
        <h1 className="font-bold">Scheme-AI</h1>

        <div className="flex gap-1 flex-wrap">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLangChange(lang)}
              className={`px-2 py-1 rounded-lg text-xs transition ${
                selectedLang === lang
                  ? 'bg-orange-500 text-white scale-105'
                  : 'border text-gray-400 hover:text-orange-400'
              }`}
            >
              {lang}
            </button>
          ))}

          <button onClick={handleClearChat}>
            <RiDeleteBin6Line />
          </button>
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`px-4 py-2 rounded-xl max-w-[70%] ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && <p className="text-gray-400">Typing...</p>}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 flex gap-2">
        <button onClick={handleVoice}>
          {recording ? <RiMicOffLine /> : <RiMicLine />}
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 bg-gray-900 text-white rounded"
          placeholder={`Type in ${selectedLang}`}
        />

        <button onClick={() => sendMessage(input)}>
          <RiSendPlaneFill />
        </button>
      </div>
    </div>
  )
}