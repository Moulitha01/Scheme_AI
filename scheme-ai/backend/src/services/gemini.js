// backend/src/services/gemini.js
// Drop-in Groq replacement — same exports as before, plus scheme-field translation
import Groq from 'groq-sdk'
import { logger } from '../utils/logger.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'openai/gpt-oss-120b' // best free model on Groq

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

// ── Helper: extract JSON object from text ─────────────────────
function extractJSON(text) {
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch { /* ignore */ }
  return null
}

// ── Helper: extract JSON array from text ──────────────────────
function extractJSONArray(text) {
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
  } catch { /* ignore */ }
  return null
}

// ── Per-language fallback strings (used only if Groq call fails) ──
const FALLBACK_REASONS = {
  Tamil:   'தகுதி இருக்கலாம் — அதிகாரப்பூர்வ போர்ட்டலில் சரிபார்க்கவும்',
  Hindi:   'पात्र हो सकते हैं — आधिकारिक पोर्टल पर सत्यापित करें',
  Telugu:  'అర్హత ఉండవచ్చు — అధికారిక పోర్టల్‌లో ధృవీకరించండి',
  Kannada: 'ಅರ್ಹತೆ ಇರಬಹುದು — ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ',
  Bengali: 'যোগ্য হতে পারেন — অফিসিয়াল পোর্টালে যাচাই করুন',
  Marathi: 'पात्र असू शकता — अधिकृत पोर्टलवर तपासा',
  Gujarati:'પાત્ર હોઈ શકો છો — સત્તાવાર પોર્ટલ પર ચકાસો',
  Malayalam:'യോഗ്യത ഉണ്ടാകാം — ഔദ്യോഗിക പോർട്ടലിൽ പരിശോധിക്കുക',
  Punjabi: 'ਯੋਗ ਹੋ ਸਕਦੇ ਹੋ — ਅਧਿਕਾਰਤ ਪੋਰਟਲ ਤੇ ਪੁਸ਼ਟੀ ਕਰੋ',
  Urdu:    'اہل ہو سکتے ہیں — آفیشل پورٹل پر تصدیق کریں',
  Odia:    'ଯୋଗ୍ୟ ହୋଇପାରନ୍ତି — ସରକାରୀ ପୋର୍ଟାଲରେ ଯାଞ୍ଚ କରନ୍ତୁ',
  English: 'Likely eligible — verify at official portal',
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
// Now takes `language` so the "reason" comes back already
// written in the user's chosen language — no separate
// translation pass needed for this field.
// ─────────────────────────────────────────────────────────────
export const scoreEligibility = async (userProfile, scheme, language = 'English') => {
  try {
    const text = await callGroq([
      {
        role: 'system',
        content: `You are an eligibility scorer for Indian government schemes.
Score from 0-100. Be GENEROUS — incomplete profile = assume best case, minimum 45.
Write the "reason" as one short, simple sentence in ${language} language (not English, unless ${language} is English).
Return ONLY JSON: {"score": number, "reason": "one short sentence in ${language}"}`,
      },
      {
        role: 'user',
        content: `Profile: ${JSON.stringify(userProfile)}
Scheme: ${scheme.name}
Eligibility criteria: ${Array.isArray(scheme.eligibility) ? scheme.eligibility.join(', ') : scheme.eligibility}
Return ONLY JSON, with "reason" written in ${language}:`,
      },
    ], { temperature: 0.2, maxTokens: 120 })

    const parsed = extractJSON(text)
    if (parsed?.score !== undefined) {
      return {
        score: Math.max(parsed.score, 40),
        reason: parsed.reason || (FALLBACK_REASONS[language] || FALLBACK_REASONS.English),
      }
    }
    return { score: 65, reason: FALLBACK_REASONS[language] || FALLBACK_REASONS.English }
  } catch (err) {
    logger.error(`[Groq] Score error: ${err.message}`)
    return { score: 65, reason: FALLBACK_REASONS[language] || FALLBACK_REASONS.English }
  }
}

// ─────────────────────────────────────────────────────────────
// NEW — Scheme field translator
// Batches all matched schemes into ONE Groq call and translates
// their name / ministry / benefit into the user's chosen language.
// Skips the call entirely when language is English (no-op, no cost).
// If translation fails for any reason, returns the original
// (English) schemes untouched — the UI never breaks, it just
// falls back to English for that turn.
// ─────────────────────────────────────────────────────────────
export const translateSchemeFields = async (schemes, language = 'English') => {
  if (!schemes?.length || language === 'English') return schemes

  try {
    const payload = schemes.map((s, i) => ({
      i,
      name: s.name,
      ministry: s.ministry,
      benefit: s.benefit,
    }))

    const text = await callGroq([
      {
        role: 'system',
        content: `You translate Indian government welfare scheme details into ${language} for elderly, low-literacy readers.
Translate "name", "ministry", and "benefit" naturally into ${language}.
Keep ₹ amounts exactly as given. If a scheme name is a widely-recognized official abbreviation (like PM-KISAN, PM-JAY, BPL), you may keep that abbreviation but still translate any surrounding descriptive words.
Return ONLY a JSON array, same length and same order as the input, in this exact shape:
[{"i": number, "name": "...", "ministry": "...", "benefit": "..."}]
No markdown, no explanation, no extra text.`,
      },
      {
        role: 'user',
        content: `Schemes:\n${JSON.stringify(payload)}\n\nReturn ONLY the JSON array, translated into ${language}:`,
      },
    ], { temperature: 0.2, maxTokens: 1000 })

    const parsed = extractJSONArray(text)
    if (!Array.isArray(parsed) || parsed.length === 0) return schemes

    return schemes.map((s, idx) => {
      const match = parsed.find(p => p.i === idx) || parsed[idx]
      if (!match) return s
      return {
        ...s,
        name: match.name || s.name,
        ministry: match.ministry || s.ministry,
        benefit: match.benefit || s.benefit,
      }
    })
  } catch (err) {
    logger.error(`[Groq] Scheme translation error: ${err.message}`)
    return schemes // fail safe — English fallback, never a broken response
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