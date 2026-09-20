// backend/tests/run.mjs   —   run from /backend:  node tests/run.mjs
import 'dotenv/config'
import { understand } from '../src/services/understand.js'

// [input, expected subset of profile_updates]
const CASES = [
  ['i am farmar from tamilnadu need loan', { occupation: 'farmer', state: 'Tamil Nadu' }],
  ['mujhe pention chahiye meri umar 65 hai', { age: 65 }],
  ['naan oru vidhavai, ennaku enna scheme irukku', { is_widow: true }],
  ['student scolarship sc categry', { occupation: 'student', caste: 'sc' }],
  ['my hsuband died no income what govt help', { is_widow: true, gender: 'female' }],
  ['mera beta 12 pass hai scolarship chahiye', {}],
  ['naan vivasayi, 2 acre nilam irukku, Tamilnadu', { occupation: 'farmer', state: 'Tamil Nadu', land_acres: 2 }],
  ['kisaan hu UP se 5 bigha zameen', { occupation: 'farmer', state: 'Uttar Pradesh' }],
  ['i am 62 yrs old ,no pention', { age: 62 }],
  ['divyang hu 40 saal ka', { is_disabled: true, age: 40 }],
]

let pass = 0
for (const [text, want] of CASES) {
  const u = await understand({ message: text, history: [], profile: {}, language: 'English' })
  const ok = Object.entries(want).every(([k, v]) => u.profile_updates[k] === v)
  if (ok) pass++
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${text}"\n      got  ${JSON.stringify(u.profile_updates)}  intent=${u.intent} conf=${u.confidence}${u._fallback ? ' (fallback)' : ''}`)
}
console.log(`\n${pass}/${CASES.length} passed (${Math.round((pass / CASES.length) * 100)}%)`)
process.exit(0)