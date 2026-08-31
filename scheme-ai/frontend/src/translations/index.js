// frontend/src/translations/index.js
//
// Lookup shape: translations[langCode].some.nested.key
// Missing keys automatically fall back to translations.en (see LanguageContext.jsx).
//
// Every language has at least `nav` filled in, so the navbar/tabs switch
// immediately for all 12 languages. Full landing-page copy is filled in for
// English, Hindi and Tamil to start — add the same keys under any other
// language code below to translate that language's page copy too.

const en = {
  nav: {
    home: 'Home', talkToAI: 'Talk to AI', schemes: 'Schemes',
    scanId: 'Scan ID', dashboard: 'Dashboard', speakNow: 'Speak now',
  },
  hero: {
    badge: '✦ HACKATHON 3.0 — GENERATIVE AI FOR SOCIAL IMPACT',
    titleLine1: 'Speak once.',
    titleLine2: 'Claim everything',
    titleHighlight: 'you are owed.',
    subtitle: "Lakh-crore worth of Indian welfare benefits go unclaimed every year — not because people don't qualify, but because nobody told them. Scheme-AI listens to your story and finds the schemes hiding inside it.",
    startTalking: 'Start talking →',
    browseSchemes: 'Browse schemes',
    tapToSpeak: 'Tap and speak in any language',
    sampleAnswerLabel: 'Sample answer',
    samples: [
      'You qualify for 4 schemes. The nearest one gives your family ₹1,000 every month and needs only your ration card.',
      'As a 65-year-old farmer from Tamil Nadu, you are eligible for PM-KISAN and Uzhavar Pathukappu Thittam.',
      'Your daughter qualifies for the Moovalur Ramamirtham Ammaiyar scheme — free bicycle + ₹1,000 cash.',
    ],
  },
  stats: [
    { value: '500M+', label: 'underserved citizens' },
    { value: '2,000+', label: 'central & state schemes' },
    { value: '12+', label: 'Indian languages' },
    { value: '28', label: 'states on the roadmap' },
  ],
  features: {
    heading: 'Built for the person who has never filled a form online',
    subheading: 'Most welfare tech is built for people who already know how to navigate bureaucracy. We built this for everyone else.',
    items: [
      { icon: '💬', title: 'Just talk, no forms', desc: 'Describe your life the way you would to a neighbour. The assistant does the paperwork thinking.' },
      { icon: '🗣️', title: 'Your language, your words', desc: 'Hindi, Tamil, Telugu, Bengali and more — spoken input, spoken answers, simplified on request.' },
      { icon: '📄', title: 'Documents read for you', desc: 'Scan an Aadhaar or ration card and the fields flow straight into your application.' },
      { icon: '✅', title: 'Reasons you can check', desc: 'Every match carries a 0–100 score and a plain-language reason — no black box, no agent fee.' },
    ],
  },
  howItWorks: {
    kicker: 'The 4-layer prompt chain',
    heading: 'What happens between your sentence and your answer',
    steps: [
      { title: 'Profile Extractor', desc: 'AI reads your age, occupation, caste, income and state from natural conversation.' },
      { title: 'RAG Search', desc: '2,000+ schemes are searched instantly using your profile as the query.' },
      { title: 'Eligibility Scorer', desc: 'Each scheme gets a 0–100 match score with a plain-language reason.' },
      { title: 'Voice Reply', desc: 'Results are spoken back in your language with apply links and document checklist.' },
    ],
  },
  demo: {
    heading: 'See it in action',
    subheading: "Here's what a 65-year-old farmer from Tamil Nadu would see:",
    userMsg: 'I am a 65 year old farmer from Tamil Nadu',
    aiMsg: 'As a 65-year-old farmer in Tamil Nadu, you may be eligible for the PM-KISAN scheme (₹6,000/year) and the Uzhavar Pathukappu Thittam (₹2 lakh accident insurance). Which state scheme would you like to apply for first?',
    centralHeader: 'Central Government Schemes',
    stateHeader: 'Tamil Nadu State Schemes',
  },
  cta: {
    heading: 'Your benefits are waiting.',
    subheading: 'Start a conversation — no registration, no paperwork. Just speak.',
    startTalking: '🎙️ Start talking now',
    voiceOnly: '👴 Voice-only mode',
  },
  footer: {
    tagline: '• Welfare Navigator',
    privacy: 'Privacy', terms: 'Terms', about: 'About', contact: 'Contact',
    builtFor: '© 2026 Scheme-AI • Built for India',
  },
}

