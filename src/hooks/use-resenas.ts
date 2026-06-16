import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Resena = {
  id: string;
  lugar_id: string;
  autor: string;
  calificacion: number;
  comentario: string;
  created_at: string;
  es_mia: boolean;
};

export function useResenas(lugarId: string) {
  return useQuery({
    queryKey: ["resenas", lugarId],
    queryFn: async (): Promise<Resena[]> => {
      const { data, error } = await supabase.rpc("get_resenas_publicas" as never, {
        p_lugar_id: lugarId,
      } as never);
      if (error) throw new Error(error.message);
      return (data ?? []) as Resena[];
    },
  });
}

export function useCrearResena(lugarId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      autor: string;
      calificacion: number;
      comentario: string;
    }) => {
      const { error } = await supabase.from("resenas").insert({
        lugar_id: lugarId,
        user_id: input.userId,
        autor: input.autor,
        calificacion: input.calificacion,
        comentario: input.comentario,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resenas", lugarId] }),
  });
}

export function useEliminarResena(lugarId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resenas").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resenas", lugarId] }),
  });
}
