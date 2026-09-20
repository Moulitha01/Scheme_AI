// backend/src/services/profileExtractor.js  (REPLACE)
// Regex extraction is now only the FALLBACK. Primary understanding is understand.js.
// Fixes vs old version:
//  - \b does not work for Tamil/Hindi/etc. scripts in JS regex -> native words use includes()
//  - t.includes('up') matched "support"/"group" and set state = Uttar Pradesh
//  - /sc|st/ matched "student", "state", "scholarship" and inflated scores
//  - is_disabled:false / is_widow:false defaults overwrote earlier true values on merge

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const isLatin = (w) => /^[\x00-\x7f]+$/.test(w)

// Latin words <=3 chars must match as whole words; longer ones as word prefixes (farmer -> farmers)
function hasAny(text, words) {
  return words.some((w) => {
    if (!isLatin(w)) return text.includes(w)
    const re = w.length <= 3
      ? new RegExp(`(^|[^a-z0-9])${esc(w)}([^a-z0-9]|$)`, 'i')
      : new RegExp(`(^|[^a-z0-9])${esc(w)}`, 'i')
    return re.test(text)
  })
}

const STATES = {
  'tamil nadu': 'Tamil Nadu', tamilnadu: 'Tamil Nadu', 'தமிழ்நாடு': 'Tamil Nadu',
  kerala: 'Kerala', 'கேரளா': 'Kerala', karnataka: 'Karnataka', 'andhra pradesh': 'Andhra Pradesh', andhra: 'Andhra Pradesh',
  telangana: 'Telangana', maharashtra: 'Maharashtra', gujarat: 'Gujarat', rajasthan: 'Rajasthan',
  'uttar pradesh': 'Uttar Pradesh', bihar: 'Bihar', 'west bengal': 'West Bengal', bengal: 'West Bengal',
  odisha: 'Odisha', orissa: 'Odisha', 'madhya pradesh': 'Madhya Pradesh', punjab: 'Punjab', haryana: 'Haryana',
  assam: 'Assam', jharkhand: 'Jharkhand', uttarakhand: 'Uttarakhand', 'himachal pradesh': 'Himachal Pradesh',
  delhi: 'Delhi', goa: 'Goa', chhattisgarh: 'Chhattisgarh', manipur: 'Manipur', meghalaya: 'Meghalaya',
  tripura: 'Tripura', nagaland: 'Nagaland', mizoram: 'Mizoram', sikkim: 'Sikkim', arunachal: 'Arunachal Pradesh',
  jammu: 'Jammu & Kashmir', puducherry: 'Puducherry', pondicherry: 'Puducherry',
}

