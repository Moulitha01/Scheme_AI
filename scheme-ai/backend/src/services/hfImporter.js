// backend/src/services/hfImporter.js
// Imports 2877 scheme PDFs from HuggingFace dataset into MongoDB
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'
import { Scheme } from '../models/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HF_DIR = path.join(__dirname, '../../documents/huggingface/text_data')
const PROGRESS_FILE = path.join(__dirname, '../../.hf-import-progress.json')

// ── Load progress so we can resume if interrupted ─────────────
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE))
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
  } catch { }
  return { processedFiles: [], lastRun: null }
}

function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
  } catch { }
}

// ── Extract text from PDF ─────────────────────────────────────
async function extractPdfText(filePath) {
  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
    const buffer = fs.readFileSync(filePath)
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (err) {
    return ''
  }
}

// ── Map category from text ────────────────────────────────────
function detectCategory(text) {
  const t = text.toLowerCase()
  if (t.includes('agricultur') || t.includes('farmer') || t.includes('kisan') || t.includes('crop')) return 'Agriculture'
  if (t.includes('health') || t.includes('hospital') || t.includes('medical') || t.includes('ayushman')) return 'Health'
  if (t.includes('scholarship') || t.includes('education') || t.includes('student') || t.includes('school')) return 'Education'
  if (t.includes('housing') || t.includes('awas') || t.includes('house') || t.includes('shelter')) return 'Housing'
  if (t.includes('women') || t.includes('girl') || t.includes('mahila') || t.includes('child') || t.includes('beti')) return 'Women & Child'
  if (t.includes('employment') || t.includes('skill') || t.includes('job') || t.includes('rozgar') || t.includes('training')) return 'Employment'
  if (t.includes('loan') || t.includes('finance') || t.includes('pension') || t.includes('insurance') || t.includes('mudra')) return 'Finance'
  if (t.includes('disab') || t.includes('divyang') || t.includes('handicap')) return 'Disability'
  return 'Other'
}

// ── Detect state from text ────────────────────────────────────
function detectState(text) {
  return 'Central'
}

// ── Parse structured data from PDF text ───────────────────────
function parseSchemeFromText(text, filename) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Get scheme name — usually first meaningful line
  let name = ''
  for (const line of lines.slice(0, 5)) {
    if (line.length > 5 && line.length < 150 && !line.toLowerCase().includes('page') && !line.match(/^\d+$/)) {
      name = line
      break
    }
  }
  if (!name) name = filename.replace('.pdf', '').replace(/-/g, ' ').replace(/_/g, ' ')

  // Get description — first substantial paragraph
  let description = ''
  for (const line of lines) {
    if (line.length > 80) {
      description = line.slice(0, 500)
      break
    }
  }
  if (!description && lines.length > 1) {
    description = lines.slice(1, 4).join(' ').slice(0, 500)
  }

  // Extract eligibility — look for eligibility section
  const eligibilityCriteria = []
  let inEligibility = false
  for (const line of lines) {
    if (/eligib|who can apply|criteria/i.test(line)) {
      inEligibility = true
      continue
    }
    if (inEligibility) {
      if (/benefit|document|how to apply|procedure|about/i.test(line)) break
      if (line.length > 5 && line.length < 200) {
        eligibilityCriteria.push(line.replace(/^[-•*]\s*/, ''))
        if (eligibilityCriteria.length >= 6) break
      }
    }
  }

  // Extract benefit
  let benefit = 'See official portal'
  let inBenefit = false
  for (const line of lines) {
    if (/benefit|what you get|amount|financial/i.test(line)) {
      inBenefit = true
      continue
    }
    if (inBenefit && line.length > 10) {
      benefit = line.slice(0, 200)
      break
    }
  }

  // Extract documents
  const documents = []
  let inDocs = false
  for (const line of lines) {
    if (/document|required|proof/i.test(line)) {
      inDocs = true
      continue
    }
    if (inDocs) {
      if (/how to apply|procedure|benefit|eligib/i.test(line)) break
      if (line.length > 3 && line.length < 100) {
        documents.push(line.replace(/^[-•*]\s*/, ''))
        if (documents.length >= 6) break
      }
    }
  }

  // Extract apply link
  const urlMatch = text.match(/https?:\/\/[^\s]+\.gov\.in[^\s]*/i)
  const applyLink = urlMatch ? urlMatch[0].replace(/[.,)]+$/, '') : ''

  // Extract ministry
  let ministry = 'Government of India'
  const ministryMatch = text.match(/ministry of ([^\n.]+)/i)
  if (ministryMatch) ministry = `Ministry of ${ministryMatch[1].trim().slice(0, 100)}`

  return {
    name: name.slice(0, 200),
    ministry,
    category: detectCategory(text),
    state: detectState(text),
    description: description || 'See official portal for details',
    eligibilityCriteria: eligibilityCriteria.length ? eligibilityCriteria : ['See official portal'],
    benefit,
    documents: documents.length ? documents : ['Aadhaar Card'],
    applyLink,
    isActive: true,
    sourceFile: filename,
  }
}

