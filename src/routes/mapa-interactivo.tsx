import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import InteractiveMap from "@/components/interactive-map";

export const Route = createFileRoute("/mapa-interactivo")({
  head: () => ({
    meta: [{ title: "Mapa interactivo — Parque de la Identidad Wanka" }],
  }),
  component: MapaInteractivoPage,
});

function MapaInteractivoPage() {
  return (
    <AppShell title="Mapa interactivo" back>
      <main className="mx-auto w-full max-w-3xl px-4 py-4">
        <h1 className="sr-only">Mapa interactivo del Parque de la Identidad Wanka</h1>
        <p className="mb-3 text-sm text-muted-foreground">
          Tu ubicación se muestra como un punto azul brillante. Toca cualquier pin
          del parque para escuchar su descripción y revisar la información de
          accesibilidad.
        </p>
        <InteractiveMap />
      </main>
    </AppShell>
  );
}
