import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useFavoriteIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favoritos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favoritos")
        .select("lugar_id")
        .eq("user_id", user!.id);
      if (error) throw new Error(error.message);
      return new Set((data ?? []).map((r) => r.lugar_id));
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ lugarId, isFav }: { lugarId: string; isFav: boolean }) => {
      if (!user) throw new Error("Debes iniciar sesión");
      if (isFav) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("user_id", user.id)
          .eq("lugar_id", lugarId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({ user_id: user.id, lugar_id: lugarId });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favoritos"] });
    },
  });
}
