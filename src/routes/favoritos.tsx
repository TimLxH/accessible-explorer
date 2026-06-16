import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Heart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmergencyBar } from "@/components/emergency-bar";
import { SiteCard } from "@/components/site-card";
import { sitesQuery } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useFavoriteIds } from "@/hooks/use-favorites";

export const Route = createFileRoute("/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos" }] }),
  component: Favoritos,
});

function Favoritos() {
  const { user, loading: authLoading } = useAuth();
  const { data: sites, isLoading, isError, error, refetch } = useQuery(sitesQuery);
  const { data: favIds, isLoading: favLoading } = useFavoriteIds();

  if (authLoading) {
    return (
      <AppShell title="Favoritos" back>
        <div className="mx-auto max-w-5xl px-5 py-6 text-muted-foreground">
          <Loader2 className="inline h-5 w-5 animate-spin" /> Cargando…
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell title="Favoritos" back>
        <div className="mx-auto max-w-md px-5 py-10 text-center">
          <Heart className="mx-auto h-12 w-12 text-purple" />
          <h2 className="mt-4 text-xl font-bold">Guarda tus lugares favoritos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión para ver y guardar tus lugares preferidos.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-xl bg-purple px-6 py-3 font-semibold text-purple-foreground shadow hover:bg-purple/90"
          >
            Iniciar sesión
          </Link>
        </div>
      </AppShell>
    );
  }

  const favs = (sites ?? []).filter((s) => favIds?.has(s.id));
  const busy = isLoading || favLoading;

  return (
    <AppShell title="Favoritos" back bottomBar={<EmergencyBar />}>
      <div className="mx-auto max-w-5xl px-5 py-6">
        {busy && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando favoritos…
          </div>
        )}
        {isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" /> No se pudieron cargar los favoritos
            </div>
            <p className="mt-1">No se pudieron cargar los datos. Por favor intenta de nuevo.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              Reintentar
            </button>
          </div>
        )}
        {!busy && !isError && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {favs.length} lugares guardados
            </p>
            {favs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Aún no tienes favoritos. Toca el corazón en cualquier lugar para guardarlo.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favs.map((s) => (
                  <SiteCard key={s.id} site={{ ...s, favorite: true }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
