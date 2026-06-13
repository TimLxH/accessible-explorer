import { createFileRoute } from "@tanstack/react-router";
import { Mic, Send } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { chat as initial } from "@/lib/mock-data";

export const Route = createFileRoute("/asistente")({
  head: () => ({ meta: [{ title: "Asistente — Turismo Sin Barreras" }] }),
  component: Asistente,
});

function Asistente() {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { id: Date.now(), from: "user", text },
      { id: Date.now() + 1, from: "assistant", text: "Entendido. Estoy buscando información para ti..." },
    ]);
    setText("");
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
        </div>
      </div>
      <form
        onSubmit={send}
        className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-card p-3"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            type="button"
            aria-label="Voz"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground hover:bg-accent/80"
          >
            <Mic className="h-5 w-5" />
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
