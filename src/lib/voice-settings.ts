import { useEffect, useState } from "react";
import { stopSpeaking } from "@/lib/speech";

const KEY = "puriy_voice_enabled";
const RATE_KEY = "puriy_voice_rate";
const EVT = "puriy:voice-enabled-change";
const RATE_EVT = "puriy:voice-rate-change";

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

export function getVoiceRate(): number {
  if (typeof window === "undefined") return 1.3;
  const raw = window.localStorage.getItem(RATE_KEY);
  if (raw === null) return 1.3;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 1.3;
  return Math.min(1.6, Math.max(1.0, n));
}

export function setVoiceRate(v: number) {
  if (typeof window === "undefined") return;
  const clamped = Math.min(1.6, Math.max(1.0, Math.round(v * 10) / 10));
  window.localStorage.setItem(RATE_KEY, String(clamped));
  window.dispatchEvent(new CustomEvent(RATE_EVT, { detail: clamped }));
}

export function useVoiceRate(): [number, (v: number) => void] {
  const [rate, set] = useState<number>(1.3);
  useEffect(() => {
    set(getVoiceRate());
    const handler = () => set(getVoiceRate());
    window.addEventListener(RATE_EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(RATE_EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return [rate, setVoiceRate];
}

// Velocidad de lectura recomendada para opciones de menú: ágil pero clara.
export const VOICE_MENU_RATE = 1.3;

