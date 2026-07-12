// backend/src/services/GovCrawler.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'
import { ingestSchemes } from './rag.js'
import * as cheerio from 'cheerio'
import axios from 'axios'
import cron from 'node-cron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CRAWL_CACHE_FILE = path.join(__dirname, '../../.crawl-cache.json')

// ── 50+ Curated government schemes ───────────────────────────
const DIRECT_SCHEMES = [
  {
    name: 'PM-KISAN Samman Nidhi',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture',
    state: 'Central',
    description: 'Direct income support of ₹6,000 per year to all landholding farmer families in three equal installments of ₹2,000 each.',
    eligibilityCriteria: ['Landholding farmer family', 'Indian citizen', 'Land ownership record required', 'Not a government employee', 'Not an income taxpayer'],
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
    eligibilityCriteria: ['SECC 2011 listed households', 'Deprived rural families', 'Urban workers in specific occupational categories', 'BPL families'],
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
    eligibilityCriteria: ['Rural adult aged 18 or above', 'Willing to do unskilled manual work', 'Resident of the Gram Panchayat area'],
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
    eligibilityCriteria: ['Rural household with no pucca house', 'SECC 2011 listed family', 'Priority to SC/ST, minorities, disabled'],
    benefit: '₹1.20 lakh (plains) / ₹1.30 lakh (hilly areas)',
    documents: ['Aadhaar Card', 'SECC listing proof', 'Land document', 'Bank account'],
    applyLink: 'https://pmayg.nic.in',
    isActive: true,
  },
  {
    name: 'PM Awas Yojana - Urban (PMAY-U)',
    ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Housing',
    state: 'Central',
    description: 'Housing for All mission providing affordable housing to urban poor through interest subsidy and direct benefit.',
    eligibilityCriteria: ['Urban household without pucca house', 'EWS/LIG/MIG category', 'Annual income below ₹18 lakh', 'No other house in India'],
    benefit: 'Interest subsidy up to ₹2.67 lakh on home loan',
    documents: ['Aadhaar Card', 'Income proof', 'Address proof', 'Bank account'],
    applyLink: 'https://pmaymis.gov.in',
    isActive: true,
  },
  {
    name: 'National Scholarship Portal (NSP)',
    ministry: 'Ministry of Education',
    category: 'Education',
    state: 'Central',
    description: 'Central portal for all government scholarships for students from SC/ST/OBC/minority communities and merit-based awards.',
    eligibilityCriteria: ['Student enrolled in recognized institution', 'Family income below ₹2.5 lakh/year', 'Minimum 50% marks in last exam', 'SC/ST/OBC/Minority or merit basis'],
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
    eligibilityCriteria: ['Woman from BPL household', 'Age 18 or above', 'No existing LPG connection', 'Name in SECC 2011 or BPL list'],
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
    eligibilityCriteria: ['Micro or small business owner', 'Non-farm income generating activity', 'No default history', 'Indian citizen'],
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
    eligibilityCriteria: ['Girl child below 10 years', 'Parent or legal guardian', 'Indian resident', 'Max 2 accounts per family'],
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
    eligibilityCriteria: ['Indian national aged 15-45 years', 'School/college dropout or pass out', 'Willing to undergo skill training'],
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
    eligibilityCriteria: ['Senior citizen aged 60 years or above', 'Indian resident', 'Investment minimum ₹1.56 lakh'],
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
    eligibilityCriteria: ['Pregnant woman below poverty line', 'Age 19 or above', 'Up to 2 live births', 'Institutional delivery'],
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
    eligibilityCriteria: ['Farmer with notified crop in notified area', 'Both loanee and non-loanee farmers', 'Land records required'],
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
    eligibilityCriteria: ['Indian citizen aged 18-40 years', 'Has a savings bank account', 'Not covered under statutory social security'],
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
    eligibilityCriteria: ['Rural youth aged 15-35 years', 'From poor families (BPL)', 'Willing to take up employment', 'Minimum Class 5 pass'],
    benefit: 'Free training + placement in organized sector + post-placement support',
    documents: ['Aadhaar Card', 'Education certificate', 'Income/BPL certificate', 'Bank account'],
    applyLink: 'https://ddugky.gov.in',
    isActive: true,
  },
  // ── Additional schemes ──────────────────────────────────────
  {
    name: 'Kisan Credit Card (KCC)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture',
    state: 'Central',
    description: 'Credit card for farmers to meet agricultural and allied activities expenses at subsidized interest rates.',
    eligibilityCriteria: ['Farmer engaged in agriculture', 'Tenant farmers and sharecroppers eligible', 'Allied activity farmers eligible'],
    benefit: 'Credit up to ₹3 lakh at 4% interest rate',
    documents: ['Aadhaar Card', 'Land records', 'Bank account', 'Passport photo'],
    applyLink: 'https://pmkisan.gov.in',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Jan Dhan Yojana (PMJDY)',
    ministry: 'Ministry of Finance',
    category: 'Finance',
    state: 'Central',
    description: 'Financial inclusion scheme providing universal access to banking, credit, insurance and pension services.',
    eligibilityCriteria: ['Indian citizen above 10 years', 'No existing bank account', 'Valid ID proof'],
    benefit: 'Zero balance account + ₹2 lakh accident insurance + ₹30,000 life insurance + overdraft up to ₹10,000',
    documents: ['Aadhaar Card', 'Passport photo', 'Address proof'],
    applyLink: 'https://pmjdy.gov.in',
    isActive: true,
  },
  {
    name: 'PM Suraksha Bima Yojana (PMSBY)',
    ministry: 'Ministry of Finance',
    category: 'Finance',
    state: 'Central',
    description: 'Affordable accident insurance scheme providing coverage for death or disability due to accidents.',
    eligibilityCriteria: ['Age 18-70 years', 'Has a savings bank account', 'Aadhaar linked bank account preferred'],
    benefit: '₹2 lakh on accidental death/disability at only ₹20/year premium',
    documents: ['Aadhaar Card', 'Bank account'],
    applyLink: 'https://jansuraksha.gov.in',
    isActive: true,
  },
  {
    name: 'PM Jeevan Jyoti Bima Yojana (PMJJBY)',
    ministry: 'Ministry of Finance',
    category: 'Finance',
    state: 'Central',
    description: 'Life insurance scheme offering coverage for death due to any reason at very low premium.',
    eligibilityCriteria: ['Age 18-50 years', 'Has a savings bank account', 'Aadhaar linked preferred'],
    benefit: '₹2 lakh life insurance at only ₹436/year premium',
    documents: ['Aadhaar Card', 'Bank account'],
    applyLink: 'https://jansuraksha.gov.in',
    isActive: true,
  },
  {
    name: 'Stand Up India',
    ministry: 'Ministry of Finance',
    category: 'Finance',
    state: 'Central',
    description: 'Loan scheme for SC/ST and women entrepreneurs to set up greenfield enterprises.',
    eligibilityCriteria: ['SC/ST or woman entrepreneur', 'Age 18 or above', 'Setting up greenfield enterprise', 'Not defaulter to any bank'],
    benefit: 'Bank loan between ₹10 lakh and ₹1 crore',
    documents: ['Aadhaar Card', 'Business plan', 'Caste/gender proof', 'Bank statements'],
    applyLink: 'https://www.standupmitra.in',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Scholarship Scheme',
    ministry: 'Ministry of Home Affairs',
    category: 'Education',
    state: 'Central',
    description: 'Scholarship for children of ex-servicemen and ex-coast guard personnel for professional degree courses.',
    eligibilityCriteria: ['Child/widow of ex-serviceman or ex-coast guard', 'Minimum 60% in 12th/Diploma', 'Pursuing first professional degree'],
    benefit: '₹2,500-3,000/month scholarship',
    documents: ['Aadhaar Card', 'Service certificate of parent', 'Marksheets', 'Bank account'],
    applyLink: 'https://ksb.gov.in',
    isActive: true,
  },
  {
    name: 'Beti Bachao Beti Padhao',
    ministry: 'Ministry of Women & Child Development',
    category: 'Women & Child',
    state: 'Central',
    description: 'Scheme to address declining child sex ratio and promote welfare and education of girl child.',
    eligibilityCriteria: ['Girl child', 'Family in selected districts', 'Focus on education and health'],
    benefit: 'Educational support + health benefits + awareness programs',
    documents: ['Birth certificate', 'Aadhaar Card', 'School enrollment proof'],
    applyLink: 'https://wcd.nic.in',
    isActive: true,
  },
  {
    name: 'National Rural Health Mission (NRHM)',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Health',
    state: 'Central',
    description: 'Healthcare scheme providing accessible, affordable and quality healthcare to rural population especially vulnerable groups.',
    eligibilityCriteria: ['Rural population', 'Priority to women and children', 'SC/ST and BPL families'],
    benefit: 'Free healthcare services + ASHA support + free medicines',
    documents: ['Aadhaar Card', 'Ration Card'],
    applyLink: 'https://nhm.gov.in',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    ministry: 'Ministry of Women & Child Development',
    category: 'Women & Child',
    state: 'Central',
    description: 'Maternity benefit program providing cash incentives to pregnant and lactating mothers.',
    eligibilityCriteria: ['Pregnant and lactating women', 'Age 19 or above', 'For first live birth', 'Not a government employee'],
    benefit: '₹5,000 in three installments during pregnancy and after delivery',
    documents: ['Aadhaar Card', 'Bank account', 'MCP card', 'Ration Card'],
    applyLink: 'https://wcd.nic.in/schemes/pradhan-mantri-matru-vandana-yojana',
    isActive: true,
  },
  {
    name: 'Antyodaya Anna Yojana (AAY)',
    ministry: 'Ministry of Consumer Affairs, Food & Public Distribution',
    category: 'Other',
    state: 'Central',
    description: 'Food security scheme providing subsidized food grains to poorest of poor households.',
    eligibilityCriteria: ['Poorest of poor families', 'Landless agricultural labourers', 'Marginal farmers', 'Rural artisans with unstable income'],
    benefit: '35 kg food grains/month at ₹2/kg (wheat) and ₹3/kg (rice)',
    documents: ['Aadhaar Card', 'AAY Ration Card'],
    applyLink: 'https://dfpd.gov.in',
    isActive: true,
  },
  {
    name: 'National Food Security Act (NFSA) - PDS',
    ministry: 'Ministry of Consumer Affairs, Food & Public Distribution',
    category: 'Other',
    state: 'Central',
    description: 'Public Distribution System providing subsidized food grains to eligible households under food security act.',
    eligibilityCriteria: ['Priority Households (PHH)', 'SECC listed families', 'BPL families'],
    benefit: '5 kg food grains/person/month at highly subsidized rates',
    documents: ['Aadhaar Card', 'Ration Card'],
    applyLink: 'https://dfpd.gov.in',
    isActive: true,
  },
  {
    name: 'Rashtriya Vayoshri Yojana',
    ministry: 'Ministry of Social Justice & Empowerment',
    category: 'Disability',
    state: 'Central',
    description: 'Scheme providing assisted living devices to senior citizens belonging to BPL category.',
    eligibilityCriteria: ['Senior citizen aged 60 or above', 'BPL category', 'Suffering from age-related disability'],
    benefit: 'Free walking sticks, wheelchairs, hearing aids, spectacles',
    documents: ['Age proof', 'BPL certificate', 'Disability/medical certificate', 'Aadhaar Card'],
    applyLink: 'https://socialjustice.nic.in',
    isActive: true,
  },
  {
    name: 'Deendayal Disabled Rehabilitation Scheme (DDRS)',
    ministry: 'Ministry of Social Justice & Empowerment',
    category: 'Disability',
    state: 'Central',
    description: 'Financial assistance to NGOs for providing rehabilitation services to persons with disabilities.',
    eligibilityCriteria: ['Person with disability', 'Below poverty line preferred', 'Any age group'],
    benefit: 'Rehabilitation services, skill training, and assistive devices',
    documents: ['Disability certificate', 'Aadhaar Card', 'Income proof'],
    applyLink: 'https://socialjustice.nic.in',
    isActive: true,
  },
  {
    name: 'National Means cum Merit Scholarship (NMMS)',
    ministry: 'Ministry of Education',
    category: 'Education',
    state: 'Central',
    description: 'Scholarship for meritorious students from economically weaker sections studying in Class 9-12.',
    eligibilityCriteria: ['Student in Class 9-12', 'Family income below ₹3.5 lakh/year', 'Minimum 55% marks in Class 7/8', 'Studying in government school'],
    benefit: '₹12,000/year scholarship (₹1,000/month)',
    documents: ['School certificate', 'Income certificate', 'Bank account', 'Aadhaar Card'],
    applyLink: 'https://scholarships.gov.in',
    isActive: true,
  },
  {
    name: 'Post Matric Scholarship for SC Students',
    ministry: 'Ministry of Social Justice & Empowerment',
    category: 'Education',
    state: 'Central',
    description: 'Scholarship for SC students pursuing post-matriculation or post-secondary education.',
    eligibilityCriteria: ['Scheduled Caste student', 'Family income below ₹2.5 lakh/year', 'Enrolled in post-matric course', 'Indian national'],
    benefit: 'Maintenance allowance + course fee reimbursement',
    documents: ['Caste certificate', 'Income certificate', 'Marksheets', 'Aadhaar Card', 'Bank account'],
    applyLink: 'https://scholarships.gov.in',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture',
    state: 'Central',
    description: 'Pension scheme for small and marginal farmers to provide social security during old age.',
    eligibilityCriteria: ['Small/marginal farmer aged 18-40', 'Land holding up to 2 hectares', 'Not covered under other pension schemes'],
    benefit: '₹3,000/month pension after age 60',
    documents: ['Aadhaar Card', 'Land records', 'Bank account', 'Age proof'],
    applyLink: 'https://pmkmy.gov.in',
    isActive: true,
  },
  {
    name: 'Startup India',
    ministry: 'Ministry of Commerce & Industry',
    category: 'Finance',
    state: 'Central',
    description: 'Initiative to build a strong startup ecosystem for innovation and entrepreneurship in India.',
    eligibilityCriteria: ['Company incorporated less than 10 years ago', 'Annual turnover less than ₹100 crore', 'Working on innovative product/service', 'Not formed by splitting up existing business'],
    benefit: 'Tax exemptions + funding support + easier compliance + mentorship',
    documents: ['Incorporation certificate', 'Business plan', 'PAN', 'Aadhaar'],
    applyLink: 'https://startupindia.gov.in',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Rozgar Protsahan Yojana (PMRPY)',
    ministry: 'Ministry of Labour & Employment',
    category: 'Employment',
    state: 'Central',
    description: 'Government pays EPF contribution for new employees to incentivize employers to create new jobs.',
    eligibilityCriteria: ['New employee earning less than ₹15,000/month', 'Has Aadhaar-linked UAN', 'Employer registered with EPFO'],
    benefit: 'Government pays 8.33% EPS + 3.67% EPF contribution for 3 years',
    documents: ['Aadhaar Card', 'UAN number', 'Bank account'],
    applyLink: 'https://pmrpy.gov.in',
    isActive: true,
  },
  {
    name: 'e-Shram Portal',
    ministry: 'Ministry of Labour & Employment',
    category: 'Employment',
    state: 'Central',
    description: 'National database of unorganized workers providing registration and access to social security benefits.',
    eligibilityCriteria: ['Unorganized sector worker', 'Age 16-59 years', 'Not an EPFO/ESIC member', 'Not an income taxpayer'],
    benefit: '₹2 lakh accident insurance + priority in welfare schemes',
    documents: ['Aadhaar Card', 'Bank account', 'Mobile number linked to Aadhaar'],
    applyLink: 'https://eshram.gov.in',
    isActive: true,
  },
  {
    name: 'Ayushman Bharat Digital Mission (ABDM)',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Health',
    state: 'Central',
    description: 'Digital health ecosystem creating Health ID for citizens to access health records digitally.',
    eligibilityCriteria: ['All Indian citizens', 'Aadhaar card or mobile number required'],
    benefit: 'Free Health ID + digital health records + telemedicine access',
    documents: ['Aadhaar Card', 'Mobile number'],
    applyLink: 'https://abdm.gov.in',
    isActive: true,
  },
  {
    name: 'Poshan Abhiyaan (National Nutrition Mission)',
    ministry: 'Ministry of Women & Child Development',
    category: 'Women & Child',
    state: 'Central',
    description: 'Mission to improve nutritional outcomes for children, pregnant women and lactating mothers.',
    eligibilityCriteria: ['Children under 6 years', 'Pregnant and lactating women', 'Adolescent girls'],
    benefit: 'Nutritional supplements + health checkups + counseling',
    documents: ['Aadhaar Card', 'Birth certificate (for children)', 'MCP card'],
    applyLink: 'https://icds-wcd.nic.in',
    isActive: true,
  },
  {
    name: 'Deen Dayal Upadhyaya Antyodaya Yojana (DAY-NULM)',
    ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Employment',
    state: 'Central',
    description: 'Urban livelihood mission providing skill training and self-employment support to urban poor.',
    eligibilityCriteria: ['Urban poor household', 'BPL or low income', 'Age 18-45 years', 'Willing to take up employment'],
    benefit: 'Free skill training + ₹2 lakh loan at subsidized interest + placement support',
    documents: ['Aadhaar Card', 'Income certificate', 'Address proof', 'Bank account'],
    applyLink: 'https://nulm.gov.in',
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
  if (r.includes('disab') || r.includes('divyang')) return 'Disability'
  return 'Other'
}

// ── Scrape myscheme.gov.in using Cheerio ─────────────────────
async function scrapeMySchemePortal() {
  const schemes = []
  const urls = [
    'https://www.myscheme.gov.in/search?category=Agriculture',
    'https://www.myscheme.gov.in/search?category=Education',
    'https://www.myscheme.gov.in/search?category=Health+%26+Wellness',
    'https://www.myscheme.gov.in/search?category=Housing',
    'https://www.myscheme.gov.in/search?category=Skills+%26+Employment',
    'https://www.myscheme.gov.in/search?category=Women+and+Child',
    'https://www.myscheme.gov.in/search?category=Social+welfare+%26+Empowerment',
  ]

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })
      const $ = cheerio.load(res.data)

      // Extract scheme cards
      $('[class*="scheme"], [class*="card"], article').each((_, el) => {
        const name = $(el).find('h2, h3, [class*="title"], [class*="name"]').first().text().trim()
        const desc = $(el).find('p, [class*="desc"]').first().text().trim()
        const ministry = $(el).find('[class*="ministry"], [class*="department"]').first().text().trim()
        const link = $(el).find('a').first().attr('href')

        if (name && name.length > 5 && desc && desc.length > 20) {
          schemes.push({
            name,
            ministry: ministry || 'Government of India',
            category: mapCategory(url),
            state: 'Central',
            description: desc,
            eligibilityCriteria: ['See official portal for eligibility'],
            benefit: 'See official portal for benefits',
            documents: ['Aadhaar Card'],
            applyLink: link ? `https://www.myscheme.gov.in${link}` : url,
            isActive: true,
          })
        }
      })

      await new Promise(r => setTimeout(r, 1000)) // polite delay
    } catch (e) {
      logger.warn(`Scrape failed for ${url}: ${e.message}`)
    }
  }

  logger.info(`  🌐 Scraped ${schemes.length} schemes from MyScheme portal`)
  return schemes
}

