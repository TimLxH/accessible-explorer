import { Link } from "@tanstack/react-router";
import { AlertTriangle, Phone } from "lucide-react";

export function EmergencyBar() {
  return (
    <Link
      to="/emergencia"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-destructive px-4 py-4 text-destructive-foreground shadow-2xl transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
      aria-label="Botón de emergencia: ir a la pantalla de ayuda inmediata y compartir tu ubicación"
    >
      <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-base font-extrabold uppercase tracking-wide leading-none">
          Botón de emergencia
        </span>
        <span className="mt-0.5 text-xs font-medium opacity-90 leading-none">
          Toca para obtener ayuda inmediata
        </span>
      </div>
      <Phone aria-hidden="true" className="ml-2 h-5 w-5 opacity-80" />
    </Link>
  );
}
