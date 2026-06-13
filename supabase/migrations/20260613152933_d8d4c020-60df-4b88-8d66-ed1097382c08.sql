
-- LUGARES (catálogo público)
CREATE TABLE public.lugares (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  distance TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  history TEXT NOT NULL DEFAULT '',
  info TEXT NOT NULL DEFAULT '',
  accessibility TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lugares TO anon, authenticated;
GRANT ALL ON public.lugares TO service_role;
ALTER TABLE public.lugares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lugares son públicos" ON public.lugares FOR SELECT USING (true);

-- LUGARES CERCANOS (puntos de interés público)
CREATE TABLE public.lugares_cercanos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'info',
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lugares_cercanos TO anon, authenticated;
GRANT ALL ON public.lugares_cercanos TO service_role;
ALTER TABLE public.lugares_cercanos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cercanos son públicos" ON public.lugares_cercanos FOR SELECT USING (true);

-- FAVORITOS por usuario
CREATE TABLE public.favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lugar_id TEXT NOT NULL REFERENCES public.lugares(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lugar_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favoritos TO authenticated;
GRANT ALL ON public.favoritos TO service_role;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mis favoritos" ON public.favoritos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Crear mis favoritos" ON public.favoritos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Borrar mis favoritos" ON public.favoritos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- HISTORIAL por usuario
CREATE TABLE public.historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lugar_id TEXT NOT NULL REFERENCES public.lugares(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.historial TO authenticated;
GRANT ALL ON public.historial TO service_role;
ALTER TABLE public.historial ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mi historial" ON public.historial FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Crear en mi historial" ON public.historial FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Borrar mi historial" ON public.historial FOR DELETE TO authenticated USING (auth.uid() = user_id);
