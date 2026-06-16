import { useEffect, useMemo, useRef, useState } from "react";

export type NodoLive = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  accuracy: number;
};

type Props = {
  nodos: NodoLive[];
  posicion: { lat: number; lng: number; accuracy: number } | null;
  nodoActivoId: number | null;
  modoSimulacion: boolean;
  stepFraction?: number;
};

const HEIGHT = 280;
const PAD = 0.18;

function truncar(s: string, n = 15) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function MapaRecorridoLive({
  nodos,
  posicion,
  nodoActivoId,
  modoSimulacion: _modoSimulacion,
  stepFraction: _stepFraction,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: HEIGHT });
  const firstFigPosRef = useRef(true);

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

  const bbox = useMemo(() => {
    if (nodos.length === 0) return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const n of nodos) {
      if (n.lat < minLat) minLat = n.lat;
      if (n.lat > maxLat) maxLat = n.lat;
      if (n.lng < minLng) minLng = n.lng;
      if (n.lng > maxLng) maxLng = n.lng;
    }
    if (minLat === maxLat) { minLat -= 0.0001; maxLat += 0.0001; }
    if (minLng === maxLng) { minLng -= 0.0001; maxLng += 0.0001; }
    return { minLat, maxLat, minLng, maxLng };
  }, [nodos]);

  const project = useMemo(() => {
    if (!bbox || size.w === 0) return null;
    const W = size.w, H = size.h;
    const latSpan = bbox.maxLat - bbox.minLat;
    const lngSpan = bbox.maxLng - bbox.minLng;
    const toX = (lng: number) => PAD * W + ((lng - bbox.minLng) / lngSpan) * (1 - 2 * PAD) * W;
    const toY = (lat: number) => H - (PAD * H + ((lat - bbox.minLat) / latSpan) * (1 - 2 * PAD) * H);
    return { toX, toY };
  }, [bbox, size]);

  const activeIdx = useMemo(
    () => (nodoActivoId == null ? -1 : nodos.findIndex((n) => n.id === nodoActivoId)),
    [nodos, nodoActivoId],
  );

  // Dibujar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = size.w + "px";
    canvas.style.height = size.h + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = size.w, H = size.h;

    // a) Fondo
    ctx.fillStyle = "#e8f4e8";
    ctx.fillRect(0, 0, W, H);

    // b) Cuadrícula
    ctx.strokeStyle = "rgba(140,180,140,0.2)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (!project || nodos.length === 0) return;

    const pts = nodos.map((n) => ({ n, x: project.toX(n.lng), y: project.toY(n.lat) }));

    if (pts.length >= 2) {
      // c) Sombra ruta
      ctx.save();
      ctx.shadowColor = "rgba(80,100,80,0.15)";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#b0bec5";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();

      // e) Ruta recorrida
      if (activeIdx > 0) {
        ctx.strokeStyle = "#534AB7";
        ctx.lineWidth = 4.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i <= activeIdx; i++) {
          const p = pts[i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
    }

    // f) Halo activo
    if (activeIdx >= 0) {
      const p = pts[activeIdx];
      ctx.fillStyle = "rgba(83,74,183,0.13)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fill();
    }

    // g) Nodos
    pts.forEach((p, i) => {
      const isAct = i === activeIdx;
      const isVis = activeIdx >= 0 && i < activeIdx;
      if (isVis) {
        ctx.fillStyle = "#1D9E75";
        ctx.strokeStyle = "#0F6E56";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✓", p.x, p.y + 0.5);
      } else if (isAct) {
        ctx.fillStyle = "#534AB7";
        ctx.strokeStyle = "#3C3489";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#534AB7";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
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
  }, [nodos, size, project, activeIdx]);

  // Posicionar figura
  useEffect(() => {
    const fig = figRef.current;
    if (!fig || !project || nodos.length === 0) return;

    let lat: number | null = null, lng: number | null = null;
    if (posicion) {
      lat = posicion.lat; lng = posicion.lng;
    } else if (nodos.length > 0) {
      lat = nodos[0].lat; lng = nodos[0].lng;
    }
    if (lat == null || lng == null) return;

    const px = project.toX(lng) - 14;
    const py = project.toY(lat) - 44;

    if (firstFigPosRef.current) {
      fig.style.transition = "none";
      fig.style.transform = `translate(${px}px, ${py}px)`;
      // Forzar reflow y reactivar transición
      void fig.offsetWidth;
      fig.style.transition = "transform 0.55s cubic-bezier(0.4,0,0.2,1)";
      firstFigPosRef.current = false;
    } else {
      fig.style.transform = `translate(${px}px, ${py}px)`;
    }
  }, [posicion, project, nodos]);

  const activeNodo = activeIdx >= 0 ? nodos[activeIdx] : null;
  const aria = activeNodo
    ? `Mapa en vivo: nodo ${activeNodo.nombre}, ${activeIdx + 1} de ${nodos.length}`
    : `Mapa en vivo con ${nodos.length} nodos`;

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={aria}
      className="relative w-full overflow-hidden rounded-xl border border-border bg-card"
      style={{ height: HEIGHT }}
    >
      <style>{`
        @keyframes puriy-walk {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes puriy-pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .puriy-walk-inner { animation: puriy-walk 0.45s ease-in-out infinite; transform-origin: center bottom; }
        .puriy-pulse-head { transform-origin: 14px 7px; transform-box: fill-box; animation: puriy-pulse-ring 1.3s ease-out infinite; }
      `}</style>

      <canvas ref={canvasRef} className="block h-full w-full" />

      {nodos.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-base text-muted-foreground">
          Sin nodos de referencia. Crea puntos en el Administrador.
        </div>
      )}
      {nodos.length === 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 px-6 text-center text-sm text-muted-foreground">
          Agrega más nodos para ver la ruta
        </div>
      )}

      {nodos.length > 0 && (
        <div
          className="pointer-events-none absolute left-0 top-0"
          aria-hidden="true"
        >
          <div ref={figRef} style={{ transform: "translate(0,0)" }}>
            <div className="puriy-walk-inner">
              <svg width="28" height="44" viewBox="0 0 28 44">
                <ellipse cx="14" cy="40" rx="5" ry="2" fill="rgba(0,0,0,0.1)" />
                <circle cx="14" cy="7" r="5.5" fill="#534AB7" />
                <circle
                  className="puriy-pulse-head"
                  cx="14" cy="7" r="5.5"
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
      )}
    </div>
  );
}
