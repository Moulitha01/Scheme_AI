// backend/src/routes/stt.js  (NEW)  —  npm i multer
import express from 'express'
import multer from 'multer'
import Groq, { toFile } from 'groq-sdk'
import { LANG_CODE } from '../services/llm.js'
import { logger } from '../utils/logger.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

let _groq
const client = () => (_groq ??= new Groq({ apiKey: process.env.GROQ_API_KEY }))

// Whisper has no official Odia support, so we let it auto-detect for Odia.
const WHISPER_UNSUPPORTED = new Set(['or'])
const BIAS_PROMPT = 'Indian government schemes: PM-KISAN, Ayushman Bharat, MGNREGA, pension, scholarship, ration card, Aadhaar, widow, farmer.'

router.post('/', upload.single('audio'), async (req, res) => {
  if (!req.file?.buffer?.length) return res.status(400).json({ error: 'No audio' })
  try {
    const raw = String(req.body.lang || '')
    const code = LANG_CODE[raw] || raw.toLowerCase()
    const ext = /mp4/.test(req.file.mimetype) ? 'mp4' : /ogg/.test(req.file.mimetype) ? 'ogg' : 'webm'
    const file = await toFile(req.file.buffer, `speech.${ext}`, { type: req.file.mimetype })

    const out = await client().audio.transcriptions.create({
      file,
      model: process.env.STT_MODEL || 'whisper-large-v3',
      ...(code && !WHISPER_UNSUPPORTED.has(code) ? { language: code } : {}),
      prompt: BIAS_PROMPT,
      response_format: 'verbose_json',
      temperature: 0,
    })

    const segs = out.segments || []
    // Whisper "hears" phrases like "thanks for watching" in silence; drop those.
    const silent = segs.length > 0 && segs.every((s) => s.no_speech_prob > 0.6)
    const confidence = segs.length
      ? Math.exp(segs.reduce((a, s) => a + s.avg_logprob, 0) / segs.length)
      : null

    res.json({ text: silent ? '' : (out.text || '').trim(), confidence })
  } catch (err) {
    logger.error(`STT error: ${err.message}`)
    res.status(500).json({ error: 'stt_failed' })
  }
})

export default router