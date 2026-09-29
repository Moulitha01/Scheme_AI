// backend/src/services/GovCrawler.js
import { logger } from '../utils/logger.js'
import { ingestSchemes } from './rag.js'
import { importHuggingFaceDataset, isHFImportNeeded } from './hfImporter.js'
import { checkSitemapForUpdates, shouldCheckSitemap } from './sitemapChecker.js'
import axios from 'axios'
import cron from 'node-cron'

// ── State-specific schemes (HuggingFace doesn't cover these) ──
const STATE_SCHEMES = [
  // Tamil Nadu
  {
    name: 'Kalaignar Magalir Urimai Thittam',
    ministry: 'Government of Tamil Nadu',
    category: 'Women & Child', state: 'Tamil Nadu',
    description: '₹1,000/month financial assistance to women heads of families in Tamil Nadu.',
    eligibilityCriteria: ['Woman head of family in TN', 'Age 21+', 'Income below ₹2.5 lakh', 'Ration card holder'],
    benefit: '₹1,000/month direct transfer',
    documents: ['Aadhaar Card', 'Ration Card', 'Bank account'],
    applyLink: 'https://www.tn.gov.in', isActive: true,
  },
  {
    name: 'Moovalur Ramamirtham Ammaiyar Scheme',
    ministry: 'Government of Tamil Nadu - School Education',
    category: 'Education', state: 'Tamil Nadu',
    description: 'Free bicycle and cash for girl students in Class 6 and 9 in TN government schools.',
    eligibilityCriteria: ['Girl student in TN government school', 'Class 6 or 9'],
    benefit: 'Free bicycle + ₹1,000 cash',
    documents: ['School ID', 'Aadhaar Card', 'Parent bank account'],
    applyLink: 'https://www.tnschools.gov.in', isActive: true,
  },
  {
    name: 'Tamil Nadu Chief Minister Health Insurance Scheme',
    ministry: 'Government of Tamil Nadu - Health',
    category: 'Health', state: 'Tamil Nadu',
    description: 'Health insurance for TN families not covered under Ayushman Bharat.',
    eligibilityCriteria: ['Tamil Nadu resident', 'Not under PMJAY', 'Ration card holder'],
    benefit: '₹5 lakh health insurance per family',
    documents: ['Aadhaar Card', 'Ration Card', 'TN address proof'],
    applyLink: 'https://www.cmchistn.com', isActive: true,
  },
  {
    name: 'Uzhavar Pathukappu Thittam',
    ministry: 'Government of Tamil Nadu - Agriculture',
    category: 'Agriculture', state: 'Tamil Nadu',
    description: 'Personal accident insurance for farmers in Tamil Nadu.',
    eligibilityCriteria: ['Farmer in Tamil Nadu', 'Age 18-70'],
    benefit: '₹2 lakh on death, ₹1 lakh on disability',
    documents: ['Aadhaar Card', 'Land records', 'Bank account'],
    applyLink: 'https://www.tn.gov.in', isActive: true,
  },
  {
    name: 'Tamil Nadu NEEDS Scheme',
    ministry: 'Government of Tamil Nadu - Industries',
    category: 'Finance', state: 'Tamil Nadu',
    description: 'Subsidized loans for educated unemployed youth to start enterprises in Tamil Nadu.',
    eligibilityCriteria: ['TN resident', 'Age 21-35', 'Graduate/diploma holder', 'First generation entrepreneur'],
    benefit: '25% capital subsidy + 3% interest subsidy up to ₹5 crore',
    documents: ['Aadhaar Card', 'Educational certificates', 'Business plan'],
    applyLink: 'https://www.tnidb.com', isActive: true,
  },
  // Kerala
  {
    name: 'Karunya Health Scheme Kerala',
    ministry: 'Government of Kerala - Health',
    category: 'Health', state: 'Kerala',
    description: 'Free treatment for serious illnesses for BPL families in Kerala.',
    eligibilityCriteria: ['Kerala resident', 'BPL family', 'Serious illness like cancer/kidney/heart'],
    benefit: 'Up to ₹2 lakh treatment per year',
    documents: ['Aadhaar Card', 'BPL Ration Card', 'Medical certificate'],
    applyLink: 'https://karunyakerala.org', isActive: true,
  },
  {
    name: 'Kudumbashree Mission Kerala',
    ministry: 'Government of Kerala - Local Self Government',
    category: 'Finance', state: 'Kerala',
    description: 'Women SHG program for poverty reduction and empowerment in Kerala.',
    eligibilityCriteria: ['Woman in Kerala', 'BPL or low income', 'Join self-help group'],
    benefit: 'Micro credit + skill training + income generating activities',
    documents: ['Aadhaar Card', 'Ration Card', 'Kerala address proof'],
    applyLink: 'https://kudumbashree.org', isActive: true,
  },
  {
    name: 'LIFE Mission Housing Kerala',
    ministry: 'Government of Kerala - Housing',
    category: 'Housing', state: 'Kerala',
    description: 'Housing for homeless and landless families in Kerala.',
    eligibilityCriteria: ['Kerala resident', 'Homeless or kutcha house', 'No own land/house'],
    benefit: 'Free land + house up to ₹4 lakh',
    documents: ['Aadhaar Card', 'Ration Card', 'Domicile certificate'],
    applyLink: 'https://lifemission.kerala.gov.in', isActive: true,
  },
  {
    name: 'Kerala Karshaka Kshemath',
    ministry: 'Government of Kerala - Agriculture',
    category: 'Agriculture', state: 'Kerala',
    description: 'Welfare pension and support for elderly farmers in Kerala.',
    eligibilityCriteria: ['Farmer in Kerala', 'Age 60+', 'Farming as primary occupation'],
    benefit: '₹1,500/month pension + crop insurance',
    documents: ['Aadhaar Card', 'Land records', 'Kerala address proof'],
    applyLink: 'https://www.kerala.gov.in', isActive: true,
  },
  // Karnataka
  {
    name: 'Gruha Lakshmi Scheme Karnataka',
    ministry: 'Government of Karnataka - Women & Child',
    category: 'Women & Child', state: 'Karnataka',
    description: '₹2,000/month to woman head of family in Karnataka.',
    eligibilityCriteria: ['Woman head of family in Karnataka', 'Ration card holder', 'Income below ₹2 lakh'],
    benefit: '₹2,000/month direct transfer',
    documents: ['Aadhaar Card', 'Ration Card', 'Bank account'],
    applyLink: 'https://sevasindhu.karnataka.gov.in', isActive: true,
  },
  {
    name: 'Shakti Free Bus Pass Karnataka',
    ministry: 'Government of Karnataka - Transport',
    category: 'Women & Child', state: 'Karnataka',
    description: 'Free bus travel for women in all KSRTC/BMTC buses in Karnataka.',
    eligibilityCriteria: ['Woman resident of Karnataka', 'Valid ID proof'],
    benefit: 'Free unlimited bus travel in Karnataka',
    documents: ['Aadhaar Card', 'Karnataka address proof'],
    applyLink: 'https://www.ksrtc.in', isActive: true,
  },
  {
    name: 'Anna Bhagya Scheme Karnataka',
    ministry: 'Government of Karnataka - Food & Civil Supplies',
    category: 'Other', state: 'Karnataka',
    description: 'Additional free rice to BPL families in Karnataka.',
    eligibilityCriteria: ['BPL ration card in Karnataka', 'Priority household NFSA'],
    benefit: '10 kg free rice per month',
    documents: ['BPL Ration Card', 'Aadhaar Card'],
    applyLink: 'https://ahara.kar.nic.in', isActive: true,
  },
  // Andhra Pradesh
  {
    name: 'YSR Rythu Bharosa Andhra Pradesh',
    ministry: 'Government of Andhra Pradesh - Agriculture',
    category: 'Agriculture', state: 'Andhra Pradesh',
    description: 'Investment support to farmers in Andhra Pradesh.',
    eligibilityCriteria: ['Farmer in AP', 'Land owner or tenant', 'Registered in AP agriculture dept'],
    benefit: '₹13,500/year combined with PM-KISAN',
    documents: ['Aadhaar Card', 'Pattadar passbook', 'Bank account'],
    applyLink: 'https://ysrrythu.ap.gov.in', isActive: true,
  },
  {
    name: 'YSR Aarogyasri Andhra Pradesh',
    ministry: 'Government of Andhra Pradesh - Health',
    category: 'Health', state: 'Andhra Pradesh',
    description: 'Free healthcare for serious illnesses for all AP families.',
    eligibilityCriteria: ['AP resident', 'All income groups', 'Serious illness'],
    benefit: 'Up to ₹5 lakh free treatment',
    documents: ['Aadhaar Card', 'AP Ration Card'],
    applyLink: 'https://ysrarogyasri.ap.gov.in', isActive: true,
  },
  {
    name: 'YSR Cheyutha Andhra Pradesh',
    ministry: 'Government of Andhra Pradesh - Women',
    category: 'Women & Child', state: 'Andhra Pradesh',
    description: 'Financial assistance to BC/SC/ST/Minority women in AP.',
    eligibilityCriteria: ['Woman in AP from BC/SC/ST/Minority', 'Age 45-60', 'Income below ₹75,000'],
    benefit: '₹18,750/year for 4 years',
    documents: ['Aadhaar Card', 'Caste certificate', 'Income certificate'],
    applyLink: 'https://navasakam.ap.gov.in', isActive: true,
  },
  {
    name: 'Jagananna Vidya Deevena AP',
    ministry: 'Government of Andhra Pradesh - Education',
    category: 'Education', state: 'Andhra Pradesh',
    description: 'Full fee reimbursement for AP students in ITI/Polytechnic/Degree.',
    eligibilityCriteria: ['AP student in ITI/Polytechnic/Degree', 'Income below ₹2.5 lakh'],
    benefit: '100% tuition fee reimbursement',
    documents: ['Aadhaar Card', 'Income certificate', 'Admission letter'],
    applyLink: 'https://jaganannavidyadeevena.ap.gov.in', isActive: true,
  },
  // Telangana
  {
    name: 'Rythu Bandhu Telangana',
    ministry: 'Government of Telangana - Agriculture',
    category: 'Agriculture', state: 'Telangana',
    description: 'Investment support ₹10,000/acre/year for Telangana farmers.',
    eligibilityCriteria: ['Farmer in Telangana', 'Land owner with Pattadar passbook'],
    benefit: '₹10,000/acre/year',
    documents: ['Aadhaar Card', 'Pattadar passbook', 'Bank account'],
    applyLink: 'https://rythubandhu.telangana.gov.in', isActive: true,
  },
  {
    name: 'Aasara Pension Telangana',
    ministry: 'Government of Telangana - Social Welfare',
    category: 'Finance', state: 'Telangana',
    description: 'Monthly pension for elderly, widows, disabled in Telangana.',
    eligibilityCriteria: ['Telangana resident', 'Elderly 65+/widow/disabled', 'BPL or low income'],
    benefit: '₹2,016/month pension',
    documents: ['Aadhaar Card', 'Ration Card', 'Proof of age/disability'],
    applyLink: 'https://aasara.telangana.gov.in', isActive: true,
  },
  {
    name: 'KCR Kit Telangana Maternity',
    ministry: 'Government of Telangana - Health',
    category: 'Women & Child', state: 'Telangana',
    description: 'Cash and kit for pregnant women delivering at Telangana government hospitals.',
    eligibilityCriteria: ['Pregnant woman in Telangana', 'Government hospital delivery'],
    benefit: '₹12,000-13,000 cash + baby kit',
    documents: ['Aadhaar Card', 'Ration Card', 'Hospital delivery proof'],
    applyLink: 'https://www.telangana.gov.in', isActive: true,
  },
  {
    name: 'TS ePass Scholarship Telangana',
    ministry: 'Government of Telangana - BC Welfare',
    category: 'Education', state: 'Telangana',
    description: 'Scholarship for BC/SC/ST students in Telangana for higher education.',
    eligibilityCriteria: ['Telangana BC/SC/ST student', 'Income below ₹2 lakh', 'Degree/PG course'],
    benefit: 'Full fee reimbursement + maintenance',
    documents: ['Caste certificate', 'Income certificate', 'Admission proof', 'Aadhaar'],
    applyLink: 'https://telanganaepass.cgg.gov.in', isActive: true,
  },
  // Maharashtra
  {
    name: 'Mukhyamantri Majhi Ladki Bahin Yojana Maharashtra',
    ministry: 'Government of Maharashtra - Women & Child',
    category: 'Women & Child', state: 'Maharashtra',
    description: 'Monthly financial assistance to women in Maharashtra.',
    eligibilityCriteria: ['Woman in Maharashtra', 'Age 21-65', 'Income below ₹2.5 lakh'],
    benefit: '₹1,500/month direct transfer',
    documents: ['Aadhaar Card', 'Domicile certificate', 'Income certificate'],
    applyLink: 'https://ladakibahin.maharashtra.gov.in', isActive: true,
  },
  {
    name: 'Mahatma Jyotirao Phule Jan Arogya Yojana Maharashtra',
    ministry: 'Government of Maharashtra - Health',
    category: 'Health', state: 'Maharashtra',
    description: 'Health insurance for BPL families in Maharashtra.',
    eligibilityCriteria: ['Maharashtra resident', 'Yellow/orange ration card', 'BPL or low income'],
    benefit: '₹5 lakh health insurance per family',
    documents: ['Aadhaar Card', 'Yellow/Orange Ration Card'],
    applyLink: 'https://www.jeevandayee.gov.in', isActive: true,
  },
  {
    name: 'Ramai Gharkul Yojana Maharashtra',
    ministry: 'Government of Maharashtra - Social Justice',
    category: 'Housing', state: 'Maharashtra',
    description: 'Free houses for SC/Nav-Buddhist families in Maharashtra.',
    eligibilityCriteria: ['SC/Nav-Buddhist in Maharashtra', 'No own house', 'Income below ₹1 lakh'],
    benefit: 'Free house construction',
    documents: ['Caste certificate', 'Aadhaar Card', 'Income certificate'],
    applyLink: 'https://sjsa.maharashtra.gov.in', isActive: true,
  },
  // Gujarat
  {
    name: 'Mukhyamantri Mahila Utkarsh Yojana Gujarat',
    ministry: 'Government of Gujarat - Women Development',
    category: 'Women & Child', state: 'Gujarat',
    description: 'Interest-free loans to women SHGs in Gujarat.',
    eligibilityCriteria: ['Woman in Gujarat', 'SHG member'],
    benefit: 'Interest-free loan up to ₹1 lakh per member',
    documents: ['Aadhaar Card', 'SHG membership', 'Gujarat address proof'],
    applyLink: 'https://www.gujarat.gov.in', isActive: true,
  },
  {
    name: 'MA Vatsalya Yojana Gujarat',
    ministry: 'Government of Gujarat - Health',
    category: 'Health', state: 'Gujarat',
    description: 'Cashless health treatment for BPL families in Gujarat.',
    eligibilityCriteria: ['Gujarat BPL family', 'BPL ration card'],
    benefit: '₹5 lakh health insurance per family',
    documents: ['Aadhaar Card', 'BPL Ration Card', 'Gujarat address proof'],
    applyLink: 'https://mavatsalya.gujarat.gov.in', isActive: true,
  },
  {
    name: 'Kisan Suryoday Yojana Gujarat',
    ministry: 'Government of Gujarat - Agriculture',
    category: 'Agriculture', state: 'Gujarat',
    description: 'Daytime 3-phase electricity for farmers in Gujarat for irrigation.',
    eligibilityCriteria: ['Farmer in Gujarat', 'Agriculture connection holder'],
    benefit: 'Daytime electricity for irrigation at subsidized rates',
    documents: ['Aadhaar Card', 'Land records', 'Electricity connection proof'],
    applyLink: 'https://www.gujarat.gov.in', isActive: true,
  },
  // Uttar Pradesh
  {
    name: 'Kanya Sumangala Yojana UP',
    ministry: 'Government of Uttar Pradesh - Women & Child',
    category: 'Women & Child', state: 'Uttar Pradesh',
    description: 'Financial assistance for girl child education and welfare in UP.',
    eligibilityCriteria: ['Girl child in UP', 'Family income below ₹3 lakh', 'Max 2 girls per family'],
    benefit: '₹15,000 total in 6 installments from birth to Class 12',
    documents: ['Aadhaar Card', 'Birth certificate', 'Income certificate', 'Bank account'],
    applyLink: 'https://mksy.up.gov.in', isActive: true,
  },
  {
    name: 'UP Kisan Karj Rahat Yojana',
    ministry: 'Government of Uttar Pradesh - Agriculture',
    category: 'Agriculture', state: 'Uttar Pradesh',
    description: 'Loan waiver scheme for small and marginal farmers in Uttar Pradesh.',
    eligibilityCriteria: ['Farmer in UP', 'Small/marginal farmer', 'Land up to 2 hectares'],
    benefit: 'Loan waiver up to ₹1 lakh',
    documents: ['Aadhaar Card', 'Land records', 'Bank loan documents'],
    applyLink: 'https://www.up.gov.in', isActive: true,
  },
  // West Bengal
  {
    name: 'Lakshmir Bhandar West Bengal',
    ministry: 'Government of West Bengal - Women & Child',
    category: 'Women & Child', state: 'West Bengal',
    description: 'Monthly financial support to women heads of household in West Bengal.',
    eligibilityCriteria: ['Woman head of household in WB', 'Age 25-60', 'SC/ST or general category'],
    benefit: '₹1,000/month (general) or ₹1,200/month (SC/ST)',
    documents: ['Aadhaar Card', 'Ration Card', 'Bank account', 'WB address proof'],
    applyLink: 'https://wb.gov.in', isActive: true,
  },
  {
    name: 'Swasthya Sathi West Bengal',
    ministry: 'Government of West Bengal - Health',
    category: 'Health', state: 'West Bengal',
    description: 'Health insurance for all families in West Bengal.',
    eligibilityCriteria: ['West Bengal resident', 'All income groups', 'Registered family'],
    benefit: '₹5 lakh health insurance per family per year',
    documents: ['Aadhaar Card', 'Ration Card', 'WB address proof'],
    applyLink: 'https://swasthyasathi.gov.in', isActive: true,
  },
  // Rajasthan
  {
    name: 'Chiranjeevi Swasthya Bima Yojana Rajasthan',
    ministry: 'Government of Rajasthan - Health',
    category: 'Health', state: 'Rajasthan',
    description: 'Universal health insurance for all families in Rajasthan.',
    eligibilityCriteria: ['Rajasthan resident', 'All income groups', 'Registered family'],
    benefit: '₹25 lakh health insurance per family per year',
    documents: ['Aadhaar Card', 'Jan Aadhaar card', 'Rajasthan address proof'],
    applyLink: 'https://chiranjeevi.rajasthan.gov.in', isActive: true,
  },
  {
    name: 'Indira Gandhi Free Smartphone Yojana Rajasthan',
    ministry: 'Government of Rajasthan - IT',
    category: 'Other', state: 'Rajasthan',
    description: 'Free smartphone with internet for women in Rajasthan.',
    eligibilityCriteria: ['Woman in Rajasthan', 'Class 9+ student or Chiranjeevi family head', 'MGNREGA/widows/single women eligible'],
    benefit: 'Free smartphone with 3 years internet',
    documents: ['Aadhaar Card', 'Jan Aadhaar card', 'Rajasthan address proof'],
    applyLink: 'https://igsy.rajasthan.gov.in', isActive: true,
  },
  // Bihar
  {
    name: 'Mukhyamantri Kanya Utthan Yojana Bihar',
    ministry: 'Government of Bihar - Women & Child',
    category: 'Women & Child', state: 'Bihar',
    description: 'Financial incentives for girl child education in Bihar.',
    eligibilityCriteria: ['Girl child in Bihar', 'From birth to graduation', 'Max 2 girls per family'],
    benefit: '₹50,000 total from birth to graduation in installments',
    documents: ['Aadhaar Card', 'Birth certificate', 'Bank account', 'School enrollment'],
    applyLink: 'https://medhasoft.bih.nic.in', isActive: true,
  },
  {
    name: 'Bihar Student Credit Card Scheme',
    ministry: 'Government of Bihar - Education',
    category: 'Education', state: 'Bihar',
    description: 'Education loan up to ₹4 lakh for students in Bihar for higher education.',
    eligibilityCriteria: ['Bihar student', 'Age 25 or below', 'Passed Class 12', 'Enrolled in higher education'],
    benefit: 'Education loan up to ₹4 lakh at 4% interest',
    documents: ['Aadhaar Card', 'Class 12 marksheet', 'Admission letter', 'Bank account'],
    applyLink: 'https://www.7nishchay-yuvaupmission.bihar.gov.in', isActive: true,
  },
  // Madhya Pradesh
  {
    name: 'Ladli Laxmi Yojana MP',
    ministry: 'Government of Madhya Pradesh - Women & Child',
    category: 'Women & Child', state: 'Madhya Pradesh',
    description: 'Financial support for girl child education and marriage in MP.',
    eligibilityCriteria: ['Girl child in MP', 'Born after 2006', 'Parents not income taxpayers'],
    benefit: '₹1,43,000 total in installments from Class 6 to marriage',
    documents: ['Birth certificate', 'Aadhaar Card', 'Parent income proof', 'Bank account'],
    applyLink: 'https://ladlilaxmi.mp.gov.in', isActive: true,
  },
  {
    name: 'Mukhyamantri Jan Kalyan Sambal Yojana MP',
    ministry: 'Government of Madhya Pradesh - Labour',
    category: 'Employment', state: 'Madhya Pradesh',
    description: 'Social security for unorganized workers in Madhya Pradesh.',
    eligibilityCriteria: ['Unorganized worker in MP', 'Age 18-60', 'Below poverty line'],
    benefit: 'Free health treatment + maternity benefit + education support + funeral assistance',
    documents: ['Aadhaar Card', 'Sambal card', 'MP address proof'],
    applyLink: 'https://sambal.mp.gov.in', isActive: true,
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