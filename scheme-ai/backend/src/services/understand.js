// backend/src/services/understand.js  (NEW)
// Turns messy typed / spoken input into: corrected text, intent, profile updates.
import { callGroq, extractJSON } from './llm.js'
import { canonicalState, fuzzyProfile } from './fuzzy.js'
import { extractProfileFromText, mergeProfile } from './profileExtractor.js'
import { logger } from '../utils/logger.js'

const OCC = ['farmer', 'student', 'daily_wage', 'unemployed', 'business', 'govt_employee', 'other']
const CASTE = ['general', 'obc', 'sc', 'st']
const GENDER = ['male', 'female', 'other']
const NEEDS = ['health', 'education', 'housing', 'employment', 'women_child', 'finance', 'agriculture', 'pension']
const INTENTS = ['find_schemes', 'scheme_detail', 'how_to_apply', 'documents_needed', 'update_profile', 'greeting', 'off_topic', 'unclear']

const SYSTEM = `You are the understanding module of Scheme-AI, an Indian government welfare assistant.
Users are often low-literacy, make spelling mistakes, mix languages (Hinglish, Tanglish), type Indian
languages in English letters, or their speech-to-text is garbled. Work out what they MEANT, not what they typed.

Return ONLY JSON:
{
 "corrected_text": "message rewritten cleanly, same language as the user",
 "english_text": "clean English version for searching",
 "intent": "find_schemes|scheme_detail|how_to_apply|documents_needed|update_profile|greeting|off_topic|unclear",
 "profile_updates": {
   "age": number|null, "gender": "male|female|other"|null, "state": "English state name"|null,
   "occupation": "farmer|student|daily_wage|unemployed|business|govt_employee|other"|null,
   "income_annual": number|null, "land_acres": number|null, "caste": "general|obc|sc|st"|null,
   "is_disabled": true|null, "is_widow": true|null, "family_size": number|null,
   "need_category": ["health|education|housing|employment|women_child|finance|agriculture|pension"]
 },
 "referenced_scheme": "scheme name the user is asking about, or null",
 "confidence": 0.0-1.0,
 "clarifying_question": "ONE simple question in the user's language, or null"
}

Rules:
- Fix typos and phonetic spellings: farmar/kisaan/vivasayi -> farmer, pention -> pension, scolarship -> scholarship, vidhva -> widow.
- Only fill fields the user stated or clearly implied. NEVER invent values.
- "my husband died" -> is_widow true, gender female. "5 lakh" -> 500000. "sixty years" -> 60. "12 pass" is education, not age.
- If several transcriptions of the same speech are given, choose the most plausible meaning.
- If garbled but a plausible meaning exists, choose it and set confidence below 0.6.
- If truly unintelligible: intent "unclear" and write a friendly clarifying_question.
- Extract occupation and caste even from very short messages: "student scolarship sc categry" -> occupation student, caste sc.
- Do NOT guess gender from grammar or verb endings. Set gender only from explicit words (woman, girl, widow, "my husband died", etc.).
- A bare answer to a question we asked (e.g. just a state name or a number) is intent "update_profile".
- Use conversation history to resolve "it", "that scheme", "and for my wife?".
- Questions about schemes, money, help, documents, applying = never "off_topic".`


const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null }

function cleanUpdates(p = {}) {
  const out = {}
  const age = num(p.age); if (age && age < 120) out.age = Math.round(age)
  if (GENDER.includes(p.gender)) out.gender = p.gender
  const st = canonicalState(p.state); if (st) out.state = st
  if (OCC.includes(p.occupation)) out.occupation = p.occupation
  if (CASTE.includes(p.caste)) out.caste = p.caste
  for (const k of ['income_annual', 'land_acres', 'family_size']) { const n = num(p[k]); if (n) out[k] = n }
  if (p.is_disabled === true) out.is_disabled = true
  if (p.is_widow === true) out.is_widow = true
  if (Array.isArray(p.need_category)) {
    const n = p.need_category.filter((x) => NEEDS.includes(x))
    if (n.length) out.need_category = n
  }
  return out
}

const hasSignal = (u) => Object.keys(u).length > 0

function fallback(message) {
  const merged = mergeProfile(mergeProfile({}, extractProfileFromText(message)), fuzzyProfile(message))
  const updates = cleanUpdates(merged)
  return {
    corrected_text: message,
    english_text: message,
    intent: hasSignal(updates) ? 'find_schemes' : 'unclear',
    profile_updates: updates,
    referenced_scheme: null,
    confidence: 0.4,
    clarifying_question: null,
    _fallback: true,
  }
}

export async function understand({ message, alternatives = [], history = [], profile = {}, language = 'English' }) {
  const safeProfile = Object.fromEntries(Object.entries(profile).filter(([k]) => !k.startsWith('_')))
  const alts = alternatives.length > 1
    ? `Several possible transcriptions of the same speech:\n${alternatives.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    : `User message: """${message}"""`

  try {
    const text = await callGroq([
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `UI language: ${language}\nKnown profile: ${JSON.stringify(safeProfile)}\n` +
          `Recent history: ${JSON.stringify(history.slice(-6).map((m) => ({ role: m.role, content: String(m.content).slice(0, 300) })))}\n${alts}`,
      },
    ], { temperature: 0.1, maxTokens: 500, json: true })

    const j = extractJSON(text)
    if (!j) throw new Error('bad json')

    const updates = cleanUpdates(j.profile_updates)
    // Safety net: fill fields the LLM missed using the offline extractors
    const backup = cleanUpdates(mergeProfile(extractProfileFromText(message), fuzzyProfile(message)))
    for (const [k, v] of Object.entries(backup)) {
      if (k === 'need_category' || k === 'gender') continue
      if (updates[k] === undefined) updates[k] = v
    }
    let intent = INTENTS.includes(j.intent) ? j.intent : (hasSignal(updates) ? 'find_schemes' : 'unclear')
    // Safety net: never let "off_topic" swallow a message where we found a real signal
    if (intent === 'off_topic' && hasSignal(updates)) intent = 'find_schemes'

    return {
      corrected_text: j.corrected_text || message,
      english_text: j.english_text || j.corrected_text || message,
      intent,
      profile_updates: updates,
      referenced_scheme: j.referenced_scheme || null,
      confidence: Math.min(Math.max(Number(j.confidence) || 0.5, 0), 1),
      clarifying_question: j.clarifying_question || null,
    }
  } catch (err) {
    logger.warn(`understand() failed, using fuzzy fallback: ${err.message}`)
    return fallback(message)
  }
}