import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMyLeagues } from '../hooks/useLeague'
import Navbar from '../components/layout/Navbar'
import LeagueCard from '../components/leagues/LeagueCard'
import CreateLeagueModal from '../components/leagues/CreateLeagueModal'
import JoinLeagueModal   from '../components/leagues/JoinLeagueModal'
import Spinner from '../components/ui/Spinner'

export default function DashboardPage() {
  const { profile }  = useAuth()
  const navigate     = useNavigate()
  const { leagues, loading, refetch } = useMyLeagues()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin,   setShowJoin]   = useState(false)

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem 6rem' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom: 4 }}>
            Bienvenido de nuevo
          </p>
          <h2 className="font-display" style={{ fontSize: '2.5rem', color:'#F0F0FF', letterSpacing:'0.05em' }}>
            {profile?.full_name || profile?.username || '—'}
          </h2>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
            <span style={{ fontFamily:'JetBrains Mono,monospace', color:'#FFD700', fontSize:'1.25rem', fontWeight:700 }}>
              {profile?.total_points ?? 0}
            </span>
            <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.875rem' }}>pts totales</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'2rem' }}>
          {[
            { icon:'🏆', title:'Crear Liga', sub:'Invita a tu equipo', action: () => setShowCreate(true), hover: '#00FF87' },
            { icon:'🔗', title:'Unirme a Liga', sub:'Usa un código', action: () => setShowJoin(true), hover: '#00D4FF' },
          ].map(b => (
            <button key={b.title} onClick={b.action} style={{
              background:'#12121A', border:'1px solid #1E1E2E', borderRadius:'1rem',
              padding:'1rem', textAlign:'left', cursor:'pointer', transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = b.hover }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E2E' }}
            >
              <span style={{ fontSize:'1.75rem', display:'block', marginBottom:8 }}>{b.icon}</span>
              <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'#F0F0FF', fontSize:'0.9rem' }}>{b.title}</p>
              <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.75rem', marginTop:2 }}>{b.sub}</p>
            </button>
          ))}
        </div>

        {/* League list */}
        <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:'0.7rem', color:'#555570', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'0.75rem' }}>
          Mis Ligas ({leagues.length})
        </p>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
            <Spinner />
          </div>
        ) : leagues.length === 0 ? (
          <div className="glass-card" style={{ padding:'2.5rem', textAlign:'center' }}>
            <span style={{ fontSize:'2.5rem', display:'block', marginBottom:'0.75rem' }}>⚽</span>
            <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.9rem' }}>
              Aún no perteneces a ninguna liga.<br />¡Crea una o únete con un código!
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {leagues.map(({ leagues: lg, points }) => (
              <LeagueCard
                key={lg.id} league={lg} myPoints={points}
                onClick={() => navigate(`/liga/${lg.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateLeagueModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refetch() }} />
      <JoinLeagueModal   open={showJoin}   onClose={() => setShowJoin(false)}   onJoined={() => { setShowJoin(false); refetch() }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
