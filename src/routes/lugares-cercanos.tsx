import { createFileRoute } from "@tanstack/react-router";
import { Eye, Bath, Utensils, Info, Bus, MapPin } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { nearby } from "@/lib/mock-data";
import { distanceMeters, formatDistance, useGeolocation } from "@/lib/geolocation";

export const Route = createFileRoute("/lugares-cercanos")({
  head: () => ({ meta: [{ title: "Lugares cercanos" }] }),
  component: Cercanos,
});

const iconMap = { eye: Eye, bath: Bath, utensils: Utensils, info: Info, bus: Bus };

function Cercanos() {
  const geo = useGeolocation(true);

  const items = useMemo(() => {
    if (!geo.coords) return [];
    return nearby
      .map((n) => {
        const point = {
          lat: geo.coords!.lat + n.offset.lat,
          lng: geo.coords!.lng + n.offset.lng,
        };
        return { ...n, point, meters: distanceMeters(geo.coords!, point) };
      })
      .sort((a, b) => a.meters - b.meters);
  }, [geo.coords]);

  return (
    <AppShell title="Lugares cercanos" back bottomBar={<ListenBar label="Escuchar lista" />}>
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
        <p className="mb-4 text-sm text-muted-foreground">
          Puntos de interés ordenados por cercanía a tu ubicación actual
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((n) => {
            const Icon = iconMap[n.icon as keyof typeof iconMap];
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
                  <p className="text-sm text-muted-foreground">a {formatDistance(n.meters)}</p>
                </div>
              </div>
            );
          })}
          {!geo.coords && !geo.loading && (
            <p className="col-span-full text-sm text-muted-foreground">
              Activa la geolocalización para ver lugares cercanos.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
