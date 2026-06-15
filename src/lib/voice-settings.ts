import { useEffect, useState } from "react";
import { stopSpeaking } from "@/lib/speech";

const KEY = "puriy_voice_enabled";
const EVT = "puriy:voice-enabled-change";

export function getVoiceEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(KEY);
  return v === null ? true : v === "1";
}

export function setVoiceEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, v ? "1" : "0");
  if (!v) {
    try { stopSpeaking(); } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: v }));
}

export function useVoiceEnabled(): [boolean, (v: boolean) => void] {
  const [enabled, set] = useState<boolean>(true);
  useEffect(() => {
    set(getVoiceEnabled());
    const handler = () => set(getVoiceEnabled());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return [enabled, setVoiceEnabled];
}

// Velocidad de lectura recomendada para opciones de menú: ágil pero clara.
export const VOICE_MENU_RATE = 1.3;
