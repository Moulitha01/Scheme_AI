// backend/src/services/sitemapChecker.js
// Lightweight weekly sitemap diff — no Puppeteer, no GPU
import axios from 'axios'
import { logger } from '../utils/logger.js'
import { Scheme } from '../models/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITEMAP_CACHE = path.join(__dirname, '../../.sitemap-cache.json')
const MYSCHEME_SITEMAP = 'https://www.myscheme.gov.in/sitemap.xml'

function loadSitemapCache() {
  try {
    if (fs.existsSync(SITEMAP_CACHE))
      return JSON.parse(fs.readFileSync(SITEMAP_CACHE, 'utf-8'))
  } catch { }
  return { urls: [], lastChecked: null }
}

function saveSitemapCache(data) {
  try { fs.writeFileSync(SITEMAP_CACHE, JSON.stringify(data, null, 2)) } catch { }
}

// ── Fetch and parse sitemap.xml ───────────────────────────────
async function fetchSitemapUrls() {
  try {
    const res = await axios.get(MYSCHEME_SITEMAP, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/xml' },
    })
    const xml = res.data
    // Extract all scheme URLs from sitemap
    const matches = xml.match(/<loc>(https:\/\/www\.myscheme\.gov\.in\/schemes\/[^<]+)<\/loc>/g) || []
    return matches.map(m => m.replace(/<\/?loc>/g, '').trim())
  } catch (err) {
    logger.warn(`Sitemap fetch failed: ${err.message}`)
    return []
  }
}

// ── Fetch scheme detail from official page (lightweight) ───────
async function fetchSchemeDetail(url) {
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    })
    const html = res.data

    // Extract JSON-LD structured data (many govt sites include this)
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1])
        if (jsonLd.name) return { fromJsonLd: true, ...jsonLd }
      } catch { }
    }

    // Extract meta tags
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i)
    const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i)

    const name = ogTitleMatch?.[1] || titleMatch?.[1] || ''
    const description = ogDescMatch?.[1] || descMatch?.[1] || ''

    if (!name || name.length < 5) return null

    return { name: name.replace(' | myScheme', '').trim(), description, applyLink: url }
  } catch (err) {
    logger.warn(`Failed to fetch ${url}: ${err.message}`)
    return null
  }
}

function mapCategory(text = '') {
  const t = text.toLowerCase()
  if (t.includes('farm') || t.includes('kisan') || t.includes('agri') || t.includes('crop')) return 'Agriculture'
  if (t.includes('health') || t.includes('hospital') || t.includes('medical')) return 'Health'
  if (t.includes('scholar') || t.includes('student') || t.includes('educat')) return 'Education'
  if (t.includes('hous') || t.includes('awas') || t.includes('shelter')) return 'Housing'
  if (t.includes('women') || t.includes('girl') || t.includes('mahila') || t.includes('child')) return 'Women & Child'
  if (t.includes('employ') || t.includes('skill') || t.includes('job') || t.includes('training')) return 'Employment'
  if (t.includes('loan') || t.includes('pension') || t.includes('finance') || t.includes('insurance')) return 'Finance'
  if (t.includes('disab') || t.includes('divyang')) return 'Disability'
  return 'Other'
}

// ── Main sitemap checker ──────────────────────────────────────
export async function checkSitemapForUpdates() {
  logger.info('🗺️  Checking myscheme.gov.in sitemap for updates...')

  const cache = loadSitemapCache()
  const currentUrls = await fetchSitemapUrls()

  if (currentUrls.length === 0) {
    logger.warn('Could not fetch sitemap — skipping update check')
    return { newCount: 0, removedCount: 0 }
  }

  logger.info(`  📋 Sitemap has ${currentUrls.length} scheme URLs`)

  const cachedSet = new Set(cache.urls)
  const currentSet = new Set(currentUrls)

  // Find new schemes (in sitemap but not in cache)
  const newUrls = currentUrls.filter(u => !cachedSet.has(u))
  // Find removed schemes (in cache but not in sitemap)
  const removedUrls = cache.urls.filter(u => !currentSet.has(u))

  logger.info(`  ✨ New schemes: ${newUrls.length}`)
  logger.info(`  🗑️  Removed schemes: ${removedUrls.length}`)

  // Mark removed schemes as inactive
  if (removedUrls.length > 0) {
    for (const url of removedUrls) {
      try {
        await Scheme.findOneAndUpdate(
          { applyLink: url },
          { isActive: false },
        )
      } catch { }
    }
    logger.info(`  ✅ Marked ${removedUrls.length} schemes as inactive`)
  }

  // Fetch and save new schemes
  let imported = 0
  if (newUrls.length > 0) {
    logger.info(`  📥 Fetching ${newUrls.length} new scheme pages...`)
    for (const url of newUrls) {
      try {
        const detail = await fetchSchemeDetail(url)
        if (detail?.name) {
          const slug = url.split('/schemes/')[1]
          await Scheme.findOneAndUpdate(
            { applyLink: url },
            {
              name: detail.name,
              ministry: detail.publisher?.name || 'Government of India',
              category: mapCategory(detail.name + ' ' + (detail.description || '')),
              state: 'Central',
              description: detail.description || 'See official portal',
              eligibilityCriteria: ['See official portal for eligibility'],
              benefit: 'See official portal for benefits',
              documents: ['Aadhaar Card'],
              applyLink: url,
              slug,
              isActive: true,
              sourceUrl: url,
            },
            { upsert: true, new: true }
          )
          imported++
        }
        await new Promise(r => setTimeout(r, 200)) // polite delay
      } catch { }
    }
    logger.info(`  ✅ Imported ${imported} new schemes from sitemap`)
  }

  // Update cache
  saveSitemapCache({ urls: currentUrls, lastChecked: new Date().toISOString() })

  return { newCount: imported, removedCount: removedUrls.length }
}

// ── Check if sitemap needs checking ──────────────────────────
export function shouldCheckSitemap() {
  const cache = loadSitemapCache()
  if (!cache.lastChecked) return true
  const daysSince = (Date.now() - new Date(cache.lastChecked).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= 7 // check weekly
}