const hi = {
  nav: {
    home: 'होम', talkToAI: 'AI से बात करें', schemes: 'योजनाएं',
    scanId: 'ID स्कैन करें', dashboard: 'डैशबोर्ड', speakNow: 'अभी बोलें',
  },
  hero: {
    badge: '✦ हैकाथॉन 3.0 — सामाजिक प्रभाव के लिए जेनरेटिव AI',
    titleLine1: 'एक बार बोलिए।',
    titleLine2: 'हर वो लाभ पाइए',
    titleHighlight: 'जो आपका हक़ है।',
    subtitle: 'हर साल लाखों करोड़ रुपये की भारतीय कल्याणकारी योजनाएं बिना दावा किए रह जाती हैं — इसलिए नहीं कि लोग पात्र नहीं हैं, बल्कि इसलिए कि किसी ने उन्हें बताया ही नहीं। Scheme-AI आपकी बात सुनकर उसमें छुपी योजनाएं ढूंढ निकालता है।',
    startTalking: 'बोलना शुरू करें →',
    browseSchemes: 'योजनाएं देखें',
    tapToSpeak: 'किसी भी भाषा में टैप करें और बोलें',
    sampleAnswerLabel: 'नमूना उत्तर',
    samples: [
      'आप 4 योजनाओं के लिए पात्र हैं। सबसे नज़दीकी योजना आपके परिवार को हर महीने ₹1,000 देती है और केवल राशन कार्ड चाहिए।',
      'तमिलनाडु के 65 वर्षीय किसान होने के नाते, आप PM-KISAN और उझावर पथुक्काप्पु थिट्टम के लिए पात्र हैं।',
      'आपकी बेटी मूवलूर रामामिर्तम अम्मैयार योजना के लिए पात्र है — मुफ़्त साइकिल + ₹1,000 नकद।',
    ],
  },
  stats: [
    { value: '50 करोड़+', label: 'वंचित नागरिक' },
    { value: '2,000+', label: 'केंद्र व राज्य योजनाएं' },
    { value: '12+', label: 'भारतीय भाषाएं' },
    { value: '28', label: 'राज्य योजना में शामिल' },
  ],
  features: {
    heading: 'उस व्यक्ति के लिए बनाया गया जिसने कभी ऑनलाइन फॉर्म नहीं भरा',
    subheading: 'ज़्यादातर कल्याण तकनीक उन लोगों के लिए बनी है जो पहले से ही सरकारी प्रक्रिया जानते हैं। हमने इसे बाकी सबके लिए बनाया है।',
    items: [
      { icon: '💬', title: 'सिर्फ बोलिए, कोई फॉर्म नहीं', desc: 'अपनी ज़िंदगी के बारे में वैसे ही बताइए जैसे किसी पड़ोसी को बताते हैं। कागज़ी काम सहायक करता है।' },
      { icon: '🗣️', title: 'आपकी भाषा, आपके शब्द', desc: 'हिंदी, तमिल, तेलुगु, बंगाली और और भी — बोलकर पूछिए, बोलकर जवाब पाइए, ज़रूरत पर आसान भाषा में।' },
      { icon: '📄', title: 'दस्तावेज़ खुद पढ़े जाते हैं', desc: 'आधार या राशन कार्ड स्कैन कीजिए और जानकारी सीधे आपके आवेदन में भर जाती है।' },
      { icon: '✅', title: 'कारण जो आप जांच सकते हैं', desc: 'हर मैच के साथ 0–100 का स्कोर और सीधी भाषा में कारण मिलता है — कोई ब्लैक बॉक्स नहीं, कोई एजेंट फीस नहीं।' },
    ],
  },
  howItWorks: {
    kicker: '4-चरणीय प्रॉम्प्ट चेन',
    heading: 'आपके वाक्य और आपके जवाब के बीच क्या होता है',
    steps: [
      { title: 'प्रोफाइल एक्सट्रैक्टर', desc: 'AI सामान्य बातचीत से आपकी उम्र, पेशा, जाति, आय और राज्य समझता है।' },
      { title: 'RAG सर्च', desc: 'आपकी प्रोफाइल को क्वेरी बनाकर तुरंत 2,000+ योजनाओं में खोज होती है।' },
      { title: 'पात्रता स्कोरर', desc: 'हर योजना को 0–100 का मैच स्कोर और सीधी भाषा में कारण मिलता है।' },
      { title: 'वॉइस रिप्लाई', desc: 'नतीजे आपकी भाषा में बोलकर बताए जाते हैं, साथ में आवेदन लिंक और दस्तावेज़ सूची।' },
    ],
  },
  demo: {
    heading: 'इसे काम करते देखिए',
    subheading: 'यह देखिए तमिलनाडु के 65 वर्षीय किसान को क्या दिखेगा:',
    userMsg: 'मैं तमिलनाडु का 65 वर्षीय किसान हूं',
    aiMsg: 'तमिलनाडु के 65 वर्षीय किसान होने के नाते, आप PM-KISAN योजना (₹6,000/वर्ष) और उझावर पथुक्काप्पु थिट्टम (₹2 लाख दुर्घटना बीमा) के लिए पात्र हो सकते हैं। आप पहले किस राज्य योजना के लिए आवेदन करना चाहेंगे?',
    centralHeader: 'केंद्र सरकार की योजनाएं',
    stateHeader: 'तमिलनाडु राज्य की योजनाएं',
  },
  cta: {
    heading: 'आपके लाभ आपका इंतज़ार कर रहे हैं।',
    subheading: 'बातचीत शुरू करें — कोई रजिस्ट्रेशन नहीं, कोई कागज़ी काम नहीं। बस बोलिए।',
    startTalking: '🎙️ अभी बोलना शुरू करें',
    voiceOnly: '👴 केवल-आवाज़ मोड',
  },
  footer: {
    tagline: '• कल्याण नेविगेटर',
    privacy: 'गोपनीयता', terms: 'शर्तें', about: 'हमारे बारे में', contact: 'संपर्क करें',
    builtFor: '© 2026 Scheme-AI • भारत के लिए बनाया गया',
  },
}

