-- ============================================================
-- WC 2026 — PREDICCIÓN DE PENALES PARA USUARIOS
-- El usuario puede predecir quién gana en penales
-- cuando predice un empate en fase eliminatoria.
--
-- Sistema de puntos actualizado:
-- 3pts: marcador exacto (90min) O empate exacto + penales correctos
-- 2pts: tendencia correcta O empate exacto + penales incorrectos
-- 0pts: fallo
-- ============================================================

-- 1. Añadir campo predicted_penalty_winner a predictions
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS predicted_penalty_winner TEXT
  CHECK (predicted_penalty_winner IN ('home', 'away'));

-- 2. Actualizar función de cálculo de puntos
CREATE OR REPLACE FUNCTION calculate_prediction_points(
  p_pred_home     INTEGER,
  p_pred_away     INTEGER,
  p_pred_pen_win  TEXT,     -- 'home', 'away', o NULL
  p_real_home     INTEGER,
  p_real_away     INTEGER,
  p_real_pen_win  TEXT      -- 'home', 'away', o NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  is_draw_pred BOOLEAN;
  is_draw_real BOOLEAN;
BEGIN
  is_draw_pred := p_pred_home = p_pred_away;
  is_draw_real := p_real_home = p_real_away;

  -- Marcador exacto en 90 min (sin empate o empate sin penales en grupos)
  IF p_pred_home = p_real_home AND p_pred_away = p_real_away THEN
    -- Si es empate y hay penales reales, verificar si acertó los penales
    IF is_draw_real AND p_real_pen_win IS NOT NULL THEN
      IF p_pred_pen_win = p_real_pen_win THEN
        RETURN 3; -- Empate exacto + penales correctos
      ELSE
        RETURN 2; -- Empate exacto + penales incorrectos
      END IF;
    END IF;
    RETURN 3; -- Marcador exacto sin penales
  END IF;

  -- Tendencia correcta (mismo ganador)
  IF SIGN(p_pred_home - p_pred_away) = SIGN(p_real_home - p_real_away) THEN
    RETURN 2;
  END IF;

  RETURN 0;
END;
$$;

-- 3. Actualizar trigger para usar la nueva firma de la función
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
    OR OLD.penalty_winner IS DISTINCT FROM NEW.penalty_winner
  )
  THEN
    -- Resetear predicciones ya puntuadas si se corrige el resultado
    UPDATE public.predictions
    SET is_scored = false, points_earned = 0
    WHERE match_id = NEW.id AND is_scored = true;

    FOR pred IN
      SELECT id, user_id, league_id,
             predicted_home, predicted_away, predicted_penalty_winner
      FROM   public.predictions
      WHERE  match_id  = NEW.id
      AND    is_scored = false
    LOOP
      earned_pts := calculate_prediction_points(
        pred.predicted_home,
        pred.predicted_away,
        pred.predicted_penalty_winner,
        NEW.home_score,
        NEW.away_score,
        NEW.penalty_winner
      );

      UPDATE public.predictions
      SET    points_earned = earned_pts,
             is_scored     = true,
             updated_at    = NOW()
      WHERE  id = pred.id;

      UPDATE public.users_profiles
      SET    total_points = total_points + earned_pts,
             updated_at   = NOW()
      WHERE  id = pred.user_id;

      UPDATE public.league_members
      SET    points = points + earned_pts
      WHERE  user_id   = pred.user_id
      AND    league_id = pred.league_id;

    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'predictions'
ORDER BY ordinal_position;
