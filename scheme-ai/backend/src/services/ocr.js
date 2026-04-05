// backend/src/services/ocr.js
import Tesseract from 'tesseract.js'
import { logger } from '../utils/logger.js'
import fs from 'fs'

const PATTERNS = {
  name: [
    /(?:name|नाम|பெயர்|లేదు)[:\s]*([A-Z][A-Za-z\s]{3,30})/m,
    /^([A-Z][A-Z\s]{3,30})$/m,
  ],
  dob: [
    /(?:dob|date of birth|जन्म तिथि|பிறந்த தேதி)[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,
  ],
  gender: [/\b(male|female|पुरुष|महिला|ஆண்|பெண்|స్త్రీ)\b/i],
  aadhaar: [/(\d{4}\s\d{4}\s\d{4})/, /(\d{12})/],
  pincode: [/\b(\d{6})\b/],
  mobile: [
    /(?:mobile|phone|mob)[:\s]*([6-9]\d{9})/i,
    /\b([6-9]\d{9})\b/,
  ],
  state: [
    /(?:Tamil Nadu|Maharashtra|Karnataka|Kerala|Andhra Pradesh|Telangana|Gujarat|Rajasthan|Uttar Pradesh|Bihar|West Bengal|Madhya Pradesh|Punjab|Haryana|Odisha|Assam|Jharkhand|Uttarakhand|Himachal Pradesh|Goa|Delhi)/i,
  ],
  address: [/(?:address|पता|முகவரி)[:\s]*(.{10,100})/i],
}

function normalizeGender(raw) {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (['male', 'पुरुष', 'ஆண்'].some(v => lower.includes(v))) return 'Male'
  if (['female', 'महिला', 'பெண்', 'స్త్రీ'].some(v => lower.includes(v))) return 'Female'
  return raw
}

function extractAge(dob) {
  if (!dob) return ''
  const parts = dob.split(/[\/\-]/)
  if (parts.length !== 3) return ''
  const [day, month, year] = parts.map(Number)
  const age = new Date().getFullYear() - new Date(year, month - 1, day).getFullYear()
  return isNaN(age) ? '' : String(age)
}

async function runOCR(filePath) {
  logger.info(`Running Tesseract OCR on: ${filePath}`)
  try {
    const result = await Tesseract.recognize(filePath, 'eng+hin+tam+tel+kan+ben+guj+mar', {
      logger: () => {},
    })
    return result.data.text
  } catch (err) {
    logger.error(`Tesseract error: ${err.message}`)
    return ''
  }
}

function extractWithPatterns(text) {
  const fields = {}
  for (const [field, patterns] of Object.entries(PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) { fields[field] = match[1].trim(); break }
    }
  }
  if (fields.gender) fields.gender = normalizeGender(fields.gender)
  if (fields.dob) fields.age = extractAge(fields.dob)
  if (!fields.state && fields.address) {
    const m = fields.address.match(PATTERNS.state[0])
    if (m) fields.state = m[0]
  }
  return fields
}

// ── Use Groq to extract fields from OCR text ─────────────────
async function extractWithGroq(ocrText, docType) {
  try {
    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'You extract fields from Indian government documents. Return ONLY valid JSON, no markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Extract all fields from this ${docType} OCR text.
Return JSON with these fields (use "" if not found):
name, dob (DD/MM/YYYY), age (number), gender (Male/Female), aadhaar (XXXX XXXX XXXX format), mobile (10 digits), address, state, district, pincode, caste (General/OBC/SC/ST), income, occupation

OCR Text:
${ocrText.slice(0, 2000)}

Return ONLY the JSON object:`,
        },
      ],
    })

    const raw = result.choices[0]?.message?.content?.replace(/```json|```/g, '').trim() || '{}'
    const match = raw.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : '{}')
  } catch (err) {
    logger.warn(`Groq OCR extraction failed: ${err.message}, using pattern fallback`)
    return null
  }
}

function calculateConfidence(fields) {
  const keyFields = ['name', 'dob', 'gender', 'aadhaar', 'state']
  const found = keyFields.filter(f => fields[f] && fields[f] !== '').length
  return Math.round((found / keyFields.length) * 100)
}

export async function extractFromDocument(filePath, docType = 'aadhaar') {
  try {
    const ocrText = await runOCR(filePath)

    if (!ocrText || ocrText.trim().length < 10) {
      return { success: false, fields: {}, confidence: 0, error: 'Could not read text from document' }
    }

    logger.info(`OCR extracted ${ocrText.length} characters`)

    // Try Groq first (smarter extraction)
    let fields = await extractWithGroq(ocrText, docType)

    // Fall back to regex patterns if Groq fails
    if (!fields || Object.values(fields).every(v => !v)) {
      logger.info('Using pattern-based extraction')
      fields = extractWithPatterns(ocrText)
    }

    // Fill age from dob if missing
    if (!fields.age && fields.dob) fields.age = extractAge(fields.dob)

    return {
      success: true,
      fields,
      confidence: calculateConfidence(fields),
      rawText: ocrText.slice(0, 500),
    }
  } catch (err) {
    logger.error(`extractFromDocument error: ${err.message}`)
    return { success: false, fields: {}, confidence: 0, error: err.message }
  }
}