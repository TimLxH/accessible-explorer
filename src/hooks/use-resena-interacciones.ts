import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Reaccion = {
  id: string;
  resena_id: string;
  user_id: string;
  tipo: "like" | "dislike";
};

export type Respuesta = {
  id: string;
  resena_id: string;
  user_id: string;
  autor: string;
  comentario: string;
  created_at: string;
};

export function useReacciones(lugarId: string, resenaIds: string[]) {
  return useQuery({
    queryKey: ["reacciones", lugarId, resenaIds.join(",")],
    enabled: resenaIds.length > 0,
    queryFn: async (): Promise<Reaccion[]> => {
      const { data, error } = await supabase
        .from("resena_reacciones")
        .select("*")
        .in("resena_id", resenaIds);
      if (error) throw new Error(error.message);
      return (data ?? []) as Reaccion[];
    },
  });
}

export function useToggleReaccion(lugarId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      resenaId: string;
      userId: string;
      tipo: "like" | "dislike";
      actual?: "like" | "dislike" | null;
    }) => {
      if (input.actual === input.tipo) {
        const { error } = await supabase
          .from("resena_reacciones")
          .delete()
          .eq("resena_id", input.resenaId)
          .eq("user_id", input.userId);
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await supabase
        .from("resena_reacciones")
        .upsert(
          {
            resena_id: input.resenaId,
            user_id: input.userId,
            tipo: input.tipo,
          },
          { onConflict: "resena_id,user_id" },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["reacciones", lugarId] }),
  });
}

export function useRespuestas(lugarId: string, resenaIds: string[]) {
  return useQuery({
    queryKey: ["respuestas", lugarId, resenaIds.join(",")],
    enabled: resenaIds.length > 0,
    queryFn: async (): Promise<Respuesta[]> => {
      const { data, error } = await supabase
        .from("resena_respuestas")
        .select("*")
        .in("resena_id", resenaIds)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Respuesta[];
    },
  });
}

export function useCrearRespuesta(lugarId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      resenaId: string;
      userId: string;
      autor: string;
      comentario: string;
    }) => {
      const { error } = await supabase.from("resena_respuestas").insert({
        resena_id: input.resenaId,
        user_id: input.userId,
        autor: input.autor,
        comentario: input.comentario,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["respuestas", lugarId] }),
  });
}

export function useEliminarRespuesta(lugarId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resena_respuestas")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["respuestas", lugarId] }),
  });
}
