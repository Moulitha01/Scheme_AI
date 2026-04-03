// backend/src/services/rag.js
import { generateEmbedding } from './gemini.js'
import { logger } from '../utils/logger.js'

// ── Government scheme URLs for direct scraping ───────────────
export const GOVT_SCHEME_URLS = {
  'PM-KISAN': 'https://pmkisan.gov.in',
  'PM-JAY': 'https://pmjay.gov.in',
  'MGNREGA': 'https://nrega.nic.in',
  'PMAY-G': 'https://pmayg.nic.in',
  'NSP': 'https://scholarships.gov.in',
  'Ujjwala': 'https://pmuy.gov.in',
  'MUDRA': 'https://mudra.org.in',
  'PMFBY': 'https://pmfby.gov.in',
  'APY': 'https://npscra.nsdl.co.in',
  'SSY': 'https://www.indiapost.gov.in',
  'PMKVY': 'https://pmkvyofficial.org',
  'DDU-GKY': 'https://ddugky.gov.in',
  'JSY': 'https://nhm.gov.in',
  'PMVVY': 'https://licindia.in',
}

let chromaClient = null
let collection = null
const CHROMA_COLLECTION = 'welfare_schemes'

const getChromaCollection = async () => {
  if (collection) return collection
  try {
    const { ChromaClient } = await import('chromadb')
    chromaClient = new ChromaClient({
      path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || 8000}`,
    })
    collection = await chromaClient.getOrCreateCollection({
      name: CHROMA_COLLECTION,
      metadata: { description: 'Indian government welfare schemes' },
    })
    logger.info('✅ ChromaDB connected')
    return collection
  } catch (err) {
    logger.warn(`ChromaDB unavailable: ${err.message}. Using MongoDB fallback.`)
    return null
  }
}

// ── Build rich search query from profile ─────────────────────
const buildRichQuery = (query, profile = {}) => {
  const parts = [query]

  // Add occupation-specific keywords
  const occKeywords = {
    farmer: 'farmer agriculture kisan crop land cultivation PM-KISAN PMFBY Kisan Credit Card',
    student: 'student scholarship education NSP study learning school college',
    daily_wage: 'daily wage labour worker MGNREGA employment job rozgar',
    unemployed: 'unemployed job employment skill training PMKVY rozgar',
    business: 'business MUDRA loan self employed enterprise PMEGP',
    govt_employee: 'government employee pension retirement',
  }
  if (profile.occupation && occKeywords[profile.occupation]) {
    parts.push(occKeywords[profile.occupation])
  }

  // Age-based keywords
  if (profile.age) {
    if (profile.age >= 60) parts.push('senior citizen elderly pension PMVVY old age')
    if (profile.age <= 25) parts.push('youth student scholarship education skill')
    if (profile.age < 45 && profile.age >= 18) parts.push('working age employment skill MUDRA')
  }

  // Gender keywords
  if (profile.gender === 'female') parts.push('women girl mahila beti Ujjwala Sukanya')
  if (profile.gender === 'male') parts.push('farmer worker employment')

  // Caste keywords
  if (profile.caste === 'sc') parts.push('SC scheduled caste dalit reservation')
  if (profile.caste === 'st') parts.push('ST tribal adivasi scheduled tribe')
  if (profile.caste === 'obc') parts.push('OBC other backward class')

  // Income keywords
  if (profile.income_annual && profile.income_annual < 150000) {
    parts.push('BPL below poverty line poor low income subsidy')
  }

  // State keywords
  if (profile.state) parts.push(`${profile.state} state scheme`)

  // Special conditions
  if (profile.is_disabled) parts.push('disabled divyang handicapped disability')
  if (profile.is_widow) parts.push('widow woman pension support')
  if (profile.land_acres) parts.push('farmer land agriculture crop kisan')
  if (profile.family_size && profile.family_size > 4) parts.push('large family ration BPL welfare')

  return parts.join(' ')
}

// ── Semantic search via ChromaDB ─────────────────────────────
export const semanticSearch = async (query, userProfile = {}, limit = 10) => {
  try {
    const col = await getChromaCollection()
    if (!col) return []

    const richQuery = buildRichQuery(query, userProfile)
    const queryEmbedding = await generateEmbedding(richQuery)
    if (!queryEmbedding) return []

    const results = await col.query({
      queryEmbeddings: [queryEmbedding],
      nResults: Math.min(limit, 20),
    })

    if (!results.documents?.[0]?.length) return []

    return results.documents[0].map((doc, i) => ({
      content: doc,
      metadata: results.metadatas[0][i],
      distance: results.distances?.[0]?.[i],
      id: results.ids[0][i],
    }))
  } catch (err) {
    logger.error(`Semantic search error: ${err.message}`)
    return []
  }
}

// ── MongoDB text search with rich query ──────────────────────
export const mongoTextSearch = async (query, userProfile = {}, limit = 10) => {
  try {
    const { Scheme } = await import('../models/index.js')
    const richQuery = buildRichQuery(query, userProfile)

    // Try text search first
    try {
      const filter = { isActive: true, $text: { $search: richQuery } }
      if (userProfile.state) {
        filter.$or = [{ state: 'Central' }, { state: userProfile.state }]
        delete filter.isActive
        filter.$and = [
          { isActive: true },
          { $or: [{ state: 'Central' }, { state: userProfile.state }] },
          { $text: { $search: richQuery } },
        ]
        delete filter.isActive
        delete filter.$text
        delete filter.$or
      }
      const results = await Scheme.find(
        { isActive: true, $text: { $search: richQuery } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } }).limit(limit).lean()

      if (results.length) return results
    } catch { /* fallback below */ }

    // Regex search as fallback
    const keywords = richQuery.split(' ')
      .filter(w => w.length > 3)
      .slice(0, 8)

    if (!keywords.length) {
      return await Scheme.find({ isActive: true }).limit(limit).lean()
    }

    const regexFilters = keywords.map(kw => ({
      $or: [
        { name: { $regex: kw, $options: 'i' } },
        { description: { $regex: kw, $options: 'i' } },
        { category: { $regex: kw, $options: 'i' } },
        { ministry: { $regex: kw, $options: 'i' } },
      ]
    }))

    const results = await Scheme.find({
      isActive: true,
      $or: regexFilters,
    }).limit(limit).lean()

    if (results.length) return results

    // Final fallback — return all schemes
    return await Scheme.find({ isActive: true }).limit(limit).lean()
  } catch (err) {
    logger.error(`Mongo search error: ${err.message}`)
    return []
  }
}

// ── Ingest schemes into ChromaDB and MongoDB ─────────────────
export const ingestSchemes = async (schemes) => {
  try {
    const { Scheme } = await import('../models/index.js')

    // Always save to MongoDB
    for (const s of schemes) {
      await Scheme.findOneAndUpdate(
        { name: s.name },
        { ...s, isActive: true },
        { upsert: true, new: true }
      )
    }
    logger.info(`  ✅ Saved ${schemes.length} schemes to MongoDB`)

    // Also try ChromaDB
    const col = await getChromaCollection()
    if (!col) return true

    const BATCH = 5
    for (let i = 0; i < schemes.length; i += BATCH) {
      const batch = schemes.slice(i, i + BATCH)
      const documents = batch.map(s =>
        `${s.name}. ${s.ministry}. ${s.category}. ${s.state || 'Central'}. ` +
        `${s.description}. ` +
        `Eligibility: ${Array.isArray(s.eligibility) ? s.eligibility.join(', ') : s.eligibility}. ` +
        `Benefit: ${s.benefit}. ` +
        `Keywords: ${s.category} welfare scheme India government.`
      )

      const embeddings = await Promise.all(documents.map(d => generateEmbedding(d)))
      const valid = embeddings.map((e, idx) => e ? idx : -1).filter(i => i >= 0)
      if (!valid.length) continue

      await col.upsert({
        ids: valid.map(idx => `scheme_${i + idx}_${batch[idx].name?.replace(/\s+/g, '_').slice(0, 30)}`),
        documents: valid.map(idx => documents[idx]),
        embeddings: valid.map(idx => embeddings[idx]),
        metadatas: valid.map(idx => ({
          name: batch[idx].name || '',
          category: batch[idx].category || '',
          state: batch[idx].state || 'Central',
          benefit: batch[idx].benefit || '',
          ministry: batch[idx].ministry || '',
          applyLink: batch[idx].applyLink || '',
          eligibility: Array.isArray(batch[idx].eligibility)
            ? batch[idx].eligibility.join(' | ')
            : (batch[idx].eligibility || ''),
        })),
      })

      if (i + BATCH < schemes.length) await new Promise(r => setTimeout(r, 300))
    }

    logger.info(`  ✅ Ingested ${schemes.length} schemes into ChromaDB`)
    return true
  } catch (err) {
    logger.error(`Ingest error: ${err.message}`)
    return false
  }
}