import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Compass,
  Bot,
  Heart,
  Clock,
  Volume2,
  Square,
  Map,
} from "lucide-react";
import { useRef, useState, type MutableRefObject } from "react";
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
  { to: "/asistente", label: "Chatbot", spoken: "Chatbot", keywords: ["chatbot", "asistente", "voz", "ayudante"], icon: Bot, color: "bg-purple text-purple-foreground" },
  { to: "/favoritos", label: "Favoritos", spoken: "Favoritos", keywords: ["favorito", "favoritos"], icon: Heart, color: "bg-navy text-navy-foreground" },
  { to: "/historial", label: "Historial", spoken: "Historial", keywords: ["historial", "historia", "recientes"], icon: Clock, color: "bg-purple text-purple-foreground" },
  { to: "/orientacion", label: "Orientación", spoken: "Orientación accesible", keywords: ["orientación", "orientacion", "recorrido", "mapeo", "nodos"], icon: Map, color: "bg-navy text-navy-foreground" },
] as const;

type Tile = (typeof tiles)[number];
type VoiceStatus = "idle" | "reading" | "listening";
type RecognitionResultLike = { 0: { transcript: string } };
type RecognitionEventLike = { results: ArrayLike<RecognitionResultLike> };
type RecognitionErrorLike = { error?: string };
type RecognitionLike = {
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop?: () => void;
  abort?: () => void;
};

function stopRecognition(rec: RecognitionLike | null) {
  if (!rec) return;
  try {
    rec.onresult = null;
    rec.onend = null;
    rec.onerror = null;
    rec.abort?.();
    rec.stop?.();
  } catch { /* ignore */ }
}

function stopVoiceOutput() {
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  stopSpeaking();
}

function speakSequence(parts: string[], onDone: () => void, cancelRef: MutableRefObject<boolean>) {
  if (!("speechSynthesis" in window)) {
    onDone();
    return;
  }
  window.speechSynthesis.cancel();
  cancelRef.current = false;
  let i = 0;
  function next() {
    if (cancelRef.current) {
      onDone();
      return;
    }
    if (i >= parts.length) {
      onDone();
      return;
    }
    if (!getVoiceEnabled()) { onDone(); return; }
    const u = new SpeechSynthesisUtterance(parts[i++]);
    u.lang = "es-ES";
    u.rate = VOICE_MENU_RATE;
    u.onend = () => {
      if (cancelRef.current) { onDone(); return; }
      next();
    };
    u.onerror = () => {
      if (cancelRef.current) { onDone(); return; }
      next();
    };
    window.speechSynthesis.speak(u);
  }
  next();
}

function matchTile(transcript: string): Tile | null {
  const t = transcript.toLowerCase();
  // exact number first (1..6)
  const numMatch = t.match(/\b([1-6]|uno|dos|tres|cuatro|cinco|seis)\b/);
  if (numMatch) {
    const map: Record<string, number> = {
      "1": 0, uno: 0,
      "2": 1, dos: 1,
      "3": 2, tres: 2,
      "4": 3, cuatro: 3,
      "5": 4, cinco: 4,
      "6": 5, seis: 5,
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
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [feedback, setFeedback] = useState<string>("");
  const recRef = useRef<RecognitionLike | null>(null);
  const cancelTTSRef = useRef<boolean>(false);

  function startListening(options?: { status?: Exclude<VoiceStatus, "idle">; feedback?: string; cancelSpeech?: boolean }) {
    stopRecognition(recRef.current);
    recRef.current = null;

    if (options?.cancelSpeech !== false) {
      cancelTTSRef.current = true;
      stopVoiceOutput();
    }

    // interim=true + continuous=true: evalúa el texto conforme el usuario habla
    // para disparar la acción al instante, sin esperar a que termine la frase.
    const rec = getRecognition({ interim: true, continuous: true }) as RecognitionLike | null;
    if (!rec) {
      setFeedback("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      setStatus("idle");
      return false;
    }

    setStatus(options?.status ?? "listening");
    setFeedback(options?.feedback ?? "Escuchando… di un número (uno a seis) o el nombre.");
    let decided = false;

    const fire = (tile: Tile) => {
      if (decided) return;
      decided = true;
      cancelTTSRef.current = true;
      setFeedback(`Abriendo: ${tile.spoken}`);
      stopVoiceOutput();
      stopRecognition(rec);
      recRef.current = null;
      setStatus("idle");
      navigate({ to: tile.to });
    };

    rec.onresult = (e) => {
      if (decided) return;
      // Evalúa todos los resultados (intermedios y finales) en tiempo real.
      let combined = "";
      for (let i = 0; i < e.results.length; i++) {
        combined += e.results[i][0].transcript + " ";
      }
      const transcript = combined.trim();
      if (!transcript) return;
      setFeedback(`Te escuché: "${transcript}"`);
      const tile = matchTile(transcript);
      if (tile) fire(tile);
    };
    rec.onerror = (e) => {
      if (decided) return;
      if (e?.error === "no-speech") {
        setFeedback("No te escuché. Vuelve a pulsar el botón e inténtalo de nuevo.");
      } else if (e?.error === "not-allowed") {
        setFeedback("Permiso de micrófono denegado. Habilítalo en tu navegador.");
      } else if (e?.error !== "aborted") {
        setFeedback(`Error de voz: ${e?.error ?? "desconocido"}`);
      }
      recRef.current = null;
      setStatus("idle");
    };
    rec.onend = () => {
      if (decided) return;
      recRef.current = null;
      setStatus((s) => (s === "listening" || s === "reading" ? "idle" : s));
    };
    recRef.current = rec;
    try {
      rec.start();
      return true;
    } catch (err) {
      console.error("rec.start failed", err);
      recRef.current = null;
      setStatus("idle");
      setFeedback("No pude iniciar el micrófono. Intenta de nuevo.");
      return false;
    }
  }

  function startVoiceMenu() {
    if (!getVoiceEnabled()) {
      setFeedback("La guía por voz está desactivada. Actívala en Configuración.");
      return;
    }

    // Si está leyendo: interrumpir TTS e ir directo a escuchar (gesto del usuario).
    if (status === "reading") {
      cancelTTSRef.current = true;
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      stopSpeaking();
      setStatus("listening");
      setFeedback("Interrumpido. Escuchando tu elección…");
      return;
    }

    // Si está escuchando: detener todo.
    if (status === "listening") {
      try { recRef.current?.stop?.(); } catch { /* ignore */ }
      stopSpeaking();
      setStatus("idle");
      setFeedback("");
      return;
    }

    const intro = "Estas son las opciones disponibles. Di el número o el nombre de la que deseas abrir.";
    const numbered = tiles.map((t, i) => `Opción ${i + 1}: ${t.spoken}.`);
    const outro = "Ahora dime tu elección.";

    const started = startListening({
      status: "reading",
      feedback: "Leyendo opciones disponibles… también puedes decir una opción ahora.",
      cancelSpeech: false,
    });
    if (!started) return;

    speakSequence([intro, ...numbered, outro], () => {
      // El micrófono ya está activo desde el inicio; al terminar solo cambia el estado visual.
      if (!getVoiceEnabled()) { setStatus("idle"); return; }
      setStatus((s) => (s === "reading" ? "listening" : s));
      setFeedback((current) => current.startsWith("Abriendo:") ? current : "Escuchando… di un número (uno a seis) o el nombre.");
    }, cancelTTSRef);
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
                  ? "Interrumpir lectura y hablar ahora"
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
                ? "Leyendo… (tocar para hablar)"
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

