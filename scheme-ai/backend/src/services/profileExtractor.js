// backend/src/services/profileExtractor.js
// Pure keyword matching — works 100% without any AI API

export function extractProfileFromText(text) {
  const t = text.toLowerCase()

  const profile = {
    name: null, age: null, gender: null, state: null,
    district: null, occupation: null, income_annual: null,
    caste: null, is_disabled: false, is_widow: false,
    has_aadhaar: null, family_size: null, need_category: [],
  }

  // ── Age ─────────────────────────────────────────────────────
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
  if (/\b(female|woman|lady|girl|she|her|மாணவி|பெண்|அம்மா|महिला|औरत|స్త్రీ|ಮಹಿಳೆ|মহিলা|महिला|સ્ત્રી|സ്ത്രീ)\b/i.test(t))
    profile.gender = 'female'
  else if (/\b(male|man|boy|he|his|மாணவன்|ஆண்|पुरुष|పురుషుడు|ಪುರುಷ|পুরুষ|पुरुष|પુરુષ|പുരുഷൻ)\b/i.test(t))
    profile.gender = 'male'

  // ── State ────────────────────────────────────────────────────
  const STATES = {
    'tamil nadu': 'Tamil Nadu', 'tamilnadu': 'Tamil Nadu', 'தமிழ்நாடு': 'Tamil Nadu', 'tamilnadu': 'Tamil Nadu',
    'kerala': 'Kerala', 'karnataka': 'Karnataka', 'andhra pradesh': 'Andhra Pradesh', 'andhra': 'Andhra Pradesh',
    'telangana': 'Telangana', 'maharashtra': 'Maharashtra', 'gujarat': 'Gujarat',
    'rajasthan': 'Rajasthan', 'uttar pradesh': 'Uttar Pradesh', 'up': 'Uttar Pradesh',
    'bihar': 'Bihar', 'west bengal': 'West Bengal', 'bengal': 'West Bengal',
    'odisha': 'Odisha', 'madhya pradesh': 'Madhya Pradesh', 'mp': 'Madhya Pradesh',
    'punjab': 'Punjab', 'haryana': 'Haryana', 'assam': 'Assam',
    'jharkhand': 'Jharkhand', 'uttarakhand': 'Uttarakhand', 'himachal pradesh': 'Himachal Pradesh',
    'delhi': 'Delhi', 'goa': 'Goa', 'chhattisgarh': 'Chhattisgarh',
    'manipur': 'Manipur', 'meghalaya': 'Meghalaya', 'tripura': 'Tripura',
  }
  for (const [key, val] of Object.entries(STATES)) {
    if (t.includes(key)) { profile.state = val; break }
  }

  // ── Occupation ───────────────────────────────────────────────
  if (/\b(farmer|farming|agriculture|kisan|விவசாயி|किसान|రైతు|ರೈత|কৃষক|शेतकरी|ખેડૂત|cultivat|crop|land owner|peasant)\b/i.test(t))
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

  // ── Need categories ──────────────────────────────────────────
  if (/\b(health|hospital|medical|doctor|sick|disease|ஆரோக்கியம்|स्वास्थ्य|आरोग्य)\b/i.test(t)) profile.need_category.push('health')
  if (/\b(education|school|study|scholarship|padippu|படிப்பு|शिक्षा|scholarships)\b/i.test(t)) profile.need_category.push('education')
  if (/\b(house|home|shelter|housing|awas|வீடு|घर|मकान)\b/i.test(t)) profile.need_category.push('housing')
  if (/\b(job|employ|work|rozgar|வேலை|रोजगार|skill|training)\b/i.test(t)) profile.need_category.push('employment')
  if (/\b(gas|lpg|cooking|fuel|ujjwala|சமையல்|रसोई)\b/i.test(t)) profile.need_category.push('women_child')
  if (/\b(loan|finance|money|mudra|business loan|credit)\b/i.test(t)) profile.need_category.push('finance')
  if (/\b(crop|insurance|kisan|farm|agriculture|fasal)\b/i.test(t)) profile.need_category.push('agriculture')

  return profile
}

