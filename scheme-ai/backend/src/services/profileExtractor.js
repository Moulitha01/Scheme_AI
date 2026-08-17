// backend/src/services/profileExtractor.js

export function extractProfileFromText(text) {
  const t = text.toLowerCase()

  const profile = {
    name: null, age: null, gender: null, state: null,
    district: null, occupation: null, income_annual: null,
    caste: null, is_disabled: false, is_widow: false,
    has_aadhaar: null, family_size: null, need_category: [],
  }

  // ── Age ──────────────────────────────────────────────────────
  const agePatterns = [
    /(\d+)\s*(?:year|yr|வயது|வயதாகி|साल|वर्ष|సంవత్సరాలు|ವರ್ಷ|বছর|वर्षांचा|વર્ષ|വർഷം)/i,
    /age[:\s]+(\d+)/i,
    /i\s+am\s+(\d+)/i,
    /(\d+)\s*years?\s*old/i,
    /(\d+)\s*வயது/i,
    /(\d+)\s*साल/i,
  ]
  for (const p of agePatterns) {
    const m = text.match(p)
    if (m && parseInt(m[1]) > 0 && parseInt(m[1]) < 120) {
      profile.age = parseInt(m[1]); break
    }
  }

  // ── Gender ───────────────────────────────────────────────────
  if (/\b(female|woman|lady|girl|she|her|மாணவி|பெண்|அம்மா|महिला|औरत|స్త్రీ|ಮಹಿಳೆ|মহিলা|महिला|સ્ત્રী|സ്ത്രീ)\b/i.test(t))
    profile.gender = 'female'
  else if (/\b(male|man|boy|he|his|மாணவன்|ஆண்|पुरुष|పురుషుడు|ಪುರುಷ|পুরুষ|पुरुष|પુરుષ|പുരുഷൻ)\b/i.test(t))
    profile.gender = 'male'

  // ── State ────────────────────────────────────────────────────
  const STATES = {
    'tamil nadu': 'Tamil Nadu', 'tamilnadu': 'Tamil Nadu', 'தமிழ்நாடு': 'Tamil Nadu', 'tamilnadu': 'Tamil Nadu',
    'kerala': 'Kerala', 'karnataka': 'Karnataka',
    'andhra pradesh': 'Andhra Pradesh', 'andhra': 'Andhra Pradesh',
    'telangana': 'Telangana', 'maharashtra': 'Maharashtra', 'gujarat': 'Gujarat',
    'rajasthan': 'Rajasthan', 'uttar pradesh': 'Uttar Pradesh', 'up': 'Uttar Pradesh',
    'bihar': 'Bihar', 'west bengal': 'West Bengal', 'bengal': 'West Bengal',
    'odisha': 'Odisha', 'madhya pradesh': 'Madhya Pradesh', 'mp': 'Madhya Pradesh',
    'punjab': 'Punjab', 'haryana': 'Haryana', 'assam': 'Assam',
    'jharkhand': 'Jharkhand', 'uttarakhand': 'Uttarakhand', 'himachal pradesh': 'Himachal Pradesh',
    'delhi': 'Delhi', 'goa': 'Goa', 'chhattisgarh': 'Chhattisgarh',
    'manipur': 'Manipur', 'meghalaya': 'Meghalaya', 'tripura': 'Tripura',
    'nagaland': 'Nagaland', 'mizoram': 'Mizoram', 'sikkim': 'Sikkim',
    'arunachal': 'Arunachal Pradesh', 'jammu': 'Jammu & Kashmir',
    'puducherry': 'Puducherry', 'pondicherry': 'Puducherry',
  }
  for (const [key, val] of Object.entries(STATES)) {
    if (t.includes(key)) { profile.state = val; break }
  }

  // ── Occupation ───────────────────────────────────────────────
  if (/\b(farmer|farming|agriculture|kisan|விவசாயி|किसान|రైతు|ರೈತ|কৃষক|शेतकरी|ખેડૂત|cultivat|crop|land owner|peasant)\b/i.test(t))
    profile.occupation = 'farmer'
  else if (/\b(student|studying|school|college|university|padikiren|படிக்கிற|மாணவ|छात्र|విద్యార్థి|ವಿದ್ಯಾರ್ಥಿ|ছাত্র|विद्यार्थी|વિદ્યાર્થી|വിദ്യാർഥി)\b/i.test(t))
    profile.occupation = 'student'
  else if (/\b(unemployed|no job|jobless|seeking job|looking for work|வேலையில்லா|बेरोजगार|నిరుద్యోగి|ನಿರುದ್ಯೋಗಿ|বেকার)\b/i.test(t))
    profile.occupation = 'unemployed'
  else if (/\b(daily wage|labour|labor|worker|coolie|கூலி|मजदूर|కూలి|ಕೂಲಿ|শ্রমিক|मजूर|labourer|construction)\b/i.test(t))
    profile.occupation = 'daily_wage'
  else if (/\b(business|shop|merchant|self.?employ|வியாபாரி|व्यापारी|వ్యాపారి|ವ್ಯಾಪಾರಿ|ব্যবসায়ী|entrepreneur|startup)\b/i.test(t))
    profile.occupation = 'business'

  // ── Caste ────────────────────────────────────────────────────
  if (/\b(sc|scheduled caste|dalit|harijan)\b/i.test(t)) profile.caste = 'sc'
  else if (/\b(st|scheduled tribe|tribal|adivasi|vanvasi)\b/i.test(t)) profile.caste = 'st'
  else if (/\b(obc|other backward class|backward caste)\b/i.test(t)) profile.caste = 'obc'

  // ── Special ──────────────────────────────────────────────────
  if (/\b(disabled|disability|divyang|handicap|ஊனமுற்றோர்|विकलांग)\b/i.test(t)) profile.is_disabled = true
  if (/\b(widow|widower|கைம்பெண்|विधवा|పెళ్ళాన్ని పోగొట్టుకున్న)\b/i.test(t)) profile.is_widow = true

  // ── Need categories ───────────────────────────────────────────
  const cats = new Set()
  if (/\b(health|hospital|medical|doctor|sick|disease|ஆரோக்கியம்|स्वास्थ्य|आरोग्य)\b/i.test(t)) cats.add('health')
  if (/\b(education|school|study|scholarship|padippu|படிப்பு|शिक्षा|scholarships)\b/i.test(t)) cats.add('education')
  if (/\b(house|home|shelter|housing|awas|வீடு|घर|मकान)\b/i.test(t)) cats.add('housing')
  if (/\b(job|employ|work|rozgar|வேலை|रोजगार|skill|training)\b/i.test(t)) cats.add('employment')
  if (/\b(gas|lpg|cooking|fuel|ujjwala|சமையல்|रसोई)\b/i.test(t)) cats.add('women_child')
  if (/\b(loan|finance|money|mudra|business loan|credit)\b/i.test(t)) cats.add('finance')
  if (/\b(crop|insurance|kisan|farm|agriculture|fasal)\b/i.test(t)) cats.add('agriculture')
  profile.need_category = [...cats]

  return profile
}

