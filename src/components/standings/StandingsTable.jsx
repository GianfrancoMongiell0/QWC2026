import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const MEDALS = ['🥇', '🥈', '🥉']

export default function StandingsTable({ standings, leagueName = '' }) {
  const { user }       = useAuth()
  const tableRef       = useRef(null)
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      // Importar html2canvas dinámicamente (lazy load)
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#0A0A0F',
        scale: 2,             // Alta resolución
        useCORS: true,
        logging: false,
        // Ignorar el botón de compartir en la captura
        ignoreElements: el => el.dataset.noCapture === 'true',
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return

        const file = new File([blob], 'posiciones-wc2026.png', { type: 'image/png' })

        // Intentar Web Share API (móvil nativo)
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `🏆 ${leagueName} — Posiciones WC 2026`,
            text: '¡Mira cómo voy en la Quiniela del Mundial 2026! ⚽',
            files: [file],
          })
        } else {
          // Fallback: descargar la imagen
          const url = URL.createObjectURL(blob)
          const a   = document.createElement('a')
          a.href     = url
          a.download = 'posiciones-wc2026.png'
          a.click()
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
    <div style={{
      background: '#12121A', border: '1px solid #1E1E2E',
      borderRadius: '1rem', padding: '2.5rem', textAlign: 'center',
    }}>
      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📊</span>
      <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#8888AA', fontSize: '0.875rem' }}>
        Los puntos aparecerán cuando terminen los primeros partidos.
      </p>
    </div>
  )

  return (
    <div>
      {/* Área capturada por html2canvas */}
      <div ref={tableRef} style={{
        background: '#0A0A0F',
        borderRadius: '1rem',
        padding: '1rem',
        border: '1px solid #1E1E2E',
      }}>
        {/* Header de la captura */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '0.875rem', paddingBottom: '0.75rem',
          borderBottom: '1px solid #1E1E2E',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'Bebas Neue, Impact, sans-serif',
              fontSize: '1.25rem', color: '#00FF87',
              letterSpacing: '0.1em',
              textShadow: '0 0 20px rgba(0,255,135,0.6)',
            }}>
              WC26 ⚽
            </span>
            {leagueName && (
              <span style={{
                fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem',
                color: '#8888AA',
              }}>
                · {leagueName}
              </span>
            )}
          </div>
          <span style={{
            fontFamily: 'DM Sans,sans-serif', fontSize: '0.7rem',
            color: '#555570',
          }}>
            {new Date().toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' })}
          </span>
        </div>

        {/* Tabla */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {standings.map(({ users_profiles: p, points }, i) => {
            const isMe = p?.id === user?.id
            return (
              <div key={p?.id} style={{
                background:    isMe ? 'rgba(0,255,135,0.07)' : '#12121A',
                border:        `1px solid ${isMe ? 'rgba(0,255,135,0.3)' : '#1E1E2E'}`,
                borderRadius:  '0.875rem',
                padding:       '0.75rem 1rem',
                display:       'flex',
                alignItems:    'center',
                gap:           '0.75rem',
              }}>
                {/* Posición */}
                <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                  {i < 3
                    ? <span style={{ fontSize: '1.125rem' }}>{MEDALS[i]}</span>
                    : <span style={{ fontFamily: 'JetBrains Mono,monospace', color: '#555570', fontSize: '0.8rem', fontWeight: 700 }}>{i + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: isMe ? 'rgba(0,255,135,0.15)' : '#06060A',
                  border: `1px solid ${isMe ? 'rgba(0,255,135,0.4)' : '#1E1E2E'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.875rem',
                  color: isMe ? '#00FF87' : '#8888AA',
                }}>
                  {p?.username?.[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Nombre */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'DM Sans,sans-serif', fontWeight: 600,
                    fontSize: '0.875rem', color: isMe ? '#00FF87' : '#F0F0FF',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p?.full_name || p?.username}
                    {isMe && <span style={{ fontSize: '0.65rem', marginLeft: 5, opacity: 0.6 }}>(tú)</span>}
                  </p>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#555570', fontSize: '0.7rem' }}>
                    @{p?.username}
                  </p>
                </div>

                {/* Puntos */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{
                    fontFamily: 'JetBrains Mono,monospace', fontWeight: 700,
                    fontSize: '1.375rem',
                    color: i === 0 ? '#FFD700'
                         : i === 1 ? '#8888AA'
                         : i === 2 ? '#8B5CF6'
                         : isMe    ? '#00FF87'
                         : '#F0F0FF',
                  }}>
                    {points}
                  </p>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#555570', fontSize: '0.65rem' }}>pts</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer de la captura */}
        <p style={{
          fontFamily: 'DM Sans,sans-serif', fontSize: '0.65rem',
          color: '#333355', textAlign: 'center', marginTop: '0.875rem',
          paddingTop: '0.75rem', borderTop: '1px solid #1E1E2E',
        }}>
          qwc-2026.vercel.app · FIFA World Cup 2026
        </p>
      </div>

      {/* Botón de compartir — fuera de la captura */}
      <button
        data-no-capture="true"
        onClick={handleShare}
        disabled={sharing}
        style={{
          width: '100%', marginTop: '0.875rem',
          padding: '0.75rem', borderRadius: '0.875rem',
          border: '1px solid rgba(0,212,255,0.3)',
          background: sharing ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.08)',
          color: '#00D4FF',
          fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.875rem',
          cursor: sharing ? 'wait' : 'pointer',
          transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => { if (!sharing) e.currentTarget.style.background = 'rgba(0,212,255,0.15)' }}
        onMouseLeave={e => { if (!sharing) e.currentTarget.style.background = 'rgba(0,212,255,0.08)' }}
      >
        {sharing ? (
          <>
            <span style={{ width: 16, height: 16, border: '2px solid rgba(0,212,255,0.3)', borderTopColor: '#00D4FF', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            Generando imagen...
          </>
        ) : (
          <>📸 Compartir posiciones</>
        )}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}