import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getRecognition, stopSpeaking } from "@/lib/speech";
import { getVoiceEnabled, useVoiceEnabled, getVoiceRate } from "@/lib/voice-settings";

type Tile = {
  to: string;
  spoken: string;
  keywords: string[];
};
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

const tiles: Tile[] = [
  { to: "/explorar", spoken: "Búsqueda de destino", keywords: ["búsqueda", "busqueda", "destino", "explorar", "buscar"] },
  { to: "/lugares-cercanos", spoken: "Lugares cercanos", keywords: ["cercano", "cercanos", "cerca", "lugares"] },
  { to: "/asistente", spoken: "Chatbot", keywords: ["chatbot", "asistente", "ayudante"] },
  { to: "/favoritos", spoken: "Favoritos", keywords: ["favorito", "favoritos"] },
  { to: "/historial", spoken: "Historial", keywords: ["historial", "recientes"] },
  { to: "/configuracion", spoken: "Configuración", keywords: ["configuración", "configuracion", "ajustes"] },
  { to: "/home", spoken: "Inicio", keywords: ["inicio", "home", "principal"] },
];


function speakSequence(parts: string[], onDone: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onDone();
    return;
  }
  window.speechSynthesis.cancel();
  let i = 0;
  function next() {
    if (i >= parts.length) { onDone(); return; }
    const u = new SpeechSynthesisUtterance(parts[i++]);
    u.lang = "es-ES";
    u.rate = getVoiceRate();
    u.onend = next;
    u.onerror = next;
    window.speechSynthesis.speak(u);
  }
  next();
}

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

export function VoiceMenuFab() {
  const navigate = useNavigate();
  const [enabled] = useVoiceEnabled();
  const [status, setStatus] = useState<"idle" | "reading" | "listening">("idle");
  const [feedback, setFeedback] = useState("");
  const recRef = useRef<RecognitionLike | null>(null);
  const recStartedRef = useRef(false);
  const ejecutadoRef = useRef(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Cancel any active session when voice is disabled or route changes.
  useEffect(() => {
    if (!enabled && status !== "idle") {
      stopRecognition(recRef.current);
      recRef.current = null;
      recStartedRef.current = false;
      stopSpeaking();
      setStatus("idle");
      setFeedback("");
    }
  }, [enabled, status]);

  useEffect(() => {
    if (status !== "idle") {
      stopRecognition(recRef.current);
      recRef.current = null;
      recStartedRef.current = false;
      stopSpeaking();
      setStatus("idle");
      setFeedback("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!enabled) return null;
  // Hide on landing/auth pages to avoid clutter.
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  function listenNow(rec: RecognitionLike) {
    if (recStartedRef.current) return;
    recStartedRef.current = true;
    setStatus("listening");
    setFeedback("Escuchando…");
    let decided = false;

    const fire = (tile: Tile) => {
      if (decided) return;
      decided = true;
      setFeedback(`Abriendo: ${tile.spoken}`);
      stopSpeaking();
      stopRecognition(rec);
      recRef.current = null;
      recStartedRef.current = false;
      setStatus("idle");
      navigate({ to: tile.to });
    };

    rec.onresult = (e) => {
      if (decided) return;
      let combined = "";
      for (let i = 0; i < e.results.length; i += 1) {
        combined += `${e.results[i][0].transcript} `;
      }
      const transcript = combined.trim();
      if (transcript) setFeedback(`Te escuché: "${transcript}"`);
      const tile = matchTile(transcript);
      if (tile) fire(tile);
    };
    rec.onerror = (e) => {
      if (decided) return;
      if (e?.error === "no-speech") setFeedback("No te escuché. Intenta de nuevo.");
      else if (e?.error === "not-allowed") setFeedback("Permiso de micrófono denegado.");
      else if (e?.error !== "aborted") setFeedback(`Error de voz: ${e?.error ?? "desconocido"}`);
      recRef.current = null;
      recStartedRef.current = false;
      setStatus("idle");
    };
    rec.onend = () => {
      if (decided) return;
      recRef.current = null;
      recStartedRef.current = false;
      setStatus("idle");
    };
    try { rec.start(); } catch { recStartedRef.current = false; setStatus("idle"); setFeedback("No pude iniciar el micrófono."); }
  }

  function start() {
    if (!getVoiceEnabled()) return;
    if (status === "reading") {
      stopSpeaking();
      setFeedback("Interrumpido. Escuchando tu elección…");
      const rec = recRef.current;
      if (rec) listenNow(rec);
      else setStatus("idle");
      return;
    }
    if (status === "listening") {
      stopSpeaking();
      stopRecognition(recRef.current);
      recRef.current = null;
      recStartedRef.current = false;
      setStatus("idle");
      setFeedback("");
      return;
    }
    const rec = getRecognition({ interim: true, continuous: true }) as RecognitionLike | null;
    if (!rec) {
      setFeedback("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    recRef.current = rec;
    recStartedRef.current = false;
    setStatus("reading");
    setFeedback("Leyendo opciones…");
    const intro = "Opciones disponibles. Di el número o el nombre.";
    const numbered = tiles.map((t, i) => `${i + 1}: ${t.spoken}.`);
    speakSequence([intro, ...numbered, "Te escucho."], () => {
      if (!getVoiceEnabled()) { setStatus("idle"); return; }
      listenNow(rec);
    });
  }

  const Icon = status === "idle" ? Mic : Square;
  return (
    <>
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-36 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-purple/30 bg-white px-4 py-2 text-xs text-purple shadow-lg max-w-[90vw] text-center"
        >
          {feedback}
        </div>
      )}
      <button
        type="button"
        onClick={start}
        aria-label={
          status === "idle"
            ? "Activar menú por voz global: lee las secciones y escucha tu elección"
            : "Cancelar menú por voz"
        }
        aria-pressed={status !== "idle"}
        className={`fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full shadow-lg transition-colors ${
          status === "idle" ? "bg-purple text-purple-foreground hover:bg-purple/90" : "bg-destructive text-destructive-foreground animate-pulse"
        }`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </button>
    </>
  );
}
