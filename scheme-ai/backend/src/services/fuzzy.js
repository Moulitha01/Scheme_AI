// backend/src/services/fuzzy.js  (NEW)
// Typo-tolerant fallback that works with no LLM at all.
export const STATE_LIST = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

const STATE_ALIASES = {
  tamilnadu: 'Tamil Nadu', tn: 'Tamil Nadu', orissa: 'Odisha', pondicherry: 'Puducherry',
  bengal: 'West Bengal', andhra: 'Andhra Pradesh', kashmir: 'Jammu & Kashmir', jammu: 'Jammu & Kashmir',
  arunachal: 'Arunachal Pradesh', himachal: 'Himachal Pradesh', uttaranchal: 'Uttarakhand',
}

const stateTerms = [
  ...STATE_LIST.map((s) => ({ t: s.toLowerCase(), v: s })),
  ...Object.entries(STATE_ALIASES).map(([t, v]) => ({ t, v })),
]

const OCC = [
  { key: 'farmer', terms: ['farmer', 'farmar', 'framer', 'kisan', 'kisaan', 'kissan', 'kheti', 'vivasayi', 'vivasaayi', 'raitu', 'rythu', 'shetkari', 'krushak', 'cultivator'] },
  { key: 'student', terms: ['student', 'studant', 'studing', 'vidyarthi', 'padhai', 'padikiren', 'maanavan', 'scholar'] },
  { key: 'daily_wage', terms: ['labour', 'labourer', 'laborer', 'coolie', 'kooli', 'mazdoor', 'majdoor', 'mazdur', 'worker'] },
  { key: 'unemployed', terms: ['unemployed', 'jobless', 'berozgar', 'bekar', 'nirudyogi'] },
  { key: 'business', terms: ['business', 'shopkeeper', 'vyapari', 'vyapaari', 'vendor', 'dukaan'] },
]
const occTerms = OCC.flatMap((o) => o.terms.map((t) => ({ t, key: o.key })))


// Strict edit-distance matcher (Fuse was too loose on short words:
// "umar" matched Gujarat, "vidhavai" matched student).
function lev(a, b) {
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[m][n]
}
function bestMatch(word, terms, minSim = 0.78) {
  let best = null
  for (const it of terms) {
    if (it.t === word) return it
    if (it.t[0] !== word[0] || Math.abs(it.t.length - word.length) > 2 || it.t.length < 4) continue
    const sim = 1 - lev(word, it.t) / Math.max(word.length, it.t.length)
    if (sim >= minSim && (!best || sim > best.sim)) best = { ...it, sim }
  }
  return best
}

export function canonicalState(name) {
  if (!name || typeof name !== 'string') return null
  const hit = bestMatch(name.toLowerCase().trim(), stateTerms, 0.8)
  return hit ? hit.v : null
}

const WIDOW = /\b(widow|vidhwa|vidhva|vidhawa|vidhavai|vithavai|vidhuva)\b/i
const AGE_RES = [
  /\b(?:age|umar|umr|vayasu|vayadhu|vayas|vayassu)\s*(?:is|hai|:)?\s*(\d{1,3})\b/i,
  /\b(\d{1,3})\s*(?:years?|yrs?|saal|sal|varsh|vayasu|vayadhu|years old)\b/i,
]

export function fuzzyProfile(text = '') {
  const original = String(text)
  const tokens = original.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  const out = {}

  for (const w of tokens) {
    if (w.length < 4) continue
    if (!out.occupation) {
      const h = bestMatch(w, occTerms)
      if (h) out.occupation = h.key
    }
  }
  // states: single tokens and adjacent pairs ("tamil nadu", "uttar pradesh")
  const cands = [...tokens.filter((w) => w.length >= 4), ...tokens.slice(1).map((w, i) => `${tokens[i]} ${w}`)]
  for (const c of cands) {
    const h = bestMatch(c, stateTerms)
    if (h) { out.state = h.v; break }
  }
  // short abbreviations only when written in capitals (avoids the word "up")
  if (!out.state && /\bUP\b/.test(original)) out.state = 'Uttar Pradesh'
  if (!out.state && /\bMP\b/.test(original)) out.state = 'Madhya Pradesh'
  if (!out.state && /\bAP\b/.test(original)) out.state = 'Andhra Pradesh'

  for (const re of AGE_RES) {
    const m = original.match(re)
    if (m && +m[1] > 0 && +m[1] < 120) { out.age = +m[1]; break }
  }
  if (WIDOW.test(original)) { out.is_widow = true; out.gender = 'female' }
  return out
}