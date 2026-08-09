// backend/src/services/GovCrawler.js
import { logger } from '../utils/logger.js'
import { ingestSchemes } from './rag.js'
import { importHuggingFaceDataset, isHFImportNeeded } from './hfImporter.js'
import { checkSitemapForUpdates, shouldCheckSitemap } from './sitemapChecker.js'
import axios from 'axios'
import cron from 'node-cron'

// ── State-specific schemes (HuggingFace doesn't cover these) ──
import { STATE_SCHEMES } from '../data/stateSchemes.js'
// ── Try MyScheme API ──────────────────────────────────────────
async function fetchMySchemeAPI() {
  try {
    const res = await axios.get(
      'https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=&limit=100',
      { timeout: 8000, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!res.data?.data?.schemes) return []
    return res.data.data.schemes.map(s => ({
      name: s.schemeName || '',
      ministry: s.nodalMinistryName || 'Government of India',
      category: 'Other', state: 'Central',
      description: s.briefDescription || '',
      eligibilityCriteria: Array.isArray(s.eligibility) ? s.eligibility : ['See official portal'],
      benefit: s.benefits || 'See official portal',
      documents: [], applyLink: s.schemeUrl || '', isActive: true,
    })).filter(s => s.name && s.description)
  } catch (e) {
    logger.warn(`MyScheme API failed: ${e.message}`)
    return []
  }
}

// ── Main crawl ────────────────────────────────────────────────
export async function crawlGovernmentSchemes({ forceRefresh = false } = {}) {
  try {
    // Step 1: One-time HuggingFace PDF import (2153 Central schemes)
    const hfNeeded = await isHFImportNeeded()
    if (hfNeeded) {
      logger.info('📚 Starting HuggingFace dataset import (runs once)...')
      await importHuggingFaceDataset({ batchSize: 50 })
    }

    // Step 2: Weekly sitemap diff — only fetch new/removed schemes
    if (forceRefresh || shouldCheckSitemap()) {
      logger.info('🗺️  Running weekly sitemap check...')
      await checkSitemapForUpdates()
    }

    // Step 3: Ingest state-specific schemes (always keep fresh)
    logger.info(`📍 Ingesting ${STATE_SCHEMES.length} state-specific schemes...`)
    await ingestSchemes(STATE_SCHEMES)

    // Step 4: Try MyScheme API for bonus central schemes
    const apiSchemes = await fetchMySchemeAPI()
    if (apiSchemes.length > 0) {
      logger.info(`  📡 MyScheme API: ${apiSchemes.length} additional schemes`)
      await ingestSchemes(apiSchemes)
    }

    // Log total
    const { Scheme } = await import('../models/index.js')
    const total = await Scheme.countDocuments({ isActive: true })
    logger.info(`✅ Total active schemes in DB: ${total}`)

  } catch (err) {
    logger.error(`Crawl error: ${err.message}`)
  }
}

export async function forceRefreshSchemes() {
  return crawlGovernmentSchemes({ forceRefresh: true })
}

export function startWeeklyCrawlCron() {
  cron.schedule('0 2 * * 0', async () => {
    logger.info('⏰ Weekly cron: checking sitemap for updates...')
    await crawlGovernmentSchemes({ forceRefresh: true })
  })
  logger.info('⏰ Weekly sitemap check cron scheduled (every Sunday 2 AM)')
}