export function extractProfileFromText(text = '') {
  const t = text.toLowerCase()
  const profile = {
    name: null, age: null, gender: null, state: null, district: null, occupation: null,
    income_annual: null, caste: null, is_disabled: null, is_widow: null,
    has_aadhaar: null, family_size: null, need_category: [],
  }

  // Age
  const agePatterns = [
    /(\d{1,3})\s*(?:years?|yrs?|saal|sal|varsh|vayasu|வயது|साल|वर्ष|సంవత్సరాలు|ವರ್ಷ|বছর|वर्षांचा|વર્ષ|വർഷം)/i,
    /(?:age|umar|umr)[:\s]+(\d{1,3})/i,
    /i\s+am\s+(\d{1,3})\b/i,
  ]
  for (const p of agePatterns) {
    const m = text.match(p)
    if (m && +m[1] > 0 && +m[1] < 120) { profile.age = +m[1]; break }
  }

  // Gender (pronouns removed on purpose: "he died" does not mean the speaker is male)
  if (hasAny(t, ['female', 'woman', 'lady', 'girl', 'mahila', 'aurat', 'மாணவி', 'பெண்', 'महिला', 'औरत', 'స్త్రీ', 'ಮಹಿಳೆ', 'মহিলা', 'સ્ત્રી', 'സ്ത്രീ'])) profile.gender = 'female'
  else if (hasAny(t, ['male', 'man', 'boy', 'ladka', 'aadmi', 'மாணவன்', 'ஆண்', 'पुरुष', 'పురుషుడు', 'ಪುರುಷ', 'পুরুষ', 'પુરુષ', 'പുരുഷൻ'])) profile.gender = 'male'

  // State (longest key first, so "tamil nadu" wins over anything shorter)
  const keys = Object.keys(STATES).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    if (hasAny(t, [k])) { profile.state = STATES[k]; break }
  }
  if (!profile.state && /\bUP\b/.test(text)) profile.state = 'Uttar Pradesh'
  if (!profile.state && /\bMP\b/.test(text)) profile.state = 'Madhya Pradesh'

  // Occupation
  if (hasAny(t, ['farmer', 'farming', 'agriculture', 'kisan', 'kisaan', 'cultivat', 'peasant', 'vivasayi', 'raitu', 'விவசாயி', 'किसान', 'రైతు', 'ರೈತ', 'কৃষক', 'शेतकरी', 'ખેડૂત'])) profile.occupation = 'farmer'
  else if (hasAny(t, ['student', 'studying', 'college', 'university', 'padikiren', 'படிக்கிற', 'மாணவ', 'छात्र', 'విద్యార్థి', 'ವಿದ್ಯಾರ್ಥಿ', 'ছাত্র', 'विद्यार्थी', 'વિદ્યાર્થી', 'വിദ്യാർഥി'])) profile.occupation = 'student'
  else if (hasAny(t, ['unemployed', 'no job', 'jobless', 'seeking job', 'looking for work', 'வேலையில்லா', 'बेरोजगार', 'నిరుద్యోగి', 'ನಿರುದ್ಯೋಗಿ', 'বেকার'])) profile.occupation = 'unemployed'
  else if (hasAny(t, ['daily wage', 'labour', 'labor', 'coolie', 'mazdoor', 'construction worker', 'கூலி', 'मजदूर', 'కూలి', 'ಕೂಲಿ', 'শ্রমিক', 'मजूर'])) profile.occupation = 'daily_wage'
  else if (hasAny(t, ['business', 'shopkeeper', 'merchant', 'self employed', 'self-employed', 'entrepreneur', 'startup', 'வியாபாரி', 'व्यापारी', 'వ్యాపారి', 'ವ್ಯಾಪಾರಿ', 'ব্যবসায়ী'])) profile.occupation = 'business'

  // Caste (short tokens are whole-word only, so "student"/"state" no longer match)
  if (hasAny(t, ['sc', 'scheduled caste', 'dalit', 'harijan'])) profile.caste = 'sc'
  else if (hasAny(t, ['st', 'scheduled tribe', 'tribal', 'adivasi', 'vanvasi'])) profile.caste = 'st'
  else if (hasAny(t, ['obc', 'other backward', 'backward caste'])) profile.caste = 'obc'

  // Special
  if (hasAny(t, ['disabled', 'disability', 'divyang', 'handicap', 'ஊனமுற்றோர்', 'विकलांग'])) profile.is_disabled = true
  if (hasAny(t, ['widow', 'vidhwa', 'vidhva', 'கைம்பெண்', 'विधवा'])) { profile.is_widow = true; profile.gender = profile.gender || 'female' }

  // Needs
  const cats = new Set()
  if (hasAny(t, ['health', 'hospital', 'medical', 'doctor', 'sick', 'disease', 'ஆரோக்கியம்', 'स्वास्थ्य', 'आरोग्य'])) cats.add('health')
  if (hasAny(t, ['education', 'school fee', 'study', 'scholarship', 'padippu', 'படிப்பு', 'शिक्षा'])) cats.add('education')
  if (hasAny(t, ['house', 'home', 'shelter', 'housing', 'awas', 'வீடு', 'घर', 'मकान'])) cats.add('housing')
  if (hasAny(t, ['job', 'employment', 'rozgar', 'skill', 'training', 'வேலை', 'रोजगार'])) cats.add('employment')
  if (hasAny(t, ['gas', 'lpg', 'ujjwala', 'maternity', 'pregnan', 'சமையல்', 'रसोई'])) cats.add('women_child')
  if (hasAny(t, ['loan', 'finance', 'mudra', 'credit'])) cats.add('finance')
  if (hasAny(t, ['crop', 'insurance', 'fasal', 'farm'])) cats.add('agriculture')
  if (hasAny(t, ['pension', 'pention', 'old age', 'vridha', 'पेंशन', 'ஓய்வூதியம்'])) cats.add('pension')
  profile.need_category = [...cats]
  return profile
}

