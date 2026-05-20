import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth }  from '../context/AuthContext'

export function useMyLeagues() {
  const { user } = useAuth()
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      // Paso 1: mis membresías
      const { data: mems, error: e1 } = await supabase
        .from('league_members')
        .select('league_id, points, joined_at')
        .eq('user_id', user.id)

      if (e1) throw e1
      if (!mems?.length) { setLeagues([]); return }

      const ids = mems.map(m => m.league_id)

      // Paso 2: detalles de ligas
      const { data: lgs, error: e2 } = await supabase
        .from('leagues')
        .select('id, name, description, code, is_active, owner_id')
        .in('id', ids)

      if (e2) throw e2

      // Paso 3: contar miembros
      const { data: allMems } = await supabase
        .from('league_members')
        .select('league_id')
        .in('league_id', ids)

      const countMap = {}
      allMems?.forEach(m => { countMap[m.league_id] = (countMap[m.league_id] || 0) + 1 })

      // Combinar
      const result = mems
        .map(m => {
          const lg = lgs?.find(l => l.id === m.league_id)
          if (!lg) return null
          return { points: m.points, joined_at: m.joined_at, leagues: { ...lg, member_count: countMap[m.league_id] ?? 1 } }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))

      setLeagues(result)
    } catch (e) {
      console.error('useMyLeagues:', e.message)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetch() }, [fetch])
  return { leagues, loading, error, refetch: fetch }
}

export function useCreateLeague() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const createLeague = async ({ name, description }) => {
    setLoading(true); setError(null)
    try {
      const { data: code, error: e1 } = await supabase.rpc('generate_league_code')
      if (e1) throw e1

      const { data: lg, error: e2 } = await supabase
        .from('leagues')
        .insert({ name: name.trim(), description: description?.trim() ?? '', code, owner_id: user.id })
        .select()
        .single()
      if (e2) throw e2

      const { error: e3 } = await supabase
        .from('league_members')
        .insert({ league_id: lg.id, user_id: user.id })
      if (e3) throw e3

      return lg
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }
  return { createLeague, loading, error }
}

export function useJoinLeague() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const joinLeague = async (code) => {
    setLoading(true); setError(null)
    try {
      const { data: lg, error: e1 } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle()

      if (e1) throw e1
      if (!lg) { setError('Código inválido o liga no encontrada.'); return null }

      const { data: exists } = await supabase
        .from('league_members')
        .select('id')
        .eq('league_id', lg.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (exists) { setError('Ya eres miembro de esta liga.'); return null }

      const { error: e2 } = await supabase
        .from('league_members')
        .insert({ league_id: lg.id, user_id: user.id })
      if (e2) throw e2

      return lg
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }
  return { joinLeague, loading, error }
}

export function useLeagueDetail(leagueId) {
  const [league,  setLeague]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leagueId) return
    supabase.from('leagues').select('*').eq('id', leagueId).maybeSingle()
      .then(({ data }) => { setLeague(data); setLoading(false) })
  }, [leagueId])

  return { league, loading }
}
