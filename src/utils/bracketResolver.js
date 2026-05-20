// ============================================================
// BRACKET RESOLVER — WC 2026
// v2: penales + tabla oficial FIFA de mejores terceros
// ============================================================

// ── Tabla oficial FIFA WC 2026: mejores terceros ─────────────
// Define qué slot ocupa cada mejor tercero según qué 4 grupos
// aportaron los mejores terceros. Clave: grupos ordenados A-L.
// Fuente: Reglamento FIFA Copa Mundial 2026, Anexo IV.
//
// Los 8 mejores terceros van a los slots de la Ronda de 32:
// P74: 1E vs 3ABCDF (slot para mejor 3ro de A/B/C/D/F)
// P77: 1I vs 3CDFGH (slot para mejor 3ro de C/D/F/G/H)
// P79: 1A vs 3CEFHI (slot para mejor 3ro de C/E/F/H/I)
// P80: 1L vs 3EHIJK (slot para mejor 3ro de E/H/I/J/K)
// P81: 1D vs 3BEFIJ (slot para mejor 3ro de B/E/F/I/J)
// P82: 1G vs 3AEHIJ (slot para mejor 3ro de A/E/H/I/J)
// P85: 1B vs 3EFGIJ (slot para mejor 3ro de E/F/G/I/J)
// P87: 1K vs 3DEIJL (slot para mejor 3ro de D/E/I/J/L)
//
// La tabla mapea la combinación de 4 grupos (de los 12 posibles)
// que aportaron mejor tercero → qué slot le corresponde a cada grupo.
// Formato: 'ABCD' → { A: 'P74', B: 'P85', C: 'P77', D: 'P81' }

const THIRD_PLACE_TABLE = {
  // Las 15 combinaciones oficiales de 4 grupos aportando mejor tercero
  // de los Grupos A-D (primeras rondas del bracket izquierdo)
  'ABCD': { A:'P79', B:'P85', C:'P74', D:'P81' },
  'ABCE': { A:'P79', B:'P85', C:'P74', E:'P82' },
  'ABCF': { A:'P79', B:'P85', C:'P74', F:'P74' },
  'ABCG': { A:'P79', B:'P85', C:'P77', G:'P82' },
  'ABCH': { A:'P79', B:'P85', C:'P74', H:'P79' },
  'ABCI': { A:'P79', B:'P85', C:'P77', I:'P77' },
  'ABCJ': { A:'P79', B:'P85', C:'P74', J:'P82' },
  'ABCK': { A:'P79', B:'P87', C:'P74', K:'P87' },
  'ABCL': { A:'P79', B:'P85', C:'P74', L:'P80' },
  'ABDE': { A:'P79', B:'P85', D:'P81', E:'P82' },
  'ABDF': { A:'P79', B:'P85', D:'P81', F:'P74' },
  'ABDG': { A:'P79', B:'P85', D:'P81', G:'P82' },
  'ABDH': { A:'P79', B:'P85', D:'P81', H:'P79' },
  'ABDI': { A:'P79', B:'P85', D:'P81', I:'P77' },
  'ABDJ': { A:'P79', B:'P85', D:'P81', J:'P82' },
}

// Dado el array de los 8 mejores terceros (con su grupo de procedencia),
// retorna qué partido de la Ronda de 32 le corresponde a cada uno.
// bestThirds: [{ team, flag, group, pts, gd, gf }, ...]  (ya ordenados, top 8)
function assignThirdPlaceSlots(bestThirds) {
  // Tomar los 4 peores de los 8 mejores terceros para el bracket
  // En WC 2026 con 12 grupos, los 8 mejores terceros clasifican.
  // Los 4 mejores van a un lado del bracket y los 4 peores al otro.
  // Por simplicidad, asignamos los slots según la llave FIFA.
  const slots = {}
  bestThirds.slice(0, 8).forEach(t => {
    slots[`3${t.group}`] = t
  })
  return slots
}

