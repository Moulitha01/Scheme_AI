// src/pages/OCRPage.jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = 'http://localhost:5000'

const STEPS = [
  { id: 'upload',  icon: '📄', label: 'Upload',   desc: 'Choose document' },
  { id: 'scan',    icon: '🔍', label: 'Scan',      desc: 'AI extracts data' },
  { id: 'review',  icon: '✍️', label: 'Review',   desc: 'Check details' },
  { id: 'done',    icon: '✅', label: 'Done',      desc: 'Ready to apply' },
]

const DOC_TYPES = [
  { id: 'aadhaar',  icon: '🪪', label: 'Aadhaar Card',      color: '#FF6B00', fields: ['Name', 'DOB', 'Gender', 'Address', 'Aadhaar No'] },
  { id: 'pan',      icon: '💳', label: 'PAN Card',           color: '#0095FF', fields: ['Name', 'DOB', 'PAN No', 'Father Name'] },
  { id: 'income',   icon: '📋', label: 'Income Certificate', color: '#00D68F', fields: ['Name', 'Income', 'State', 'District'] },
  { id: 'ration',   icon: '🏠', label: 'Ration Card',        color: '#FFAA00', fields: ['Family Members', 'Category', 'Address'] },
]

function MeshBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 10% 20%, #FF6B0012 0%, transparent 50%),
                     radial-gradient(ellipse at 90% 80%, #0095FF10 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 50%, #00D68F08 0%, transparent 60%)`,
      }} />
    </div>
  )
}

