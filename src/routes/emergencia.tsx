import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, MapPin, Phone } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/emergencia")({
  head: () => ({ meta: [{ title: "Emergencia" }] }),
  component: Emergencia,
});

function Emergencia() {
  return (
    <AppShell title="Emergencia" back>
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center">
        <div className="grid h-32 w-32 place-items-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
          <AlertTriangle className="h-16 w-16" strokeWidth={2.5} />
        </div>
        <h2 className="mt-8 text-4xl font-extrabold text-destructive">
          ¿Necesitas ayuda?
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Compartiremos tu ubicación con tu contacto de confianza y notificaremos
          a servicios de emergencia locales si lo solicitas.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3">
          <button className="flex items-center justify-center gap-3 rounded-xl bg-destructive py-5 text-lg font-bold text-destructive-foreground shadow-lg hover:bg-destructive/90">
            <MapPin className="h-6 w-6" /> Compartir ubicación
          </button>
          <button className="flex items-center justify-center gap-3 rounded-xl border-2 border-destructive bg-white py-5 text-lg font-bold text-destructive hover:bg-destructive/5">
            <Phone className="h-6 w-6" /> Llamar a contacto
          </button>
        </div>
      </div>
    </AppShell>
  );
}