// Never let a null / false / empty value erase something we already know.
export function mergeProfile(oldP = {}, updates = {}) {
  const out = { ...oldP }
  for (const [k, v] of Object.entries(updates || {})) {
    if (v === null || v === undefined || v === '') continue
    if (v === false) continue
    if (Array.isArray(v)) {
      if (v.length) out[k] = [...new Set([...(out[k] || []), ...v])]
      continue
    }
    out[k] = v
  }
  return out
}

// ── Scoring ───────────────────────────────────────────────────
const A = (p, f) => Number.isFinite(p.age) && f(p.age)
const R = (test, re, pts, why) => ({ test, re, pts, why })

const RULES = [
  R((p) => A(p, (a) => a >= 60), /pension|elderly|senior|old age|vridha|vayo|pmvvy|nsap/, 35, (p) => `Senior citizen aged ${p.age} qualifies for this support`),
  R((p) => A(p, (a) => a >= 60), /ayushman|pmjay|pm-jay|health/, 15, () => 'Health cover for senior citizens'),
  R((p) => A(p, (a) => a <= 25), /scholarship|student|youth|nsp|pragati|merit/, 30, (p) => `Student scholarship suits age ${p.age}`),
  R((p) => A(p, (a) => a <= 30), /skill|pmkvy|kaushal|training/, 20, () => 'Free skill training for young people'),
  R((p) => A(p, (a) => a >= 18 && a <= 40), /atal pension|\bapy\b/, 25, (p) => `Age ${p.age} fits the 18–40 window`),
  R((p) => A(p, (a) => a >= 18 && a <= 40), /mudra|pmegp/, 10, () => 'Loan support for working-age people'),

  R((p) => p.occupation === 'farmer', /kisan|farmer|agri|crop|fasal|pmfby|rythu|karshaka|krishi/, 40, () => 'Made for farmers like you'),
  R((p) => p.occupation === 'farmer', /mgnrega|nrega/, 15, () => 'Guaranteed work for rural families'),
  R((p) => p.occupation === 'student', /scholarship|student|education|nsp|vidya|merit|pragati/, 40, () => 'Scholarship matching your student status'),
  R((p) => p.occupation === 'student', /hostel|skill|pmkvy/, 15, () => 'Support for students'),
  R((p) => p.occupation === 'unemployed', /mgnrega|employment|rozgar|job|skill|pmkvy|kaushal|ddu/, 35, () => 'Work and training support for jobseekers'),
  R((p) => p.occupation === 'daily_wage', /mgnrega|labour|worker|shramik|e-?shram|construction/, 35, () => 'Welfare for daily-wage workers'),
  R((p) => p.occupation === 'daily_wage', /ayushman|pmay|housing|atal pension/, 15, () => 'Support for working families'),
  R((p) => p.occupation === 'business', /mudra|pmegp|startup|enterprise|stand.?up|loan/, 40, () => 'Business loan support'),

  R((p) => p.gender === 'female', /women|woman|mahila|beti|ujjwala|sukanya|girl|maternity|janani|lakshmi|ladki|amma/, 30, () => 'Specially designed for women'),
  R((p) => p.is_widow, /widow|vidhwa|vidhva|mahila|destitute/, 35, () => 'Widow welfare support — you are eligible'),
  R((p) => p.is_disabled, /divyang|disab|handicap/, 35, () => 'Disability support scheme'),

  R((p) => p.caste === 'sc' || p.caste === 'st', /\b(sc|st)\b|dalit|tribal|scheduled|adivasi/, 25, (p) => `${p.caste.toUpperCase()} category scheme — priority eligibility`),
  R((p) => p.caste === 'sc' || p.caste === 'st', /scholarship|education/, 10, () => 'Scholarship for your category'),
  R((p) => p.caste === 'obc', /\bobc\b|backward/, 20, () => 'OBC category benefits'),

  R((p) => p.need_category?.includes('health'), /ayushman|pmjay|health|hospital|janani|nhm/, 30, () => 'Health cover matches your need'),
  R((p) => p.need_category?.includes('housing'), /awas|housing|pmay|shelter|gharkul|griha/, 30, () => 'Housing help matches your need'),
  R((p) => p.need_category?.includes('education'), /scholarship|nsp|education|student|vidya/, 30, () => 'Education support matches your need'),
  R((p) => p.need_category?.includes('women_child'), /ujjwala|lpg|women|sukanya|mahila|maternity|janani/, 30, () => 'Support for women and children'),
  R((p) => p.need_category?.includes('finance'), /mudra|loan|credit|pmegp/, 30, () => 'Financial help matches your need'),
  R((p) => p.need_category?.includes('agriculture'), /kisan|crop|farmer|fasal|pmfby|rythu/, 30, () => 'Farming support matches your need'),
  R((p) => p.need_category?.includes('employment'), /employment|rozgar|skill|mgnrega|pmkvy|job/, 30, () => 'Work and training matches your need'),
  R((p) => p.need_category?.includes('pension'), /pension|nsap|old age|widow|pmvvy|apy/, 30, () => 'Pension support matches your need'),

  R((p) => Number.isFinite(p.income_annual) && p.income_annual < 200000, /bpl|ration|ayushman|pmay|subsidy|antyodaya/, 15, () => 'Low-income families get priority'),
]

