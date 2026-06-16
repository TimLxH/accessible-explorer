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
  const [simular, setSimular] = useState(false);
  const [posicion, setPosicion] = useState<{ lat: number; lng: number; accuracy: number } | null>(
    null,
  );
  const [mensaje, setMensaje] = useState<string>("Pulsa 'Iniciar Recorrido' para comenzar.");
  const [error, setError] = useState<string | null>(null);
  const [nodoActivoId, setNodoActivoId] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const ultimoNodoRef = useRef<number | null>(null);
  const nodosRef = useRef<Nodo[]>(nodos);

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

    if (simular) {
      const primero = nodosRef.current[0];
      setPosicion({ lat: primero.lat, lng: primero.lng, accuracy: 1 });
      evaluarPosicion(primero.lat, primero.lng);
      setActivo(true);
      const m =
        "Modo simulación activo. Usa el botón 'Simular siguiente nodo' para avanzar por la ruta.";
      setMensaje(m);
      speak(m);
      return;
    }

    if (!("geolocation" in navigator)) {
      const m = "Tu dispositivo no admite geolocalización. Activa el modo simulación para probar.";
      setError(m);
      speak(m);
      return;
    }
    speak("Recorrido iniciado. Caminando entre puntos de referencia.");
    setMensaje("Caminando entre puntos de referencia.");
    setActivo(true);
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setPosicion({ lat: latitude, lng: longitude, accuracy });
          evaluarPosicion(latitude, longitude);
        },
        (err) => {
          setError(
            `Error de GPS (${err.code}): ${err.message}. Puedes activar 'Modo simulación' para probar.`,
          );
          speak("Error obteniendo la ubicación.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
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

  function evaluarPosicion(lat: number, lng: number) {
    let nodoCercano: Nodo | null = null;
    let distMin = Infinity;
    for (const n of nodosRef.current) {
      const d = haversineMeters(lat, lng, n.lat, n.lng);
      if (d < distMin) {
        distMin = d;
        nodoCercano = n;
      }
    }
    if (nodoCercano && distMin < 4) {
      if (ultimoNodoRef.current !== nodoCercano.id) {
        ultimoNodoRef.current = nodoCercano.id;
        setNodoActivoId(nodoCercano.id);
        const texto = `Estás pasando por: ${nodoCercano.nombre}`;
        setMensaje(texto);
        speak(texto);
      }
    } else {
      if (ultimoNodoRef.current !== null) {
        ultimoNodoRef.current = null;
        setNodoActivoId(null);
        const texto = "Caminando entre puntos de referencia.";
        setMensaje(texto);
        speak(texto);
      }
    }
  }

  function simularSiguienteNodo() {
    if (nodosRef.current.length === 0) return;
    const actual = ultimoNodoRef.current;
    const idx = actual == null ? 0 : nodosRef.current.findIndex((n) => n.id === actual);
    const desde = nodosRef.current[idx >= 0 ? idx : 0];
    const siguiente = nodosRef.current[(idx + 1) % nodosRef.current.length];
    // Paso intermedio para que la figura no teleporte
    const midLat = (desde.lat + siguiente.lat) / 2;
    const midLng = (desde.lng + siguiente.lng) / 2;
    setPosicion({ lat: midLat, lng: midLng, accuracy: 1 });
    window.setTimeout(() => {
      setPosicion({ lat: siguiente.lat, lng: siguiente.lng, accuracy: 1 });
      ultimoNodoRef.current = null;
      evaluarPosicion(siguiente.lat, siguiente.lng);
    }, 400);
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

      <ProgresoYMapa
        nodos={nodos}
        posicionActual={posicion}
        nodoActivoId={nodoActivoId}
        modoSimulacion={simular}
      />

      <GpsBadge posicion={posicion} activo={activo} simular={simular} />




      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-base text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <Label htmlFor="modo-simulacion" className="flex flex-col">
          <span className="text-base font-semibold">Modo simulación</span>
          <span className="text-sm text-muted-foreground">
            Útil cuando el GPS no está disponible (por ejemplo, en este preview).
          </span>
        </Label>
        <Switch
          id="modo-simulacion"
          checked={simular}
          onCheckedChange={(v) => {
            if (!activo) setSimular(v);
          }}
          disabled={activo}
          aria-label="Activar modo simulación de recorrido"
        />
      </div>

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
          <>
            <Button
              onClick={detener}
              aria-label="Detener recorrido y dejar de rastrear ubicación"
              className="h-20 w-full bg-destructive text-xl font-bold text-destructive-foreground hover:bg-destructive/90"
            >
              <Square className="mr-3 h-7 w-7" aria-hidden="true" />
              Detener Recorrido
            </Button>
            {simular && (
              <Button
                onClick={simularSiguienteNodo}
                aria-label="Simular avance hacia el siguiente nodo"
                variant="outline"
                className="h-16 w-full text-base font-semibold"
              >
                <MousePointer2 className="mr-2 h-5 w-5" aria-hidden="true" />
                Simular siguiente nodo
              </Button>
            )}
          </>
        )}
      </div>

      <section aria-labelledby="estado-gps" className="rounded-lg border border-border p-4">
        <h3 id="estado-gps" className="text-lg font-semibold">
          Posición actual
        </h3>
        {posicion ? (
          <dl className="mt-2 grid grid-cols-1 gap-1 text-base sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Latitud</dt>
              <dd className="font-mono">{posicion.lat.toFixed(6)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Longitud</dt>
              <dd className="font-mono">{posicion.lng.toFixed(6)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Precisión</dt>
              <dd className="font-mono">±{posicion.accuracy.toFixed(1)} m</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-base text-muted-foreground">Sin lectura todavía.</p>
        )}
      </section>

    </div>
  );
}

// ===========================================================
// Pestaña 2: Administrador (Mapeo)
// ===========================================================

function AdminTab() {
  const [nombre, setNombre] = useState("");
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [nodos, setNodos] = useState<Nodo[]>(() => loadNodos());
  const [capturando, setCapturando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      setNodos(loadNodos());
    }
    window.addEventListener("puriy:nodos-actualizados", sync);
    return () => window.removeEventListener("puriy:nodos-actualizados", sync);
  }, []);

  function agregarNodo(n: Nodo, mensajeOk: string) {
    const next = [...nodos, n];
    setNodos(next);
    saveNodos(next); // exporta automáticamente al estado global
    setNombre("");
    setLatStr("");
    setLngStr("");
    setMensaje(mensajeOk);
    setError(null);
  }

  function capturarGPS() {
    setError(null);
    setMensaje(null);
    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      setError("Escribe primero el nombre del nodo de referencia.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setError(
        "Tu dispositivo no admite geolocalización. Usa la entrada manual de coordenadas.",
      );
      return;
    }
    setCapturando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        agregarNodo(
          {
            id: Date.now(),
            nombre: nombreTrim,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          `Nodo "${nombreTrim}" capturado con precisión de ±${pos.coords.accuracy.toFixed(1)} m.`,
        );
        setCapturando(false);
      },
      (err) => {
        setError(
          `No se pudo capturar el GPS (${err.code}): ${err.message}. Usa la entrada manual.`,
        );
        setCapturando(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function agregarManual() {
    setError(null);
    setMensaje(null);
    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      setError("Escribe primero el nombre del nodo de referencia.");
      return;
    }
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError("Latitud inválida. Debe estar entre -90 y 90.");
      return;
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      setError("Longitud inválida. Debe estar entre -180 y 180.");
      return;
    }
    agregarNodo(
      { id: Date.now(), nombre: nombreTrim, lat, lng, accuracy: 0 },
      `Nodo "${nombreTrim}" añadido manualmente.`,
    );
  }

  function eliminar(id: number) {
    const next = nodos.filter((n) => n.id !== id);
    setNodos(next);
    saveNodos(next);
  }

  function exportarANavegacion() {
    saveNodos(nodos);
    setMensaje(`Se exportaron ${nodos.length} nodos al Modo Navegación.`);
  }

  function descargarJSON() {
    const blob = new Blob([JSON.stringify(nodos, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nodos-orientacion-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const sinNodos = nodos.length === 0;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Administrador (Mapeo)</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Captura puntos de referencia con GPS de alta precisión o ingrésalos manualmente para
          construir el mapa de orientación.
        </p>
      </header>

      <div className="space-y-4 rounded-lg border border-border p-4">
        <div>
          <Label htmlFor="nombre-nodo" className="text-base font-semibold">
            Nombre del nodo de referencia
          </Label>
          <Input
            id="nombre-nodo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder='Ej. "Puerta de entrada", "Inicio de la rampa"'
            aria-describedby="nombre-nodo-help"
            className="mt-1 h-12 text-base"
          />
          <p id="nombre-nodo-help" className="mt-1 text-sm text-muted-foreground">
            Describe brevemente el lugar físico donde estás parado ahora.
          </p>
        </div>

        <Button
          onClick={capturarGPS}
          disabled={capturando}
          aria-label="Capturar la ubicación GPS actual como nuevo nodo"
          className="h-20 w-full bg-navy text-xl font-bold text-navy-foreground hover:bg-navy/90"
        >
          <Crosshair className="mr-3 h-7 w-7" aria-hidden="true" />
          {capturando ? "Capturando GPS…" : "Capturar posición GPS"}
        </Button>

        <details className="rounded-md border border-border bg-muted/50 px-3 py-2">
          <summary className="cursor-pointer text-base font-semibold">
            <Keyboard className="mr-2 inline h-4 w-4" aria-hidden="true" />
            Ingresar coordenadas manualmente
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="lat" className="text-sm font-semibold">
                Latitud
              </Label>
              <Input
                id="lat"
                inputMode="decimal"
                value={latStr}
                onChange={(e) => setLatStr(e.target.value)}
                placeholder="-12.0464"
                className="mt-1 h-11 text-base"
              />
            </div>
            <div>
              <Label htmlFor="lng" className="text-sm font-semibold">
                Longitud
              </Label>
              <Input
                id="lng"
                inputMode="decimal"
                value={lngStr}
                onChange={(e) => setLngStr(e.target.value)}
                placeholder="-77.0428"
                className="mt-1 h-11 text-base"
              />
            </div>
            <Button
              onClick={agregarManual}
              aria-label="Añadir nodo con coordenadas manuales"
              variant="secondary"
              className="h-12 w-full text-base font-semibold sm:col-span-2"
            >
              Añadir nodo manual
            </Button>
          </div>
        </details>

        <div role="status" aria-live="polite" className="min-h-6">
          {mensaje && <p className="text-base text-foreground">{mensaje}</p>}
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-base text-destructive"
          >
            {error}
          </p>
        )}
      </div>

      <section aria-labelledby="lista-nodos" className="rounded-lg border border-border p-4">
        <h3 id="lista-nodos" className="text-lg font-semibold">
          Nodos capturados ({nodos.length})
        </h3>
        {sinNodos ? (
          <p className="mt-2 text-base text-muted-foreground">
            Aún no has capturado ningún nodo.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {nodos.map((n, idx) => (
              <li
                key={n.id}
                className="flex items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-purple text-sm font-bold text-purple-foreground"
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-base font-semibold">{n.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      <MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" />
                      {n.lat.toFixed(6)}, {n.lng.toFixed(6)} · ±{n.accuracy.toFixed(1)} m
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => eliminar(n.id)}
                  aria-label={`Eliminar nodo ${n.nombre}`}
                  className="grid h-11 w-11 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          onClick={exportarANavegacion}
          disabled={sinNodos}
          aria-label="Exportar lista de nodos a la pestaña de Navegación"
          className="h-16 w-full bg-purple text-base font-semibold text-purple-foreground hover:bg-purple/90"
        >
          <Send className="mr-2 h-5 w-5" aria-hidden="true" />
          Exportar a Navegación
        </Button>
        <Button
          onClick={descargarJSON}
          disabled={sinNodos}
          variant="outline"
          aria-label="Descargar la lista de nodos como archivo JSON"
          className="h-16 w-full text-base font-semibold"
        >
          <Download className="mr-2 h-5 w-5" aria-hidden="true" />
          Descargar JSON
        </Button>
      </div>
    </div>
  );
}

// ===========================================================
// Progreso + Mapa simulado
// ===========================================================

function ProgresoYMapa({
  nodos,
  posicionActual,
  nodoActivoId,
  modoSimulacion,
}: {
  nodos: Nodo[];
  posicionActual: { lat: number; lng: number; accuracy: number } | null;
  nodoActivoId: number | null;
  modoSimulacion: boolean;
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
      <MapaRecorridoLive
        nodos={nodos}
        posicion={posicionActual}
        nodoActivoId={nodoActivoId}
        modoSimulacion={modoSimulacion}
      />
    </section>
  );
}

function GpsBadge({
  posicion,
  activo,
  simular,
}: {
  posicion: { lat: number; lng: number; accuracy: number } | null;
  activo: boolean;
  simular: boolean;
}) {
  if (!activo || simular) return null;
  const acc = posicion?.accuracy;
  let color = "bg-red-500";
  let label = "GPS débil · Activa el modo simulación";
  let pulse = false;
  if (acc != null) {
    if (acc < 10) {
      color = "bg-green-500";
      label = `GPS · Alta precisión ±${acc.toFixed(1)}m`;
      pulse = true;
    } else if (acc <= 30) {
      color = "bg-yellow-500";
      label = `GPS · Precisión media ±${acc.toFixed(1)}m`;
    } else {
      color = "bg-red-500";
      label = `GPS débil ±${acc.toFixed(1)}m · Activa el modo simulación`;
    }
  }
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
    >
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}