const ta = {
  nav: {
    home: 'முகப்பு', talkToAI: 'AI உடன் பேசுங்கள்', schemes: 'திட்டங்கள்',
    scanId: 'ID ஸ்கேன் செய்யவும்', dashboard: 'டாஷ்போர்டு', speakNow: 'இப்போது பேசுங்கள்',
  },
  hero: {
    badge: '✦ ஹேக்கத்தான் 3.0 — சமூக நலனுக்கான ஜெனரேட்டிவ் AI',
    titleLine1: 'ஒரு முறை பேசுங்கள்.',
    titleLine2: 'உங்களுக்கு உரிய அனைத்தையும்',
    titleHighlight: 'பெறுங்கள்.',
    subtitle: 'ஒவ்வொரு ஆண்டும் லட்சக்கணக்கான கோடி மதிப்புள்ள இந்திய நலத் திட்டங்கள் கோரப்படாமல் இருக்கின்றன — மக்கள் தகுதி இல்லாததால் அல்ல, யாரும் அவர்களிடம் சொல்லாததால். Scheme-AI உங்கள் கதையைக் கேட்டு, அதில் மறைந்திருக்கும் திட்டங்களைக் கண்டுபிடிக்கிறது.',
    startTalking: 'பேச தொடங்குங்கள் →',
    browseSchemes: 'திட்டங்களை பார்வையிடுங்கள்',
    tapToSpeak: 'எந்த மொழியிலும் தட்டி பேசுங்கள்',
    sampleAnswerLabel: 'மாதிரி பதில்',
    samples: [
      'நீங்கள் 4 திட்டங்களுக்கு தகுதியுடையவர். அருகிலுள்ள திட்டம் உங்கள் குடும்பத்திற்கு மாதம் ₹1,000 தருகிறது, ரேஷன் கார்டு மட்டும் தேவை.',
      'தமிழ்நாட்டைச் சேர்ந்த 65 வயது விவசாயி என்பதால், நீங்கள் PM-KISAN மற்றும் உழவர் பாதுகாப்பு திட்டத்திற்கு தகுதியுடையவர்.',
      'உங்கள் மகள் மூவலூர் இராமாமிர்தம் அம்மையார் திட்டத்திற்கு தகுதியுடையவர் — இலவச சைக்கிள் + ₹1,000 பணம்.',
    ],
  },
  stats: [
    { value: '50 கோடி+', label: 'சேவை எட்டாத குடிமக்கள்' },
    { value: '2,000+', label: 'மத்திய & மாநில திட்டங்கள்' },
    { value: '12+', label: 'இந்திய மொழிகள்' },
    { value: '28', label: 'திட்டமிடப்பட்ட மாநிலங்கள்' },
  ],
  features: {
    heading: 'ஆன்லைனில் ஒரு படிவத்தை கூட நிரப்பியிராதவருக்காக உருவாக்கப்பட்டது',
    subheading: 'பெரும்பாலான நல தொழில்நுட்பங்கள், அரசு நடைமுறைகளை ஏற்கனவே அறிந்தவர்களுக்காக உருவாக்கப்பட்டவை. நாங்கள் இதை மற்ற அனைவருக்காகவும் உருவாக்கினோம்.',
    items: [
      { icon: '💬', title: 'பேசுங்கள் மட்டும், படிவம் தேவையில்லை', desc: 'உங்கள் வாழ்க்கையை ஒரு அண்டை வீட்டாரிடம் சொல்வது போல் சொல்லுங்கள். காகித வேலையை உதவியாளர் பார்த்துக்கொள்கிறார்.' },
      { icon: '🗣️', title: 'உங்கள் மொழி, உங்கள் வார்த்தைகள்', desc: 'இந்தி, தமிழ், தெலுங்கு, வங்காளம் மற்றும் பல — பேசி கேளுங்கள், பேசி பதில் பெறுங்கள், தேவைப்பட்டால் எளிமையாக்கவும்.' },
      { icon: '📄', title: 'உங்களுக்காக ஆவணங்கள் படிக்கப்படும்', desc: 'ஆதார் அல்லது ரேஷன் கார்டை ஸ்கேன் செய்யுங்கள், விவரங்கள் நேரடியாக உங்கள் விண்ணப்பத்தில் நிரப்பப்படும்.' },
      { icon: '✅', title: 'நீங்கள் சரிபார்க்கக்கூடிய காரணங்கள்', desc: 'ஒவ்வொரு பொருத்தத்திற்கும் 0–100 மதிப்பெண் மற்றும் எளிய காரணம் — மறைவான முடிவெடுப்பு இல்லை, முகவர் கட்டணம் இல்லை.' },
    ],
  },
  howItWorks: {
    kicker: '4-அடுக்கு ப்ராம்ப்ட் சங்கிலி',
    heading: 'உங்கள் வாக்கியத்திற்கும் உங்கள் பதிலுக்கும் இடையில் என்ன நடக்கிறது',
    steps: [
      { title: 'ப்ரொஃபைல் எக்ஸ்ட்ராக்டர்', desc: 'இயல்பான உரையாடலிலிருந்து AI உங்கள் வயது, தொழில், சாதி, வருமானம், மாநிலத்தை புரிந்துகொள்கிறது.' },
      { title: 'RAG தேடல்', desc: 'உங்கள் விவரங்களைக் கொண்டு 2,000+ திட்டங்கள் உடனடியாக தேடப்படுகின்றன.' },
      { title: 'தகுதி மதிப்பீடு', desc: 'ஒவ்வொரு திட்டத்திற்கும் 0–100 பொருத்த மதிப்பெண் மற்றும் எளிய காரணம் கிடைக்கும்.' },
      { title: 'குரல் பதில்', desc: 'விண்ணப்ப இணைப்புகள் மற்றும் ஆவண பட்டியலுடன் முடிவுகள் உங்கள் மொழியில் பேசப்படும்.' },
    ],
  },
  demo: {
    heading: 'இதை செயலில் பாருங்கள்',
    subheading: 'தமிழ்நாட்டைச் சேர்ந்த 65 வயது விவசாயி என்ன பார்ப்பார் என்பதை இங்கே காணலாம்:',
    userMsg: 'நான் தமிழ்நாட்டைச் சேர்ந்த 65 வயது விவசாயி',
    aiMsg: 'தமிழ்நாட்டைச் சேர்ந்த 65 வயது விவசாயி என்பதால், நீங்கள் PM-KISAN திட்டம் (₹6,000/ஆண்டு) மற்றும் உழவர் பாதுகாப்பு திட்டத்திற்கு (₹2 லட்சம் விபத்து காப்பீடு) தகுதியுடையவராக இருக்கலாம். முதலில் எந்த மாநில திட்டத்திற்கு விண்ணப்பிக்க விரும்புகிறீர்கள்?',
    centralHeader: 'மத்திய அரசு திட்டங்கள்',
    stateHeader: 'தமிழ்நாடு மாநில திட்டங்கள்',
  },
  cta: {
    heading: 'உங்கள் நலன்கள் காத்திருக்கின்றன.',
    subheading: 'ஒரு உரையாடலைத் தொடங்குங்கள் — பதிவு தேவையில்லை, காகிதவேலை தேவையில்லை. வெறும் பேசுங்கள்.',
    startTalking: '🎙️ இப்போதே பேச தொடங்குங்கள்',
    voiceOnly: '👴 குரல்-மட்டும் பயன்முறை',
  },
  footer: {
    tagline: '• நல வழிகாட்டி',
    privacy: 'தனியுரிமை', terms: 'விதிமுறைகள்', about: 'எங்களைப் பற்றி', contact: 'தொடர்பு',
    builtFor: '© 2026 Scheme-AI • இந்தியாவுக்காக உருவாக்கப்பட்டது',
  },
}

