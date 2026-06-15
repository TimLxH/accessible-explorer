import { AlertTriangle, Check, MapPin, Phone, X, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useEmergency } from "@/lib/emergency-context";
import { speak } from "@/lib/speech";

export function EmergencyOverlay() {
  const { active, status, countdown, location, contactName, contactPhone, dismiss } = useEmergency();

  // Anunciar cambios de estado para lectores de pantalla
  useEffect(() => {
    if (!active) return;
    if (status === "sharing") speak("Compartiendo ubicación.");
    if (status === "notifying") speak(`Notificando a ${contactName}.`);
    if (status === "onway") speak("Ayuda en camino.");
  }, [status, active, contactName]);

  if (!active) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
      aria-describedby="emergency-desc"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-destructive text-white">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h2 id="emergency-title" className="text-xl font-extrabold text-destructive">
                Emergencia activada
              </h2>
              <p id="emergency-desc" className="text-sm text-muted-foreground">
                Iniciando protocolo de asistencia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cancelar emergencia"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuenta regresiva */}
        <div
          aria-live="assertive"
          className="mt-5 rounded-xl bg-destructive/10 p-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Ayuda en
          </p>
          <p className="text-5xl font-extrabold text-destructive" aria-label={`${countdown} segundos`}>
            {countdown}s
          </p>
        </div>

        {/* Ubicación simulada */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border p-3">
          <MapPin className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Ubicación</p>
            <p className="text-muted-foreground">
              {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (simulada)` : "Obteniendo…"}
            </p>
          </div>
        </div>

        {/* Contacto */}
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-border p-3">
          <Phone className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Contacto de emergencia</p>
            <p className="text-muted-foreground">{contactName} · {contactPhone}</p>
          </div>
        </div>

        {/* Estado */}
        <ul className="mt-4 space-y-2" aria-live="polite">
          <StatusRow label="Compartiendo ubicación" done={status === "sharing" || status === "notifying" || status === "onway"} active={status === "sharing"} />
          <StatusRow label="Notificando contacto" done={status === "notifying" || status === "onway"} active={status === "notifying"} />
          <StatusRow label="Ayuda en camino" done={status === "onway"} active={status === "onway"} />
        </ul>

        <div className="mt-5 flex gap-2">
          <a
            href="tel:105"
            aria-label="Llamar al 105"
            className="flex-1 rounded-xl bg-destructive py-3 text-center text-base font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            Llamar 105
          </a>
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-xl border-2 border-destructive bg-white py-3 text-base font-bold text-destructive hover:bg-destructive/5"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 place-items-center rounded-full ${
          done ? "bg-green-600 text-white" : active ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      </span>
      <span className={done ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}
