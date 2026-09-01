// frontend/src/pages/DashboardPage.jsx
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const MOCK_SCHEMES = [
  { name: 'PM-KISAN Samman Nidhi', status: 'applied', benefit: '₹6,000/year', ministry: 'Ministry of Agriculture', date: '2026-07-15' },
  { name: 'Ayushman Bharat PM-JAY', status: 'discovered', benefit: '₹5 lakh/year', ministry: 'Ministry of Health', date: '2026-07-20' },
  { name: 'Kalaignar Magalir Urimai', status: 'approved', benefit: '₹1,000/month', ministry: 'Govt of Tamil Nadu', date: '2026-06-10' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('schemes')

  const STATUS_CONFIG = {
    discovered: { label: t('dashboard.status.discovered', 'Discovered'), color: '#1a56a0', bg: '#e8f0fb' },
    applied: { label: t('dashboard.status.applied', 'Applied'), color: '#a07000', bg: '#fff8e8' },
    submitted: { label: t('dashboard.status.submitted', 'Submitted'), color: '#7a4a1a', bg: '#fff0e8' },
    approved: { label: t('dashboard.status.approved', 'Approved'), color: '#1a7a1a', bg: '#e8f8e8' },
    rejected: { label: t('dashboard.status.rejected', 'Rejected'), color: '#c0392b', bg: '#fde8e8' },
  }

  const PROFILE_FIELDS = [
    { label: t('dashboard.profile.age', 'Age'), value: t('dashboard.profile.notSet', 'Not set'), icon: '🎂' },
    { label: t('dashboard.profile.gender', 'Gender'), value: t('dashboard.profile.notSet', 'Not set'), icon: '👤' },
    { label: t('dashboard.profile.state', 'State'), value: t('dashboard.profile.notSet', 'Not set'), icon: '🗺️' },
    { label: t('dashboard.profile.occupation', 'Occupation'), value: t('dashboard.profile.notSet', 'Not set'), icon: '💼' },
    { label: t('dashboard.profile.casteCategory', 'Caste Category'), value: t('dashboard.profile.notSet', 'Not set'), icon: '📋' },
  ]

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#f8f9fc' }}>
      {/* Tricolor */}
      <div style={{ height: 5, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '2px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      <div style={{ padding: '32px 5%' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>
            {t('dashboard.title', 'My Dashboard')}
          </h1>
          <p style={{ fontSize: 15, color: '#888', margin: 0 }}>
            {t('dashboard.subtitle', 'Track your scheme applications and discoveries')}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: t('dashboard.stats.discovered', 'Discovered'), value: 2, icon: '🔍', color: '#1a56a0', bg: '#e8f0fb' },
            { label: t('dashboard.stats.applied', 'Applied'), value: 1, icon: '📝', color: '#a07000', bg: '#fff8e8' },
            { label: t('dashboard.stats.approved', 'Approved'), value: 1, icon: '✅', color: '#1a7a1a', bg: '#e8f8e8' },
            { label: t('dashboard.stats.totalBenefits', 'Total Benefits'), value: '₹7,000+/mo', icon: '💰', color: '#7a1a7a', bg: '#f8e8f8' },
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
              {tab === 'schemes' ? t('dashboard.mySchemes', '📋 My Schemes') : t('dashboard.myProfile', '👤 My Profile')}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px' }}>
              {t('dashboard.yourProfile', 'Your Profile')}
            </h3>
            {PROFILE_FIELDS.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < PROFILE_FIELDS.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <span style={{ fontSize: 22 }}>{f.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</div>
                  <div style={{ fontSize: 15, color: '#1a1a2e', fontWeight: 600, marginTop: 2 }}>{f.value}</div>
                </div>
              </div>
            ))}
            <button onClick={() => navigate('/chat')}
              style={{ marginTop: 20, background: 'linear-gradient(135deg, #FF6B00, #FFAA00)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              {t('dashboard.updateViaChat', '🎙️ Update via AI Chat')}
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