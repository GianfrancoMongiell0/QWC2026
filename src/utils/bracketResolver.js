// ============================================================
// BRACKET RESOLVER — WC 2026 v5
// slot_home/slot_away: slots originales (bracket del usuario)
// home_team/away_team: equipos reales (los define el admin)
// ============================================================

export function calcGroupStandings(matches, getScore) {
  const teams = {}
  matches.forEach(m => {
    if (!teams[m.home_team]) teams[m.home_team] = { team: m.home_team, flag: m.home_team_flag ?? '', pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0, gd: 0 }
    if (!teams[m.away_team]) teams[m.away_team] = { team: m.away_team, flag: m.away_team_flag ?? '', pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0, gd: 0 }
    const score = getScore(m)
    if (!score) return
    const { home: ph, away: pa } = score
    const h = teams[m.home_team], a = teams[m.away_team]
    h.pj++; a.pj++
    h.gf += ph; h.gc += pa; h.gd = h.gf - h.gc
    a.gf += pa; a.gc += ph; a.gd = a.gf - a.gc
    if (ph > pa) { h.pg++; h.pts += 3; a.pp++ }
    else if (ph < pa) { a.pg++; a.pts += 3; h.pp++ }
    else { h.pe++; h.pts++; a.pe++; a.pts++ }
  })
  return Object.values(teams).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team))
}

// ¿Es un equipo real o un slot sin resolver?
function isRealTeam(t) {
  if (!t || t === 'TBD') return false
  return !/^([123][A-L]$|3[A-L]{2,}|W\d+$|L\d+$)/.test(t)
}

function buildGroupSlots(GROUPS, getStandings) {
  const slots = {}
  const allThirds = []
  const assignedTeams = new Set()

  GROUPS.forEach(g => {
    const standings = getStandings(g)
    if (standings[0]) { slots[`1${g}`] = { team: standings[0].team, flag: standings[0].flag }; assignedTeams.add(standings[0].team) }
    if (standings[1]) { slots[`2${g}`] = { team: standings[1].team, flag: standings[1].flag }; assignedTeams.add(standings[1].team) }
    if (standings[2]) allThirds.push({ ...standings[2], group: g })
  })

  // Ordenar terceros y tomar los 8 mejores
  const best8 = allThirds
    .filter(t => !assignedTeams.has(t.team))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)

  best8.forEach(t => {
    slots[`3${t.group}`] = { team: t.team, flag: t.flag }
    assignedTeams.add(t.team)
  })

  return { slots, assignedTeams }
}

export function resolveUserSlots(groupMatches, predictions) {
  const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  const { slots } = buildGroupSlots(GROUPS, (g) => {
    const gms = groupMatches.filter(m => m.group_name === g)
    return calcGroupStandings(gms, m => {
      const p = predictions[m.id]
      return p ? { home: p.predicted_home, away: p.predicted_away } : null
    })
  })
  return slots
}

export function resolveAdminSlots(groupMatches) {
  const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  const { slots } = buildGroupSlots(GROUPS, (g) => {
    const gms = groupMatches.filter(m => m.group_name === g)
    return calcGroupStandings(gms, m =>
      m.home_score !== null ? { home: m.home_score, away: m.away_score } : null
    )
  })
  return slots
}

