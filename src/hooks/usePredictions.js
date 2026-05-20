import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth }  from '../context/AuthContext'

export function useMyPredictions(matchIds = [], leagueId = null) {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState({})
  const [loading,     setLoading]     = useState(false)

  const key = matchIds.slice().sort().join(',')

  const fetch = useCallback(async () => {
    if (!user?.id || !matchIds.length || !leagueId) {
      setPredictions({})
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id',   user.id)
      .eq('league_id', leagueId)
      .in('match_id',  matchIds)

    if (!error && data) {
      const map = {}
      data.forEach(p => { map[p.match_id] = p })
      setPredictions(map)
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, leagueId, key])

  useEffect(() => { fetch() }, [fetch])

  // upsertPrediction ahora acepta penaltyWinner opcional
  const upsertPrediction = async (matchId, home, away, penaltyWinner = null) => {
    if (!user?.id || !leagueId) return { error: 'Faltan datos' }

    const existing = predictions[matchId]
    const isDrawn  = Number(home) === Number(away)

    // Solo guardar penalty_winner si hay empate y es fase eliminatoria
    const resolvedPenWin = isDrawn ? (penaltyWinner ?? null) : null

    const payload = {
      user_id:                   user.id,
      match_id:                  matchId,
      league_id:                 leagueId,
      predicted_home:            Number(home),
      predicted_away:            Number(away),
      predicted_penalty_winner:  resolvedPenWin,
    }

    let data, error
    if (existing) {
      ;({ data, error } = await supabase
        .from('predictions')
        .update({
          predicted_home:           Number(home),
          predicted_away:           Number(away),
          predicted_penalty_winner: resolvedPenWin,
          updated_at:               new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single())
    } else {
      ;({ data, error } = await supabase
        .from('predictions')
        .insert(payload)
        .select()
        .single())
    }

    if (error) {
      console.error('upsertPrediction error:', error.message)
      return { error }
    }
    if (data) setPredictions(prev => ({ ...prev, [matchId]: data }))
    return { error: null }
  }

  return { predictions, loading, upsertPrediction, refetch: fetch }
}
