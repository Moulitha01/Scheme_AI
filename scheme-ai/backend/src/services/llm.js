// backend/src/services/llm.js  (NEW)
// One place for: Groq client, JSON helpers, speech cleaner,
// grounded reply generation and scheme localisation.
import Groq from 'groq-sdk'
import { logger } from '../utils/logger.js'

// Lazy client: index.js calls dotenv.config() AFTER imports are evaluated,
// so creating the client at module top can see an undefined key.
let _groq
const client = () => (_groq ??= new Groq({ apiKey: process.env.GROQ_API_KEY }))

// llama-3.3-70b is NOT a reasoning model, so max_tokens is not eaten by hidden
// "thinking" tokens (that is what made short JSON calls return empty on gpt-oss).

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const LANG_CODE = {
  English: 'en', Hindi: 'hi', Tamil: 'ta', Telugu: 'te', Bengali: 'bn', Marathi: 'mr',
  Kannada: 'kn', Gujarati: 'gu', Malayalam: 'ml', Punjabi: 'pa', Urdu: 'ur', Odia: 'or',
}

export async function callGroq(messages, { temperature = 0.3, maxTokens = 400, json = false, model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b' } = {}) {  const reasoning = /gpt-oss/i.test(model)
  let useJson = json
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client().chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: reasoning ? maxTokens + 1000 : maxTokens,
        ...(reasoning ? { reasoning_effort: 'low' } : {}),
        ...(useJson ? { response_format: { type: 'json_object' } } : {}),
      })
      return res.choices[0]?.message?.content || ''
    } catch (err) {
      // model rejected JSON mode -> retry once as plain text (extractJSON still parses it)
      if (err?.status === 400 && useJson) {
        logger.warn(`JSON mode rejected by ${model}, retrying as plain text`)
        useJson = false
        continue
      }
      const retryable = err?.status === 429 || err?.status >= 500
      if (retryable && attempt < 2) {
        logger.warn(`Groq ${err.status} — retry ${attempt + 1}`)
        await sleep((attempt + 1) * 1500)
        continue
      }
      throw err
    }
  }
  return ''
}

