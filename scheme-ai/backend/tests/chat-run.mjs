// backend/tests/chat-run.mjs
// Run from /backend (the backend server must be running):   node tests/chat-run.mjs
// Optional filter by language code:                          node tests/chat-run.mjs ta
//
// Sends real prompts (Indian scripts, romanized, typos, multi-turn) to /api/chat/message
// and checks: 1) the profile the AI understood  2) the reply is in the chosen language.

const API = process.env.API || 'http://localhost:5000/api/chat/message'
const DELAY_MS = Number(process.env.DELAY_MS) || 2500 // stay under the Groq rate limit

const NAME = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali', mr: 'Marathi',
  kn: 'Kannada', gu: 'Gujarati', ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu', or: 'Odia',
}

// [ui language code, [message, ...one session], expected profile subset]
const CASES = [
  // ── Tamil: script, romanized, typos, multi-turn ────────────────────────────
  ['ta', ['நான் ஒரு விவசாயி, தமிழ்நாடு, கடன் வேண்டும்'], { occupation: 'farmer', state: 'Tamil Nadu' }],
  ['ta', ['என் கணவர் இறந்துவிட்டார், எனக்கு என்ன உதவி கிடைக்கும்'], { is_widow: true }],
  ['ta', ['நான் கல்லூரி மாணவன், உதவித்தொகை வேண்டும்'], { occupation: 'student' }],
  ['ta', ['எனக்கு 65 வயது, ஓய்வூதியம் வேண்டும்'], { age: 65 }],
  ['ta', ['naan oru vivasayi, 2 acre nilam irukku, kadan venum'], { occupation: 'farmer' }],
  ['ta', ['en purushan irandhutaru, enakku enna udhavi kidaikkum'], { is_widow: true }],
  ['ta', ['ennaku 65 vayasu, pension venum, tamilnadu'], { age: 65, state: 'Tamil Nadu' }],
  ['ta', ['நான் விவசாயி', 'தமிழ்நாடு', 'எனக்கு 28 வயது'], { occupation: 'farmer', state: 'Tamil Nadu', age: 28 }],

  // ── Hindi / Hinglish ───────────────────────────────────────────────────────
  ['hi', ['मैं किसान हूँ, उत्तर प्रदेश से, कर्ज चाहिए'], { occupation: 'farmer', state: 'Uttar Pradesh' }],
  ['hi', ['मेरे पति की मृत्यु हो गई है, मुझे क्या मदद मिलेगी'], { is_widow: true }],
  ['hi', ['meri umar 65 saal hai mujhe pention chahiye'], { age: 65 }],
  ['hi', ['mera beta 12 pass hai scolarship chahiye'], {}],

  // ── Other Indian languages (script) ────────────────────────────────────────
  ['te', ['నేను రైతును, ఆంధ్రప్రదేశ్, రుణం కావాలి'], { occupation: 'farmer', state: 'Andhra Pradesh' }],
  ['kn', ['ನಾನು ರೈತ, ಕರ್ನಾಟಕ, ಸಾಲ ಬೇಕು'], { occupation: 'farmer', state: 'Karnataka' }],
  ['ml', ['ഞാൻ ഒരു കർഷകനാണ്, കേരളം, വായ്പ വേണം'], { occupation: 'farmer', state: 'Kerala' }],
  ['bn', ['আমি একজন কৃষক, পশ্চিমবঙ্গ, ঋণ দরকার'], { occupation: 'farmer', state: 'West Bengal' }],
  ['mr', ['मी शेतकरी आहे, महाराष्ट्र, कर्ज हवे आहे'], { occupation: 'farmer', state: 'Maharashtra' }],
  ['gu', ['હું ખેડૂત છું, ગુજરાત, લોન જોઈએ છે'], { occupation: 'farmer', state: 'Gujarat' }],
  ['pa', ['ਮੈਂ ਕਿਸਾਨ ਹਾਂ, ਪੰਜਾਬ, ਕਰਜ਼ਾ ਚਾਹੀਦਾ ਹੈ'], { occupation: 'farmer', state: 'Punjab' }],
  ['ur', ['میں کسان ہوں، اتر پردیش، قرض چاہیے'], { occupation: 'farmer', state: 'Uttar Pradesh' }],
  ['or', ['ମୁଁ ଜଣେ ଚାଷୀ, ଓଡ଼ିଶା, ଋଣ ଦରକାର'], { occupation: 'farmer', state: 'Odisha' }],

  // ── English: typos, gibberish, off-topic, greeting ─────────────────────────
  ['en', ['i am farmar from tamilnadu need loan'], { occupation: 'farmer', state: 'Tamil Nadu' }],
  ['en', ['student scolarship sc categry'], { occupation: 'student', caste: 'sc' }],
  ['en', ['my hsuband died no income what govt help'], { is_widow: true }],
  ['en', ['hello'], {}],
  ['en', ['asdfgh'], {}],
  ['en', ['who is the prime minister'], {}],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const only = process.argv[2]
const nonAscii = (s) => (s.match(/[^\x00-\x7F]/g) || []).length / Math.max(s.length, 1)

function profileOk(got = {}, want = {}) {
  return Object.entries(want).every(([k, v]) =>
    Array.isArray(v) ? v.every((x) => (got[k] || []).includes(x)) : got[k] === v)
}

async function send(body) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

let run = 0, profilePass = 0, langPass = 0, langChecked = 0

for (const [i, [code, messages, want]] of CASES.entries()) {
  if (only && code !== only) continue
  const sid = `test-${Date.now()}-${i}`
  let data
  try {
    for (const message of messages) {
      data = await send({ message, language: NAME[code], languageCode: code, sessionId: sid, mode: 'text' })
      if (messages.length > 1) await sleep(1200)
    }
  } catch (e) {
    console.log(`\n[${code}] ERROR "${messages.at(-1)}"  ->  ${e.message}`)
    console.log('   Is the backend running on http://localhost:5000 ?')
    continue
  }
  run++

  const pOk = profileOk(data.userProfile, want)
  if (pOk) profilePass++
  // a non-English UI language should produce mostly non-ASCII text in the reply
  let lOk = null
  if (code !== 'en' && data.reply) { langChecked++; lOk = nonAscii(data.reply) > 0.3; if (lOk) langPass++ }

  const p = data.userProfile || {}
  const prof = ['state', 'occupation', 'age', 'gender', 'caste', 'is_widow', 'is_disabled']
    .filter((k) => p[k] !== undefined).map((k) => `${k}=${p[k]}`).join(', ')
  console.log(`\n[${code}] ${pOk ? 'PASS' : 'FAIL'} profile${lOk === null ? '' : lOk ? ' | PASS reply-language' : ' | FAIL reply-language'}   "${messages.join('  ->  ')}"`)
  console.log(`   understood : ${data.understood}  (confidence ${data.confidence}, intent ${data.intent})`)
  console.log(`   profile    : ${prof || '(none)'}${p.need_category?.length ? ', need=' + p.need_category.join('/') : ''}`)
  console.log(`   schemes    : ${(data.schemes || []).map((s) => s.name).join(' | ') || '(none)'}`)
  console.log(`   reply      : ${String(data.reply).slice(0, 220)}${String(data.reply).length > 220 ? '…' : ''}`)
  await sleep(DELAY_MS)
}

console.log(`\n==== ${run} prompts run | profile correct: ${profilePass}/${run}` +
  (langChecked ? ` | reply in chosen language: ${langPass}/${langChecked}` : '') + ' ====')
process.exit(0)