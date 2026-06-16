import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  Crosshair,
  Play,
  Square,
  Download,
  Send,
  Trash2,
  Keyboard,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { speak, stopSpeaking } from "@/lib/speech";
import { MapaVivo } from "@/components/MapaVivo";


export const Route = createFileRoute("/orientacion")({
  head: () => ({
    meta: [
      { title: "Orientación accesible — Puriy Ayni" },
      {
        name: "description",
        content:
          "Modo de navegación accesible en tiempo real y administrador para mapear nodos de referencia mediante GPS.",
      },
    ],
  }),
  component: Orientacion,
});

// ----- Tipos y utilidades -----

type Nodo = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  accuracy: number;
};

const STORAGE_KEY = "puriy_orientacion_nodos";

function loadNodos(): Nodo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Nodo[]) : [];
  } catch {
    return [];
  }
}

function saveNodos(nodos: Nodo[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodos));
    window.dispatchEvent(new CustomEvent("puriy:nodos-actualizados"));
  } catch {
    /* ignore */
  }
}

// Distancia Haversine en metros entre dos coordenadas
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Filtro de suavizado tipo EMA (Kalman simplificado)
function useSmoothedGPS() {
  const smoothRef = useRef<{ lat: number; lng: number; heading: number | null } | null>(null);

  function smooth(raw: { lat: number; lng: number; heading: number | null; accuracy: number }) {
    if (!smoothRef.current) {
      smoothRef.current = { lat: raw.lat, lng: raw.lng, heading: raw.heading };
      return smoothRef.current;
    }
    const alpha = raw.accuracy < 10 ? 0.6 : raw.accuracy < 25 ? 0.35 : 0.15;
    smoothRef.current = {
      lat: smoothRef.current.lat * (1 - alpha) + raw.lat * alpha,
      lng: smoothRef.current.lng * (1 - alpha) + raw.lng * alpha,
      heading: raw.heading ?? smoothRef.current.heading,
    };
    return smoothRef.current;
  }

  function reset() {
    smoothRef.current = null;
  }
  return { smooth, reset };
}

// ===========================================================
// Componente principal
// ===========================================================


