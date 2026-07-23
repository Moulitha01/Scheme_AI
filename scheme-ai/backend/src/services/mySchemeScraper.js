// backend/src/services/mySchemeScraper.js
import puppeteer from 'puppeteer'
import { logger } from '../utils/logger.js'

const MYSCHEME_BASE = 'https://www.myscheme.gov.in'

// Direct scheme URLs - bypass category filtering issue
const SCHEME_SEARCH_QUERIES = [
  { query: 'farmer agriculture kisan', category: 'Agriculture', state: 'Central' },
  { query: 'scholarship student education', category: 'Education', state: 'Central' },
  { query: 'health insurance hospital', category: 'Health', state: 'Central' },
  { query: 'housing shelter awas', category: 'Housing', state: 'Central' },
  { query: 'women child girl mahila', category: 'Women & Child', state: 'Central' },
  { query: 'employment skill training job', category: 'Employment', state: 'Central' },
  { query: 'loan finance business mudra', category: 'Finance', state: 'Central' },
  { query: 'pension elderly senior citizen', category: 'Finance', state: 'Central' },
  { query: 'disability divyang handicap', category: 'Disability', state: 'Central' },
  { query: 'Tamil Nadu scheme', category: 'Other', state: 'Tamil Nadu' },
  { query: 'Kerala scheme welfare', category: 'Other', state: 'Kerala' },
  { query: 'Karnataka scheme', category: 'Other', state: 'Karnataka' },
  { query: 'Andhra Pradesh scheme', category: 'Other', state: 'Andhra Pradesh' },
  { query: 'Telangana scheme welfare', category: 'Other', state: 'Telangana' },
  { query: 'Maharashtra scheme', category: 'Other', state: 'Maharashtra' },
  { query: 'Gujarat scheme welfare', category: 'Other', state: 'Gujarat' },
]

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })
}

// ── Collect links from search query ──────────────────────────
async function collectFromSearch(page, query, category, state) {
  try {
    const url = `${MYSCHEME_BASE}/search?q=${encodeURIComponent(query)}`
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
    await new Promise(r => setTimeout(r, 4000))

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await new Promise(r => setTimeout(r, 1000))
    }

    const links = await page.evaluate(() => {
      const found = []
      document.querySelectorAll('a[href*="/schemes/"]').forEach(el => {
        const href = el.getAttribute('href')
        const card = el.closest('[class*="card"], [class*="scheme"], article, li')
        const name =
          card?.querySelector('h2,h3,h4,[class*="title"],[class*="name"]')?.textContent?.trim() ||
          el.querySelector('h2,h3,h4')?.textContent?.trim() ||
          el.textContent?.trim()?.split('\n')?.[0]?.trim()

        if (href?.includes('/schemes/') && !href.includes('#') && name?.length > 4) {
          found.push({ href, name: name.slice(0, 150) })
        }
      })
      return [...new Map(found.map(l => [l.href, l])).values()]
    })

    return links.map(l => ({ ...l, category, state }))
  } catch (err) {
    logger.warn(`Search failed for "${query}": ${err.message}`)
    return []
  }
}

