-- ============================================================
-- FIX: Predicciones por liga (no globales)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Limpiar predicciones de prueba
DELETE FROM public.predictions;

-- 2. Agregar columna league_id
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE;

-- 3. Hacer league_id NOT NULL
ALTER TABLE public.predictions
  ALTER COLUMN league_id SET NOT NULL;

-- 4. Cambiar UNIQUE: ahora es por usuario + partido + liga
ALTER TABLE public.predictions
  DROP CONSTRAINT IF EXISTS predictions_user_id_match_id_key;

ALTER TABLE public.predictions
  DROP CONSTRAINT IF EXISTS predictions_user_match_league_key;

ALTER TABLE public.predictions
  ADD CONSTRAINT predictions_user_match_league_key
  UNIQUE (user_id, match_id, league_id);

-- 5. Índice
DROP INDEX IF EXISTS idx_predictions_league;
CREATE INDEX idx_predictions_league ON public.predictions(league_id);

-- 6. Actualizar políticas RLS
DROP POLICY IF EXISTS "predictions_select" ON public.predictions;
DROP POLICY IF EXISTS "predictions_insert" ON public.predictions;
DROP POLICY IF EXISTS "predictions_update" ON public.predictions;
DROP POLICY IF EXISTS "predictions_delete" ON public.predictions;

CREATE POLICY "predictions_select" ON public.predictions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.match_datetime <= NOW()
    )
  );

CREATE POLICY "predictions_insert" ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND league_id IN (
      SELECT league_id FROM public.league_members WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.match_datetime > NOW()
        AND m.status = 'upcoming'
    )
  );

CREATE POLICY "predictions_update" ON public.predictions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.match_datetime > NOW()
        AND m.status = 'upcoming'
    )
  );

CREATE POLICY "predictions_delete" ON public.predictions FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.match_datetime > NOW()
    )
  );

-- 7. Actualizar trigger de puntuación para respetar league_id
CREATE OR REPLACE FUNCTION score_predictions_on_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pred       RECORD;
  earned_pts INTEGER;
BEGIN
  IF  NEW.status     = 'finished'
  AND NEW.home_score IS NOT NULL
  AND NEW.away_score IS NOT NULL
  AND (
    OLD.status != 'finished'
    OR OLD.home_score IS DISTINCT FROM NEW.home_score
    OR OLD.away_score IS DISTINCT FROM NEW.away_score
  )
  THEN
    FOR pred IN
      SELECT id, user_id, league_id, predicted_home, predicted_away
      FROM   public.predictions
      WHERE  match_id  = NEW.id
      AND    is_scored = false
    LOOP
      earned_pts := calculate_prediction_points(
        pred.predicted_home, pred.predicted_away,
        NEW.home_score, NEW.away_score
      );

      UPDATE public.predictions
      SET    points_earned = earned_pts, is_scored = true, updated_at = NOW()
      WHERE  id = pred.id;

      UPDATE public.users_profiles
      SET    total_points = total_points + earned_pts, updated_at = NOW()
      WHERE  id = pred.user_id;

      -- Solo la liga correspondiente a esta predicción
      UPDATE public.league_members
      SET    points = points + earned_pts
      WHERE  user_id   = pred.user_id
      AND    league_id = pred.league_id;

    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Verificar estructura final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'predictions'
ORDER BY ordinal_position;
