import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmergencyBar } from "@/components/emergency-bar";
import { describirImagen } from "@/lib/asistente.functions";
import { speak, stopSpeaking } from "@/lib/speech";

export const Route = createFileRoute("/ojos-abiertos")({
  head: () => ({
    meta: [
      { title: "Ojos Abiertos — Pury Ayni" },
      {
        name: "description",
        content:
          "Modo cámara con inteligencia artificial: describe lo que la cámara ve, para personas con discapacidad visual.",
      },
    ],
  }),
  component: OjosAbiertos,
});

type Estado = "iniciando" | "listo" | "analizando" | "error";

function OjosAbiertos() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ultimoDisparoRef = useRef<number>(0);
  const analizandoRef = useRef(false);

  const [estado, setEstado] = useState<Estado>("iniciando");
  const [mensaje, setMensaje] = useState<string>("Solicitando acceso a la cámara…");
  const [descripcion, setDescripcion] = useState<string>("");

  const describir = useServerFn(describirImagen);

  const detenerCamara = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Iniciar cámara
  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = "Tu navegador no permite usar la cámara. Prueba con Chrome o Edge en Android.";
        setEstado("error");
        setMensaje(msg);
        speak(msg);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setEstado("listo");
        const intro =
          "Cámara lista. Toca la pantalla o agita el teléfono para que describa lo que ves.";
        setMensaje(intro);
        speak(intro);
      } catch (err) {
        const e = err as { name?: string };
        const msg =
          e?.name === "NotAllowedError"
            ? "No tengo permiso para usar la cámara. Actívalo en los ajustes del navegador e intenta de nuevo."
            : e?.name === "NotFoundError"
              ? "No encontré ninguna cámara en este dispositivo."
              : "No pude acceder a la cámara. Intenta de nuevo.";
        setEstado("error");
        setMensaje(msg);
        speak(msg);
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      detenerCamara();
      stopSpeaking();
    };
  }, [detenerCamara]);

  const analizar = useCallback(async () => {
    if (analizandoRef.current) return;
    const ahora = Date.now();
    if (ahora - ultimoDisparoRef.current < 2000) return;
    ultimoDisparoRef.current = ahora;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    analizandoRef.current = true;
    setEstado("analizando");
    setMensaje("Analizando…");
    setDescripcion("");
    stopSpeaking();
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(80);
      }
    } catch {
      /* ignore */
    }

    try {
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      // Reduce resolución para no enviar imágenes enormes
      const maxLado = 1024;
      const escala = Math.min(1, maxLado / Math.max(w, h));
      canvas.width = Math.round(w * escala);
      canvas.height = Math.round(h * escala);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No pude preparar la imagen.");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

      const { text } = await describir({
        data: { imageBase64: dataUrl, mime: "image/jpeg" },
      });

      const respuesta = text?.trim() || "No pude describir la imagen.";
      setDescripcion(respuesta);
      setMensaje("");
      setEstado("listo");
      speak(respuesta);
      try {
        if ("vibrate" in navigator) navigator.vibrate?.([40, 60, 40]);
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error("analizar error", err);
      const msg = "Hubo un error al analizar la imagen. Intenta de nuevo.";
      setDescripcion("");
      setMensaje(msg);
      setEstado("listo");
      speak(msg);
    } finally {
      analizandoRef.current = false;
    }
  }, [describir]);

  // Sacudida del teléfono
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("DeviceMotionEvent" in window)) return;

    let ultimo = 0;
    const UMBRAL = 22; // m/s^2 incluyendo gravedad
    function onMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const ahora = Date.now();
      if (mag > UMBRAL && ahora - ultimo > 2000) {
        ultimo = ahora;
        analizar();
      }
    }
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [analizar]);

  function onTap() {
    analizar();
  }

  return (
    <AppShell title="Ojos Abiertos" back bottomBar={<EmergencyBar />}>
      <div className="relative mx-auto max-w-3xl px-0 py-0">
        <button
          type="button"
          onClick={onTap}
          aria-label="Tocar para describir lo que ve la cámara"
          className="relative block h-[70vh] w-full overflow-hidden rounded-none bg-black focus:outline-none focus:ring-4 focus:ring-purple"
        >
          <video
            ref={videoRef}
            playsInline
            muted
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center gap-2 bg-black/50 px-4 py-3 text-white">
            <Camera className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold">Ojos Abiertos</span>
          </div>
          {estado === "analizando" && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 grid place-items-center bg-black/60 text-white"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin" aria-hidden="true" />
                <span className="text-lg font-semibold">Analizando…</span>
              </div>
            </div>
          )}
        </button>
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        <div className="mx-auto max-w-3xl px-5 py-5">
          {mensaje && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 rounded-xl border border-purple/30 bg-purple/5 px-4 py-3 text-base text-purple"
            >
              {mensaje}
            </div>
          )}
          {descripcion && (
            <div
              role="region"
              aria-label="Descripción de la imagen"
              aria-live="polite"
              className="rounded-2xl border border-border bg-card p-5 text-2xl font-medium leading-relaxed text-card-foreground"
            >
              {descripcion}
            </div>
          )}
          <p className="mt-6 text-sm text-muted-foreground">
            Toca la pantalla o agita el teléfono para describir lo que ves.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
