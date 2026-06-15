import { useEffect, useState } from "react";
import { stopSpeaking } from "@/lib/speech";

const KEY = "puriy_voice_enabled";
const RATE_KEY = "puriy_voice_rate";
const GUIDE_KEY = "puriy_guide_voice";
const HC_KEY = "puriy_high_contrast";
const VIB_KEY = "puriy_vibration";
const VOL_KEY = "puriy_voice_volume";
const LANG_KEY = "puriy_lang";
const GUIDE_TYPE_KEY = "puriy_guide_type";

const EVT = "puriy:voice-enabled-change";
const RATE_EVT = "puriy:voice-rate-change";
const GUIDE_EVT = "puriy:guide-voice-change";
const HC_EVT = "puriy:high-contrast-change";
const VIB_EVT = "puriy:vibration-change";
const VOL_EVT = "puriy:voice-volume-change";
const LANG_EVT = "puriy:lang-change";
const GTYPE_EVT = "puriy:guide-type-change";

function readBool(k: string, def: boolean) {
  if (typeof window === "undefined") return def;
  const v = window.localStorage.getItem(k);
  return v === null ? def : v === "1";
}
function writeBool(k: string, evt: string, v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(k, v ? "1" : "0");
  window.dispatchEvent(new CustomEvent(evt, { detail: v }));
}
function useBool(k: string, evt: string, def: boolean): [boolean, (v: boolean) => void] {
  const [val, set] = useState<boolean>(def);
  useEffect(() => {
    set(readBool(k, def));
    const h = () => set(readBool(k, def));
    window.addEventListener(evt, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(evt, h);
      window.removeEventListener("storage", h);
    };
  }, [k, evt, def]);
  return [val, (v: boolean) => writeBool(k, evt, v)];
}

// ----- Comandos y asistencia por voz -----
export function getVoiceEnabled() { return readBool(KEY, true); }
export function setVoiceEnabled(v: boolean) {
  writeBool(KEY, EVT, v);
  if (!v) {
    try { stopSpeaking(); } catch { /* */ }
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
  }
}
export function useVoiceEnabled(): [boolean, (v: boolean) => void] {
  const [val, set] = useBool(KEY, EVT, true);
  return [val, (v) => setVoiceEnabled(v)];
}

// ----- Guía por voz (lectura automática) -----
export function getGuideVoice() { return readBool(GUIDE_KEY, true); }
export function setGuideVoice(v: boolean) {
  writeBool(GUIDE_KEY, GUIDE_EVT, v);
  if (!v) { try { stopSpeaking(); } catch { /* */ } }
}
export function useGuideVoice(): [boolean, (v: boolean) => void] {
  const [val] = useBool(GUIDE_KEY, GUIDE_EVT, true);
  return [val, setGuideVoice];
}

// ----- Alto contraste -----
export function getHighContrast() { return readBool(HC_KEY, false); }
export function setHighContrast(v: boolean) {
  writeBool(HC_KEY, HC_EVT, v);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("high-contrast", v);
  }
}
export function useHighContrast(): [boolean, (v: boolean) => void] {
  const [val] = useBool(HC_KEY, HC_EVT, false);
  return [val, setHighContrast];
}

// ----- Vibración -----
export function getVibration() { return readBool(VIB_KEY, true); }
export function setVibration(v: boolean) { writeBool(VIB_KEY, VIB_EVT, v); }
export function useVibration(): [boolean, (v: boolean) => void] {
  const [val] = useBool(VIB_KEY, VIB_EVT, true);
  return [val, setVibration];
}
export function vibrate(pattern: number | number[] = 30) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (!getVibration()) return;
  try { navigator.vibrate(pattern); } catch { /* */ }
}

// ----- Rate -----
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
    const h = () => set(getVoiceRate());
    window.addEventListener(RATE_EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(RATE_EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [rate, setVoiceRate];
}

// ----- Volumen (0..100) -----
export function getVoiceVolume(): number {
  if (typeof window === "undefined") return 70;
  const raw = window.localStorage.getItem(VOL_KEY);
  const n = raw === null ? 70 : parseInt(raw, 10);
  if (Number.isNaN(n)) return 70;
  return Math.min(100, Math.max(0, n));
}
export function setVoiceVolume(v: number) {
  if (typeof window === "undefined") return;
  const c = Math.min(100, Math.max(0, Math.round(v)));
  window.localStorage.setItem(VOL_KEY, String(c));
  window.dispatchEvent(new CustomEvent(VOL_EVT, { detail: c }));
}
export function useVoiceVolume(): [number, (v: number) => void] {
  const [vol, set] = useState<number>(70);
  useEffect(() => {
    set(getVoiceVolume());
    const h = () => set(getVoiceVolume());
    window.addEventListener(VOL_EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(VOL_EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [vol, setVoiceVolume];
}

// ----- Idioma -----
export type Lang = "es" | "en" | "qu";
const LANG_MAP: Record<Lang, string> = { es: "es-ES", en: "en-US", qu: "es-PE" };
export function getLang(): Lang {
  if (typeof window === "undefined") return "es";
  const v = window.localStorage.getItem(LANG_KEY) as Lang | null;
  return v ?? "es";
}
export function getSpeechLang() { return LANG_MAP[getLang()]; }
export function setLang(v: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANG_KEY, v);
  window.dispatchEvent(new CustomEvent(LANG_EVT, { detail: v }));
}
export function useLang(): [Lang, (v: Lang) => void] {
  const [val, set] = useState<Lang>("es");
  useEffect(() => {
    set(getLang());
    const h = () => set(getLang());
    window.addEventListener(LANG_EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(LANG_EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [val, setLang];
}

// ----- Tipo de guía -----
export type GuideType = "detallada" | "breve" | "direcciones";
export function getGuideType(): GuideType {
  if (typeof window === "undefined") return "detallada";
  return (window.localStorage.getItem(GUIDE_TYPE_KEY) as GuideType) ?? "detallada";
}
export function setGuideType(v: GuideType) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUIDE_TYPE_KEY, v);
  window.dispatchEvent(new CustomEvent(GTYPE_EVT, { detail: v }));
}
export function useGuideType(): [GuideType, (v: GuideType) => void] {
  const [val, set] = useState<GuideType>("detallada");
  useEffect(() => {
    set(getGuideType());
    const h = () => set(getGuideType());
    window.addEventListener(GTYPE_EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(GTYPE_EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [val, setGuideType];
}

export const VOICE_MENU_RATE = 1.3;
