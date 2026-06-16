
-- Restringir SELECT en tablas base a solo el dueño (evita exponer user_id a otros usuarios)
DROP POLICY IF EXISTS "Authenticated can read resenas" ON public.resenas;
DROP POLICY IF EXISTS "Ver mis reseñas" ON public.resenas;
CREATE POLICY "Ver mis reseñas (base)" ON public.resenas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can read resena_reacciones" ON public.resena_reacciones;
DROP POLICY IF EXISTS "Ver mis reacciones" ON public.resena_reacciones;
CREATE POLICY "Ver mis reacciones (base)" ON public.resena_reacciones
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can read resena_respuestas" ON public.resena_respuestas;
DROP POLICY IF EXISTS "Ver mis respuestas" ON public.resena_respuestas;
CREATE POLICY "Ver mis respuestas (base)" ON public.resena_respuestas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Vistas públicas SIN user_id, con bandera es_mia derivada de auth.uid()
DROP VIEW IF EXISTS public.resenas_publicas;
CREATE VIEW public.resenas_publicas
  WITH (security_invoker = false) AS
  SELECT
    r.id,
    r.lugar_id,
    r.autor,
    r.calificacion,
    r.comentario,
    r.created_at,
    r.updated_at,
    (auth.uid() = r.user_id) AS es_mia
  FROM public.resenas r;

DROP VIEW IF EXISTS public.resena_reacciones_publicas;
CREATE VIEW public.resena_reacciones_publicas
  WITH (security_invoker = false) AS
  SELECT
    rr.id,
    rr.resena_id,
    rr.tipo,
    rr.created_at,
    (auth.uid() = rr.user_id) AS es_mia
  FROM public.resena_reacciones rr;

DROP VIEW IF EXISTS public.resena_respuestas_publicas;
CREATE VIEW public.resena_respuestas_publicas
  WITH (security_invoker = false) AS
  SELECT
    rr.id,
    rr.resena_id,
    rr.autor,
    rr.comentario,
    rr.created_at,
    rr.updated_at,
    (auth.uid() = rr.user_id) AS es_mia
  FROM public.resena_respuestas rr;

GRANT SELECT ON public.resenas_publicas TO authenticated, anon;
GRANT SELECT ON public.resena_reacciones_publicas TO authenticated, anon;
GRANT SELECT ON public.resena_respuestas_publicas TO authenticated, anon;
