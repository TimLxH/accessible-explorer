CREATE TABLE public.resenas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lugar_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor text NOT NULL DEFAULT '',
  calificacion smallint NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario text NOT NULL CHECK (char_length(comentario) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX resenas_lugar_id_idx ON public.resenas(lugar_id, created_at DESC);

GRANT SELECT ON public.resenas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resenas TO authenticated;
GRANT ALL ON public.resenas TO service_role;

ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reseñas públicas para lectura"
  ON public.resenas FOR SELECT
  USING (true);

CREATE POLICY "Crear mis reseñas"
  ON public.resenas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Actualizar mis reseñas"
  ON public.resenas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Borrar mis reseñas"
  ON public.resenas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_resenas_updated_at
  BEFORE UPDATE ON public.resenas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();