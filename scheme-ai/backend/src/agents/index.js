// backend/src/agents/index.js
// Google A2A Protocol Implementation for Scheme-AI
// Each agent has: agentCard, handler, and communicates via standardized tasks

import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '../utils/logger.js'
import { semanticSearch, mongoTextSearch } from '../services/rag.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const gemini = (temp = 0.3, tokens = 512) =>
  genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: temp, maxOutputTokens: tokens },
  })

// ── A2A Task schema ───────────────────────────────────────────
// { taskId, type, input, context, output, status, agentTrace }

function makeTask(type, input, context = {}) {
  return {
    taskId: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    input,
    context,
    output: null,
    status: 'pending',
    agentTrace: [],
  }
}

function traceAgent(task, agentId, message) {
  task.agentTrace.push({ agentId, message, ts: new Date().toISOString() })
}

// ═══════════════════════════════════════════════════════════════
// AGENT 1 — Language Agent
// Detects language, normalizes input, translates if needed
// ═══════════════════════════════════════════════════════════════
export const LanguageAgent = {
  agentCard: {
    id: 'language-agent',
    name: 'Language Agent',
    description: 'Detects language, normalizes multilingual input for downstream agents',
    capabilities: ['language_detection', 'transliteration', 'normalization'],
    input: 'raw user message',
    output: '{ detectedLang, normalizedText, englishText, langCode }',
  },

  async handle(task) {
    traceAgent(task, 'language-agent', `Processing: "${task.input.message?.slice(0, 50)}"`)

    const langMap = {
      'Tamil': 'ta-IN', 'Hindi': 'hi-IN', 'Telugu': 'te-IN',
      'Kannada': 'kn-IN', 'Bengali': 'bn-IN', 'Marathi': 'mr-IN',
      'Gujarati': 'gu-IN', 'Malayalam': 'ml-IN', 'English': 'en-IN',
    }

    try {
      const model = gemini(0.1, 256)
      const result = await model.generateContent(`
Analyze this message and return ONLY valid JSON (no markdown):
Message: "${task.input.message}"
Declared language: "${task.input.language || 'unknown'}"

{
  "detectedLang": "Tamil|Hindi|Telugu|Kannada|Bengali|Marathi|Gujarati|Malayalam|English",
  "confidence": 0.0-1.0,
  "englishText": "English translation of the message",
  "normalizedText": "cleaned version of original message",
  "langCode": "ta-IN|hi-IN|te-IN|kn-IN|bn-IN|mr-IN|gu-IN|ml-IN|en-IN"
}`)

      const text = result.response.text().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)
      task.output = parsed
      task.status = 'completed'
      traceAgent(task, 'language-agent', `Detected: ${parsed.detectedLang} (${Math.round(parsed.confidence * 100)}%)`)
    } catch (err) {
      logger.warn(`LanguageAgent error: ${err.message}`)
      task.output = {
        detectedLang: task.input.language || 'Tamil',
        confidence: 0.5,
        englishText: task.input.message,
        normalizedText: task.input.message,
        langCode: langMap[task.input.language] || 'ta-IN',
      }
      task.status = 'completed_with_fallback'
    }
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 2 — Profile Extractor Agent
// Extracts structured user profile from natural language
// ═══════════════════════════════════════════════════════════════
export const ProfileAgent = {
  agentCard: {
    id: 'profile-agent',
    name: 'Profile Extractor Agent',
    description: 'Silently extracts structured citizen profile from conversation',
    capabilities: ['profile_extraction', 'entity_recognition', 'context_merging'],
    input: '{ message, englishText, existingProfile }',
    output: 'structured user profile object',
  },

  async handle(task) {
    traceAgent(task, 'profile-agent', 'Extracting profile from message')

    const { message, englishText, existingProfile = {} } = task.input

    try {
      const model = gemini(0.1, 384)
      const result = await model.generateContent(`
Extract user profile from this message. Return ONLY valid JSON.
Use the English translation for better accuracy.

Original: "${message}"
English: "${englishText || message}"

Merge with existing profile (don't overwrite non-null values unless message explicitly updates them):
Existing: ${JSON.stringify(existingProfile)}

Return merged profile JSON:
{
  "name": string|null,
  "age": number|null,
  "gender": "male"|"female"|"other"|null,
  "state": string|null,
  "district": string|null,
  "occupation": "farmer"|"student"|"daily_wage"|"unemployed"|"business"|"govt_employee"|"other"|null,
  "income_annual": number|null,
  "land_acres": number|null,
  "caste": "general"|"obc"|"sc"|"st"|null,
  "is_disabled": boolean|null,
  "is_widow": boolean|null,
  "has_aadhaar": boolean|null,
  "family_size": number|null,
  "need_category": string[]
}`)

      const text = result.response.text().replace(/```json|```/g, '').trim()
      task.output = JSON.parse(text)
      task.status = 'completed'
      traceAgent(task, 'profile-agent', `Extracted: age=${task.output.age}, occupation=${task.output.occupation}, state=${task.output.state}`)
    } catch (err) {
      logger.warn(`ProfileAgent error: ${err.message}`)
      task.output = existingProfile
      task.status = 'completed_with_fallback'
    }
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 3 — RAG Search Agent
// Searches ChromaDB/MongoDB for relevant schemes
// ═══════════════════════════════════════════════════════════════
export const RAGAgent = {
  agentCard: {
    id: 'rag-agent',
    name: 'RAG Search Agent',
    description: 'Searches vector database for semantically relevant government schemes',
    capabilities: ['semantic_search', 'vector_retrieval', 'mongodb_fallback'],
    input: '{ query, userProfile, limit }',
    output: 'array of matched scheme documents',
  },

  async handle(task) {
    const { query, englishQuery, userProfile = {}, limit = 10 } = task.input
    traceAgent(task, 'rag-agent', `Searching for: "${(englishQuery || query)?.slice(0, 50)}"`)

    // Use English query for better RAG matching
    const searchQuery = englishQuery || query

    // Build enriched query from profile
    const enriched = [
      searchQuery,
      userProfile.occupation && `${userProfile.occupation} scheme`,
      userProfile.state && `${userProfile.state} government scheme`,
      userProfile.age > 60 && 'senior citizen elderly pension',
      userProfile.age < 25 && 'youth student education scholarship',
      userProfile.gender === 'female' && 'women welfare mahila scheme',
      userProfile.caste === 'sc' && 'SC scheduled caste dalit',
      userProfile.caste === 'st' && 'ST tribal adivasi scheme',
      userProfile.income_annual < 100000 && 'BPL below poverty line poor',
    ].filter(Boolean).join(' ')

    try {
      let results = await semanticSearch(enriched, userProfile, limit)

      if (!results.length) {
        traceAgent(task, 'rag-agent', 'ChromaDB empty, trying MongoDB text search')
        results = await mongoTextSearch(searchQuery, userProfile, limit)
      }

      if (!results.length) {
        traceAgent(task, 'rag-agent', 'No results, using DB fallback')
        // Import Scheme model dynamically
        const { Scheme } = await import('../models/index.js')
        const schemes = await Scheme.find({ isActive: true }).limit(limit).lean()
        results = schemes.map(s => ({
          content: s.description || '',
          metadata: { name: s.name, ministry: s.ministry, benefit: s.benefit, category: s.category, eligibility: s.eligibility, applyLink: s.applyLink },
          distance: 0.5,
        }))
      }

      task.output = results
      task.status = 'completed'
      traceAgent(task, 'rag-agent', `Found ${results.length} scheme(s)`)
    } catch (err) {
      logger.error(`RAGAgent error: ${err.message}`)
      task.output = []
      task.status = 'failed'
    }
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 4 — Eligibility Scorer Agent
// Scores each scheme against user profile using Gemini
// ═══════════════════════════════════════════════════════════════
export const EligibilityAgent = {
  agentCard: {
    id: 'eligibility-agent',
    name: 'Eligibility Scorer Agent',
    description: 'Scores scheme eligibility using AI reasoning against user profile',
    capabilities: ['eligibility_scoring', 'reasoning', 'batch_processing'],
    input: '{ schemes[], userProfile }',
    output: 'scored and ranked schemes[]',
  },

  async handle(task) {
    const { schemes = [], userProfile = {} } = task.input
    traceAgent(task, 'eligibility-agent', `Scoring ${schemes.length} schemes`)

    if (!schemes.length) {
      task.output = []
      task.status = 'completed'
      return task
    }

    // Score all schemes in one batch call (more efficient)
    try {
      const model = gemini(0.2, 1024)
      const schemeList = schemes.slice(0, 6).map((r, i) => {
        const d = r.metadata || r
        return `${i + 1}. ${d.name || 'Unknown'}: ${(d.eligibility || []).join(', ')}`
      }).join('\n')

      const result = await model.generateContent(`
User profile: ${JSON.stringify(userProfile)}

Score each scheme's eligibility (0-100). Be GENEROUS — incomplete profile = assume best case, minimum 45.

Schemes:
${schemeList}

Return ONLY valid JSON array:
[{"index":1,"score":85,"reason":"1 sentence why"},{"index":2,"score":60,"reason":"..."}]`)

      const text = result.response.text().replace(/```json|```/g, '').trim()
      const scores = JSON.parse(text)

      task.output = schemes.slice(0, 6).map((r, i) => {
        const d = r.metadata || r
        const scored = scores.find(s => s.index === i + 1) || { score: 55, reason: 'Possible match — verify eligibility' }
        return {
          name: d.name || 'Unknown Scheme',
          ministry: d.ministry || 'Government of India',
          benefit: d.benefit || 'Check official portal',
          category: d.category || 'General',
          eligibility: Math.max(scored.score || 0, 40),
          reason: scored.reason || 'May be eligible based on your profile',
          applyLink: d.applyLink || '',
        }
      }).sort((a, b) => b.eligibility - a.eligibility)

      task.status = 'completed'
      traceAgent(task, 'eligibility-agent', `Top score: ${task.output[0]?.eligibility}% for ${task.output[0]?.name}`)

    } catch (err) {
      logger.warn(`EligibilityAgent batch error: ${err.message}, using fallback scores`)
      task.output = schemes.slice(0, 6).map(r => {
        const d = r.metadata || r
        return {
          name: d.name || 'Unknown Scheme',
          ministry: d.ministry || 'Government of India',
          benefit: d.benefit || 'Check official portal',
          category: d.category || 'General',
          eligibility: 55,
          reason: 'Likely eligible — verify at official portal',
          applyLink: d.applyLink || '',
        }
      })
      task.status = 'completed_with_fallback'
    }
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 5 — Reply Generator Agent
// Generates empathetic multilingual response
// ═══════════════════════════════════════════════════════════════
export const ReplyAgent = {
  agentCard: {
    id: 'reply-agent',
    name: 'Reply Generator Agent',
    description: 'Generates empathetic, multilingual responses for citizens',
    capabilities: ['multilingual_generation', 'empathy_detection', 'scheme_explanation'],
    input: '{ message, schemes, userProfile, language, history }',
    output: 'natural language reply string',
  },

  async handle(task) {
    const { message, schemes = [], userProfile = {}, language = 'Tamil', history = [] } = task.input
    traceAgent(task, 'reply-agent', `Generating ${language} reply for ${schemes.length} schemes`)

    try {
      const model = gemini(0.7, 800)
      const schemeNames = schemes.slice(0, 3).map(s => s.name).join(', ')

      const result = await model.generateContent(`
You are Scheme-AI, a compassionate welfare assistant for Indian citizens.
ALWAYS respond in ${language} language. Never switch languages.
Speak simply like a helpful neighbour. No jargon.

User said: "${message}"
User profile: age=${userProfile.age}, occupation=${userProfile.occupation}, state=${userProfile.state}
Matched schemes: ${schemeNames || 'none yet'}

Write a warm, encouraging 2-3 sentence response in ${language}:
- Acknowledge what they said
- Mention the schemes found (if any)  
- Guide next step

Keep it SHORT and SIMPLE. Elderly users are reading this.`)

      task.output = result.response.text()
      task.status = 'completed'
    } catch (err) {
      logger.warn(`ReplyAgent error: ${err.message}`)
      const fallbacks = {
        Tamil: 'உங்கள் விவரங்களை பெற்றோம். கீழே உள்ள திட்டங்களை பாருங்கள்.',
        Hindi: 'आपकी जानकारी मिल गई। नीचे दी गई योजनाएँ देखें।',
        Telugu: 'మీ వివరాలు అందుకున్నాం. దిగువ పథకాలను చూడండి.',
        Kannada: 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪಡೆದಿದ್ದೇವೆ. ಕೆಳಗಿನ ಯೋಜನೆಗಳನ್ನು ನೋಡಿ.',
        Bengali: 'আপনার তথ্য পেয়েছি। নিচের প্রকল্পগুলি দেখুন।',
        English: 'I found some schemes for you. Please check the cards below.',
      }
      task.output = fallbacks[language] || fallbacks.English
      task.status = 'completed_with_fallback'
    }
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// AGENT 6 — Form Filler Agent
// Pre-fills application form from profile + OCR data
// ═══════════════════════════════════════════════════════════════
export const FormAgent = {
  agentCard: {
    id: 'form-agent',
    name: 'Form Filler Agent',
    description: 'Pre-fills government application forms using profile and OCR extracted data',
    capabilities: ['form_prefill', 'data_normalization', 'field_validation'],
    input: '{ userProfile, ocrData, scheme }',
    output: 'pre-filled form data object',
  },

  async handle(task) {
    const { userProfile = {}, ocrData = {}, scheme = {} } = task.input
    traceAgent(task, 'form-agent', `Pre-filling form for: ${scheme.name}`)

    // Merge profile + OCR data intelligently
    const merged = {
      name: ocrData.name || userProfile.name || '',
      dob: ocrData.dob || '',
      age: ocrData.age || userProfile.age || '',
      gender: ocrData.gender || userProfile.gender || '',
      aadhaar: ocrData.aadhaar || '',
      mobile: ocrData.mobile || userProfile.phone || '',
      caste: userProfile.caste || '',
      occupation: userProfile.occupation || '',
      income: userProfile.income_annual || '',
      state: ocrData.state || userProfile.state || '',
      district: ocrData.district || userProfile.district || '',
      pincode: ocrData.pincode || '',
      address: ocrData.address || '',
    }

    // Normalize occupation
    const occMap = {
      farmer: 'Farmer / Agriculturist',
      student: 'Student',
      daily_wage: 'Daily Wage Worker',
      unemployed: 'Unemployed',
      business: 'Self Employed / Business',
      govt_employee: 'Government Employee',
    }
    if (merged.occupation) {
      merged.occupation = occMap[merged.occupation] || merged.occupation
    }

    // Normalize caste
    const casteMap = { sc: 'SC', st: 'ST', obc: 'OBC', general: 'General' }
    if (merged.caste) merged.caste = casteMap[merged.caste] || merged.caste

    // Normalize gender
    if (merged.gender) {
      merged.gender = merged.gender.charAt(0).toUpperCase() + merged.gender.slice(1)
    }

    task.output = {
      formData: merged,
      filledFields: Object.keys(merged).filter(k => merged[k]),
      missingFields: Object.keys(merged).filter(k => !merged[k]),
      confidence: Math.round((Object.keys(merged).filter(k => merged[k]).length / Object.keys(merged).length) * 100),
    }
    task.status = 'completed'
    traceAgent(task, 'form-agent', `Filled ${task.output.filledFields.length} fields (${task.output.confidence}% complete)`)
    return task
  },
}

// ═══════════════════════════════════════════════════════════════
// ORCHESTRATOR — Coordinates all agents via A2A protocol
// ═══════════════════════════════════════════════════════════════
export const OrchestratorAgent = {
  agentCard: {
    id: 'orchestrator',
    name: 'Scheme-AI Orchestrator',
    description: 'Coordinates all specialist agents to process citizen requests end-to-end',
    capabilities: ['agent_coordination', 'task_routing', 'result_aggregation'],
    agents: ['language-agent', 'profile-agent', 'rag-agent', 'eligibility-agent', 'reply-agent', 'form-agent'],
  },

  async process({ message, sessionId, language = 'Tamil', existingProfile = {}, history = [] }) {
    const startTime = Date.now()
    logger.info(`[Orchestrator] Starting A2A pipeline for session ${sessionId?.slice(0, 8)}`)

    // ── Step 1: Language Agent ──
    const langTask = makeTask('language_detection', { message, language })
    await LanguageAgent.handle(langTask)
    const { detectedLang, englishText, langCode } = langTask.output

    // ── Step 2: Profile Agent ──
    const profileTask = makeTask('profile_extraction', {
      message,
      englishText,
      existingProfile,
    })
    await ProfileAgent.handle(profileTask)
    const userProfile = profileTask.output

    // ── Step 3: RAG Agent ──
    const ragTask = makeTask('rag_search', {
      query: message,
      englishQuery: englishText,
      userProfile,
      limit: 10,
    })
    await RAGAgent.handle(ragTask)
    const ragResults = ragTask.output

    // ── Step 4: Eligibility Agent ──
    const eligibilityTask = makeTask('eligibility_scoring', {
      schemes: ragResults,
      userProfile,
    })
    await EligibilityAgent.handle(eligibilityTask)
    const scoredSchemes = eligibilityTask.output

    // ── Step 5: Reply Agent ──
    const replyTask = makeTask('reply_generation', {
      message,
      schemes: scoredSchemes,
      userProfile,
      language: detectedLang || language,
      history,
    })
    await ReplyAgent.handle(replyTask)
    const reply = replyTask.output

    const elapsed = Date.now() - startTime
    logger.info(`[Orchestrator] Pipeline complete in ${elapsed}ms — ${scoredSchemes.length} schemes`)

    return {
      reply,
      schemes: scoredSchemes,
      userProfile,
      langCode,
      agentTrace: [
        ...langTask.agentTrace,
        ...profileTask.agentTrace,
        ...ragTask.agentTrace,
        ...eligibilityTask.agentTrace,
        ...replyTask.agentTrace,
      ],
      meta: { elapsed, sessionId },
    }
  },

  // Pre-fill form via Form Agent
  async fillForm({ userProfile, ocrData, scheme }) {
    const formTask = makeTask('form_fill', { userProfile, ocrData, scheme })
    await FormAgent.handle(formTask)
    return formTask.output
  },

  // Get all agent cards (A2A discovery endpoint)
  getAgentCards() {
    return [
      LanguageAgent.agentCard,
      ProfileAgent.agentCard,
      RAGAgent.agentCard,
      EligibilityAgent.agentCard,
      ReplyAgent.agentCard,
      FormAgent.agentCard,
      OrchestratorAgent.agentCard,
    ]
  },
}