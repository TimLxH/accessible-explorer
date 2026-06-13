import { createFileRoute } from "@tanstack/react-router";
import { Mic, Send, Square } from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { chat as initial } from "@/lib/mock-data";
import { getRecognition, speak, stopSpeaking } from "@/lib/speech";

export const Route = createFileRoute("/asistente")({
  head: () => ({ meta: [{ title: "Asistente — Turismo Sin Barreras" }] }),
  component: Asistente,
});

function fakeAnswer(q: string) {
  const t = q.toLowerCase();
  if (t.includes("cerca") || t.includes("cercano"))
    return "Encontré varios lugares accesibles cerca de ti. Abre 'Lugares cercanos' para verlos ordenados por distancia.";
  if (t.includes("torre")) return "Torre Torre es una formación geológica a 2,3 kilómetros. Tiene acceso parcial para sillas de ruedas en el mirador inicial.";
  if (t.includes("emergencia") || t.includes("ayuda"))
    return "Puedo compartir tu ubicación. Ve a la sección Emergencia para activarlo.";
  return "Entendido. Estoy buscando información para ti sobre " + q;
}

function Asistente() {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  function reply(userText: string) {
    const answer = fakeAnswer(userText);
    setMessages((m) => [
      ...m,
      { id: Date.now(), from: "user", text: userText },
      { id: Date.now() + 1, from: "assistant", text: answer },
    ]);
    speak(answer);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    reply(text.trim());
    setText("");
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    stopSpeaking();
    const rec = getRecognition();
    if (!rec) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    recRef.current = rec;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string;
      reply(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  }

  return (
    <AppShell title="Asistente virtual" back bottomBar={<ListenBar label="Escuchar conversación" />}>
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-6">
        <div className="flex flex-col gap-3 pb-32">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.from === "user"
                  ? "ml-auto rounded-br-md bg-purple text-purple-foreground"
                  : "mr-auto rounded-bl-md bg-card text-card-foreground border border-border"
              }`}
            >
              {m.text}
            </div>
          ))}
          {listening && (
            <div className="mr-auto rounded-2xl border border-purple/40 bg-purple/5 px-4 py-3 text-sm text-purple">
              Escuchando…
            </div>
          )}
        </div>
      </div>
      <form onSubmit={send} className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-card p-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Detener" : "Hablar"}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              listening
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground hover:bg-accent/80"
            }`}
          >
            {listening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe o habla..."
            className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-3 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
          <button
            type="submit"
            aria-label="Enviar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-purple text-purple-foreground hover:bg-purple/90"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </AppShell>
  );
}
