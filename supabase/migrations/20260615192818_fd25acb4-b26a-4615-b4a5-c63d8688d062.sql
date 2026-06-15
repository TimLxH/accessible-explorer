
CREATE TABLE public.resena_reacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resena_id uuid NOT NULL REFERENCES public.resenas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('like','dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resena_id, user_id)
);
GRANT SELECT ON public.resena_reacciones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resena_reacciones TO authenticated;
GRANT ALL ON public.resena_reacciones TO service_role;
ALTER TABLE public.resena_reacciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reacciones públicas para lectura" ON public.resena_reacciones FOR SELECT USING (true);
CREATE POLICY "Crear mis reacciones" ON public.resena_reacciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Actualizar mis reacciones" ON public.resena_reacciones FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Borrar mis reacciones" ON public.resena_reacciones FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_resena_reacciones_resena ON public.resena_reacciones(resena_id);

CREATE TABLE public.resena_respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resena_id uuid NOT NULL REFERENCES public.resenas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  autor text NOT NULL DEFAULT '',
  comentario text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resena_respuestas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resena_respuestas TO authenticated;
GRANT ALL ON public.resena_respuestas TO service_role;
ALTER TABLE public.resena_respuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Respuestas públicas para lectura" ON public.resena_respuestas FOR SELECT USING (true);
CREATE POLICY "Crear mis respuestas" ON public.resena_respuestas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Actualizar mis respuestas" ON public.resena_respuestas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Borrar mis respuestas" ON public.resena_respuestas FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_resena_respuestas_resena ON public.resena_respuestas(resena_id, created_at);
CREATE TRIGGER update_resena_respuestas_updated_at BEFORE UPDATE ON public.resena_respuestas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
