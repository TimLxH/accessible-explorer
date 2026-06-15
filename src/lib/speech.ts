// Speech helpers: TTS via ElevenLabs (server fn) with browser fallback, STT via Web Speech API.
import { synthesizeSpeech } from "@/lib/tts.functions";

let currentAudio: HTMLAudioElement | null = null;
let currentToken = 0;

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function browserSpeak(text: string, opts?: { lang?: string; rate?: number }) {
  if (!isSpeechSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts?.lang ?? "es-ES";
  u.rate = opts?.rate ?? 0.95;
  u.pitch = 1;
  const voice = synth.getVoices().find((v) => v.lang.startsWith("es"));
  if (voice) u.voice = voice;
  synth.speak(u);
}

export function speak(text: string, opts?: { lang?: string; rate?: number }) {
  if (!text || typeof window === "undefined") return;
  // Respect global voice preference.
  try {
    const v = window.localStorage.getItem("puriy_voice_enabled");
    if (v === "0") return;
  } catch { /* ignore */ }
  stopSpeaking();
  const token = ++currentToken;

  // Intenta voz ElevenLabs (Sarah, cálida y pausada). Fallback al sintetizador del navegador.
  synthesizeSpeech({ data: { text } })
    .then(({ audio, mime }) => {
      if (token !== currentToken) return; // se canceló o reemplazó
      const url = `data:${mime};base64,${audio}`;
      const a = new Audio(url);
      currentAudio = a;
      a.play().catch(() => browserSpeak(text, opts));
    })
    .catch((err) => {
      console.warn("ElevenLabs TTS no disponible, usando voz del navegador:", err);
      if (token === currentToken) browserSpeak(text, opts);
    });
}

export function stopSpeaking() {
  currentToken++;
  if (currentAudio) {
    try { currentAudio.pause(); } catch { /* ignore */ }
    currentAudio = null;
  }
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

export function getRecognition(opts?: {
  interim?: boolean;
  continuous?: boolean;
}): any | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "es-ES";
  r.interimResults = opts?.interim ?? false;
  r.continuous = opts?.continuous ?? false;
  r.maxAlternatives = 3;
  return r;
}
