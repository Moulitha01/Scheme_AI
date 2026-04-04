// backend/src/services/gemini.js
// Drop-in Groq replacement — same exports as before, nothing else changes
import Groq from 'groq-sdk'
import { logger } from '../utils/logger.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile' // best free model on Groq

// ── Helper: call Groq with retry ──────────────────────────────
async function callGroq(messages, { temperature = 0.3, maxTokens = 512 } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      })
      return res.choices[0]?.message?.content || ''
    } catch (err) {
      const is429 = err?.status === 429 || err?.message?.includes('rate')
      if (is429 && attempt < 2) {
        const wait = (attempt + 1) * 2000
        logger.warn(`Groq rate limit — retrying in ${wait}ms`)
        await new Promise(r => setTimeout(r, wait))
        continue
      }
      throw err
    }
  }
}

// ── Helper: extract JSON from text ───────────────────────────
function extractJSON(text) {
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch { /* ignore */ }
  return null
}

// ─────────────────────────────────────────────────────────────
// LAYER 1 — Profile Extractor
// ─────────────────────────────────────────────────────────────
export const extractProfile = async (message) => {
  try {
    const text = await callGroq([
      {
        role: 'system',
        content: `You are a profile extractor for an Indian government scheme assistant.
Extract structured info from user messages. User may write in any Indian language.
Return ONLY valid JSON, no markdown, no explanation.
Fields (use null if not mentioned):
{
  "name": string|null,
  "age": number|null,
  "gender": "male"|"female"|"other"|null,
  "state": "state name in English"|null,
  "district": string|null,
  "occupation": "farmer"|"student"|"daily_wage"|"unemployed"|"business"|"govt_employee"|"other"|null,
  "income_annual": number|null,
  "land_acres": number|null,
  "caste": "general"|"obc"|"sc"|"st"|null,
  "is_disabled": boolean|null,
  "is_widow": boolean|null,
  "has_aadhaar": boolean|null,
  "family_size": number|null,
  "need_category": []
}`,
      },
      { role: 'user', content: `Message: "${message}"\n\nReturn ONLY JSON:` },
    ], { temperature: 0.1, maxTokens: 300 })

    const parsed = extractJSON(text)
    return parsed || {}
  } catch (err) {
    logger.error(`[Groq] Profile extract error: ${err.message}`)
    return {}
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 2 — AI Reply Generator
// ─────────────────────────────────────────────────────────────
export const generateAIReply = async ({
  message,
  history = [],
  userProfile = {},
  matchedSchemes = [],
  language = 'English',
}) => {
  try {
    const schemeNames = matchedSchemes.slice(0, 4).map(s => s.name).join(', ')

    const systemPrompt = `You are Scheme-AI, a compassionate welfare navigator for Indian citizens.
CRITICAL: ALWAYS respond in ${language} language only. Never switch languages.
Speak simply like a helpful neighbour. No bureaucratic jargon.
Keep response SHORT — 2-3 sentences max. Elderly users are reading this.
${matchedSchemes.length > 0 ? `Matched schemes: ${schemeNames}` : ''}
User profile: age=${userProfile.age || '?'}, occupation=${userProfile.occupation || '?'}, state=${userProfile.state || '?'}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const reply = await callGroq(messages, { temperature: 0.7, maxTokens: 300 })
    return reply || getFallbackReply(language, matchedSchemes.length, userProfile.name)
  } catch (err) {
    logger.error(`[Groq] AI reply error: ${err.message}`)
    return getFallbackReply(language, matchedSchemes.length, userProfile.name)
  }
}

function getFallbackReply(language, count, name) {
  const n = name ? `${name}, ` : ''
  const replies = {
    Tamil:   `${n}வணக்கம்! உங்களுக்கு ${count} திட்டம் கண்டறியப்பட்டது. கீழே பாருங்கள்.`,
    Hindi:   `${n}नमस्ते! आपके लिए ${count} योजनाएँ मिली हैं। नीचे देखें।`,
    Telugu:  `${n}నమస్కారం! మీకు ${count} పథకాలు దొరికాయి.`,
    Kannada: `${n}ನಮಸ್ಕಾರ! ನಿಮಗೆ ${count} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.`,
    Bengali: `${n}নমস্কার! আপনার জন্য ${count}টি প্রকল্প পাওয়া গেছে।`,
    Marathi: `${n}नमस्कार! तुमच्यासाठी ${count} योजना सापडल्या.`,
    English: `${n}Hello! I found ${count} scheme${count !== 1 ? 's' : ''} for you. Please check below.`,
  }
  return replies[language] || replies.English
}

// ─────────────────────────────────────────────────────────────
// LAYER 3 — Eligibility Scorer
// ─────────────────────────────────────────────────────────────
export const scoreEligibility = async (userProfile, scheme) => {
  try {
    const text = await callGroq([
      {
        role: 'system',
        content: `You are an eligibility scorer for Indian government schemes.
Score from 0-100. Be GENEROUS — incomplete profile = assume best case, minimum 45.
Return ONLY JSON: {"score": number, "reason": "one short sentence"}`,
      },
      {
        role: 'user',
        content: `Profile: ${JSON.stringify(userProfile)}
Scheme: ${scheme.name}
Eligibility criteria: ${Array.isArray(scheme.eligibility) ? scheme.eligibility.join(', ') : scheme.eligibility}
Return ONLY JSON:`,
      },
    ], { temperature: 0.1, maxTokens: 100 })

    const parsed = extractJSON(text)
    if (parsed?.score !== undefined) {
      return {
        score: Math.max(parsed.score, 40),
        reason: parsed.reason || 'Likely eligible based on your profile',
      }
    }
    return { score: 65, reason: 'Likely eligible — verify at official portal' }
  } catch (err) {
    logger.error(`[Groq] Score error: ${err.message}`)
    return { score: 65, reason: 'Likely eligible — verify at official portal' }
  }
}

// ─────────────────────────────────────────────────────────────
// Embedding generator — Groq doesn't have embeddings
// Use simple TF-IDF style hash for ChromaDB fallback
// MongoDB text search works fine without real embeddings
// ─────────────────────────────────────────────────────────────
export const generateEmbedding = async (text) => {
  // Groq has no embedding API — return null to use MongoDB fallback
  // ChromaDB will be skipped, MongoDB text search handles everything
  return null
}