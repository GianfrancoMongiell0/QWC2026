// ============================================================
// BRACKET RESOLVER — WC 2026
// v3: fix duplicación de equipos en slots de mejores terceros
// ============================================================

const THIRD_PLACE_TABLE = {
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

function assignThirdPlaceSlots(bestThirds) {
  const slots = {}
  bestThirds.slice(0, 8).forEach(t => {
    slots[`3${t.group}`] = t
  })
  return slots
}

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

// Construye slots y también un Set de equipos ya asignados para evitar duplicados
function buildGroupSlots(GROUPS, getStandings) {
  const slots = {}
  const allThirds = []
  // Track qué equipos ya están en slots 1X o 2X
  const assignedTeams = new Set()

  GROUPS.forEach(g => {
    const standings = getStandings(g)
    if (standings[0]) {
      slots[`1${g}`] = { team: standings[0].team, flag: standings[0].flag }
      assignedTeams.add(standings[0].team)
    }
    if (standings[1]) {
      slots[`2${g}`] = { team: standings[1].team, flag: standings[1].flag }
      assignedTeams.add(standings[1].team)
    }
    if (standings[2]) {
      allThirds.push({ ...standings[2], group: g })
    }
  })

  // Ordenar terceros y tomar los 8 mejores
  // Filtrar equipos que ya están asignados como 1ro o 2do de otro grupo
  // (no debería pasar en teoría, pero por seguridad)
  const bestThirds = allThirds
    .filter(t => !assignedTeams.has(t.team))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)

  const thirdSlots = assignThirdPlaceSlots(bestThirds)
  Object.assign(slots, thirdSlots)

  return slots
}

export function resolveUserSlots(groupMatches, predictions) {
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
  return buildGroupSlots(GROUPS, (g) => {
    const gms = groupMatches.filter(m => m.group_name === g)
    return calcGroupStandings(gms, m => {
      const p = predictions[m.id]
      return p ? { home: p.predicted_home, away: p.predicted_away } : null
    })
  })
}

export function resolveAdminSlots(groupMatches) {
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
  return buildGroupSlots(GROUPS, (g) => {
    const gms = groupMatches.filter(m => m.group_name === g)
    return calcGroupStandings(gms, m =>
      m.home_score !== null ? { home: m.home_score, away: m.away_score } : null
    )
  })
}

// ── Resolver un slot individual ───────────────────────────────
// FIX: los slots de mejores terceros (3ABCDF) ahora usan un mapa
// de equipos ya usados en el bracket para evitar duplicados
function resolveSlot(slotStr, groupSlots, knockoutMatches, koResults, usedTeams) {
  if (!slotStr) return null

  // Slot de grupo: 1A, 2B
  if (/^[12][A-L]$/.test(slotStr)) {
    const resolved = groupSlots[slotStr] ?? { team: slotStr, flag: '' }
    if (resolved.team && resolved.team !== slotStr) usedTeams.add(resolved.team)
    return resolved
  }

  // Slot de mejor tercero: 3ABCDF (múltiples grupos posibles)
  // FIX: buscar el mejor tercero de esos grupos que NO haya sido usado ya
  if (/^3[A-L]{2,}/.test(slotStr)) {
    const groups = slotStr.slice(1).split('')
    // Obtener todos los candidatos de esos grupos, ordenados por pts
    const candidates = groups
      .map(g => groupSlots[`3${g}`] ? { ...groupSlots[`3${g}`], group: g } : null)
      .filter(Boolean)
      .filter(c => !usedTeams.has(c.team)) // excluir equipos ya usados en el bracket

    if (candidates.length > 0) {
      const chosen = candidates[0]
      usedTeams.add(chosen.team)
      return { team: chosen.team, flag: chosen.flag }
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

  // Slot de perdedor: L101
  if (/^L\d+$/.test(slotStr)) {
    const num = parseInt(slotStr.slice(1))
    const km  = knockoutMatches.find(m => m.match_number === num)
    if (!km) return { team: `Per. P${num}`, flag: '' }
    return koResults[km.id]?.loser ?? { team: `Per. P${num}`, flag: '' }
  }

  return { team: slotStr, flag: '' }
}

function getWinnerFromPrediction(pred, homeResolved, awayResolved) {
  if (!homeResolved || !awayResolved) return null
  const ph = pred?.predicted_home
  const pa = pred?.predicted_away
  if (ph === undefined || pa === undefined) return null

  if      (ph > pa) return { winner: homeResolved, loser: awayResolved }
  else if (pa > ph) return { winner: awayResolved, loser: homeResolved }
  else {
    // Empate → usar predicted_penalty_winner si existe
    if (pred?.predicted_penalty_winner === 'home') return { winner: homeResolved, loser: awayResolved }
    if (pred?.predicted_penalty_winner === 'away') return { winner: awayResolved, loser: homeResolved }
    return { winner: homeResolved, loser: awayResolved }
  }
}

function getWinnerFromResult(match, homeResolved, awayResolved) {
  if (!homeResolved || !awayResolved) return null
  if (match.home_score === null || match.away_score === null) return null

  const rh = match.home_score
  const ra = match.away_score

  if (rh > ra) return { winner: homeResolved, loser: awayResolved }
  if (ra > rh) return { winner: awayResolved, loser: homeResolved }

  if (match.penalty_winner === 'home') return { winner: homeResolved, loser: awayResolved }
  if (match.penalty_winner === 'away') return { winner: awayResolved, loser: homeResolved }

  return { winner: homeResolved, loser: awayResolved }
}

export function resolveKnockoutBracket(knockoutMatches, groupSlots, predictions) {
  const koResults  = {}
  const usedTeams  = new Set() // FIX: track equipos ya asignados
  const sorted     = [...knockoutMatches].sort((a, b) => a.match_number - b.match_number)

  const resolved = sorted.map(m => {
    const homeResolved = resolveSlot(m.home_team, groupSlots, sorted, koResults, usedTeams)
    const awayResolved = resolveSlot(m.away_team, groupSlots, sorted, koResults, usedTeams)

    const pred   = predictions?.[m.id]
    const result = getWinnerFromPrediction(pred, homeResolved, awayResolved)
    if (result) koResults[m.id] = result

    return { ...m, home_resolved: homeResolved, away_resolved: awayResolved }
  })

  return resolved
}

export function resolveRealKnockoutBracket(knockoutMatches, groupSlots) {
  const koResults  = {}
  const usedTeams  = new Set() // FIX: track equipos ya asignados
  const sorted     = [...knockoutMatches].sort((a, b) => a.match_number - b.match_number)

  const resolved = sorted.map(m => {
    const homeResolved = resolveSlot(m.home_team, groupSlots, sorted, koResults, usedTeams)
    const awayResolved = resolveSlot(m.away_team, groupSlots, sorted, koResults, usedTeams)

    const result = getWinnerFromResult(m, homeResolved, awayResolved)
    if (result) koResults[m.id] = result

    return { ...m, home_resolved: homeResolved, away_resolved: awayResolved }
  })

  return resolved
}