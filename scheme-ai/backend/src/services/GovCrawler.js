// backend/src/services/govCrawler.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'
import { ingestSchemes } from './rag.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CRAWL_CACHE_FILE = path.join(__dirname, '../../.crawl-cache.json')

// ── Curated government schemes (always accurate) ─────────────
const DIRECT_SCHEMES = [
  {
    name: 'PM-KISAN Samman Nidhi',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture',
    state: 'Central',
    description: 'Direct income support of ₹6,000 per year to all landholding farmer families in three equal installments of ₹2,000 each.',
    eligibility: ['Landholding farmer family', 'Indian citizen', 'Land ownership record required', 'Not a government employee', 'Not an income taxpayer'],
    benefit: '₹6,000/year (₹2,000 every 4 months)',
    benefitAmount: '6000',
    documents: ['Aadhaar Card', 'Land ownership document (Khatoni)', 'Bank account details', 'Mobile number'],
    applyLink: 'https://pmkisan.gov.in',
    isActive: true,
  },
  {
    name: 'Ayushman Bharat PM-JAY',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Health',
    state: 'Central',
    description: 'Health insurance coverage of ₹5 lakh per family per year for secondary and tertiary hospitalization at empanelled hospitals.',
    eligibility: ['SECC 2011 listed households', 'Deprived rural families', 'Urban workers in specific occupational categories', 'BPL families'],
    benefit: '₹5 lakh/year health insurance',
    benefitAmount: '500000',
    documents: ['Aadhaar Card', 'Ration Card', 'SECC verification letter'],
    applyLink: 'https://pmjay.gov.in',
    isActive: true,
  },
  {
    name: 'MGNREGA',
    ministry: 'Ministry of Rural Development',
    category: 'Employment',
    state: 'Central',
    description: 'Guarantees 100 days of unskilled manual employment per year to every rural household at statutory minimum wage.',
    eligibility: ['Rural adult aged 18 or above', 'Willing to do unskilled manual work', 'Resident of the Gram Panchayat area'],
    benefit: '100 days/year employment at ₹220-350/day',
    documents: ['Job Card (from Gram Panchayat)', 'Aadhaar Card', 'Bank account'],
    applyLink: 'https://nrega.nic.in',
    isActive: true,
  },
  {
    name: 'PM Awas Yojana - Gramin (PMAY-G)',
    ministry: 'Ministry of Rural Development',
    category: 'Housing',
    state: 'Central',
    description: 'Financial assistance to BPL households in rural areas for construction of pucca house with basic amenities.',
    eligibility: ['Rural household with no pucca house', 'SECC 2011 listed family', 'Priority to SC/ST, minorities, disabled'],
    benefit: '₹1.20 lakh (plains) / ₹1.30 lakh (hilly areas)',
    documents: ['Aadhaar Card', 'SECC listing proof', 'Land document', 'Bank account'],
    applyLink: 'https://pmayg.nic.in',
    isActive: true,
  },
  {
    name: 'National Scholarship Portal (NSP)',
    ministry: 'Ministry of Education',
    category: 'Education',
    state: 'Central',
    description: 'Central portal for all government scholarships for students from SC/ST/OBC/minority communities and merit-based awards.',
    eligibility: ['Student enrolled in recognized institution', 'Family income below ₹2.5 lakh/year', 'Minimum 50% marks in last exam', 'SC/ST/OBC/Minority or merit basis'],
    benefit: 'Up to ₹50,000/year scholarship',
    documents: ['School/College ID', 'Income certificate', 'Caste certificate', 'Bank account', 'Aadhaar'],
    applyLink: 'https://scholarships.gov.in',
    isActive: true,
  },
  {
    name: 'PM Ujjwala Yojana',
    ministry: 'Ministry of Petroleum & Natural Gas',
    category: 'Women & Child',
    state: 'Central',
    description: 'Free LPG connections to women from BPL and poor households to promote clean cooking fuel.',
    eligibility: ['Woman from BPL household', 'Age 18 or above', 'No existing LPG connection', 'Name in SECC 2011 or BPL list'],
    benefit: 'Free LPG connection + ₹1,600 subsidy + first refill free',
    documents: ['BPL Ration Card', 'Aadhaar Card', 'Bank account', 'Passport photo'],
    applyLink: 'https://pmuy.gov.in',
    isActive: true,
  },
  {
    name: 'MUDRA Yojana',
    ministry: 'Ministry of Finance',
    category: 'Finance',
    state: 'Central',
    description: 'Collateral-free micro loans to non-corporate small and micro businesses in manufacturing, trading and service sectors.',
    eligibility: ['Micro or small business owner', 'Non-farm income generating activity', 'No default history', 'Indian citizen'],
    benefit: 'Shishu: up to ₹50,000 | Kishore: up to ₹5 lakh | Tarun: up to ₹10 lakh',
    documents: ['Business proof', 'Aadhaar Card', 'Address proof', 'Bank statements'],
    applyLink: 'https://mudra.org.in',
    isActive: true,
  },
  {
    name: 'Sukanya Samriddhi Yojana',
    ministry: 'Ministry of Finance',
    category: 'Women & Child',
    state: 'Central',
    description: 'Small savings scheme for girl child education and marriage with highest interest rates and full tax exemption.',
    eligibility: ['Girl child below 10 years', 'Parent or legal guardian', 'Indian resident', 'Max 2 accounts per family'],
    benefit: '8.2% interest per annum + full tax exemption',
    documents: ['Birth certificate of girl', 'Parent Aadhaar and PAN', 'Address proof'],
    applyLink: 'https://www.indiapost.gov.in',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    category: 'Employment',
    state: 'Central',
    description: 'Free skill development training and certification to youth to improve employability.',
    eligibility: ['Indian national aged 15-45 years', 'School/college dropout or pass out', 'Willing to undergo skill training'],
    benefit: 'Free training + ₹8,000 reward on certification + placement assistance',
    documents: ['Aadhaar Card', 'Education certificates', 'Bank account', 'Passport photo'],
    applyLink: 'https://pmkvyofficial.org',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Vaya Vandana Yojana (PMVVY)',
    ministry: 'Ministry of Finance',
    category: 'Finance',
    state: 'Central',
    description: 'Pension scheme for senior citizens above 60 years providing assured pension for 10 years with LIC of India.',
    eligibility: ['Senior citizen aged 60 years or above', 'Indian resident', 'Investment minimum ₹1.56 lakh'],
    benefit: '₹1,000/month to ₹9,250/month pension for 10 years',
    documents: ['Age proof', 'Aadhaar Card', 'Bank account details', 'PAN card'],
    applyLink: 'https://licindia.in',
    isActive: true,
  },
  {
    name: 'Janani Suraksha Yojana (JSY)',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Health',
    state: 'Central',
    description: 'Safe motherhood scheme to reduce maternal and neo-natal mortality by promoting institutional delivery.',
    eligibility: ['Pregnant woman below poverty line', 'Age 19 or above', 'Up to 2 live births', 'Institutional delivery'],
    benefit: '₹1,400 cash (rural) / ₹1,000 (urban) for institutional delivery',
    documents: ['Aadhaar Card', 'BPL card', 'Bank account', 'Ante-natal care records'],
    applyLink: 'https://nhm.gov.in',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture',
    state: 'Central',
    description: 'Crop insurance providing financial support to farmers for crop loss due to calamities like drought and floods.',
    eligibility: ['Farmer with notified crop in notified area', 'Both loanee and non-loanee farmers', 'Land records required'],
    benefit: 'Full insured sum on crop failure + only 2% premium for Kharif crops',
    documents: ['Aadhaar Card', 'Bank account', 'Land records (Khatoni)', 'Crop sowing certificate'],
    applyLink: 'https://pmfby.gov.in',
    isActive: true,
  },
  {
    name: 'Atal Pension Yojana (APY)',
    ministry: 'Ministry of Finance',
    category: 'Finance',
    state: 'Central',
    description: 'Guaranteed pension scheme for unorganized sector workers providing fixed monthly pension after age 60.',
    eligibility: ['Indian citizen aged 18-40 years', 'Has a savings bank account', 'Not covered under statutory social security'],
    benefit: '₹1,000 to ₹5,000/month guaranteed pension after 60',
    documents: ['Aadhaar Card', 'Savings bank account', 'Mobile number'],
    applyLink: 'https://npscra.nsdl.co.in',
    isActive: true,
  },
  {
    name: 'DDU-GKY (Deen Dayal Upadhyaya Grameen Kaushalya Yojana)',
    ministry: 'Ministry of Rural Development',
    category: 'Employment',
    state: 'Central',
    description: 'Skill training and placement program for rural poor youth for regular salaried employment in organized sector.',
    eligibility: ['Rural youth aged 15-35 years', 'From poor families (BPL)', 'Willing to take up employment', 'Minimum Class 5 pass'],
    benefit: 'Free training + placement in organized sector + post-placement support',
    documents: ['Aadhaar Card', 'Education certificate', 'Income/BPL certificate', 'Bank account'],
    applyLink: 'https://ddugky.gov.in',
    isActive: true,
  },
]

