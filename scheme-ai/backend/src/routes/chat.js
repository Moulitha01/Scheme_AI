// backend/src/routes/chat.js
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Session, Scheme } from '../models/index.js'
import { extractProfile, generateAIReply, scoreEligibility } from '../services/gemini.js'
import { semanticSearch, mongoTextSearch } from '../services/rag.js'
import { extractProfileFromText, matchSchemesByProfile } from '../services/profileExtractor.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

// ── Language-specific fallback replies ───────────────────────
const FALLBACK_REPLIES = {
  Tamil:   (n, name) => `${name ? name + 'க்கு வணக்கம்! ' : 'வணக்கம்! '}உங்களுக்கு ${n} திட்டம் கண்டறியப்பட்டது. கீழே உள்ள திட்டங்களை பாருங்கள்.`,
  Hindi:   (n, name) => `${name ? name + ' जी, नमस्ते! ' : 'नमस्ते! '}आपके लिए ${n} योजनाएँ मिली हैं। नीचे देखें।`,
  Telugu:  (n, name) => `${name ? name + ' గారికి నమస్కారం! ' : 'నమస్కారం! '}మీకు ${n} పథకాలు దొరికాయి.`,
  Kannada: (n, name) => `${name ? name + ' ಅವರಿಗೆ ನಮಸ್ಕಾರ! ' : 'ನಮಸ್ಕಾರ! '}ನಿಮಗೆ ${n} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.`,
  Bengali: (n, name) => `${name ? name + ', নমস্কার! ' : 'নমস্কার! '}আপনার জন্য ${n}টি প্রকল্প পাওয়া গেছে।`,
  English: (n, name) => `${name ? 'Hello ' + name + '! ' : 'Hello! '}I found ${n} scheme${n > 1 ? 's' : ''} for you. Please check below.`,
}

router.post('/message', async (req, res) => {
  const { message, sessionId, language = 'English' } = req.body

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const sid = sessionId || uuidv4()

  try {
    // 1. Load or create session
    let session = await Session.findOne({ sessionId: sid })
    if (!session) session = new Session({ sessionId: sid, language })

    // 2. Extract profile — keyword extraction always works, Gemini is bonus
    const keywordProfile = extractProfileFromText(message)
    let geminiProfile = {}
    try {
      geminiProfile = await extractProfile(message)
    } catch { /* Gemini unavailable — keyword profile is enough */ }

    // Merge: Gemini wins if available, keyword fills gaps
    const newProfile = { ...keywordProfile }
    for (const [k, v] of Object.entries(geminiProfile)) {
      if (v !== null && v !== undefined) newProfile[k] = v
    }

    // Merge with session history
    const existing = session.userProfile || {}
    const mergedProfile = { ...existing }
    for (const [k, v] of Object.entries(newProfile)) {
      if (v !== null && v !== undefined) mergedProfile[k] = v
    }
    session.userProfile = mergedProfile

    logger.info(`Profile: age=${mergedProfile.age}, gender=${mergedProfile.gender}, occ=${mergedProfile.occupation}, state=${mergedProfile.state}`)

    // 3. Get schemes — RAG first, then all schemes
    let ragSchemes = []
    try { ragSchemes = await semanticSearch(message, mergedProfile, 10) } catch { /* ignore */ }
    if (!ragSchemes.length) {
      try { ragSchemes = await mongoTextSearch(message, mergedProfile, 10) } catch { /* ignore */ }
    }

    // Get raw scheme data for scoring
    const schemesForScoring = ragSchemes.length > 0
      ? ragSchemes.map(r => ({ ...(r.metadata || {}), ...r }))
      : await Scheme.find({ isActive: true }).lean()

    // 4. Score with keyword matching (always works)
    let topSchemes = matchSchemesByProfile(schemesForScoring, mergedProfile, message).slice(0, 6)

    // Try to enhance with Gemini scoring (optional)
    try {
      const enhanced = await Promise.all(
        topSchemes.map(async (s) => {
          try {
            const scored = await scoreEligibility(mergedProfile, {
              name: s.name,
              description: s.description || '',
              eligibility: Array.isArray(s.eligibility) ? s.eligibility : [],
            })
            return { ...s, eligibility: Math.max(scored.score || 0, s.eligibility), reason: scored.reason || s.reason }
          } catch { return s }
        })
      )
      topSchemes = enhanced.sort((a, b) => b.eligibility - a.eligibility)
    } catch { /* keep keyword scores */ }

    // Format final schemes
    topSchemes = topSchemes.map(s => ({
      name: s.name || 'Unknown Scheme',
      ministry: s.ministry || 'Government of India',
      benefit: s.benefit || 'Check official portal',
      category: s.category || 'General',
      eligibility: Math.max(s.eligibility || 0, 40),
      reason: s.reason || 'May be eligible — verify at official portal',
      applyLink: s.applyLink || '',
    }))

    // 5. Generate reply
    let reply = ''
    try {
      reply = await generateAIReply({ message, history: session.messages.slice(-6), userProfile: mergedProfile, matchedSchemes: topSchemes, language })
    } catch {
      const fn = FALLBACK_REPLIES[language] || FALLBACK_REPLIES.English
      reply = fn(topSchemes.length, mergedProfile.name)
    }

    // 6. Save session
    session.messages.push({ role: 'user', content: message })
    session.messages.push({ role: 'ai', content: reply, schemes: topSchemes })
    session.language = language
    session.updatedAt = new Date()
    await session.save()

    logger.info(`Chat [${sid.slice(0, 8)}]: "${message.slice(0, 40)}..." → ${topSchemes.length} schemes`)

    res.json({ reply, schemes: topSchemes, sessionId: sid, userProfile: mergedProfile })

  } catch (err) {
    logger.error(`Chat error: ${err.message}`)
    // Total fallback — return schemes even on crash
    try {
      const allSchemes = await Scheme.find({ isActive: true }).limit(6).lean()
      const profile = extractProfileFromText(message)
      const scored = matchSchemesByProfile(allSchemes, profile, message)
      const fn = FALLBACK_REPLIES[language] || FALLBACK_REPLIES.English
      return res.json({ reply: fn(scored.length, null), schemes: scored.slice(0, 6), sessionId: sid, userProfile: profile })
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