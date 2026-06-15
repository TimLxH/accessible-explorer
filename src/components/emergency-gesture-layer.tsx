import { useEffect, useRef } from "react";
import { useEmergency } from "@/lib/emergency-context";

type Point = { x: number; y: number; t: number };

/**
 * Capa invisible que detecta un gesto circular ("O") en cualquier parte de la app
 * y dispara la emergencia. Diseñada para no interferir con TalkBack/VoiceOver:
 * - pointer-events solo durante el trazo del usuario; permite scroll normal.
 * - No bloquea clicks de UI: usamos listeners en window con captura y solo
 *   actuamos cuando el trazo cumple criterios circulares.
 */
export function EmergencyGestureLayer() {
  const { trigger, active } = useEmergency();
  const pointsRef = useRef<Point[]>([]);
  const trackingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) return; // no rastrear si ya está activa

    function reset() {
      pointsRef.current = [];
      trackingRef.current = false;
      pointerIdRef.current = null;
    }

    function onDown(e: PointerEvent) {
      // Solo dedo/lápiz/mouse principal
      if (e.pointerType === "mouse" && e.button !== 0) return;
      trackingRef.current = true;
      pointerIdRef.current = e.pointerId;
      pointsRef.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    }

    function onMove(e: PointerEvent) {
      if (!trackingRef.current) return;
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      const pts = pointsRef.current;
      const last = pts[pts.length - 1];
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (dx * dx + dy * dy < 16) return; // muestreo mínimo 4px
      pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (pts.length > 400) pts.shift();
    }

    function onUp(e: PointerEvent) {
      if (!trackingRef.current) return reset();
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      const pts = pointsRef.current.slice();
      reset();
      if (isCircle(pts)) {
        trigger();
      }
    }

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", reset, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", reset);
    };
  }, [active, trigger]);

  return null;
}

/**
 * Heurística de detección de círculo aproximado.
 * Tolerante: acepta trazos irregulares hechos por usuarios con discapacidad visual.
 *
 * Criterios:
 *  - Suficientes puntos y longitud del trazo.
 *  - Duración mínima (descarta toques accidentales).
 *  - El punto final está cerca del inicial (cierre del trazo).
 *  - El recorrido cubre la mayoría de los ángulos alrededor del centroide
 *    (es decir, "da la vuelta").
 *  - Radio relativamente consistente (no es una línea).
 */
function isCircle(pts: { x: number; y: number; t: number }[]): boolean {
  if (pts.length < 12) return false;

  // Duración entre 250ms y 6s para evitar falsos positivos
  const duration = pts[pts.length - 1].t - pts[0].t;
  if (duration < 250 || duration > 6000) return false;

  // Longitud de trazo
  let pathLen = 0;
  for (let i = 1; i < pts.length; i++) {
    pathLen += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  if (pathLen < 200) return false;

  // Centroide y radios
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const radii = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
  const meanR = radii.reduce((a, b) => a + b, 0) / radii.length;
  if (meanR < 30) return false; // trazo demasiado pequeño

  // Desviación relativa del radio (debe parecerse a un círculo)
  const variance = radii.reduce((s, r) => s + (r - meanR) ** 2, 0) / radii.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev / meanR > 0.55) return false; // muy irregular -> no es círculo

  // Cierre: distancia entre inicio y fin
  const start = pts[0];
  const end = pts[pts.length - 1];
  const closeDist = Math.hypot(end.x - start.x, end.y - start.y);
  if (closeDist > meanR * 1.2) return false;

  // Cobertura angular: bins de 30° (12 bins). Requerimos al menos 9 cubiertos.
  const bins = new Array(12).fill(false);
  for (const p of pts) {
    const angle = Math.atan2(p.y - cy, p.x - cx); // -PI..PI
    const idx = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 12) % 12;
    bins[idx] = true;
  }
  const covered = bins.filter(Boolean).length;
  if (covered < 9) return false;

  return true;
}
