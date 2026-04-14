# 🇮🇳 Scheme-AI — The Welfare Eligibility Navigator

> Voice-first AI agent that helps every Indian citizen discover, understand & apply for 1,000+ government welfare schemes — in their own language, with zero forms.

**Built at HackNova 3.0** by Team from Jaya Engineering College  
Track: Generative AI — Social Impact system 

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite + React 18 + Tailwind CSS + Framer Motion |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **AI Engine** | Gemini 1.5 Pro + Flash (Google AI) — 5-layer prompt chain |
| **Embeddings** | Gemini text-embedding-004 (for RAG) |
| **RAG Pipeline** | LangChain + ChromaDB + HuggingFace Embeddings |
| **OCR** | Tesseract.js (multi-language: eng+hin+tam+tel) |
| **Voice** | Web Speech API + Whisper ASR |
| **Auth** | JWT |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)
- Anthropic API Key

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/scheme-ai.git
cd scheme-ai
npm run install:all
```

### 2. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add:
#   MONGODB_URI=mongodb://localhost:27017/scheme-ai
#   ANTHROPIC_API_KEY=your_key_here
#   JWT_SECRET=your_jwt_secret
```

### 3. Run Development
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### 4. Seed Schemes Database (optional)
```bash
curl -X POST http://localhost:5000/api/schemes/seed
```

---

## 📁 Project Structure

```
scheme-ai/
├── frontend/                  # Vite + React app
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx      # Landing page
│   │   │   ├── ChatPage.jsx      # AI chat interface
│   │   │   ├── SchemesPage.jsx   # Browse schemes
│   │   │   ├── OCRPage.jsx       # Aadhaar OCR upload
│   │   │   └── DashboardPage.jsx # User dashboard
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                   # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── chat.js          # AI chat endpoint
│   │   │   ├── schemes.js       # Scheme CRUD + search
│   │   │   ├── ocr.js           # Document OCR
│   │   │   └── users.js         # User management
│   │   ├── services/
│   │   │   ├── claude.js        # 5-layer Claude prompt chain
│   │   │   ├── rag.js           # LangChain + ChromaDB RAG
│   │   │   └── ocr.js           # Tesseract.js OCR engine
│   │   ├── models/
│   │   │   └── index.js         # Mongoose schemas
│   │   ├── utils/
│   │   │   ├── db.js            # MongoDB connection
│   │   │   └── logger.js        # Winston logger
│   │   └── index.js             # Express entry point
│   └── .env.example
│
└── package.json               # Root monorepo scripts
```

---

## 🤖 AI Architecture — 5-Layer Prompt Chain

```
User Input (voice/text)
        │
        ▼
┌─────────────────────┐
│  Layer 1: PROFILE   │  Gemini Flash — silent extraction of age,
│  EXTRACTOR          │  income, state, occupation from natural talk
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Layer 2: SCHEME    │  LangChain RAG queries ChromaDB
│  RETRIEVAL          │  with Gemini text-embedding-004 vectors
│                     │  Top-20 chunks retrieved
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Layer 3: ELIGIBILITY│ Gemini Flash scores each scheme 0-100
│  SCORER             │  with plain-language reason
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Layer 4: ROADMAP   │  Gemini Pro generates step-by-step
│  GENERATOR          │  application guide
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Layer 5: EMOTION   │  Detects frustration/confusion,
│  CALIBRATOR         │  auto-simplifies response
└──────────┬──────────┘
           │
           ▼
    Response in user's language
    + Ranked scheme matches
    + Pre-filled form links
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message, get AI reply + matched schemes |
| GET | `/api/chat/history/:sessionId` | Get conversation history |
| GET | `/api/schemes` | List schemes (with filters) |
| GET | `/api/schemes/:id` | Get scheme details |
| POST | `/api/schemes/seed` | Seed initial scheme data |
| POST | `/api/ocr/extract` | Upload & extract ID document fields |
| POST | `/api/users` | Create/update user profile |
| GET | `/api/users/:id/schemes` | Get user's applied schemes |

---

## 🌍 Supported Languages

English · हिन्दी · தமிழ் · తెలుగు · বাংলা · मराठी · ಕನ್ನಡ · ગુજરાતી · ਪੰਜਾਬੀ · മലയാളം · ଓଡ଼ିଆ · অসমীয়া + more

---

## 📊 Impact Vision

- **500M+** underserved Indians targeted
- **1,000+** central & state schemes covered  
- **₹ Lakh Crore** in annual unclaimed benefits to unlock
- **28 states** scale roadmap

---

## 🔮 Roadmap

| Version | Features |
|---------|---------|
| **V1 (MVP)** | Voice chat, RAG scheme matching, OCR auto-fill, signature highlighter |
| **V2** | SMS fallback, Offline PWA, Caregiver Mode |
| **V3** | Village Officer Dashboard, Fraud Alert System |
| **V4** | RTI Filing, Application Status Tracker |
| **V5** | 1,000+ schemes, all 28 states |
| **V6** | NGO white-label version |

---

## 👥 Team

| Name | Role |
|------|------|
| Dilli Basker M | Team Lead / Backend |
| Moulitha C | Frontend / UI |
| Mohan B | AI / RAG Pipeline |
| Jothika J | OCR / Integration |

**Jaya Engineering College** — BE Computer Science & Engineering  
**HackNova 3.0** — Newton School Coding Club, SRM IST

---

## 📄 License

MIT — Built for social good. Use freely to help citizens.
