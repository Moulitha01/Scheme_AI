// backend/src/agents/index.js
// A2A Protocol — all agents now use Groq (free, fast, no quota issues)
import Groq from 'groq-sdk'
import { logger } from '../utils/logger.js'
import { semanticSearch, mongoTextSearch } from '../services/rag.js'
import { extractProfileFromText, matchSchemesByProfile } from '../services/profileExtractor.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

// ── Groq helper ───────────────────────────────────────────────
async function ask(messages, { temperature = 0.3, maxTokens = 512 } = {}) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await groq.chat.completions.create({
        model: MODEL, messages, temperature, max_tokens: maxTokens,
      })
      return res.choices[0]?.message?.content || ''
    } catch (err) {
      if ((err?.status === 429 || err?.message?.includes('rate')) && i < 2) {
        await new Promise(r => setTimeout(r, (i + 1) * 2000))
        continue
      }
      throw err
    }
  }
  return ''
}

function extractJSON(text) {
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch { }
  return null
}

// ── A2A Task helper ───────────────────────────────────────────
function makeTask(type, input, context = {}) {
  return {
    taskId: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type, input, context, output: null, status: 'pending', agentTrace: [],
  }
}

function trace(task, agentId, msg) {
  task.agentTrace.push({ agentId, message: msg, ts: new Date().toISOString() })
}

