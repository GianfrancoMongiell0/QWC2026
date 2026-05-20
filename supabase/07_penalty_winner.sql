-- ============================================================
-- WC 2026 — PENALES Y TIEMPO EXTRA
-- Añade penalty_winner a matches para resolver el bracket
-- correctamente en partidos que van a penales
-- ============================================================

-- 1. Añadir columna penalty_winner
--    Valores: NULL (no hubo penales), 'home', 'away'
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS penalty_winner TEXT
  CHECK (penalty_winner IN ('home', 'away'));

-- 2. El trigger ya puntúa correctamente (usa home_score/away_score
--    que reflejan el 90min). Solo necesitamos que el bracket
--    use penalty_winner cuando home_score = away_score.
--    No hay que tocar score_predictions_on_result.

-- 3. Verificar estructura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'matches'
ORDER BY ordinal_position;
