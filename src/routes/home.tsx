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
} from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { getRecognition, stopSpeaking } from "@/lib/speech";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Inicio — Turismo Sin Barreras" }] }),
  component: Home,
});

const tiles = [
  { to: "/explorar", label: "Búsqueda de destino", spoken: "Búsqueda de destino", keywords: ["búsqueda", "busqueda", "destino", "explorar", "buscar"], icon: Search, color: "bg-purple text-purple-foreground" },
  { to: "/lugares-cercanos", label: "Lugares cercanos", spoken: "Lugares cercanos", keywords: ["cercano", "cercanos", "cerca", "lugares"], icon: Compass, color: "bg-navy text-navy-foreground" },
  { to: "/asistente", label: "Asistente de voz", spoken: "Asistente de voz", keywords: ["asistente", "voz", "ayudante"], icon: Mic, color: "bg-purple text-purple-foreground" },
  { to: "/favoritos", label: "Favoritos", spoken: "Favoritos", keywords: ["favorito", "favoritos"], icon: Heart, color: "bg-navy text-navy-foreground" },
  { to: "/historial", label: "Historial", spoken: "Historial", keywords: ["historial", "historia", "recientes"], icon: Clock, color: "bg-purple text-purple-foreground" },
  { to: "/emergencia", label: "Emergencia", spoken: "Emergencia", keywords: ["emergencia", "ayuda", "urgencia", "auxilio"], icon: AlertTriangle, color: "bg-destructive text-destructive-foreground" },
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
    const u = new SpeechSynthesisUtterance(parts[i++]);
    u.lang = "es-ES";
    u.onend = next;
    u.onerror = next;
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
  const [status, setStatus] = useState<"idle" | "reading" | "listening">("idle");
  const [feedback, setFeedback] = useState<string>("");
  const recRef = useRef<any>(null);

  function startVoiceMenu() {
    if (status !== "idle") {
      stopSpeaking();
      recRef.current?.stop?.();
      setStatus("idle");
      setFeedback("");
      return;
    }

    const rec = getRecognition();
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
      setFeedback("Escuchando tu elección…");
      rec.onresult = (e: any) => {
        const transcript: string = e.results[0][0].transcript;
        const tile = matchTile(transcript);
        if (tile) {
          setFeedback(`Abriendo: ${tile.spoken}`);
          speakSequence([`Abriendo ${tile.spoken}`], () => {});
          navigate({ to: tile.to });
        } else {
          setFeedback(`No reconocí "${transcript}". Intenta de nuevo.`);
          speakSequence(["No reconocí tu elección. Intenta de nuevo."], () => {});
        }
        setStatus("idle");
      };
      rec.onerror = () => {
        setStatus("idle");
        setFeedback("No pude escucharte. Intenta de nuevo.");
      };
      rec.onend = () => {
        setStatus((s) => (s === "listening" ? "idle" : s));
      };
      recRef.current = rec;
      try {
        rec.start();
      } catch {
        setStatus("idle");
      }
    });
  }

  const btnIcon = status === "idle" ? Volume2 : Square;
  const Icon = btnIcon;

  return (
    <AppShell title="Inicio" bottomBar={<ListenBar />}>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">¡Hola!</h2>
            <p className="mt-1 text-lg text-muted-foreground">¿A dónde quieres ir hoy?</p>
          </div>
          <button
            onClick={startVoiceMenu}
            className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-md transition-colors ${
              status === "idle"
                ? "bg-purple text-purple-foreground hover:bg-purple/90"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
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
            className="mb-5 rounded-xl border border-purple/30 bg-purple/5 px-4 py-3 text-sm text-purple"
          >
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {tiles.map((t, i) => {
            const TileIcon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`grid h-16 w-16 place-items-center rounded-2xl ${t.color} transition-transform group-hover:scale-110`}>
                  <TileIcon className="h-8 w-8" />
                </div>
                <span className="text-sm font-semibold leading-tight text-foreground sm:text-base">
                  <span className="mr-1 text-muted-foreground">{i + 1}.</span>
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
