import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = 'http://localhost:5000'

/* ─── All languages with full translations ───────────────── */
const LANGS = [
  {
    code: 'hi-IN', short: 'hi', label: 'हिन्दी', api: 'Hindi',
    greeting: 'नमस्ते! मैं Scheme AI हूँ। माइक्रोफ़ोन दबाएं और अपना नाम, उम्र, गाँव और पेशा बताएं।',
    listening: 'मैं सुन रहा हूँ... बोलते रहें...',
    pressSpeak: 'बोलने के लिए दबाएँ',
    findSchemes: 'योजनाएँ खोजें',
    namaste: 'नमस्ते!',
    namasteDesc: 'माइक्रोफ़ोन दबाएं और अपने बारे में बताएं',
    youSaid: 'आपने कहा:',
    searching: 'योजनाएँ खोज रहे हैं...',
    searchingDesc: 'सरकारी डेटाबेस में खोज रहे हैं',
    schemeFound: n => `आपके लिए ${n} योजना${n > 1 ? 'एँ' : ''} मिली हैं।`,
    newSearch: 'नई खोज',
    needHelper: 'क्या आपको मदद चाहिए?',
    helperDesc: 'किसी परिवार के सदस्य या ग्राम पंचायत अधिकारी को फ़ोन दें',
    howToApply: 'कैसे आवेदन करें',
    applyNow: 'अभी आवेदन करें',
    back: 'वापस',
    connError: 'कनेक्शन त्रुटि। सुनिश्चित करें कि बैकएंड पोर्ट 5000 पर चल रहा है।',
    langChanged: 'भाषा बदल गई',
    tryExample: 'उदाहरण: "मेरा नाम राम है, उम्र 60, महाराष्ट्र, किसान"',
  },
  {
    code: 'ta-IN', short: 'ta', label: 'தமிழ்', api: 'Tamil',
    greeting: 'வணக்கம்! நான் Scheme AI. மைக்ரோஃபோன் அழுத்தி உங்கள் பெயர், வயது, ஊர், தொழில் சொல்லுங்கள்.',
    listening: 'கேட்கிறேன்... தொடர்ந்து பேசுங்கள்...',
    pressSpeak: 'பேச அழுத்துங்கள்',
    findSchemes: 'திட்டங்கள் தேடு',
    namaste: 'வணக்கம்!',
    namasteDesc: 'மைக்ரோஃபோன் அழுத்தி உங்களைப் பற்றி சொல்லுங்கள்',
    youSaid: 'நீங்கள் சொன்னது:',
    searching: 'திட்டங்கள் தேடுகிறோம்...',
    searchingDesc: 'அரசு தரவுத்தளங்களில் தேடுகிறோம்',
    schemeFound: n => `உங்களுக்கு ${n} திட்டம் கண்டறியப்பட்டது.`,
    newSearch: 'புதிய தேடல்',
    needHelper: 'உதவி தேவையா?',
    helperDesc: 'குடும்பத்தினர் அல்லது கிராம பஞ்சாயத்து அதிகாரியிடம் கொடுங்கள்',
    howToApply: 'எப்படி விண்ணப்பிக்கலாம்',
    applyNow: 'இப்போது விண்ணப்பிக்கவும்',
    back: 'பின்செல்',
    connError: 'இணைப்பு பிழை. பின்-இறுதி போர்ட் 5000 இல் இயங்குகிறதா என்று சரிபார்க்கவும்.',
    langChanged: 'மொழி மாற்றப்பட்டது',
    tryExample: 'எடுத்துக்காட்டு: "என் பெயர் முருகன், வயது 65, தமிழ்நாடு, விவசாயி"',
  },
  {
    code: 'te-IN', short: 'te', label: 'తెలుగు', api: 'Telugu',
    greeting: 'నమస్కారం! నేను Scheme AI. మైక్రోఫోన్ నొక్కి మీ పేరు, వయస్సు, గ్రామం, వృత్తి చెప్పండి.',
    listening: 'వింటున్నాను... మాట్లాడుతూ ఉండండి...',
    pressSpeak: 'మాట్లాడటానికి నొక్కండి',
    findSchemes: 'పథకాలు వెతకండి',
    namaste: 'నమస్కారం!',
    namasteDesc: 'మైక్రోఫోన్ నొక్కి మీ గురించి చెప్పండి',
    youSaid: 'మీరు చెప్పింది:',
    searching: 'పథకాలు వెతుకుతున్నాం...',
    searchingDesc: 'ప్రభుత్వ డేటాబేస్లలో వెతుకుతున్నాం',
    schemeFound: n => `మీకు ${n} పథకాలు దొరికాయి.`,
    newSearch: 'కొత్త శోధన',
    needHelper: 'సహాయం కావాలా?',
    helperDesc: 'కుటుంబ సభ్యుడికి లేదా గ్రామ పంచాయతీ అధికారికి ఫోన్ ఇవ్వండి',
    howToApply: 'ఎలా దరఖాస్తు చేయాలి',
    applyNow: 'ఇప్పుడు దరఖాస్తు చేయండి',
    back: 'వెనక్కి',
    connError: 'కనెక్షన్ లోపం. బ్యాక్‌ఎండ్ పోర్ట్ 5000 లో నడుస్తుందో చూడండి.',
    langChanged: 'భాష మార్చబడింది',
    tryExample: 'ఉదా: "నా పేరు రాముడు, వయస్సు 60, ఆంధ్రప్రదేశ్, రైతు"',
  },
  {
    code: 'kn-IN', short: 'kn', label: 'ಕನ್ನಡ', api: 'Kannada',
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು Scheme AI. ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ ಹೆಸರು, ವಯಸ್ಸು, ಊರು, ವೃತ್ತಿ ಹೇಳಿ.',
    listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ...',
    pressSpeak: 'ಮಾತನಾಡಲು ಒತ್ತಿ',
    findSchemes: 'ಯೋಜನೆಗಳು ಹುಡುಕಿ',
    namaste: 'ನಮಸ್ಕಾರ!',
    namasteDesc: 'ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ ನಿಮ್ಮ ಬಗ್ಗೆ ಹೇಳಿ',
    youSaid: 'ನೀವು ಹೇಳಿದ್ದು:',
    searching: 'ಯೋಜನೆಗಳು ಹುಡುಕುತ್ತಿದ್ದೇವೆ...',
    searchingDesc: 'ಸರ್ಕಾರಿ ಡೇಟಾಬೇಸ್‌ಗಳಲ್ಲಿ ಹುಡುಕುತ್ತಿದ್ದೇವೆ',
    schemeFound: n => `ನಿಮಗೆ ${n} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.`,
    newSearch: 'ಹೊಸ ಹುಡುಕಾಟ',
    needHelper: 'ಸಹಾಯ ಬೇಕೇ?',
    helperDesc: 'ಕುಟುಂಬ ಸದಸ್ಯರಿಗೆ ಅಥವಾ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಗೆ ಫೋನ್ ಕೊಡಿ',
    howToApply: 'ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು',
    applyNow: 'ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
    back: 'ಹಿಂದೆ',
    connError: 'ಸಂಪರ್ಕ ದೋಷ. ಬ್ಯಾಕ್‌ಎಂಡ್ ಪೋರ್ಟ್ 5000 ರಲ್ಲಿ ಚಲಿಸುತ್ತಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.',
    langChanged: 'ಭಾಷೆ ಬದಲಾಗಿದೆ',
    tryExample: 'ಉದಾ: "ನನ್ನ ಹೆಸರು ರಾಮು, ವಯಸ್ಸು 60, ಕರ್ನಾಟಕ, ರೈತ"',
  },
  {
    code: 'bn-IN', short: 'bn', label: 'বাংলা', api: 'Bengali',
    greeting: 'নমস্কার! আমি Scheme AI। মাইক্রোফোন চাপুন এবং নাম, বয়স, গ্রাম, পেশা বলুন।',
    listening: 'শুনছি... বলতে থাকুন...',
    pressSpeak: 'বলতে চাপুন',
    findSchemes: 'প্রকল্প খুঁজুন',
    namaste: 'নমস্কার!',
    namasteDesc: 'মাইক্রোফোন চাপুন এবং নিজের সম্পর্কে বলুন',
    youSaid: 'আপনি বলেছেন:',
    searching: 'প্রকল্প খুঁজছি...',
    searchingDesc: 'সরকারি ডেটাবেসে খুঁজছি',
    schemeFound: n => `আপনার জন্য ${n}টি প্রকল্প পাওয়া গেছে।`,
    newSearch: 'নতুন অনুসন্ধান',
    needHelper: 'সাহায্য দরকার?',
    helperDesc: 'পরিবারের সদস্য বা গ্রাম পঞ্চায়েত কর্মকর্তাকে ফোন দিন',
    howToApply: 'কীভাবে আবেদন করবেন',
    applyNow: 'এখন আবেদন করুন',
    back: 'ফিরে যান',
    connError: 'সংযোগ ত্রুটি। ব্যাকএন্ড পোর্ট 5000 এ চলছে কিনা নিশ্চিত করুন।',
    langChanged: 'ভাষা পরিবর্তন হয়েছে',
    tryExample: 'উদাহরণ: "আমার নাম রাম, বয়স ৬০, পশ্চিমবঙ্গ, কৃষক"',
  },
  {
    code: 'mr-IN', short: 'mr', label: 'मराठी', api: 'Marathi',
    greeting: 'नमस्कार! मी Scheme AI. मायक्रोफोन दाबा आणि नाव, वय, गाव, व्यवसाय सांगा.',
    listening: 'ऐकत आहे... बोलत राहा...',
    pressSpeak: 'बोलण्यासाठी दाबा',
    findSchemes: 'योजना शोधा',
    namaste: 'नमस्कार!',
    namasteDesc: 'मायक्रोफोन दाबा आणि स्वतःबद्दल सांगा',
    youSaid: 'तुम्ही म्हणालात:',
    searching: 'योजना शोधत आहे...',
    searchingDesc: 'सरकारी डेटाबेसमध्ये शोधत आहे',
    schemeFound: n => `तुमच्यासाठी ${n} योजना सापडल्या.`,
    newSearch: 'नवीन शोध',
    needHelper: 'मदत हवी आहे का?',
    helperDesc: 'कुटुंबातील सदस्य किंवा ग्राम पंचायत अधिकाऱ्याला फोन द्या',
    howToApply: 'अर्ज कसा करावा',
    applyNow: 'आता अर्ज करा',
    back: 'मागे',
    connError: 'कनेक्शन त्रुटी. बॅकएंड पोर्ट 5000 वर चालत आहे का ते तपासा.',
    langChanged: 'भाषा बदलली',
    tryExample: 'उदा: "माझे नाव राम, वय 60, महाराष्ट्र, शेतकरी"',
  },
  {
    code: 'gu-IN', short: 'gu', label: 'ગુજરાતી', api: 'Gujarati',
    greeting: 'નમસ્તે! હું Scheme AI. માઇક્રોફોન દબાવો અને નામ, ઉંમર, ગામ, વ્યવસાય કહો.',
    listening: 'સાંભળી રહ્યો છું... બોલતા રહો...',
    pressSpeak: 'બોલવા માટે દબાવો',
    findSchemes: 'યોજનાઓ શોધો',
    namaste: 'નમસ્તે!',
    namasteDesc: 'માઇક્રોફોન દબાવો અને તમારા વિશે જણાવો',
    youSaid: 'તમે કહ્યું:',
    searching: 'યોજનાઓ શોધી રહ્યા છીએ...',
    searchingDesc: 'સરકારી ડેટાબેઝમાં શોધી રહ્યા છીએ',
    schemeFound: n => `તમારા માટે ${n} યોજના મળી.`,
    newSearch: 'નવી શોધ',
    needHelper: 'મદદ જોઈએ છે?',
    helperDesc: 'પરિવારના સભ્ય અથવા ગ્રામ પંચાયત અધિકારીને ફોન આપો',
    howToApply: 'કેવી રીતે અરજી કરવી',
    applyNow: 'હવે અરજી કરો',
    back: 'પાછળ',
    connError: 'કનેક્શન ભૂલ. બેકએન્ડ પોર્ટ 5000 પર ચાલી રહ્યું છે કે નહીં તે તપાસો.',
    langChanged: 'ભાષા બદલાઈ',
    tryExample: 'ઉદા: "મારું નામ રામ, ઉંમર 60, ગુજરાત, ખેડૂત"',
  },
  {
    code: 'ml-IN', short: 'ml', label: 'മലയാളം', api: 'Malayalam',
    greeting: 'നമസ്കാരം! ഞാൻ Scheme AI. മൈക്രോഫോൺ അമർത്തി നിങ്ങളുടെ പേര്, പ്രായം, ഗ്രാമം, തൊഴിൽ പറയൂ.',
    listening: 'കേൾക്കുന്നു... തുടർന്ന് സംസാരിക്കൂ...',
    pressSpeak: 'സംസാരിക്കാൻ അമർത്തൂ',
    findSchemes: 'പദ്ധതികൾ തിരയൂ',
    namaste: 'നമസ്കാരം!',
    namasteDesc: 'മൈക്രോഫോൺ അമർത്തി നിങ്ങളെക്കുറിച്ച് പറയൂ',
    youSaid: 'നിങ്ങൾ പറഞ്ഞത്:',
    searching: 'പദ്ധതികൾ തിരയുന്നു...',
    searchingDesc: 'സർക്കാർ ഡേറ്റാബേസുകളിൽ തിരയുന്നു',
    schemeFound: n => `നിങ്ങൾക്ക് ${n} പദ്ധതികൾ കണ്ടെത്തി.`,
    newSearch: 'പുതിയ തിരയൽ',
    needHelper: 'സഹായം വേണോ?',
    helperDesc: 'കുടുംബാംഗത്തിന് അല്ലെങ്കിൽ ഗ്രാമ പഞ്ചായത്ത് ഉദ്യോഗസ്ഥന് ഫോൺ കൊടുക്കൂ',
    howToApply: 'എങ്ങനെ അപേക്ഷിക്കാം',
    applyNow: 'ഇപ്പോൾ അപേക്ഷിക്കൂ',
    back: 'തിരികെ',
    connError: 'കണക്ഷൻ പിശക്. ബാക്കെൻഡ് പോർട്ട് 5000 ൽ പ്രവർത്തിക്കുന്നുണ്ടോ എന്ന് പരിശോധിക്കൂ.',
    langChanged: 'ഭാഷ മാറ്റി',
    tryExample: 'ഉദാ: "എന്റെ പേര് രാമൻ, പ്രായം 60, കേരളം, കർഷകൻ"',
  },
  {
    code: 'en-IN', short: 'en', label: 'English', api: 'English',
    greeting: 'Hello! I am Scheme AI. Press the microphone and tell me your name, age, village and occupation.',
    listening: 'Listening... keep speaking...',
    pressSpeak: 'Press to Speak',
    findSchemes: 'Find My Schemes',
    namaste: 'Hello!',
    namasteDesc: 'Press the microphone and tell me about yourself',
    youSaid: 'You said:',
    searching: 'Finding your schemes...',
    searchingDesc: 'Searching through government databases',
    schemeFound: n => `I found ${n} scheme${n > 1 ? 's' : ''} for you.`,
    newSearch: 'New Search',
    needHelper: 'Need a helper?',
    helperDesc: 'Give your phone to a family member or Gram Panchayat officer',
    howToApply: 'How to Apply',
    applyNow: 'Apply Now',
    back: 'Back',
    connError: 'Connection error. Make sure backend is running on port 5000.',
    langChanged: 'Language changed',
    tryExample: 'Example: "My name is Ram, age 60, Maharashtra, farmer"',
  },
]

