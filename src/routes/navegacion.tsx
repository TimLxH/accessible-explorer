import { createFileRoute } from "@tanstack/react-router";
import { Navigation, Volume2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/navegacion")({
  head: () => ({ meta: [{ title: "Navegación — Turismo Sin Barreras" }] }),
  component: Nav,
});

function Nav() {
  return (
    <AppShell title="Navegación" back>
      <div className="bg-purple px-5 py-6 text-purple-foreground">
        <p className="text-xs uppercase tracking-wide opacity-80">Ruta activa</p>
        <p className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">
          Avanza recto 20 metros
        </p>
      </div>

      <div className="relative h-[55vh] w-full overflow-hidden bg-gradient-to-br from-navy/10 via-purple/5 to-navy/20">
        {/* Fake grid map */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.5 0.05 270 / 0.2) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.5 0.05 270 / 0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Route path */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          <path
            d="M 50 350 Q 150 300 180 220 T 280 120 L 340 60"
            stroke="oklch(0.48 0.19 295)"
            strokeWidth="4"
            strokeDasharray="8 8"
            fill="none"
          />
        </svg>
        {/* Marker */}
        <div className="absolute left-[12%] top-[85%] grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-purple text-purple-foreground shadow-lg ring-4 ring-purple/30">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
        <div className="absolute left-[85%] top-[15%] grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-navy text-navy-foreground shadow-lg">
          <Navigation className="h-5 w-5" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Distancia restante</p>
            <p className="mt-1 text-2xl font-bold">320 m</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Tiempo estimado</p>
            <p className="mt-1 text-2xl font-bold">5 min</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="flex items-center justify-center gap-2 rounded-xl border-2 border-purple py-4 font-semibold text-purple hover:bg-purple/5">
            <Volume2 className="h-5 w-5" /> Repetir indicación
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-destructive py-4 font-semibold text-destructive-foreground hover:bg-destructive/90">
            <X className="h-5 w-5" /> Detener
          </button>
        </div>
      </div>
    </AppShell>
  );
}
