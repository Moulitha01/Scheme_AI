// frontend/src/pages/DashboardPage.jsx
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const MOCK_SCHEMES = [
  { name: 'PM-KISAN Samman Nidhi', status: 'applied', benefit: '₹6,000/year', ministry: 'Ministry of Agriculture', date: '2026-07-15' },
  { name: 'Ayushman Bharat PM-JAY', status: 'discovered', benefit: '₹5 lakh/year', ministry: 'Ministry of Health', date: '2026-07-20' },
  { name: 'Kalaignar Magalir Urimai', status: 'approved', benefit: '₹1,000/month', ministry: 'Govt of Tamil Nadu', date: '2026-06-10' },
]

const STATUS_CONFIG = {
  discovered: { label: 'Discovered', color: '#1a56a0', bg: '#e8f0fb' },
  applied: { label: 'Applied', color: '#a07000', bg: '#fff8e8' },
  submitted: { label: 'Submitted', color: '#7a4a1a', bg: '#fff0e8' },
  approved: { label: 'Approved', color: '#1a7a1a', bg: '#e8f8e8' },
  rejected: { label: 'Rejected', color: '#c0392b', bg: '#fde8e8' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('schemes')

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
          {['Home', 'Talk to AI', 'Schemes', 'Scan ID', 'Dashboard'].map((tab, i) => (
            <button key={tab}
              onClick={() => i === 0 ? navigate('/') : i === 1 ? navigate('/chat') : i === 2 ? navigate('/schemes') : i === 3 ? navigate('/ocr') : null}
              style={{
                background: i === 4 ? '#fff8f0' : 'transparent',
                color: i === 4 ? '#FF6B00' : '#555',
                border: i === 4 ? '1px solid #ffd0a0' : '1px solid transparent',
                borderRadius: 8, padding: '7px 16px', fontSize: 14,
                fontWeight: i === 4 ? 700 : 400, cursor: 'pointer',
              }}>{tab}</button>
          ))}
        </div>
        <button onClick={() => navigate('/chat')}
          style={{ background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          🎙️ Talk to AI
        </button>
      </nav>

      <div style={{ padding: '32px 5%' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>My Dashboard</h1>
          <p style={{ fontSize: 15, color: '#888', margin: 0 }}>Track your scheme applications and discoveries</p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Discovered', value: 2, icon: '🔍', color: '#1a56a0', bg: '#e8f0fb' },
            { label: 'Applied', value: 1, icon: '📝', color: '#a07000', bg: '#fff8e8' },
            { label: 'Approved', value: 1, icon: '✅', color: '#1a7a1a', bg: '#e8f8e8' },
            { label: 'Total Benefits', value: '₹7,000+/mo', icon: '💰', color: '#7a1a7a', bg: '#f8e8f8' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '20px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['schemes', 'profile'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#FF6B00' : '#fff',
                color: activeTab === tab ? '#fff' : '#555',
                border: activeTab === tab ? 'none' : '1px solid #e0e0e0',
                borderRadius: 10, padding: '10px 22px', fontSize: 14,
                fontWeight: activeTab === tab ? 700 : 400, cursor: 'pointer',
              }}>
              {tab === 'schemes' ? '📋 My Schemes' : '👤 My Profile'}
            </button>
          ))}
        </div>

        {activeTab === 'schemes' && (
          <div>
            {MOCK_SCHEMES.map((s, i) => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.discovered
              return (
                <div key={i} style={{
                  background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16,
                  padding: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: 32 }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>{s.name}</h3>
                    <p style={{ fontSize: 13, color: '#888', margin: '0 0 6px' }}>{s.ministry}</p>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a7a1a' }}>✓ {s.benefit}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 13, padding: '4px 14px', borderRadius: 20 }}>
                      {cfg.label}
                    </span>
                    <p style={{ fontSize: 12, color: '#aaa', margin: '6px 0 0' }}>{s.date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px' }}>Your Profile</h3>
            {[
              { label: 'Age', value: 'Not set', icon: '🎂' },
              { label: 'Gender', value: 'Not set', icon: '👤' },
              { label: 'State', value: 'Not set', icon: '🗺️' },
              { label: 'Occupation', value: 'Not set', icon: '💼' },
              { label: 'Caste Category', value: 'Not set', icon: '📋' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none' }}>
                <span style={{ fontSize: 22 }}>{f.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</div>
                  <div style={{ fontSize: 15, color: '#1a1a2e', fontWeight: 600, marginTop: 2 }}>{f.value}</div>
                </div>
              </div>
            ))}
            <button onClick={() => navigate('/chat')}
              style={{ marginTop: 20, background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              🎙️ Update via AI Chat
            </button>
          </div>
        )}
      </div>

      <div style={{ height: 5, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '2px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>
    </div>
  )
}