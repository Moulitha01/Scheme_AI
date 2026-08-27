// backend/src/routes/chat.js
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Session, Scheme } from '../models/index.js'
import { extractProfile, generateAIReply, scoreEligibility } from '../services/gemini.js'
import { semanticSearch, mongoTextSearch } from '../services/rag.js'
import { extractProfileFromText, matchSchemesByProfile } from '../services/profileExtractor.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

const FALLBACK_REPLIES = {
  Tamil:   (n, name) => `${name ? name + 'க்கு வணக்கம்! ' : 'வணக்கம்! '}உங்களுக்கு ${n} திட்டம் கண்டறியப்பட்டது.`,
  Hindi:   (n, name) => `${name ? name + ' जी, नमस्ते! ' : 'नमस्ते! '}आपके लिए ${n} योजनाएँ मिली हैं।`,
  Telugu:  (n, name) => `${name ? name + ' గారికి నమస్కారం! ' : 'నమస్కారం! '}మీకు ${n} పథకాలు దొరికాయి.`,
  Kannada: (n, name) => `${name ? name + ' ಅವರಿಗೆ ನಮಸ್ಕಾರ! ' : 'ನಮಸ್ಕಾರ! '}ನಿಮಗೆ ${n} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.`,
  Bengali: (n, name) => `${name ? name + ', নমস্কার! ' : 'নমস্কার! '}আপনার জন্য ${n}টি প্রকল্প পাওয়া গেছে।`,
  Marathi: (n, name) => `${name ? name + ', नमस्कार! ' : 'नमस्कार! '}तुमच्यासाठी ${n} योजना सापडल्या.`,
  English: (n, name) => `${name ? 'Hello ' + name + '! ' : 'Hello! '}I found ${n} scheme${n > 1 ? 's' : ''} for you.`,
}

// ── Normalize scheme name for deduplication ───────────────────
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\s+(tn|tamilnadu|tamil nadu|ap|andhra|telangana|karnataka|kerala|maharashtra|gujarat|punjab|haryana|odisha|bihar|rajasthan|wb|up|mp|cg|jh|uk|hp|goa|delhi|assam)$/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Fetch state-specific schemes directly ─────────────────────
async function fetchStateSchemes(state, profile, limit = 3) {
  if (!state) return []
  try {
    const stateSchemes = await Scheme.find({ isActive: true, state }).lean()
    if (!stateSchemes.length) return []
    const scored = matchSchemesByProfile(stateSchemes, profile, '')
    return scored.slice(0, limit).map(s => ({
      name: s.name || 'Unknown Scheme',
      ministry: s.ministry || `Government of ${state}`,
      benefit: s.benefit || 'Check official portal',
      category: s.category || 'Other',
      state: s.state,
      eligibility: Math.min(Math.max(s.matchScore || 70, 60), 95),
      reason: s.reason || `${state} state scheme — check eligibility`,
      applyLink: s.applyLink || '',
      eligibilityCriteria: Array.isArray(s.eligibilityCriteria) ? s.eligibilityCriteria : [],
    }))
  } catch (err) {
    logger.warn(`State scheme fetch error: ${err.message}`)
    return []
  }
}

