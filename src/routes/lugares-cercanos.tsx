import { createFileRoute } from "@tanstack/react-router";
import { Eye, Bath, Utensils, Info, Bus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { nearby } from "@/lib/mock-data";

export const Route = createFileRoute("/lugares-cercanos")({
  head: () => ({ meta: [{ title: "Lugares cercanos" }] }),
  component: Cercanos,
});

const iconMap = { eye: Eye, bath: Bath, utensils: Utensils, info: Info, bus: Bus };

function Cercanos() {
  return (
    <AppShell title="Lugares cercanos" back bottomBar={<ListenBar label="Escuchar lista" />}>
      <div className="mx-auto max-w-3xl px-5 py-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Puntos de interés a menos de 1 km
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {nearby.map((n) => {
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
                  <p className="text-sm text-muted-foreground">a {n.distance}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
