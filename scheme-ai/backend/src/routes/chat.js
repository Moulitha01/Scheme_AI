// backend/src/routes/chat.js  (REPLACE)
// LLM calls per message: understand (1) + localize (1, non-English only) + reply (1)
// Old flow was 1 + 3 + 1 + 1 = 6, which hit Groq rate limits and felt slow.
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Session, Scheme } from '../models/index.js'
import { understand } from '../services/understand.js'
import { searchSchemes, findSchemeByName } from '../services/search.js'
import { generateGroundedReply, localizeSchemes, cleanForSpeech } from '../services/llm.js'
import { extractProfileFromText, matchSchemesByProfile, mergeProfile } from '../services/profileExtractor.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

const FALLBACK_REPLIES = {
  Tamil: (n) => `வணக்கம்! உங்களுக்கு ${n} திட்டம் கண்டறியப்பட்டது.`,
  Hindi: (n) => `नमस्ते! आपके लिए ${n} योजनाएँ मिली हैं।`,
  Telugu: (n) => `నమస్కారం! మీకు ${n} పథకాలు దొరికాయి.`,
  Kannada: (n) => `ನಮಸ್ಕಾರ! ನಿಮಗೆ ${n} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.`,
  Bengali: (n) => `নমস্কার! আপনার জন্য ${n}টি প্রকল্প পাওয়া গেছে।`,
  Marathi: (n) => `नमस्कार! तुमच्यासाठी ${n} योजना सापडल्या.`,
  English: (n) => `Hello! I found ${n} scheme${n === 1 ? '' : 's'} for you.`,
}
const fallbackReply = (lang, n) => (FALLBACK_REPLIES[lang] || FALLBACK_REPLIES.English)(n)

const normalizeName = (name = '') => name.toLowerCase()
  .replace(/pradhan mantri/g, 'pm').replace(/[-_]/g, ' ')
  .replace(/\s+(tn|tamilnadu|tamil nadu|ap|andhra|telangana|karnataka|kerala|maharashtra|gujarat|punjab|haryana|odisha|bihar|rajasthan|wb|up|mp|cg|jh|uk|hp|goa|delhi|assam)$/i, '')
  .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()

// Crawled pages leave junk like "Something went wrong. Please try again later" and garbled characters
const JUNK = /something\s*went\s*wrong|sign\s*in|feedback|cancel|sources|references|â€|ï»¿|â‚¹|Ã/i
const cleanCriteria = (arr) => (Array.isArray(arr) ? arr : [])
  .map((t) => String(t).replace(/\s+/g, ' ').trim())
  .filter((t) => t.length > 3 && t.length <= 160 && !JUNK.test(t))
  .slice(0, 6)

// scraped links sometimes carry junk glued to the end (…/enï»¿You, …ID=142Sources)
const cleanLink = (u = '') => {
  const m = String(u).match(/^https?:\/\/[^\s"'<>ï»¿â€]+/)
  return m ? m[0].replace(/(Sources|References|Feedback|Questions|You)$/, '') : ''
}

const toCard = (s) => ({
  id: s._id ? String(s._id) : undefined,
  name: s.name || 'Unknown Scheme',
  ministry: s.ministry || (s.state && s.state !== 'Central' ? `Government of ${s.state}` : 'Government of India'),
  benefit: s.benefit || 'Check official portal',
  category: s.category || 'Other',
  state: s.state || 'Central',
  eligibility: Math.min(Math.max(s.matchScore || 45, 40), 95), // 0-100 score the UI already uses
  reason: s.reason || 'May match your situation — verify at the official portal',
  applyLink: cleanLink(s.applyLink),
  eligibilityCriteria: cleanCriteria(s.eligibilityCriteria),
  documents: Array.isArray(s.documents) ? s.documents : [],
})

const publicProfile = (p = {}) => Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith('_')))
const hasSignal = (p) => !!(p.occupation || Number.isFinite(p.age) || p.need_category?.length || p.caste || p.is_widow || p.is_disabled || p.gender)

function dedupe(list) {
  const seen = []
  return list.filter((s) => {
    const n = normalizeName(s.name)
    if (seen.some((x) => x.includes(n) || n.includes(x))) return false
    seen.push(n)
    return true
  })
}

// Ask for at most 2 times per field so we never nag
function pickNextField(profile) {
  const asked = profile._asked || {}
  for (const f of ['state', 'occupation', 'age']) {
    const known = f === 'age' ? Number.isFinite(profile.age) : !!profile[f]
    if (!known && (asked[f] || 0) < 2) return f
  }
  return null
}

