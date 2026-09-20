// backend/src/services/search.js  (NEW)
// Hybrid search that needs no embeddings: Fuse.js (typo tolerant) + Mongo $text.
// Returns every scheme in scope with a _searchScore (0..1); profile scoring ranks them.
import Fuse from 'fuse.js'
import { Scheme } from '../models/index.js'
import { logger } from '../utils/logger.js'

const TTL = 10 * 60 * 1000
const cache = new Map()

const NEED_WORDS = {
  health: 'health ayushman hospital insurance',
  education: 'scholarship education student',
  housing: 'housing awas pmay home',
  employment: 'employment skill training job',
  women_child: 'women girl child maternity mahila',
  finance: 'loan credit mudra finance',
  agriculture: 'farmer kisan crop agriculture',
  pension: 'pension old age widow senior',
}
const STOP = new Set(['need', 'want', 'help', 'scheme', 'schemes', 'with', 'from', 'that', 'this', 'have', 'please', 'government', 'india', 'indian', 'tell', 'give', 'apply', 'about', 'what', 'which', 'some', 'like'])

async function getIndex(state) {
  const key = state && state !== 'Central' ? state : 'Central'
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return hit

  const states = key === 'Central' ? ['Central'] : ['Central', key]
  const list = await Scheme.find({ isActive: true, state: { $in: states } })
    .select('name slug ministry category state description benefit benefitAmount applyLink eligibilityCriteria documents')
    .lean()
  const docs = list.map((s) => ({ ...s, _id: String(s._id), _blurb: (s.description || '').slice(0, 300) }))
  const fuse = new Fuse(docs, {
    keys: [{ name: 'name', weight: 0.6 }, { name: 'category', weight: 0.1 }, { name: '_blurb', weight: 0.3 }],
    threshold: 0.32, ignoreLocation: true, includeScore: true, minMatchCharLength: 3,
  })
  const entry = { at: Date.now(), docs, fuse }
  cache.set(key, entry)
  logger.info(`Scheme index built for "${key}": ${docs.length} schemes`)
  return entry
}

export const clearSchemeCache = () => cache.clear() // call after a crawl / ingest

export async function searchSchemes({ query = '', profile = {} }) {
  const { docs, fuse } = await getIndex(profile.state)
  const needs = (profile.need_category || []).map((n) => NEED_WORDS[n] || '').join(' ')
  const tokens = [...new Set(
    `${query} ${needs}`.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))
  )].slice(0, 12)

  const acc = new Map()
  for (const t of tokens) {
    for (const r of fuse.search(t, { limit: 60 })) {
      acc.set(r.item._id, (acc.get(r.item._id) || 0) + (1 - (r.score ?? 1)))
    }
  }
  if (tokens.length) {
    try {
      const rows = await Scheme.find(
        { isActive: true, $text: { $search: tokens.join(' ') } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } }).limit(30).select('_id').lean()
      rows.forEach((r, i) => {
        const id = String(r._id)
        acc.set(id, (acc.get(id) || 0) + (1 - i / 30) * 0.8)
      })
    } catch { /* text index missing: fuse alone is fine */ }
  }
  const max = Math.max(1, ...acc.values())
  return docs.map((d) => ({ ...d, _searchScore: (acc.get(d._id) || 0) / max }))
}

// "kisaan samman nidhi" -> PM-KISAN, "ayushmaan card" -> Ayushman Bharat
export async function findSchemeByName(name, state) {
  if (!name) return null
  const { docs } = await getIndex(state)
  const f = new Fuse(docs, { keys: ['name'], threshold: 0.4, ignoreLocation: true })
  return f.search(name)[0]?.item || null
}