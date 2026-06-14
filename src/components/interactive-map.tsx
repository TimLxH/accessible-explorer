import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Volume2, X, Accessibility, MapPin } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/speech";
import parqueFondo from "@/assets/parque-fondo.png.asset.json";

/**
 * Mapa interactivo del Parque de la Identidad Wanka.
 * - El SVG vectorial sirve como mapa completo (caminos + pines).
 * - La ubicación real del usuario (GPS) se proyecta sobre las coordenadas
 *   internas del SVG usando 2 puntos de anclaje conocidos.
 * - Incluye un panel "Simular recorrido" para probar el movimiento en
 *   escritorio sin GPS.
 */

// ──────────────── Calibración ────────────────
// Anclas reales proporcionadas por el operador del recorrido:
//   Entrada principal (Jr. San Antonio)  →  SVG id="Entrada_principal"
//   Monumento / Estatua central          →  SVG id="Estatua-3"
const ANCHOR_A = {
  svg: { x: 1896.04, y: 3666.35 },
  gps: { lat: -12.0569, lng: -75.1976 },
};
const ANCHOR_B = {
  svg: { x: 3456.46, y: 2149.08 },
  gps: { lat: -12.0564, lng: -75.1972 },
};

// Transformación lineal 2 puntos (escala + traslación por eje, sin rotación).
const KX = (ANCHOR_B.svg.x - ANCHOR_A.svg.x) / (ANCHOR_B.gps.lng - ANCHOR_A.gps.lng);
const KY = (ANCHOR_B.svg.y - ANCHOR_A.svg.y) / (ANCHOR_B.gps.lat - ANCHOR_A.gps.lat);

function gpsToSvg(lat: number, lng: number) {
  return {
    x: ANCHOR_A.svg.x + KX * (lng - ANCHOR_A.gps.lng),
    y: ANCHOR_A.svg.y + KY * (lat - ANCHOR_A.gps.lat),
  };
}

// ──────────────── Pines del mapa ────────────────
type Pin = {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  fill: string;
  name: string;
  description: string;
  accessibility: string;
};

const PINS: Pin[] = [
  {
    id: "Entrada_principal",
    cx: 1896.04, cy: 3666.35, rx: 37.28, ry: 32.58, fill: "#00A755",
    name: "Entrada principal",
    description:
      "Acceso por el Jr. San Antonio. Es el punto de inicio recomendado del recorrido por el Parque de la Identidad Wanka.",
    accessibility:
      "Ingreso a nivel del suelo, sin escalones. Personal de orientación disponible en horario de visitas.",
  },
  {
    id: "Entrada_lado_izquierdo",
    cx: 2305.05, cy: 3782.03, rx: 37.62, fill: "#00A755",
    name: "Entrada lado izquierdo",
    description: "Acceso lateral izquierdo del parque.",
    accessibility: "Camino empedrado, transitable con apoyo.",
  },
  {
    id: "Entrada_medio",
    cx: 2235.42, cy: 3892.30, rx: 34.82, fill: "url(#gradEntrada)",
    name: "Entrada central",
    description: "Acceso central del recorrido principal.",
    accessibility: "Superficie irregular, se recomienda acompañante.",
  },
  {
    id: "Entrada_lado_derecho",
    cx: 2143.27, cy: 4007.23, rx: 35.65, fill: "#00A755",
    name: "Entrada lado derecho",
    description: "Acceso lateral derecho del parque.",
    accessibility: "Camino con desnivel suave.",
  },
  {
    id: "Bano",
    cx: 2539.93, cy: 3545.49, rx: 92.1, fill: "#A74C88",
    name: "Servicios higiénicos",
    description: "Baños públicos del parque.",
    accessibility: "Cabina accesible disponible para silla de ruedas.",
  },
  {
    id: "Tienda",
    cx: 2077.20, cy: 4181.13, rx: 72.89, fill: "#FFF200",
    name: "Tienda de artesanías",
    description: "Venta de artesanías wankas: cerámica, tejidos y mates tallados.",
    accessibility: "Ingreso a nivel, pasillos amplios.",
  },
  {
    id: "ceramica_principal",
    cx: 2860.73, cy: 4151.96, rx: 156.2, fill: "#826E67",
    name: "Cerámica principal",
    description:
      "Gran cerámica monumental que representa la identidad del pueblo Wanka.",
    accessibility: "Plataforma al ras, observable desde varios ángulos.",
  },
  {
    id: "ceramica_1",
    cx: 3047.18, cy: 2621.92, rx: 67.33, fill: "#8480AA",
    name: "Cerámica decorativa",
    description: "Pieza decorativa de cerámica tradicional wanka.",
    accessibility: "Visible desde el sendero principal.",
  },
  {
    id: "Estatua_1",
    cx: 4307.61, cy: 116.86, rx: 123.95, ry: 110.18, fill: "#826E67",
    name: "Estatua norte",
    description: "Estatua conmemorativa en el extremo norte del parque.",
    accessibility: "Sendero con pendiente moderada hasta la base.",
  },
  {
    id: "Estatua_2",
    cx: 4151.85, cy: 1135.53, rx: 125.67, fill: "#826E67",
    name: "Estatua intermedia",
    description: "Segunda estatua del eje norte del parque.",
    accessibility: "Acceso por camino empedrado.",
  },
  {
    id: "Estatua_3",
    cx: 3456.46, cy: 2149.08, rx: 137.44, ry: 105.39, fill: "#826E67",
    name: "Monumento central",
    description:
      "Gran estructura de piedra ubicada en el corazón del Parque de la Identidad Wanka.",
    accessibility: "Plataforma elevada con escalones; barandilla en un lado.",
  },
  {
    id: "Castillo",
    cx: 630.15, cy: 6390.69, rx: 101.06, ry: 72.29, fill: "transparent",
    name: "Castillo",
    description: "Réplica de castillo en el sector sur del parque.",
    accessibility: "Interior con escaleras; vista accesible desde el exterior.",
  },
  {
    id: "Pileta_2",
    cx: 107.22, cy: 6729.41, rx: 100.54, ry: 100.79, fill: "#826E67",
    name: "Pileta",
    description: "Pileta ornamental del sector sur.",
    accessibility: "Borde sin barandilla, mantener distancia segura.",
  },
  {
    id: "Estatua_4",
    cx: 984.6, cy: 6732.94, rx: 127.2, ry: 130.49, fill: "#826E67",
    name: "Estatua sur",
    description: "Estatua del extremo sur del parque.",
    accessibility: "Acceso por sendero plano.",
  },
];

