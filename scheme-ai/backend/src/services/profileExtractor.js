// backend/src/services/profileExtractor.js
// Works 100% without Gemini — pure keyword matching

export function extractProfileFromText(text) {
  const t = text.toLowerCase()

  const profile = {
    name: null, age: null, gender: null, state: null,
    district: null, occupation: null, income_annual: null,
    caste: null, is_disabled: false, is_widow: false,
    has_aadhaar: null, family_size: null, need_category: [],
  }

  // ── Age extraction ──────────────────────────────────────────
  const agePatterns = [
    /(\d+)\s*(year|yr|வயது|வயதாகி|साल|वर्ष|సంవత్సరాలు|ವರ್ಷ|বছর|वर्षांचा|વર્ષ|വർഷം)/i,
    /age\s*:?\s*(\d+)/i,
    /i am\s+(\d+)/i,
    /(\d+)\s*years?\s*old/i,
  ]
  for (const p of agePatterns) {
    const m = text.match(p)
    if (m) { profile.age = parseInt(m[1]); break }
  }

  // ── Gender extraction ───────────────────────────────────────
  if (/\b(female|woman|lady|girl|மாணவி|பெண்|அம்மா|महिला|औरत|స్త్రీ|ಮಹಿಳೆ|মহিলা|महिला|સ્ત્રી|സ്ത്രീ)\b/i.test(t))
    profile.gender = 'female'
  else if (/\b(male|man|boy|மாணவன்|ஆண்|पुरुष|పురుషుడు|ಪುರುಷ|পুরুষ|पुरुष|પુરુષ|പുരുഷൻ)\b/i.test(t))
    profile.gender = 'male'

  // ── State extraction ────────────────────────────────────────
  const states = {
    'tamil nadu': 'Tamil Nadu', 'tamilnadu': 'Tamil Nadu', 'தமிழ்நாடு': 'Tamil Nadu',
    'kerala': 'Kerala', 'karnataka': 'Karnataka', 'andhra': 'Andhra Pradesh',
    'telangana': 'Telangana', 'maharashtra': 'Maharashtra', 'gujarat': 'Gujarat',
    'rajasthan': 'Rajasthan', 'up': 'Uttar Pradesh', 'uttar pradesh': 'Uttar Pradesh',
    'bihar': 'Bihar', 'west bengal': 'West Bengal', 'bengal': 'West Bengal',
    'odisha': 'Odisha', 'madhya pradesh': 'Madhya Pradesh', 'mp': 'Madhya Pradesh',
    'punjab': 'Punjab', 'haryana': 'Haryana', 'assam': 'Assam',
    'jharkhand': 'Jharkhand', 'uttarakhand': 'Uttarakhand', 'himachal': 'Himachal Pradesh',
    'delhi': 'Delhi', 'goa': 'Goa', 'chhattisgarh': 'Chhattisgarh',
  }
  for (const [key, val] of Object.entries(states)) {
    if (t.includes(key)) { profile.state = val; break }
  }

  // ── Occupation extraction ───────────────────────────────────
  if (/\b(farmer|farming|agriculture|kisan|விவசாயி|किसान|రైతు|ರೈತ|কৃষক|शेतकरी|ખેડૂત|കര്‍ഷകന്‍|cultivat|crop|land)\b/i.test(t))
    profile.occupation = 'farmer'
  else if (/\b(student|studying|school|college|padikiren|படிக்கிறேன்|மாணவன்|மாணவி|छात्र|విద్యార్థి|ವಿದ್ಯಾರ್ಥಿ|ছাত্র|विद्यार्थी|વિદ્યાર્થી|വിദ്യാർഥി)\b/i.test(t))
    profile.occupation = 'student'
  else if (/\b(unemployed|no job|jobless|வேலையில்லா|बेरोजगार|నిరుద్యోగి|ನಿರುದ್ಯೋಗಿ|বেকার)\b/i.test(t))
    profile.occupation = 'unemployed'
  else if (/\b(daily wage|labour|labor|worker|coolie|கூலி|मजदूर|కూలి|ಕೂಲಿ|শ্রমিক|मजूर)\b/i.test(t))
    profile.occupation = 'daily_wage'
  else if (/\b(business|shop|merchant|self.?employ|வியாபாரி|व्यापारी|వ్యాపారి|ವ್ಯಾಪಾರಿ|ব্যবসায়ী)\b/i.test(t))
    profile.occupation = 'business'

  // ── Caste extraction ────────────────────────────────────────
  if (/\b(sc|scheduled caste|dalit|harijan)\b/i.test(t)) profile.caste = 'sc'
  else if (/\b(st|scheduled tribe|tribal|adivasi)\b/i.test(t)) profile.caste = 'st'
  else if (/\b(obc|other backward)\b/i.test(t)) profile.caste = 'obc'

  // ── Special conditions ──────────────────────────────────────
  if (/\b(disabled|disability|divyang|handicap|ஊனமுற்றோர்)\b/i.test(t)) profile.is_disabled = true
  if (/\b(widow|widower|கைம்பெண்|विधवा)\b/i.test(t)) profile.is_widow = true

  // ── Need categories ─────────────────────────────────────────
  if (/\b(health|hospital|medical|doctor|sick|illness|ஆரோக்கியம்|स्वास्थ्य)\b/i.test(t))
    profile.need_category.push('health')
  if (/\b(education|school|study|scholarship|padippu|படிப்பு|शिक्षा)\b/i.test(t))
    profile.need_category.push('education')
  if (/\b(house|home|shelter|housing|awas|வீடு|घर)\b/i.test(t))
    profile.need_category.push('housing')
  if (/\b(job|employ|work|rozgar|வேலை|रोजगार)\b/i.test(t))
    profile.need_category.push('employment')

  return profile
}

