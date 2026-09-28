// backend/src/routes/tts.js
import express from 'express'
import crypto from 'node:crypto'
import rateLimit from 'express-rate-limit'
import { logger } from '../utils/logger.js'

const router = express.Router()

// ---------------------------------------------------------------------------
// Config
// NOTE: verify the endpoint, request body and voice names against Bhashini's
// current docs. Override the URL via .env (BHASHINI_TTS_URL) if it changes.
// ---------------------------------------------------------------------------
const BHASHINI_TTS_URL = process.env.BHASHINI_TTS_URL || 'https://tts.bhashini.ai/v1/synthesize'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_CHARS = 600 // long replies are cut at a sentence boundary
const CACHE_MAX = 200 // number of audio clips kept in memory

// Full language name for the Bhashini API
const LANG_TO_BHASHINI = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  en: 'English',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
  as: 'Assamese',
}

// Voice per language. Female2 for Dravidian languages is an unverified guess:
// have a native speaker listen to both voices and change this if needed.
const LANG_VOICE = {
  hi: 'Female1',
  ta: 'Female2',
  te: 'Female2',
  kn: 'Female2',
  bn: 'Female1',
  mr: 'Female1',
  gu: 'Female1',
  en: 'Female1',
  ml: 'Female2',
  pa: 'Female1',
  or: 'Female1',
  as: 'Female1',
}

// Playback speed hint for the FRONTEND (audio.playbackRate = rate).
// It is not sent to Bhashini because its API may not support a speed field.
const LANG_RATE = {
  hi: 1.0,
  ta: 0.9,
  te: 0.9,
  kn: 0.9,
  bn: 1.0,
  mr: 1.0,
  gu: 1.0,
  en: 1.0,
  ml: 0.9,
  pa: 1.0,
  or: 1.0,
  as: 1.0,
}

// Word for "rupees" so that "₹6,000" is spoken properly instead of skipped
const RUPEE_WORD = {
  hi: 'रुपये',
  ta: 'ரூபாய்',
  te: 'రూపాయలు',
  kn: 'ರೂಪಾಯಿ',
  bn: 'টাকা',
  mr: 'रुपये',
  gu: 'રૂપિયા',
  en: 'rupees',
  ml: 'രൂപ',
  pa: 'ਰੁਪਏ',
  or: 'ଟଙ୍କା',
  as: 'টকা',
}

// Languages that legitimately use Devanagari (do not strip it for these)
const DEVANAGARI_LANGS = new Set(['hi', 'mr'])

