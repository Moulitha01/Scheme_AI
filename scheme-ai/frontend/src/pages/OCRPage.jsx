// frontend/src/pages/OCRPage.jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLanguage } from '../context/LanguageContext'

export default function OCRPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setExtractedData(null)
    setError('')
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('document', file)
      const { data } = await axios.post('/api/ocr/extract', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setExtractedData(data)
    } catch (err) {
      setError(t('ocr.errorExtract', 'Could not extract data. Please try a clearer image.'))
    } finally { setLoading(false) }
  }

  const navTabs = [
    { label: t('nav.home', 'Home'), path: '/' },
    { label: t('nav.talkToAI', 'Talk to AI'), path: '/chat' },
    { label: t('nav.schemes', 'Schemes'), path: '/schemes' },
    { label: t('nav.scanId', 'Scan ID'), path: '/ocr' },
    { label: t('nav.dashboard', 'Dashboard'), path: '/dashboard' },
  ]

  const docTypes = [
    { icon: '🪪', label: t('ocr.docType.aadhaar', 'Aadhaar Card') },
    { icon: '🏷️', label: t('ocr.docType.ration', 'Ration Card') },
    { icon: '💳', label: t('ocr.docType.pan', 'PAN Card') },
    { icon: '📋', label: t('ocr.docType.other', 'Other Document') },
  ]

  const infoCards = [
    { icon: '🔒', title: t('ocr.info.secureTitle', 'Secure'), desc: t('ocr.info.secureDesc', 'Your document is never stored — only the extracted text is used.') },
    { icon: '⚡', title: t('ocr.info.instantTitle', 'Instant'), desc: t('ocr.info.instantDesc', 'AI extracts your details in under 3 seconds.') },
    { icon: '🎯', title: t('ocr.info.accurateTitle', 'Accurate'), desc: t('ocr.info.accurateDesc', 'Auto-fills your profile for better scheme matching.') },
  ]

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#f8f9fc' }}>
      {/* Tricolor */}
      <div style={{ height: 5, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '2px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5%', height: 60, background: '#fff',
        borderBottom: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏛️</div>
          <span style={{ fontWeight: 800, fontSize: 20 }}>Scheme<span style={{ color: '#FF6B00' }}>-AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {navTabs.map((tab, i) => (
            <button key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                background: i === 3 ? '#fff8f0' : 'transparent',
                color: i === 3 ? '#FF6B00' : '#555',
                border: i === 3 ? '1px solid #ffd0a0' : '1px solid transparent',
                borderRadius: 8, padding: '7px 16px', fontSize: 14,
                fontWeight: i === 3 ? 700 : 400, cursor: 'pointer',
              }}>{tab.label}</button>
          ))}
        </div>
        <button onClick={() => navigate('/chat')}
          style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          🎙️ {t('nav.talkToAI', 'Talk to AI')}
        </button>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 5%' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
          📄 {t('ocr.pageTitle', 'Scan Your ID Document')}
        </h1>
        <p style={{ fontSize: 15, color: '#888', margin: '0 0 32px' }}>
          {t('ocr.pageSubtitle', "Upload your Aadhaar card or Ration card — we'll extract your details automatically and match you to the right schemes.")}
        </p>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          style={{
            border: `3px dashed ${file ? '#FF6B00' : '#e0e0e0'}`,
            borderRadius: 20, padding: 48, textAlign: 'center',
            background: file ? '#fff8f0' : '#fff', cursor: 'pointer',
            transition: 'all 0.2s', marginBottom: 24,
          }}>
          {preview ? (
            <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 12, marginBottom: 12 }} />
          ) : (
            <div style={{ fontSize: 52, marginBottom: 16 }}>📷</div>
          )}
          <p style={{ fontSize: 17, fontWeight: 600, color: '#333', margin: '0 0 6px' }}>
            {file ? file.name : t('ocr.dropzoneTitle', 'Drag & drop your document here')}
          </p>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
            {file ? t('ocr.clickToChange', 'Click to change file') : t('ocr.orBrowse', 'or click to browse — Aadhaar, Ration Card, PAN')}
          </p>
          <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Document type selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {docTypes.map((d, i) => (
            <button key={i} style={{
              background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
              padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8, color: '#333',
            }}>
              {d.icon} {d.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fde8e8', border: '1px solid #f5b7b1', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#c0392b', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            width: '100%', background: !file || loading ? '#e0e0e0' : 'linear-gradient(135deg, #FF6B00, #FFAA00)',
            color: !file || loading ? '#aaa' : '#fff', border: 'none', borderRadius: 14,
            padding: '16px', fontSize: 17, fontWeight: 700, cursor: !file || loading ? 'default' : 'pointer',
            marginBottom: 24,
          }}>
          {loading ? `⏳ ${t('ocr.extracting', 'Extracting details...')}` : `🔍 ${t('ocr.extractButton', 'Extract & Find Schemes')}`}
        </button>

        {/* Extracted data */}
        {extractedData && (
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ {t('ocr.extractedDetails', 'Extracted Details')}
            </h3>
            {Object.entries(extractedData).filter(([k]) => !['raw', 'confidence'].includes(k)).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 100 }}>{key}</span>
                <span style={{ fontSize: 15, color: '#1a1a2e', fontWeight: 600 }}>{String(val)}</span>
              </div>
            ))}
            <button onClick={() => navigate('/chat')}
              style={{ marginTop: 20, width: '100%', background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              🎙️ {t('ocr.findMySchemes', 'Find My Schemes')} →
            </button>
          </div>
        )}

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 32 }}>
          {infoCards.map((c, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>{c.title}</h4>
              <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 5, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '2px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>
    </div>
  )
}