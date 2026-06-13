import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllMatches } from '../hooks/useMatches'
import { useMyLeagues }  from '../hooks/useLeague'
import { supabase }      from '../lib/supabase'
import Navbar  from '../components/layout/Navbar'
import Spinner from '../components/ui/Spinner'
import { fmtDate, fmtTime } from '../utils/dateHelpers'
import { resolveAdminSlots, resolveRealKnockoutBracket } from '../utils/bracketResolver'

const PHASES = {
  group:'Grupos', round_of_32:'Ronda 32', round_of_16:'Octavos',
  quarterfinal:'Cuartos', semifinal:'Semis', third_place:'3er Lugar', final:'Final'
}

function isToday(datetimeStr) {
  const matchDate = new Date(datetimeStr)
  const now = new Date()
  return (
    matchDate.getDate()     === now.getDate()   &&
    matchDate.getMonth()    === now.getMonth()  &&
    matchDate.getFullYear() === now.getFullYear()
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { matches, loading, refetch } = useAllMatches()
  const { leagues } = useMyLeagues()

  const [editing,  setEditing]  = useState(null)
  const [editData, setEditData] = useState({})
  const [saving,   setSaving]   = useState(null)
  const [feedback, setFeedback] = useState({})
  const [filter,   setFilter]   = useState('pending')
  const [phFilter, setPhFilter] = useState('all')
  const [search,   setSearch]   = useState('')
  const [todayOnly, setTodayOnly] = useState(true)  // ← HOY activado por defecto

  // Separar partidos de grupos y eliminatorios
  const groupMatches   = useMemo(() => matches.filter(m => m.phase === 'group'), [matches])
  const knockoutMatches = useMemo(() => matches.filter(m => m.phase !== 'group'), [matches])

  // Resolver slots desde resultados reales del admin
  const groupSlots = useMemo(() => resolveAdminSlots(groupMatches), [groupMatches])

  // Resolver bracket eliminatorio con equipos reales
  const resolvedKnockout = useMemo(
    () => resolveRealKnockoutBracket(knockoutMatches, groupSlots),
    [knockoutMatches, groupSlots]
  )

  // Combinar todos los partidos (grupos + knockout resuelto)
  const allResolved = useMemo(() => [
    ...groupMatches,
    ...resolvedKnockout,
  ], [groupMatches, resolvedKnockout])

  const startEdit = (m) => {
    setEditing(m.id)
    setEditData({
      home:           m.home_score ?? '',
      away:           m.away_score ?? '',
      penalty_winner: m.penalty_winner ?? 'none',
    })
  }

  const handleSave = async (m) => {
    const d        = editData
    if (d.home === '' || d.away === '') return
    setSaving(m.id)
    const isDrawn    = Number(d.home) === Number(d.away)
    const isKnockout = m.phase !== 'group'

    const payload = {
      home_score: Number(d.home),
      away_score: Number(d.away),
      status:     'finished',
      updated_at: new Date().toISOString(),
    }

    if (isKnockout) {
      payload.penalty_winner = (isDrawn && d.penalty_winner !== 'none')
        ? d.penalty_winner
        : null
    }

    const { error } = await supabase.from('matches').update(payload).eq('id', m.id)
    setSaving(null); setEditing(null)
    setFeedback(p => ({ ...p, [m.id]: error ? 'err' : 'ok' }))
    if (!error) refetch()
    setTimeout(() => setFeedback(p => ({ ...p, [m.id]: null })), 3000)
  }

  const set = (key, val) => setEditData(p => ({ ...p, [key]: val }))

  const filtered = allResolved.filter(m => {
    const fOk   = filter==='all' ? true : filter==='pending' ? m.home_score===null : m.home_score!==null
    const phOk  = phFilter==='all' || m.phase===phFilter
    const dayOk = !todayOnly || isToday(m.match_datetime)
    const name_home = m.home_resolved?.team ?? m.home_team
    const name_away = m.away_resolved?.team ?? m.away_team
    const sOk = !search
      || name_home.toLowerCase().includes(search.toLowerCase())
      || name_away.toLowerCase().includes(search.toLowerCase())
    return fOk && phOk && dayOk && sOk
  })

  const todayCount   = allResolved.filter(m => isToday(m.match_datetime)).length
  const todayPending = allResolved.filter(m => isToday(m.match_datetime) && m.home_score === null).length
  const done    = matches.filter(m => m.home_score!==null).length
  const pending = matches.length - done

  const goToMyLeague = () => {
    navigate('/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh' }}>
      <Navbar />
      <main style={{ maxWidth:720, margin:'0 auto', padding:'1.5rem 1rem 6rem' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', gap:'1rem' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.3)', borderRadius:9999, padding:'0.2rem 0.875rem', marginBottom:'0.5rem' }}>
              <span style={{ fontSize:'0.7rem', color:'#FFD700', fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'0.12em' }}>Panel Admin</span>
            </div>
            <h2 className="font-display" style={{ fontSize:'2.25rem', color:'#F0F0FF', letterSpacing:'0.05em' }}>RESULTADOS</h2>
            <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.8rem', marginTop:2 }}>
              Ingresa el marcador oficial → los puntos y el bracket se actualizan solos.
            </p>
          </div>
          <button onClick={goToMyLeague} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'#12121A', border:'1px solid #1E1E2E', borderRadius:'0.875rem', padding:'0.75rem 1rem', cursor:'pointer', transition:'all 0.15s', flexShrink:0 }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#00D4FF'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#1E1E2E'}
          >
            <span style={{ fontSize:'1.5rem' }}>⚽</span>
            <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:'0.7rem', color:'#8888AA', whiteSpace:'nowrap' }}>Mi Liga</span>
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem', marginBottom:'1.25rem' }}>
          {[
            {label:'Total',      val:matches.length, color:'#F0F0FF'},
            {label:'Con result', val:done,           color:'#00FF87'},
            {label:'Pendientes', val:pending,        color:pending>0?'#FFD700':'#555570'},
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding:'0.875rem', textAlign:'center' }}>
              <p style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'1.5rem', color:s.color }}>{s.val}</p>
              <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', marginTop:2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Puntos */}
        <div className="glass-card" style={{ padding:'0.75rem 1rem', marginBottom:'1.25rem', display:'flex', gap:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>Puntos:</span>
          {[{pts:3,l:'Exacto',c:'#00FF87'},{pts:2,l:'Tendencia',c:'#00D4FF'},{pts:0,l:'Fallo',c:'#FF3366'}].map(r => (
            <span key={r.pts} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:r.c, fontSize:'0.875rem' }}>{r.pts}pts</span>
              <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.75rem' }}>{r.l}</span>
            </span>
          ))}
        </div>

        {/* ── FILTRO HOY ── */}
        <button
          onClick={() => setTodayOnly(v => !v)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '0.875rem',
            border: `1px solid ${todayOnly ? 'rgba(255,215,0,0.5)' : '#1E1E2E'}`,
            background: todayOnly ? 'rgba(255,215,0,0.08)' : '#12121A',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>🔥</span>
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.875rem', color: todayOnly ? '#FFD700' : '#8888AA' }}>
              Solo partidos de hoy
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {todayPending > 0 && todayOnly && (
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.75rem', color: '#FF3366', background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 9999, padding: '0.1rem 0.5rem' }}>
                {todayPending} sin resultado
              </span>
            )}
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.75rem', color: todayOnly ? '#FFD700' : '#555570' }}>
              {todayCount} partidos
            </span>
            <span style={{
              width: 36, height: 20, borderRadius: 9999,
              background: todayOnly ? 'rgba(255,215,0,0.3)' : '#1E1E2E',
              border: `1px solid ${todayOnly ? '#FFD700' : '#333345'}`,
              position: 'relative', transition: 'all 0.2s', flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', top: 2,
                left: todayOnly ? 18 : 2,
                width: 14, height: 14, borderRadius: '50%',
                background: todayOnly ? '#FFD700' : '#555570',
                transition: 'left 0.2s',
              }} />
            </span>
          </span>
        </button>

        {/* Filtros secundarios */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1rem' }}>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar equipo..."
              className="input-field" style={{ flex:1, minWidth:150, padding:'0.5rem 0.875rem', fontSize:'0.875rem' }} />
            {[{k:'pending',l:'Sin resultado'},{k:'done',l:'Con resultado'},{k:'all',l:'Todos'}].map(f => (
              <button key={f.k} onClick={()=>setFilter(f.k)} style={{ padding:'0.5rem 0.875rem', borderRadius:'0.75rem', border:'1px solid', fontFamily:'DM Sans,sans-serif', fontSize:'0.75rem', cursor:'pointer', transition:'all 0.15s', flexShrink:0, borderColor:filter===f.k?'#00FF87':'#1E1E2E', background:filter===f.k?'rgba(0,255,135,0.1)':'#12121A', color:filter===f.k?'#00FF87':'#555570' }}>{f.l}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:'0.5rem', overflowX:'auto' }} className="scrollbar-hide">
            {['all','group','round_of_32','round_of_16','quarterfinal','semifinal','final'].map(p => (
              <button key={p} onClick={()=>setPhFilter(p)} style={{ padding:'0.35rem 0.75rem', borderRadius:'9999px', border:'1px solid', flexShrink:0, fontFamily:'DM Sans,sans-serif', fontSize:'0.7rem', cursor:'pointer', transition:'all 0.15s', borderColor:phFilter===p?'#8B5CF6':'#1E1E2E', background:phFilter===p?'rgba(139,92,246,0.12)':'transparent', color:phFilter===p?'#8B5CF6':'#555570' }}>
                {{all:'Todas',group:'Grupos',round_of_32:'R32',round_of_16:'Octavos',quarterfinal:'Cuartos',semifinal:'Semis',final:'Final'}[p]}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.75rem', marginBottom:'0.75rem' }}>
          {filtered.length} partido{filtered.length!==1?'s':''}
          {todayOnly && <span style={{ color:'#FFD700', marginLeft:6 }}>· hoy</span>}
        </p>

        {/* Lista */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><Spinner /></div>
        ) : filtered.length===0 ? (
          <div className="glass-card" style={{ padding:'2.5rem', textAlign:'center' }}>
            <span style={{ fontSize:'2rem', display:'block', marginBottom:8 }}>
              {todayOnly ? '📅' : '🔍'}
            </span>
            <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA' }}>
              {todayOnly ? 'No hay partidos hoy con ese filtro.' : 'No hay partidos con ese filtro.'}
            </p>
            {todayOnly && (
              <button onClick={() => setTodayOnly(false)} style={{ marginTop:'0.75rem', fontFamily:'DM Sans,sans-serif', fontSize:'0.8rem', color:'#FFD700', background:'transparent', border:'1px solid rgba(255,215,0,0.3)', borderRadius:'0.625rem', padding:'0.4rem 0.875rem', cursor:'pointer' }}>
                Ver todos los partidos
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {filtered.map(m => {
              const isEdit = editing===m.id
              const d      = editData
              const fb     = feedback[m.id]
              const hasRes = m.home_score!==null
              const homeName = m.home_resolved?.team ?? m.home_team
              const awayName = m.away_resolved?.team ?? m.away_team
              const homeFlag = m.home_resolved?.flag ?? m.home_team_flag ?? ''
              const awayFlag = m.away_resolved?.flag ?? m.away_team_flag ?? ''
              const isSlot = homeName.match(/^[12W3]/)
              const isGroup = m.phase === 'group'
              const matchIsToday = isToday(m.match_datetime)

              return (
                <div key={m.id} style={{ background:'#12121A', borderRadius:'1rem', padding:'0.875rem 1rem', border:`1px solid ${fb==='ok'?'rgba(0,255,135,0.4)':fb==='err'?'rgba(255,51,102,0.4)':isEdit?'rgba(255,215,0,0.4)':matchIsToday && !hasRes?'rgba(255,215,0,0.2)':'#1E1E2E'}`, transition:'border-color 0.2s' }}>
                  {/* Meta */}
                  <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:4, marginBottom:'0.5rem' }}>
                    <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem' }}>
                      #{m.match_number} · {PHASES[m.phase]}{m.group_name?` · Grupo ${m.group_name}`:''}
                    </span>
                    <span style={{ fontFamily:'DM Sans,sans-serif', color: matchIsToday ? '#FFD700' : '#555570', fontSize:'0.7rem', fontWeight: matchIsToday ? 600 : 400 }}>
                      {matchIsToday ? '🔥 Hoy' : fmtDate(m.match_datetime)} · {fmtTime(m.match_datetime)}
                    </span>
                  </div>

                  {/* Equipos + marcador */}
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ flex:1, textAlign:'right' }}>
                      <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:isSlot?'#555570':'#F0F0FF', fontSize:'0.9rem', fontStyle:isSlot?'italic':'normal' }}>
                        {homeFlag} {homeName}
                      </p>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {isEdit ? (
                        <>
                          <input type="number" min="0" max="20" value={d.home??''} onChange={e=>set('home',e.target.value)}
                            className="score-input" style={{ borderColor:'#FFD700', width:48, height:48, fontSize:'1.25rem' }} />
                          <span style={{ color:'#555570', fontFamily:'monospace', fontWeight:700 }}>:</span>
                          <input type="number" min="0" max="20" value={d.away??''} onChange={e=>set('away',e.target.value)}
                            className="score-input" style={{ borderColor:'#FFD700', width:48, height:48, fontSize:'1.25rem' }} />
                        </>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:4, padding:'0.35rem 0.875rem', background:'#06060A', border:`1px solid ${hasRes?'rgba(0,255,135,0.3)':'#1E1E2E'}`, borderRadius:'0.75rem', minWidth:72, justifyContent:'center' }}>
                          {hasRes ? (
                            <>
                              <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'1.2rem', color: m.penalty_winner==='home'?'#8B5CF6':'#00FF87' }}>{m.home_score}</span>
                              <span style={{ color:'#555570', margin:'0 2px' }}>-</span>
                              <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'1.2rem', color: m.penalty_winner==='away'?'#8B5CF6':'#00FF87' }}>{m.away_score}</span>
                              {m.penalty_winner && <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:'0.65rem', color:'#8B5CF6', marginLeft:2 }}>PEN</span>}
                            </>
                          ) : (
                            <span style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.8rem' }}>vs</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ flex:1, textAlign:'left' }}>
                      <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:isSlot?'#555570':'#F0F0FF', fontSize:'0.9rem', fontStyle:isSlot?'italic':'normal' }}>
                        {awayName} {awayFlag}
                      </p>
                    </div>
                  </div>

                  {!isGroup && isSlot && (
                    <p style={{ fontFamily:'DM Sans,sans-serif', color:'#555570', fontSize:'0.7rem', marginTop:6, textAlign:'center' }}>
                      ⏳ Se definirá cuando avance el bracket
                    </p>
                  )}

                  {isEdit && !isGroup && Number(d.home) === Number(d.away) && d.home !== '' && (
                    <div style={{ marginTop:'0.75rem', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:'0.75rem', padding:'0.75rem' }}>
                      <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8B5CF6', fontSize:'0.75rem', fontWeight:600, marginBottom:'0.5rem' }}>
                        ⚽ Empate — ¿Quién gana en penales?
                      </p>
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        {[
                          { val:'none',  label:'Sin definir' },
                          { val:'home',  label: homeName },
                          { val:'away',  label: awayName },
                        ].map(opt => (
                          <button key={opt.val} onClick={() => set('penalty_winner', opt.val)} style={{
                            flex:1, padding:'0.4rem 0.5rem', borderRadius:'0.625rem', border:'1px solid',
                            fontFamily:'DM Sans,sans-serif', fontSize:'0.72rem', cursor:'pointer', transition:'all 0.15s',
                            borderColor: d.penalty_winner===opt.val ? '#8B5CF6' : '#1E1E2E',
                            background:  d.penalty_winner===opt.val ? 'rgba(139,92,246,0.2)' : 'transparent',
                            color:       d.penalty_winner===opt.val ? '#8B5CF6' : '#555570',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'0.625rem' }}>
                    <div style={{ fontSize:'0.72rem', fontFamily:'DM Sans,sans-serif' }}>
                      {fb==='ok'  && <span style={{color:'#00FF87'}}>✓ Guardado · Puntos asignados automáticamente</span>}
                      {fb==='err' && <span style={{color:'#FF3366'}}>✗ Error al guardar</span>}
                    </div>
                    {isEdit ? (
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        <button onClick={()=>setEditing(null)} className="btn-secondary" style={{padding:'0.35rem 0.875rem',fontSize:'0.75rem'}}>Cancelar</button>
                        <button onClick={()=>handleSave(m)} disabled={saving===m.id} className="btn-primary" style={{padding:'0.35rem 0.875rem',fontSize:'0.75rem'}}>
                          {saving===m.id?'Guardando...':'✓ Guardar'}
                        </button>
                      </div>
                    ) : (
                      (!isSlot || isGroup) && (
                        <button onClick={()=>startEdit(m)} style={{ fontFamily:'DM Sans,sans-serif', fontSize:'0.75rem', color:'#555570', background:'transparent', border:'1px solid #1E1E2E', borderRadius:'0.625rem', padding:'0.35rem 0.75rem', cursor:'pointer', transition:'all 0.15s' }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='#FFD700';e.currentTarget.style.color='#FFD700'}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1E1E2E';e.currentTarget.style.color='#555570'}}
                        >
                          {hasRes?'✏️ Corregir':'+ Resultado'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}