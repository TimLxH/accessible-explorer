import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Compass,
  Mic,
  Heart,
  Clock,
  AlertTriangle,
  Volume2,
  Square,
  Map,
} from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmergencyBar } from "@/components/emergency-bar";
import { getRecognition, stopSpeaking } from "@/lib/speech";
import { getVoiceEnabled, VOICE_MENU_RATE } from "@/lib/voice-settings";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Inicio — Puriy Ayni" }] }),
  component: Home,
});

const tiles = [
  { to: "/explorar", label: "Búsqueda de destino", spoken: "Búsqueda de destino", keywords: ["búsqueda", "busqueda", "destino", "explorar", "buscar"], icon: Search, color: "bg-purple text-purple-foreground" },
  { to: "/lugares-cercanos", label: "Lugares cercanos", spoken: "Lugares cercanos", keywords: ["cercano", "cercanos", "cerca", "lugares"], icon: Compass, color: "bg-navy text-navy-foreground" },
  { to: "/asistente", label: "Asistente de voz", spoken: "Asistente de voz", keywords: ["asistente", "voz", "ayudante"], icon: Mic, color: "bg-purple text-purple-foreground" },
  { to: "/favoritos", label: "Favoritos", spoken: "Favoritos", keywords: ["favorito", "favoritos"], icon: Heart, color: "bg-navy text-navy-foreground" },
  { to: "/historial", label: "Historial", spoken: "Historial", keywords: ["historial", "historia", "recientes"], icon: Clock, color: "bg-purple text-purple-foreground" },
  { to: "/emergencia", label: "Emergencia", spoken: "Emergencia", keywords: ["emergencia", "ayuda", "urgencia", "auxilio"], icon: AlertTriangle, color: "bg-destructive text-destructive-foreground" },
  { to: "/orientacion", label: "Orientación", spoken: "Orientación accesible", keywords: ["orientación", "orientacion", "recorrido", "mapeo", "nodos"], icon: Map, color: "bg-navy text-navy-foreground" },
] as const;

type Tile = (typeof tiles)[number];

function speakSequence(parts: string[], onDone: () => void) {
  if (!("speechSynthesis" in window)) {
    onDone();
    return;
  }
  window.speechSynthesis.cancel();
  let i = 0;
  function next() {
    if (i >= parts.length) {
      onDone();
      return;
    }
    if (!getVoiceEnabled()) { onDone(); return; }
    const u = new SpeechSynthesisUtterance(parts[i++]);
    u.lang = "es-ES";
    u.rate = VOICE_MENU_RATE;
    u.onend = next;
    u.onerror = next;
    window.speechSynthesis.speak(u);
  }
  next();
}

function matchTile(transcript: string): Tile | null {
  const t = transcript.toLowerCase();
  // exact number first (1..7)
  const numMatch = t.match(/\b([1-7]|uno|dos|tres|cuatro|cinco|seis|siete)\b/);
  if (numMatch) {
    const map: Record<string, number> = {
      "1": 0, uno: 0,
      "2": 1, dos: 1,
      "3": 2, tres: 2,
      "4": 3, cuatro: 3,
      "5": 4, cinco: 4,
      "6": 5, seis: 5,
      "7": 6, siete: 6,
    };
    const idx = map[numMatch[1]];
    if (idx != null) return tiles[idx];
  }
  for (const tile of tiles) {
    if (tile.keywords.some((k) => t.includes(k))) return tile;
  }
  return null;
}

function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "reading" | "listening">("idle");
  const [feedback, setFeedback] = useState<string>("");
  const recRef = useRef<any>(null);

  function startVoiceMenu() {
    if (!getVoiceEnabled()) {
      setFeedback("La guía por voz está desactivada. Actívala en Configuración.");
      return;
    }
    if (status !== "idle") {
      stopSpeaking();
      recRef.current?.stop?.();
      setStatus("idle");
      setFeedback("");
      return;
    }

    const rec = getRecognition({ interim: true, continuous: true });
    if (!rec) {
      setFeedback("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }

    setStatus("reading");
    setFeedback("Leyendo opciones disponibles…");

    const intro = "Estas son las opciones disponibles. Di el número o el nombre de la que deseas abrir.";
    const numbered = tiles.map((t, i) => `Opción ${i + 1}: ${t.spoken}.`);
    const outro = "Ahora dime tu elección.";

    speakSequence([intro, ...numbered, outro], () => {
      setStatus("listening");
      setFeedback("Escuchando… di un número (uno a seis) o el nombre.");
      let decided = false;

      rec.onresult = (e: any) => {
        let combined = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          combined += e.results[i][0].transcript + " ";
        }
        const transcript = combined.trim();
        if (transcript) setFeedback(`Te escuché: "${transcript}"`);
        const tile = matchTile(transcript);
        if (tile && !decided) {
          decided = true;
          setFeedback(`Abriendo: ${tile.spoken}`);
          try { rec.stop(); } catch { /* ignore */ }
          speakSequence([`Abriendo ${tile.spoken}`], () => {});
          navigate({ to: tile.to });
        }
      };
      rec.onerror = (e: any) => {
        if (e?.error === "no-speech") {
          setFeedback("No te escuché. Vuelve a pulsar el botón e inténtalo de nuevo.");
        } else if (e?.error === "not-allowed") {
          setFeedback("Permiso de micrófono denegado. Habilítalo en tu navegador.");
        } else {
          setFeedback(`Error de voz: ${e?.error ?? "desconocido"}`);
        }
        setStatus("idle");
      };
      rec.onend = () => {
        setStatus("idle");
      };
      recRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        setStatus("idle");
        setFeedback("No pude iniciar el micrófono. Intenta de nuevo.");
      }
    });
  }


  const btnIcon = status === "idle" ? Volume2 : Square;
  const Icon = btnIcon;

  return (
    <AppShell title="Inicio" bottomBar={<EmergencyBar />}>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">¡Hola!</h2>
            <p className="mt-1 text-lg text-muted-foreground">¿A dónde quieres ir hoy?</p>
          </div>
          <button
            onClick={startVoiceMenu}
            aria-label={
              status === "idle"
                ? "Activar menú por voz: lee las opciones y escucha tu elección"
                : status === "reading"
                  ? "Leyendo opciones. Toca para cancelar"
                  : "Escuchando tu voz. Toca para cancelar"
            }
            aria-pressed={status !== "idle"}
            className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-md transition-colors ${
              status === "idle"
                ? "bg-purple text-purple-foreground hover:bg-purple/90"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {status === "idle"
              ? "Menú por voz"
              : status === "reading"
                ? "Leyendo…"
                : "Escuchando…"}
          </button>
        </div>

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 rounded-xl border border-purple/30 bg-purple/5 px-4 py-3 text-sm text-purple"
          >
            {feedback}
          </div>
        )}

        <nav aria-label="Secciones principales">
          <ul className="grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3">
            {tiles.map((t, i) => {
              const TileIcon = t.icon;
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    aria-label={`Opción ${i + 1}: ${t.spoken}. Ir a esta sección`}
                    className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className={`grid h-16 w-16 place-items-center rounded-2xl ${t.color} transition-transform group-hover:scale-110`}>
                      <TileIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold leading-tight text-foreground sm:text-base">
                      <span aria-hidden="true" className="mr-1 text-muted-foreground">{i + 1}.</span>
                      {t.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </AppShell>
  );
}

