// frontend/src/pages/SchemesPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CATEGORIES = ['All', 'Agriculture', 'Education', 'Health', 'Housing', 'Women & Child', 'Finance', 'Employment', 'Disability']

const STATES = [
  'All States', 'Central', 'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh',
  'Telangana', 'Maharashtra', 'Gujarat', 'Uttar Pradesh', 'West Bengal',
  'Rajasthan', 'Bihar', 'Madhya Pradesh', 'Odisha', 'Punjab', 'Haryana',
  'Assam', 'Delhi', 'Jharkhand', 'Uttarakhand',
]

const CAT_ICONS = {
  Agriculture: '🌾', Education: '📚', Health: '🏥', Housing: '🏠',
  Finance: '💳', Employment: '👷', 'Women & Child': '👩', Disability: '♿', Other: '📋',
}

const CAT_COLORS = {
  Agriculture: '#1a7a4a', Education: '#1a56a0', Health: '#c0392b', Housing: '#7a4a1a',
  Finance: '#4a1a7a', Employment: '#1a4a7a', 'Women & Child': '#8b1a4a', Disability: '#1a4a4a', Other: '#555',
}

export default function SchemesPage() {
  const navigate = useNavigate()
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [state, setState] = useState('All States')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchSchemes()
  }, [category, state, page])

  const fetchSchemes = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (category !== 'All') params.category = category
      if (state !== 'All States') params.state = state
      if (search) params.search = search
      const { data } = await axios.get('/api/schemes', { params })
      setSchemes(data.schemes || [])
      setTotal(data.total || 0)
    } catch {
      setSchemes([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchSchemes()
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8f9fc', minHeight: '100vh', color: '#1a1a2e' }}>

      {/* Tricolor top */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '1px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1050, #2a1a80)',
        padding: '40px 5%', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
          Browse All Government Schemes
        </h1>
        <p style={{ fontSize: 15, color: '#b0c4e8', margin: '0 0 24px' }}>
          {total.toLocaleString()}+ central and state schemes — search by name, category or state
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schemes e.g. PM-KISAN, scholarship, housing..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none',
              fontSize: 14, background: 'rgba(255,255,255,0.95)',
              color: '#1a1a2e', outline: 'none',
            }}
          />
          <button type="submit" style={{
            background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Search</button>
        </form>
      </div>

      <div style={{ padding: '24px 5%' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat}
                onClick={() => { setCategory(cat); setPage(1) }}
                style={{
                  background: category === cat ? '#FF6B00' : '#fff',
                  color: category === cat ? '#fff' : '#555',
                  border: category === cat ? '1px solid #FF6B00' : '1px solid #e0e0e0',
                  borderRadius: 20, padding: '6px 14px', fontSize: 13,
                  fontWeight: category === cat ? 600 : 400, cursor: 'pointer',
                }}>
                {cat !== 'All' && CAT_ICONS[cat]} {cat}
              </button>
            ))}
          </div>

          {/* State filter */}
          <select
            value={state}
            onChange={e => { setState(e.target.value); setPage(1) }}
            style={{
              border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 12px',
              fontSize: 13, color: '#333', background: '#fff', cursor: 'pointer',
              marginLeft: 'auto',
            }}>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Results count */}
        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          Showing {schemes.length} of {total.toLocaleString()} schemes
          {category !== 'All' && ` in ${category}`}
          {state !== 'All States' && ` for ${state}`}
        </p>

        {/* Scheme grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ color: '#888' }}>Loading schemes...</p>
          </div>
        ) : schemes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ color: '#888', fontSize: 16 }}>No schemes found. Try different filters.</p>
            <button onClick={() => { setCategory('All'); setState('All States'); setSearch(''); setPage(1) }}
              style={{
                background: '#FF6B00', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 20px', marginTop: 12, cursor: 'pointer',
              }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {schemes.map((scheme, i) => {
              const color = CAT_COLORS[scheme.category] || '#555'
              const icon = CAT_ICONS[scheme.category] || '📋'
              const isState = scheme.state && scheme.state !== 'Central'
              return (
                <div key={i} style={{
                  background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16,
                  padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${color}15`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 20, border: `1px solid ${color}25`,
                    }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: 14, fontWeight: 600, color: '#1a1a2e',
                        margin: '0 0 4px', lineHeight: 1.4,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>{scheme.name}</h3>
                      <p style={{ fontSize: 12, color, margin: 0, fontWeight: 500 }}>
                        {scheme.ministry || 'Government of India'}
                      </p>
                    </div>
                  </div>

                  {scheme.benefit && scheme.benefit !== 'Check official portal' && scheme.benefit !== 'See official portal' && (
                    <div style={{
                      background: '#f0faf0', border: '1px solid #c0e8c0',
                      borderRadius: 8, padding: '8px 12px', marginBottom: 12,
                    }}>
                      <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px' }}>BENEFIT</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a7a1a', margin: 0 }}>
                        ✓ {scheme.benefit}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      background: `${color}15`, color, fontSize: 11,
                      fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      border: `1px solid ${color}30`,
                    }}>{scheme.category || 'Other'}</span>
                    <span style={{
                      background: isState ? '#f0fff5' : '#fff8f0',
                      color: isState ? '#1a7a4a' : '#a05000',
                      fontSize: 11, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 20, border: `1px solid ${isState ? '#90d0a0' : '#ffd0a0'}`,
                    }}>
                      {isState ? `🗺️ ${scheme.state}` : '🏛️ Central'}
                    </span>
                    {scheme.applyLink && (
                      <a href={scheme.applyLink} target="_blank" rel="noreferrer"
                        style={{ marginLeft: 'auto', fontSize: 12, color: '#1a56a0', fontWeight: 600 }}
                        onClick={e => e.stopPropagation()}>
                        Apply →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                background: page === 1 ? '#f0f0f0' : '#fff',
                color: page === 1 ? '#aaa' : '#333',
                border: '1px solid #e0e0e0', borderRadius: 8,
                padding: '8px 16px', cursor: page === 1 ? 'default' : 'pointer',
              }}>← Prev</button>
            <span style={{ padding: '8px 16px', fontSize: 13, color: '#555' }}>
              Page {page} of {Math.ceil(total / 12)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 12)}
              style={{
                background: page >= Math.ceil(total / 12) ? '#f0f0f0' : '#FF6B00',
                color: page >= Math.ceil(total / 12) ? '#aaa' : '#fff',
                border: 'none', borderRadius: 8,
                padding: '8px 16px', cursor: page >= Math.ceil(total / 12) ? 'default' : 'pointer',
              }}>Next →</button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1050, #2a1a80)',
        padding: '32px 5%', textAlign: 'center', marginTop: 40,
      }}>
        <p style={{ color: '#b0c4e8', fontSize: 15, margin: '0 0 16px' }}>
          Not sure which scheme you qualify for?
        </p>
        <button onClick={() => navigate('/chat')}
          style={{
            background: 'linear-gradient(135deg, #FF6B00, #FFAA00)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
          🎙️ Talk to AI — find your schemes
        </button>
      </div>

      {/* Tricolor bottom */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: '#FF6B00' }} />
        <div style={{ flex: 1, background: '#fff', borderTop: '1px solid #eee' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>
    </div>
  )
}