// Nav-only for now — add `hero`, `stats`, `features`, `howItWorks`, `demo`,
// `cta`, `footer` blocks the same way as `hi` / `ta` above to fully
// translate the rest of the page for these languages too.
const te = { nav: { home: 'హోమ్', talkToAI: 'AI తో మాట్లాడండి', schemes: 'పథకాలు', scanId: 'ID స్కాన్ చేయండి', dashboard: 'డాష్‌బోర్డ్', speakNow: 'ఇప్పుడు మాట్లాడండి' } }
const bn = { nav: { home: 'হোম', talkToAI: 'AI-এর সাথে কথা বলুন', schemes: 'প্রকল্প', scanId: 'আইডি স্ক্যান করুন', dashboard: 'ড্যাশবোর্ড', speakNow: 'এখন বলুন' } }
const mr = { nav: { home: 'मुख्यपृष्ठ', talkToAI: 'AI शी बोला', schemes: 'योजना', scanId: 'ID स्कॅन करा', dashboard: 'डॅशबोर्ड', speakNow: 'आता बोला' } }
const kn = { nav: { home: 'ಮುಖಪುಟ', talkToAI: 'AI ಜೊತೆ ಮಾತನಾಡಿ', schemes: 'ಯೋಜನೆಗಳು', scanId: 'ID ಸ್ಕ್ಯಾನ್ ಮಾಡಿ', dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', speakNow: 'ಈಗ ಮಾತನಾಡಿ' } }
const gu = { nav: { home: 'હોમ', talkToAI: 'AI સાથે વાત કરો', schemes: 'યોજનાઓ', scanId: 'ID સ્કેન કરો', dashboard: 'ડેશબોર્ડ', speakNow: 'હવે બોલો' } }
const ml = { nav: { home: 'ഹോം', talkToAI: 'AI-യുമായി സംസാരിക്കുക', schemes: 'പദ്ധതികൾ', scanId: 'ID സ്കാൻ ചെയ്യുക', dashboard: 'ഡാഷ്ബോർഡ്', speakNow: 'ഇപ്പോൾ സംസാരിക്കുക' } }
const pa = { nav: { home: 'ਹੋਮ', talkToAI: 'AI ਨਾਲ ਗੱਲ ਕਰੋ', schemes: 'ਯੋਜਨਾਵਾਂ', scanId: 'ID ਸਕੈਨ ਕਰੋ', dashboard: 'ਡੈਸ਼ਬੋਰਡ', speakNow: 'ਹੁਣੇ ਬੋਲੋ' } }
const ur = { nav: { home: 'ہوم', talkToAI: 'AI سے بات کریں', schemes: 'اسکیمیں', scanId: 'ID اسکین کریں', dashboard: 'ڈیش بورڈ', speakNow: 'ابھی بولیں' } }
const or_ = { nav: { home: 'ହୋମ', talkToAI: 'AI ସହିତ କଥା ହୁଅନ୍ତୁ', schemes: 'ଯୋଜନା', scanId: 'ID ସ୍କାନ୍ କରନ୍ତୁ', dashboard: 'ଡ୍ୟାସବୋର୍ଡ', speakNow: 'ବର୍ତ୍ତମାନ କୁହନ୍ତୁ' } }

export const translations = {
  en, hi, ta, te, bn, mr, kn, gu, ml, pa, ur, or: or_,
}