// ── Generate specific reason based on profile + scheme ────────
function generateReason(scheme, profile, nameDesc) {
  const parts = []

  // Age-specific reason
  if (profile.age) {
    if (profile.age >= 60 && /pension|elderly|senior|old age/i.test(nameDesc))
      parts.push(`Senior citizen aged ${profile.age} qualifies for this pension`)
    else if (profile.age <= 25 && /scholarship|student|youth/i.test(nameDesc))
      parts.push(`Eligible at age ${profile.age} for student scholarship`)
    else if (profile.age >= 18 && profile.age <= 40 && /pension|apy/i.test(nameDesc))
      parts.push(`Age ${profile.age} is within the 18-40 year eligibility window`)
  }

  // Gender-specific reason
  if (profile.gender === 'female') {
    if (/women|woman|mahila|girl|beti|maternity/i.test(nameDesc))
      parts.push('Specifically designed for women')
    else if (/scholarship/i.test(nameDesc))
      parts.push('Female student scholarship available')
  }

  // Occupation-specific reason
  if (profile.occupation === 'farmer' && /kisan|farmer|agri|crop/i.test(nameDesc))
    parts.push('Directly targeted at farmers like you')
  if (profile.occupation === 'student' && /scholarship|education|student/i.test(nameDesc))
    parts.push('Student scholarship — matches your education status')
  if (profile.occupation === 'unemployed' && /employment|rozgar|skill|training/i.test(nameDesc))
    parts.push('Employment/training scheme for unemployed youth')
  if (profile.occupation === 'daily_wage' && /labour|worker|mgnrega/i.test(nameDesc))
    parts.push('Labour welfare scheme for daily wage workers')
  if (profile.occupation === 'business' && /mudra|loan|enterprise/i.test(nameDesc))
    parts.push('Business loan scheme for entrepreneurs')

  // Caste-specific reason
  if (profile.caste === 'sc' && /sc|dalit|scheduled caste/i.test(nameDesc))
    parts.push('SC category scholarship — priority eligibility')
  if (profile.caste === 'st' && /st|tribal|scheduled tribe/i.test(nameDesc))
    parts.push('ST category scheme — priority eligibility')
  if (profile.caste === 'obc' && /obc|backward/i.test(nameDesc))
    parts.push('OBC category — additional benefits available')

  // Need category reason
  if (profile.need_category?.includes('housing') && /awas|housing|shelter/i.test(nameDesc))
    parts.push('Housing assistance matches your need')
  if (profile.need_category?.includes('health') && /health|hospital|medical/i.test(nameDesc))
    parts.push('Health coverage matches your need')
  if (profile.need_category?.includes('women_child') && /lpg|gas|ujjwala/i.test(nameDesc))
    parts.push('Free LPG scheme for women without gas connection')
  if (profile.need_category?.includes('finance') && /loan|mudra|credit/i.test(nameDesc))
    parts.push('Financial assistance matches your need')

  // Special conditions
  if (profile.is_disabled && /divyang|disabled|handicap/i.test(nameDesc))
    parts.push('Disability support scheme — you qualify')
  if (profile.is_widow && /widow|vidhwa/i.test(nameDesc))
    parts.push('Widow welfare scheme — you are eligible')

  // State-specific reason
  if (profile.state && scheme.state === profile.state)
    parts.push(`${profile.state} state scheme — residents get priority`)

  return parts[0] || 'Profile matches basic eligibility criteria'
}

