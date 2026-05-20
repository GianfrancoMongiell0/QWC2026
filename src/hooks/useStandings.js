import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useStandings(leagueId) {
  const [standings, setStandings] = useState([])
  const [loading,   setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    const { data } = await supabase
      .from('league_members')
      .select('points, user_id, users_profiles(id, username, full_name, total_points)')
      .eq('league_id', leagueId)
      .order('points', { ascending: false })
    setStandings(data ?? [])
    setLoading(false)
  }, [leagueId])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (!leagueId) return
    const ch = supabase.channel(`standings_${leagueId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'league_members', filter: `league_id=eq.${leagueId}` },
        () => fetch())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [leagueId, fetch])

  return { standings, loading }
}
