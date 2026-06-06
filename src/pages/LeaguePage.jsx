import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const MEDALS = ['🥇', '🥈', '🥉']

const C = {
  bg:      '#0A0A0F',
  surface: '#12121A',
  border:  '#1E1E2E',
  darker:  '#06060A',
  green:   '#00FF87',
  purple:  '#8B5CF6',
  gold:    '#FFD700',
  silver:  '#8888AA',
  text:    '#F0F0FF',
  muted:   '#555570',
  faint:   '#333355',
}

export default function StandingsTable({ standings, leagueName = '' }) {
  const { user }              = useAuth()
  const tableRef              = useRef(null)
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      await document.fonts.ready

      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: C.bg,
        scale:           3,
        useCORS:         true,
        allowTaint:      true,
        logging:         false,
        imageTimeout:    0,
        onclone: (clonedDoc) => {
          clonedDoc.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
        },
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'posiciones-wc2026.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `🏆 ${leagueName} — WC 2026`,
            text:  '¡Mira las posiciones de la Quiniela del Mundial! ⚽',
            files: [file],
          })
        } else {
          const url = URL.createObjectURL(blob)
          const a   = document.createElement('a')
          a.href = url; a.download = 'posiciones-wc2026.png'; a.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch (err) {
      console.error('Share error:', err)
    } finally {
      setSharing(false)
    }
  }

  if (!standings.length) return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '1rem', padding: '2.5rem', textAlign: 'center' }}>
      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📊</span>
      <p style={{ fontFamily: 'DM Sans,sans-serif', color: C.silver, fontSize: '0.875rem' }}>
        Los puntos aparecerán cuando terminen los primeros partidos.
      </p>
    </div>
  )

  return (
    <div>
      <div ref={tableRef} style={{ background: C.bg, padding: '20px', borderRadius: '16px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', paddingBottom:'12px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontFamily:'Arial Black,sans-serif', fontSize:'22px', fontWeight:900, color:C.green, letterSpacing:'2px' }}>
              WC26 ⚽
            </span>
            {leagueName && (
              <span style={{ fontFamily:'Arial,sans-serif', fontSize:'14px', color:C.silver }}>
                · {leagueName}
              </span>
            )}
          </div>
          <span style={{ fontFamily:'Arial,sans-serif', fontSize:'12px', color:C.muted }}>
            {new Date().toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' })}
          </span>
        </div>

        {/* Filas */}
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {standings.map(({ users_profiles: p, points }, i) => {
            const isMe    = p?.id === user?.id
            const ptColor = i===0 ? C.gold : i===1 ? C.silver : i===2 ? C.purple : isMe ? C.green : C.text
            return (
              <div key={p?.id} style={{
                background:   isMe ? 'rgba(0,255,135,0.08)' : C.surface,
                border:       `1px solid ${isMe ? 'rgba(0,255,135,0.35)' : C.border}`,
                borderRadius: '12px', padding:'12px 16px',
                display:'flex', alignItems:'center', gap:'12px',
              }}>
                <div style={{ width:'28px', textAlign:'center', flexShrink:0 }}>
                  {i < 3
                    ? <span style={{ fontSize:'20px' }}>{MEDALS[i]}</span>
                    : <span style={{ fontFamily:'Arial,sans-serif', color:C.muted, fontSize:'14px', fontWeight:700 }}>{i+1}</span>
                  }
                </div>
                <div style={{
                  width:'38px', height:'38px', borderRadius:'50%', flexShrink:0,
                  background: isMe ? 'rgba(0,255,135,0.18)' : C.darker,
                  border:`1.5px solid ${isMe ? 'rgba(0,255,135,0.5)' : C.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'Arial Black,sans-serif', fontWeight:900, fontSize:'16px',
                  color: isMe ? C.green : C.silver,
                }}>
                  {p?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontFamily:'Arial,sans-serif', fontWeight:700, fontSize:'15px', color:isMe?C.green:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>
                    {p?.full_name || p?.username}
                    {isMe && <span style={{ fontSize:'11px', marginLeft:'6px', opacity:0.6 }}>(tú)</span>}
                  </p>
                  <p style={{ fontFamily:'Arial,sans-serif', color:C.muted, fontSize:'12px', margin:'2px 0 0 0' }}>
                    @{p?.username}
                  </p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontFamily:'Arial Black,sans-serif', fontWeight:900, fontSize:'24px', color:ptColor, margin:0, lineHeight:1 }}>
                    {points}
                  </p>
                  <p style={{ fontFamily:'Arial,sans-serif', color:C.muted, fontSize:'11px', margin:'2px 0 0 0' }}>pts</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <p style={{ fontFamily:'Arial,sans-serif', fontSize:'11px', color:C.faint, textAlign:'center', marginTop:'14px', paddingTop:'12px', borderTop:`1px solid ${C.border}` }}>
          qwc-2026.vercel.app · FIFA World Cup 2026
        </p>
      </div>

      {/* Botón fuera de la captura */}
      <button
        onClick={handleShare}
        disabled={sharing}
        style={{
          width:'100%', marginTop:'12px', padding:'12px', borderRadius:'14px',
          border:'1px solid rgba(0,212,255,0.3)',
          background: sharing ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.08)',
          color:'#00D4FF', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.875rem',
          cursor: sharing ? 'wait' : 'pointer', transition:'all 0.15s',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
        }}
        onMouseEnter={e=>{ if(!sharing) e.currentTarget.style.background='rgba(0,212,255,0.15)' }}
        onMouseLeave={e=>{ if(!sharing) e.currentTarget.style.background='rgba(0,212,255,0.08)' }}
      >
        {sharing ? (
          <>
            <span style={{ width:16, height:16, border:'2px solid rgba(0,212,255,0.3)', borderTopColor:'#00D4FF', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />
            Generando imagen...
          </>
        ) : <>📸 Compartir posiciones</>}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}