// Resolver un slot individual
function resolveSlot(slotStr, groupSlots, knockoutMatches, koResults, usedTeams) {
  if (!slotStr) return null

  // Slot de grupo: 1A, 2B
  if (/^[12][A-L]$/.test(slotStr)) {
    const resolved = groupSlots[slotStr] ?? { team: slotStr, flag: '' }
    if (resolved.team && resolved.team !== slotStr) usedTeams.add(resolved.team)
    return resolved
  }

  // Slot de mejor tercero: 3ABCDF
  if (/^3[A-L]{2,}/.test(slotStr)) {
    const groups = slotStr.slice(1).split('')
    const candidates = groups
      .map(g => groupSlots[`3${g}`] ? { ...groupSlots[`3${g}`], group: g } : null)
      .filter(Boolean)
      .filter(c => !usedTeams.has(c.team))

    if (candidates.length > 0) {
      const chosen = candidates[0]
      usedTeams.add(chosen.team)
      return { team: chosen.team, flag: chosen.flag }
    }

    // Fallback: cualquier mejor tercero disponible no usado
    const allThirdKeys = Object.keys(groupSlots).filter(k => k.startsWith('3') && k.length === 2)
    for (const key of allThirdKeys) {
      const candidate = groupSlots[key]
      if (candidate && !usedTeams.has(candidate.team)) {
        usedTeams.add(candidate.team)
        return { team: candidate.team, flag: candidate.flag }
      }
    }

    return { team: slotStr, flag: '' }
  }

  // Slot de ganador: W73
  if (/^W\d+$/.test(slotStr)) {
    const num = parseInt(slotStr.slice(1))
    const km = knockoutMatches.find(m => m.match_number === num)
    if (!km) return { team: `Gan. P${num}`, flag: '' }
    return koResults[km.id]?.winner ?? { team: `Gan. P${num}`, flag: '' }
  }

  // Slot de perdedor: L101
  if (/^L\d+$/.test(slotStr)) {
    const num = parseInt(slotStr.slice(1))
    const km = knockoutMatches.find(m => m.match_number === num)
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
  if (ph > pa) return { winner: homeResolved, loser: awayResolved }
  if (pa > ph) return { winner: awayResolved, loser: homeResolved }
  if (pred?.predicted_penalty_winner === 'home') return { winner: homeResolved, loser: awayResolved }
  if (pred?.predicted_penalty_winner === 'away') return { winner: awayResolved, loser: homeResolved }
  return { winner: homeResolved, loser: awayResolved }
}

function getWinnerFromResult(match, homeResolved, awayResolved) {
  if (!homeResolved || !awayResolved) return null
  if (match.home_score === null || match.away_score === null) return null
  const rh = match.home_score, ra = match.away_score
  if (rh > ra) return { winner: homeResolved, loser: awayResolved }
  if (ra > rh) return { winner: awayResolved, loser: homeResolved }
  if (match.penalty_winner === 'home') return { winner: homeResolved, loser: awayResolved }
  if (match.penalty_winner === 'away') return { winner: awayResolved, loser: homeResolved }
  return { winner: homeResolved, loser: awayResolved }
}

// ── BRACKET DEL USUARIO ─────────────────────────────────────
// Siempre resuelve desde los SLOTS (slot_home/slot_away) con
// las predicciones del usuario. Ignora los equipos reales.
export function resolveKnockoutBracket(knockoutMatches, groupSlots, predictions) {
  const koResults = {}
  const usedTeams = new Set()
  const sorted = [...knockoutMatches].sort((a, b) => a.match_number - b.match_number)
  const resolved = sorted.map(m => {
    const homeResolved = resolveSlot(m.slot_home ?? m.home_team, groupSlots, sorted, koResults, usedTeams)
    const awayResolved = resolveSlot(m.slot_away ?? m.away_team, groupSlots, sorted, koResults, usedTeams)
    const pred = predictions?.[m.id]
    const result = getWinnerFromPrediction(pred, homeResolved, awayResolved)
    if (result) koResults[m.id] = result
    return { ...m, home_resolved: homeResolved, away_resolved: awayResolved }
  })
  return resolved
}

// ── BRACKET REAL (ADMIN) ────────────────────────────────────
// Si el admin ya definió el equipo real en home_team/away_team,
// se usa ese. Si no, se resuelve desde el slot como fallback.
export function resolveRealKnockoutBracket(knockoutMatches, groupSlots) {
  const koResults = {}
  const usedTeams = new Set()
  const sorted = [...knockoutMatches].sort((a, b) => a.match_number - b.match_number)
  const resolved = sorted.map(m => {
    let homeResolved, awayResolved

    if (isRealTeam(m.home_team)) {
      homeResolved = { team: m.home_team, flag: m.home_team_flag ?? '' }
      usedTeams.add(m.home_team)
    } else {
      homeResolved = resolveSlot(m.home_team, groupSlots, sorted, koResults, usedTeams)
    }

    if (isRealTeam(m.away_team)) {
      awayResolved = { team: m.away_team, flag: m.away_team_flag ?? '' }
      usedTeams.add(m.away_team)
    } else {
      awayResolved = resolveSlot(m.away_team, groupSlots, sorted, koResults, usedTeams)
    }

    const result = getWinnerFromResult(m, homeResolved, awayResolved)
    if (result) koResults[m.id] = result
    return { ...m, home_resolved: homeResolved, away_resolved: awayResolved }
  })
  return resolved
}