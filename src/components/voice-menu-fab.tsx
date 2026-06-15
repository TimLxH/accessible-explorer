import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getRecognition, stopSpeaking } from "@/lib/speech";
import { getVoiceEnabled, useVoiceEnabled, VOICE_MENU_RATE } from "@/lib/voice-settings";

type Tile = {
  to: string;
  spoken: string;
  keywords: string[];
};

const tiles: Tile[] = [
  { to: "/explorar", spoken: "Búsqueda de destino", keywords: ["búsqueda", "busqueda", "destino", "explorar", "buscar"] },
  { to: "/lugares-cercanos", spoken: "Lugares cercanos", keywords: ["cercano", "cercanos", "cerca", "lugares"] },
  { to: "/asistente", spoken: "Asistente de voz", keywords: ["asistente", "ayudante"] },
  { to: "/favoritos", spoken: "Favoritos", keywords: ["favorito", "favoritos"] },
  { to: "/historial", spoken: "Historial", keywords: ["historial", "recientes"] },
  { to: "/emergencia", spoken: "Emergencia", keywords: ["emergencia", "ayuda", "urgencia", "auxilio"] },
  { to: "/configuracion", spoken: "Configuración", keywords: ["configuración", "configuracion", "ajustes"] },
  { to: "/home", spoken: "Inicio", keywords: ["inicio", "home", "principal"] },
];

function matchTile(transcript: string): Tile | null {
  const t = transcript.toLowerCase();
  const numMatch = t.match(/\b([1-8]|uno|dos|tres|cuatro|cinco|seis|siete|ocho)\b/);
  if (numMatch) {
    const map: Record<string, number> = {
      "1": 0, uno: 0, "2": 1, dos: 1, "3": 2, tres: 2, "4": 3, cuatro: 3,
      "5": 4, cinco: 4, "6": 5, seis: 5, "7": 6, siete: 6, "8": 7, ocho: 7,
    };
    const idx = map[numMatch[1]];
    if (idx != null && tiles[idx]) return tiles[idx];
  }
  for (const tile of tiles) {
    if (tile.keywords.some((k) => t.includes(k))) return tile;
  }
  return null;
}

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
    u.rate = VOICE_MENU_RATE;
    u.onend = next;
    u.onerror = next;
    window.speechSynthesis.speak(u);
  }
  next();
}

export function VoiceMenuFab() {
  const navigate = useNavigate();
  const [enabled] = useVoiceEnabled();
  const [status, setStatus] = useState<"idle" | "reading" | "listening">("idle");
  const [feedback, setFeedback] = useState("");
  const recRef = useRef<any>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Cancel any active session when voice is disabled or route changes.
  useEffect(() => {
    if (!enabled && status !== "idle") {
      try { recRef.current?.stop?.(); } catch { /* ignore */ }
      stopSpeaking();
      setStatus("idle");
      setFeedback("");
    }
  }, [enabled, status]);

  useEffect(() => {
    if (status !== "idle") {
      try { recRef.current?.stop?.(); } catch { /* ignore */ }
      stopSpeaking();
      setStatus("idle");
      setFeedback("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!enabled) return null;
  // Hide on landing/auth pages to avoid clutter.
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  function start() {
    if (!getVoiceEnabled()) return;
    if (status !== "idle") {
      stopSpeaking();
      try { recRef.current?.stop?.(); } catch { /* ignore */ }
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
    setFeedback("Leyendo opciones…");
    const intro = "Opciones disponibles. Di el número o el nombre.";
    const numbered = tiles.map((t, i) => `${i + 1}: ${t.spoken}.`);
    speakSequence([intro, ...numbered, "Te escucho."], () => {
      if (!getVoiceEnabled()) { setStatus("idle"); return; }
      setStatus("listening");
      setFeedback("Escuchando…");
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
        if (e?.error === "no-speech") setFeedback("No te escuché. Intenta de nuevo.");
        else if (e?.error === "not-allowed") setFeedback("Permiso de micrófono denegado.");
        else setFeedback(`Error de voz: ${e?.error ?? "desconocido"}`);
        setStatus("idle");
      };
      rec.onend = () => setStatus("idle");
      recRef.current = rec;
      try { rec.start(); } catch { setStatus("idle"); setFeedback("No pude iniciar el micrófono."); }
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
