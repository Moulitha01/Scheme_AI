// backend/src/services/GovCrawler.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'
import { ingestSchemes } from './rag.js'
import { importHuggingFaceDataset, isHFImportNeeded } from './hfImporter.js'
import { checkSitemapForUpdates, shouldCheckSitemap } from './sitemapChecker.js'
import axios from 'axios'
import cron from 'node-cron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Fallback curated schemes ──────────────────────────────────
const FALLBACK_SCHEMES = [
  {
    name: 'PM-KISAN Samman Nidhi',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture', state: 'Central',
    description: 'Direct income support of ₹6,000/year to landholding farmer families.',
    eligibilityCriteria: ['Landholding farmer', 'Indian citizen', 'Not a government employee'],
    benefit: '₹6,000/year in 3 installments',
    documents: ['Aadhaar Card', 'Land records', 'Bank account'],
    applyLink: 'https://pmkisan.gov.in', isActive: true,
  },
  {
    name: 'Ayushman Bharat PM-JAY',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Health', state: 'Central',
    description: '₹5 lakh health insurance per family per year.',
    eligibilityCriteria: ['SECC 2011 listed households', 'BPL families'],
    benefit: '₹5 lakh/year health insurance',
    documents: ['Aadhaar Card', 'Ration Card'],
    applyLink: 'https://pmjay.gov.in', isActive: true,
  },
  {
    name: 'MGNREGA',
    ministry: 'Ministry of Rural Development',
    category: 'Employment', state: 'Central',
    description: '100 days guaranteed employment for rural households.',
    eligibilityCriteria: ['Rural adult 18+', 'Unskilled manual work'],
    benefit: '100 days/year at ₹220-350/day',
    documents: ['Job Card', 'Aadhaar Card', 'Bank account'],
    applyLink: 'https://nrega.nic.in', isActive: true,
  },
  {
    name: 'PM Awas Yojana - Gramin',
    ministry: 'Ministry of Rural Development',
    category: 'Housing', state: 'Central',
    description: 'Housing assistance for BPL rural families.',
    eligibilityCriteria: ['Rural BPL household', 'No pucca house', 'SECC listed'],
    benefit: '₹1.20-1.30 lakh for house construction',
    documents: ['Aadhaar Card', 'SECC proof', 'Land document'],
    applyLink: 'https://pmayg.nic.in', isActive: true,
  },
  {
    name: 'National Scholarship Portal (NSP)',
    ministry: 'Ministry of Education',
    category: 'Education', state: 'Central',
    description: 'Scholarships for SC/ST/OBC/minority students.',
    eligibilityCriteria: ['Student in recognized institution', 'Income below ₹2.5 lakh', 'Min 50% marks'],
    benefit: 'Up to ₹50,000/year scholarship',
    documents: ['College ID', 'Income certificate', 'Caste certificate', 'Aadhaar'],
    applyLink: 'https://scholarships.gov.in', isActive: true,
  },
  {
    name: 'PM Ujjwala Yojana',
    ministry: 'Ministry of Petroleum & Natural Gas',
    category: 'Women & Child', state: 'Central',
    description: 'Free LPG connection for BPL women.',
    eligibilityCriteria: ['BPL woman', 'Age 18+', 'No LPG connection'],
    benefit: 'Free LPG + ₹1,600 subsidy + first refill',
    documents: ['BPL Ration Card', 'Aadhaar Card', 'Bank account'],
    applyLink: 'https://pmuy.gov.in', isActive: true,
  },
  {
    name: 'MUDRA Yojana',
    ministry: 'Ministry of Finance',
    category: 'Finance', state: 'Central',
    description: 'Collateral-free loans for small businesses.',
    eligibilityCriteria: ['Small business owner', 'Non-farm activity'],
    benefit: 'Shishu ₹50K | Kishore ₹5L | Tarun ₹10L',
    documents: ['Business proof', 'Aadhaar Card', 'Bank statements'],
    applyLink: 'https://mudra.org.in', isActive: true,
  },
  {
    name: 'Atal Pension Yojana (APY)',
    ministry: 'Ministry of Finance',
    category: 'Finance', state: 'Central',
    description: 'Guaranteed pension for unorganized sector workers.',
    eligibilityCriteria: ['Age 18-40', 'Savings bank account'],
    benefit: '₹1,000-5,000/month after age 60',
    documents: ['Aadhaar Card', 'Bank account'],
    applyLink: 'https://npscra.nsdl.co.in', isActive: true,
  },
  {
    name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
    ministry: 'Ministry of Skill Development',
    category: 'Employment', state: 'Central',
    description: 'Free skill training for youth.',
    eligibilityCriteria: ['Age 15-45', 'Indian national'],
    benefit: 'Free training + ₹8,000 + placement',
    documents: ['Aadhaar Card', 'Education certificates'],
    applyLink: 'https://pmkvyofficial.org', isActive: true,
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    ministry: 'Ministry of Agriculture',
    category: 'Agriculture', state: 'Central',
    description: 'Crop insurance for farmers.',
    eligibilityCriteria: ['Farmer with notified crop'],
    benefit: 'Full crop loss coverage at 2% premium',
    documents: ['Aadhaar Card', 'Land records', 'Crop sowing certificate'],
    applyLink: 'https://pmfby.gov.in', isActive: true,
  },
  {
    name: 'Kalaignar Magalir Urimai Thittam',
    ministry: 'Government of Tamil Nadu',
    category: 'Women & Child', state: 'Tamil Nadu',
    description: '₹1,000/month for women heads of family in Tamil Nadu.',
    eligibilityCriteria: ['Woman head of family in TN', 'Age 21+', 'Income below ₹2.5 lakh'],
    benefit: '₹1,000/month',
    documents: ['Aadhaar Card', 'Ration Card', 'Bank account'],
    applyLink: 'https://www.tn.gov.in', isActive: true,
  },
  {
    name: 'Rythu Bandhu (Telangana)',
    ministry: 'Government of Telangana',
    category: 'Agriculture', state: 'Telangana',
    description: '₹10,000/acre/year investment support for Telangana farmers.',
    eligibilityCriteria: ['Farmer in Telangana', 'Land owner with Pattadar passbook'],
    benefit: '₹10,000/acre/year',
    documents: ['Aadhaar Card', 'Pattadar passbook', 'Bank account'],
    applyLink: 'https://rythubandhu.telangana.gov.in', isActive: true,
  },
  {
    name: 'YSR Aarogyasri (Andhra Pradesh)',
    ministry: 'Government of Andhra Pradesh',
    category: 'Health', state: 'Andhra Pradesh',
    description: 'Free healthcare up to ₹5 lakh for AP families.',
    eligibilityCriteria: ['AP resident', 'All income groups'],
    benefit: '₹5 lakh free treatment',
    documents: ['Aadhaar Card', 'AP Ration Card'],
    applyLink: 'https://ysrarogyasri.ap.gov.in', isActive: true,
  },
  {
    name: 'Gruha Lakshmi Scheme (Karnataka)',
    ministry: 'Government of Karnataka',
    category: 'Women & Child', state: 'Karnataka',
    description: '₹2,000/month for woman head of family in Karnataka.',
    eligibilityCriteria: ['Woman head of family in Karnataka', 'Ration card holder'],
    benefit: '₹2,000/month',
    documents: ['Aadhaar Card', 'Ration Card', 'Bank account'],
    applyLink: 'https://sevasindhu.karnataka.gov.in', isActive: true,
  },
  {
    name: 'Kudumbashree Mission (Kerala)',
    ministry: 'Government of Kerala',
    category: 'Finance', state: 'Kerala',
    description: 'Women SHG micro credit program in Kerala.',
    eligibilityCriteria: ['Woman in Kerala', 'BPL or low income'],
    benefit: 'Micro credit + skill training',
    documents: ['Aadhaar Card', 'Ration Card'],
    applyLink: 'https://kudumbashree.org', isActive: true,
  },
]

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
      category: 'Other',
      state: 'Central',
      description: s.briefDescription || '',
      eligibilityCriteria: Array.isArray(s.eligibility) ? s.eligibility : ['See official portal'],
      benefit: s.benefits || 'See official portal',
      documents: [],
      applyLink: s.schemeUrl || '',
      isActive: true,
    })).filter(s => s.name && s.description)
  } catch (e) {
    logger.warn(`MyScheme API failed: ${e.message}`)
    return []
  }
}

