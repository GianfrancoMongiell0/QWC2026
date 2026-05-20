import { useState } from 'react'

export default function LeagueCard({ league, myPoints, onClick }) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async (e) => {
    e.stopPropagation() // no navegar a la liga
    try {
      await navigator.clipboard.writeText(league.code)
    } catch {
      const el = document.createElement('textarea')
      el.value = league.code
      el.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={onClick}
      style={{
        width:'100%', textAlign:'left', background:'#12121A',
        border:'1px solid #1E1E2E', borderRadius:'1rem', padding:'1rem',
        cursor:'pointer', transition:'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#00D4FF'; e.currentTarget.style.boxShadow='0 8px 40px rgba(0,212,255,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#1E1E2E'; e.currentTarget.style.boxShadow='none' }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1, minWidth:0, marginRight:'0.75rem' }}>
          <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'#F0F0FF', fontSize:'1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {league.name}
          </p>
          {league.description && (
            <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.75rem', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {league.description}
            </p>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.75rem' }}>
              👥 {league.member_count ?? 1} miembro{league.member_count !== 1 ? 's' : ''}
            </span>

            {/* Código con botón copiar rápido */}
            <button
              onClick={handleCopyCode}
              title="Copiar código"
              style={{
                display:'inline-flex', alignItems:'center', gap:4,
                fontFamily:'JetBrains Mono,monospace', fontSize:'0.7rem',
                color: copied ? '#00FF87' : '#8888AA',
                background: copied ? 'rgba(0,255,135,0.1)' : '#06060A',
                border: `1px solid ${copied ? 'rgba(0,255,135,0.3)' : '#1E1E2E'}`,
                borderRadius:'0.5rem', padding:'0.15rem 0.5rem',
                letterSpacing:'0.15em', cursor:'pointer', transition:'all 0.15s',
              }}
            >
              {copied ? '✓' : '📋'} {league.code}
            </button>
          </div>
        </div>

        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'1.5rem', color:'#FFD700' }}>
            {myPoints ?? 0}
          </p>
          <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem' }}>pts</p>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.75rem' }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap:6,
          fontFamily:'DM Sans,sans-serif', fontSize:'0.7rem',
          borderRadius:9999, padding:'0.2rem 0.65rem', border:'1px solid',
          borderColor: league.is_active ? 'rgba(0,255,135,0.25)' : '#1E1E2E',
          color:       league.is_active ? '#00FF87' : '#555570',
          background:  league.is_active ? 'rgba(0,255,135,0.08)' : 'transparent',
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: league.is_active ? '#00FF87' : '#555570', display:'inline-block' }} />
          {league.is_active ? 'Activa' : 'Finalizada'}
        </span>
        <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.875rem' }}>Ver →</span>
      </div>
    </button>
  )
}
