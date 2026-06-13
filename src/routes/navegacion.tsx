import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navigation, Volume2, X, MapPin, Loader2, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { siteQuery } from "@/lib/api";
import { distanceMeters, formatDistance, useGeolocation } from "@/lib/geolocation";
import { speak, stopSpeaking } from "@/lib/speech";

type NavSearch = { dest?: string };

export const Route = createFileRoute("/navegacion")({
  validateSearch: (s: Record<string, unknown>): NavSearch => ({
    dest: typeof s.dest === "string" ? s.dest : undefined,
  }),
  head: () => ({ meta: [{ title: "Navegación — Turismo Sin Barreras" }] }),
  component: Nav,
});

function Nav() {
  const geo = useGeolocation(true);
  const { dest } = Route.useSearch();
  const enabled = !!dest;
  const { data: target, isLoading, isError, error, refetch } = useQuery({
    ...siteQuery(dest ?? ""),
    enabled,
  });

  const distance = useMemo(() => {
    if (!geo.coords || !target) return null;
    return distanceMeters(geo.coords, target.coords);
  }, [geo.coords, target]);

  const eta = distance ? Math.max(1, Math.round(distance / 80)) : null;
  const indicacion = target
    ? distance
      ? distance > 100
        ? `Avanza recto ${Math.round(distance)} metros hacia ${target.title}`
        : `Estás muy cerca de ${target.title}`
      : "Obteniendo tu ubicación…"
    : "Selecciona un destino";

  function repetir() {
    speak(indicacion);
  }
  function detener() {
    stopSpeaking();
  }

  if (!dest) {
    return (
      <AppShell title="Navegación" back>
        <div className="mx-auto max-w-3xl px-5 py-10 text-muted-foreground">
          No se especificó un destino. Vuelve a un lugar y pulsa "Iniciar recorrido".
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell title="Navegación" back>
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando destino…
        </div>
      </AppShell>
    );
  }

  if (isError || !target) {
    return (
      <AppShell title="Navegación" back>
        <div className="mx-auto max-w-3xl px-5 py-10">
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" /> No se pudo cargar el destino
            </div>
            <p className="mt-1">{(error as Error)?.message ?? "Destino no encontrado."}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Navegación" back>
      <div className="bg-purple px-5 py-6 text-purple-foreground">
        <p className="text-xs uppercase tracking-wide opacity-80">Ruta activa hacia {target.title}</p>
        <p className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">{indicacion}</p>
      </div>

      <div className="relative h-[45vh] w-full overflow-hidden bg-gradient-to-br from-navy/10 via-purple/5 to-navy/20">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.5 0.05 270 / 0.2) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.5 0.05 270 / 0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          <path
            d="M 50 350 Q 150 300 180 220 T 280 120 L 340 60"
            stroke="oklch(0.48 0.19 295)"
            strokeWidth="4"
            strokeDasharray="8 8"
            fill="none"
          />
        </svg>
        <div className="absolute left-[12%] top-[85%] grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-purple text-purple-foreground shadow-lg ring-4 ring-purple/30">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
        <div className="absolute left-[85%] top-[15%] grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-navy text-navy-foreground shadow-lg">
          <Navigation className="h-5 w-5" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-6">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <MapPin className="h-4 w-4 text-purple" />
          {geo.loading && <span>Obteniendo ubicación GPS…</span>}
          {geo.error && <span className="text-destructive">{geo.error}</span>}
          {geo.coords && (
            <span className="text-muted-foreground">
              {geo.coords.lat.toFixed(5)}, {geo.coords.lng.toFixed(5)} · ±{Math.round(geo.coords.accuracy)} m
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Distancia restante</p>
            <p className="mt-1 text-2xl font-bold">{distance ? formatDistance(distance) : "—"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Tiempo estimado</p>
            <p className="mt-1 text-2xl font-bold">{eta ? `${eta} min` : "—"}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={repetir}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-purple py-4 font-semibold text-purple hover:bg-purple/5"
          >
            <Volume2 className="h-5 w-5" /> Repetir indicación
          </button>
          <button
            onClick={detener}
            className="flex items-center justify-center gap-2 rounded-xl bg-destructive py-4 font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            <X className="h-5 w-5" /> Detener
          </button>
        </div>
      </div>
    </AppShell>
  );
}
