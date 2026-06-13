import { Volume2, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { isSpeechSupported, speak, stopSpeaking } from "@/lib/speech";

export function ListenBar({
  label = "Escuchar pantalla",
  text,
}: {
  label?: string;
  text?: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isSpeechSupported());
    return () => stopSpeaking();
  }, []);

  function toggle() {
    if (!supported) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const content =
      text ??
      (typeof document !== "undefined"
        ? document.querySelector("main")?.textContent?.trim() ?? ""
        : "");
    if (!content) return;
    const u = new SpeechSynthesisUtterance(content);
    u.lang = "es-ES";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
    // fallback simple speak() if utterance config fails
    if (!window.speechSynthesis.speaking) speak(content);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!supported}
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 border-t border-border bg-navy px-4 py-3 text-navy-foreground shadow-lg transition-colors hover:bg-navy/90 disabled:opacity-60"
      aria-label={label}
    >
      {speaking ? <Square className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      <span className="text-sm font-medium">
        {!supported ? "Voz no soportada" : speaking ? "Detener lectura" : label}
      </span>
    </button>
  );
}