const STOP = new Set(['need', 'want', 'help', 'scheme', 'schemes', 'with', 'from', 'that', 'this', 'have', 'please', 'government', 'india', 'indian', 'tell', 'give', 'apply', 'about', 'what', 'which'])

function passesHardFilters(s, p) {
  const name = (s.name || '').toLowerCase()
  if (p.gender === 'male' && /\b(women|woman|girl|mahila|beti|widow|sukanya|janani|maternity|ladki|ujjwala)\b/.test(name)) return false
  if (Number.isFinite(p.age) && p.age < 55 && /old age|senior citizen|vridha|vayo/.test(name)) return false
  if (p.state && s.state && s.state !== 'Central' && s.state !== p.state) return false
  return true
}

export function matchSchemesByProfile(schemes, profile, userText = '', limit = 6, { minScore = 0, hardFilter = true } = {}) {
  const words = (userText || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w))

  const scored = []
  for (const scheme of schemes) {
    if (hardFilter && !passesHardFilters(scheme, profile)) continue
    const t = `${scheme.name || ''} ${scheme.category || ''} ${(scheme.description || '').slice(0, 300)}`.toLowerCase()
    const nameOnly = (scheme.name || '').toLowerCase()

    let score = 30
    let best = null
    for (const r of RULES) {
      if (r.test(profile) && r.re.test(t)) {
        score += r.pts
        if (!best || r.pts > best.pts) best = r
      }
    }
    if (profile.state && scheme.state === profile.state) score += 15
    let kw = 0
    for (const w of words) {
      if (nameOnly.includes(w)) kw += 8
      else if (t.includes(w)) kw += 3
    }
    score += Math.min(kw, 24)
    score += Math.round((scheme._searchScore || 0) * 20)

    if (/ayushman|pmjay/.test(t)) score = Math.max(score, 55)
    if (/mgnrega/.test(t) && profile.state) score = Math.max(score, 52)

    const reason = best
      ? best.why(profile)
      : (profile.state && scheme.state === profile.state ? `${profile.state} state scheme` : 'May match your situation — verify at the official portal')

    if (score < minScore) continue
    scored.push({
      ...scheme,
      matchScore: Math.min(score, 95),
      reason,
      benefit: scheme.benefit || 'Check official portal',
      applyLink: scheme.applyLink || '',
    })
  }
  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit)
}