// ── Map raw category strings ──────────────────────────────────
function mapCategory(raw = '') {
  const r = raw.toLowerCase()
  if (r.includes('agri') || r.includes('farm') || r.includes('kisan')) return 'Agriculture'
  if (r.includes('health') || r.includes('medical')) return 'Health'
  if (r.includes('edu') || r.includes('scholar')) return 'Education'
  if (r.includes('hous') || r.includes('awas')) return 'Housing'
  if (r.includes('women') || r.includes('child') || r.includes('girl')) return 'Women & Child'
  if (r.includes('employ') || r.includes('skill') || r.includes('job')) return 'Employment'
  if (r.includes('financ') || r.includes('loan') || r.includes('pension')) return 'Finance'
  return 'Other'
}

// ── Try live MyScheme API ─────────────────────────────────────
async function fetchMySchemeAPI() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(
      'https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=&limit=50',
      { signal: controller.signal, headers: { Accept: 'application/json' } }
    )
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!data?.data?.schemes) return []
    return data.data.schemes
      .map(s => ({
        name: s.schemeName || s.name || '',
        ministry: s.nodalMinistryName || 'Government of India',
        category: mapCategory(s.schemeCategory || ''),
        state: s.level === 'State' ? (s.state || 'Central') : 'Central',
        description: s.briefDescription || s.description || '',
        eligibility: Array.isArray(s.eligibility) ? s.eligibility : ['See official portal'],
        benefit: s.benefits || 'See official portal',
        documents: Array.isArray(s.documents) ? s.documents : [],
        applyLink: s.schemeUrl || '',
        isActive: true,
      }))
      .filter(s => s.name && s.description)
  } catch (e) {
    logger.warn(`MyScheme API fetch failed: ${e.message}`)
    return []
  }
}

