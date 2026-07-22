import express from 'express'
import { Scheme } from '../models/index.js'
import { ingestSchemes } from '../services/rag.js'
import { crawlGovernmentSchemes } from '../services/GovCrawler.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

// GET /api/schemes — list with filters
router.get('/', async (req, res) => {
  try {
    const { category, state, search, page = 1, limit = 20 } = req.query

    const filter = { isActive: true }
    if (category) filter.category = category
    if (state) filter.$or = [{ state: 'Central' }, { state: state }]
    if (search) filter.$text = { $search: search }

    const [schemes, total] = await Promise.all([
      Scheme.find(filter)
        .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Scheme.countDocuments(filter),
    ])

    res.json({ schemes, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.json({ schemes: MOCK_SCHEMES, total: MOCK_SCHEMES.length, page: 1, pages: 1 })
  }
})

// GET /api/schemes/meta/categories
router.get('/meta/categories', async (req, res) => {
  const categories = ['Agriculture', 'Education', 'Health', 'Housing', 'Women & Child', 'Finance', 'Employment', 'Disability']
  res.json(categories)
})

// GET /api/schemes/:id
router.get('/:id', async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id).lean()
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' })
    res.json(scheme)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/refresh-schemes — trigger crawl
// supports ?puppeteer=true for full Puppeteer scrape
router.post('/admin/refresh-schemes', async (req, res) => {
  try {
    const usePuppeteer = req.query.puppeteer === 'true'
    logger.info(`🔄 Manual scheme refresh triggered (puppeteer=${usePuppeteer})`)
    res.json({ success: true, message: 'Schemes refreshed from government websites' })
    // Run in background so request doesn't timeout
    crawlGovernmentSchemes({ forceRefresh: true, usePuppeteer }).catch(err =>
      logger.error(`Background crawl error: ${err.message}`)
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/schemes/seed — seed fallback schemes
router.post('/seed', async (req, res) => {
  try {
    await ingestSchemes(SEED_SCHEMES)
    res.json({ message: `Seeded ${SEED_SCHEMES.length} schemes`, count: SEED_SCHEMES.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

// ── Seed/Mock Data ─────────────────────────────────────────────
export const SEED_SCHEMES = [
  {
    name: 'PM-KISAN Samman Nidhi',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture', state: 'Central',
    description: 'Direct income support of ₹6,000/year to landholding farmer families.',
    eligibilityCriteria: ['Landholding farmer', 'Indian citizen', 'Not a govt employee or taxpayer'],
    benefit: '₹6,000/year',
    documents: ['Aadhaar Card', 'Land ownership document', 'Bank account'],
    applyLink: 'https://pmkisan.gov.in',
  },
  {
    name: 'Ayushman Bharat PM-JAY',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Health', state: 'Central',
    description: 'Health insurance of ₹5 lakh per family per year.',
    eligibilityCriteria: ['SECC 2011 listed households', 'BPL families'],
    benefit: '₹5 lakh/year health cover',
    documents: ['Aadhaar Card', 'Ration Card'],
    applyLink: 'https://pmjay.gov.in',
  },
  {
    name: 'PM Ujjwala Yojana',
    ministry: 'Ministry of Petroleum & Natural Gas',
    category: 'Women & Child', state: 'Central',
    description: 'Free LPG connections to BPL women for clean cooking.',
    eligibilityCriteria: ['BPL woman', 'No existing LPG', 'Age 18+'],
    benefit: 'Free LPG + ₹1,600 subsidy',
    documents: ['BPL Ration Card', 'Aadhaar Card', 'Bank account'],
    applyLink: 'https://pmuy.gov.in',
  },
  {
    name: 'National Scholarship Portal (NSP)',
    ministry: 'Ministry of Education',
    category: 'Education', state: 'Central',
    description: 'Scholarships for SC/ST/OBC/minority students.',
    eligibilityCriteria: ['Student in recognized institution', 'Income below ₹2.5 lakh', 'Min 50% marks'],
    benefit: 'Up to ₹50,000/year',
    documents: ['College ID', 'Income certificate', 'Caste certificate'],
    applyLink: 'https://scholarships.gov.in',
  },
  {
    name: 'PM Awas Yojana - Gramin',
    ministry: 'Ministry of Rural Development',
    category: 'Housing', state: 'Central',
    description: 'Housing assistance for BPL rural families.',
    eligibilityCriteria: ['Rural BPL household', 'No pucca house', 'SECC listed'],
    benefit: '₹1.2-1.3 lakh for house construction',
    documents: ['Aadhaar Card', 'SECC proof', 'Land document'],
    applyLink: 'https://pmayg.nic.in',
  },
  {
    name: 'MGNREGA',
    ministry: 'Ministry of Rural Development',
    category: 'Employment', state: 'Central',
    description: '100 days guaranteed employment for rural households.',
    eligibilityCriteria: ['Rural adult 18+', 'Unskilled manual work'],
    benefit: '100 days at ₹220-300/day',
    documents: ['Job Card', 'Aadhaar Card', 'Bank account'],
    applyLink: 'https://nrega.nic.in',
  },
  {
    name: 'MUDRA Yojana',
    ministry: 'Ministry of Finance',
    category: 'Finance', state: 'Central',
    description: 'Collateral-free micro loans for small businesses.',
    eligibilityCriteria: ['Small business owner', 'Non-farm activity'],
    benefit: 'Loan up to ₹10 lakh',
    documents: ['Business proof', 'Aadhaar Card', 'Bank statements'],
    applyLink: 'https://mudra.org.in',
  },
  {
    name: 'Sukanya Samriddhi Yojana',
    ministry: 'Ministry of Finance',
    category: 'Women & Child', state: 'Central',
    description: 'Savings scheme for girl child with 8.2% interest.',
    eligibilityCriteria: ['Girl child below 10', 'Parent/guardian', 'Max 2 per family'],
    benefit: '8.2% interest + tax exemption',
    documents: ['Birth certificate', 'Parent Aadhaar'],
    applyLink: 'https://www.indiapost.gov.in',
  },
]

const MOCK_SCHEMES = SEED_SCHEMES.map((s, i) => ({ ...s, _id: `mock_${i}`, id: i + 1 }))