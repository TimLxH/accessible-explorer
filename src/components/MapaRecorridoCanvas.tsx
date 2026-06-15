import { useEffect, useMemo, useRef, useState } from "react";

export type NodoMapa = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  accuracy: number;
};

type Props = {
  nodos: NodoMapa[];
  posicionActual: { lat: number; lng: number; accuracy: number } | null;
  nodoActivoId: number | null;
};

const HEIGHT = 280;
const PADDING_RATIO = 0.15;

export function MapaRecorridoCanvas({ nodos, posicionActual, nodoActivoId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const bbox = useMemo(() => {
    if (nodos.length === 0) return null;
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    for (const n of nodos) {
      if (n.lat < minLat) minLat = n.lat;
      if (n.lat > maxLat) maxLat = n.lat;
      if (n.lng < minLng) minLng = n.lng;
      if (n.lng > maxLng) maxLng = n.lng;
    }
    // Avoid zero spans
    if (minLat === maxLat) {
      minLat -= 0.0001;
      maxLat += 0.0001;
    }
    if (minLng === maxLng) {
      minLng -= 0.0001;
      maxLng += 0.0001;
    }
    return { minLat, maxLat, minLng, maxLng };
  }, [nodos]);

  const project = useMemo(() => {
    if (!bbox || width === 0) return null;
    const padX = width * PADDING_RATIO;
    const padY = HEIGHT * PADDING_RATIO;
    const usableW = width - padX * 2;
    const usableH = HEIGHT - padY * 2;
    const lngSpan = bbox.maxLng - bbox.minLng;
    const latSpan = bbox.maxLat - bbox.minLat;
    return (lat: number, lng: number) => {
      const x = padX + ((lng - bbox.minLng) / lngSpan) * usableW;
      // lat invertida: mayor lat = arriba (y menor)
      const y = padY + (1 - (lat - bbox.minLat) / latSpan) * usableH;
      return { x, y };
    };
  }, [bbox, width]);

  const activeIdx = useMemo(
    () => (nodoActivoId == null ? -1 : nodos.findIndex((n) => n.id === nodoActivoId)),
    [nodos, nodoActivoId],
  );

  const activeNodo = activeIdx >= 0 ? nodos[activeIdx] : null;
  const ariaLabel = activeNodo
    ? `Mapa de recorrido: en nodo ${activeNodo.nombre}, ${activeIdx + 1} de ${nodos.length} completados`
    : `Mapa de recorrido: ${nodos.length} nodos sin iniciar`;

  if (nodos.length < 2) {
    return (
      <div
        ref={containerRef}
        role="img"
        aria-label="Mapa de recorrido: sin nodos suficientes"
        className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-center text-base text-muted-foreground"
        style={{ height: HEIGHT }}
      >
        Agrega al menos 2 nodos para ver la ruta
      </div>
    );
  }

  const truncate = (s: string) => (s.length > 12 ? s.slice(0, 11) + "…" : s);

  const points = project ? nodos.map((n) => ({ n, p: project(n.lat, n.lng) })) : [];
  const userPos = project && posicionActual ? project(posicionActual.lat, posicionActual.lng) : null;

  const pathD =
    points.length > 0
      ? "M " + points.map((pt) => `${pt.p.x.toFixed(1)} ${pt.p.y.toFixed(1)}`).join(" L ")
      : "";

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-border bg-card"
      style={{ height: HEIGHT }}
    >
      <style>{`
        @keyframes puriy-pulse {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes puriy-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .puriy-user-dot {
          transition: cx 400ms ease, cy 400ms ease;
          animation: puriy-blink 1.2s ease-in-out infinite;
        }
        .puriy-pulse-ring {
          transform-origin: center;
          transform-box: fill-box;
          animation: puriy-pulse 1.2s ease-out infinite;
        }
      `}</style>
      {project && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={ariaLabel}
          className="block"
        >
          {/* Línea de ruta */}
          <path
            d={pathD}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />

          {/* Nodos */}
          {points.map((pt, i) => {
            const isActive = i === activeIdx;
            const isVisited = activeIdx >= 0 && i < activeIdx;
            const fill = isActive
              ? "hsl(var(--purple))"
              : isVisited
                ? "hsl(var(--teal, 174 60% 45%))"
                : "transparent";
            const stroke = isActive
              ? "hsl(var(--purple))"
              : isVisited
                ? "hsl(var(--teal, 174 60% 45%))"
                : "hsl(var(--muted-foreground))";
            const r = isActive ? 14 : 8;
            return (
              <g key={pt.n.id}>
                {isActive && (
                  <circle
                    cx={pt.p.x}
                    cy={pt.p.y}
                    r={r}
                    fill="hsl(var(--purple))"
                    opacity={0.4}
                    className="puriy-pulse-ring"
                  />
                )}
                <circle
                  cx={pt.p.x}
                  cy={pt.p.y}
                  r={r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2}
                />
                <text
                  x={pt.p.x}
                  y={pt.p.y + r + 12}
                  textAnchor="middle"
                  fontSize={10}
                  fill="hsl(var(--foreground))"
                  style={{ pointerEvents: "none" }}
                >
                  {truncate(pt.n.nombre)}
                </text>
              </g>
            );
          })}

          {/* Posición usuario */}
          {userPos && (
            <circle
              className="puriy-user-dot"
              cx={userPos.x}
              cy={userPos.y}
              r={6}
              fill="#2563eb"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </svg>
      )}
    </div>
  );
}
