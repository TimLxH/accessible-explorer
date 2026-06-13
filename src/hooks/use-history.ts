import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["historial", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial")
        .select("id, lugar_id, visited_at, lugares ( title, location, image )")
        .eq("user_id", user!.id)
        .order("visited_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useRecordVisit(lugarId: string | undefined) {
  const { user } = useAuth();
  useEffect(() => {
    if (!user || !lugarId) return;
    supabase.from("historial").insert({ user_id: user.id, lugar_id: lugarId }).then();
  }, [user, lugarId]);
}
