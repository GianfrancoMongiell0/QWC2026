import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1E1E2E',
    }}>
      <div style={{
        maxWidth: 640, margin: '0 auto', padding: '0 1rem',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="font-display neon-green"
          style={{ fontSize: '1.5rem', letterSpacing: '0.1em', color: '#00FF87', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          WC26 ⚽
        </button>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif',
                border: '1px solid rgba(255,215,0,0.4)', borderRadius: '9999px',
                padding: '0.25rem 0.75rem', color: '#FFD700', background: 'transparent',
                cursor: 'pointer',
              }}
            >
              ⚙️ Admin
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,255,135,0.15)', border: '1px solid rgba(0,255,135,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.875rem', fontWeight: 700, color: '#00FF87',
            }}>
              {profile?.username?.[0]?.toUpperCase() ?? '?'}
            </div>

            <div style={{ display: 'none' }} className="sm:block">
              <p style={{ fontSize: '0.75rem', color: '#8888AA', lineHeight: 1 }}>
                {profile?.username}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#FFD700', fontFamily: 'JetBrains Mono', lineHeight: 1, marginTop: 2 }}>
                {profile?.total_points ?? 0}pts
              </p>
            </div>

            {/* BOTÓN SALIR */}
            <button
              onClick={signOut}
              style={{
                fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif',
                color: '#555570', background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.25rem 0.5rem', borderRadius: '0.5rem', transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.target.style.color = '#FF3366'}
              onMouseLeave={e => e.target.style.color = '#555570'}
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