// Caminos morados extraídos del SVG original (color #A74C88).
// Reproducidos como path data sintético basado en los círculos del CorelDraw.
// Para fidelidad total el SVG original también se referencia como recurso.

const VIEWBOX = "0 0 4438.24 6870.11";

export default function InteractiveMap() {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activePin, setActivePin] = useState<Pin | null>(null);
  const [simulating, setSimulating] = useState(false);
  const simTimerRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // ── Geolocalización real ──
  useEffect(() => {
    if (simulating) return; // el simulador toma el control
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocalización no disponible en este dispositivo.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setGeoError(null);
        setUserCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [simulating]);

  // ── Simulador de recorrido ──
  const startSimulation = useCallback(() => {
    if (simTimerRef.current) window.clearInterval(simTimerRef.current);
    setSimulating(true);
    const start = ANCHOR_A.gps; // Entrada
    const end = ANCHOR_B.gps;   // Monumento central
    const durationMs = 18000;
    const stepMs = 80;
    const steps = durationMs / stepMs;
    let i = 0;
    setUserCoords(start);
    simTimerRef.current = window.setInterval(() => {
      i += 1;
      const t = Math.min(1, i / steps);
      // Easing suave
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setUserCoords({
        lat: start.lat + (end.lat - start.lat) * e,
        lng: start.lng + (end.lng - start.lng) * e,
      });
      if (t >= 1) {
        window.clearInterval(simTimerRef.current!);
        simTimerRef.current = null;
        setSimulating(false);
      }
    }, stepMs) as unknown as number;
  }, []);

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      window.clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setSimulating(false);
  }, []);

  useEffect(() => () => {
    if (simTimerRef.current) window.clearInterval(simTimerRef.current);
    stopSpeaking();
  }, []);

  const userSvg = useMemo(
    () => (userCoords ? gpsToSvg(userCoords.lat, userCoords.lng) : null),
    [userCoords],
  );

  function handlePinKey(e: React.KeyboardEvent, pin: Pin) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActivePin(pin);
    }
  }

  return (
    <div className="relative w-full">
      {/* Mapa */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border-2 border-purple/30 bg-white shadow-lg"
        role="region"
        aria-label="Mapa interactivo del Parque de la Identidad Wanka"
      >
        <svg
          ref={svgRef}
          viewBox={VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto w-full select-none"
          role="img"
          aria-label="Mapa vectorial del parque con caminos y puntos de interés"
        >
          <defs>
            <linearGradient id="gradEntrada" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#00A755" />
              <stop offset="1" stopColor="white" />
            </linearGradient>
            <filter id="userGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Caminos del parque (referencia artística importada del SVG) */}
          <image
            href={parqueFondo.url}
            x="0" y="0" width="4438.24" height="6870.11"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: "none" }}
          />

          {/* Capa transparente interactiva con los pines */}
          <g>
            {PINS.map((pin) => (
              <g
                key={pin.id}
                role="button"
                tabIndex={0}
                aria-label={`Punto ${pin.name}. Toca para ver detalles y escuchar audio.`}
                onClick={() => setActivePin(pin)}
                onKeyDown={(e) => handlePinKey(e, pin)}
                className="cursor-pointer outline-none focus:[&>circle:last-of-type]:stroke-navy"
              >
                {/* halo táctil grande para accesibilidad */}
                <ellipse
                  cx={pin.cx}
                  cy={pin.cy}
                  rx={(pin.rx + 60)}
                  ry={(pin.ry ?? pin.rx) + 60}
                  fill="transparent"
                />
                <ellipse
                  cx={pin.cx}
                  cy={pin.cy}
                  rx={pin.rx}
                  ry={pin.ry ?? pin.rx}
                  fill={pin.fill}
                  stroke="#2D2A2B"
                  strokeWidth={13.36}
                />
              </g>
            ))}
          </g>

          {/* Punto del usuario */}
          {userSvg && (
            <g aria-hidden="true">
              <circle
                cx={userSvg.x}
                cy={userSvg.y}
                r={120}
                fill="#3B82F6"
                opacity={0.25}
              >
                <animate
                  attributeName="r"
                  values="80;180;80"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.35;0.05;0.35"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={userSvg.x}
                cy={userSvg.y}
                r={55}
                fill="#3B82F6"
                stroke="white"
                strokeWidth={14}
                filter="url(#userGlow)"
              />
            </g>
          )}
        </svg>

        {/* Indicador de estado GPS */}
        <div
          className="pointer-events-none absolute left-3 top-3 rounded-full bg-navy/90 px-3 py-1 text-xs font-medium text-navy-foreground shadow"
          aria-live="polite"
        >
          {simulating
            ? "Simulando recorrido…"
            : userCoords
              ? "Ubicación en tiempo real"
              : geoError
                ? "Sin GPS"
                : "Buscando GPS…"}
        </div>
      </div>

      {/* Panel de desarrollo: Simulador */}
      <div
        className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-purple/40 bg-purple/5 p-3"
        role="group"
        aria-label="Panel de desarrollo del mapa"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-purple">
          Modo desarrollo
        </span>
        {!simulating ? (
          <button
            type="button"
            onClick={startSimulation}
            aria-label="Simular recorrido desde la entrada principal hasta el monumento central para probar el mapa"
            className="inline-flex items-center gap-2 rounded-lg bg-purple px-4 py-2 text-sm font-semibold text-purple-foreground shadow hover:bg-purple/90"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Simular recorrido
          </button>
        ) : (
          <button
            type="button"
            onClick={stopSimulation}
            aria-label="Detener la simulación del recorrido"
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow hover:opacity-90"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            Detener simulación
          </button>
        )}
        {userCoords && (
          <span className="ml-auto text-xs text-muted-foreground">
            lat {userCoords.lat.toFixed(5)} · lng {userCoords.lng.toFixed(5)}
          </span>
        )}
      </div>

      {/* Bottom sheet con detalles del pin */}
      {activePin && (
        <PinSheet pin={activePin} onClose={() => setActivePin(null)} />
      )}
    </div>
  );
}