// ── Main crawl ────────────────────────────────────────────────
export async function crawlGovernmentSchemes({ forceRefresh = false } = {}) {
  try {
    // Step 1: One-time HuggingFace PDF import (2877 schemes)
    const hfNeeded = await isHFImportNeeded()
    if (hfNeeded) {
      logger.info('📚 Starting HuggingFace dataset import (this runs once)...')
      await importHuggingFaceDataset({ batchSize: 50 })
    }

    // Step 2: Weekly sitemap diff — only fetch new/removed schemes
    if (forceRefresh || shouldCheckSitemap()) {
      logger.info('🗺️  Running weekly sitemap check...')
      await checkSitemapForUpdates()
    }

    // Step 3: Always ensure fallback schemes exist
    const seenNames = new Set()
    for (const s of FALLBACK_SCHEMES) {
      if (!seenNames.has(s.name.toLowerCase())) {
        seenNames.add(s.name.toLowerCase())
      }
    }
    await ingestSchemes(FALLBACK_SCHEMES)

    // Step 4: Try MyScheme API for any bonus schemes
    const apiSchemes = await fetchMySchemeAPI()
    if (apiSchemes.length > 0) {
      logger.info(`  📡 MyScheme API: ${apiSchemes.length} schemes`)
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

// ── Cron jobs ─────────────────────────────────────────────────
export function startWeeklyCrawlCron() {
  // Every Sunday at 2 AM — sitemap diff check
  cron.schedule('0 2 * * 0', async () => {
    logger.info('⏰ Weekly cron: checking sitemap for scheme updates...')
    await crawlGovernmentSchemes({ forceRefresh: true })
  })

  logger.info('⏰ Weekly sitemap check cron scheduled (every Sunday 3 AM)')
}