// Speech helpers: TTS via ElevenLabs (server fn) with browser fallback, STT via Web Speech API.
import { synthesizeSpeech } from "@/lib/tts.functions";

let currentAudio: HTMLAudioElement | null = null;
let currentToken = 0;

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function readRate() {
  try {
    const r = parseFloat(window.localStorage.getItem("puriy_voice_rate") ?? "1.3");
    return Number.isNaN(r) ? 1.3 : Math.min(1.6, Math.max(1.0, r));
  } catch { return 1.3; }
}
function readVolume() {
  try {
    const v = parseInt(window.localStorage.getItem("puriy_voice_volume") ?? "70", 10);
    return Number.isNaN(v) ? 0.7 : Math.min(1, Math.max(0, v / 100));
  } catch { return 0.7; }
}
function readLang() {
  try {
    const l = window.localStorage.getItem("puriy_lang") ?? "es";
    return l === "en" ? "en-US" : l === "qu" ? "es-PE" : "es-ES";
  } catch { return "es-ES"; }
}

function browserSpeak(text: string, opts?: { lang?: string; rate?: number }) {
  if (!isSpeechSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts?.lang ?? readLang();
  u.rate = opts?.rate ?? readRate();
  u.volume = readVolume();
  u.pitch = 1;
  const voice = synth.getVoices().find((v) => v.lang.startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  synth.speak(u);
}

export function speak(text: string, opts?: { lang?: string; rate?: number }) {
  if (!text || typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem("puriy_voice_enabled") === "0") return;
    if (window.localStorage.getItem("puriy_guide_voice") === "0") return;
  } catch { /* ignore */ }
  stopSpeaking();
  const token = ++currentToken;
  const vol = readVolume();

  synthesizeSpeech({ data: { text } })
    .then(({ audio, mime }) => {
      if (token !== currentToken) return;
      const url = `data:${mime};base64,${audio}`;
      const a = new Audio(url);
      a.volume = vol;
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

