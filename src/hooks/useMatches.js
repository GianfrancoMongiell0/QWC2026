import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useGroupMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('phase', 'group')
      .order('match_datetime', { ascending: true })
    setMatches(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  // Realtime: cuando admin actualiza resultado
  useEffect(() => {
    const ch = supabase.channel('group_matches')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' },
        payload => setMatches(prev => prev.map(m => m.id === payload.new.id ? payload.new : m)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  return { matches, loading, refetch: fetch }
}

export function useKnockoutMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select('*')
      .neq('phase', 'group')
      .order('match_datetime', { ascending: true })
    setMatches(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { matches, loading, refetch: fetch }
}

export function useAllMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_datetime', { ascending: true })
    setMatches(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { matches, loading, refetch: fetch }
}
