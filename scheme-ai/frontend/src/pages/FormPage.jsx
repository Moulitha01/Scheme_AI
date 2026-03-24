// src/pages/FormPage.jsx
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = 'http://localhost:5000'

const STAGE = {
  UPLOAD: 'upload',
  CAMERA: 'camera',
  EXTRACTING: 'extracting',
  FORM: 'form',
  PDF: 'pdf',
}

const CASTE_OPTIONS = ['General', 'OBC', 'SC', 'ST']
const GENDER_OPTIONS = ['Male', 'Female', 'Other']
const STATE_OPTIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry',
]

const FORM_FIELDS = [
  { key: 'name',       label: 'Full Name',           icon: '👤', type: 'text',     required: true },
  { key: 'dob',        label: 'Date of Birth',        icon: '🎂', type: 'text',     placeholder: 'DD/MM/YYYY' },
  { key: 'age',        label: 'Age',                  icon: '🔢', type: 'number' },
  { key: 'gender',     label: 'Gender',               icon: '⚧',  type: 'select',   options: GENDER_OPTIONS },
  { key: 'aadhaar',    label: 'Aadhaar Number',       icon: '🪪', type: 'text',     placeholder: 'XXXX XXXX XXXX' },
  { key: 'mobile',     label: 'Mobile Number',        icon: '📱', type: 'tel' },
  { key: 'caste',      label: 'Caste Category',       icon: '📋', type: 'select',   options: CASTE_OPTIONS },
  { key: 'occupation', label: 'Occupation',           icon: '💼', type: 'text' },
  { key: 'income',     label: 'Annual Income (₹)',    icon: '💰', type: 'number' },
  { key: 'state',      label: 'State',                icon: '📍', type: 'select',   options: STATE_OPTIONS },
  { key: 'district',   label: 'District',             icon: '🏘️', type: 'text' },
  { key: 'pincode',    label: 'Pincode',              icon: '📮', type: 'text' },
  { key: 'address',    label: 'Full Address',         icon: '🏠', type: 'textarea' },
]

