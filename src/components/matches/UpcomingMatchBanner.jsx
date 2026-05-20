import { useState, useEffect, useMemo } from 'react'
import { minutesUntil, fmtTime } from '../../utils/dateHelpers'

// Encuentra el partido más próximo a comenzar (en las próximas 3 horas)
// que el usuario aún no ha predicho
function findUrgentMatch(matches, predictions) {
  const now     = new Date()
  const in3h    = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const in10min = new Date(now.getTime() + 10 * 60 * 1000)

  return matches
    .filter(m => {
      const dt = new Date(m.match_datetime)
      return dt > in10min && dt <= in3h && m.status === 'upcoming'
    })
    .sort((a, b) => new Date(a.match_datetime) - new Date(b.match_datetime))[0] ?? null
}

// Cuenta regresiva en tiempo real
function useCountdown(targetDatetime) {
  const [mins, setMins] = useState(() => minutesUntil(targetDatetime))

  useEffect(() => {
    const interval = setInterval(() => {
      setMins(minutesUntil(targetDatetime))
    }, 30_000) // actualizar cada 30s
    return () => clearInterval(interval)
  }, [targetDatetime])

  return mins
}

export default function UpcomingMatchBanner({ matches, predictions }) {
  const [dismissed, setDismissed] = useState(false)

  const urgentMatch = useMemo(
    () => findUrgentMatch(matches, predictions),
    [matches, predictions]
  )

  const mins = useCountdown(urgentMatch?.match_datetime ?? new Date())

  if (!urgentMatch || dismissed) return null

  const hasPrediction = !!predictions?.[urgentMatch.id]
  const isVeryClose   = mins <= 30
  const accentColor   = isVeryClose ? '#FF3366' : '#FFD700'

  return (
    <div style={{
      background:   `rgba(${isVeryClose ? '255,51,102' : '255,215,0'},0.07)`,
      border:       `1px solid rgba(${isVeryClose ? '255,51,102' : '255,215,0'},0.3)`,
      borderRadius: '1rem',
      padding:      '0.875rem 1rem',
      marginBottom: '1.25rem',
      display:      'flex',
      alignItems:   'center',
      gap:          '0.75rem',
      animation:    isVeryClose ? 'pulse-border 2s ease-in-out infinite' : 'none',
    }}>
      {/* Icono animado */}
      <div style={{ flexShrink:0, fontSize: isVeryClose ? '1.5rem' : '1.25rem' }}>
        {isVeryClose ? '🚨' : '⏱️'}
      </div>

      {/* Contenido */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{
          fontFamily: 'DM Sans,sans-serif', fontWeight:600,
          color: accentColor, fontSize:'0.8rem', marginBottom:2,
        }}>
          {isVeryClose
            ? `¡Faltan solo ${mins} minutos!`
            : `Próximo partido en ${mins} minutos`
          }
        </p>
        <p style={{ fontFamily:'DM Sans,sans-serif', color:'#F0F0FF', fontSize:'0.875rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {urgentMatch.home_team_flag} {urgentMatch.home_team}
          {' '}vs{' '}
          {urgentMatch.away_team} {urgentMatch.away_team_flag}
        </p>
        <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', marginTop:2 }}>
          {urgentMatch.group_name ? `Grupo ${urgentMatch.group_name} · ` : ''}
          {fmtTime(urgentMatch.match_datetime)}
          {urgentMatch.venue ? ` · ${urgentMatch.venue.split(',')[0]}` : ''}
        </p>
      </div>

      {/* Estado predicción */}
      <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
        {hasPrediction ? (
          <span style={{
            fontFamily:'DM Sans,sans-serif', fontSize:'0.7rem', color:'#00FF87',
            background:'rgba(0,255,135,0.1)', border:'1px solid rgba(0,255,135,0.3)',
            borderRadius:'9999px', padding:'0.2rem 0.6rem', whiteSpace:'nowrap',
          }}>
            ✓ Predicción lista
          </span>
        ) : (
          <span style={{
            fontFamily:'DM Sans,sans-serif', fontSize:'0.7rem', color: accentColor,
            background:`rgba(${isVeryClose?'255,51,102':'255,215,0'},0.1)`,
            border:`1px solid rgba(${isVeryClose?'255,51,102':'255,215,0'},0.3)`,
            borderRadius:'9999px', padding:'0.2rem 0.6rem', whiteSpace:'nowrap',
          }}>
            ⚠️ Sin predicción
          </span>
        )}

        {/* Botón cerrar */}
        <button
          onClick={() => setDismissed(true)}
          style={{
            background:'none', border:'none', cursor:'pointer',
            color:'#555570', fontSize:'0.75rem', padding:'0.1rem 0.2rem',
            fontFamily:'DM Sans,sans-serif',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0F0FF'}
          onMouseLeave={e => e.currentTarget.style.color = '#555570'}
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes pulse-border {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,51,102,0.3); }
          50%      { box-shadow: 0 0 0 6px rgba(255,51,102,0); }
        }
      `}</style>
    </div>
  )
}
