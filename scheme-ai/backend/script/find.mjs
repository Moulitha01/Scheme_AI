
import '../src/env.js'
import { connectDB } from '../src/utils/db.js'
import { Scheme } from '../src/models/index.js'

const pattern = process.argv[2] || 'kisan'
await connectDB()
const rows = await Scheme.find({ isActive: true, name: { $regex: pattern, $options: 'i' } })
  .select('name state category benefit applyLink').limit(30).lean()
console.log(`${rows.length} match(es) for /${pattern}/i`)
for (const r of rows) console.log(`- [${r.state}] ${r.name}  | benefit: ${r.benefit || '-'}`)
process.exit(0)
