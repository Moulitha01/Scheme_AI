// backend/src/services/mySchemeScraper.js
import puppeteer from 'puppeteer'
import { logger } from '../utils/logger.js'

const MYSCHEME_BASE = 'https://www.myscheme.gov.in'

const CATEGORIES = [
  'Agriculture,Rural & Environment',
  'Banking,Financial Services and Insurance',
  'Business & Entrepreneurship',
  'Education & Learning',
  'Health & Wellness',
  'Housing & Shelter',
  'Skills & Employment',
  'Social welfare & Empowerment',
  'Women and Child',
]

function mapCategory(raw = '') {
  const r = raw.toLowerCase()
  if (r.includes('agri') || r.includes('rural')) return 'Agriculture'
  if (r.includes('health') || r.includes('wellness')) return 'Health'
  if (r.includes('education') || r.includes('learning')) return 'Education'
  if (r.includes('housing') || r.includes('shelter')) return 'Housing'
  if (r.includes('women') || r.includes('child')) return 'Women & Child'
  if (r.includes('skill') || r.includes('employment')) return 'Employment'
  if (r.includes('banking') || r.includes('finance') || r.includes('business')) return 'Finance'
  return 'Other'
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })
}

async function scrapeSchemeList(page, category, state = null) {
  try {
    const encodedCat = encodeURIComponent(category)
    let url = `${MYSCHEME_BASE}/search?category=${encodedCat}`
    if (state) url += `&state=${encodeURIComponent(state)}`

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 2000))

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await new Promise(r => setTimeout(r, 1500))
    }

    const schemeLinks = await page.evaluate(() => {
      const links = []
      document.querySelectorAll('a[href*="/schemes/"]').forEach(el => {
        const href = el.getAttribute('href')
        const name = el.querySelector('h3, h2, [class*="title"]')?.textContent?.trim() ||
                     el.textContent?.trim()
        if (href && href.includes('/schemes/') && name && name.length > 3) {
          links.push({ href, name })
        }
      })
      return [...new Map(links.map(l => [l.href, l])).values()]
    })

    return schemeLinks
  } catch (err) {
    logger.warn(`Failed to scrape list for ${category}: ${err.message}`)
    return []
  }
}

async function scrapeSchemeDetail(page, schemeLink, category) {
  try {
    const url = schemeLink.href.startsWith('http')
      ? schemeLink.href
      : `${MYSCHEME_BASE}${schemeLink.href}`

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1500))

    const data = await page.evaluate((fallbackName, fallbackCategory) => {
      const getText = (selectors) => {
        for (const sel of selectors) {
          try {
            const el = document.querySelector(sel)
            if (el?.textContent?.trim()) return el.textContent.trim()
          } catch { }
        }
        return null
      }

      const getList = (selectors) => {
        for (const sel of selectors) {
          try {
            const els = document.querySelectorAll(sel)
            if (els.length) return Array.from(els).map(e => e.textContent.trim()).filter(Boolean)
          } catch { }
        }
        return []
      }

      const name = getText(['h1', '[class*="scheme-name"]', '[class*="schemeName"]']) || fallbackName
      const ministry = getText(['[class*="ministry"]', '[class*="department"]']) || 'Government of India'
      const description = getText(['[class*="description"] p', '[class*="about"] p', 'main p']) || ''
      const stateEl = document.querySelector('[class*="state"]')
      const state = stateEl?.textContent?.trim() || 'Central'
      const benefit = getText(['[class*="benefit"] p', '[class*="benefit"] li']) || 'See official portal'
      const eligibilityCriteria = getList(['[class*="eligib"] li', '[class*="criteria"] li'])
      const documents = getList(['[class*="document"] li', '[class*="required"] li'])
      const applyBtn = document.querySelector('a[href*="apply"], a[class*="apply"]')
      const applyLink = applyBtn?.href || window.location.href

      return { name, ministry, description, state, benefit, eligibilityCriteria, documents, applyLink, category: fallbackCategory }
    }, schemeLink.name, mapCategory(category))

    if (!data.name || data.description.length < 20) return null

    return {
      ...data,
      eligibilityCriteria: data.eligibilityCriteria.length ? data.eligibilityCriteria : ['See official portal'],
      documents: data.documents.length ? data.documents : ['Aadhaar Card'],
      isActive: true,
      sourceUrl: url,
    }
  } catch (err) {
    logger.warn(`Failed to scrape ${schemeLink.name}: ${err.message}`)
    return null
  }
}