export function extractJSON(text = '') {
  try { return JSON.parse(text) } catch { /* try harder */ }
  try {
    const m = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch { /* ignore */ }
  return null
}

export function extractJSONArray(text = '') {
  try {
    const m = text.replace(/```json|```/g, '').match(/\[[\s\S]*\]/)
    if (m) return JSON.parse(m[0])
  } catch { /* ignore */ }
  return null
}

// Strip everything a TTS engine would read aloud badly.
export function cleanForSpeech(text = '') {
  return String(text)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/[*_#`>~|]+/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─────────────────────────────────────────────────────────────
// Grounded reply — the model may ONLY talk about schemes in FACTS
// ─────────────────────────────────────────────────────────────
const SITUATION_RULES = {
  schemes: 'Use ONLY the schemes listed under FACTS. Never invent a scheme, amount, date or link.',
  detail: 'Answer the question using ONLY FACTS (benefit, documents, how to apply). If a detail is missing, say to confirm it at the nearest CSC / gram panchayat / official portal. Never guess.',
  greeting: 'Greet warmly in one sentence and ask what help they need (for example pension, scholarship, farming, health, housing).',
  off_topic: 'Politely say you only help with government welfare schemes, then give 3 very short example questions they can ask.',
  no_match: 'Honestly say you did not find a good match yet. Ask for ONE missing detail that would help most.',
  ask: 'You need a little more information before searching. Ask exactly ONE simple question and nothing else.',
  unclear: 'Say briefly what you did understand (if anything), then ask ONE simple question to clarify.',
}

const FIELD_LABEL = { state: 'which state they live in', occupation: 'what work they do', age: 'their age' }

export async function generateGroundedReply({
  message, understood, confidence = 1, history = [], profile = {}, schemes = [],
  language = 'English', mode = 'text', situation = 'schemes', nextField = null, hint = '',
}) {
  const voice = mode === 'voice'
  const facts = schemes.slice(0, 3).map((s, i) =>
    `${i + 1}. ${s.name} | Benefit: ${s.benefit || 'n/a'} | Why they fit: ${s.reason || 'n/a'}` +
    (s.documents?.length ? ` | Documents: ${s.documents.slice(0, 5).join(', ')}` : '') +
    (s.eligibilityCriteria?.length ? ` | Rules: ${s.eligibilityCriteria.slice(0, 3).join('; ')}` : '') +
    (s.applyLink ? ' | Apply: online portal (shown on the card)' : ' | Apply: nearest office / CSC')
  ).join('\n')

  // The UI already shows an "I understood: ..." line from the `understood` field,
  // so only echo in the spoken reply when the model is genuinely unsure.
  const echo = (confidence < 0.75)
    ? `Start with one short sentence, in ${language}, saying what you understood (for example "I understood that you are a farmer in Tamil Nadu who needs a loan"), then continue. `
    : ''

  const style = voice
    ? 'VOICE MODE: it will be read aloud to an elderly person. Maximum 3 short sentences. Plain words. No lists, no markdown, no symbols, no emojis, no web addresses. Name the single best scheme first, say what they get, then give one next step. Then ask if they want to hear the next scheme.'
    : 'TEXT MODE: maximum 4 short sentences. Name at most the top 2 schemes and what each gives. No markdown, no web links (cards below your message show them).'

    const system = `You are Scheme-AI, a kind helper for Indian citizens who may have little education.
Reply ONLY in ${language}. Use simple everyday words, like a helpful neighbour. No jargon.
Write in flowing sentences only. Never use numbered lists, bullet points or line breaks.
Only say the person qualifies if what you know about them clearly matches that scheme's Rules. Otherwise say "you may qualify if ..." and name the condition (for example an age range or a degree).
${style}
${echo}${SITUATION_RULES[situation] || SITUATION_RULES.schemes}
${nextField ? `After answering, ask ONE simple question about ${FIELD_LABEL[nextField] || nextField}.` : ''}
${hint ? `Suggested clarifying question (rephrase in ${language}): ${hint}` : ''}

Known about the person: ${JSON.stringify(Object.fromEntries(Object.entries(profile).filter(([k, v]) => !k.startsWith('_') && v !== null && v !== undefined && v !== false && !(Array.isArray(v) && !v.length))))}
FACTS:
${facts || '(no schemes)'}`

  const msgs = [
    { role: 'system', content: system },
    ...history.slice(-4).map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: message },
  ]
  return (await callGroq(msgs, { temperature: 0.4, maxTokens: voice ? 220 : 420 })).trim()
}

// ─────────────────────────────────────────────────────────────
// ONE call: translate name / ministry / benefit / reason
// ─────────────────────────────────────────────────────────────
export async function localizeSchemes(schemes, language = 'English') {
  if (!schemes?.length || language === 'English') return schemes
  try {
    const payload = schemes.map((s, i) => ({ i, name: s.name, ministry: s.ministry, benefit: s.benefit, reason: s.reason }))
    const text = await callGroq([
      {
        role: 'system',
        content: `Translate Indian government scheme details into ${language} for elderly, low-literacy readers.
Fields: name, ministry, benefit, reason. Keep ₹ amounts and numbers exactly. Well-known abbreviations (PM-KISAN, PM-JAY, MGNREGA) may stay, but translate the words around them.
Return ONLY a JSON array in the same order: [{"i":0,"name":"","ministry":"","benefit":"","reason":""}]`,
      },
      { role: 'user', content: JSON.stringify(payload) },
    ], { temperature: 0.2, maxTokens: 1500 })

    const arr = extractJSONArray(text)
    if (!Array.isArray(arr)) return schemes
    return schemes.map((s, idx) => {
      const m = arr.find((p) => p.i === idx) || arr[idx]
      return m ? {
        ...s,
        name: m.name || s.name,
        ministry: m.ministry || s.ministry,
        benefit: m.benefit || s.benefit,
        reason: m.reason || s.reason,
      } : s
    })
  } catch (err) {
    logger.warn(`localizeSchemes failed: ${err.message}`)
    return schemes
  }
}