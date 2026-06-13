import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, MapPin, Phone, Check } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/emergencia")({
  head: () => ({ meta: [{ title: "Emergencia" }] }),
  component: Emergencia,
});

function Emergencia() {
  const [shared, setShared] = useState<null | { lat: number; lng: number } | string>(null);
  const [loading, setLoading] = useState(false);

  function compartir() {
    if (!navigator.geolocation) {
      setShared("Geolocalización no disponible en este dispositivo");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoading(false);
        setShared({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      (e) => {
        setLoading(false);
        setShared(e.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const mapsUrl =
    shared && typeof shared === "object"
      ? `https://www.google.com/maps?q=${shared.lat},${shared.lng}`
      : null;

  return (
    <AppShell title="Emergencia" back>
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center">
        <div
          aria-hidden="true"
          className="grid h-32 w-32 place-items-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5"
        >
          <AlertTriangle className="h-16 w-16" strokeWidth={2.5} />
        </div>
        <h2 className="mt-8 text-4xl font-extrabold text-destructive">¿Necesitas ayuda?</h2>
        <p className="mt-3 text-base text-muted-foreground">
          Compartiremos tu ubicación con tu contacto de confianza y notificaremos a servicios de
          emergencia locales si lo solicitas.
        </p>

        <div aria-live="polite" aria-atomic="true" className="w-full">
          {shared && typeof shared === "object" && mapsUrl && (
            <div className="mt-6 w-full rounded-xl border border-border bg-card p-4 text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple">
                <Check className="h-4 w-4" aria-hidden="true" /> Ubicación obtenida
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {shared.lat.toFixed(5)}, {shared.lng.toFixed(5)}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir tu ubicación en Google Maps en una pestaña nueva"
                className="mt-2 inline-block text-sm font-medium text-purple underline"
              >
                Abrir en Google Maps
              </a>
            </div>
          )}
          {typeof shared === "string" && (
            <p role="alert" className="mt-6 text-sm text-destructive">{shared}</p>
          )}
        </div>

        <div className="mt-10 flex w-full flex-col gap-3">
          <button
            onClick={compartir}
            disabled={loading}
            aria-label={
              loading
                ? "Obteniendo tu ubicación, por favor espera"
                : "Compartir tu ubicación actual con tu contacto de confianza"
            }
            className="flex items-center justify-center gap-3 rounded-xl bg-destructive py-5 text-lg font-bold text-destructive-foreground shadow-lg hover:bg-destructive/90 disabled:opacity-70"
          >
            <MapPin className="h-6 w-6" aria-hidden="true" /> {loading ? "Obteniendo ubicación…" : "Compartir ubicación"}
          </button>
          <a
            href="tel:105"
            aria-label="Llamar al número de emergencias 105"
            className="flex items-center justify-center gap-3 rounded-xl border-2 border-destructive bg-white py-5 text-lg font-bold text-destructive hover:bg-destructive/5"
          >
            <Phone className="h-6 w-6" aria-hidden="true" /> Llamar a contacto
          </a>
        </div>
      </div>
    </AppShell>
  );
}