// ── Load / save cache ─────────────────────────────────────────
function loadCache() {
  try {
    if (fs.existsSync(CRAWL_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CRAWL_CACHE_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return { lastCrawled: null, schemeCount: 0 }
}

function saveCache(data) {
  try {
    fs.writeFileSync(CRAWL_CACHE_FILE, JSON.stringify(data, null, 2))
  } catch { /* ignore */ }
}

// ── Main crawl function ───────────────────────────────────────
export async function crawlGovernmentSchemes({ forceRefresh = false } = {}) {
  try {
    const cache = loadCache()
    const hoursSince = cache.lastCrawled
      ? (Date.now() - new Date(cache.lastCrawled).getTime()) / 3600000
      : 999

    if (!forceRefresh && hoursSince < 24) {
      logger.info(`🌐 Skipping crawl — last crawled ${Math.round(hoursSince)}h ago (${cache.schemeCount} schemes in DB)`)
      return
    }

    logger.info('🌐 Crawling government websites for latest scheme data...')

    // Try live API
    const liveSchemes = await fetchMySchemeAPI()
    logger.info(`  📡 MyScheme API: ${liveSchemes.length} live schemes`)

    // Merge with curated schemes, deduplicate by name
    const allSchemes = [...DIRECT_SCHEMES]
    const existingNames = new Set(allSchemes.map(s => s.name.toLowerCase()))

    for (const scheme of liveSchemes) {
      if (scheme.name && !existingNames.has(scheme.name.toLowerCase())) {
        allSchemes.push(scheme)
        existingNames.add(scheme.name.toLowerCase())
      }
    }

    logger.info(`  📊 Total schemes to ingest: ${allSchemes.length}`)
    await ingestSchemes(allSchemes)

    saveCache({ lastCrawled: new Date().toISOString(), schemeCount: allSchemes.length })
    logger.info(`✅ Crawl complete: ${allSchemes.length} schemes ingested into RAG`)

  } catch (err) {
    logger.error(`Government crawl error: ${err.message}`)
  }
}

export async function forceRefreshSchemes() {
  return crawlGovernmentSchemes({ forceRefresh: true })
}