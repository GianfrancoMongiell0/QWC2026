import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGroupMatches, useKnockoutMatches } from '../hooks/useMatches'
import { useMyPredictions } from '../hooks/usePredictions'
import { useStandings }     from '../hooks/useStandings'
import { useLeagueDetail }  from '../hooks/useLeague'
import { useAuth }          from '../context/AuthContext'
import Navbar              from '../components/layout/Navbar'
import PredictionInput     from '../components/matches/PredictionInput'
import UpcomingMatchBanner from '../components/matches/UpcomingMatchBanner'
import StandingsTable      from '../components/standings/StandingsTable'
import ShareLeagueButton   from '../components/leagues/ShareLeagueButton'
import Spinner             from '../components/ui/Spinner'
import Modal               from '../components/ui/Modal'
import {
  calcGroupStandings,
  resolveUserSlots,
  resolveKnockoutBracket,
} from '../utils/bracketResolver'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const WC_DEADLINE = new Date('2026-06-11T00:00:00-05:00')

const PHASE_LABELS = {
  round_of_32:  'Ronda de 32',
  round_of_16:  'Octavos de Final',
  quarterfinal: 'Cuartos de Final',
  semifinal:    'Semifinales',
  third_place:  'Tercer Lugar',
  final:        '🏆 Final',
}

