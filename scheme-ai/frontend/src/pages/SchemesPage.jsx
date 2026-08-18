import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiSearchLine, RiExternalLinkLine, RiCheckLine, RiFilterLine, RiCloseLine, RiHeartLine, RiHeartFill } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useSchemeStore } from '../store'

const CATEGORIES = ['All', 'Agriculture', 'Education', 'Health', 'Housing', 'Women & Child', 'Finance', 'Employment']

const STATES = [
  'All States',
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan',
  'Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal',
]

const ALL_SCHEMES = [
  { id: 1,  name: 'PM-KISAN Samman Nidhi',        ministry: 'Ministry of Agriculture',           category: 'Agriculture',   state: 'Central',          benefit: '₹6,000/year',            description: 'Direct income support to all landholding farmers\' families with cultivable land.',                           eligibility: ['Landholding farmer', 'Indian citizen', 'Not a govt. employee'], apply_link: 'https://pmkisan.gov.in',      match: 92 },
  { id: 2,  name: 'PM Ujjwala Yojana',             ministry: 'Ministry of Petroleum',             category: 'Women & Child', state: 'Central',          benefit: 'Free LPG connection',    description: 'Free LPG connections to women from Below Poverty Line (BPL) households.',                                    eligibility: ['BPL household', 'Woman aged 18+', 'No existing LPG connection'], apply_link: 'https://pmuy.gov.in',        match: 87 },
  { id: 3,  name: 'National Scholarship Portal',   ministry: 'Ministry of Education',             category: 'Education',     state: 'Central',          benefit: 'Up to ₹50,000/year',    description: 'Scholarships for students from minority, SC/ST, OBC communities and merit-based awards.',                   eligibility: ['Student in recognized institution', 'Income < ₹2.5L', 'Min 50% marks'], apply_link: 'https://scholarships.gov.in', match: 78 },
  { id: 4,  name: 'Ayushman Bharat PM-JAY',        ministry: 'Ministry of Health',                category: 'Health',        state: 'Central',          benefit: '₹5 lakh health cover',  description: 'World\'s largest health assurance scheme providing ₹5 lakh per family per year for hospitalisation.',        eligibility: ['SECC 2011 beneficiary', 'Deprived rural family'], apply_link: 'https://pmjay.gov.in',           match: 95 },
  { id: 5,  name: 'PM Awas Yojana (Gramin)',       ministry: 'Ministry of Rural Development',     category: 'Housing',       state: 'Central',          benefit: '₹1.3 lakh assistance',  description: 'Financial assistance to BPL households for construction of pucca house with basic amenities.',               eligibility: ['Rural household', 'No pucca house', 'SECC listed'], apply_link: 'https://pmayg.nic.in',         match: 83 },
  { id: 6,  name: 'MUDRA Yojana',                  ministry: 'Ministry of Finance',               category: 'Finance',       state: 'Central',          benefit: 'Loan up to ₹10 lakh',   description: 'Micro-finance loans to non-corporate small businesses under Shishu, Kishore, Tarun categories.',             eligibility: ['Micro/small business owner', 'Non-farm activity', 'No collateral needed'], apply_link: 'https://mudra.org.in', match: 74 },
  { id: 7,  name: 'MGNREGA',                       ministry: 'Ministry of Rural Development',     category: 'Employment',    state: 'Central',          benefit: '100 days @ ₹220/day',   description: 'Guaranteed 100 days of unskilled manual work per rural household, with minimum wage.',                       eligibility: ['Rural adult 18+', 'Willing to do unskilled work', 'Job card holder'], apply_link: 'https://nrega.nic.in', match: 88 },
  { id: 8,  name: 'Sukanya Samriddhi Yojana',      ministry: 'Ministry of Finance',               category: 'Women & Child', state: 'Central',          benefit: '8.2% interest rate',    description: 'Small savings scheme for girl child education and marriage expenses with tax benefits.',                     eligibility: ['Girl child below 10 years', 'Parent or guardian', 'Indian resident'], apply_link: 'https://www.india.gov.in', match: 71 },
  { id: 9,  name: 'Kisan Credit Card',             ministry: 'Ministry of Agriculture',           category: 'Agriculture',   state: 'Central',          benefit: 'Credit up to ₹3 lakh',  description: 'Short-term credit for farmers to meet their cultivation and allied activities needs.',                       eligibility: ['Farmer / tenant farmer', 'Allied activity owner'], apply_link: 'https://www.nabard.org', match: 80 },
  { id: 10, name: 'PM Fasal Bima Yojana',          ministry: 'Ministry of Agriculture',           category: 'Agriculture',   state: 'Central',          benefit: 'Crop insurance cover',  description: 'Insurance coverage and financial support to farmers suffering crop loss or damage.',                         eligibility: ['All farmers including sharecroppers', 'Notified crop grower'], apply_link: 'https://pmfby.gov.in', match: 77 },
  { id: 11, name: 'Tamil Nadu Chief Minister\'s Breakfast Scheme', ministry: 'Tamil Nadu Govt', category: 'Education',  state: 'Tamil Nadu',       benefit: 'Free breakfast daily',  description: 'Free nutritious breakfast to government school students in Tamil Nadu to improve attendance.',               eligibility: ['Student in Tamil Nadu govt school', 'Resident of Tamil Nadu'], apply_link: 'https://tnschools.gov.in', match: 90 },
  { id: 12, name: 'Tamil Nadu Amma Unavagam',      ministry: 'Tamil Nadu Food Dept',              category: 'Finance',       state: 'Tamil Nadu',       benefit: 'Subsidised meals ₹1',   description: 'Subsidised food at ₹1 per meal to below poverty line citizens across Tamil Nadu.',                          eligibility: ['BPL citizen', 'Tamil Nadu resident'], apply_link: 'https://www.tn.gov.in', match: 85 },
  { id: 13, name: 'Atal Pension Yojana',           ministry: 'Ministry of Finance',               category: 'Finance',       state: 'Central',          benefit: '₹1000-5000/month pension', description: 'Pension scheme for workers in the unorganised sector with guaranteed monthly pension post 60.',          eligibility: ['Age 18-40', 'Bank account holder', 'Not IT taxpayer'], apply_link: 'https://www.npscra.nsdl.co.in', match: 69 },
  { id: 14, name: 'Stand-Up India',                ministry: 'Ministry of Finance',               category: 'Finance',       state: 'Central',          benefit: 'Loan ₹10L – ₹1Cr',     description: 'Bank loans between 10 lakh and 1 crore to SC/ST and women entrepreneurs for greenfield projects.',         eligibility: ['SC/ST or Woman entrepreneur', 'Greenfield enterprise', '18+ years'], apply_link: 'https://www.standupmitra.in', match: 73 },
  { id: 15, name: 'Beti Bachao Beti Padhao',       ministry: 'Ministry of Women & Child Dev',     category: 'Women & Child', state: 'Central',          benefit: 'Multiple benefits',     description: 'Scheme to address declining child sex ratio and ensure education and survival of girl child.',              eligibility: ['Girl child', 'Parents of girl child', 'All states'], apply_link: 'https://wcd.nic.in', match: 76 },
  { id: 16, name: 'Maharashtra Ladki Bahin Yojana',ministry: 'Maharashtra Govt',                  category: 'Women & Child', state: 'Maharashtra',      benefit: '₹1,500/month',          description: 'Monthly financial assistance of ₹1500 to women aged 21-65 in Maharashtra from eligible families.',        eligibility: ['Woman 21-65 years', 'Maharashtra resident', 'Annual income < ₹2.5L'], apply_link: 'https://ladakibahin.maharashtra.gov.in', match: 88 },
  { id: 17, name: 'Karnataka Gruha Lakshmi',       ministry: 'Karnataka Govt',                    category: 'Women & Child', state: 'Karnataka',        benefit: '₹2,000/month',          description: 'Monthly assistance of ₹2000 to women who are head of their families in Karnataka.',                       eligibility: ['Woman head of family', 'Karnataka resident', 'BPL/middle income'], apply_link: 'https://sevasindhu.karnataka.gov.in', match: 87 },
  { id: 18, name: 'Andhra Pradesh YSR Pension',    ministry: 'Andhra Pradesh Govt',               category: 'Finance',       state: 'Andhra Pradesh',   benefit: '₹3,000/month',          description: 'Old age pension of ₹3000/month for elderly citizens above 65 years in Andhra Pradesh.',                  eligibility: ['Age above 65', 'AP resident', 'Annual income < ₹10,000'], apply_link: 'https://navasakam.ap.gov.in', match: 84 },
  { id: 19, name: 'Rajasthan Palanhar Yojana',     ministry: 'Rajasthan Govt',                    category: 'Women & Child', state: 'Rajasthan',        benefit: '₹1,500/month per child','description': 'Financial support to families raising orphan or destitute children in Rajasthan.',                     eligibility: ['Guardian of orphan/destitute child', 'Rajasthan resident', 'BPL family'], apply_link: 'https://sje.rajasthan.gov.in', match: 79 },
  { id: 20, name: 'Delhi Mukhyamantri Mahila Samman Yojana', ministry: 'Delhi Govt',             category: 'Women & Child', state: 'Delhi',            benefit: '₹1,000/month',          description: 'Monthly financial assistance to all women voters above 18 years in Delhi.',                                eligibility: ['Woman voter in Delhi', 'Age 18+', 'Delhi resident'], apply_link: 'https://delhi.gov.in', match: 91 },
]

