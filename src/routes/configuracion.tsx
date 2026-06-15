import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, LogOut } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Slider } from "@/components/ui/slider";
import { speak } from "@/lib/speech";
import {
  useVoiceEnabled,
  useVoiceRate,
  useGuideVoice,
  useHighContrast,
  useVibration,
  useVoiceVolume,
  useLang,
  useGuideType,
  vibrate,
  type Lang,
  type GuideType,
} from "@/lib/voice-settings";

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
  const [voiceCommands, setVoiceCommands] = useVoiceEnabled();
  const [voiceRate, setVoiceRate] = useVoiceRate();
  const [voice, setVoice] = useGuideVoice();
  const [highContrast, setHighContrast] = useHighContrast();
  const [vibration, setVibration] = useVibration();
  const [volume, setVolume] = useVoiceVolume();
  const [lang, setLang] = useLang();
  const [guideType, setGuideType] = useGuideType();

  const announce = (msg: string) => {
    vibrate(20);
    speak(msg);
  };

  return (
    <AppShell title="Configuración" back>
      <div className="mx-auto max-w-2xl space-y-6 px-5 py-6">
        <Section title="Accesibilidad">
          <Row>
            <div>
              <p className="font-medium">Comandos y asistencia por voz</p>
              <p className="text-sm text-muted-foreground">
                Activa el menú por voz global y la lectura de opciones. Si lo desactivas, se anula de inmediato.
              </p>
            </div>
            <Toggle
              checked={voiceCommands}
              onChange={(v) => { setVoiceCommands(v); announce(v ? "Comandos por voz activados" : "Comandos por voz desactivados"); }}
              label="Comandos y asistencia por voz en toda la aplicación"
            />
          </Row>
          <Row>
            <div>
              <p className="font-medium">Guía por voz</p>
              <p className="text-sm text-muted-foreground">Lectura automática de pantallas</p>
            </div>
            <Toggle
              checked={voice}
              onChange={(v) => { setVoice(v); if (v) announce("Guía por voz activada"); else vibrate(20); }}
              label="Guía por voz, lectura automática de pantallas"
            />
          </Row>
          <Row>
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span id="voice-rate-label" className="font-medium">Velocidad de voz</span>
                <span aria-hidden="true" className="text-sm text-muted-foreground">{voiceRate.toFixed(1)}x</span>
              </div>
              <Slider
                min={1.0}
                max={1.6}
                step={0.1}
                value={[voiceRate]}
                onValueChange={(val) => setVoiceRate(val[0])}
                onValueCommit={(val) => {
                  const v = val[0];
                  setVoiceRate(v);
                  announce(`Velocidad ${v.toFixed(1)}`);
                }}
                aria-labelledby="voice-rate-label"
                aria-valuetext={`Velocidad ${voiceRate.toFixed(1)}`}
              />
              <output
                htmlFor="voice-rate"
                className="sr-only"
                aria-live="polite"
                aria-atomic="true"
              >
                Velocidad configurada en {voiceRate.toFixed(1)}
              </output>
            </div>
          </Row>
          <Row>
            <div>
              <p className="font-medium">Alto contraste</p>
              <p className="text-sm text-muted-foreground">Aumenta la legibilidad</p>
            </div>
            <Toggle
              checked={highContrast}
              onChange={(v) => { setHighContrast(v); announce(v ? "Alto contraste activado" : "Alto contraste desactivado"); }}
              label="Alto contraste, aumenta la legibilidad"
            />
          </Row>
          <Row>
            <div>
              <p className="font-medium">Vibración</p>
              <p className="text-sm text-muted-foreground">Feedback háptico al navegar</p>
            </div>
            <Toggle
              checked={vibration}
              onChange={(v) => { setVibration(v); if (v) vibrate([30, 40, 30]); announce(v ? "Vibración activada" : "Vibración desactivada"); }}
              label="Vibración, feedback háptico al navegar"
            />
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
                onMouseUp={() => announce(`Volumen ${volume} por ciento`)}
                onTouchEnd={() => announce(`Volumen ${volume} por ciento`)}
                onKeyUp={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") announce(`Volumen ${volume} por ciento`); }}
                aria-valuetext={`${volume} por ciento`}
                className="w-full accent-purple"
              />
            </div>
          </Row>
          <Row>
            <label htmlFor="lang-select" className="font-medium">Idioma</label>
            <select
              id="lang-select"
              value={lang}
              onChange={(e) => {
                const v = e.target.value as Lang;
                setLang(v);
                announce(v === "en" ? "Language set to English" : v === "qu" ? "Idioma quechua" : "Idioma español");
              }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="qu">Quechua</option>
            </select>
          </Row>
          <Row>
            <label htmlFor="guide-type" className="font-medium">Tipo de guía</label>
            <select
              id="guide-type"
              value={guideType}
              onChange={(e) => {
                const v = e.target.value as GuideType;
                setGuideType(v);
                announce(`Guía ${v}`);
              }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="detallada">Detallada</option>
              <option value="breve">Breve</option>
              <option value="direcciones">Solo direcciones</option>
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