function PinSheet({ pin, onClose }: { pin: Pin; onClose: () => void }) {
  useEffect(() => () => stopSpeaking(), []);
  const audioText = `${pin.name}. ${pin.description} Accesibilidad: ${pin.accessibility}`;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar tarjeta de información del punto"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Información de ${pin.name}`}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t-4 border-purple bg-card text-card-foreground shadow-2xl"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pt-3">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-purple text-purple-foreground">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-bold leading-tight">{pin.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar información del punto"
            className="rounded-full p-2 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-6 pt-4">
          <p className="text-base leading-relaxed">{pin.description}</p>

          <div className="rounded-xl bg-muted/50 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <Accessibility className="h-4 w-4" aria-hidden="true" />
              Accesibilidad
            </div>
            <p className="text-sm text-muted-foreground">{pin.accessibility}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => speak(audioText)}
              aria-label={`Escuchar audio descriptivo de ${pin.name}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy py-4 text-base font-semibold text-navy-foreground shadow hover:bg-navy/90"
            >
              <Volume2 className="h-5 w-5" aria-hidden="true" />
              Escuchar audio
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              aria-label="Cerrar la tarjeta y volver al mapa"
              className="rounded-xl border-2 border-purple px-4 py-4 text-sm font-semibold text-purple hover:bg-purple/5"
            >
              Cerrar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