export default function FormPage({ scheme = null, prefillData = {}, onBack }) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [stage, setStage] = useState(STAGE.UPLOAD)
  const [formData, setFormData] = useState(prefillData || {})
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [filledFields, setFilledFields] = useState([])
  const [error, setError] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)

  // ── Open device camera (live preview) ──────────────────────
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      setStage(STAGE.CAMERA)
      setCameraActive(true)
      // Give DOM time to render video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch (err) {
      setError('Camera not available. Please use file upload instead.')
    }
  }

  // ── Capture photo from camera ──────────────────────────────
  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      const file = new File([blob], 'aadhaar_capture.jpg', { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      setUploadedFile(file)
      setPreviewUrl(url)
      stopCamera()
      setStage(STAGE.UPLOAD)
    }, 'image/jpeg', 0.92)
  }, [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  // ── Handle file input ──────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return
    setUploadedFile(file)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
    setError('')
  }

  // ── Send to OCR backend ────────────────────────────────────
  const extractFromDocument = async () => {
    if (!uploadedFile) return
    setStage(STAGE.EXTRACTING)
    setError('')

    try {
      const payload = new FormData()
      payload.append('document', uploadedFile)
      payload.append('docType', 'aadhaar')

      const res = await fetch(`${API_BASE}/api/ocr/extract`, {
        method: 'POST',
        body: payload,
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'OCR failed')

      const extracted = data.fields || {}
      const merged = { ...formData }
      const newlyFilled = []

      for (const [key, value] of Object.entries(extracted)) {
        if (value && value !== '') {
          merged[key] = value
          newlyFilled.push(key)
        }
      }

      setFormData(merged)
      setConfidence(data.confidence || 0)
      setFilledFields(newlyFilled)
      setStage(STAGE.FORM)

    } catch (err) {
      setError(`OCR failed: ${err.message}`)
      setStage(STAGE.UPLOAD)
    }
  }

  // ── Generate PDF ───────────────────────────────────────────
  const downloadPDF = async () => {
    setGeneratingPdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Orange header
      doc.setFillColor(234, 88, 12)
      doc.rect(0, 0, 210, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Scheme-AI — Application Form', 14, 16)
      if (scheme?.name) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Scheme: ${scheme.name}`, 14, 26)
      }
      doc.setFontSize(9)
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 160, 26)

      let y = 48

      // Section header
      doc.setFillColor(255, 247, 237)
      doc.rect(10, y - 6, 190, 9, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(234, 88, 12)
      doc.text('Personal Information', 14, y)
      y += 12

      doc.setFontSize(10)
      let col = 0

      for (const field of FORM_FIELDS) {
        const value = formData[field.key]
        if (!value) continue

        const x = col === 0 ? 14 : 110
        const isFilled = filledFields.includes(field.key)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.text(field.label.toUpperCase(), x, y)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(isFilled ? 22 : 30, isFilled ? 163 : 30, isFilled ? 74 : 30)
        doc.text(String(value).slice(0, 38), x, y + 5)

        doc.setDrawColor(210, 210, 210)
        doc.line(x, y + 7, x + 85, y + 7)

        col++
        if (col === 2) { col = 0; y += 18 }
        if (y > 265) { doc.addPage(); y = 20 }
      }

      // Scheme section
      if (scheme) {
        y += col === 1 ? 20 : 8
        doc.setFillColor(240, 253, 244)
        doc.rect(10, y - 6, 190, 9, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(22, 163, 74)
        doc.text('Scheme Details', 14, y)
        y += 12

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(30, 30, 30)
        if (scheme.name)     { doc.text(`Scheme: ${scheme.name}`, 14, y);       y += 7 }
        if (scheme.ministry) { doc.text(`Ministry: ${scheme.ministry}`, 14, y); y += 7 }
        if (scheme.benefit)  { doc.text(`Benefit: ${scheme.benefit}`, 14, y);   y += 7 }
        if (scheme.applyLink){ doc.text(`Portal: ${scheme.applyLink}`, 14, y);  y += 7 }
      }

      // Footnote
      y += 10
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      doc.text(
        `* Green fields auto-extracted from Aadhaar (${confidence}% confidence). Please verify before submitting.`,
        14, y, { maxWidth: 182 }
      )

      // Footer
      doc.setFillColor(234, 88, 12)
      doc.rect(0, 285, 210, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Generated by Scheme-AI | Government Scheme Assistant', 14, 292)
      doc.text(new Date().toLocaleString('en-IN'), 155, 292)

      doc.save(scheme?.name
        ? `${scheme.name.replace(/\s+/g, '_').slice(0, 30)}_application.pdf`
        : 'scheme_application.pdf'
      )

      setStage(STAGE.PDF)

    } catch (err) {
      setError(`PDF failed: ${err.message}`)
    } finally {
      setGeneratingPdf(false)
    }
  }

  const updateField = (key, value) => setFormData(p => ({ ...p, [key]: value }))

  // ── PROGRESS BAR ───────────────────────────────────────────
  const STEPS = [
    { s: STAGE.UPLOAD,     icon: '📄', label: 'Upload' },
    { s: STAGE.EXTRACTING, icon: '🔍', label: 'Scanning' },
    { s: STAGE.FORM,       icon: '✍️', label: 'Fill Form' },
    { s: STAGE.PDF,        icon: '📥', label: 'Download' },
  ]
  const stageOrder = [STAGE.UPLOAD, STAGE.EXTRACTING, STAGE.FORM, STAGE.PDF]
  const currentIdx = stageOrder.indexOf(stage === STAGE.CAMERA ? STAGE.UPLOAD : stage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">

      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b border-orange-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 font-semibold text-sm">
          ← Back
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-bold text-gray-800">📝 Apply for Scheme</h1>
          {scheme && <p className="text-xs text-orange-600 truncate">{scheme.name}</p>}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">

        {/* Progress */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map(({ s, icon, label }, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                  ${i === currentIdx ? 'bg-orange-500 text-white shadow-lg scale-110'
                    : i < currentIdx ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400'}`}>
                  {i < currentIdx ? '✓' : icon}
                </div>
                <span className={`text-xs font-medium ${i === currentIdx ? 'text-orange-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mb-4 transition-all ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── UPLOAD STAGE ── */}
          {(stage === STAGE.UPLOAD) && (
            <motion.div key="upload"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* Already captured preview */}
              {uploadedFile && previewUrl && (
                <div className="bg-white rounded-2xl shadow border border-green-200 p-4 mb-4">
                  <img src={previewUrl} alt="Document"
                    className="w-full max-h-52 object-contain rounded-xl mb-3" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-700 text-sm">✅ {uploadedFile.name}</p>
                      <p className="text-gray-400 text-xs">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={() => { setUploadedFile(null); setPreviewUrl(null) }}
                      className="text-xs text-red-500 underline">Remove</button>
                  </div>
                </div>
              )}

              {/* Upload options */}
              {!uploadedFile && (
                <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8">
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">🪪</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Upload Aadhaar Card</h2>
                    <p className="text-gray-500 text-sm">
                      We'll extract your details automatically
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Camera button */}
                    <button onClick={openCamera}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-400 transition-all group">
                      <span className="text-4xl group-hover:scale-110 transition-transform">📷</span>
                      <div className="text-center">
                        <p className="font-bold text-gray-800 text-sm">Take Photo</p>
                        <p className="text-gray-500 text-xs mt-0.5">Use camera</p>
                      </div>
                    </button>

                    {/* File upload button */}
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all group">
                      <span className="text-4xl group-hover:scale-110 transition-transform">📁</span>
                      <div className="text-center">
                        <p className="font-bold text-gray-800 text-sm">Upload File</p>
                        <p className="text-gray-500 text-xs mt-0.5">JPG, PNG, PDF</p>
                      </div>
                    </button>
                  </div>

                  {/* Also allow mobile camera directly */}
                  <input ref={cameraInputRef} type="file" accept="image/*"
                    capture="environment" className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])} />
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf"
                    className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

                  <p className="text-center text-xs text-gray-400">
                    🔒 Your document is processed securely and not stored
                  </p>
                </div>
              )}

              {/* Scan button — shown after file selected */}
              {uploadedFile && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  onClick={extractFromDocument}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-all mt-2"
                >
                  🔍 Scan & Extract Details
                </motion.button>
              )}

              {/* Skip OCR — fill manually */}
              <button onClick={() => setStage(STAGE.FORM)}
                className="w-full mt-3 py-3 text-gray-500 text-sm underline hover:text-gray-700">
                Skip — Fill form manually
              </button>
            </motion.div>
          )}

          {/* ── CAMERA STAGE ── */}
          {stage === STAGE.CAMERA && (
            <motion.div key="camera"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-black rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline muted
                  className="w-full rounded-t-3xl" style={{ maxHeight: '60vh' }} />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/70 rounded-xl"
                    style={{ width: '80%', height: '55%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
                </div>
                <p className="absolute top-3 left-0 right-0 text-center text-white text-sm font-medium">
                  Align Aadhaar card within the frame
                </p>
              </div>

              <div className="p-4 bg-gray-900 flex gap-3">
                <button onClick={() => { stopCamera(); setStage(STAGE.UPLOAD) }}
                  className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-xl font-semibold">
                  ✕ Cancel
                </button>
                <button onClick={capturePhoto}
                  className="flex-2 flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-all">
                  📸 Capture
                </button>
              </div>
            </motion.div>
          )}

          {/* ── EXTRACTING STAGE ── */}
          {stage === STAGE.EXTRACTING && (
            <motion.div key="extracting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white rounded-3xl shadow-lg border border-orange-100 p-12 text-center"
            >
              <div className="text-6xl mb-6 animate-bounce">🔍</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Reading your Aadhaar...</h2>
              <p className="text-gray-500 text-sm mb-8">
                Using AI to extract your personal details
              </p>
              <div className="flex justify-center gap-6">
                {['OCR Scan', 'AI Extract', 'Pre-filling'].map((step, i) => (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-orange-500 animate-ping"
                        style={{ animationDelay: `${i * 0.35}s` }} />
                    </div>
                    <span className="text-xs text-gray-500">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── FORM STAGE ── */}
          {stage === STAGE.FORM && (
            <motion.div key="form"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {filledFields.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-green-700 text-sm">
                      {filledFields.length} fields extracted ({confidence}% confidence)
                    </p>
                    <p className="text-green-600 text-xs mt-0.5">
                      Green fields were auto-filled from your Aadhaar. Please verify.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden">
                <div className="bg-orange-500 px-6 py-4">
                  <h2 className="text-white font-bold text-lg">Personal Details</h2>
                  <p className="text-orange-100 text-sm">Review and fill any missing fields</p>
                </div>

                <div className="p-5 space-y-4">
                  {FORM_FIELDS.map(({ key, label, icon, type, options, placeholder, required }) => {
                    const isAutoFilled = filledFields.includes(key)
                    const value = formData[key] || ''
                    return (
                      <div key={key}>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                          <span>{icon}</span>
                          <span>{label}</span>
                          {required && <span className="text-red-400 text-xs">*</span>}
                          {isAutoFilled && (
                            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ Auto-filled
                            </span>
                          )}
                        </label>

                        {type === 'select' ? (
                          <select value={value} onChange={(e) => updateField(key, e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-orange-300
                              ${isAutoFilled && value ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}>
                            <option value="">Select {label}</option>
                            {options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : type === 'textarea' ? (
                          <textarea value={value} onChange={(e) => updateField(key, e.target.value)}
                            placeholder={placeholder || `Enter ${label}`} rows={3}
                            className={`w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none
                              ${isAutoFilled && value ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`} />
                        ) : (
                          <input type={type} value={value} onChange={(e) => updateField(key, e.target.value)}
                            placeholder={placeholder || `Enter ${label}`}
                            className={`w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-orange-300
                              ${isAutoFilled && value ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="px-5 pb-5 flex gap-3">
                  <button onClick={() => setStage(STAGE.UPLOAD)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                    ← Re-upload
                  </button>
                  <button onClick={downloadPDF} disabled={generatingPdf}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl font-bold transition-all">
                    {generatingPdf ? '⏳ Generating...' : '📥 Download PDF'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PDF SUCCESS ── */}
          {stage === STAGE.PDF && (
            <motion.div key="pdf"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-xl border border-green-200 p-10 text-center"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">PDF Downloaded!</h2>
              <p className="text-gray-500 text-sm mb-2">Your pre-filled application is ready.</p>

              {scheme?.applyLink && (
                <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left">
                  <p className="font-bold text-green-800 text-sm">{scheme.name}</p>
                  <a href={scheme.applyLink} target="_blank" rel="noreferrer"
                    className="text-blue-600 underline text-sm mt-1 block">
                    🔗 Submit at official portal →
                  </a>
                </div>
              )}

              <p className="text-xs text-gray-400 mb-6">
                Take the printed form to your nearest government office or submit online.
              </p>

              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={downloadPDF}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold transition-all">
                  📥 Download Again
                </button>
                <button onClick={onBack}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-all">
                  ← Back to Schemes
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm text-center">
            ⚠️ {error}
            <button onClick={() => setError('')} className="ml-3 underline">Dismiss</button>
          </motion.div>
        )}

      </div>
    </div>
  )
}