router.post('/message', async (req, res) => {
  const { message: raw, alternatives = [], sessionId, language = 'English', mode = 'text', confirmed = false } = req.body
  const message = String(raw || alternatives[0] || '').trim().slice(0, 1000)
  if (!message) return res.status(400).json({ error: 'Message is required' })

  const sid = sessionId || uuidv4()

  try {
    let session = await Session.findOne({ sessionId: sid })
    if (!session) session = new Session({ sessionId: sid, language })
    const history = session.messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))

    // 1 ── understand ─────────────────────────────────────────
    const u = await understand({ message, alternatives, history, profile: session.userProfile || {}, language })

    // Voice: if unsure what was said, let the UI confirm before doing anything
    if (mode === 'voice' && !confirmed && u.confidence < 0.6 && u.intent !== 'greeting') {
      return res.json({
        needsConfirmation: true, understood: u.corrected_text, confidence: u.confidence,
        reply: '', schemes: [], sessionId: sid, userProfile: publicProfile(session.userProfile),
      })
    }

    // 2 ── merge profile (never erase known facts) ────────────
    const profile = mergeProfile(session.userProfile || {}, u.profile_updates)
    profile._asked = { ...(session.userProfile?._asked || {}) }
    logger.info(`Understood [${u.intent} ${u.confidence}${u._fallback ? ' fallback' : ''}] "${u.corrected_text}" → ${JSON.stringify(u.profile_updates)}`)

    // 3 ── decide what to do ─────────────────────────────────
    let situation = 'schemes'
    let cards = []
    let nextField = null

    if (u.intent === 'greeting') situation = 'greeting'
    else if (u.intent === 'off_topic') situation = 'off_topic'
    else if (u.intent === 'unclear') situation = 'unclear'
    else {
      // asking about a specific scheme -> answer from stored data
      if (['scheme_detail', 'how_to_apply', 'documents_needed'].includes(u.intent) && u.referenced_scheme) {
        const found = await findSchemeByName(u.referenced_scheme, profile.state)
        if (found) {
          cards = matchSchemesByProfile([found], profile, '', 1, { hardFilter: false }).map(toCard)
          situation = 'detail'
        }
      }
      if (!cards.length) {
        if (!hasSignal(profile)) {
          situation = 'ask'
          nextField = pickNextField(profile) || 'occupation'
        } else {
          const candidates = await searchSchemes({ query: u.english_text, profile })
          const scored = matchSchemesByProfile(candidates, profile, u.english_text, 60, { minScore: 50 })
          const central = scored.filter((s) => s.state === 'Central').slice(0, 3)
          const state = scored.filter((s) => s.state !== 'Central').slice(0, 2)
          let picked = dedupe([...central, ...state]).sort((a, b) => b.rawScore - a.rawScore)
          if (mode === 'voice') picked = picked.slice(0, 3)
          cards = picked.map(toCard)
          situation = cards.length ? 'schemes' : 'no_match'
          nextField = pickNextField(profile)
        }
      }
    }
    if (nextField) profile._asked[nextField] = (profile._asked[nextField] || 0) + 1

    // 4 ── translate cards (+reason) in ONE call ─────────────
    cards = await localizeSchemes(cards, language)

    // 5 ── grounded reply ────────────────────────────────────
    let reply = ''
    try {
      reply = await generateGroundedReply({
        message, understood: u.corrected_text, confidence: u.confidence, history, profile: publicProfile(profile),
        schemes: cards, language, mode, situation, nextField, hint: u.clarifying_question || '',
      })
    } catch (err) {
      logger.warn(`Reply generation failed: ${err.message}`)
    }
    if (!reply) reply = u.clarifying_question || fallbackReply(language, cards.length)

    // 6 ── persist ───────────────────────────────────────────
    session.userProfile = profile
    session.messages.push({ role: 'user', content: message })
    session.messages.push({ role: 'ai', content: reply, schemes: cards })
    session.language = language
    session.updatedAt = new Date()
    await session.save()

    res.json({
      reply,
      speech: mode === 'voice' ? cleanForSpeech(reply) : undefined,
      schemes: cards,
      sessionId: sid,
      userProfile: publicProfile(profile),
      understood: u.corrected_text,
      confidence: u.confidence,
      intent: u.intent,
      needsConfirmation: false,
    })
  } catch (err) {
    logger.error(`Chat error: ${err.stack || err.message}`)
    try {
      const all = await Scheme.find({ isActive: true, state: 'Central' }).limit(200).lean()
      const profile = extractProfileFromText(message)
      const scored = matchSchemesByProfile(all, profile, message, 3).map(toCard)
      return res.json({ reply: fallbackReply(language, scored.length), schemes: scored, sessionId: sid, userProfile: publicProfile(profile) })
    } catch {
      return res.status(500).json({ error: 'Service unavailable', reply: 'Please try again.', schemes: [], sessionId: sid })
    }
  }
})

router.get('/history/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId }).lean()
    if (!session) return res.status(404).json({ error: 'Session not found' })
    res.json({ messages: session.messages, userProfile: publicProfile(session.userProfile) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/session/:sessionId', async (req, res) => {
  await Session.deleteOne({ sessionId: req.params.sessionId })
  res.json({ success: true })
})

export default router