import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: 'C:\\Users\\mouli\\Desktop\\schemeai\\GenX\\scheme-ai\\backend\\.env' })

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dns from 'dns'
dns.setServers(['1.1.1.1', '8.8.8.8'])
import rateLimit from 'express-rate-limit'
import { connectDB } from './utils/db.js'
import { logger } from './utils/logger.js'
import chatRoutes from './routes/chat.js'
import schemeRoutes from './routes/schemes.js'
import ocrRoutes from './routes/ocr.js'
import userRoutes from './routes/users.js'
import a2aRoutes from './routes/a2a.js'
import { crawlGovernmentSchemes, startWeeklyCrawlCron } from './services/GovCrawler.js'
import { ingestDocumentsFolder, ensureDocumentsFolder } from './services/documentIngestor.js'

startWeeklyCrawlCron()

const app = express()
const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
})
app.use('/api/', limiter)

// ── Routes ────────────────────────────────────────────────────
app.use('/api/chat', chatRoutes)
app.use('/api/a2a', a2aRoutes)
app.use('/api/schemes', schemeRoutes)
app.use('/api/ocr', ocrRoutes)
app.use('/api/users', userRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Scheme-AI Backend', version: '1.0.0' })
})

// Force re-crawl — supports ?puppeteer=true for full scrape
app.post('/api/admin/refresh-schemes', async (req, res) => {
  try {
    const usePuppeteer = req.query.puppeteer === 'true'
    logger.info(`🔄 Manual scheme refresh triggered (puppeteer=${usePuppeteer})`)
    // Respond immediately so request doesn't timeout
    res.json({
      success: true,
      message: usePuppeteer
        ? 'Full Puppeteer scrape started — check terminal (takes 5-10 mins)'
        : 'Schemes refreshed from government websites',
    })
    // Run in background
    crawlGovernmentSchemes({ forceRefresh: true, usePuppeteer }).catch(err =>
      logger.error(`Background crawl error: ${err.message}`)
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  })
})

// ── Start ─────────────────────────────────────────────────────
const start = async () => {
  await connectDB()
  ensureDocumentsFolder()
  crawlGovernmentSchemes().catch(e => logger.warn(`Crawl skipped: ${e.message}`))
  ingestDocumentsFolder().catch(e => logger.warn(`Doc ingest skipped: ${e.message}`))

  app.listen(PORT, () => {
    logger.info(`🚀 Scheme-AI Backend running on http://localhost:${PORT}`)
    logger.info(`🌐 Crawling government websites for scheme data...`)
    logger.info(`📁 Drop PDFs in backend/documents/ to add local schemes`)
    logger.info(`🔄 POST /api/admin/refresh-schemes to force re-crawl`)
  })
}

start()