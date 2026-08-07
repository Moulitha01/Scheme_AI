import { connectDB } from './src/utils/db.js'
import { Scheme } from './src/models/index.js'

await connectDB()
const result = await Scheme.deleteMany({})
console.log('Cleared all schemes:', result.deletedCount)
process.exit()