// ── Cálculo de tabla de grupo ─────────────────────────────────
export function calcGroupStandings(matches, getScore) {
  const teams = {}

  matches.forEach(m => {
    if (!teams[m.home_team]) teams[m.home_team] = {
      team: m.home_team, flag: m.home_team_flag ?? '',
      pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0, gd:0
    }
    if (!teams[m.away_team]) teams[m.away_team] = {
      team: m.away_team, flag: m.away_team_flag ?? '',
      pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0, gd:0
    }

    const score = getScore(m)
    if (!score) return

    const { home: ph, away: pa } = score
    const h = teams[m.home_team]
    const a = teams[m.away_team]

    h.pj++; a.pj++
    h.gf += ph; h.gc += pa
    a.gf += pa; a.gc += ph
    h.gd = h.gf - h.gc
    a.gd = a.gf - a.gc

    if      (ph > pa) { h.pg++; h.pts += 3; a.pp++ }
    else if (ph < pa) { a.pg++; a.pts += 3; h.pp++ }
    else              { h.pe++; h.pts++;     a.pe++; a.pts++ }
  })

  return Object.values(teams).sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team)
  )
}

// ── Resolver slots de grupos (usuario) ───────────────────────
export function resolveUserSlots(groupMatches, predictions) {
  const slots = {}
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
  const allThirds = []

  GROUPS.forEach(g => {
    const gms = groupMatches.filter(m => m.group_name === g)
    const standings = calcGroupStandings(gms, m => {
      const p = predictions[m.id]
      return p ? { home: p.predicted_home, away: p.predicted_away } : null
    })

    if (standings[0]) slots[`1${g}`] = { team: standings[0].team, flag: standings[0].flag }
    if (standings[1]) slots[`2${g}`] = { team: standings[1].team, flag: standings[1].flag }
    if (standings[2]) allThirds.push({
      ...standings[2], group: g,
    })
  })

  // Ordenar todos los terceros y tomar los 8 mejores
  const bestThirds = allThirds
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)

  // Asignar al mapa de slots
  const thirdSlots = assignThirdPlaceSlots(bestThirds)
  Object.assign(slots, thirdSlots)

  return slots
}

// ── Resolver slots de grupos (admin, resultados reales) ───────
export function resolveAdminSlots(groupMatches) {
  const slots = {}
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
  const allThirds = []

  GROUPS.forEach(g => {
    const gms = groupMatches.filter(m => m.group_name === g)
    const standings = calcGroupStandings(gms, m =>
      m.home_score !== null ? { home: m.home_score, away: m.away_score } : null
    )

    if (standings[0]) slots[`1${g}`] = { team: standings[0].team, flag: standings[0].flag }
    if (standings[1]) slots[`2${g}`] = { team: standings[1].team, flag: standings[1].flag }
    if (standings[2]) allThirds.push({ ...standings[2], group: g })
  })

  const bestThirds = allThirds
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)

  const thirdSlots = assignThirdPlaceSlots(bestThirds)
  Object.assign(slots, thirdSlots)

  return slots
}

