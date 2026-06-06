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

// Avatar: usa line-height = height para centrado perfecto sin flexbox
function Avatar({ letter, isMe }) {
  const size = 40
  return (
    <div style={{
      width:           `${size}px`,
      height:          `${size}px`,
      borderRadius:    '50%',
      background:      isMe ? 'rgba(0,255,135,0.18)' : C.darker,
      border:          `2px solid ${isMe ? 'rgba(0,255,135,0.5)' : C.border}`,
      // Centrado vertical con line-height = height (más fiable que flex en html2canvas)
      lineHeight:      `${size - 4}px`,   // -4 por los 2px de border × 2
      textAlign:       'center',
      fontFamily:      'Arial Black, Arial, sans-serif',
      fontWeight:      900,
      fontSize:        '17px',
      color:           isMe ? C.green : C.silver,
      // Forzar que no herede estilos que rompan el centrado
      display:         'block',
      overflow:        'hidden',
      boxSizing:       'border-box',
    }}>
      {letter}
    </div>
  )
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
          const style = clonedDoc.createElement('style')
          style.innerHTML = `* { box-sizing: border-box !important; margin: 0 !important; }`
          clonedDoc.head.appendChild(style)
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
      {/* Área capturada */}
      <div ref={tableRef} style={{ background: C.bg, padding: '20px', borderRadius: '16px' }}>

        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
          <tbody>
            <tr>
              <td style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '20px', fontWeight: 900, color: C.green, letterSpacing: '2px', paddingBottom: '12px' }}>
                WC26 ⚽ {leagueName ? `· ${leagueName}` : ''}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'Arial, sans-serif', fontSize: '12px', color: C.muted, paddingBottom: '12px' }}>
                {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ height: '1px', background: C.border, marginBottom: '12px' }} />

        {/* Filas */}
        {standings.map(({ users_profiles: p, points }, i) => {
          const isMe    = p?.id === user?.id
          const ptColor = i===0 ? C.gold : i===1 ? C.silver : i===2 ? C.purple : isMe ? C.green : C.text
          const name    = p?.full_name || p?.username || '?'
          const initial = (p?.username?.[0] || '?').toUpperCase()

          return (
            <div key={p?.id} style={{
              background:   isMe ? 'rgba(0,255,135,0.08)' : C.surface,
              border:       `1px solid ${isMe ? 'rgba(0,255,135,0.35)' : C.border}`,
              borderRadius: '12px',
              marginBottom: '8px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    {/* Posición */}
                    <td style={{ width: '44px', textAlign: 'center', verticalAlign: 'middle', padding: '14px 6px 14px 14px' }}>
                      {i < 3
                        ? <span style={{ fontSize: '20px' }}>{MEDALS[i]}</span>
                        : <span style={{ fontFamily: 'Arial, sans-serif', color: C.muted, fontSize: '15px', fontWeight: 700 }}>{i + 1}</span>
                      }
                    </td>

                    {/* Avatar */}
                    <td style={{ width: '52px', verticalAlign: 'middle', padding: '14px 8px' }}>
                      <Avatar letter={initial} isMe={isMe} />
                    </td>

                    {/* Nombre */}
                    <td style={{ verticalAlign: 'middle', padding: '14px 8px' }}>
                      <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '15px', color: isMe ? C.green : C.text, whiteSpace: 'nowrap' }}>
                        {name}{isMe && <span style={{ fontSize: '11px', marginLeft: '5px', opacity: 0.6 }}>(tú)</span>}
                      </div>
                      <div style={{ fontFamily: 'Arial, sans-serif', color: C.muted, fontSize: '12px', marginTop: '3px' }}>
                        @{p?.username}
                      </div>
                    </td>

                    {/* Puntos */}
                    <td style={{ width: '56px', textAlign: 'right', verticalAlign: 'middle', padding: '14px 14px 14px 8px' }}>
                      <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: '26px', color: ptColor, lineHeight: 1 }}>
                        {points}
                      </div>
                      <div style={{ fontFamily: 'Arial, sans-serif', color: C.muted, fontSize: '11px', marginTop: '2px' }}>
                        pts
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}

        {/* Footer */}
        <div style={{ height: '1px', background: C.border, margin: '4px 0 10px' }} />
        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: C.faint, textAlign: 'center', margin: 0 }}>
          qwc-2026.vercel.app · FIFA World Cup 2026
        </p>
      </div>

      {/* Botón compartir */}
      <button
        onClick={handleShare}
        disabled={sharing}
        style={{
          width: '100%', marginTop: '12px', padding: '12px', borderRadius: '14px',
          border: '1px solid rgba(0,212,255,0.3)',
          background: sharing ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.08)',
          color: '#00D4FF', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.875rem',
          cursor: sharing ? 'wait' : 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
        onMouseEnter={e => { if (!sharing) e.currentTarget.style.background = 'rgba(0,212,255,0.15)' }}
        onMouseLeave={e => { if (!sharing) e.currentTarget.style.background = 'rgba(0,212,255,0.08)' }}
      >
        {sharing ? (
          <>
            <span style={{ width: 16, height: 16, border: '2px solid rgba(0,212,255,0.3)', borderTopColor: '#00D4FF', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            Generando imagen...
          </>
        ) : <>📸 Compartir posiciones</>}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}