// ── Scrape scheme detail page ─────────────────────────────────
async function scrapeSchemeDetail(browser, link) {
  const page = await browser.newPage()
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    const url = link.href.startsWith('http') ? link.href : `${MYSCHEME_BASE}${link.href}`

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
    await new Promise(r => setTimeout(r, 4000))

    const data = await page.evaluate((fallbackName, pageUrl) => {
      const getText = (...sels) => {
        for (const sel of sels) {
          try {
            const el = document.querySelector(sel)
            const t = el?.textContent?.trim()
            if (t && t.length > 2) return t
          } catch { }
        }
        return null
      }

      const getList = (...sels) => {
        for (const sel of sels) {
          try {
            const els = document.querySelectorAll(sel)
            if (els.length) {
              const items = Array.from(els)
                .map(e => e.textContent.trim())
                .filter(t => t.length > 3 && t.length < 300)
              if (items.length) return items.slice(0, 10)
            }
          } catch { }
        }
        return []
      }

      const name = getText('h1', '[class*="schemeName"]', '[class*="scheme-name"]') || fallbackName
      const ministry = getText('[class*="ministry"]', '[class*="Ministry"]', '[class*="department"]') || 'Government of India'

      const allParas = Array.from(document.querySelectorAll('p'))
        .map(p => p.textContent.trim())
        .filter(t => t.length > 40 && !t.toLowerCase().includes('cookie') && !t.toLowerCase().includes('copyright'))
        .slice(0, 4)
      const description = allParas.join(' ').slice(0, 600)

      const benefit = getText('[class*="benefit"]', '[class*="Benefit"]') || 'See official portal'

      const eligibilityCriteria = getList('[class*="eligib"] li', '[class*="Eligib"] li', '[id*="eligib"] li')
      const documents = getList('[class*="document"] li', '[class*="Document"] li', '[id*="document"] li')

      const applyBtn = document.querySelector('a[href*="apply"], a[class*="apply"]')
      const applyLink = applyBtn?.href || pageUrl

      const stateEl = document.querySelector('[class*="state"], [class*="State"]')
      const detectedState = stateEl?.textContent?.trim()

      return { name, ministry: ministry.slice(0, 200), description, benefit: benefit.slice(0, 300), eligibilityCriteria, documents, applyLink, detectedState }
    }, link.name, url)

    if (!data.name || data.description.length < 30) return null

    return {
      name: data.name,
      ministry: data.ministry,
      category: link.category,
      state: data.detectedState || link.state,
      description: data.description,
      benefit: data.benefit,
      eligibilityCriteria: data.eligibilityCriteria.length ? data.eligibilityCriteria : ['See official portal'],
      documents: data.documents.length ? data.documents : ['Aadhaar Card'],
      applyLink: data.applyLink,
      isActive: true,
      sourceUrl: url,
    }
  } catch (err) {
    logger.warn(`Detail failed for ${link.name}: ${err.message}`)
    return null
  } finally {
    try { await page.close() } catch { }
  }
}

// ── Main export ───────────────────────────────────────────────
export async function scrapeMySchemePortal() {
  logger.info('🌐 Starting Puppeteer scrape of myscheme.gov.in...')
  let browser

  try {
    browser = await launchBrowser()
    const listPage = await browser.newPage()
    await listPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    await listPage.setViewport({ width: 1280, height: 800 })

    // Step 1: Collect unique links from search queries
    const allLinks = []
    const seenHrefs = new Set()

    for (const { query, category, state } of SCHEME_SEARCH_QUERIES) {
      logger.info(`  🔍 Searching: "${query}"`)
      const links = await collectFromSearch(listPage, query, category, state)
      let added = 0
      for (const link of links) {
        if (!seenHrefs.has(link.href)) {
          seenHrefs.add(link.href)
          allLinks.push(link)
          added++
        }
      }
      logger.info(`    Found ${links.length}, added ${added} new (total: ${allLinks.length})`)
      await new Promise(r => setTimeout(r, 1000))
    }

    await listPage.close()
    logger.info(`📋 Total unique URLs: ${allLinks.length}`)

    // Step 2: Scrape details
    const results = []
    const seenNames = new Set()

    for (const link of allLinks) {
      if (seenNames.has(link.name.toLowerCase())) continue
      const scheme = await scrapeSchemeDetail(browser, link)
      if (scheme && !seenNames.has(scheme.name.toLowerCase())) {
        results.push(scheme)
        seenNames.add(scheme.name.toLowerCase())
        logger.info(`  ✅ ${results.length}. ${scheme.name} [${scheme.state}]`)
      }
      await new Promise(r => setTimeout(r, 300))
    }

    logger.info(`✅ Puppeteer scrape complete: ${results.length} schemes`)
    return results

  } catch (err) {
    logger.warn(`Puppeteer error: ${err.message}`)
    return []
  } finally {
    if (browser) {
      try { await browser.close() } catch { }
    }
  }
}