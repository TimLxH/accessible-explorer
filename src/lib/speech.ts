// Web Speech API helpers (TTS + STT). Browser-only.

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, opts?: { lang?: string; rate?: number }) {
  if (!isSpeechSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts?.lang ?? "es-ES";
  u.rate = opts?.rate ?? 1;
  const voice = synth.getVoices().find((v) => v.lang.startsWith("es"));
  if (voice) u.voice = voice;
  synth.speak(u);
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

type SR = typeof window extends { SpeechRecognition: infer T } ? T : any;

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

