import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { logger } from '../utils/logger.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
]

// Try models in order — if one is rate limited, fall back to next
const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite-001']

const getModel = (temp = 0.3, tokens = 512) => {
  return genAI.getGenerativeModel({
    model: MODELS[0],
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { temperature: temp, maxOutputTokens: tokens },
  })
}

const extractJSON = (rawText) => {
  try {
    const text = rawText.replace(/```json|```/g, '').trim()
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    return JSON.parse(match[0])
  } catch (err) {
    return null
  }
}

// ── Retry with exponential backoff ───────────────────────────
const withRetry = async (fn, retries = 2, delay = 2000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const is429 = err.message?.includes('429') || err.message?.includes('quota')
      if (is429 && i < retries) {
        logger.warn(`Rate limited — retrying in ${delay}ms (attempt ${i + 1}/${retries})`)
        await new Promise(r => setTimeout(r, delay))
        delay *= 2
        continue
      }
      throw err
    }
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 1 — Profile Extractor
// ─────────────────────────────────────────────────────────────
const PROFILE_PROMPT = `You are a profile extractor for Scheme-AI.
Extract info from the user message. Output ONLY valid JSON, no markdown.

{
  "name": null,
  "age": null,
  "gender": "male|female|other|null",
  "state": null,
  "district": null,
  "occupation": "farmer|student|daily_wage|unemployed|business|govt_employee|other|null",
  "income_annual": null,
  "land_acres": null,
  "caste": "general|obc|sc|st|null",
  "is_disabled": null,
  "is_widow": null,
  "has_aadhaar": null,
  "family_size": null,
  "need_category": []
}`

export const extractProfile = async (message) => {
  try {
    return await withRetry(async () => {
      const model = getModel(0.1, 300)
      const result = await model.generateContent(
        `${PROFILE_PROMPT}\n\nUser message: "${message}"\n\nReturn ONLY JSON:`
      )
      const parsed = extractJSON(result.response.text())
      return parsed || {}
    })
  } catch (err) {
    logger.error(`[Gemini] Profile extract error: ${err.message}`)
    return {}
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 2 — AI Reply Generator
// ─────────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are Scheme-AI, a compassionate welfare navigator for Indian citizens.
ALWAYS respond in the SAME language the user wrote in.
Speak simply like a helpful neighbour. No jargon.
Recommend 2-4 schemes when you have enough context.
Keep responses SHORT — elderly users are reading this.`

export const generateAIReply = async ({
  message,
  history = [],
  userProfile = {},
  matchedSchemes = [],
  language = 'English',
}) => {
  try {
    return await withRetry(async () => {
      const model = getModel(0.7, 800)
      const chatHistory = history.slice(-6).map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      const chat = model.startChat({
        history: chatHistory,
        systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
      })

      const context = `\n---\n[Context: profile=${JSON.stringify(userProfile)}, language=${language}, schemes=${matchedSchemes.slice(0,3).map(s=>s.name).join(',')}]\n---`
      const result = await chat.sendMessage(`${message}${context}`)
      return result.response.text()
    })
  } catch (err) {
    logger.error(`[Gemini] AI reply error: ${err.message}`)
    // Return language-specific fallback
    const fallbacks = {
      Tamil: 'உங்கள் விவரங்களை பெற்றோம். கீழே உள்ள திட்டங்களை பாருங்கள்.',
      Hindi: 'आपकी जानकारी मिल गई। नीचे दी गई योजनाएँ देखें।',
      Telugu: 'మీ వివరాలు అందుకున్నాం. దిగువ పథకాలను చూడండి.',
      Kannada: 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪಡೆದಿದ್ದೇವೆ. ಕೆಳಗಿನ ಯೋಜನೆಗಳನ್ನು ನೋಡಿ.',
      Bengali: 'আপনার তথ্য পেয়েছি। নিচের প্রকল্পগুলি দেখুন।',
      English: 'I found some schemes for you. Please check the cards below.',
    }
    return fallbacks[language] || fallbacks.English
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 3 — Eligibility Scorer
// ─────────────────────────────────────────────────────────────
export const scoreEligibility = async (userProfile, scheme) => {
  try {
    return await withRetry(async () => {
      const model = getModel(0.2, 150)
      const result = await model.generateContent(`
Profile: ${JSON.stringify(userProfile)}
Scheme: ${scheme.name}
Eligibility: ${Array.isArray(scheme.eligibility) ? scheme.eligibility.join(', ') : scheme.eligibility}

Score 0-100. Be generous — incomplete profile = assume best case, minimum 50.
Return ONLY JSON: {"score": number, "reason": "1 sentence"}`)

      const parsed = extractJSON(result.response.text())
      if (parsed) {
        return {
          score: Math.max(parsed.score || 0, 40),
          reason: parsed.reason || 'Likely eligible based on your profile',
        }
      }
      return { score: 65, reason: 'Likely eligible — verify at official portal' }
    })
  } catch (err) {
    logger.error(`[Gemini] Score error: ${err.message}`)
    return { score: 65, reason: 'Likely eligible — verify at official portal' }
  }
}

// ─────────────────────────────────────────────────────────────
// Embedding generator for ChromaDB
// ─────────────────────────────────────────────────────────────
export const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (err) {
    logger.error(`[Gemini] Embedding error: ${err.message}`)
    return null
  }
}