// ── Try live MyScheme API ─────────────────────────────────────
async function fetchMySchemeAPI() {
  try {
    const res = await axios.get(
      'https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=&limit=100',
      {
        timeout: 8000,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )
    if (!res.data?.data?.schemes) return []
    return res.data.data.schemes
      .map(s => ({
        name: s.schemeName || s.name || '',
        ministry: s.nodalMinistryName || 'Government of India',
        category: mapCategory(s.schemeCategory || ''),
        state: s.level === 'State' ? (s.state || 'Central') : 'Central',
        description: s.briefDescription || s.description || '',
        eligibilityCriteria: Array.isArray(s.eligibility) ? s.eligibility : ['See official portal'],
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
  } catch { }
  return { lastCrawled: null, schemeCount: 0 }
}

function saveCache(data) {
  try {
    fs.writeFileSync(CRAWL_CACHE_FILE, JSON.stringify(data, null, 2))
  } catch { }
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

    // Start with curated schemes (always accurate)
    const allSchemes = [...DIRECT_SCHEMES]
    const existingNames = new Set(allSchemes.map(s => s.name.toLowerCase()))

    // Try live API
    const liveSchemes = await fetchMySchemeAPI()
    logger.info(`  📡 MyScheme API: ${liveSchemes.length} live schemes`)

    // Try web scraping
    const scrapedSchemes = await scrapeMySchemePortal()

    // Merge all, deduplicate by name
    for (const scheme of [...liveSchemes, ...scrapedSchemes]) {
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

// ── Weekly cron job (every Sunday at 2 AM) ───────────────────
export function startWeeklyCrawlCron() {
  cron.schedule('0 2 * * 0', async () => {
    logger.info('⏰ Weekly cron: refreshing government schemes...')
    await crawlGovernmentSchemes({ forceRefresh: true })
  })
  logger.info('⏰ Weekly scheme refresh cron scheduled (every Sunday 2 AM)')
}