// ═══════════════════════════════════════════════════════════════
// AGENT 1 — Language Agent
// ═══════════════════════════════════════════════════════════════
export const LanguageAgent = {
  agentCard: {
    id: 'language-agent',
    name: 'Language Agent',
    description: 'Detects language and translates to English for downstream agents',
    capabilities: ['language_detection', 'translation'],
  },

  async handle(task) {
    trace(task, 'language-agent', `Detecting language for: "${task.input.message?.slice(0, 40)}"`)

    const langMap = {
      Tamil: 'ta-IN', Hindi: 'hi-IN', Telugu: 'te-IN', Kannada: 'kn-IN',
      Bengali: 'bn-IN', Marathi: 'mr-IN', Gujarati: 'gu-IN', Malayalam: 'ml-IN', English: 'en-IN',
    }

    try {
      const text = await ask([
        {
          role: 'system',
          content: 'Detect language and translate to English. Return ONLY JSON, no markdown.',
        },
        {
          role: 'user',
          content: `Message: "${task.input.message}"
Declared language: "${task.input.language || 'unknown'}"
Return JSON: {"detectedLang":"Tamil|Hindi|Telugu|Kannada|Bengali|Marathi|Gujarati|Malayalam|English","confidence":0.0-1.0,"englishText":"English translation","langCode":"ta-IN|hi-IN|te-IN|kn-IN|bn-IN|mr-IN|gu-IN|ml-IN|en-IN"}`,
        },
      ], { temperature: 0.1, maxTokens: 200 })

      const parsed = extractJSON(text)
      if (parsed) {
        task.output = parsed
        task.status = 'completed'
        trace(task, 'language-agent', `Detected: ${parsed.detectedLang}`)
        return task
      }
    } catch (err) {
      logger.warn(`LanguageAgent error: ${err.message}`)
    }

    // Fallback
    const declared = task.input.language || 'English'
    task.output = {
      detectedLang: declared,
      confidence: 0.8,
      englishText: task.input.message,
      langCode: langMap[declared] || 'en-IN',
    }
    task.status = 'completed_with_fallback'
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 2 — Profile Extractor Agent
// ═══════════════════════════════════════════════════════════════
export const ProfileAgent = {
  agentCard: {
    id: 'profile-agent',
    name: 'Profile Extractor Agent',
    description: 'Extracts structured citizen profile from conversation',
    capabilities: ['profile_extraction', 'entity_recognition'],
  },

  async handle(task) {
    const { message, englishText, existingProfile = {} } = task.input
    trace(task, 'profile-agent', 'Extracting profile')

    // Always run keyword extraction first (instant, no API)
    const keywordProfile = extractProfileFromText(message)

    try {
      const text = await ask([
        {
          role: 'system',
          content: `Extract citizen profile from message. User may write in any Indian language.
Merge with existing profile — only overwrite if message explicitly updates a field.
Return ONLY valid JSON, no markdown.`,
        },
        {
          role: 'user',
          content: `Message: "${message}"
English translation: "${englishText || message}"
Existing profile: ${JSON.stringify(existingProfile)}

Return merged JSON with fields: name, age, gender, state, district, occupation (farmer|student|daily_wage|unemployed|business|govt_employee|other), income_annual, land_acres, caste (general|obc|sc|st), is_disabled, is_widow, has_aadhaar, family_size, need_category[]`,
        },
      ], { temperature: 0.1, maxTokens: 400 })

      const parsed = extractJSON(text)
      if (parsed) {
        // Merge: Groq result + keyword profile (keyword fills gaps)
        const merged = { ...keywordProfile }
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== null && v !== undefined) merged[k] = v
        }
        task.output = merged
        task.status = 'completed'
        trace(task, 'profile-agent', `age=${merged.age}, occ=${merged.occupation}, state=${merged.state}`)
        return task
      }
    } catch (err) {
      logger.warn(`ProfileAgent error: ${err.message}`)
    }

    // Fallback to keyword extraction
    task.output = { ...existingProfile, ...keywordProfile }
    task.status = 'completed_with_fallback'
    trace(task, 'profile-agent', `Fallback: age=${keywordProfile.age}, occ=${keywordProfile.occupation}`)
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 3 — RAG Search Agent
// ═══════════════════════════════════════════════════════════════
export const RAGAgent = {
  agentCard: {
    id: 'rag-agent',
    name: 'RAG Search Agent',
    description: 'Searches database for relevant government schemes',
    capabilities: ['semantic_search', 'mongodb_fallback'],
  },

  async handle(task) {
    const { query, englishQuery, userProfile = {}, limit = 10 } = task.input
    const searchQuery = englishQuery || query
    trace(task, 'rag-agent', `Searching: "${searchQuery?.slice(0, 40)}"`)

    try {
      let results = await semanticSearch(searchQuery, userProfile, limit)

      if (!results.length) {
        trace(task, 'rag-agent', 'ChromaDB empty — MongoDB fallback')
        results = await mongoTextSearch(searchQuery, userProfile, limit)
      }

      if (!results.length) {
        trace(task, 'rag-agent', 'No results — using all DB schemes')
        const { Scheme } = await import('../models/index.js')
        const schemes = await Scheme.find({ isActive: true }).limit(limit).lean()
        results = schemes.map(s => ({ content: s.description || '', metadata: s, distance: 0.5 }))
      }

      task.output = results
      task.status = 'completed'
      trace(task, 'rag-agent', `Found ${results.length} schemes`)
    } catch (err) {
      logger.error(`RAGAgent error: ${err.message}`)
      // Return all schemes as final fallback
      try {
        const { Scheme } = await import('../models/index.js')
        const schemes = await Scheme.find({ isActive: true }).limit(limit).lean()
        task.output = schemes.map(s => ({ content: s.description || '', metadata: s, distance: 0.5 }))
      } catch { task.output = [] }
      task.status = 'completed_with_fallback'
    }
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 4 — Eligibility Scorer Agent
// ═══════════════════════════════════════════════════════════════
export const EligibilityAgent = {
  agentCard: {
    id: 'eligibility-agent',
    name: 'Eligibility Scorer Agent',
    description: 'Scores scheme eligibility using AI + keyword rules',
    capabilities: ['eligibility_scoring', 'keyword_matching'],
  },

  async handle(task) {
    const { schemes = [], userProfile = {}, originalMessage = '' } = task.input
    trace(task, 'eligibility-agent', `Scoring ${schemes.length} schemes`)

    if (!schemes.length) {
      task.output = []; task.status = 'completed'; return task
    }

    // Always run keyword scoring first (instant fallback)
    const schemeData = schemes.slice(0, 6).map(r => r.metadata || r)
    const keywordScored = matchSchemesByProfile(schemeData, userProfile, originalMessage)

    // Try Groq batch scoring to improve accuracy
    try {
      const schemeList = schemeData.map((s, i) =>
        `${i + 1}. ${s.name}: ${(s.eligibility_criteria || s.eligibility || []).slice(0, 3).join(', ')}`
      ).join('\n')

      const text = await ask([
        {
          role: 'system',
          content: `Score government scheme eligibility 0-100. Be generous with incomplete profiles (minimum 45).
Return ONLY a JSON array, no markdown.`,
        },
        {
          role: 'user',
          content: `Citizen profile: ${JSON.stringify(userProfile)}

Schemes:
${schemeList}

Return JSON array: [{"index":1,"score":85,"reason":"why eligible in one sentence"},...]`,
        },
      ], { temperature: 0.1, maxTokens: 600 })

      const clean = text.replace(/```json|```/g, '').trim()
      const match = clean.match(/\[[\s\S]*\]/)
      if (match) {
        const scores = JSON.parse(match[0])
        task.output = schemeData.map((s, i) => {
          const scored = scores.find(x => x.index === i + 1)
          const kwScore = keywordScored.find(k => k.name === s.name)?.eligibility || 40
          return {
            name: s.name || 'Unknown',
            ministry: s.ministry || 'Government of India',
            benefit: s.benefit || 'Check portal',
            category: s.category || 'General',
            eligibility: Math.max(scored?.score || kwScore, 40),
            reason: scored?.reason || kwScore >= 60 ? 'Good match based on your profile' : 'May be eligible — verify',
            applyLink: s.applyLink || '',
          }
        }).sort((a, b) => b.eligibility - a.eligibility)
        task.status = 'completed'
        trace(task, 'eligibility-agent', `Top: ${task.output[0]?.eligibility}% for ${task.output[0]?.name}`)
        return task
      }
    } catch (err) {
      logger.warn(`EligibilityAgent Groq failed: ${err.message} — using keyword scores`)
    }

    // Fallback to keyword scores
    task.output = keywordScored.slice(0, 6).map(s => ({
      name: s.name || 'Unknown',
      ministry: s.ministry || 'Government of India',
      benefit: s.benefit || 'Check portal',
      category: s.category || 'General',
      eligibility: Math.max(s.eligibility || 0, 40),
      reason: s.reason || 'May be eligible — verify at official portal',
      applyLink: s.applyLink || '',
    }))
    task.status = 'completed_with_fallback'
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 5 — Reply Generator Agent
// ═══════════════════════════════════════════════════════════════
export const ReplyAgent = {
  agentCard: {
    id: 'reply-agent',
    name: 'Reply Generator Agent',
    description: 'Generates empathetic multilingual responses',
    capabilities: ['multilingual_generation', 'empathy'],
  },

  async handle(task) {
    const { message, schemes = [], userProfile = {}, language = 'Tamil', history = [] } = task.input
    trace(task, 'reply-agent', `Generating ${language} reply`)

    try {
      const schemeNames = schemes.slice(0, 3).map(s => s.name).join(', ')
      const text = await ask([
        {
          role: 'system',
          content: `You are Scheme-AI, a compassionate welfare assistant for Indian citizens.
CRITICAL: Respond ONLY in ${language}. Never use any other language.
Be warm, simple, brief — 2-3 sentences max. Elderly users are reading this.
${schemes.length > 0 ? `Found schemes: ${schemeNames}` : 'No schemes found yet.'}`,
        },
        { role: 'user', content: message },
      ], { temperature: 0.6, maxTokens: 200 })

      task.output = text || getFallback(language, schemes.length, userProfile.name)
      task.status = 'completed'
    } catch (err) {
      logger.warn(`ReplyAgent error: ${err.message}`)
      task.output = getFallback(language, schemes.length, userProfile.name)
      task.status = 'completed_with_fallback'
    }
    return task
  },
}

function getFallback(language, count, name) {
  const n = name ? `${name}, ` : ''
  const map = {
    Tamil:   `${n}வணக்கம்! உங்களுக்கு ${count} திட்டம் கண்டறியப்பட்டது.`,
    Hindi:   `${n}नमस्ते! आपके लिए ${count} योजनाएँ मिली हैं।`,
    Telugu:  `${n}నమస్కారం! మీకు ${count} పథకాలు దొరికాయి.`,
    Kannada: `${n}ನಮಸ್ಕಾರ! ನಿಮಗೆ ${count} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.`,
    Bengali: `${n}নমস্কার! আপনার জন্য ${count}টি প্রকল্প পাওয়া গেছে।`,
    Marathi: `${n}नमस्कार! तुमच्यासाठी ${count} योजना सापडल्या.`,
    English: `${n}Hello! I found ${count} scheme${count !== 1 ? 's' : ''} for you.`,
  }
  return map[language] || map.English
}

// ═══════════════════════════════════════════════════════════════
// AGENT 6 — Form Filler Agent
// ═══════════════════════════════════════════════════════════════
export const FormAgent = {
  agentCard: {
    id: 'form-agent',
    name: 'Form Filler Agent',
    description: 'Pre-fills application forms from profile and OCR data',
    capabilities: ['form_prefill', 'data_normalization'],
  },

  async handle(task) {
    const { userProfile = {}, ocrData = {}, scheme = {} } = task.input
    trace(task, 'form-agent', `Pre-filling for: ${scheme.name}`)

    const merged = {
      name: ocrData.name || userProfile.name || '',
      dob: ocrData.dob || '',
      age: ocrData.age || userProfile.age || '',
      gender: ocrData.gender || userProfile.gender || '',
      aadhaar: ocrData.aadhaar || '',
      mobile: ocrData.mobile || '',
      caste: userProfile.caste || '',
      occupation: userProfile.occupation || '',
      income: userProfile.income_annual || '',
      state: ocrData.state || userProfile.state || '',
      district: ocrData.district || userProfile.district || '',
      pincode: ocrData.pincode || '',
      address: ocrData.address || '',
    }

    const occMap = {
      farmer: 'Farmer / Agriculturist', student: 'Student',
      daily_wage: 'Daily Wage Worker', unemployed: 'Unemployed',
      business: 'Self Employed', govt_employee: 'Government Employee',
    }
    if (merged.occupation) merged.occupation = occMap[merged.occupation] || merged.occupation

    const casteMap = { sc: 'SC', st: 'ST', obc: 'OBC', general: 'General' }
    if (merged.caste) merged.caste = casteMap[merged.caste] || merged.caste

    if (merged.gender) merged.gender = merged.gender.charAt(0).toUpperCase() + merged.gender.slice(1)

    const filled = Object.keys(merged).filter(k => merged[k])
    task.output = {
      formData: merged,
      filledFields: filled,
      missingFields: Object.keys(merged).filter(k => !merged[k]),
      confidence: Math.round((filled.length / Object.keys(merged).length) * 100),
    }
    task.status = 'completed'
    trace(task, 'form-agent', `${filled.length} fields filled (${task.output.confidence}%)`)
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// ORCHESTRATOR — Coordinates all A2A agents
// ═══════════════════════════════════════════════════════════════
export const OrchestratorAgent = {
  agentCard: {
    id: 'orchestrator',
    name: 'Scheme-AI Orchestrator',
    description: 'Coordinates all specialist agents via A2A protocol',
    agents: ['language-agent', 'profile-agent', 'rag-agent', 'eligibility-agent', 'reply-agent', 'form-agent'],
  },

  async process({ message, sessionId, language = 'Tamil', existingProfile = {}, history = [] }) {
    const start = Date.now()
    logger.info(`[Orchestrator] A2A pipeline starting for session ${sessionId?.slice(0, 8)}`)

    // Step 1: Language detection
    const langTask = makeTask('language_detection', { message, language })
    await LanguageAgent.handle(langTask)
    const { detectedLang, englishText, langCode } = langTask.output || {}

    // Step 2: Profile extraction
    const profileTask = makeTask('profile_extraction', { message, englishText, existingProfile })
    await ProfileAgent.handle(profileTask)
    const userProfile = profileTask.output || existingProfile

    // Step 3: RAG search
    const ragTask = makeTask('rag_search', {
      query: message, englishQuery: englishText, userProfile, limit: 10,
    })
    await RAGAgent.handle(ragTask)
    const ragResults = ragTask.output || []

    // Step 4: Eligibility scoring
    const eligibilityTask = makeTask('eligibility_scoring', {
      schemes: ragResults, userProfile, originalMessage: message,
    })
    await EligibilityAgent.handle(eligibilityTask)
    const scoredSchemes = eligibilityTask.output || []

    // Step 5: Reply generation
    const replyTask = makeTask('reply_generation', {
      message, schemes: scoredSchemes, userProfile,
      language: detectedLang || language, history,
    })
    await ReplyAgent.handle(replyTask)
    const reply = replyTask.output || getFallback(language, scoredSchemes.length, userProfile.name)

    const elapsed = Date.now() - start
    logger.info(`[Orchestrator] Done in ${elapsed}ms — ${scoredSchemes.length} schemes`)

    return {
      reply,
      schemes: scoredSchemes,
      userProfile,
      langCode: langCode || 'en-IN',
      agentTrace: [
        ...(langTask.agentTrace || []),
        ...(profileTask.agentTrace || []),
        ...(ragTask.agentTrace || []),
        ...(eligibilityTask.agentTrace || []),
        ...(replyTask.agentTrace || []),
      ],
      meta: { elapsed, sessionId },
    }
  },

  async fillForm({ userProfile, ocrData, scheme }) {
    const task = makeTask('form_fill', { userProfile, ocrData, scheme })
    await FormAgent.handle(task)
    return task.output
  },

  getAgentCards() {
    return [
      LanguageAgent.agentCard, ProfileAgent.agentCard, RAGAgent.agentCard,
      EligibilityAgent.agentCard, ReplyAgent.agentCard, FormAgent.agentCard,
      OrchestratorAgent.agentCard,
    ]
  },
}