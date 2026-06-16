import { useEffect, useMemo, useRef, useState } from "react";

export type NodoVivo = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  accuracy: number;
};

type Posicion = {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed?: number | null;
} | null;

type Props = {
  nodos: NodoVivo[];
  posicion: Posicion;
  nodoActivoId: number | null;
  activo: boolean;
};

const HEIGHT = 320;
const METROS_POR_PIXEL = 3.0;
const METERS_PER_DEG = 111320;

function truncar(s: string, n = 18) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// Haversine local (no tocar la del archivo principal)
function distMetros(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Proyecta la posición sobre el segmento de ruta más cercano.
// Si está a más de 25 m de la ruta, devuelve la posición real.
function snapToRoute(
  pos: { lat: number; lng: number },
  nodos: NodoVivo[],
): { lat: number; lng: number } {
  if (nodos.length < 2) return { lat: pos.lat, lng: pos.lng };
  let mejorDist = Infinity;
  let mejorPunto = { lat: pos.lat, lng: pos.lng };
  for (let i = 0; i < nodos.length - 1; i++) {
    const A = nodos[i];
    const B = nodos[i + 1];
    const dx = B.lng - A.lng;
    const dy = B.lat - A.lat;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) continue;
    const t = Math.max(
      0,
      Math.min(1, ((pos.lng - A.lng) * dx + (pos.lat - A.lat) * dy) / len2),
    );
    const proy = { lat: A.lat + t * dy, lng: A.lng + t * dx };
    const d = distMetros(pos.lat, pos.lng, proy.lat, proy.lng);
    if (d < mejorDist) {
      mejorDist = d;
      mejorPunto = proy;
    }
  }
  if (mejorDist < 25) return mejorPunto;
  return { lat: pos.lat, lng: pos.lng };
}

