// frontend/src/services/voice.js  (NEW)
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Tap once to start; it stops by itself after ~1.6s of silence (or maxMs).
export async function startRecording({ onLevel, onAutoStop, silenceMs = 1600, maxMs = 15000 } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => window.MediaRecorder?.isTypeSupported(m))
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  const chunks = []
  mr.ondataavailable = (e) => e.data.size && chunks.push(e.data)

  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 512
  ctx.createMediaStreamSource(stream).connect(analyser)
  const buf = new Uint8Array(analyser.fftSize)

  let heard = false, lastLoud = Date.now(), stopped = false, autoFired = false
  const t0 = Date.now()
  const tick = setInterval(() => {
    analyser.getByteTimeDomainData(buf)
    let peak = 0
    for (const v of buf) peak = Math.max(peak, Math.abs(v - 128))
    const level = peak / 128
    onLevel?.(level)                       // drive a pulsing mic animation with this
    if (level > 0.06) { heard = true; lastLoud = Date.now() }
    const silentLong = heard && Date.now() - lastLoud > silenceMs
    if (!stopped && !autoFired && (silentLong || Date.now() - t0 > maxMs)) { autoFired = true; onAutoStop?.() }
  }, 100)

  const stop = () => new Promise((resolve) => {
    if (stopped) return resolve(null)
    stopped = true
    clearInterval(tick)
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      ctx.close()
      resolve({ blob: new Blob(chunks, { type: mr.mimeType || 'audio/webm' }), heardSpeech: heard })
    }
    mr.state !== 'inactive' ? mr.stop() : mr.onstop()
  })

  mr.start()
  return { stop }
}

export async function transcribe(blob, lang) {
  const fd = new FormData()
  fd.append('audio', blob, 'speech.webm')
  fd.append('lang', lang)                  // "Tamil" or "ta" both work
  const r = await fetch(`${API}/api/stt`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error('stt_failed')
  return r.json()                          // { text, confidence }
}

export async function sendVoiceChat({ message, sessionId, language, confirmed = false }) {
  const r = await fetch(`${API}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, language, mode: 'voice', confirmed }),
  })
  if (!r.ok) throw new Error('chat_failed')
  // { reply, speech, schemes, understood, confidence, needsConfirmation, sessionId, ... }
  return r.json()
}