export async function scrapeMySchemePortal({
  maxSchemesPerCategory = 20,
  states = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Gujarat'],
} = {}) {
  logger.info('🌐 Starting Puppeteer scrape of myscheme.gov.in...')
  const browser = await launchBrowser()
  const allSchemes = []
  const seenNames = new Set()

  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    await page.setViewport({ width: 1280, height: 800 })

    // Scrape central schemes by category
    for (const category of CATEGORIES) {
      try {
        logger.info(`  📂 Scraping: ${category}`)
        const links = await scrapeSchemeList(page, category)
        logger.info(`    Found ${links.length} links`)

        for (const link of links.slice(0, maxSchemesPerCategory)) {
          if (seenNames.has(link.name.toLowerCase())) continue
          const scheme = await scrapeSchemeDetail(page, link, category)
          if (scheme && !seenNames.has(scheme.name.toLowerCase())) {
            allSchemes.push(scheme)
            seenNames.add(scheme.name.toLowerCase())
          }
          await new Promise(r => setTimeout(r, 800))
        }
        await new Promise(r => setTimeout(r, 1000))
      } catch (err) {
        logger.warn(`  Category ${category} failed: ${err.message}`)
      }
    }

    // Scrape state-specific schemes
    for (const state of states) {
      try {
        logger.info(`  🏛️  Scraping state: ${state}`)
        const links = await scrapeSchemeList(page, 'Social welfare & Empowerment', state)

        for (const link of links.slice(0, 15)) {
          if (seenNames.has(link.name.toLowerCase())) continue
          const scheme = await scrapeSchemeDetail(page, link, 'Other')
          if (scheme) {
            scheme.state = state
            allSchemes.push(scheme)
            seenNames.add(scheme.name.toLowerCase())
          }
          await new Promise(r => setTimeout(r, 800))
        }
      } catch (err) {
        logger.warn(`  State ${state} failed: ${err.message}`)
      }
    }

  } finally {
    await browser.close()
  }

  logger.info(`✅ Puppeteer scrape complete: ${allSchemes.length} schemes`)
  return allSchemes
}// backend/src/services/mySchemeScraper.js
import puppeteer from 'puppeteer'
import { logger } from '../utils/logger.js'

const MYSCHEME_BASE = 'https://www.myscheme.gov.in'

const CATEGORIES = [
  'Agriculture,Rural & Environment',
  'Banking,Financial Services and Insurance',
  'Business & Entrepreneurship',
  'Education & Learning',
  'Health & Wellness',
  'Housing & Shelter',
  'Skills & Employment',
  'Social welfare & Empowerment',
  'Women and Child',
]

function mapCategory(raw = '') {
  const r = raw.toLowerCase()
  if (r.includes('agri') || r.includes('rural')) return 'Agriculture'
  if (r.includes('health') || r.includes('wellness')) return 'Health'
  if (r.includes('education') || r.includes('learning')) return 'Education'
  if (r.includes('housing') || r.includes('shelter')) return 'Housing'
  if (r.includes('women') || r.includes('child')) return 'Women & Child'
  if (r.includes('skill') || r.includes('employment')) return 'Employment'
  if (r.includes('banking') || r.includes('finance') || r.includes('business')) return 'Finance'
  return 'Other'
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })
}

async function scrapeSchemeList(page, category, state = null) {
  try {
    const encodedCat = encodeURIComponent(category)
    let url = `${MYSCHEME_BASE}/search?category=${encodedCat}`
    if (state) url += `&state=${encodeURIComponent(state)}`

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 2000))

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await new Promise(r => setTimeout(r, 1500))
    }

    const schemeLinks = await page.evaluate(() => {
      const links = []
      document.querySelectorAll('a[href*="/schemes/"]').forEach(el => {
        const href = el.getAttribute('href')
        const name = el.querySelector('h3, h2, [class*="title"]')?.textContent?.trim() ||
                     el.textContent?.trim()
        if (href && href.includes('/schemes/') && name && name.length > 3) {
          links.push({ href, name })
        }
      })
      return [...new Map(links.map(l => [l.href, l])).values()]
    })

    return schemeLinks
  } catch (err) {
    logger.warn(`Failed to scrape list for ${category}: ${err.message}`)
    return []
  }
}

