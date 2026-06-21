import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import IntroPage from './pages/IntroPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ElderlyPage from './pages/ElderlyPage'
import ChatPage from './pages/ChatPage'
import SchemesPage from './pages/SchemesPage'
import OCRPage from './pages/OCRPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <div className="min-h-screen gradient-bg">
      <Routes>
        {/* Entry point */}
        <Route path="/" element={<IntroPage />} />
        <Route path="/landing" element={<LandingPage />} />

        {/* No Navbar — these pages have their own headers */}
        <Route path="/elderly" element={<ElderlyPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/ocr" element={<OCRPage />} />

        {/* With Navbar */}
        <Route path="/home" element={<><Navbar /><HomePage /></>} />
        <Route path="/login" element={<><Navbar /><LoginPage /></>} />
        <Route path="/schemes" element={<><Navbar /><SchemesPage /></>} />
        <Route path="/dashboard" element={<><Navbar /><DashboardPage /></>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}