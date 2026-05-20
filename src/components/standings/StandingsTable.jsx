import { useAuth } from '../../context/AuthContext'
const MEDALS = ['🥇','🥈','🥉']

export default function StandingsTable({ standings }) {
  const { user } = useAuth()
  if (!standings.length) return (
    <div className="glass-card" style={{ padding:'2.5rem', textAlign:'center' }}>
      <span style={{ fontSize:'2.5rem', display:'block', marginBottom:'0.75rem' }}>📊</span>
      <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.875rem' }}>
        Los puntos aparecerán cuando terminen los primeros partidos.
      </p>
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
      {standings.map(({ users_profiles: p, points }, i) => {
        const isMe = p?.id === user?.id
        return (
          <div key={p?.id} style={{
            background: isMe ? 'rgba(0,255,135,0.05)' : '#12121A',
            border: `1px solid ${isMe ? 'rgba(0,255,135,0.3)' : '#1E1E2E'}`,
            borderRadius:'1rem', padding:'0.875rem 1rem',
            display:'flex', alignItems:'center', gap:'0.75rem',
          }}>
            <div style={{ width:32, textAlign:'center', flexShrink:0 }}>
              {i < 3
                ? <span style={{ fontSize:'1.25rem' }}>{MEDALS[i]}</span>
                : <span style={{ fontFamily:'JetBrains Mono,monospace', color:'#555570', fontSize:'0.875rem', fontWeight:700 }}>{i+1}</span>
              }
            </div>
            <div style={{
              width:36, height:36, borderRadius:'50%', flexShrink:0,
              background: isMe ? 'rgba(0,255,135,0.15)' : '#06060A',
              border: `1px solid ${isMe ? 'rgba(0,255,135,0.4)' : '#1E1E2E'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontSize:'0.875rem',
              color: isMe ? '#00FF87' : '#8888AA',
            }}>
              {p?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.9rem', color: isMe ? '#00FF87' : '#F0F0FF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {p?.full_name || p?.username}
                {isMe && <span style={{ fontSize:'0.7rem', marginLeft:6, opacity:0.6 }}>(tú)</span>}
              </p>
              <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.75rem' }}>@{p?.username}</p>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <p style={{
                fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'1.375rem',
                color: i===0?'#FFD700': i===1?'#8888AA': i===2?'#8B5CF6': isMe?'#00FF87':'#F0F0FF',
              }}>{points}</p>
              <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem' }}>pts</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