function Orientacion() {
  return (
    <AppShell title="Orientación accesible" back>
      <section className="mx-auto w-full max-w-3xl px-4 py-6">
        <Tabs defaultValue="navegacion" className="w-full">
          <TabsList
            className="grid h-auto w-full grid-cols-2 gap-2 bg-muted p-2"
            aria-label="Modo de orientación"
          >
            <TabsTrigger
              value="navegacion"
              className="min-h-14 text-base font-semibold data-[state=active]:bg-navy data-[state=active]:text-navy-foreground"
              aria-label="Pestaña 1, Modo Navegación"
            >
              1. Modo Navegación
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="min-h-14 text-base font-semibold data-[state=active]:bg-navy data-[state=active]:text-navy-foreground"
              aria-label="Pestaña 2, Administrador de Mapeo"
            >
              2. Administrador (Mapeo)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="navegacion" className="mt-4 focus:outline-none">
            <NavegacionTab />
          </TabsContent>
          <TabsContent value="admin" className="mt-4 focus:outline-none">
            <AdminTab />
          </TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
}

// ===========================================================
// Pestaña 1: Modo Navegación
// ===========================================================

function NavegacionTab() {
  const [nodos, setNodos] = useState<Nodo[]>(() => loadNodos());
  const [activo, setActivo] = useState(false);
  const [posicion, setPosicion] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    heading: number | null;
  } | null>(null);
  const [mensaje, setMensaje] = useState<string>("Pulsa 'Iniciar Recorrido' para comenzar.");
  const [error, setError] = useState<string | null>(null);
  const [nodoActivoId, setNodoActivoId] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const ultimoNodoRef = useRef<number | null>(null);
  const nodosRef = useRef<Nodo[]>(nodos);
  const { smooth, reset } = useSmoothedGPS();

  useEffect(() => {
    nodosRef.current = nodos;
  }, [nodos]);

  // Sincroniza con cambios desde la pestaña Admin
  useEffect(() => {
    function sync() {
      setNodos(loadNodos());
    }
    window.addEventListener("puriy:nodos-actualizados", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("puriy:nodos-actualizados", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Detener al desmontar
  useEffect(() => {
    return () => detener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function iniciar() {
    setError(null);
    if (nodosRef.current.length === 0) {
      const m =
        "No hay nodos de referencia. Crea o importa nodos en la pestaña Administrador antes de iniciar.";
      setError(m);
      speak(m);
      return;
    }
    if (!("geolocation" in navigator)) {
      const m = "Tu dispositivo no admite geolocalización. Prueba desde un móvil.";
      setError(m);
      speak(m);
      return;
    }

    reset();
    speak("Recorrido iniciado. Caminando entre puntos de referencia.");
    setMensaje("Caminando entre puntos de referencia.");
    setActivo(true);

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const raw = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
          };
          if (raw.accuracy > 80) return;
          const suave = smooth(raw);
          setPosicion({
            lat: suave.lat,
            lng: suave.lng,
            accuracy: raw.accuracy,
            heading: suave.heading,
          });
          evaluarPosicion(suave.lat, suave.lng, raw.accuracy);
        },
        (err) => {
          setError(`GPS (${err.code}): ${err.message}`);
          speak("Error obteniendo la ubicación.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } catch (e) {
      setError(`No se pudo iniciar el GPS: ${(e as Error).message}`);
    }
  }

  function detener() {
    if (watchIdRef.current != null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        /* ignore */
      }
      watchIdRef.current = null;
    }
    setActivo(false);
    ultimoNodoRef.current = null;
    setNodoActivoId(null);
    stopSpeaking();
  }

  function evaluarPosicion(lat: number, lng: number, accuracy = 15) {
    const umbral = Math.min(40, Math.max(12, accuracy * 1.5));
    let nodoCercano: Nodo | null = null;
    let distMin = Infinity;
    for (const n of nodosRef.current) {
      const d = haversineMeters(lat, lng, n.lat, n.lng);
      if (d < distMin) {
        distMin = d;
        nodoCercano = n;
      }
    }
    if (nodoCercano && distMin < umbral) {
      if (ultimoNodoRef.current !== nodoCercano.id) {
        ultimoNodoRef.current = nodoCercano.id;
        setNodoActivoId(nodoCercano.id);
        const texto = `Estás en: ${nodoCercano.nombre}. Distancia: ${Math.round(distMin)} metros.`;
        setMensaje(texto);
        speak(texto);
      }
    } else {
      if (ultimoNodoRef.current !== null) {
        ultimoNodoRef.current = null;
        setNodoActivoId(null);
        const texto = "Caminando. Siguiente punto de referencia cercano.";
        setMensaje(texto);
        speak(texto);
      }
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Modo Navegación</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Rastrea tu posición en tiempo real y te avisa cuando pasas cerca de un punto de
          referencia guardado.
        </p>
      </header>

      <ProgresoBar nodos={nodos} nodoActivoId={nodoActivoId} />

      {/* Región accesible con anuncios */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="rounded-xl border-2 border-navy bg-navy px-5 py-6 text-navy-foreground"
      >
        <p className="text-sm uppercase tracking-wide opacity-80">Anuncio actual</p>
        <p className="mt-1 text-2xl font-bold leading-tight">{mensaje}</p>
      </div>

      <MapaVivo
        nodos={nodos}
        posicion={posicion}
        nodoActivoId={nodoActivoId}
        activo={activo}
      />

      <GpsBadge posicion={posicion} activo={activo} />

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-base text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {!activo ? (
          <Button
            onClick={iniciar}
            aria-label="Iniciar recorrido con seguimiento GPS"
            className="h-20 w-full bg-purple text-xl font-bold text-purple-foreground hover:bg-purple/90"
          >
            <Play className="mr-3 h-7 w-7" aria-hidden="true" />
            Iniciar Recorrido
          </Button>
        ) : (
          <Button
            onClick={detener}
            aria-label="Detener recorrido y dejar de rastrear ubicación"
            className="h-20 w-full bg-destructive text-xl font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            <Square className="mr-3 h-7 w-7" aria-hidden="true" />
            Detener Recorrido
          </Button>
        )}
      </div>
    </div>
  );
}


// ===========================================================
// Pestaña 2: Administrador (Mapeo)
// ===========================================================

function AdminTab() {
  const [nodos, setNodos] = useState<Nodo[]>(() => loadNodos());
  const [nombre, setNombre] = useState("");
  const [capturando, setCapturando] = useState(false);
  const [preview, setPreview] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [errorGPS, setErrorGPS] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      setNodos(loadNodos());
    }
    window.addEventListener("puriy:nodos-actualizados", sync);
    return () => window.removeEventListener("puriy:nodos-actualizados", sync);
  }, []);

  function capturaGPS() {
    if (!nombre.trim()) {
      setErrorGPS("Escribe un nombre antes de capturar");
      return;
    }
    setCapturando(true);
    setPreview(null);
    setErrorGPS(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPreview({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setCapturando(false);
      },
      (err) => {
        setErrorGPS("No se pudo obtener el GPS. Verifica permisos.");
        setCapturando(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function guardarNodo() {
    if (!preview || !nombre.trim()) return;
    const nuevo: Nodo = {
      id: Date.now(),
      nombre: nombre.trim(),
      lat: preview.lat,
      lng: preview.lng,
      accuracy: preview.accuracy,
    };
    const actualizados = [...nodos, nuevo];
    setNodos(actualizados);
    saveNodos(actualizados);
    setNombre("");
    setPreview(null);
  }

  function eliminarNodo(id: number) {
    const actualizados = nodos.filter((n) => n.id !== id);
    setNodos(actualizados);
    saveNodos(actualizados);
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Administrador (Mapeo)</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Captura puntos de referencia con GPS de alta precisión.
        </p>
      </header>

      <div className="space-y-3">
        <label htmlFor="nombre-nodo" className="text-sm font-medium">
          Nombre del punto de referencia
        </label>
        <input
          id="nombre-nodo"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Entrada principal, Cafetería, Baño..."
          className="w-full rounded-lg border px-3 py-2 text-sm"
          aria-describedby="nombre-hint"
        />
        <p id="nombre-hint" className="text-xs text-gray-500">
          Escribe el nombre y luego captura tu ubicación actual.
        </p>

        <button
          onClick={capturaGPS}
          disabled={capturando || !nombre.trim()}
          className="w-full py-3 rounded-lg font-semibold text-white"
          style={{ background: capturando ? "#999" : "#534AB7" }}
          aria-live="polite"
          aria-label={capturando ? "Obteniendo GPS..." : "Capturar ubicación actual con GPS"}
        >
          {capturando ? "⏳ Obteniendo GPS..." : "📍 Capturar mi ubicación actual"}
        </button>

        {errorGPS && (
          <p role="alert" className="text-sm text-red-600 text-center">
            {errorGPS}
          </p>
        )}

        {preview && (
          <div
            className="rounded-lg border p-3 space-y-1"
            style={{ background: "#f0fdf4", borderColor: "#1D9E75" }}
            role="status"
            aria-label={`Ubicación capturada para ${nombre}: latitud ${preview.lat.toFixed(6)}, longitud ${preview.lng.toFixed(6)}, precisión ${Math.round(preview.accuracy)} metros`}
          >
            <p className="text-sm font-semibold" style={{ color: "#1D9E75" }}>
              ✅ Ubicación capturada
            </p>
            <p className="text-xs text-gray-600">📌 {nombre}</p>
            <p className="text-xs text-gray-500">
              Lat: {preview.lat.toFixed(6)} · Lng: {preview.lng.toFixed(6)}
            </p>
            <p
              className="text-xs"
              style={{
                color:
                  preview.accuracy < 10
                    ? "#1D9E75"
                    : preview.accuracy < 30
                    ? "#d97706"
                    : "#dc2626",
              }}
            >
              {preview.accuracy < 10 ? "🟢" : preview.accuracy < 30 ? "🟡" : "🔴"}
              Precisión: ±{Math.round(preview.accuracy)}m
              {preview.accuracy > 30 ? " · Espera mejor señal" : ""}
            </p>
            <button
              onClick={guardarNodo}
              className="w-full mt-2 py-2 rounded-lg font-semibold text-white text-sm"
              style={{ background: "#1D9E75" }}
              aria-label={`Guardar nodo ${nombre}`}
            >
              ✅ Guardar nodo
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Nodos guardados ({nodos.length})</h3>
        {nodos.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aún no hay nodos. Captura tu primer punto de referencia.
          </p>
        )}
        <ul className="space-y-2" aria-label="Lista de nodos guardados">
          {nodos.map((n, i) => (
            <li
              key={n.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
              aria-label={`Nodo ${i + 1}: ${n.nombre}`}
            >
              <div>
                <p className="text-sm font-medium">
                  {i + 1}. {n.nombre}
                </p>
                <p className="text-xs text-gray-400">
                  {n.lat.toFixed(5)}, {n.lng.toFixed(5)} · ±{Math.round(n.accuracy)}m
                </p>
              </div>
              <button
                onClick={() => eliminarNodo(n.id)}
                className="text-red-400 hover:text-red-600 text-lg px-2"
                aria-label={`Eliminar nodo ${n.nombre}`}
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
        {nodos.length >= 2 && (
          <p className="text-xs text-center mt-3" style={{ color: "#1D9E75" }}>
            ✅ {nodos.length} nodos listos · Ve a Navegación e inicia el recorrido
          </p>
        )}
      </div>
    </div>
  );
}

// ===========================================================
// ===========================================================
// Progreso y badge de GPS
// ===========================================================

function ProgresoBar({
  nodos,
  nodoActivoId,
}: {
  nodos: Nodo[];
  nodoActivoId: number | null;
}) {
  const activeIdx = nodoActivoId == null ? -1 : nodos.findIndex((n) => n.id === nodoActivoId);
  const total = nodos.length;
  const activeNodo = activeIdx >= 0 ? nodos[activeIdx] : null;

  const distTotal = useMemo(() => {
    if (total < 2) return 0;
    let sum = 0;
    for (let i = 0; i < total - 1; i++) {
      sum += haversineMeters(nodos[i].lat, nodos[i].lng, nodos[i + 1].lat, nodos[i + 1].lng);
    }
    return sum;
  }, [nodos, total]);

  const minutosRestantes = Math.max(0, Math.round(distTotal / 0.8 / 60));
  const progreso = total > 1 && activeIdx >= 0 ? activeIdx / (total - 1) : 0;

  if (total === 0) return null;

  return (
    <section aria-label="Progreso del recorrido" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-base font-bold text-foreground">
          {activeNodo
            ? `Nodo ${activeIdx + 1} de ${total} — ${activeNodo.nombre}`
            : `Recorrido: ${total} nodos`}
        </p>
        <p className="text-sm text-muted-foreground">
          ~{minutosRestantes} min · {Math.round(distTotal)} m totales
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progreso * 100)}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-purple transition-all duration-500"
          style={{ width: `${progreso * 100}%` }}
        />
      </div>
    </section>
  );
}

function GpsBadge({
  posicion,
  activo,
}: {
  posicion: { lat: number; lng: number; accuracy: number; heading: number | null } | null;
  activo: boolean;
}) {
  if (!activo) return null;
  const acc = posicion?.accuracy;
  let color = "bg-red-500";
  let label = "Buscando señal GPS…";
  let pulse = false;
  if (acc != null) {
    if (acc < 10) {
      color = "bg-green-500";
      label = `±${acc.toFixed(1)}m · Alta precisión`;
      pulse = true;
    } else if (acc <= 30) {
      color = "bg-yellow-500";
      label = `±${acc.toFixed(1)}m · Precisión media`;
    } else {
      color = "bg-red-500";
      label = `±${acc.toFixed(1)}m · GPS débil`;
    }
  }
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}