// ── Rule-based scheme matching — NO AI needed ─────────────────
export function matchSchemesByProfile(schemes, profile, userText) {
  const t = (userText || '').toLowerCase()

  return schemes.map(scheme => {
    let score = 40 // base score
    const reasons = []
    const s = scheme

    // Age matching
    if (profile.age) {
      if (profile.age >= 60) {
        if (/pension|elderly|senior|vaya|old age/i.test(s.name + s.description)) {
          score += 25; reasons.push('Age 60+ eligible for senior schemes')
        }
      }
      if (profile.age <= 25 && /scholarship|student|youth|education/i.test(s.name + s.description)) {
        score += 25; reasons.push('Youth education scheme')
      }
      if (profile.age >= 18 && profile.age <= 40 && /atal pension|APY/i.test(s.name)) {
        score += 20; reasons.push('Eligible age for APY')
      }
    }

    // Occupation matching
    if (profile.occupation === 'farmer') {
      if (/kisan|farmer|agri|crop|fasal|pmfby/i.test(s.name + s.description)) {
        score += 30; reasons.push('Farmer scheme')
      }
    }
    if (profile.occupation === 'student') {
      if (/scholarship|education|student|nsp/i.test(s.name + s.description)) {
        score += 30; reasons.push('Student scholarship')
      }
    }
    if (profile.occupation === 'unemployed' || profile.occupation === 'daily_wage') {
      if (/mgnrega|employment|skill|rozgar|kaushal/i.test(s.name + s.description)) {
        score += 25; reasons.push('Employment scheme')
      }
    }
    if (profile.occupation === 'business') {
      if (/mudra|loan|enterprise|pmegp/i.test(s.name + s.description)) {
        score += 25; reasons.push('Business loan scheme')
      }
    }

    // Gender matching
    if (profile.gender === 'female') {
      if (/women|woman|mahila|beti|ujjwala|sukanya|girl|maternity|janani/i.test(s.name + s.description)) {
        score += 20; reasons.push('Women welfare scheme')
      }
    }

    // Health needs
    if (/health|hospital|medical/i.test(t)) {
      if (/ayushman|pmjay|health|hospital|janani/i.test(s.name + s.description)) {
        score += 20; reasons.push('Health coverage')
      }
    }

    // Housing needs
    if (/house|home|shelter/i.test(t)) {
      if (/awas|housing|pmay|shelter/i.test(s.name + s.description)) {
        score += 20; reasons.push('Housing scheme')
      }
    }

    // Caste matching
    if (profile.caste === 'sc' || profile.caste === 'st') {
      if (/sc|st|dalit|tribal|scheduled/i.test(s.description + (s.eligibility || []).join(' '))) {
        score += 15; reasons.push('SC/ST priority')
      }
    }

    // Text keyword matching
    const keywords = t.split(' ').filter(w => w.length > 3)
    for (const kw of keywords) {
      if ((s.name + s.description).toLowerCase().includes(kw)) {
        score += 5
      }
    }

    return {
      ...s,
      eligibility: Math.min(score, 95),
      reason: reasons[0] || 'May be eligible — check official portal',
      benefit: s.benefit || 'Check official portal',
      applyLink: s.applyLink || '',
    }
  }).sort((a, b) => b.eligibility - a.eligibility)
}