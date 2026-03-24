// backend/src/services/documentIngestor.js
// Drop any PDF/TXT into backend/documents/ — auto-ingests into ChromaDB on server start

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'
import { ingestSchemes } from './rag.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = path.join(__dirname, '../../documents')
const PROCESSED_LOG = path.join(__dirname, '../../documents/.processed.json')

// ── Ensure documents folder exists ──────────────────────────
export function ensureDocumentsFolder() {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true })
    logger.info(`📁 Created documents folder: ${DOCS_DIR}`)
    fs.writeFileSync(
      path.join(DOCS_DIR, 'README.txt'),
      `SCHEME-AI DOCUMENTS FOLDER
==========================
Drop government scheme PDFs or text files here.
They will be automatically ingested into the RAG system on next server start.

Supported: .pdf, .txt, .md
Example: PM-KISAN_2024.pdf

No code changes needed — just drop the file and restart the server.
`
    )
  }
}

// ── Load / save processed log ────────────────────────────────
function loadProcessedLog() {
  try {
    if (fs.existsSync(PROCESSED_LOG)) {
      return JSON.parse(fs.readFileSync(PROCESSED_LOG, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function saveProcessedLog(log) {
  try {
    fs.writeFileSync(PROCESSED_LOG, JSON.stringify(log, null, 2))
  } catch (e) {
    logger.warn(`Could not save processed log: ${e.message}`)
  }
}

// ── Extract text from PDF ─────────────────────────────────────
async function extractPdfText(filePath) {
  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
    const buffer = fs.readFileSync(filePath)
    const data = await pdfParse(buffer)
    return data.text
  } catch (e) {
    logger.warn(`PDF parse error for ${filePath}: ${e.message}`)
    return null
  }
}

// ── Chunk text ───────────────────────────────────────────────
function chunkText(text, chunkSize = 2000, overlap = 200) {
  const chunks = []
  const clean = text.replace(/\s+/g, ' ').trim()
  let start = 0
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length)
    const chunk = clean.slice(start, end).trim()
    if (chunk.length > 100) chunks.push(chunk)
    start += chunkSize - overlap
  }
  return chunks
}

// ── Use Gemini to extract scheme data from text chunk ────────
async function parseSchemeFromText(text, fileName) {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' })

    const prompt = `
Extract all Indian government schemes from this text from "${fileName}".
Return ONLY a valid JSON array. Each item must have:
{
  "name": "scheme name",
  "ministry": "ministry name",
  "category": "Agriculture|Health|Education|Housing|Finance|Employment|Women & Child|Other",
  "state": "Central or state name",
  "description": "2-3 sentence description",
  "eligibility": ["criteria 1", "criteria 2"],
  "benefit": "benefit description",
  "documents": ["document 1"],
  "applyLink": ""
}
If no schemes found return [].
Return ONLY the JSON array.

Text: ${text.slice(0, 3000)}
`.trim()

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    logger.warn(`Gemini extraction failed: ${e.message}`)
    return []
  }
}

// ── Main export ───────────────────────────────────────────────
export async function ingestDocumentsFolder() {
  ensureDocumentsFolder()

  const processedLog = loadProcessedLog()
  const files = fs.readdirSync(DOCS_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase()
    return ['.pdf', '.txt', '.md'].includes(ext)
      && !f.startsWith('.')
      && f.toLowerCase() !== 'readme.txt'
  })

  if (files.length === 0) {
    logger.info('📁 No documents to ingest. Drop PDFs into backend/documents/ to add schemes.')
    return
  }

  logger.info(`📂 Found ${files.length} document(s) in documents folder`)
  let totalNew = 0

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file)
    const stat = fs.statSync(filePath)
    const fileKey = `${file}:${stat.mtimeMs}`

    if (processedLog[fileKey]) {
      logger.info(`  ⏭️  Skipping (unchanged): ${file}`)
      continue
    }

    logger.info(`  📄 Processing: ${file}`)
    totalNew++

    try {
      const ext = path.extname(file).toLowerCase()
      let rawText = ext === '.pdf'
        ? await extractPdfText(filePath)
        : fs.readFileSync(filePath, 'utf-8')

      if (!rawText || rawText.trim().length < 50) {
        logger.warn(`    ⚠️  Could not extract text from ${file}`)
        continue
      }

      const chunks = chunkText(rawText)
      logger.info(`    📦 ${chunks.length} chunks — extracting schemes with Gemini...`)

      const allSchemes = []
      const seenNames = new Set()

      for (let i = 0; i < Math.min(chunks.length, 4); i++) {
        const schemes = await parseSchemeFromText(chunks[i], file)
        for (const s of schemes) {
          if (s.name && !seenNames.has(s.name.toLowerCase())) {
            seenNames.add(s.name.toLowerCase())
            allSchemes.push({ ...s, sourceFile: file, isActive: true })
          }
        }
        if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500))
      }

      if (allSchemes.length > 0) {
        logger.info(`    🎯 Found ${allSchemes.length} scheme(s) — ingesting...`)
        await ingestSchemes(allSchemes)
      } else {
        // Fallback: ingest raw chunks directly
        logger.info(`    📝 No structured schemes found — ingesting ${chunks.length} raw chunks`)
        const rawSchemes = chunks.map((chunk, i) => ({
          name: `${path.basename(file, ext)} — Part ${i + 1}`,
          ministry: 'Government of India',
          category: 'Other',
          state: 'Central',
          description: chunk.slice(0, 300),
          eligibility: ['See official document'],
          benefit: 'See official document',
          documents: [],
          applyLink: '',
          sourceFile: file,
          isActive: true,
        }))
        await ingestSchemes(rawSchemes)
      }

      processedLog[fileKey] = { processedAt: new Date().toISOString() }
      saveProcessedLog(processedLog)

    } catch (e) {
      logger.error(`    ❌ Error processing ${file}: ${e.message}`)
    }
  }

  if (totalNew === 0) {
    logger.info('✅ All documents already processed. No changes.')
  } else {
    logger.info(`✅ Document ingestion done: ${totalNew} new file(s) processed`)
  }
}