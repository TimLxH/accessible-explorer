import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, LogOut } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Puriy Ayni" }] }),
  component: Config,
});

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-purple" : "bg-muted"}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0">
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
    </section>
  );
}

function Config() {
  const [voice, setVoice] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [vibration, setVibration] = useState(true);
  const [volume, setVolume] = useState(70);

  return (
    <AppShell title="Configuración" back>
      <div className="mx-auto max-w-2xl space-y-6 px-5 py-6">
        <Section title="Accesibilidad">
          <Row>
            <div>
              <p className="font-medium">Guía por voz</p>
              <p className="text-sm text-muted-foreground">Lectura automática de pantallas</p>
            </div>
            <Toggle checked={voice} onChange={setVoice} label="Guía por voz, lectura automática de pantallas" />
          </Row>
          <Row>
            <div>
              <p className="font-medium">Alto contraste</p>
              <p className="text-sm text-muted-foreground">Aumenta la legibilidad</p>
            </div>
            <Toggle checked={highContrast} onChange={setHighContrast} label="Alto contraste, aumenta la legibilidad" />
          </Row>
          <Row>
            <div>
              <p className="font-medium">Vibración</p>
              <p className="text-sm text-muted-foreground">Feedback háptico al navegar</p>
            </div>
            <Toggle checked={vibration} onChange={setVibration} label="Vibración, feedback háptico al navegar" />
          </Row>
          <Row>
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="volume-range" className="font-medium">Volumen de voz</label>
                <span aria-hidden="true" className="text-sm text-muted-foreground">{volume}%</span>
              </div>
              <input
                id="volume-range"
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-valuetext={`${volume} por ciento`}
                className="w-full accent-purple"
              />
            </div>
          </Row>
          <Row>
            <label htmlFor="lang-select" className="font-medium">Idioma</label>
            <select id="lang-select" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option>Español</option>
              <option>English</option>
              <option>Quechua</option>
            </select>
          </Row>
          <Row>
            <label htmlFor="guide-type" className="font-medium">Tipo de guía</label>
            <select id="guide-type" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option>Detallada</option>
              <option>Breve</option>
              <option>Solo direcciones</option>
            </select>
          </Row>
        </Section>

        <Section title="Cuenta">
          <Link
            to="/home"
            aria-label="Editar perfil: nombre, foto y datos personales (próximamente)"
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-accent/40"
          >
            <div>
              <p className="font-medium">Editar perfil</p>
              <p className="text-sm text-muted-foreground">Nombre, foto y datos personales</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </Link>
          <Link
            to="/home"
            aria-label="Contacto de emergencia: configurar número y nombre (próximamente)"
            className="flex w-full items-center justify-between border-t border-border px-5 py-4 hover:bg-accent/40"
          >
            <div>
              <p className="font-medium">Contacto de emergencia</p>
              <p className="text-sm text-muted-foreground">Configurar número y nombre</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </Link>
        </Section>

        <Link
          to="/"
          aria-label="Cerrar sesión y volver a la pantalla de bienvenida"
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-destructive bg-white py-4 font-semibold text-destructive hover:bg-destructive/5"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" /> Cerrar sesión
        </Link>
      </div>
    </AppShell>
  );
}