// ── Main importer ─────────────────────────────────────────────
export async function importHuggingFaceDataset({ batchSize = 50, maxFiles = null } = {}) {
  if (!fs.existsSync(HF_DIR)) {
    logger.warn('HuggingFace dataset not found. Run: git clone https://huggingface.co/datasets/shrijayan/gov_myscheme documents/huggingface')
    return 0
  }

  logger.info('📚 Starting HuggingFace dataset import...')
  const progress = loadProgress()
  const processedSet = new Set(progress.processedFiles)

  // Get all PDF files (skip "copy" duplicates)
  let allFiles = fs.readdirSync(HF_DIR)
    .filter(f => f.endsWith('.pdf') && !f.includes(' copy'))
    .sort()

  if (maxFiles) allFiles = allFiles.slice(0, maxFiles)

  const remaining = allFiles.filter(f => !processedSet.has(f))
  logger.info(`📄 Total: ${allFiles.length} PDFs | Already done: ${processedSet.size} | Remaining: ${remaining.length}`)

  if (remaining.length === 0) {
    logger.info('✅ All PDFs already imported!')
    return processedSet.size
  }

  let imported = 0
  let failed = 0
  const batch = []

  for (let i = 0; i < remaining.length; i++) {
    const filename = remaining[i]
    const filePath = path.join(HF_DIR, filename)

    try {
      const text = await extractPdfText(filePath)
      if (!text || text.trim().length < 50) {
        processedSet.add(filename)
        failed++
        continue
      }

      const scheme = parseSchemeFromText(text, filename)
      if (!scheme.name || scheme.description === 'See official portal for details') {
        processedSet.add(filename)
        failed++
        continue
      }

      batch.push(scheme)
      processedSet.add(filename)

      // Save batch to MongoDB
      if (batch.length >= batchSize) {
        await saveBatch(batch.splice(0, batchSize))
        imported += batchSize
        saveProgress({ processedFiles: [...processedSet], lastRun: new Date().toISOString() })
        logger.info(`  💾 Progress: ${imported + processedSet.size - remaining.length + i + 1}/${allFiles.length} (${Math.round((i + 1) / remaining.length * 100)}%)`)
      }

    } catch (err) {
      processedSet.add(filename)
      failed++
    }
  }

  // Save remaining batch
  if (batch.length > 0) {
    await saveBatch(batch)
    imported += batch.length
  }

  saveProgress({ processedFiles: [...processedSet], lastRun: new Date().toISOString() })
  logger.info(`✅ HuggingFace import complete: ${imported} schemes imported, ${failed} skipped`)
  return imported
}

async function saveBatch(schemes) {
  for (const scheme of schemes) {
    try {
      await Scheme.findOneAndUpdate(
        { name: scheme.name },
        { ...scheme, isActive: true },
        { upsert: true, new: true }
      )
    } catch { }
  }
}

// ── Check if import needed ────────────────────────────────────
export async function isHFImportNeeded() {
  const progress = loadProgress()
  if (!progress.lastRun) return true
  const count = await Scheme.countDocuments({ sourceFile: { $exists: true } })
  return count < 100
}