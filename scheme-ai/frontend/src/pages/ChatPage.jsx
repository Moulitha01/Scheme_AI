import { useState, useRef, useEffect } from 'react'
import {
  RiMicLine,
  RiMicOffLine,
  RiSendPlaneFill,
  RiDeleteBin6Line
} from 'react-icons/ri'
import axios from 'axios'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { useAuthStore, useChatStore } from '../store'

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
  content: `Welcome to Scheme-AI 🚀  
Tell me your situation to find best government schemes.`,
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)

  const recognitionRef = useRef(null)

  const { user, updateLanguage, sessionId } = useAuthStore()
  const { messages, addMessage, setMessages, clearChat } = useChatStore()

  // ✅ SINGLE SOURCE
  const selectedLang = user?.language || 'English'

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([INITIAL_MSG])
    }
  }, [])

  // ✅ DEBUG (REMOVE LATER)
  console.log("ACTIVE LANG:", selectedLang)

  const handleLangChange = (lang) => {
    updateLanguage(lang)
    toast.success(`Switched to ${lang}`)
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    addMessage({ id: Date.now(), role: 'user', content: text })
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post('/api/chat/message', {
        message: text,
        sessionId,
        language: selectedLang,
      })

      addMessage({
        id: Date.now() + 1,
        role: 'ai',
        content: data.reply,
      })
    } catch {
      toast.error('Server error')
    } finally {
      setLoading(false)
    }
  }

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SR) {
      toast.error('Use Chrome')
      return
    }

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const recognition = new SR()
    recognition.lang = LANG_CODES[selectedLang]

    recognition.onstart = () => {
      setRecording(true)
    }

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setInput(text)
      sendMessage(text)
    }

    recognition.onend = () => setRecording(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  return (
    <div className="h-screen flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between p-3 border-b">
        <h1>Scheme-AI</h1>

        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLangChange(lang)}
              className={`px-2 py-1 text-xs rounded ${
                selectedLang === lang
                  ? 'bg-orange-500 text-white'
                  : 'border'
              }`}
            >
              {lang}
            </button>
          ))}

          <button onClick={clearChat}>
            <RiDeleteBin6Line />
          </button>
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${
              msg.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div className="inline-block p-2 bg-gray-800 text-white rounded">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && <p>Typing...</p>}
      </div>

      {/* INPUT */}
      <div className="flex gap-2 p-3 border-t">
        <button onClick={handleVoice}>
          {recording ? <RiMicOffLine /> : <RiMicLine />}
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border p-2"
        />

        <button onClick={() => sendMessage(input)}>
          <RiSendPlaneFill />
        </button>
      </div>
    </div>
  )
}