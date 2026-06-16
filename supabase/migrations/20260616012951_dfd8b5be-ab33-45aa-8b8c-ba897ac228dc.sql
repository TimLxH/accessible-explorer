
DROP VIEW IF EXISTS public.resenas_publicas;
DROP VIEW IF EXISTS public.resena_reacciones_publicas;
DROP VIEW IF EXISTS public.resena_respuestas_publicas;

CREATE OR REPLACE FUNCTION public.get_resenas_publicas(p_lugar_id text)
RETURNS TABLE(
  id uuid,
  lugar_id text,
  autor text,
  calificacion smallint,
  comentario text,
  created_at timestamptz,
  updated_at timestamptz,
  es_mia boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT r.id, r.lugar_id, r.autor, r.calificacion, r.comentario,
         r.created_at, r.updated_at, (auth.uid() = r.user_id) AS es_mia
  FROM public.resenas r
  WHERE r.lugar_id = p_lugar_id
  ORDER BY r.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.get_resena_reacciones_publicas(p_resena_ids uuid[])
RETURNS TABLE(
  id uuid,
  resena_id uuid,
  tipo text,
  created_at timestamptz,
  es_mia boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT rr.id, rr.resena_id, rr.tipo, rr.created_at,
         (auth.uid() = rr.user_id) AS es_mia
  FROM public.resena_reacciones rr
  WHERE rr.resena_id = ANY(p_resena_ids)
$$;

CREATE OR REPLACE FUNCTION public.get_resena_respuestas_publicas(p_resena_ids uuid[])
RETURNS TABLE(
  id uuid,
  resena_id uuid,
  autor text,
  comentario text,
  created_at timestamptz,
  updated_at timestamptz,
  es_mia boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT rr.id, rr.resena_id, rr.autor, rr.comentario,
         rr.created_at, rr.updated_at, (auth.uid() = rr.user_id) AS es_mia
  FROM public.resena_respuestas rr
  WHERE rr.resena_id = ANY(p_resena_ids)
  ORDER BY rr.created_at ASC
$$;

GRANT EXECUTE ON FUNCTION public.get_resenas_publicas(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_resena_reacciones_publicas(uuid[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_resena_respuestas_publicas(uuid[]) TO authenticated, anon;
