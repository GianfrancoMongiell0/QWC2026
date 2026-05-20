-- ============================================================
-- QUINIELA WC 2026 — RLS v2 (simplificado y probado)
-- ============================================================
ALTER TABLE public.users_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions      ENABLE ROW LEVEL SECURITY;

-- users_profiles
CREATE POLICY "profiles_select" ON public.users_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.users_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.users_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- leagues
CREATE POLICY "leagues_select" ON public.leagues FOR SELECT TO authenticated USING (true);
CREATE POLICY "leagues_insert" ON public.leagues FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "leagues_update" ON public.leagues FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "leagues_delete" ON public.leagues FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- league_members: política simple, todos los autenticados pueden ver todas las membresías
CREATE POLICY "members_select" ON public.league_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_insert" ON public.league_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "members_delete" ON public.league_members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- matches: todos leen, solo admin escribe
CREATE POLICY "matches_select" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_insert" ON public.matches FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.users_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "matches_update" ON public.matches FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.users_profiles WHERE id = auth.uid()) = 'admin');

-- predictions
CREATE POLICY "predictions_select" ON public.predictions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.match_datetime <= NOW()));

CREATE POLICY "predictions_insert" ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.match_datetime > NOW() AND m.status = 'upcoming'));

CREATE POLICY "predictions_update" ON public.predictions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.match_datetime > NOW() AND m.status = 'upcoming'));

CREATE POLICY "predictions_delete" ON public.predictions FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.match_datetime > NOW()));
