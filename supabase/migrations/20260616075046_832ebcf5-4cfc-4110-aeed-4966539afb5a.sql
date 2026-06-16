ALTER TABLE public.resena_respuestas
  ADD CONSTRAINT resena_respuestas_comentario_length
    CHECK (char_length(comentario) BETWEEN 1 AND 600);

ALTER TABLE public.resena_respuestas
  ADD CONSTRAINT resena_respuestas_autor_length
    CHECK (char_length(autor) <= 60);

ALTER TABLE public.resenas
  ADD CONSTRAINT resenas_autor_length
    CHECK (char_length(autor) <= 60);