const CAT_COLORS = {
  Agriculture:    'text-scheme-green-light bg-green-900/20',
  Education:      'text-blue-400 bg-blue-900/20',
  Health:         'text-red-400 bg-red-900/20',
  Housing:        'text-purple-400 bg-purple-900/20',
  'Women & Child':'text-pink-400 bg-pink-900/20',
  Finance:        'text-gold bg-yellow-900/20',
  Employment:     'text-saffron bg-orange-900/20',
}

export default function SchemesPage() {
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [stateFilter, setStateFilter] = useState('All States')
  const [activeScheme, setActiveScheme] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const { applyScheme, saveScheme, isSaved } = useSchemeStore()

  // ── FIXED: all three filters applied correctly ──
  const filtered = useMemo(() => {
    return ALL_SCHEMES.filter(s => {
      // 1. Search filter
      const q = search.toLowerCase()
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.ministry.toLowerCase().includes(q) ||
        s.benefit.toLowerCase().includes(q)

      // 2. Category filter
      const matchCat = category === 'All' || s.category === category

      // 3. State filter — "Central" schemes always show + selected state schemes
      const matchState = stateFilter === 'All States' ||
        s.state === 'Central' ||
        s.state === stateFilter

      return matchSearch && matchCat && matchState
    })
  }, [search, category, stateFilter])

  // Active filter count for badge
  const activeFilterCount = (category !== 'All' ? 1 : 0) + (stateFilter !== 'All States' ? 1 : 0) + (search ? 1 : 0)

  const resetFilters = () => {
    setSearch('')
    setCategory('All')
    setStateFilter('All States')
  }

  return (
    <div className="pt-24 pb-16 px-5 md:px-10 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="section-label">Scheme Database</div>
        <h1 className="section-title mb-2">
          {ALL_SCHEMES.length}+ Government <span className="text-saffron">Welfare Schemes</span>
        </h1>
        <p className="section-sub max-w-lg">
          Browse, search and filter schemes by category or state. Central schemes show for all states.
        </p>
      </motion.div>

      {/* Search + Filter bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4 mb-6 space-y-3">
        {/* Search row */}
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-navy border border-navy-border rounded-xl px-4 py-2.5 focus-within:border-saffron transition-colors">
            <RiSearchLine className="text-[#8A9BB0] flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ministry, or benefit..."
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder-[#8A9BB0] font-sora"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[#8A9BB0] hover:text-white transition-colors">
                <RiCloseLine size={16} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-saffron border-saffron text-navy'
                : 'border-navy-border text-[#8A9BB0] hover:border-saffron/50 hover:text-saffron'
            }`}
          >
            <RiFilterLine size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-navy text-saffron text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-3">
                {/* State filter */}
                <div>
                  <div className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wider mb-2">Filter by State</div>
                  <select
                    value={stateFilter}
                    onChange={e => setStateFilter(e.target.value)}
                    className="input-field text-sm"
                  >
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {stateFilter !== 'All States' && (
                    <p className="text-[10px] text-[#8A9BB0] mt-1">
                      Showing Central schemes + schemes for <span className="text-saffron">{stateFilter}</span>
                    </p>
                  )}
                </div>

                {/* Category filter */}
                <div>
                  <div className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wider mb-2">Filter by Category</div>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-all duration-200 ${
                          category === cat
                            ? 'bg-saffron border-saffron text-navy'
                            : 'border-navy-border text-[#8A9BB0] hover:border-saffron/50 hover:text-saffron'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                    <RiCloseLine size={13} /> Reset all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs text-[#8A9BB0]">
          Showing <span className="text-white font-semibold">{filtered.length}</span> of {ALL_SCHEMES.length} schemes
          {stateFilter !== 'All States' && <span className="text-saffron ml-1">· {stateFilter} + Central</span>}
          {category !== 'All' && <span className="text-saffron ml-1">· {category}</span>}
          {search && <span className="text-saffron ml-1">· "{search}"</span>}
        </div>
        {filtered.length === 0 && (
          <button onClick={resetFilters} className="text-xs text-saffron hover:underline">Clear filters</button>
        )}
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-base font-bold mb-2">No schemes found</h3>
          <p className="text-sm text-[#8A9BB0] mb-4">
            No schemes match your current filters. Try changing the state or category.
          </p>
          <button onClick={resetFilters} className="btn-primary mx-auto">
            Clear All Filters
          </button>
        </motion.div>
      )}

      {/* Schemes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((scheme, i) => (
            <motion.div
              key={scheme.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="card p-5 cursor-pointer hover:border-saffron/40 hover:-translate-y-0.5 transition-all duration-200 group"
              onClick={() => setActiveScheme(scheme)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge text-[10px] ${CAT_COLORS[scheme.category] || 'badge-saffron'}`}>
                    {scheme.category}
                  </span>
                  {scheme.state !== 'Central' && (
                    <span className="badge text-[10px] text-[#8A9BB0] bg-navy-border">
                      📍 {scheme.state}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-scheme-green-light flex-shrink-0">{scheme.match}% match</span>
              </div>

              <h3 className="text-sm font-bold mb-1 group-hover:text-saffron transition-colors tracking-tight">{scheme.name}</h3>
              <p className="text-[11px] text-[#8A9BB0] mb-1">{scheme.ministry}</p>
              <p className="text-[12px] text-[#aaa] leading-relaxed mb-4 line-clamp-2">{scheme.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-saffron">{scheme.benefit}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); saveScheme(scheme); toast.success(isSaved(scheme.id) ? 'Removed from saved' : 'Saved!') }}
                    className="text-[#8A9BB0] hover:text-red-400 transition-colors"
                  >
                    {isSaved(scheme.id) ? <RiHeartFill size={15} className="text-red-400" /> : <RiHeartLine size={15} />}
                  </button>
                  <button className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-saffron/10 border border-saffron/30 text-saffron group-hover:bg-saffron group-hover:text-navy transition-all">
                    View →
                  </button>
                </div>
              </div>

              {/* Match bar */}
              <div className="mt-3 h-1 bg-navy rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-saffron to-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scheme.match}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {activeScheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy/90 backdrop-blur-md z-50 flex items-center justify-center p-5"
            onClick={() => setActiveScheme(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="card max-w-lg w-full p-7 relative max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setActiveScheme(null)} className="absolute top-5 right-5 text-[#8A9BB0] hover:text-white text-xl">✕</button>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`badge text-[10px] ${CAT_COLORS[activeScheme.category] || 'badge-saffron'}`}>
                  {activeScheme.category}
                </span>
                {activeScheme.state !== 'Central' && (
                  <span className="badge text-[10px] text-[#8A9BB0] bg-navy-border">📍 {activeScheme.state}</span>
                )}
              </div>

              <h2 className="text-xl font-extrabold tracking-tight mb-1">{activeScheme.name}</h2>
              <p className="text-xs text-[#8A9BB0] mb-4">{activeScheme.ministry}</p>
              <p className="text-sm text-[#ccc] leading-relaxed mb-5">{activeScheme.description}</p>

              <div className="bg-navy rounded-xl p-4 mb-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#8A9BB0] mb-3">Eligibility Criteria</div>
                <ul className="space-y-2">
                  {activeScheme.eligibility.map((e, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <RiCheckLine className="text-scheme-green-light flex-shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs text-[#8A9BB0] mb-1">Benefit</div>
                  <div className="text-lg font-extrabold text-saffron">{activeScheme.benefit}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8A9BB0] mb-1">Match Score</div>
                  <div className="text-lg font-extrabold text-scheme-green-light">{activeScheme.match}%</div>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={activeScheme.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 justify-center"
                >
                  Apply Now <RiExternalLinkLine />
                </a>
                <button
                  onClick={() => { applyScheme(activeScheme); toast.success('Scheme saved to your dashboard!'); setActiveScheme(null) }}
                  className="btn-secondary flex-1 justify-center"
                >
                  Save to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
