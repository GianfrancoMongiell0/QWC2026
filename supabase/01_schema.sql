-- ============================================================
-- QUINIELA WC 2026 — SCHEMA v2
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.users_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  full_name    TEXT DEFAULT '',
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.leagues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  code        TEXT UNIQUE NOT NULL,
  owner_id    UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.league_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  points    INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, user_id)
);

CREATE TABLE public.matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_number   INTEGER UNIQUE NOT NULL,
  phase          TEXT NOT NULL DEFAULT 'group' CHECK (phase IN ('group','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final')),
  group_name     TEXT,
  home_team      TEXT NOT NULL DEFAULT 'TBD',
  away_team      TEXT NOT NULL DEFAULT 'TBD',
  home_team_flag TEXT DEFAULT '',
  away_team_flag TEXT DEFAULT '',
  match_datetime TIMESTAMPTZ NOT NULL,
  venue          TEXT DEFAULT '',
  home_score     INTEGER,
  away_score     INTEGER,
  status         TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','finished','postponed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.predictions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  match_id       UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home INTEGER NOT NULL DEFAULT 0 CHECK (predicted_home >= 0),
  predicted_away INTEGER NOT NULL DEFAULT 0 CHECK (predicted_away >= 0),
  points_earned  INTEGER NOT NULL DEFAULT 0,
  is_scored      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX idx_pred_match ON public.predictions(match_id);
CREATE INDEX idx_pred_user  ON public.predictions(user_id);
CREATE INDEX idx_match_dt   ON public.matches(match_datetime);
CREATE INDEX idx_mem_league ON public.league_members(league_id);
CREATE INDEX idx_mem_user   ON public.league_members(user_id);

-- Función: código de liga
CREATE OR REPLACE FUNCTION generate_league_code() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE chars TEXT:='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code TEXT:=''; i INT;
BEGIN FOR i IN 1..6 LOOP code:=code||substr(chars,floor(random()*length(chars)+1)::INT,1); END LOOP; RETURN code; END; $$;

-- Función: calcular puntos
CREATE OR REPLACE FUNCTION calculate_prediction_points(ph INT,pa INT,rh INT,ra INT) RETURNS INT LANGUAGE plpgsql AS $$
BEGIN
  IF ph=rh AND pa=ra THEN RETURN 3; END IF;
  IF SIGN(ph-pa)=SIGN(rh-ra) THEN RETURN 2; END IF;
  RETURN 0;
END; $$;

-- Trigger: puntuar predicciones al ingresar resultado
CREATE OR REPLACE FUNCTION score_predictions_on_result() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE pred RECORD; pts INT;
BEGIN
  IF NEW.status='finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL
     AND (OLD.status!='finished' OR OLD.home_score IS DISTINCT FROM NEW.home_score OR OLD.away_score IS DISTINCT FROM NEW.away_score)
  THEN
    FOR pred IN SELECT id,user_id,predicted_home,predicted_away FROM public.predictions WHERE match_id=NEW.id AND is_scored=false LOOP
      pts:=calculate_prediction_points(pred.predicted_home,pred.predicted_away,NEW.home_score,NEW.away_score);
      UPDATE public.predictions SET points_earned=pts,is_scored=true,updated_at=NOW() WHERE id=pred.id;
      UPDATE public.users_profiles SET total_points=total_points+pts,updated_at=NOW() WHERE id=pred.user_id;
      UPDATE public.league_members SET points=points+pts WHERE user_id=pred.user_id;
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_score_predictions AFTER UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION score_predictions_on_result();

-- Trigger: crear perfil automático al registrarse
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users_profiles(id,username,full_name,avatar_url)
  VALUES(NEW.id,COALESCE(NEW.raw_user_meta_data->>'username',split_part(NEW.email,'@',1)),COALESCE(NEW.raw_user_meta_data->>'full_name',''),NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
