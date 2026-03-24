import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/elderly" element={<ElderlyPage />} />
        <Route path="/home" element={<><Navbar /><HomePage /></>} />
        <Route path="/login" element={<><Navbar /><LoginPage /></>} />
        <Route path="/chat" element={<><Navbar /><ProtectedRoute><ChatPage /></ProtectedRoute></>} />
        <Route path="/schemes" element={<><Navbar /><ProtectedRoute><SchemesPage /></ProtectedRoute></>} />
        <Route path="/ocr" element={<><Navbar /><ProtectedRoute><OCRPage /></ProtectedRoute></>} />
        <Route path="/dashboard" element={<><Navbar /><ProtectedRoute><DashboardPage /></ProtectedRoute></>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}