// frontend/src/services/tts.js
// Bhashini TTS (primary) with browser SpeechSynthesis fallback
// Supports all 8 Indian languages with optimized voice settings

const API_BASE = 'http://localhost:5000'

// Browser fallback voice lang codes
const VOICE_LANG = {
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  en: 'en-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
}

// Per-language speech rate for browser fallback
// Dravidian languages slower for better clarity for elderly users
const BROWSER_RATE = {
  hi: 0.85,
  ta: 0.78,
  te: 0.78,
  kn: 0.78,
  bn: 0.85,
  mr: 0.85,
  gu: 0.85,
  en: 0.88,
  ml: 0.78,
  pa: 0.85,
}

// Audio cache — avoids re-fetching same text+lang combos
const audioCache = new Map()
const MAX_CACHE = 30

// Currently playing audio
let currentAudio = null

/**
 * Main speak function — tries Bhashini first, falls back to browser
 * @param {string} text
 * @param {string} lang - 'hi' | 'ta' | 'te' | 'kn' | 'bn' | 'mr' | 'gu' | 'en'
 * @param {function} onEnd - called when speech finishes
 */
export async function speakBhashini(text, lang = 'hi', onEnd = null) {
  if (!text?.trim()) { onEnd?.(); return }

  stopSpeaking()

  const cacheKey = `${lang}:${text}`

  try {
    let audioBlob

    if (audioCache.has(cacheKey)) {
      audioBlob = audioCache.get(cacheKey)
    } else {
      const response = await fetch(`${API_BASE}/api/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
        signal: AbortSignal.timeout(12000),
      })

      if (!response.ok) throw new Error(`TTS API ${response.status}`)

      audioBlob = await response.blob()

      // Evict oldest if cache is full
      if (audioCache.size >= MAX_CACHE) {
        audioCache.delete(audioCache.keys().next().value)
      }
      audioCache.set(cacheKey, audioBlob)
    }

    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    currentAudio = audio

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      currentAudio = null
      onEnd?.()
    }

    audio.onerror = () => {
      currentAudio = null
      speakBrowser(text, lang, onEnd)
    }

    await audio.play()

  } catch (err) {
    console.warn(`Bhashini TTS failed for [${lang}], using browser fallback:`, err.message)
    speakBrowser(text, lang, onEnd)
  }
}

/**
 * Browser SpeechSynthesis fallback — picks best available voice
 */
export function speakBrowser(text, lang = 'hi', onEnd = null) {
  if (!('speechSynthesis' in window)) { onEnd?.(); return }

  window.speechSynthesis.cancel()

  const u = new SpeechSynthesisUtterance(text)
  u.lang = VOICE_LANG[lang] || 'hi-IN'
  u.rate = BROWSER_RATE[lang] || 0.85
  u.pitch = 1.05

  // Try to find the best matching installed voice
  const voices = window.speechSynthesis.getVoices()
  const langPrefix = (VOICE_LANG[lang] || 'hi-IN').split('-')[0]

  // Priority: exact lang+region > lang only > any voice
  const exactMatch = voices.find(v => v.lang === VOICE_LANG[lang])
  const langMatch = voices.find(v => v.lang.startsWith(langPrefix))
  if (exactMatch) u.voice = exactMatch
  else if (langMatch) u.voice = langMatch

  if (onEnd) u.onend = onEnd
  window.speechSynthesis.speak(u)
}

/**
 * Stop any currently playing TTS audio
 */
export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Preload/warm up TTS connection on page load
 * Avoids cold-start delay on first real utterance
 */
export async function warmupTTS(lang = 'hi') {
  try {
    await fetch(`${API_BASE}/api/tts/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '.', lang }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Silent — fallback will handle it
  }
}

/**
 * Test all languages — useful during development
 * Call from browser console: import('/src/services/tts.js').then(m => m.testAllLanguages())
 */
export async function testAllLanguages() {
  const tests = [
    { lang: 'hi', text: 'नमस्ते! मैं Scheme AI हूँ।' },
    { lang: 'ta', text: 'வணக்கம்! நான் Scheme AI.' },
    { lang: 'te', text: 'నమస్కారం! నేను Scheme AI.' },
    { lang: 'kn', text: 'ನಮಸ್ಕಾರ! ನಾನು Scheme AI.' },
    { lang: 'bn', text: 'নমস্কার! আমি Scheme AI।' },
    { lang: 'mr', text: 'नमस्कार! मी Scheme AI आहे.' },
    { lang: 'gu', text: 'નમસ્તે! હું Scheme AI છું.' },
    { lang: 'en', text: 'Hello! I am Scheme AI.' },
  ]

  for (const { lang, text } of tests) {
    console.log(`Testing ${lang}...`)
    await new Promise(resolve => speakBhashini(text, lang, resolve))
    await new Promise(r => setTimeout(r, 500))
  }
  console.log('All language tests complete!')
}