import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Compass,
  Mic,
  Heart,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Inicio — Turismo Sin Barreras" }] }),
  component: Home,
});

const tiles = [
  { to: "/explorar", label: "Búsqueda de destino", icon: Search, color: "bg-purple text-purple-foreground" },
  { to: "/lugares-cercanos", label: "Lugares cercanos", icon: Compass, color: "bg-navy text-navy-foreground" },
  { to: "/asistente", label: "Asistente de voz", icon: Mic, color: "bg-purple text-purple-foreground" },
  { to: "/favoritos", label: "Favoritos", icon: Heart, color: "bg-navy text-navy-foreground" },
  { to: "/historial", label: "Historial", icon: Clock, color: "bg-purple text-purple-foreground" },
  { to: "/emergencia", label: "Emergencia", icon: AlertTriangle, color: "bg-destructive text-destructive-foreground" },
] as const;

function Home() {
  return (
    <AppShell title="Inicio" bottomBar={<ListenBar />}>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">¡Hola!</h2>
          <p className="mt-1 text-lg text-muted-foreground">¿A dónde quieres ir hoy?</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`grid h-16 w-16 place-items-center rounded-2xl ${t.color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-8 w-8" />
                </div>
                <span className="text-sm font-semibold leading-tight text-foreground sm:text-base">
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