// ── Tabla de grupo por predicciones del usuario ───────────────
function GroupTableFromPredictions({ matches, predictions }) {
  const rows = calcGroupStandings(matches, (m) => {
    const p = predictions[m.id]
    if (!p) return null
    return { home: p.predicted_home, away: p.predicted_away }
  })

  const predictedCount = matches.filter(m => predictions[m.id]).length

  if (predictedCount === 0) return (
    <div style={{ padding:'1.5rem', textAlign:'center' }}>
      <span style={{ fontSize:'2rem', display:'block', marginBottom:8 }}>✏️</span>
      <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.85rem' }}>
        Ingresa tus predicciones de este grupo para ver tu tabla.
      </p>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
        <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem' }}>
          Según tus predicciones
        </p>
        <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.7rem', fontWeight:700,
          color: predictedCount === matches.length ? '#00FF87' : '#FFD700' }}>
          {predictedCount}/{matches.length} partidos
        </p>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'DM Sans,sans-serif', fontSize:'0.8rem' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1E1E2E' }}>
              {['#','Equipo','PJ','PG','PE','PP','GF','GC','PTS'].map((h,i) => (
                <th key={h} style={{ textAlign:i<=1?'left':'center', color:'#555570', padding:'0.35rem 0.3rem', fontWeight:500, fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={r.team} style={{ borderTop:'1px solid #1E1E2E', background:i<2?'rgba(0,255,135,0.05)':'transparent' }}>
                <td style={{ textAlign:'center', color:i<2?'#00FF87':'#555570', fontWeight:700, padding:'0.45rem 0.3rem', fontSize:'0.75rem' }}>{i+1}</td>
                <td style={{ padding:'0.45rem 0.3rem' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span>{r.flag}</span>
                    <span style={{ color:'#F0F0FF', fontWeight:i<2?600:400, whiteSpace:'nowrap' }}>{r.team}</span>
                  </span>
                </td>
                {['pj','pg','pe','pp','gf','gc'].map(k => (
                  <td key={k} style={{ textAlign:'center', color:'#8888AA', padding:'0.45rem 0.3rem' }}>{r[k]}</td>
                ))}
                <td style={{ textAlign:'center', fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:i<2?'#00FF87':'#F0F0FF', padding:'0.45rem 0.3rem' }}>{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:8, display:'flex', justifyContent:'space-between' }}>
        <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.65rem' }}>🟢 Top 2 clasifican según tus picks</p>
        {predictedCount < matches.length && (
          <p style={{ fontFamily:'DM Sans,sans-serif', color:'#FFD700', fontSize:'0.65rem' }}>⚠️ {matches.length-predictedCount} sin predecir</p>
        )}
      </div>
    </div>
  )
}

// ── Partido eliminatorio con equipos resueltos ─────────────────
function KnockoutMatchCard({ match, prediction, onSave, locked }) {
  const home = match.home_resolved
  const away = match.away_resolved
  const isResolved = home?.team && !home.team.match(/^[12W]/) && home.team !== 'TBD'
  const earned = prediction?.is_scored ? prediction.points_earned : null
  const ptColor = earned===3?'#00FF87':earned===2?'#00D4FF':'#FF3366'

  // Usamos PredictionInput pero con los equipos resueltos
  const resolvedMatch = {
    ...match,
    home_team: home?.team ?? match.home_team,
    away_team: away?.team ?? match.away_team,
    home_team_flag: home?.flag ?? '',
    away_team_flag: away?.flag ?? '',
  }

  return <PredictionInput match={resolvedMatch} prediction={prediction} onSave={onSave} locked={locked} />
}

// ── Página ─────────────────────────────────────────────────────
export default function LeaguePage() {
  const { leagueId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()

  const [mainTab,     setMainTab]     = useState('groups')
  const [groupView,   setGroupView]   = useState('matches')
  const [activeGroup, setActiveGroup] = useState('A')
  const [showLock,    setShowLock]    = useState(false)

  const lockKey      = `wc26_locked_${user?.id}_${leagueId}`
  const [locked, setLocked] = useState(() => localStorage.getItem(lockKey) === 'true')
  const wcStarted    = new Date() >= WC_DEADLINE
  const isPredLocked = locked || wcStarted

  const { league }                            = useLeagueDetail(leagueId)
  const { matches: gMatches, loading: gLoad } = useGroupMatches()
  const { matches: kMatches, loading: kLoad } = useKnockoutMatches()
  const { standings, loading: sLoad }         = useStandings(leagueId)

  const allIds = useMemo(() => [...gMatches, ...kMatches].map(m => m.id), [gMatches, kMatches])
  const { predictions, upsertPrediction } = useMyPredictions(allIds, leagueId)

  const groupMatches = useMemo(() => gMatches.filter(m => m.group_name === activeGroup), [gMatches, activeGroup])

  // Resolver slots desde predicciones del usuario
  const groupSlots = useMemo(() => resolveUserSlots(gMatches, predictions), [gMatches, predictions])

  // Resolver bracket eliminatorio con equipos reales (según predicciones usuario)
  const resolvedKnockout = useMemo(
    () => resolveKnockoutBracket(kMatches, groupSlots, predictions),
    [kMatches, groupSlots, predictions]
  )

  const totalPreds  = useMemo(() => gMatches.filter(m => predictions[m.id]).length, [gMatches, predictions])
  const totalKPreds = useMemo(() => kMatches.filter(m => predictions[m.id]).length, [kMatches, predictions])
  const missingPreds  = gMatches.length - totalPreds
  const missingKPreds = kMatches.length - totalKPreds
  const myPoints = useMemo(() => Object.values(predictions).filter(p=>p.is_scored).reduce((a,p)=>a+p.points_earned,0), [predictions])

  const handleLock = () => {
    localStorage.setItem(lockKey,'true')
    setLocked(true)
    setShowLock(false)
  }

  const saveFn = isPredLocked ? () => {} : upsertPrediction

  // Fases eliminatorias en orden
  const phases = ['round_of_32','round_of_16','quarterfinal','semifinal','third_place','final']

  return (
    <div style={{ minHeight:'100vh' }}>
      <Navbar />
      <main style={{ maxWidth:640, margin:'0 auto', padding:'1.5rem 1rem 6rem' }}>

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#555570', fontFamily:'DM Sans,sans-serif', fontSize:'0.875rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:4, padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#F0F0FF'}
          onMouseLeave={e=>e.currentTarget.style.color='#555570'}
        >← Mis Ligas</button>

        {/* Header */}
        {league && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
            <div>
              <h2 className="font-display" style={{ fontSize:'2rem', color:'#F0F0FF', letterSpacing:'0.05em' }}>{league.name}</h2>
              {league.description && <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.875rem', marginTop:2 }}>{league.description}</p>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0, marginLeft:'1rem' }}>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.75rem', color:'#8888AA', background:'#06060A', border:'1px solid #1E1E2E', borderRadius:'0.5rem', padding:'0.25rem 0.75rem', letterSpacing:'0.15em' }}>{league.code}</span>
              {isPredLocked && <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:'0.65rem', color:'#FF3366', background:'rgba(255,51,102,0.1)', border:'1px solid rgba(255,51,102,0.25)', borderRadius:'9999px', padding:'0.15rem 0.6rem' }}>🔒 Cerradas</span>}
            </div>
          </div>
        )}

        {/* Banner partido próximo */}
        {!isPredLocked && (
          <UpcomingMatchBanner
            matches={[...gMatches, ...kMatches]}
            predictions={predictions}
          />
        )}

        {/* Tabs */}
        <div style={{ display:'flex', background:'#12121A', border:'1px solid #1E1E2E', borderRadius:'0.875rem', padding:4, gap:4, marginBottom:'1.25rem' }}>
          {[{key:'groups',label:'⚽ Grupos'},{key:'knockout',label:'🏆 Eliminatoria'},{key:'standings',label:'📊 Mi Liga'}].map(t => (
            <button key={t.key} onClick={() => setMainTab(t.key)} style={{ flex:1, padding:'0.5rem 0.25rem', border:'none', borderRadius:'0.75rem', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'0.72rem', fontWeight:500, transition:'all 0.15s', background:mainTab===t.key?'#06060A':'transparent', color:mainTab===t.key?'#00FF87':'#555570' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ TAB GRUPOS ══ */}
        {mainTab==='groups' && (
          <>
            {/* Sub-nav */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem', marginBottom:'1.25rem' }}>
              {[
                { key:'matches',     icon:'⚽', title:'Mis Predicciones',   sub:'Ingresa tus picks de goles' },
                { key:'group_table', icon:'📋', title:'Mi Tabla de Grupos', sub:'Clasificación según tus picks' },
              ].map(v => (
                <button key={v.key} onClick={() => setGroupView(v.key)} style={{ background:groupView===v.key?'rgba(0,255,135,0.08)':'#12121A', border:`1px solid ${groupView===v.key?'rgba(0,255,135,0.4)':'#1E1E2E'}`, borderRadius:'0.875rem', padding:'0.875rem 1rem', textAlign:'left', cursor:'pointer', transition:'all 0.15s' }}>
                  <span style={{ fontSize:'1.375rem', display:'block', marginBottom:5 }}>{v.icon}</span>
                  <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.85rem', color:groupView===v.key?'#00FF87':'#F0F0FF' }}>{v.title}</p>
                  <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', marginTop:2 }}>{v.sub}</p>
                </button>
              ))}
            </div>

            {/* Selector de grupo */}
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, marginBottom:'1rem' }} className="scrollbar-hide">
              {GROUPS.map(g => {
                const gms  = gMatches.filter(m => m.group_name === g)
                const done = gms.filter(m => predictions[m.id]).length
                const full = gms.length > 0 && done === gms.length
                return (
                  <button key={g} onClick={() => setActiveGroup(g)} style={{ flexShrink:0, width:34, height:34, borderRadius:'50%', border:`1px solid ${activeGroup===g?'#00FF87':full?'rgba(0,255,135,0.3)':'#1E1E2E'}`, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', transition:'all 0.15s', background:activeGroup===g?'rgba(0,255,135,0.15)':'transparent', color:activeGroup===g?'#00FF87':full?'rgba(0,255,135,0.6)':'#555570', position:'relative' }}>
                    {g}
                    {full && activeGroup!==g && <span style={{ position:'absolute', top:-2, right:-2, width:8, height:8, borderRadius:'50%', background:'#00FF87', border:'1px solid #0A0A0F' }} />}
                  </button>
                )
              })}
            </div>

            {gLoad ? <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><Spinner /></div>
            : groupView==='matches' ? (
              <>
                {isPredLocked && (
                  <div style={{ background:'rgba(255,51,102,0.08)', border:'1px solid rgba(255,51,102,0.25)', borderRadius:'0.875rem', padding:'0.75rem 1rem', marginBottom:'0.875rem', display:'flex', alignItems:'center', gap:8 }}>
                    <span>🔒</span>
                    <p style={{ fontFamily:'DM Sans,sans-serif', color:'#FF3366', fontSize:'0.8rem' }}>
                      {wcStarted?'El Mundial ya comenzó. Predicciones cerradas.':'Cerraste tus predicciones. Solo puedes ver.'}
                    </p>
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {groupMatches.length===0
                    ? <div className="glass-card" style={{padding:'2rem',textAlign:'center'}}><p style={{fontFamily:'DM Sans,sans-serif',color:'#8888AA',fontSize:'0.875rem'}}>No hay partidos para el Grupo {activeGroup}.</p></div>
                    : groupMatches.map(m => <PredictionInput key={m.id} match={m} prediction={predictions[m.id]} onSave={saveFn} locked={isPredLocked} />)
                  }
                </div>
                {!isPredLocked && gMatches.length>0 && (
                  <div style={{ marginTop:'1.25rem', background:'#12121A', border:'1px solid #1E1E2E', borderRadius:'0.875rem', padding:'0.875rem 1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.75rem' }}>Progreso fase de grupos</span>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'0.875rem', color:missingPreds===0?'#00FF87':'#FFD700' }}>{totalPreds}/{gMatches.length}</span>
                    </div>
                    <div style={{ height:4, background:'#1E1E2E', borderRadius:9999, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:9999, transition:'width 0.4s', background:missingPreds===0?'#00FF87':'#FFD700', width:`${gMatches.length>0?(totalPreds/gMatches.length)*100:0}%` }} />
                    </div>
                    {missingPreds>0 && <p style={{fontFamily:'DM Sans,sans-serif',color:'#555570',fontSize:'0.7rem',marginTop:6}}>Faltan {missingPreds} predicciones de grupos.</p>}
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card" style={{ padding:'1rem' }}>
                <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'#F0F0FF', fontSize:'0.9rem', marginBottom:'0.875rem' }}>Grupo {activeGroup} — según tus picks</p>
                <GroupTableFromPredictions matches={groupMatches} predictions={predictions} />
              </div>
            )}
          </>
        )}

        {/* ══ TAB ELIMINATORIA ══ */}
        {mainTab==='knockout' && (
          kLoad ? <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><Spinner /></div>
          : (
            <>
              {/* Info */}
              <div style={{ background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:'0.875rem', padding:'0.875rem 1rem', marginBottom:'1rem' }}>
                <p style={{ fontFamily:'DM Sans,sans-serif', color:'#00D4FF', fontSize:'0.8rem', lineHeight:1.5 }}>
                  💡 Los equipos se completan automáticamente desde tus predicciones de grupos.
                  Predice el marcador de cada duelo eliminatorio.
                </p>
              </div>

              {isPredLocked && (
                <div style={{ background:'rgba(255,51,102,0.08)', border:'1px solid rgba(255,51,102,0.25)', borderRadius:'0.875rem', padding:'0.75rem 1rem', marginBottom:'0.875rem', display:'flex', alignItems:'center', gap:8 }}>
                  <span>🔒</span>
                  <p style={{ fontFamily:'DM Sans,sans-serif', color:'#FF3366', fontSize:'0.8rem' }}>Predicciones cerradas. Solo puedes ver tus picks.</p>
                </div>
              )}

              {kMatches.length===0 ? (
                <div className="glass-card" style={{ padding:'2.5rem', textAlign:'center' }}>
                  <span style={{ fontSize:'2rem', display:'block', marginBottom:8 }}>⏳</span>
                  <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.875rem' }}>El admin aún no ha cargado los partidos eliminatorios.</p>
                  <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.75rem', marginTop:6 }}>Se cargarán pronto.</p>
                </div>
              ) : (
                <>
                  {/* Progreso */}
                  {!isPredLocked && (
                    <div style={{ background:'#12121A', border:'1px solid #1E1E2E', borderRadius:'0.875rem', padding:'0.875rem 1rem', marginBottom:'1rem' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{fontFamily:'DM Sans,sans-serif',color:'#8888AA',fontSize:'0.75rem'}}>Progreso eliminatoria</span>
                        <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'0.875rem',color:missingKPreds===0?'#00FF87':'#FFD700'}}>{totalKPreds}/{kMatches.length}</span>
                      </div>
                      <div style={{ height:4, background:'#1E1E2E', borderRadius:9999, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:9999, transition:'width 0.4s', background:missingKPreds===0?'#00FF87':'#FFD700', width:`${kMatches.length>0?(totalKPreds/kMatches.length)*100:0}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Partidos por fase */}
                  {phases.map(phase => {
                    const phaseMatches = resolvedKnockout.filter(m => m.phase === phase)
                    if (phaseMatches.length===0) return null
                    return (
                      <div key={phase} style={{ marginBottom:'1.5rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
                          <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>
                            {PHASE_LABELS[phase]}
                          </span>
                          <div style={{ flex:1, height:1, background:'#1E1E2E' }} />
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                          {phaseMatches.map(m => (
                            <KnockoutMatchCard
                              key={m.id} match={m}
                              prediction={predictions[m.id]}
                              onSave={saveFn}
                              locked={isPredLocked}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* Botón cierre */}
                  {!isPredLocked && !wcStarted && (
                    <div style={{ marginTop:'1.5rem', background:'rgba(255,215,0,0.05)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:'1rem', padding:'1.25rem' }}>
                      <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'#FFD700', fontSize:'0.9rem', marginBottom:4 }}>¿Terminaste todas tus predicciones?</p>
                      <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.78rem', marginBottom:'1rem', lineHeight:1.5 }}>
                        Grupos: <strong style={{color:missingPreds===0?'#00FF87':'#FFD700'}}>{totalPreds}/{gMatches.length}</strong> · Eliminatoria: <strong style={{color:missingKPreds===0?'#00FF87':'#FFD700'}}>{totalKPreds}/{kMatches.length}</strong>
                      </p>
                      <button onClick={() => setShowLock(true)} style={{ width:'100%', padding:'0.75rem', borderRadius:'0.75rem', border:'none', background:'rgba(255,215,0,0.15)', color:'#FFD700', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.875rem', cursor:'pointer', transition:'all 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,215,0,0.25)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,215,0,0.15)'}
                      >
                        🔒 Cerrar mis predicciones definitivamente
                      </button>
                    </div>
                  )}
                  {isPredLocked && (
                    <div style={{ marginTop:'1rem', background:'rgba(0,255,135,0.05)', border:'1px solid rgba(0,255,135,0.2)', borderRadius:'1rem', padding:'1rem', textAlign:'center' }}>
                      <p style={{ fontFamily:'DM Sans,sans-serif', color:'#00FF87', fontSize:'0.85rem' }}>✓ Predicciones cerradas. ¡Buena suerte!</p>
                    </div>
                  )}
                </>
              )}
            </>
          )
        )}

        {/* ══ TAB MI LIGA ══ */}
        {mainTab==='standings' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem', marginBottom:'1.25rem' }}>
              <div style={{ background:'#12121A', border:'1px solid #1E1E2E', borderRadius:'0.875rem', padding:'0.875rem 1rem' }}>
                <span style={{ fontSize:'1.375rem', display:'block', marginBottom:5 }}>🏅</span>
                <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'#F0F0FF', fontSize:'0.85rem' }}>Posiciones</p>
                <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', marginTop:2 }}>Ranking de tu liga</p>
              </div>
              <div style={{ background:'#12121A', border:'1px solid #1E1E2E', borderRadius:'0.875rem', padding:'0.875rem 1rem' }}>
                <span style={{ fontSize:'1.375rem', display:'block', marginBottom:5 }}>⭐</span>
                <p style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:'#FFD700', fontSize:'1.5rem' }}>{myPoints}</p>
                <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', marginTop:2 }}>Mis puntos acumulados</p>
              </div>
            </div>
            {sLoad ? <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><Spinner /></div> : <StandingsTable standings={standings} />}

            {/* Compartir liga */}
            <div style={{ marginTop:'1.25rem' }}>
              <ShareLeagueButton league={league} />
            </div>
          </>
        )}
      </main>

      {/* Modal cierre */}
      <Modal open={showLock} onClose={() => setShowLock(false)} title="🔒 Confirmar cierre">
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:'0.875rem', padding:'1rem' }}>
            <p style={{ fontFamily:'DM Sans,sans-serif', color:'#FFD700', fontWeight:600, fontSize:'0.875rem', marginBottom:6 }}>⚠️ Esta acción es irreversible</p>
            <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.8rem', lineHeight:1.6 }}>
              No podrás modificar <strong style={{color:'#F0F0FF'}}>ninguna predicción</strong> después de confirmar.
            </p>
            <div style={{ marginTop:'0.75rem', display:'flex', flexDirection:'column', gap:4 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{fontFamily:'DM Sans,sans-serif',color:'#555570',fontSize:'0.8rem'}}>Grupos:</span>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'0.8rem',color:missingPreds===0?'#00FF87':'#FFD700'}}>{totalPreds}/{gMatches.length}{missingPreds>0?` (faltan ${missingPreds})`:' ✓'}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{fontFamily:'DM Sans,sans-serif',color:'#555570',fontSize:'0.8rem'}}>Eliminatoria:</span>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'0.8rem',color:missingKPreds===0?'#00FF87':'#FFD700'}}>{totalKPreds}/{kMatches.length}{missingKPreds>0?` (faltan ${missingKPreds})`:' ✓'}</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button onClick={() => setShowLock(false)} className="btn-secondary" style={{flex:1}}>No, seguir editando</button>
            <button onClick={handleLock} style={{ flex:1, padding:'0.75rem', borderRadius:'0.75rem', border:'none', background:'rgba(255,51,102,0.15)', color:'#FF3366', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.875rem', cursor:'pointer' }}>
              Sí, cerrar
            </button>
          </div>
        </div>
      </Modal>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
