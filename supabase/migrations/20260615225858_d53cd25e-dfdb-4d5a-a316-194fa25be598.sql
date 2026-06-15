
-- Restrict SELECT on resenas, resena_reacciones, resena_respuestas to authenticated users only
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('resenas','resena_reacciones','resena_respuestas')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

CREATE POLICY "Authenticated can read resenas"
  ON public.resenas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read resena_reacciones"
  ON public.resena_reacciones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read resena_respuestas"
  ON public.resena_respuestas FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.resenas FROM anon;
REVOKE SELECT ON public.resena_reacciones FROM anon;
REVOKE SELECT ON public.resena_respuestas FROM anon;
