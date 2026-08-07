import { connectDB } from './src/utils/db.js'
import { Scheme } from './src/models/index.js'

await connectDB()
const states = await Scheme.aggregate([
  { $group: { _id: '$state', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
console.log('Schemes by state:')
states.forEach(s => console.log(`${s._id}: ${s.count}`))
process.exit()