async function scrapeSchemeDetail(page, schemeLink, category) {
  try {
    const url = schemeLink.href.startsWith('http')
      ? schemeLink.href
      : `${MYSCHEME_BASE}${schemeLink.href}`

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1500))

    const data = await page.evaluate((fallbackName, fallbackCategory) => {
      const getText = (selectors) => {
        for (const sel of selectors) {
          try {
            const el = document.querySelector(sel)
            if (el?.textContent?.trim()) return el.textContent.trim()
          } catch { }
        }
        return null
      }

      const getList = (selectors) => {
        for (const sel of selectors) {
          try {
            const els = document.querySelectorAll(sel)
            if (els.length) return Array.from(els).map(e => e.textContent.trim()).filter(Boolean)
          } catch { }
        }
        return []
      }

      const name = getText(['h1', '[class*="scheme-name"]', '[class*="schemeName"]']) || fallbackName
      const ministry = getText(['[class*="ministry"]', '[class*="department"]']) || 'Government of India'
      const description = getText(['[class*="description"] p', '[class*="about"] p', 'main p']) || ''
      const stateEl = document.querySelector('[class*="state"]')
      const state = stateEl?.textContent?.trim() || 'Central'
      const benefit = getText(['[class*="benefit"] p', '[class*="benefit"] li']) || 'See official portal'
      const eligibilityCriteria = getList(['[class*="eligib"] li', '[class*="criteria"] li'])
      const documents = getList(['[class*="document"] li', '[class*="required"] li'])
      const applyBtn = document.querySelector('a[href*="apply"], a[class*="apply"]')
      const applyLink = applyBtn?.href || window.location.href

      return { name, ministry, description, state, benefit, eligibilityCriteria, documents, applyLink, category: fallbackCategory }
    }, schemeLink.name, mapCategory(category))

    if (!data.name || data.description.length < 20) return null

    return {
      ...data,
      eligibilityCriteria: data.eligibilityCriteria.length ? data.eligibilityCriteria : ['See official portal'],
      documents: data.documents.length ? data.documents : ['Aadhaar Card'],
      isActive: true,
      sourceUrl: url,
    }
  } catch (err) {
    logger.warn(`Failed to scrape ${schemeLink.name}: ${err.message}`)
    return null
  }
}

export async function scrapeMySchemePortal({
  maxSchemesPerCategory = 20,
  states = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Gujarat'],
} = {}) {
  logger.info('🌐 Starting Puppeteer scrape of myscheme.gov.in...')
  const browser = await launchBrowser()
  const allSchemes = []
  const seenNames = new Set()

  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    await page.setViewport({ width: 1280, height: 800 })

    // Scrape central schemes by category
    for (const category of CATEGORIES) {
      try {
        logger.info(`  📂 Scraping: ${category}`)
        const links = await scrapeSchemeList(page, category)
        logger.info(`    Found ${links.length} links`)

        for (const link of links.slice(0, maxSchemesPerCategory)) {
          if (seenNames.has(link.name.toLowerCase())) continue
          const scheme = await scrapeSchemeDetail(page, link, category)
          if (scheme && !seenNames.has(scheme.name.toLowerCase())) {
            allSchemes.push(scheme)
            seenNames.add(scheme.name.toLowerCase())
          }
          await new Promise(r => setTimeout(r, 800))
        }
        await new Promise(r => setTimeout(r, 1000))
      } catch (err) {
        logger.warn(`  Category ${category} failed: ${err.message}`)
      }
    }

    // Scrape state-specific schemes
    for (const state of states) {
      try {
        logger.info(`  🏛️  Scraping state: ${state}`)
        const links = await scrapeSchemeList(page, 'Social welfare & Empowerment', state)

        for (const link of links.slice(0, 15)) {
          if (seenNames.has(link.name.toLowerCase())) continue
          const scheme = await scrapeSchemeDetail(page, link, 'Other')
          if (scheme) {
            scheme.state = state
            allSchemes.push(scheme)
            seenNames.add(scheme.name.toLowerCase())
          }
          await new Promise(r => setTimeout(r, 800))
        }
      } catch (err) {
        logger.warn(`  State ${state} failed: ${err.message}`)
      }
    }

  } finally {
    await browser.close()
  }

  logger.info(`✅ Puppeteer scrape complete: ${allSchemes.length} schemes`)
  return allSchemes
}