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
  { to: "/ojos-abiertos", spoken: "Ojos Abiertos, cámara con inteligencia artificial", keywords: ["ojos", "abiertos", "camara", "cámara", "ver", "describir", "vision", "visión"] },
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

  function evaluarTranscript(texto: string) {
    if (ejecutadoRef.current) return;
    const normalizado = texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    const comandos: Record<string, () => void> = {
      "uno": () => navigate({ to: "/explorar" }),
      "dos": () => navigate({ to: "/lugares-cercanos" }),
      "tres": () => navigate({ to: "/asistente" }),
      "cuatro": () => navigate({ to: "/ojos-abiertos" }),
      "cinco": () => navigate({ to: "/favoritos" }),
      "seis": () => navigate({ to: "/historial" }),
      "siete": () => navigate({ to: "/configuracion" }),
      "ocho": () => navigate({ to: "/home" }),
      "1": () => navigate({ to: "/explorar" }),
      "2": () => navigate({ to: "/lugares-cercanos" }),
      "3": () => navigate({ to: "/asistente" }),
      "4": () => navigate({ to: "/ojos-abiertos" }),
      "5": () => navigate({ to: "/favoritos" }),
      "6": () => navigate({ to: "/historial" }),
      "7": () => navigate({ to: "/configuracion" }),
      "8": () => navigate({ to: "/home" }),
      "explorar": () => navigate({ to: "/explorar" }),
      "busqueda": () => navigate({ to: "/explorar" }),
      "búsqueda": () => navigate({ to: "/explorar" }),
      "destino": () => navigate({ to: "/explorar" }),
      "cercano": () => navigate({ to: "/lugares-cercanos" }),
      "cercanos": () => navigate({ to: "/lugares-cercanos" }),
      "cerca": () => navigate({ to: "/lugares-cercanos" }),
      "lugares": () => navigate({ to: "/lugares-cercanos" }),
      "chatbot": () => navigate({ to: "/asistente" }),
      "asistente": () => navigate({ to: "/asistente" }),
      "ayudante": () => navigate({ to: "/asistente" }),
      "ojos": () => navigate({ to: "/ojos-abiertos" }),
      "abiertos": () => navigate({ to: "/ojos-abiertos" }),
      "camara": () => navigate({ to: "/ojos-abiertos" }),
      "cámara": () => navigate({ to: "/ojos-abiertos" }),
      "describir": () => navigate({ to: "/ojos-abiertos" }),
      "favoritos": () => navigate({ to: "/favoritos" }),
      "favorito": () => navigate({ to: "/favoritos" }),
      "historial": () => navigate({ to: "/historial" }),
      "recientes": () => navigate({ to: "/historial" }),
      "configuracion": () => navigate({ to: "/configuracion" }),
      "configuración": () => navigate({ to: "/configuracion" }),
      "ajustes": () => navigate({ to: "/configuracion" }),
      "inicio": () => navigate({ to: "/home" }),
      "home": () => navigate({ to: "/home" }),
      "principal": () => navigate({ to: "/home" }),
    };

    for (const [keyword, accion] of Object.entries(comandos)) {
      const keyNorm = keyword
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (normalizado.includes(keyNorm)) {
        ejecutadoRef.current = true;
        const rec = recRef.current;
        if (rec) {
          try { rec.abort?.(); } catch { /* ignore */ }
        }
        recRef.current = null;
        recStartedRef.current = false;
        setStatus("idle");
        setFeedback("Abriendo…");
        stopSpeaking();
        accion();
        return;
      }
    }
  }

  function listenNow(rec: RecognitionLike) {
    if (recStartedRef.current) return;
    recStartedRef.current = true;
    setStatus("listening");
    setFeedback("Escuchando…");
    ejecutadoRef.current = false;

    rec.onresult = (e) => {
      if (ejecutadoRef.current) return;
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        evaluarTranscript(transcript);
        if (ejecutadoRef.current) break;
      }
    };
    rec.onerror = (e) => {
      if (ejecutadoRef.current) return;
      if (e?.error === "no-speech") setFeedback("No te escuché. Intenta de nuevo.");
      else if (e?.error === "not-allowed") setFeedback("Permiso de micrófono denegado.");
      else if (e?.error !== "aborted") setFeedback(`Error de voz: ${e?.error ?? "desconocido"}`);
      recRef.current = null;
      recStartedRef.current = false;
      setStatus("idle");
    };
    rec.onend = () => {
      if (ejecutadoRef.current) return;
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
      setStatus("listening");
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
    const rec = getRecognition({ interim: true, continuous: false }) as RecognitionLike | null;
    if (!rec) {
      setFeedback("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    recRef.current = rec;
    recStartedRef.current = false;
    ejecutadoRef.current = false;
    listenNow(rec);
    setStatus("reading");
    setFeedback("Leyendo opciones… también puedes decir una opción ahora.");
    const intro = "Opciones disponibles. Di el número o el nombre.";
    const numbered = tiles.map((t, i) => `${i + 1}: ${t.spoken}.`);
    speakSequence([intro, ...numbered, "Te escucho."], () => {
      if (!getVoiceEnabled()) { setStatus("idle"); return; }
      if (ejecutadoRef.current) return;
      setStatus((s) => (s === "reading" ? "listening" : s));
      setFeedback((current) => current.startsWith("Abriendo:") ? current : "Escuchando… di un número o el nombre.");
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