/* ─── Get language from localStorage (set by IntroPage) ────── */
function getSavedLang() {
  const short = localStorage.getItem('schemeai_lang')
  const found = LANGS.find(l => l.short === short)
  return found || LANGS[0]
}

/* ─── Speech helper ──────────────────────────────────────── */
function speak(text, langCode, rate = 0.9) {
  if (!('speechSynthesis' in window)) return

  const synth = window.speechSynthesis
  synth.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = langCode
  utter.rate = rate
  utter.pitch = 1

  // 🔥 Get available voices
  const voices = synth.getVoices()

  // 🎯 Try to pick best matching Indian voice
  let selectedVoice =
    voices.find(v => v.lang === langCode) ||                 // exact match
    voices.find(v => v.lang.startsWith(langCode.split('-')[0])) || // hi, ta, etc.
    voices.find(v => v.name.toLowerCase().includes('india')) ||    // fallback
    voices[0]

  if (selectedVoice) {
    utter.voice = selectedVoice
  }

  synth.speak(utter)
}

/* ─── Category styles ────────────────────────────────────── */
const CAT = {
  Agriculture:     { icon: '🌾', border: 'border-green-500/40',  badge: 'bg-green-900/40 text-green-400' },
  Health:          { icon: '🏥', border: 'border-red-500/40',    badge: 'bg-red-900/40 text-red-400' },
  Education:       { icon: '📚', border: 'border-blue-500/40',   badge: 'bg-blue-900/40 text-blue-400' },
  Housing:         { icon: '🏠', border: 'border-yellow-500/40', badge: 'bg-yellow-900/40 text-yellow-400' },
  Finance:         { icon: '💳', border: 'border-purple-500/40', badge: 'bg-purple-900/40 text-purple-400' },
  Employment:      { icon: '👷', border: 'border-teal-500/40',   badge: 'bg-teal-900/40 text-teal-400' },
  'Women & Child': { icon: '👩', border: 'border-pink-500/40',   badge: 'bg-pink-900/40 text-pink-400' },
  default:         { icon: '📋', border: 'border-saffron/40',    badge: 'bg-saffron/20 text-saffron' },
}