export function MapaVivo({ nodos, posicion, nodoActivoId, activo }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: HEIGHT });
  const lastHeadingRef = useRef<number>(0);
  const displayPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Detect GPS availability
  const gpsDisponible =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  // Resize observer
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => setSize({ w: el.clientWidth, h: HEIGHT });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const activeIdx = useMemo(
    () => (nodoActivoId == null ? -1 : nodos.findIndex((n) => n.id === nodoActivoId)),
    [nodos, nodoActivoId],
  );

  // Loop de animación: interpola displayPos hacia target (posicion)
  useEffect(() => {
    function tick() {
      const target = posicion
        ? { lat: posicion.lat, lng: posicion.lng }
        : nodos[0]
          ? { lat: nodos[0].lat, lng: nodos[0].lng }
          : null;

      if (target) {
        if (!displayPosRef.current) {
          displayPosRef.current = { ...target };
        } else {
          displayPosRef.current.lat +=
            (target.lat - displayPosRef.current.lat) * 0.12;
          displayPosRef.current.lng +=
            (target.lng - displayPosRef.current.lng) * 0.12;
        }
        draw();
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posicion, nodos, activeIdx, size]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0) return;
    const W = size.w;
    const H = size.h;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Fondo
    ctx.fillStyle = "#e8f4e8";
    ctx.fillRect(0, 0, W, H);

    // 2. Cuadrícula
    ctx.strokeStyle = "rgba(140,180,140,0.2)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const center = displayPosRef.current;
    if (!center) return;

    const cosLat = Math.cos((center.lat * Math.PI) / 180);
    const toX = (lng: number) =>
      W / 2 + ((lng - center.lng) * METERS_PER_DEG * cosLat) / METROS_POR_PIXEL;
    const toY = (lat: number) =>
      H / 2 - ((lat - center.lat) * METERS_PER_DEG) / METROS_POR_PIXEL;

    // 3. Burbuja de precisión
    if (posicion) {
      const r = Math.max(8, posicion.accuracy / METROS_POR_PIXEL);
      ctx.fillStyle = "rgba(83,74,183,0.08)";
      ctx.strokeStyle = "rgba(83,74,183,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (nodos.length > 0) {
      const pts = nodos.map((n) => ({
        n,
        x: toX(n.lng),
        y: toY(n.lat),
      }));

      // 4. Ruta completa
      if (pts.length >= 2) {
        ctx.strokeStyle = "#b0bec5";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        pts.forEach((p, i) =>
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
        );
        ctx.stroke();

        // 5. Ruta recorrida
        if (activeIdx > 0) {
          ctx.strokeStyle = "#534AB7";
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let i = 0; i <= activeIdx; i++) {
            const p = pts[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
      }

      // 6. Nodos
      pts.forEach((p, i) => {
        const isAct = i === activeIdx;
        const isVis = activeIdx >= 0 && i < activeIdx;

        if (isAct) {
          ctx.fillStyle = "rgba(83,74,183,0.15)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        if (isVis) {
          ctx.fillStyle = "#1D9E75";
          ctx.strokeStyle = "#0F6E56";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("✓", p.x, p.y + 0.5);
        } else if (isAct) {
          ctx.fillStyle = "#534AB7";
          ctx.strokeStyle = "#3C3489";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "#534AB7";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Etiqueta
        const label = truncar(p.n.nombre);
        ctx.font = "11px sans-serif";
        const tw = ctx.measureText(label).width;
        const ly = p.y + (isAct ? 16 : 13);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(p.x - tw / 2 - 4, ly - 1, tw + 8, 14);
        ctx.fillStyle = "#333";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(label, p.x, ly);
      });
    }

    // 7. Brújula esquina superior derecha
    const cx = W - 28;
    const cy = 28;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const heading = posicion?.heading ?? lastHeadingRef.current ?? 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-heading * Math.PI) / 180);
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(5, 4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", 0, -7);
    ctx.restore();
  }

  // Posicionar y rotar la figura del usuario (siempre centro)
  useEffect(() => {
    const fig = figRef.current;
    if (!fig || size.w === 0) return;
    const px = size.w / 2 - 14;
    const py = size.h / 2 - 22;
    let heading = posicion?.heading;
    if (heading == null || Number.isNaN(heading)) {
      heading = lastHeadingRef.current;
    } else {
      lastHeadingRef.current = heading;
    }
    fig.style.transform = `translate(${px}px, ${py}px) rotate(${heading}deg)`;
  }, [posicion, size]);

  if (!gpsDisponible && activo) {
    return (
      <div
        role="status"
        className="flex w-full items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center text-base text-muted-foreground"
        style={{ minHeight: HEIGHT }}
      >
        GPS no disponible en este dispositivo. Prueba desde tu móvil.
      </div>
    );
  }

  const activeNodo = activeIdx >= 0 ? nodos[activeIdx] : null;
  const aria = activeNodo
    ? `Mapa en vivo centrado en ti. Nodo activo: ${activeNodo.nombre}, ${activeIdx + 1} de ${nodos.length}`
    : `Mapa en vivo centrado en ti con ${nodos.length} nodos de referencia`;

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={aria}
      className="relative w-full overflow-hidden rounded-xl border border-border bg-card"
      style={{ height: HEIGHT }}
    >
      <style>{`
        @keyframes puriy-walk-vivo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes puriy-pulse-vivo {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .puriy-walk-vivo-inner { animation: puriy-walk-vivo 0.45s ease-in-out infinite; transform-origin: center bottom; }
        .puriy-pulse-vivo { transform-origin: 14px 7px; transform-box: fill-box; animation: puriy-pulse-vivo 1.3s ease-out infinite; }
      `}</style>

      <canvas ref={canvasRef} className="block h-full w-full" />

      {nodos.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-base text-muted-foreground">
          Sin nodos de referencia. Crea puntos en el Administrador.
        </div>
      )}

      <div className="pointer-events-none absolute left-0 top-0" aria-hidden="true">
        <div
          ref={figRef}
          style={{
            transform: "translate(0,0)",
            transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
            transformOrigin: "14px 22px",
          }}
        >
          <div className="puriy-walk-vivo-inner">
            <svg width="28" height="44" viewBox="0 0 28 44">
              <ellipse cx="14" cy="40" rx="5" ry="2" fill="rgba(0,0,0,0.1)" />
              <circle cx="14" cy="7" r="5.5" fill="#534AB7" />
              <circle
                className="puriy-pulse-vivo"
                cx="14"
                cy="7"
                r="5.5"
                fill="none"
                stroke="rgba(83,74,183,0.4)"
                strokeWidth="4"
              />
              <path d="M14 13 L14 26" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M14 17 L7 22" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M14 17 L21 22" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M14 26 L9 36" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M14 26 L19 36" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
