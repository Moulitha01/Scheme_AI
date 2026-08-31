// frontend/src/pages/HomePage.jsx
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()
  // HomePage just redirects to LandingPage
  navigate('/')
  return null
}