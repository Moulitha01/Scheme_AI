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
  Tamil:   (n, name) => `${name ? name + 'க்கு வணக்கம்! ' : 'வணக்கம்! '}உங்களுக்கு ${n} திட்டம் கண்டறியப்பட்டது. கீழே உள்ள திட்டங்களை பாருங்கள்.`,
  Hindi:   (n, name) => `${name ? name + ' जी, नमस्ते! ' : 'नमस्ते! '}आपके लिए ${n} योजनाएँ मिली हैं। नीचे देखें।`,
  Telugu:  (n, name) => `${name ? name + ' గారికి నమస్కారం! ' : 'నమస్కారం! '}మీకు ${n} పథకాలు దొరికాయి.`,
  Kannada: (n, name) => `${name ? name + ' ಅವರಿಗೆ ನಮಸ್ಕಾರ! ' : 'ನಮಸ್ಕಾರ! '}ನಿಮಗೆ ${n} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.`,
  Bengali: (n, name) => `${name ? name + ', নমস্কার! ' : 'নমস্কার! '}আপনার জন্য ${n}টি প্রকল্প পাওয়া গেছে।`,
  Marathi: (n, name) => `${name ? name + ', नमस्कार! ' : 'नमस्कार! '}तुमच्यासाठी ${n} योजना सापडल्या.`,
  English: (n, name) => `${name ? 'Hello ' + name + '! ' : 'Hello! '}I found ${n} scheme${n > 1 ? 's' : ''} for you. Please check below.`,
}

router.post('/message', async (req, res) => {
  const { message, sessionId, language = 'English' } = req.body

  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' })

  const sid = sessionId || uuidv4()

  try {
    let session = await Session.findOne({ sessionId: sid })
    if (!session) session = new Session({ sessionId: sid, language })

    // Always extract with keywords first (instant, no API)
    const keywordProfile = extractProfileFromText(message)

    // Try Groq for better extraction
    let groqProfile = {}
    try { groqProfile = await extractProfile(message) } catch { /* use keyword profile */ }

    // Merge: Groq wins over keywords, keywords fill gaps
    const newProfile = { ...keywordProfile }
    for (const [k, v] of Object.entries(groqProfile)) {
      if (v !== null && v !== undefined) newProfile[k] = v
    }

    // Merge with session history (accumulate profile across messages)
    const mergedProfile = { ...(session.userProfile || {}) }
    for (const [k, v] of Object.entries(newProfile)) {
      if (v !== null && v !== undefined) {
        // FIX: deduplicate need_category instead of pushing duplicates
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

    // Get schemes from RAG or DB
    let ragSchemes = []
    try { ragSchemes = await semanticSearch(message, mergedProfile, 10) } catch { }
    if (!ragSchemes.length) {
      try { ragSchemes = await mongoTextSearch(message, mergedProfile, 10) } catch { }
    }

    // FIX: map eligibilityCriteria (DB field) correctly — don't use 'eligibility' from DB
    const schemesForScoring = ragSchemes.length > 0
      ? ragSchemes.map(r => ({ ...(r.metadata || {}), ...r }))
      : await Scheme.find({ isActive: true }).lean()

    // Keyword scoring pass — matchSchemesByProfile uses 'eligibilityCriteria' now
    let topSchemes = matchSchemesByProfile(schemesForScoring, mergedProfile, message).slice(0, 3)

    // FIX: Groq scoring — keep score as separate numeric field, don't overwrite eligibilityCriteria
    try {
      const enhanced = await Promise.all(
        topSchemes.map(async (s) => {
          try {
            const scored = await scoreEligibility(mergedProfile, {
              name: s.name,
              description: s.description || '',
              // FIX: pass eligibilityCriteria (string array) to Groq for context
              eligibility: Array.isArray(s.eligibilityCriteria)
                ? s.eligibilityCriteria
                : [],
            })
            return {
              ...s,
              // FIX: store numeric score in 'matchScore', never overwrite 'eligibilityCriteria'
              matchScore: Math.max(scored.score || 0, s.matchScore || 0),
              reason: scored.reason || s.reason,
            }
          } catch { return s }
        })
      )
      topSchemes = enhanced.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    } catch { }

    // FIX: final shape uses 'matchScore' for the percentage shown in UI
    topSchemes = topSchemes.slice(0, 3).map(s => ({
      name: s.name || 'Unknown Scheme',
      ministry: s.ministry || 'Government of India',
      benefit: s.benefit || 'Check official portal',
      category: s.category || 'General',
      // FIX: matchScore is always a clean number now
      eligibility: Math.min(Math.max(s.matchScore || 45, 40), 95),
      reason: s.reason || 'May be eligible — verify at official portal',
      applyLink: s.applyLink || '',
      // send eligibilityCriteria separately so UI can show criteria text
      eligibilityCriteria: Array.isArray(s.eligibilityCriteria) ? s.eligibilityCriteria : [],
    }))

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

    logger.info(`Chat [${sid.slice(0, 8)}]: "${message.slice(0, 40)}..." → ${topSchemes.length} schemes`)
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