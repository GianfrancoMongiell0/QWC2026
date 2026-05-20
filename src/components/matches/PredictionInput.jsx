import { useState, useEffect } from 'react'
import { fmtTime } from '../../utils/dateHelpers'

// Solo partidos eliminatorios tienen penales
const isKnockout = (phase) => phase && phase !== 'group'

export default function PredictionInput({ match, prediction, onSave, locked = false }) {
  const finished = match.status === 'finished'
  const earned   = prediction?.is_scored ? prediction.points_earned : null
  const knockout = isKnockout(match.phase)

  const [home,       setHome]       = useState(prediction?.predicted_home ?? '')
  const [away,       setAway]       = useState(prediction?.predicted_away ?? '')
  const [penWinner,  setPenWinner]  = useState(prediction?.predicted_penalty_winner ?? null)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)

  useEffect(() => {
    setHome(prediction?.predicted_home ?? '')
    setAway(prediction?.predicted_away ?? '')
    setPenWinner(prediction?.predicted_penalty_winner ?? null)
  }, [prediction?.id])

  const isDrawn = home !== '' && away !== '' && Number(home) === Number(away)

  const handleSave = async (overridePen) => {
    if (locked || home === '' || away === '') return
    const pen = overridePen !== undefined ? overridePen : penWinner
    setSaving(true)
    await onSave(match.id, Number(home), Number(away), pen)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePenSelect = (val) => {
    setPenWinner(val)
    handleSave(val)
  }

  const ptColor = earned === 3 ? '#00FF87' : earned === 2 ? '#00D4FF' : '#FF3366'

  // Nombres de los equipos para el selector de penales
  const homeName = match.home_team
  const awayName = match.away_team

  return (
    <div style={{
      background:    '#12121A',
      border:        '1px solid #1E1E2E',
      borderRadius:  '1rem',
      padding:       '1rem',
      opacity:       locked && !prediction ? 0.7 : 1,
      transition:    'opacity 0.15s',
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
        <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {match.group_name ? `Grupo ${match.group_name}` : (match.phase||'').replace(/_/g,' ')}
          {match.venue ? ` · ${match.venue.split(',')[0]}` : ''}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {earned !== null && (
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'0.72rem', color:ptColor, background:`${ptColor}20`, border:`1px solid ${ptColor}40`, borderRadius:8, padding:'0.15rem 0.5rem' }}>
              {earned===3?'⭐+3':earned===2?'✓+2':'✗+0'}
            </span>
          )}
          <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.72rem' }}>
            {fmtTime(match.match_datetime)}
          </span>
          {match.status==='live' && (
            <span style={{ color:'#00FF87', fontSize:'0.7rem', fontFamily:'DM Sans,sans-serif' }}>🔴 EN VIVO</span>
          )}
        </div>
      </div>

      {/* Equipos + inputs */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        {/* Local */}
        <div style={{ flex:1, textAlign:'right' }}>
          <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'#F0F0FF', fontSize:'0.9rem', lineHeight:1.3 }}>
            {match.home_team_flag && <span style={{marginRight:4}}>{match.home_team_flag}</span>}
            {homeName}
          </p>
        </div>

        {/* Score */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {locked ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* Predicción bloqueada */}
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                {[home, away].map((v, i) => (
                  <div key={i} style={{
                    width:44, height:44, background:'#06060A', border:'2px solid #1E1E2E',
                    borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'1.2rem',
                    color: v !== '' ? '#8888AA' : '#333355',
                  }}>
                    {v !== '' ? v : '—'}
                  </div>
                ))}
              </div>
              {/* Resultado oficial */}
              {finished && match.home_score !== null && (
                <div style={{
                  display:'flex', alignItems:'center', gap:3,
                  padding:'0.35rem 0.65rem', background:'#06060A',
                  border:'2px solid rgba(0,255,135,0.35)', borderRadius:'0.75rem',
                }}>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'1.1rem', color: match.penalty_winner==='home'?'#8B5CF6':'#00FF87' }}>
                    {match.home_score}
                  </span>
                  <span style={{ color:'#555570', margin:'0 1px', fontSize:'0.9rem' }}>-</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'1.1rem', color: match.penalty_winner==='away'?'#8B5CF6':'#00FF87' }}>
                    {match.away_score}
                  </span>
                  {match.penalty_winner && (
                    <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:'0.6rem', color:'#8B5CF6', fontWeight:700 }}>PEN</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="number" min="0" max="20" value={home}
                onChange={e => setHome(e.target.value)}
                onBlur={() => handleSave()}
                className="score-input" placeholder="—" />
              <span style={{ color:'#555570', fontFamily:'monospace', fontWeight:700, fontSize:'1.25rem' }}>:</span>
              <input type="number" min="0" max="20" value={away}
                onChange={e => setAway(e.target.value)}
                onBlur={() => handleSave()}
                className="score-input" placeholder="—" />
            </div>
          )}
        </div>

        {/* Visitante */}
        <div style={{ flex:1, textAlign:'left' }}>
          <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'#F0F0FF', fontSize:'0.9rem', lineHeight:1.3 }}>
            {awayName}
            {match.away_team_flag && <span style={{marginLeft:4}}>{match.away_team_flag}</span>}
          </p>
        </div>
      </div>

      {/* Selector de penales — solo en eliminatoria, solo si hay empate, solo si no está bloqueado */}
      {knockout && isDrawn && !locked && (
        <div style={{
          marginTop: '0.75rem',
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '0.75rem',
          padding: '0.75rem',
        }}>
          <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8B5CF6', fontSize:'0.72rem', fontWeight:600, marginBottom:'0.5rem' }}>
            ⚽ Empate — ¿Quién gana en penales? (+1pt extra si aciertas)
          </p>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            {[
              { val: 'home', label: homeName || 'Local'     },
              { val: 'away', label: awayName || 'Visitante' },
            ].map(opt => (
              <button key={opt.val} onClick={() => handlePenSelect(opt.val)} style={{
                flex: 1, padding: '0.4rem 0.5rem',
                borderRadius: '0.625rem', border: '1px solid',
                fontFamily: 'DM Sans,sans-serif', fontSize: '0.72rem',
                cursor: 'pointer', transition: 'all 0.15s',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                borderColor: penWinner === opt.val ? '#8B5CF6' : '#1E1E2E',
                background:  penWinner === opt.val ? 'rgba(139,92,246,0.2)' : 'transparent',
                color:       penWinner === opt.val ? '#8B5CF6' : '#555570',
                fontWeight:  penWinner === opt.val ? 600 : 400,
              }}>
                {opt.label}
              </button>
            ))}
          </div>
          {penWinner && (
            <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.65rem', marginTop:5 }}>
              Predices que {penWinner === 'home' ? homeName : awayName} gana en penales
            </p>
          )}
        </div>
      )}

      {/* Selector de penales bloqueado — mostrar lo que predijo */}
      {knockout && locked && prediction?.predicted_penalty_winner && (
        Number(prediction.predicted_home) === Number(prediction.predicted_away)
      ) && (
        <div style={{ marginTop:'0.625rem', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem' }}>
            Penales predichos:
          </span>
          <span style={{ fontFamily:'DM Sans,sans-serif', color:'#8B5CF6', fontSize:'0.7rem', fontWeight:600 }}>
            {prediction.predicted_penalty_winner === 'home' ? homeName : awayName}
          </span>
        </div>
      )}

      {/* Feedback */}
      <div style={{ height:16, display:'flex', alignItems:'center', justifyContent:'center', marginTop:6 }}>
        {!locked && saving && <span style={{color:'#555570',fontSize:'0.7rem',fontFamily:'DM Sans,sans-serif'}}>Guardando...</span>}
        {!locked && saved  && <span style={{color:'#00FF87',fontSize:'0.7rem',fontFamily:'DM Sans,sans-serif'}}>✓ Guardado</span>}
        {locked && !prediction && <span style={{color:'#555570',fontSize:'0.7rem',fontFamily:'DM Sans,sans-serif'}}>Sin predicción registrada</span>}
      </div>
    </div>
  )
}
