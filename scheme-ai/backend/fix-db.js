// Run this ONCE from backend/ folder: node fix-db.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

async function fix() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected!')

  const col = mongoose.connection.db.collection('schemes')

  // 1. Drop the slug_1 index causing duplicate key error
  try {
    await col.dropIndex('slug_1')
    console.log('✅ Dropped slug_1 index')
  } catch (e) {
    console.log('slug_1 not found:', e.message)
  }

  // 2. Remove slug field from all documents
  const r = await col.updateMany({}, { $unset: { slug: '' } })
  console.log(`✅ Removed slug from ${r.modifiedCount} documents`)

  // 3. Show schemes
  const schemes = await col.find({}, { projection: { name: 1, category: 1 } }).toArray()
  console.log(`\n✅ ${schemes.length} schemes in DB:`)
  schemes.forEach((s, i) => console.log(`  ${i+1}. ${s.name} [${s.category}]`))

  await mongoose.disconnect()
  console.log('\nDone! Restart backend now.')
}
fix().catch(console.error)