router.post('/message', async (req, res) => {
  const { message, sessionId, language = 'English' } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' })

  const sid = sessionId || uuidv4()

  try {
    let session = await Session.findOne({ sessionId: sid })
    if (!session) session = new Session({ sessionId: sid, language })

    // Extract profile
    const keywordProfile = extractProfileFromText(message)
    let groqProfile = {}
    try { groqProfile = await extractProfile(message) } catch { }

    const newProfile = { ...keywordProfile }
    for (const [k, v] of Object.entries(groqProfile)) {
      if (v !== null && v !== undefined) newProfile[k] = v
    }

    const mergedProfile = { ...(session.userProfile || {}) }
    for (const [k, v] of Object.entries(newProfile)) {
      if (v !== null && v !== undefined) {
        if (k === 'need_category' && Array.isArray(v)) {
          const existing = mergedProfile.need_category || []
          mergedProfile.need_category = [...new Set([...existing, ...v])]
        } else {
          mergedProfile[k] = v
        }
      }
    }
    session.userProfile = mergedProfile

    logger.info(`Profile: age=${mergedProfile.age}, gender=${mergedProfile.gender}, occ=${mergedProfile.occupation}, state=${mergedProfile.state}, caste=${mergedProfile.caste}`)

    // ── Step 1: Get Central schemes from RAG ──────────────────
    let ragSchemes = []
    try { ragSchemes = await semanticSearch(message, mergedProfile, 10) } catch { }
    if (!ragSchemes.length) {
      try { ragSchemes = await mongoTextSearch(message, mergedProfile, 10) } catch { }
    }

    const schemesForScoring = ragSchemes.length > 0
      ? ragSchemes.map(r => ({ ...(r.metadata || {}), ...r }))
      : await Scheme.find({ isActive: true, state: 'Central' }).lean()

    let centralSchemes = matchSchemesByProfile(schemesForScoring, mergedProfile, message).slice(0, 3)

    // Groq scoring
    try {
      const enhanced = await Promise.all(
        centralSchemes.map(async (s) => {
          try {
            const scored = await scoreEligibility(mergedProfile, {
              name: s.name,
              description: s.description || '',
              eligibility: Array.isArray(s.eligibilityCriteria) ? s.eligibilityCriteria : [],
            })
            return {
              ...s,
              matchScore: Math.max(scored.score || 0, s.matchScore || 0),
              reason: scored.reason || s.reason,
            }
          } catch { return s }
        })
      )
      centralSchemes = enhanced.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    } catch { }

    centralSchemes = centralSchemes.slice(0, 3).map(s => ({
      name: s.name || 'Unknown Scheme',
      ministry: s.ministry || 'Government of India',
      benefit: s.benefit || 'Check official portal',
      category: s.category || 'Other',
      state: 'Central',
      eligibility: Math.min(Math.max(s.matchScore || 45, 40), 95),
      reason: s.reason || 'May be eligible — verify at official portal',
      applyLink: s.applyLink || '',
      eligibilityCriteria: Array.isArray(s.eligibilityCriteria) ? s.eligibilityCriteria : [],
    }))

    // ── Step 2: Get State schemes ─────────────────────────────
    const stateSchemes = await fetchStateSchemes(mergedProfile.state, mergedProfile, 3)

    // ── Step 3: Combine with smart deduplication ──────────────
    // Use normalized name comparison to catch variants like "Scheme TN" vs "Scheme"
    const seenNormalized = new Set()

    const deduped = [...centralSchemes, ...stateSchemes].filter(s => {
      const normalized = normalizeName(s.name)
      // Check if any existing seen name is a substring or superset
      for (const seen of seenNormalized) {
        if (seen.includes(normalized) || normalized.includes(seen)) return false
      }
      seenNormalized.add(normalized)
      return true
    })

    const topSchemes = deduped

    // Generate reply
    let reply = ''
    try {
      reply = await generateAIReply({
        message,
        history: session.messages.slice(-6),
        userProfile: mergedProfile,
        matchedSchemes: topSchemes,
        language,
      })
    } catch {
      reply = (FALLBACK_REPLIES[language] || FALLBACK_REPLIES.English)(topSchemes.length, mergedProfile.name)
    }

    session.messages.push({ role: 'user', content: message })
    session.messages.push({ role: 'ai', content: reply, schemes: topSchemes })
    session.language = language
    session.updatedAt = new Date()
    await session.save()

    const centralCount = topSchemes.filter(s => s.state === 'Central').length
    const stateCount = topSchemes.filter(s => s.state !== 'Central').length
    logger.info(`Chat [${sid.slice(0, 8)}]: "${message.slice(0, 40)}..." → ${topSchemes.length} schemes (${centralCount} central + ${stateCount} state)`)
    res.json({ reply, schemes: topSchemes, sessionId: sid, userProfile: mergedProfile })

  } catch (err) {
    logger.error(`Chat error: ${err.message}`)
    try {
      const allSchemes = await Scheme.find({ isActive: true }).limit(6).lean()
      const profile = extractProfileFromText(message)
      const scored = matchSchemesByProfile(allSchemes, profile, message)
      return res.json({
        reply: (FALLBACK_REPLIES[language] || FALLBACK_REPLIES.English)(scored.length, null),
        schemes: scored.slice(0, 6),
        sessionId: sid,
        userProfile: profile,
      })
    } catch {
      return res.status(500).json({ error: 'Service unavailable', reply: 'Please try again.', schemes: [], sessionId: sid })
    }
  }
})

router.get('/history/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId }).lean()
    if (!session) return res.status(404).json({ error: 'Session not found' })
    res.json({ messages: session.messages, userProfile: session.userProfile })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/session/:sessionId', async (req, res) => {
  await Session.deleteOne({ sessionId: req.params.sessionId })
  res.json({ success: true })
})

export default router