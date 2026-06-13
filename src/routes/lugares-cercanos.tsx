import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Bath, Utensils, Info, Bus, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { EmergencyBar } from "@/components/emergency-bar";
import { nearbyQuery } from "@/lib/api";
import { distanceMeters, formatDistance, useGeolocation } from "@/lib/geolocation";

export const Route = createFileRoute("/lugares-cercanos")({
  head: () => ({ meta: [{ title: "Lugares cercanos" }] }),
  component: Cercanos,
});

const iconMap: Record<string, typeof Eye> = {
  eye: Eye,
  bath: Bath,
  utensils: Utensils,
  info: Info,
  bus: Bus,
};

function Cercanos() {
  const geo = useGeolocation(true);
  const { data, isLoading, isError, error, refetch } = useQuery(nearbyQuery);

  const items = useMemo(() => {
    if (!data) return [];
    if (!geo.coords) return data.map((n) => ({ ...n, meters: null as number | null }));
    return data
      .map((n) => ({
        ...n,
        meters: distanceMeters(geo.coords!, n.coords),
      }))
      .sort((a, b) => (a.meters ?? 0) - (b.meters ?? 0));
  }, [data, geo.coords]);

  return (
    <AppShell title="Lugares cercanos" back bottomBar={<EmergencyBar />}>
      <div className="mx-auto max-w-3xl px-5 py-6">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <MapPin className="h-4 w-4 text-purple" />
          {geo.loading && <span>Obteniendo tu ubicación…</span>}
          {geo.error && <span className="text-destructive">No se pudo obtener tu ubicación: {geo.error}</span>}
          {geo.coords && (
            <span className="text-muted-foreground">
              Tu posición: {geo.coords.lat.toFixed(5)}, {geo.coords.lng.toFixed(5)} (±{Math.round(geo.coords.accuracy)} m)
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando puntos cercanos desde el servidor…
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" /> No se pudieron cargar los lugares cercanos
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
              Puntos de interés ordenados por cercanía a tu ubicación actual
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((n) => {
                const Icon = iconMap[n.icon] ?? Info;
                return (
                  <div
                    key={n.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-purple/10 text-purple">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{n.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {n.meters != null ? `a ${formatDistance(n.meters)}` : "Activa la geolocalización"}
                      </p>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">
                  No hay puntos de interés disponibles.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