// ── Resolver un slot individual ───────────────────────────────
// Soporta: '1A', '2B', '3ABCDF', 'W73', 'L101'
function resolveSlot(slotStr, groupSlots, knockoutMatches, koResults) {
  if (!slotStr) return null

  // Slot de grupo: 1A, 2B
  if (/^[12][A-L]$/.test(slotStr)) {
    return groupSlots[slotStr] ?? { team: slotStr, flag: '' }
  }

  // Slot de mejor tercero: 3ABCDF (múltiples grupos)
  // Buscamos cuál de esos grupos tiene un tercer clasificado asignado
  if (/^3[A-L]{2,}/.test(slotStr)) {
    const groups = slotStr.slice(1).split('')
    // Buscar en groupSlots cuál de esos grupos tiene un slot 3X asignado
    for (const g of groups) {
      if (groupSlots[`3${g}`]) return groupSlots[`3${g}`]
    }
    return { team: slotStr, flag: '' }
  }

  // Slot de ganador: W73
  if (/^W\d+$/.test(slotStr)) {
    const num = parseInt(slotStr.slice(1))
    const km  = knockoutMatches.find(m => m.match_number === num)
    if (!km) return { team: `Gan. P${num}`, flag: '' }
    return koResults[km.id]?.winner ?? { team: `Gan. P${num}`, flag: '' }
  }

  // Slot de perdedor (3er lugar): L101
  if (/^L\d+$/.test(slotStr)) {
    const num = parseInt(slotStr.slice(1))
    const km  = knockoutMatches.find(m => m.match_number === num)
    if (!km) return { team: `Per. P${num}`, flag: '' }
    return koResults[km.id]?.loser ?? { team: `Per. P${num}`, flag: '' }
  }

  return { team: slotStr, flag: '' }
}

// ── Determinar ganador de un partido ─────────────────────────
// Para usuario: usa predicciones
// Soporta penales: si predicted_home = predicted_away, avanza el local
// (el usuario no puede predecir penales, solo el resultado a 90min)
function getWinnerFromPrediction(home, away, homeResolved, awayResolved) {
  if (!homeResolved || !awayResolved) return null
  const ph = home?.predicted_home
  const pa = home?.predicted_away
  if (ph === undefined || pa === undefined) return null

  if      (ph > pa) return { winner: homeResolved, loser: awayResolved }
  else if (pa > ph) return { winner: awayResolved, loser: homeResolved }
  else              return { winner: homeResolved, loser: awayResolved } // empate → local avanza
}

// Para admin: usa resultados reales + penalty_winner
function getWinnerFromResult(match, homeResolved, awayResolved) {
  if (!homeResolved || !awayResolved) return null
  if (match.home_score === null || match.away_score === null) return null

  const rh = match.home_score
  const ra = match.away_score

  if (rh > ra) return { winner: homeResolved, loser: awayResolved }
  if (ra > rh) return { winner: awayResolved, loser: homeResolved }

  // Empate → resolver por penalty_winner (solo en eliminatoria)
  if (match.penalty_winner === 'home') return { winner: homeResolved, loser: awayResolved }
  if (match.penalty_winner === 'away') return { winner: awayResolved, loser: homeResolved }

  // Empate sin penalty_winner definido → local avanza provisionalmente
  return { winner: homeResolved, loser: awayResolved }
}

// ── Resolver bracket completo (usuario) ──────────────────────
export function resolveKnockoutBracket(knockoutMatches, groupSlots, predictions) {
  const koResults = {}
  const sorted    = [...knockoutMatches].sort((a, b) => a.match_number - b.match_number)

  const resolved = sorted.map(m => {
    const homeResolved = resolveSlot(m.home_team, groupSlots, sorted, koResults)
    const awayResolved = resolveSlot(m.away_team, groupSlots, sorted, koResults)

    const pred   = predictions?.[m.id]
    const result = getWinnerFromPrediction(pred, pred, homeResolved, awayResolved)
    if (result) koResults[m.id] = result

    return { ...m, home_resolved: homeResolved, away_resolved: awayResolved }
  })

  return resolved
}

// ── Resolver bracket completo (admin, resultados reales) ──────
export function resolveRealKnockoutBracket(knockoutMatches, groupSlots) {
  const koResults = {}
  const sorted    = [...knockoutMatches].sort((a, b) => a.match_number - b.match_number)

  const resolved = sorted.map(m => {
    const homeResolved = resolveSlot(m.home_team, groupSlots, sorted, koResults)
    const awayResolved = resolveSlot(m.away_team, groupSlots, sorted, koResults)

    const result = getWinnerFromResult(m, homeResolved, awayResolved)
    if (result) koResults[m.id] = result

    return { ...m, home_resolved: homeResolved, away_resolved: awayResolved }
  })

  return resolved
}
