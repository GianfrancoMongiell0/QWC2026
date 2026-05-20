export const hasMatchStarted = (dt) => new Date(dt) <= new Date()
export const minutesUntil    = (dt) => Math.floor((new Date(dt) - new Date()) / 60000)

export const fmtDate = (dt) => new Date(dt).toLocaleDateString('es-MX', {
  weekday: 'short', day: 'numeric', month: 'short'
})
export const fmtTime = (dt) => new Date(dt).toLocaleTimeString('es-MX', {
  hour: '2-digit', minute: '2-digit'
})

export const groupByDate = (matches) => {
  const g = {}
  matches.forEach(m => {
    const k = fmtDate(m.match_datetime)
    if (!g[k]) g[k] = []
    g[k].push(m)
  })
  return g
}

export const statusLabel = (s) => ({
  upcoming: 'Próximo', live: '🔴 EN VIVO', finished: 'Finalizado', postponed: 'Postergado'
}[s] ?? s)

export const statusColor = (s) => ({
  upcoming: '#555570', live: '#00FF87', finished: '#00D4FF', postponed: '#FF3366'
}[s] ?? '#555570')