// ── Smart scheme scoring — shows MORE relevant schemes ────────
export function matchSchemesByProfile(schemes, profile, userText) {
  const t = (userText || '').toLowerCase()

  const scored = schemes.map(scheme => {
    let score = 45 // higher base score so more schemes show
    const reasons = []
    const nameDesc = ((scheme.name || '') + ' ' + (scheme.description || '')).toLowerCase()
    const eligText = Array.isArray(scheme.eligibility) ? scheme.eligibility.join(' ').toLowerCase() : ''

    // ── Age-based scoring ──────────────────────────────────────
    if (profile.age) {
      const age = profile.age

      // Senior citizen schemes
      if (age >= 60) {
        if (/pension|elderly|senior|vaya|old age|pmvvy/i.test(nameDesc)) { score += 35; reasons.push('Senior citizen scheme') }
        if (/ayushman|health|hospital|pmjay/i.test(nameDesc)) { score += 20; reasons.push('Health coverage for seniors') }
        if (/atal pension|apy/i.test(nameDesc)) { score += 15 }
      }

      // Youth/student schemes
      if (age <= 25) {
        if (/scholarship|student|youth|education|nsp/i.test(nameDesc)) { score += 35; reasons.push('Youth education scheme') }
        if (/skill|pmkvy|training|kaushal/i.test(nameDesc)) { score += 25; reasons.push('Skill development') }
        if (/employment|rozgar|job/i.test(nameDesc)) { score += 15 }
      }

      // Working age
      if (age >= 18 && age <= 40) {
        if (/atal pension|apy/i.test(nameDesc)) { score += 25; reasons.push('Eligible for APY pension') }
        if (/mudra|loan|pmegp/i.test(nameDesc)) { score += 15 }
        if (/mgnrega|employment/i.test(nameDesc)) { score += 10 }
      }

      // All ages get Ayushman
      if (/ayushman|pmjay/i.test(nameDesc)) { score += 15; reasons.push('Universal health coverage') }
    }

    // ── Occupation-based scoring ───────────────────────────────
    if (profile.occupation === 'farmer') {
      if (/kisan|farmer|agri|crop|fasal|pmfby|pm.kisan/i.test(nameDesc)) { score += 35; reasons.push('Farmer-specific scheme') }
      if (/mgnrega|employment/i.test(nameDesc)) { score += 20 }
      if (/mudra|loan/i.test(nameDesc)) { score += 10 }
    }

    if (profile.occupation === 'student') {
      if (/scholarship|student|education|nsp|padho/i.test(nameDesc)) { score += 40; reasons.push('Student scholarship') }
      if (/skill|pmkvy|training/i.test(nameDesc)) { score += 25; reasons.push('Skill training for students') }
    }

    if (profile.occupation === 'unemployed') {
      if (/mgnrega|employment|rozgar|job guarantee/i.test(nameDesc)) { score += 35; reasons.push('Employment guarantee') }
      if (/skill|pmkvy|training|kaushal|ddu/i.test(nameDesc)) { score += 30; reasons.push('Skill training available') }
      if (/mudra|loan|pmegp/i.test(nameDesc)) { score += 15 }
    }

    if (profile.occupation === 'daily_wage') {
      if (/mgnrega|employment|labour|worker/i.test(nameDesc)) { score += 35; reasons.push('Labour welfare scheme') }
      if (/ayushman|health/i.test(nameDesc)) { score += 20 }
      if (/awas|housing|pmay/i.test(nameDesc)) { score += 15 }
      if (/atal pension|apy/i.test(nameDesc)) { score += 20; reasons.push('Pension for workers') }
    }

    if (profile.occupation === 'business') {
      if (/mudra|pmegp|startup|enterprise|stand.?up/i.test(nameDesc)) { score += 40; reasons.push('Business loan scheme') }
      if (/skill|training/i.test(nameDesc)) { score += 10 }
    }

    // ── Gender-based scoring ───────────────────────────────────
    if (profile.gender === 'female') {
      if (/women|woman|mahila|beti|ujjwala|sukanya|girl|maternity|janani|pradhan mantri matru/i.test(nameDesc)) {
        score += 30; reasons.push('Women welfare scheme')
      }
      if (/scholarship|education/i.test(nameDesc)) { score += 15 }
    }

    // ── Caste-based scoring ────────────────────────────────────
    if (profile.caste === 'sc' || profile.caste === 'st') {
      if (/sc|st|dalit|tribal|scheduled|adivasi/i.test(nameDesc + eligText)) { score += 20; reasons.push('SC/ST priority scheme') }
      if (/scholarship|education/i.test(nameDesc)) { score += 15 }
    }

    if (profile.caste === 'obc') {
      if (/obc|backward|scholarship/i.test(nameDesc + eligText)) { score += 15; reasons.push('OBC scheme') }
    }

    // ── Need category scoring ──────────────────────────────────
    if (profile.need_category.includes('health')) {
      if (/ayushman|pmjay|health|hospital|janani|nhm/i.test(nameDesc)) { score += 25 }
    }
    if (profile.need_category.includes('housing')) {
      if (/awas|housing|pmay|shelter/i.test(nameDesc)) { score += 25; reasons.push('Housing assistance') }
    }
    if (profile.need_category.includes('education')) {
      if (/scholarship|nsp|education|student/i.test(nameDesc)) { score += 25 }
    }
    if (profile.need_category.includes('women_child')) {
      if (/ujjwala|gas|lpg|women|sukanya/i.test(nameDesc)) { score += 25; reasons.push('LPG/Women scheme') }
    }
    if (profile.need_category.includes('finance')) {
      if (/mudra|loan|credit|pmegp/i.test(nameDesc)) { score += 25 }
    }
    if (profile.need_category.includes('agriculture')) {
      if (/kisan|crop|farmer|fasal|pmfby/i.test(nameDesc)) { score += 25 }
    }

    // ── Special conditions ─────────────────────────────────────
    if (profile.is_disabled && /divyang|disabled|handicap/i.test(nameDesc)) { score += 25 }
    if (profile.is_widow && /widow|vidhwa|mahila/i.test(nameDesc)) { score += 20 }

    // ── Text keyword matching ──────────────────────────────────
    const keywords = t.split(/\s+/).filter(w => w.length > 3)
    for (const kw of keywords) {
      if (nameDesc.includes(kw)) score += 5
    }

    // ── Universal schemes get base bonus ───────────────────────
    // These schemes apply to almost everyone
    if (/ayushman|pmjay/i.test(nameDesc)) score = Math.max(score, 55)
    if (/atal pension|apy/i.test(nameDesc) && profile.age >= 18 && profile.age <= 40) score = Math.max(score, 60)
    if (/mgnrega/i.test(nameDesc)) score = Math.max(score, 52)

    return {
      ...scheme,
      eligibility: Math.min(score, 95),
      reason: reasons[0] || 'May be eligible — check official portal',
      benefit: scheme.benefit || 'Check official portal',
      applyLink: scheme.applyLink || '',
    }
  })

  // Sort by score, return top 6
  return scored
    .sort((a, b) => b.eligibility - a.eligibility)
    .slice(0, 6)
}