export default function OCRPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [stage, setStage] = useState('upload')
  const [docType, setDocType] = useState('aadhaar')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [error, setError] = useState('')

  const currentDoc = DOC_TYPES.find(d => d.id === docType)
  const currentStep = STEPS.findIndex(s => s.id === stage)

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setShowCamera(true)
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      }, 100)
    } catch { setError('Camera not available. Please upload a file instead.') }
  }

  const capturePhoto = () => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    c.toBlob(blob => {
      const file = new File([blob], 'document.jpg', { type: 'image/jpeg' })
      setUploadedFile(file)
      setPreviewUrl(URL.createObjectURL(blob))
      streamRef.current?.getTracks().forEach(t => t.stop())
      setShowCamera(false)
    }, 'image/jpeg', 0.92)
  }

  const handleFile = (f) => {
    if (!f) return
    setUploadedFile(f)
    if (f.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(f))
    else setPreviewUrl(null)
    setError('')
  }

  const scanDocument = async () => {
    if (!uploadedFile) return
    setScanning(true)
    setStage('scan')
    try {
      const fd = new FormData()
      fd.append('document', uploadedFile)
      fd.append('docType', docType)
      const res = await fetch(`${API_BASE}/api/ocr/extract`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Extraction failed')
      setExtractedData(data.fields)
      setConfidence(data.confidence || 0)
      setStage('review')
    } catch (e) {
      setError(`Scan failed: ${e.message}`)
      setStage('upload')
    } finally { setScanning(false) }
  }

  const FIELD_LABELS = {
    name: 'Full Name', dob: 'Date of Birth', age: 'Age', gender: 'Gender',
    aadhaar: 'Aadhaar Number', mobile: 'Mobile', address: 'Address',
    state: 'State', district: 'District', pincode: 'Pincode',
  }

  return (
    <div className="min-h-screen relative" style={{
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #111827 100%)',
    }}>
      <MeshBg />

      {/* Tricolor top */}
      <div className="h-1 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white opacity-70" />
        <div className="flex-1 bg-green-600" />
      </div>

      {/* Header */}
      <div className="sticky top-1 z-40 px-4 py-3"
        style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            ← Back
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-black text-white text-lg">Document Scanner</h1>
            <p className="text-xs text-gray-500">AI-powered data extraction</p>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-20 relative z-10">

        {/* Progress tracker */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{
                    scale: i === currentStep ? 1.15 : 1,
                    boxShadow: i === currentStep ? `0 0 20px ${currentDoc?.color}60` : 'none',
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold transition-all"
                  style={{
                    background: i < currentStep ? '#00D68F'
                      : i === currentStep ? (currentDoc?.color || '#FF6B00')
                      : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${i <= currentStep ? (i < currentStep ? '#00D68F' : currentDoc?.color || '#FF6B00') : 'rgba(255,255,255,0.1)'}`,
                    color: i <= currentStep ? 'white' : '#4B5563',
                  }}
                >
                  {i < currentStep ? '✓' : step.icon}
                </motion.div>
                <div className="text-center">
                  <p className="text-xs font-bold" style={{ color: i === currentStep ? currentDoc?.color : i < currentStep ? '#00D68F' : '#4B5563' }}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-600 hidden sm:block">{step.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 md:w-16 h-0.5 mx-1 mb-5 transition-all"
                  style={{ background: i < currentStep ? '#00D68F' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── UPLOAD ── */}
          {stage === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Doc type selector */}
              <div className="mb-5">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3 text-center">Select Document Type</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DOC_TYPES.map(doc => (
                    <motion.button key={doc.id} whileTap={{ scale: 0.96 }}
                      onClick={() => setDocType(doc.id)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all"
                      style={{
                        background: docType === doc.id ? `${doc.color}15` : 'rgba(255,255,255,0.04)',
                        borderColor: docType === doc.id ? doc.color : 'rgba(255,255,255,0.08)',
                        boxShadow: docType === doc.id ? `0 0 15px ${doc.color}25` : 'none',
                      }}
                    >
                      <span className="text-2xl">{doc.icon}</span>
                      <span className="text-xs font-bold text-white text-center leading-tight">{doc.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Upload area */}
              {!uploadedFile ? (
                <motion.div
                  className="rounded-3xl border-2 border-dashed p-10 text-center mb-4 cursor-pointer transition-all"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                  whileHover={{ borderColor: currentDoc?.color, background: `${currentDoc?.color}08` }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-6xl mb-4">{currentDoc?.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{currentDoc?.label}</h3>
                  <p className="text-gray-500 text-sm mb-4">Drag & drop or click to browse</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {['JPG', 'PNG', 'PDF'].map(f => (
                      <span key={f} className="text-xs px-3 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#6B7280' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => handleFile(e.target.files[0])} />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl border p-4 mb-4"
                  style={{ background: 'rgba(0,214,143,0.08)', borderColor: 'rgba(0,214,143,0.3)' }}>
                  {previewUrl && (
                    <img src={previewUrl} alt="preview"
                      className="w-full max-h-48 object-contain rounded-2xl mb-3"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-lg">✅</span>
                      <div>
                        <p className="text-green-400 font-semibold text-sm">{uploadedFile.name}</p>
                        <p className="text-gray-500 text-xs">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => { setUploadedFile(null); setPreviewUrl(null) }}
                      className="text-xs text-red-400 hover:text-red-300 underline transition-colors">
                      Remove
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={openCamera}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all"
                  style={{ background: `${currentDoc?.color}20`, border: `1px solid ${currentDoc?.color}40`, color: currentDoc?.color }}>
                  📷 Take Photo
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all"
                  style={{ background: 'rgba(0,149,255,0.15)', border: '1px solid rgba(0,149,255,0.3)', color: '#0095FF' }}>
                  📁 Upload File
                </motion.button>
              </div>

              {uploadedFile && (
                <motion.button whileTap={{ scale: 0.98 }} onClick={scanDocument}
                  className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${currentDoc?.color}, ${currentDoc?.color}CC)`,
                    boxShadow: `0 0 30px ${currentDoc?.color}40`,
                  }}>
                  🔍 Scan & Extract Data
                </motion.button>
              )}

              {/* Fields preview */}
              <div className="mt-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Will extract</p>
                <div className="flex flex-wrap gap-2">
                  {currentDoc?.fields.map(f => (
                    <span key={f} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: `${currentDoc.color}15`, color: currentDoc.color, border: `1px solid ${currentDoc.color}30` }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CAMERA ── */}
          {showCamera && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex flex-col">
              <div className="relative flex-1">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {/* Guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-2xl" style={{
                    width: '85%', height: '55%',
                    border: `2px solid ${currentDoc?.color}`,
                    boxShadow: `0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px ${currentDoc?.color}40`,
                  }} />
                </div>
                <div className="absolute top-6 w-full text-center">
                  <p className="text-white font-bold text-sm" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    Align {currentDoc?.label} within the frame
                  </p>
                </div>
              </div>
              <div className="p-4 flex gap-3" style={{ background: 'rgba(10,15,30,0.95)' }}>
                <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false) }}
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-400 border border-gray-700 hover:text-white transition-colors">
                  ✕ Cancel
                </button>
                <button onClick={capturePhoto}
                  className="flex-1 py-3 rounded-xl font-black text-white text-lg transition-all"
                  style={{ background: currentDoc?.color, boxShadow: `0 0 20px ${currentDoc?.color}50` }}>
                  📸 Capture
                </button>
              </div>
            </motion.div>
          )}

          {/* ── SCANNING ── */}
          {stage === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-3xl p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

              {/* Animated scanner */}
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${currentDoc?.color}30` }}>
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 opacity-80"
                    style={{ background: `linear-gradient(90deg, transparent, ${currentDoc?.color}, transparent)` }}
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl">
                  {currentDoc?.icon}
                </div>
                {/* Corner markers */}
                {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-3 h-3 rounded-sm`}
                    style={{ border: `2px solid ${currentDoc?.color}`, borderRadius: '3px' }} />
                ))}
              </div>

              <h2 className="text-xl font-black text-white mb-2">Reading {currentDoc?.label}...</h2>
              <p className="text-gray-500 text-sm mb-8">AI is extracting your information</p>

              <div className="flex justify-center gap-6">
                {['OCR Scan', 'AI Extract', 'Validate'].map((s, i) => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: `${currentDoc?.color}15`, border: `2px solid ${currentDoc?.color}40` }}>
                      <motion.div className="w-3 h-3 rounded-full"
                        style={{ background: currentDoc?.color }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.33 }} />
                    </div>
                    <span className="text-xs text-gray-500">{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {stage === 'review' && extractedData && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Confidence banner */}
              <div className="flex items-center gap-3 p-4 rounded-2xl mb-5"
                style={{ background: 'rgba(0,214,143,0.1)', border: '1px solid rgba(0,214,143,0.3)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(0,214,143,0.2)' }}>✅</div>
                <div className="flex-1">
                  <p className="font-bold text-green-400 text-sm">Extraction Complete</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {Object.keys(extractedData).filter(k => extractedData[k]).length} fields extracted • {confidence}% confidence
                  </p>
                </div>
                {/* Confidence ring */}
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#00D68F" strokeWidth="4"
                      strokeDasharray={`${(confidence / 100) * 125.6} 125.6`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-400">
                    {confidence}%
                  </span>
                </div>
              </div>

              {/* Extracted fields */}
              <div className="rounded-3xl overflow-hidden mb-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-5 py-3 flex items-center gap-2"
                  style={{ background: `${currentDoc?.color}15`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xl">{currentDoc?.icon}</span>
                  <h3 className="font-black text-white">{currentDoc?.label}</h3>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${currentDoc?.color}20`, color: currentDoc?.color }}>
                    Extracted
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {Object.entries(extractedData).map(([key, value]) => {
                    if (!value) return null
                    return (
                      <motion.div key={key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(0,214,143,0.06)', border: '1px solid rgba(0,214,143,0.15)' }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#00D68F' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">
                            {FIELD_LABELS[key] || key}
                          </p>
                          <p className="text-white font-semibold text-sm break-words">{String(value)}</p>
                        </div>
                        <span className="text-green-400 text-xs flex-shrink-0">✓</span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { setStage('upload'); setUploadedFile(null); setPreviewUrl(null); setExtractedData(null) }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                  ← Re-scan
                </button>
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    localStorage.setItem('schemeai_ocr_data', JSON.stringify(extractedData))
                    setStage('done')
                  }}
                  className="flex-2 flex-1 py-3 rounded-xl font-black text-white text-sm transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${currentDoc?.color}, ${currentDoc?.color}CC)`,
                    boxShadow: `0 0 20px ${currentDoc?.color}40`,
                  }}>
                  Use This Data →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── DONE ── */}
          {stage === 'done' && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-10 text-center"
              style={{ background: 'rgba(0,214,143,0.08)', border: '1px solid rgba(0,214,143,0.3)' }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-4">
                🎉
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-2">Data Extracted!</h2>
              <p className="text-gray-400 text-sm mb-8">
                Your {currentDoc?.label} details are saved and ready to pre-fill application forms.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/elderly')}
                  className="px-6 py-3 rounded-full font-black text-white transition-all"
                  style={{ background: '#FF6B00', boxShadow: '0 0 20px rgba(255,107,0,0.4)' }}>
                  🎙️ Find Schemes
                </motion.button>
                <button onClick={() => { setStage('upload'); setUploadedFile(null); setPreviewUrl(null); setExtractedData(null) }}
                  className="px-6 py-3 rounded-full font-semibold text-gray-400 hover:text-white border border-gray-700 transition-all">
                  Scan Another
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 p-4 rounded-2xl text-center text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
            ⚠️ {error}
            <button onClick={() => setError('')} className="ml-3 underline opacity-70">Dismiss</button>
          </motion.div>
        )}

        {/* Security note */}
        <p className="text-center text-xs text-gray-600 mt-6">
          🔒 Documents processed securely — never stored on our servers
        </p>
      </div>

      {/* Tricolor bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-1 flex z-50">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white opacity-60" />
        <div className="flex-1 bg-green-600" />
      </div>
    </div>
  )
}