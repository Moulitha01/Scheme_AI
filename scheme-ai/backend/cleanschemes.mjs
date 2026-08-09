import { connectDB } from './src/utils/db.js'
import { Scheme } from './src/models/index.js'

await connectDB()

function cleanText(text) {
  if (!text) return text
  let t = text
  // Remove everything after these patterns
  t = t.replace(/Are you sure you want to sign out\?.*$/s, '')
  t = t.replace(/You need to sign in before.*$/s, '')
  t = t.replace(/Questions\s*Sources.*$/s, '')
  t = t.replace(/References\s*Feedback.*$/s, '')
  t = t.replace(/Something went wrong.*$/s, '')
  t = t.replace(/Cancel\s*Sign\s*$/gi, '')
  t = t.replace(/Ok\s*Cancel.*$/s, '')
  return t.trim().replace(/\s+/g, ' ')
}

console.log('Cleaning scheme data...')
let updated = 0
const cursor = Scheme.find({}).cursor()

for await (const scheme of cursor) {
  const cleanedName = cleanText(scheme.name)
  const cleanedBenefit = cleanText(scheme.benefit)
  const cleanedDesc = cleanText(scheme.description)

  if (cleanedName !== scheme.name || cleanedBenefit !== scheme.benefit || cleanedDesc !== scheme.description) {
    await Scheme.findByIdAndUpdate(scheme._id, {
      name: cleanedName,
      benefit: cleanedBenefit,
      description: cleanedDesc,
    })
    updated++
    if (updated % 100 === 0) console.log(`Cleaned ${updated}...`)
  }
}

console.log(`Done! Cleaned ${updated} schemes.`)
process.exit()