/* ─── Mic Button ─────────────────────────────────────────── */
function MicButton({ listening, onClick }) {
  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.92 }}
      className={`relative w-36 h-36 rounded-full flex items-center justify-center text-6xl mx-auto shadow-2xl border-4 transition-all duration-300 cursor-pointer
        ${listening
          ? 'bg-red-600/30 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.5)]'
          : 'bg-scheme-green/20 border-scheme-green hover:bg-scheme-green/30 shadow-[0_0_40px_rgba(19,136,8,0.35)]'
        }`}
    >
      {listening && <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-40" />}
      {listening ? '⏹️' : '🎙️'}
    </motion.button>
  )
}

/* ─── Scheme Card ────────────────────────────────────────── */
function SchemeCard({ scheme, index, onApply, L }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CAT[scheme.category] || CAT.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className={`bg-navy-card border-2 ${cat.border} rounded-3xl overflow-hidden shadow-xl w-full`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-2xl flex-shrink-0 border border-navy-border">
            {cat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-white text-base leading-tight">{scheme.name}</h3>
              <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                scheme.eligibility >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : scheme.eligibility >= 60 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'bg-saffron/20 text-saffron border border-saffron/40'
              }`}>
                {scheme.eligibility}%
              </span>
            </div>
            <p className="text-xs text-[#8A9BB0] mt-0.5">{scheme.ministry}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 bg-navy rounded-xl px-3 py-2 border border-navy-border">
          <span className="text-lg">💰</span>
          <div>
            <p className="text-[10px] text-[#8A9BB0] uppercase tracking-wide">Benefit</p>
            <p className="text-sm font-bold text-scheme-green-light">{scheme.benefit}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${cat.badge}`}>
            {cat.icon} {scheme.category || 'General'}
          </span>
          {scheme.reason && (
            <span className="text-xs px-3 py-1 rounded-full bg-navy border border-navy-border text-[#8A9BB0] italic">
              {scheme.reason}
            </span>
          )}
        </div>
      </div>

      {/* Expandable how to apply */}
      <div className="border-t border-navy-border">
        <button onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-5 py-3 text-xs text-[#8A9BB0] hover:text-white transition-colors">
          <span className="font-semibold uppercase tracking-wide">{L.howToApply}</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-5 pb-4 space-y-2">
                {[
                  L.short === 'hi' ? 'अपने पात्रता दस्तावेज़ जाँचें' : L.short === 'ta' ? 'தகுதி ஆவணங்களை சரிபார்க்கவும்' : L.short === 'te' ? 'అర్హత పత్రాలు ధృవీకరించండి' : L.short === 'kn' ? 'ಅರ್ಹತೆ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ' : 'Verify your eligibility documents',
                  L.short === 'hi' ? 'नीचे आवेदन पत्र भरें' : L.short === 'ta' ? 'விண்ணப்பப் படிவத்தை நிரப்பவும்' : L.short === 'te' ? 'దరఖాస్తు ఫారం నింపండి' : L.short === 'kn' ? 'ಅರ್ಜಿ ಫಾರ್ಮ್ ತುಂಬಿ' : 'Fill the application form below',
                  L.short === 'hi' ? 'ऑनलाइन या नजदीकी सरकारी कार्यालय में जमा करें' : L.short === 'ta' ? 'ஆன்லைனில் அல்லது அலுவலகத்தில் சமர்ப்பிக்கவும்' : L.short === 'te' ? 'ఆన్‌లైన్ లేదా కార్యాలయంలో సమర్పించండి' : L.short === 'kn' ? 'ಆನ್‌ಲೈನ್ ಅಥವಾ ಕಚೇರಿಯಲ್ಲಿ ಸಲ್ಲಿಸಿ' : 'Submit online or at nearest govt office',
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#8A9BB0]">
                    <span className="w-5 h-5 rounded-full bg-saffron/20 text-saffron flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
                    {s}
                  </div>
                ))}
                {scheme.applyLink && (
                  <a href={scheme.applyLink} target="_blank" rel="noreferrer" className="inline-block text-xs text-blue-400 underline mt-1">
                    🔗 Official Portal →
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pb-5">
        <button onClick={() => onApply(scheme)}
          className="w-full py-3.5 bg-saffron hover:bg-saffron-light text-navy font-bold text-base rounded-2xl transition-all hover:shadow-[0_0_25px_rgba(255,107,0,0.4)] active:scale-95">
          📝 {L.applyNow}
        </button>
      </div>
    </motion.div>
  )
}

/* ─── Apply Flow ─────────────────────────────────────────── */
function ApplyFlow({ scheme, userProfile, L, onBack }) {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [stage, setStage] = useState('upload')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [formData, setFormData] = useState({
    name: userProfile?.name || '', dob: '', age: userProfile?.age || '',
    gender: userProfile?.gender || '', aadhaar: '', mobile: '',
    caste: userProfile?.caste || '', occupation: userProfile?.occupation || '',
    income: userProfile?.income_annual || '', state: userProfile?.state || '',
    district: '', pincode: '', address: '',
  })
  const [filledFields, setFilledFields] = useState(Object.keys(userProfile || {}).filter(k => userProfile[k]))
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState('')
  const [genPdf, setGenPdf] = useState(false)

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setStage('camera')
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() } }, 100)
    } catch { setError('Camera not available. Please upload a file instead.') }
  }

  const capturePhoto = () => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    c.toBlob(blob => {
      const file = new File([blob], 'aadhaar.jpg', { type: 'image/jpeg' })
      setUploadedFile(file); setPreviewUrl(URL.createObjectURL(blob))
      streamRef.current?.getTracks().forEach(t => t.stop())
      setStage('upload')
    }, 'image/jpeg', 0.92)
  }

  const handleFile = f => {
    if (!f) return
    setUploadedFile(f)
    if (f.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(f))
    setError('')
  }

  const scanDoc = async () => {
    if (!uploadedFile) return
    setStage('scanning')
    setError('')
    try {
      const fd = new FormData()
      fd.append('document', uploadedFile);
      fd.append('docType', 'aadhaar')
      const res = await fetch(`${API_BASE}/api/ocr/extract`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'OCR failed')
      }
      const merged = { ...formData }
      const filled = [...filledFields]
          Object.keys(data.fields || {}).forEach((key) => {
      const value = data.fields[key]

      if (value && value !== '') {
        if (!merged[key] || String(merged[key]).length < String(value).length) {
          merged[key] = value
        }

        if (!filled.includes(key)) {
          filled.push(key)
        }
      }
    })
      setFormData(merged); setFilledFields(filled); setConfidence(data.confidence || 0)
      setStage('form')
      speak('Details extracted. Please check the form.', L.code)
    } catch (e) { setError(`Scan failed: ${e.message}`); setStage('upload') }
  }

  const downloadPDF = async () => {
    setGenPdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F')
      doc.setFillColor(255, 107, 0); doc.rect(0, 0, 210, 4, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
      doc.text('Scheme-AI — Application Form', 14, 18)
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text(scheme?.name || '', 14, 27)
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 155, 27)
      doc.setFillColor(255, 107, 0); doc.rect(0, 36, 210, 4, 'F')
      let y = 52
      const FIELDS = [
        ['name','Full Name'],['dob','Date of Birth'],['age','Age'],['gender','Gender'],
        ['aadhaar','Aadhaar Number'],['mobile','Mobile'],['caste','Caste'],
        ['occupation','Occupation'],['income','Annual Income'],['state','State'],
        ['district','District'],['pincode','Pincode'],
      ]
      doc.setFillColor(255, 247, 237); doc.rect(10, y - 6, 190, 9, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 107, 0)
      doc.text('Personal Information', 14, y); y += 12
      let col = 0
      for (const [key, label] of FIELDS) {
        const val = formData[key]; if (!val) continue
        const x = col === 0 ? 14 : 110
        const isAuto = filledFields.includes(key)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(130, 130, 130)
        doc.text(label.toUpperCase(), x, y)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
        doc.setTextColor(isAuto ? 22 : 30, isAuto ? 163 : 30, isAuto ? 74 : 30)
        doc.text(String(val).slice(0, 36), x, y + 5)
        doc.setDrawColor(60, 60, 80); doc.line(x, y + 7, x + 82, y + 7)
        col++; if (col === 2) { col = 0; y += 18 }
        if (y > 262) { doc.addPage(); y = 20 }
      }
      if (scheme) {
        y += 14
        doc.setFillColor(20, 83, 45); doc.rect(10, y - 6, 190, 9, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(134, 239, 172)
        doc.text('Scheme Details', 14, y); y += 12
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 50, 50)
        if (scheme.ministry) { doc.text(`Ministry: ${scheme.ministry}`, 14, y); y += 7 }
        if (scheme.benefit)  { doc.text(`Benefit: ${scheme.benefit}`, 14, y); y += 7 }
        if (scheme.applyLink){ doc.text(`Portal: ${scheme.applyLink}`, 14, y) }
      }
      doc.setFillColor(15, 23, 42); doc.rect(0, 282, 210, 15, 'F')
      doc.setFillColor(255, 107, 0); doc.rect(0, 282, 210, 2, 'F')
      doc.setTextColor(140, 140, 160); doc.setFontSize(8)
      doc.text('Generated by Scheme-AI | Government Scheme Assistant', 14, 291)
      doc.text(new Date().toLocaleString('en-IN'), 150, 291)
      doc.save(`${(scheme?.name || 'application').replace(/\s+/g, '_').slice(0, 30)}.pdf`)
      setStage('done')
      speak('Your application form has been downloaded.', L.code)
    } catch (e) { setError(`PDF error: ${e.message}`) }
    finally { setGenPdf(false) }
  }

  const FORM_FIELDS = [
    { key: 'name',       label: 'Full Name',         type: 'text',     icon: '👤' },
    { key: 'dob',        label: 'Date of Birth',     type: 'text',     icon: '🎂', placeholder: 'DD/MM/YYYY' },
    { key: 'age',        label: 'Age',               type: 'number',   icon: '🔢' },
    { key: 'gender',     label: 'Gender',            type: 'select',   icon: '⚧',  options: ['Male','Female','Other'] },
    { key: 'aadhaar',    label: 'Aadhaar Number',    type: 'text',     icon: '🪪', placeholder: 'XXXX XXXX XXXX' },
    { key: 'mobile',     label: 'Mobile',            type: 'tel',      icon: '📱' },
    { key: 'caste',      label: 'Caste',             type: 'select',   icon: '📋', options: ['General','OBC','SC','ST'] },
    { key: 'occupation', label: 'Occupation',        type: 'text',     icon: '💼' },
    { key: 'income',     label: 'Annual Income (₹)', type: 'number',   icon: '💰' },
    { key: 'state',      label: 'State',             type: 'text',     icon: '📍' },
    { key: 'district',   label: 'District',          type: 'text',     icon: '🏘️' },
    { key: 'pincode',    label: 'Pincode',           type: 'text',     icon: '📮' },
    { key: 'address',    label: 'Full Address',      type: 'textarea', icon: '🏠' },
  ]

  const PROGRESS = ['upload', 'scanning', 'form', 'done']
  const curIdx = PROGRESS.indexOf(stage === 'camera' ? 'upload' : stage)

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-border sticky top-0 bg-navy-card/95 backdrop-blur z-20">
        <button onClick={onBack} className="text-[#8A9BB0] hover:text-white text-sm font-semibold">← {L.back}</button>
        <div className="flex-1 text-center">
          <p className="font-bold text-sm text-white">📝 {L.applyNow}</p>
          <p className="text-xs text-saffron truncate">{scheme?.name}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 py-4 px-4">
        {[['📄','Upload'],['🔍','Scan'],['✍️','Form'],['📥','Done']].map(([icon, label], i) => (
          <div key={label} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-all
                ${i === curIdx ? 'bg-saffron text-navy font-bold scale-110 shadow-[0_0_15px_rgba(255,107,0,0.5)]'
                  : i < curIdx ? 'bg-scheme-green text-white'
                  : 'bg-navy border border-navy-border text-[#8A9BB0]'}`}>
                {i < curIdx ? '✓' : icon}
              </div>
              <span className={`text-xs font-medium ${i === curIdx ? 'text-saffron' : 'text-[#8A9BB0]'}`}>{label}</span>
            </div>
            {i < 3 && <div className={`w-6 h-0.5 mb-4 ${i < curIdx ? 'bg-scheme-green' : 'bg-navy-border'}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1 px-4 pb-8 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {stage === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {uploadedFile ? (
                <div className="bg-navy-card border border-scheme-green/40 rounded-3xl p-4 mb-4">
                  {previewUrl && <img src={previewUrl} alt="doc" className="w-full max-h-48 object-contain rounded-2xl mb-3 border border-navy-border" />}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-scheme-green-light">✅ {uploadedFile.name}</p>
                    <button onClick={() => { setUploadedFile(null); setPreviewUrl(null) }} className="text-xs text-red-400 underline">Remove</button>
                  </div>
                </div>
              ) : (
                <div className="bg-navy-card border-2 border-saffron/30 rounded-3xl p-8 mb-4">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-saffron/20 border border-saffron/40 flex items-center justify-center text-4xl mx-auto mb-4">🪪</div>
                    <h2 className="text-xl font-bold text-white">Upload Aadhaar Card</h2>
                    <p className="text-[#8A9BB0] text-sm mt-1">{L.namasteDesc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={openCamera}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-saffron/40 bg-saffron/10 hover:bg-saffron/20 transition-all">
                      <span className="text-4xl">📷</span>
                      <div className="text-center">
                        <p className="font-bold text-white text-sm">Take Photo</p>
                        <p className="text-[#8A9BB0] text-xs">{L.label}</p>
                      </div>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-scheme-green/40 bg-scheme-green/10 hover:bg-scheme-green/20 transition-all">
                      <span className="text-4xl">📁</span>
                      <div className="text-center">
                        <p className="font-bold text-white text-sm">Upload File</p>
                        <p className="text-[#8A9BB0] text-xs">JPG, PNG, PDF</p>
                      </div>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                  <p className="text-center text-xs text-[#8A9BB0] mt-4">🔒 Processed securely, not stored</p>
                </div>
              )}
              {uploadedFile && (
                <button onClick={scanDoc}
                  className="w-full py-4 bg-saffron hover:bg-saffron-light text-navy font-bold text-lg rounded-2xl shadow-[0_0_25px_rgba(255,107,0,0.3)] transition-all">
                  🔍 Scan & Extract Details
                </button>
              )}
              <button onClick={() => setStage('form')} className="w-full mt-3 py-2 text-[#8A9BB0] text-sm underline hover:text-white">
                Skip — Fill manually
              </button>
            </motion.div>
          )}

          {stage === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-black rounded-3xl overflow-hidden border-2 border-saffron/40">
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: '55vh' }} />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-saffron rounded-xl"
                    style={{ width: '82%', height: '56%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }} />
                </div>
                <p className="absolute top-3 w-full text-center text-white text-sm font-semibold">Align Aadhaar within the frame</p>
              </div>
              <div className="p-4 bg-navy-card flex gap-3">
                <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setStage('upload') }}
                  className="flex-1 py-3 border border-navy-border text-[#8A9BB0] rounded-xl font-semibold">✕ {L.back}</button>
                <button onClick={capturePhoto}
                  className="flex-1 py-3 bg-saffron text-navy rounded-xl font-bold text-lg">📸 Capture</button>
              </div>
            </motion.div>
          )}

          {stage === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-navy-card border-2 border-saffron/30 rounded-3xl p-12 text-center">
              <div className="text-6xl mb-5 animate-bounce">🔍</div>
              <h2 className="text-xl font-bold text-white mb-2">{L.searching}</h2>
              <p className="text-[#8A9BB0] text-sm mb-8">Using AI to extract your personal details</p>
              <div className="flex justify-center gap-6">
                {['OCR', 'AI', 'Fill'].map((s, i) => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-saffron/10 border-2 border-saffron/40 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-saffron animate-ping" style={{ animationDelay: `${i * 0.3}s` }} />
                    </div>
                    <span className="text-xs text-[#8A9BB0]">{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {stage === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {filledFields.length > 0 && (
                <div className="bg-scheme-green/10 border border-scheme-green/40 rounded-2xl p-4 mb-4 flex gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-scheme-green-light text-sm">{filledFields.length} fields auto-filled {confidence > 0 && `(${confidence}%)`}</p>
                    <p className="text-xs text-[#8A9BB0] mt-0.5">Green fields extracted from document. Please verify.</p>
                  </div>
                </div>
              )}
              <div className="bg-navy-card border-2 border-saffron/30 rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-saffron/20 to-saffron/5 px-6 py-4 border-b border-navy-border">
                  <h2 className="font-bold text-white text-lg">Application Form</h2>
                  <p className="text-saffron text-xs truncate">{scheme?.name}</p>
                </div>
                <div className="p-5 space-y-4">
                  {FORM_FIELDS.map(({ key, label, type, options, placeholder, icon }) => {
                    const isAuto = filledFields.includes(key)
                    const val = formData[key] || ''
                    const cls = `w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-[#8A9BB0] bg-navy focus:outline-none focus:ring-2 transition-all
                      ${isAuto && val ? 'border-scheme-green/60 bg-scheme-green/10 focus:ring-scheme-green/40' : 'border-navy-border focus:border-saffron/50 focus:ring-saffron/20'}`
                    return (
                      <div key={key}>
                        <label className="flex items-center gap-2 text-xs font-semibold text-[#8A9BB0] mb-1.5 uppercase tracking-wide">
                          {icon} {label}
                          {isAuto && <span className="ml-auto text-xs bg-scheme-green/20 text-scheme-green-light px-2 py-0.5 rounded-full normal-case">✓ Auto-filled</span>}
                        </label>
                        {type === 'select' ? (
                          <select value={val} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} className={cls + ' appearance-none'}>
                            <option value="">Select...</option>
                            {options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : type === 'textarea' ? (
                          <textarea value={val} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder || `Enter ${label}`} rows={3} className={cls + ' resize-none'} />
                        ) : (
                          <input type={type} value={val} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder || `Enter ${label}`} className={cls} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="px-5 pb-5 flex gap-3">
                  <button onClick={() => setStage('upload')}
                    className="flex-1 py-3 border border-navy-border text-[#8A9BB0] rounded-xl font-semibold hover:text-white transition-all">← Re-upload</button>
                  <button onClick={downloadPDF} disabled={genPdf}
                    className="flex-1 py-3 bg-saffron hover:bg-saffron-light disabled:opacity-50 text-navy font-bold rounded-xl transition-all">
                    {genPdf ? '⏳...' : '📥 Download PDF'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-navy-card border-2 border-scheme-green/40 rounded-3xl p-10 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-scheme-green-light mb-2">PDF Downloaded!</h2>
              <p className="text-[#8A9BB0] text-sm mb-5">Your pre-filled application is ready.</p>
              {scheme?.applyLink && (
                <div className="bg-navy rounded-2xl p-4 mb-6 border border-navy-border text-left">
                  <p className="font-bold text-white text-sm mb-1">{scheme.name}</p>
                  <a href={scheme.applyLink} target="_blank" rel="noreferrer" className="text-blue-400 underline text-sm">🔗 Official Portal →</a>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={downloadPDF} className="px-6 py-3 bg-saffron text-navy rounded-full font-bold">📥 Download Again</button>
                <button onClick={onBack} className="px-6 py-3 border border-navy-border text-[#8A9BB0] rounded-full font-semibold hover:text-white transition-all">← {L.back}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-500/40 rounded-2xl p-4 text-red-400 text-sm text-center">
            ⚠️ {error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
          </div>
        )}
      </div>
      <div className="h-[4px] bg-tricolor" />
    </div>
  )
}

/* ─── Main ElderlyPage ───────────────────────────────────── */
export default function ElderlyPage() {
  const navigate = useNavigate()
  const [L, setL] = useState(() => getSavedLang())
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [schemes, setSchemes] = useState([])
  const [aiReply, setAiReply] = useState('')
  const [userProfile, setUserProfile] = useState({})
  const [sessionId, setSessionId] = useState(null)
  const [applyScheme, setApplyScheme] = useState(null)
  const [error, setError] = useState('')
  const [noResults, setNoResults] = useState(false)
  const recognitionRef = useRef(null)
  const hasGreeted = useRef(false)

  useEffect(() => {
    if (hasGreeted.current) return
    hasGreeted.current = true
    setTimeout(() => speak(L.greeting, L.code), 700)
  }, [])

  useEffect(() => {
    if (!hasGreeted.current) return
    window.speechSynthesis?.cancel()
    setSchemes([]); setTranscript(''); setAiReply(''); setNoResults(false)
    setTimeout(() => speak(L.greeting, L.code), 400)
  }, [L])

  const changeLang = (newL) => {
    localStorage.setItem('schemeai_lang', newL.short)
    localStorage.setItem('schemeai_lang_code', newL.code)
    setL(newL)
    setShowLangPicker(false)
    speak(newL.greeting, newL.code)
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { speak('Sorry, voice not supported in this browser.', L.code); return }
    window.speechSynthesis?.cancel()
    const r = new SR()
    r.lang = L.code
    r.interimResults = true
    r.continuous = false
    r.onresult = e => setTranscript(Array.from(e.results).map(x => x[0].transcript).join(''))
    r.onend = () => setListening(false)
    r.onerror = () => { setListening(false); speak('Could not hear clearly. Please try again.', L.code) }
    r.start(); recognitionRef.current = r; setListening(true); setTranscript('')
    speak(L.listening, L.code)
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  const findSchemes = async () => {
    if (!transcript.trim()) return
    setLoading(true); setError(''); setNoResults(false)
    try {
      const res = await fetch(`${API_BASE}/api/a2a/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcript, sessionId, language: L.api }),
      })
      const data = await res.json()
      setSessionId(data.sessionId)
      setAiReply(data.reply || '')
      setUserProfile(data.userProfile || {})

      // ── KEY FIX: Show ALL schemes, no threshold cutoff ──
      const all = (data.schemes || [])
        .sort((a, b) => (b.eligibility || 0) - (a.eligibility || 0))
        .slice(0, 6)

      setSchemes(all)

      if (all.length > 0) {
        speak(L.schemeFound(all.length), L.code)
      } else {
        setNoResults(true)
        // Tell user to give more details in their language
        const moreInfo = {
          'hi-IN': 'कोई योजना नहीं मिली। कृपया अपना नाम, उम्र, पेशा और राज्य बताएं।',
          'ta-IN': 'திட்டங்கள் கிடைக்கவில்லை. உங்கள் பெயர், வயது, தொழில், மாநிலம் சொல்லுங்கள்.',
          'te-IN': 'పథకాలు దొరకలేదు. పేరు, వయస్సు, వృత్తి, రాష్ట్రం చెప్పండి.',
          'kn-IN': 'ಯೋಜನೆಗಳು ಸಿಗಲಿಲ್ಲ. ಹೆಸರು, ವಯಸ್ಸು, ವೃತ್ತಿ, ರಾಜ್ಯ ಹೇಳಿ.',
          'bn-IN': 'প্রকল্প পাওয়া যায়নি। নাম, বয়স, পেশা, রাজ্য বলুন।',
          'mr-IN': 'योजना सापडल्या नाहीत. नाव, वय, व्यवसाय, राज्य सांगा.',
          'gu-IN': 'કોઈ યોजना મળી નહીં. નામ, ઉંમર, વ્યવસાય, રાજ્ય કહો.',
          'ml-IN': 'പദ്ധതികൾ കണ്ടെത്തിയില്ല. പേര്, പ്രായം, തൊഴിൽ, സംസ്ഥാനം പറയൂ.',
          'en-IN': 'No schemes found. Please say your name, age, occupation and state.',
        }
        speak(moreInfo[L.code] || moreInfo['en-IN'], L.code)
      }
    } catch {
      setError(L.connError)
    } finally { setLoading(false) }
  }

  if (applyScheme) {
    return <ApplyFlow scheme={applyScheme} userProfile={userProfile} L={L} onBack={() => setApplyScheme(null)} />
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col relative overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-border relative z-20">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[#8A9BB0] hover:text-white transition-colors text-sm">
          ← <span className="hidden sm:inline">{L.back}</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-saffron to-gold flex items-center justify-center text-sm">🇮🇳</div>
          <span className="font-bold text-sm">Scheme<span className="text-saffron">-AI</span></span>
        </div>
        <div className="relative">
          <button onClick={() => setShowLangPicker(v => !v)}
            className="flex items-center gap-1.5 bg-navy-card border border-navy-border rounded-xl px-3 py-2 text-xs font-semibold hover:border-saffron/40 transition-all">
            🌐 {L.label}
          </button>
          <AnimatePresence>
            {showLangPicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-11 bg-navy-card border border-navy-border rounded-2xl shadow-2xl p-3 z-50 grid grid-cols-2 gap-2 w-52">
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => changeLang(l)}
                    className={`text-xs px-3 py-2 rounded-xl font-semibold transition-all text-left ${L.code === l.code ? 'bg-saffron text-navy' : 'bg-navy hover:bg-navy-mid text-white border border-navy-border'}`}>
                    {l.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 max-w-xl mx-auto w-full gap-5">

        {/* Welcome card */}
        {schemes.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full bg-navy-card border-2 border-saffron/30 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-saffron/30 to-gold/10 border border-saffron/20 flex items-center justify-center text-5xl mx-auto mb-5">🙏</div>
            <h2 className="text-2xl font-extrabold text-saffron mb-1">{L.namaste}</h2>
            <p className="text-[#8A9BB0] text-sm mb-3">{L.namasteDesc}</p>

            {/* Example prompt — helps user know what to say */}
            <div className="bg-navy/60 border border-navy-border rounded-2xl px-4 py-2.5 mb-4">
              <p className="text-[10px] text-[#8A9BB0] uppercase tracking-wide mb-1">💡 {L.short === 'en' ? 'Try saying:' : L.short === 'ta' ? 'இப்படி சொல்லுங்கள்:' : L.short === 'hi' ? 'ऐसे बोलें:' : 'Example:'}</p>
              <p className="text-xs text-saffron italic">{L.tryExample}</p>
            </div>

            {transcript && (
              <div className="bg-saffron/10 border border-saffron/20 rounded-2xl p-3 mb-4 text-sm text-saffron-light text-left">
                <span className="text-xs text-[#8A9BB0] block mb-1">{L.youSaid}</span>
                "{transcript}"
              </div>
            )}

            {/* No results message */}
            {noResults && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-3 mb-3 text-xs text-red-400">
                ⚠️ {L.short === 'ta' ? 'மேலும் விவரங்கள் சொல்லுங்கள் — பெயர், வயது, தொழில், மாநிலம்' :
                    L.short === 'hi' ? 'अधिक जानकारी दें — नाम, उम्र, पेशा, राज्य' :
                    'Please give more details — name, age, occupation, state'}
              </div>
            )}

            {aiReply && !noResults && (
              <div className="bg-navy border border-navy-border rounded-2xl p-3 text-sm text-[#8A9BB0] italic">🤖 {aiReply}</div>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full bg-navy-card border-2 border-saffron/30 rounded-3xl p-12 text-center">
            <div className="text-5xl mb-4 animate-bounce">🔍</div>
            <p className="text-white font-bold text-lg mb-2">{L.searching}</p>
            <p className="text-[#8A9BB0] text-sm">{L.searchingDesc}</p>
            <div className="flex justify-center gap-4 mt-6">
              {['RAG', 'AI', 'Score'].map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-saffron/10 border border-saffron/40 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-saffron animate-ping" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <span className="text-xs text-[#8A9BB0]">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results header */}
        {schemes.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full bg-scheme-green/10 border border-scheme-green/40 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-scheme-green/20 flex items-center justify-center text-2xl flex-shrink-0">🎯</div>
            <div>
              <p className="font-bold text-scheme-green-light">{L.schemeFound(schemes.length)}</p>
              {userProfile.name && <p className="text-[#8A9BB0] text-xs">— {userProfile.name}</p>}
            </div>
            <button onClick={() => { setSchemes([]); setTranscript(''); setNoResults(false) }}
              className="ml-auto text-xs text-[#8A9BB0] hover:text-white border border-navy-border rounded-xl px-3 py-1.5 transition-all">
              🔄 {L.newSearch}
            </button>
          </motion.div>
        )}

        {/* Scheme cards */}
        {schemes.map((scheme, i) => (
          <SchemeCard
            key={i}
            scheme={scheme}
            index={i}
            onApply={(scheme) => setApplyScheme(scheme)}
            L={L}
/>
        ))}

        {/* Error */}
        {error && (
          <div className="w-full bg-red-900/30 border border-red-500/40 rounded-2xl p-4 text-red-400 text-sm text-center">
            ⚠️ {error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Mic */}
        {!loading && (
          <div className="flex flex-col items-center gap-4 mt-2">
            <MicButton listening={listening} onClick={listening ? stopListening : startListening} />
            <p className={`text-sm font-semibold ${listening ? 'text-red-400 animate-pulse' : 'text-[#8A9BB0]'}`}>
              {listening ? `🔴 ${L.listening}` : L.pressSpeak}
            </p>
            {transcript && !listening && (
              <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={findSchemes}
                className="px-10 py-4 bg-scheme-green hover:bg-scheme-green-light text-white rounded-full font-bold text-lg shadow-[0_0_25px_rgba(19,136,8,0.4)] transition-all">
                🔍 {L.findSchemes}
              </motion.button>
            )}
          </div>
        )}

        {/* Helper hint */}
        <div className="bg-navy-card border border-navy-border rounded-2xl px-5 py-3 w-full text-center">
          <p className="text-xs text-[#8A9BB0]">
            📞 <span className="font-semibold text-white">{L.needHelper}</span> — {L.helperDesc}
          </p>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-navy-card/95 backdrop-blur border-t border-navy-border px-4 py-3 z-20">
        <div className="flex justify-around max-w-sm mx-auto gap-2">
          {[
            { icon: '🏠', label: 'Home', sub: L.back, action: () => navigate('/') },
            { icon: '🎙️', label: 'Speak', sub: L.pressSpeak.slice(0, 8), action: listening ? stopListening : startListening },
            { icon: '📋', label: 'Schemes', sub: L.findSchemes.slice(0, 8), action: () => navigate('/schemes') },
            { icon: '🔊', label: 'Repeat', sub: L.label, action: () => speak(L.greeting, L.code) },
          ].map(({ icon, label, sub, action }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-1 bg-navy border border-navy-border rounded-2xl px-3 py-2.5 text-xs hover:border-saffron/40 hover:text-saffron transition-all flex-1">
              <span className="text-2xl">{icon}</span>
              <span className="font-semibold">{label}</span>
              <span className="text-[10px] text-[#8A9BB0] truncate w-full text-center">{sub}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="h-[4px] bg-tricolor" />
    </div>
  )
}