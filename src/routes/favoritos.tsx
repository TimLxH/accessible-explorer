import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { SiteCard } from "@/components/site-card";
import { sitesQuery } from "@/lib/api";

export const Route = createFileRoute("/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos" }] }),
  component: Favoritos,
});

function Favoritos() {
  const { data, isLoading, isError, error, refetch } = useQuery(sitesQuery);
  const favs = (data ?? []).filter((s) => s.favorite);

  return (
    <AppShell title="Favoritos" back bottomBar={<ListenBar label="Escuchar lista" />}>
      <div className="mx-auto max-w-5xl px-5 py-6">
        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando favoritos…
          </div>
        )}
        {isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" /> No se pudieron cargar los favoritos
            </div>
            <p className="mt-1">{(error as Error)?.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              Reintentar
            </button>
          </div>
        )}
        {!isLoading && !isError && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {favs.length} lugares guardados
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favs.map((s) => (
                <SiteCard key={s.id} site={s} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
