// backend/src/routes/a2a.js
// A2A Protocol Route — replaces /api/chat with /api/a2a

import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Session } from '../models/index.js'
import { OrchestratorAgent } from '../agents/index.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

// ── GET /api/a2a/agents — A2A Agent Discovery ─────────────────
// Returns all agent cards (standard A2A protocol endpoint)
router.get('/agents', (req, res) => {
  res.json({
    service: 'Scheme-AI A2A Service',
    version: '1.0.0',
    agents: OrchestratorAgent.getAgentCards(),
  })
})

// ── POST /api/a2a/task — Main A2A Task Endpoint ───────────────
// Accepts a citizen query and runs through the full agent pipeline
router.post('/task', async (req, res) => {
  const { message, sessionId, language = 'Tamil' } = req.body

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const sid = sessionId || uuidv4()

  try {
    // Load or create session
    let session = await Session.findOne({ sessionId: sid })
    if (!session) {
      session = new Session({ sessionId: sid, language })
    }

    // Run full A2A pipeline through Orchestrator
    const result = await OrchestratorAgent.process({
      message,
      sessionId: sid,
      language,
      existingProfile: session.userProfile || {},
      history: session.messages.slice(-6),
    })

    // Update session
    session.userProfile = { ...session.userProfile, ...result.userProfile }
    session.messages.push({ role: 'user', content: message })
    session.messages.push({
      role: 'ai',
      content: result.reply,
      schemes: result.schemes,
    })
    session.language = language
    session.updatedAt = new Date()
    await session.save()

    logger.info(`A2A [${sid.slice(0, 8)}]: ${result.schemes.length} schemes in ${result.meta.elapsed}ms`)

    res.json({
      reply: result.reply,
      schemes: result.schemes,
      sessionId: sid,
      userProfile: result.userProfile,
      agentTrace: result.agentTrace, // A2A protocol: expose agent trace
      meta: result.meta,
    })

  } catch (err) {
    logger.error(`A2A task error: ${err.message}`)
    res.status(500).json({
      error: 'Agent pipeline error',
      reply: 'I am having trouble right now. Please try again.',
      schemes: [],
      sessionId: sid,
    })
  }
})

// ── POST /api/a2a/form — Form Filler Agent ────────────────────
router.post('/form', async (req, res) => {
  const { userProfile = {}, ocrData = {}, scheme = {} } = req.body
  try {
    const result = await OrchestratorAgent.fillForm({ userProfile, ocrData, scheme })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/a2a/session/:id — Session history ────────────────
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId }).lean()
    if (!session) return res.status(404).json({ error: 'Session not found' })
    res.json({ messages: session.messages, userProfile: session.userProfile })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router