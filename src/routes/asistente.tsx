import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Send, Square } from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmergencyBar } from "@/components/emergency-bar";
import { askAssistant } from "@/lib/asistente.functions";
import { chat as initial } from "@/lib/mock-data";
import { getRecognition, speak, stopSpeaking } from "@/lib/speech";

export const Route = createFileRoute("/asistente")({
  head: () => ({ meta: [{ title: "Chatbot — Puriy Ayni" }] }),
  component: Asistente,
});

type Msg = { id: number; from: "user" | "assistant"; text: string };

function Asistente() {
  const [messages, setMessages] = useState<Msg[]>(initial as Msg[]);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const recRef = useRef<any>(null);
  const ask = useServerFn(askAssistant);

  async function reply(userText: string) {
    const userMsg: Msg = { id: Date.now(), from: "user", text: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setThinking(true);
    try {
      const history = nextMessages.map((m) => ({
        role: m.from === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));
      const res = await ask({ data: { messages: history } });
      const answer = res?.text?.trim() || "No pude generar una respuesta. Intenta de nuevo.";
      setMessages((m) => [...m, { id: Date.now() + 1, from: "assistant", text: answer }]);
      speak(answer);
    } catch (err) {
      console.error(err);
      const fallback = "Lo siento, hubo un error de conexión. Por favor intenta de nuevo.";
      setMessages((m) => [...m, { id: Date.now() + 1, from: "assistant", text: fallback }]);
      speak(fallback);
    } finally {
      setThinking(false);
    }
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || thinking) return;
    reply(text.trim());
    setText("");
  }

  async function toggleMic() {
    if (listening) {
      try { recRef.current?.stop(); } catch { /* ignore */ }
      setListening(false);
      return;
    }
    stopSpeaking();

    const rec = getRecognition({ interim: true });
    if (!rec) {
      const msg = "Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge en Android, o escribe el mensaje.";
      setMessages((m) => [...m, { id: Date.now(), from: "assistant", text: msg }]);
      speak(msg);
      return;
    }

    // Solicitar permiso de micrófono explícitamente (ayuda en Android/Chrome)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError"
          ? "No tengo permiso para usar el micrófono. Actívalo en los ajustes del navegador e intenta de nuevo."
          : err?.name === "NotFoundError"
          ? "No encontré ningún micrófono conectado."
          : "No pude acceder al micrófono. Intenta de nuevo.";
      setMessages((m) => [...m, { id: Date.now(), from: "assistant", text: msg }]);
      speak(msg);
      return;
    }

    let finalTranscript = "";
    recRef.current = rec;

    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
      }
    };
    rec.onend = () => {
      setListening(false);
      const t = finalTranscript.trim();
      if (t) reply(t);
    };
    rec.onerror = (e: any) => {
      setListening(false);
      const code = e?.error as string | undefined;
      let msg = "";
      if (code === "not-allowed" || code === "service-not-allowed") {
        msg = "El navegador bloqueó el micrófono. Otorga el permiso e intenta de nuevo.";
      } else if (code === "no-speech") {
        msg = "No te escuché. Toca el micrófono e intenta hablar otra vez.";
      } else if (code === "audio-capture") {
        msg = "No detecté un micrófono. Conecta uno e intenta de nuevo.";
      } else if (code === "network") {
        msg = "Hubo un problema de red al reconocer la voz. Revisa tu conexión.";
      }
      if (msg) {
        setMessages((m) => [...m, { id: Date.now(), from: "assistant", text: msg }]);
        speak(msg);
      }
    };

    try {
      rec.start();
      setListening(true);
    } catch (err) {
      console.error("rec.start failed", err);
      setListening(false);
      const msg = "No pude iniciar el micrófono. Intenta de nuevo en unos segundos.";
      setMessages((m) => [...m, { id: Date.now(), from: "assistant", text: msg }]);
      speak(msg);
    }
  }

  return (
    <AppShell title="Chatbot" back bottomBar={<EmergencyBar />}>
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-6">
        <div
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Conversación con el chatbot"
          className="flex flex-col gap-3 pb-32"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              aria-label={m.from === "user" ? `Tú dijiste: ${m.text}` : `Chatbot: ${m.text}`}
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
            <div
              role="status"
              aria-live="polite"
              className="mr-auto rounded-2xl border border-purple/40 bg-purple/5 px-4 py-3 text-sm text-purple"
            >
              Escuchando…
            </div>
          )}
          {thinking && (
            <div
              role="status"
              aria-live="polite"
              className="mr-auto rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
            >
              Pensando…
            </div>
          )}

        </div>
      </div>
      <form
        onSubmit={send}
        aria-label="Enviar mensaje al chatbot"
        className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-card p-3"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Detener reconocimiento de voz" : "Activar micrófono para dictar tu mensaje"}
            aria-pressed={listening}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
              listening
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground hover:bg-accent/80"
            }`}
          >
            {listening ? <Square className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
          </button>
          <label htmlFor="chat-input" className="sr-only">Escribe un mensaje al chatbot</label>
          <input
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe o habla..."
            className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-3 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
          <button
            type="submit"
            disabled={thinking || !text.trim()}
            aria-label="Enviar mensaje al asistente"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple text-purple-foreground hover:bg-purple/90 disabled:opacity-50"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>

        </div>
      </form>
    </AppShell>
  );
}