// ---------------------------------------------------------------------------
// Text cleaning: emoji, markdown, links, odd hyphens, stray scripts, length
// ---------------------------------------------------------------------------
export function cleanForSpeech(text, lang) {
  let t = String(text ?? '')
    .replace(/https?:\/\/\S+/g, '') // links
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu, '') // emoji
    .replace(/[*_`#>~|]/g, '') // markdown
    .replace(/[\u2010-\u2015]/g, '-') // non-breaking / fancy hyphens (PM‑KISAN)
    .replace(/₹\s?([\d,]+(?:\.\d+)?)/g, (_, n) => `${n.replace(/,/g, '')} ${RUPEE_WORD[lang] || 'rupees'}`)
    .replace(/\s+/g, ' ')
    .trim()

  // The LLM sometimes leaks Devanagari into other scripts (e.g. Tamil replies)
  if (!DEVANAGARI_LANGS.has(lang)) {
    t = t.replace(/[\u0900-\u097F]/g, '')
  }

  if (t.length <= MAX_CHARS) return t

  // Cut at the last sentence end within the limit (supports . ! ? and danda)
  const cut = t.slice(0, MAX_CHARS)
  const end = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf('!'),
    cut.lastIndexOf('?'),
    cut.lastIndexOf('।')
  )
  return end > 200 ? cut.slice(0, end + 1) : cut
}

// ---------------------------------------------------------------------------
// In-memory cache (identical text is never synthesized twice)
// ---------------------------------------------------------------------------
const cache = new Map() // key -> Buffer

function cacheGet(key) {
  const hit = cache.get(key)
  if (hit) {
    // refresh position so the most recently used clip is evicted last
    cache.delete(key)
    cache.set(key, hit)
  }
  return hit
}

function cacheSet(key, audio) {
  cache.set(key, audio)
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value)
}

// ---------------------------------------------------------------------------
// Rate limit: stops the endpoint being used as free public TTS.
// Needs: npm i express-rate-limit
// ---------------------------------------------------------------------------
const limiter = rateLimit({
  windowMs: 60_000,
  limit: 20, // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many TTS requests, please slow down', fallback: true },
})

// ---------------------------------------------------------------------------
// POST /api/tts/synthesize
// Body: { text: string, lang: 'ta' | 'hi' | 'en' | ... }
// Returns: audio/mpeg
// On failure returns JSON { error, fallback: true } so the UI can show a
// "voice unavailable" message and keep the text reply.
// ---------------------------------------------------------------------------
router.post('/synthesize', limiter, async (req, res) => {
  const { text, lang = 'hi' } = req.body ?? {}

  // Never guess the language: reading Tamil text with a Hindi voice = gibberish
  if (!LANG_TO_BHASHINI[lang]) {
    return res.status(400).json({ error: `Unsupported lang: ${lang}` })
  }

  const clean = cleanForSpeech(text, lang)
  if (!clean) {
    return res.status(400).json({ error: 'Text is required' })
  }

  const language = LANG_TO_BHASHINI[lang]
  const voiceName = LANG_VOICE[lang]
  const key = crypto.createHash('sha1').update(`${lang}|${voiceName}|${clean}`).digest('hex')

  const cached = cacheGet(key)
  if (cached) {
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.setHeader('X-TTS-Cache', 'HIT')
    return res.send(cached)
  }

  try {
    const response = await fetch(BHASHINI_TTS_URL, {
      method: 'POST',
      headers: {
        accept: 'audio/mpeg',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: clean, language, voiceName }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      logger.warn(`Bhashini TTS failed (${response.status}) for ${language}: ${errText.slice(0, 300)}`)
      return res.status(502).json({ error: 'TTS service unavailable', fallback: true })
    }

    // A 200 that carries JSON/text is an error in disguise: do not cache or play it
    const contentType = response.headers.get('content-type') || ''
    if (/json|text|html/i.test(contentType)) {
      const body = await response.text().catch(() => '')
      logger.warn(`Bhashini TTS returned non-audio (${contentType}) for ${language}: ${body.slice(0, 300)}`)
      return res.status(502).json({ error: 'TTS returned no audio', fallback: true })
    }

    // Buffer the whole clip: replies are short, and this avoids the
    // "headers already sent" crash a mid-stream failure would cause
    const audio = Buffer.from(await response.arrayBuffer())
    if (audio.length === 0) {
      logger.warn(`Bhashini TTS returned empty audio for ${language}`)
      return res.status(502).json({ error: 'TTS returned empty audio', fallback: true })
    }

    cacheSet(key, audio)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.setHeader('X-TTS-Cache', 'MISS')
    res.send(audio)
  } catch (err) {
    const timedOut = err.name === 'TimeoutError' || err.name === 'AbortError'
    logger.error(`TTS proxy error${timedOut ? ' (timeout)' : ''}: ${err.message}`)
    if (!res.headersSent) {
      res.status(timedOut ? 504 : 500).json({ error: 'TTS proxy failed', fallback: true })
    }
  }
})

// ---------------------------------------------------------------------------
// GET /api/tts/voices : supported languages, voice and playback rate hint
// ---------------------------------------------------------------------------
router.get('/voices', (req, res) => {
  res.json({
    supported: Object.keys(LANG_TO_BHASHINI),
    voices: Object.entries(LANG_VOICE).map(([code, voice]) => ({
      code,
      language: LANG_TO_BHASHINI[code],
      voice,
      rate: LANG_RATE[code], // apply in the browser: audio.playbackRate = rate
    })),
  })
})

export default router