// ── Smart scheme scoring ──────────────────────────────────────
export function matchSchemesByProfile(schemes, profile, userText) {
  const t = (userText || '').toLowerCase()

  const scored = schemes.map(scheme => {
    let score = 45
    const nameDesc = ((scheme.name || '') + ' ' + (scheme.description || '')).toLowerCase()
    const eligText = Array.isArray(scheme.eligibilityCriteria)
      ? scheme.eligibilityCriteria.join(' ').toLowerCase()
      : ''

    // ── Age scoring ───────────────────────────────────────────
    if (profile.age) {
      const age = profile.age
      if (age >= 60) {
        if (/pension|elderly|senior|vaya|old age|pmvvy/i.test(nameDesc)) score += 35
        if (/ayushman|health|hospital|pmjay/i.test(nameDesc)) score += 20
        if (/atal pension|apy/i.test(nameDesc)) score += 15
      }
      if (age <= 25) {
        if (/scholarship|student|youth|education|nsp|girl|pragati/i.test(nameDesc)) score += 35
        if (/skill|pmkvy|training|kaushal/i.test(nameDesc)) score += 25
        if (/employment|rozgar|job/i.test(nameDesc)) score += 15
      }
      if (age >= 18 && age <= 40) {
        if (/atal pension|apy/i.test(nameDesc)) score += 25
        if (/mudra|loan|pmegp/i.test(nameDesc)) score += 15
        if (/mgnrega|employment/i.test(nameDesc)) score += 10
      }
      if (/ayushman|pmjay/i.test(nameDesc)) score += 15
    }

    // ── Occupation scoring ────────────────────────────────────
    if (profile.occupation === 'farmer') {
      if (/kisan|farmer|agri|crop|fasal|pmfby|pm.kisan|rythu|karshaka/i.test(nameDesc)) score += 35
      if (/mgnrega|employment/i.test(nameDesc)) score += 20
      if (/mudra|loan/i.test(nameDesc)) score += 10
    }
    if (profile.occupation === 'student') {
      if (/scholarship|student|education|nsp|padho|vidya|girl|pragati|merit/i.test(nameDesc)) score += 40
      if (/skill|pmkvy|training/i.test(nameDesc)) score += 25
      if (/hostel|accommodation/i.test(nameDesc)) score += 20
    }
    if (profile.occupation === 'unemployed') {
      if (/mgnrega|employment|rozgar|job guarantee/i.test(nameDesc)) score += 35
      if (/skill|pmkvy|training|kaushal|ddu/i.test(nameDesc)) score += 30
      if (/mudra|loan|pmegp/i.test(nameDesc)) score += 15
    }
    if (profile.occupation === 'daily_wage') {
      if (/mgnrega|employment|labour|worker/i.test(nameDesc)) score += 35
      if (/ayushman|health/i.test(nameDesc)) score += 20
      if (/awas|housing|pmay/i.test(nameDesc)) score += 15
      if (/atal pension|apy/i.test(nameDesc)) score += 20
    }
    if (profile.occupation === 'business') {
      if (/mudra|pmegp|startup|enterprise|stand.?up|loan/i.test(nameDesc)) score += 40
      if (/skill|training/i.test(nameDesc)) score += 10
    }

    // ── Gender scoring ────────────────────────────────────────
    if (profile.gender === 'female') {
      if (/women|woman|mahila|beti|ujjwala|sukanya|girl|maternity|janani|lakshmi|ladki|amma/i.test(nameDesc)) score += 30
      if (/scholarship|education/i.test(nameDesc)) score += 15
    }

    // ── Caste scoring ─────────────────────────────────────────
    if (profile.caste === 'sc' || profile.caste === 'st') {
      if (/sc|st|dalit|tribal|scheduled|adivasi/i.test(nameDesc + eligText)) score += 20
      if (/scholarship|education/i.test(nameDesc)) score += 15
    }
    if (profile.caste === 'obc') {
      if (/obc|backward|scholarship/i.test(nameDesc + eligText)) score += 15
    }

    // ── Need category scoring ─────────────────────────────────
    if (profile.need_category?.includes('health') && /ayushman|pmjay|health|hospital|janani|nhm/i.test(nameDesc)) score += 25
    if (profile.need_category?.includes('housing') && /awas|housing|pmay|shelter|gharkul|griha/i.test(nameDesc)) score += 25
    if (profile.need_category?.includes('education') && /scholarship|nsp|education|student|vidya/i.test(nameDesc)) score += 25
    if (profile.need_category?.includes('women_child') && /ujjwala|gas|lpg|women|sukanya|mahila/i.test(nameDesc)) score += 25
    if (profile.need_category?.includes('finance') && /mudra|loan|credit|pmegp/i.test(nameDesc)) score += 25
    if (profile.need_category?.includes('agriculture') && /kisan|crop|farmer|fasal|pmfby|rythu/i.test(nameDesc)) score += 25

    // ── Special conditions ────────────────────────────────────
    if (profile.is_disabled && /divyang|disabled|handicap/i.test(nameDesc)) score += 25
    if (profile.is_widow && /widow|vidhwa|mahila/i.test(nameDesc)) score += 20

    // ── State bonus ───────────────────────────────────────────
    if (profile.state && scheme.state === profile.state) score += 15

    // ── Keyword match bonus ───────────────────────────────────
    const keywords = t.split(/\s+/).filter(w => w.length > 3)
    for (const kw of keywords) {
      if (nameDesc.includes(kw)) score += 5
    }

    // ── Universal floors ──────────────────────────────────────
    if (/ayushman|pmjay/i.test(nameDesc)) score = Math.max(score, 55)
    if (/atal pension|apy/i.test(nameDesc) && profile.age >= 18 && profile.age <= 40) score = Math.max(score, 60)
    if (/mgnrega/i.test(nameDesc)) score = Math.max(score, 52)

    // ── Generate specific reason ──────────────────────────────
    const reason = generateReason(scheme, profile, nameDesc)

    return {
      ...scheme,
      matchScore: Math.min(score, 95),
      reason,
      benefit: scheme.benefit || 'Check official portal',
      applyLink: scheme.applyLink || '',
    }
  })

  return scored
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 6)
