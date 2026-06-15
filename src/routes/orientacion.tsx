import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Crosshair, Play, Square, Download, Send, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { speak, stopSpeaking } from "@/lib/speech";

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
  const R = 6371000; // radio de la Tierra en metros
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ----- Componente principal -----

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
  const [posicion, setPosicion] = useState<{ lat: number; lng: number; accuracy: number } | null>(
    null,
  );
  const [mensaje, setMensaje] = useState<string>("Pulsa 'Iniciar Recorrido' para comenzar.");
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const ultimoNodoRef = useRef<number | null>(null);

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
    if (!("geolocation" in navigator)) {
      setError("Tu dispositivo no admite geolocalización.");
      speak("Tu dispositivo no admite geolocalización.");
      return;
    }
    if (nodos.length === 0) {
      setError(
        "No hay nodos de referencia. Crea nodos en la pestaña Administrador antes de iniciar.",
      );
      speak("No hay nodos de referencia. Crea nodos en el administrador.");
      return;
    }
    speak("Recorrido iniciado. Caminando entre puntos de referencia.");
    setMensaje("Caminando entre puntos de referencia.");
    setActivo(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosicion({ lat: latitude, lng: longitude, accuracy });
        evaluarPosicion(latitude, longitude);
      },
      (err) => {
        setError(`Error de GPS: ${err.message}`);
        speak("Error obteniendo la ubicación.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function detener() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActivo(false);
    stopSpeaking();
  }

  function evaluarPosicion(lat: number, lng: number) {
    let nodoCercano: Nodo | null = null;
    let distMin = Infinity;
    for (const n of nodos) {
      const d = haversineMeters(lat, lng, n.lat, n.lng);
      if (d < distMin) {
        distMin = d;
        nodoCercano = n;
      }
    }
    if (nodoCercano && distMin < 4) {
      if (ultimoNodoRef.current !== nodoCercano.id) {
        ultimoNodoRef.current = nodoCercano.id;
        const texto = `Estás pasando por: ${nodoCercano.nombre}`;
        setMensaje(texto);
        speak(texto);
      }
    } else {
      if (ultimoNodoRef.current !== null) {
        ultimoNodoRef.current = null;
        const texto = "Caminando entre puntos de referencia.";
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

      <section aria-labelledby="estado-gps" className="rounded-lg border border-border p-4">
        <h3 id="estado-gps" className="text-lg font-semibold">
          Estado del GPS
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

      <section aria-labelledby="lista-nodos-nav" className="rounded-lg border border-border p-4">
        <h3 id="lista-nodos-nav" className="text-lg font-semibold">
          Nodos cargados ({nodos.length})
        </h3>
        {nodos.length === 0 ? (
          <p className="mt-2 text-base text-muted-foreground">
            No hay nodos. Ve al Administrador para crear puntos de referencia.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {nodos.map((n) => (
              <li key={n.id} className="py-2">
                <p className="font-semibold">{n.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {n.lat.toFixed(6)}, {n.lng.toFixed(6)} · ±{n.accuracy.toFixed(1)} m
                </p>
              </li>
            ))}
          </ul>
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

  function capturar() {
    setError(null);
    setMensaje(null);
    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      setError("Escribe primero el nombre del nodo de referencia.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("Tu dispositivo no admite geolocalización.");
      return;
    }
    setCapturando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nuevo: Nodo = {
          id: Date.now(),
          nombre: nombreTrim,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        const next = [...nodos, nuevo];
        setNodos(next);
        setNombre("");
        setMensaje(
          `Nodo "${nuevo.nombre}" capturado con precisión de ±${nuevo.accuracy.toFixed(1)} m.`,
        );
        setCapturando(false);
      },
      (err) => {
        setError(`No se pudo capturar la posición: ${err.message}`);
        setCapturando(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function eliminar(id: number) {
    setNodos((prev) => prev.filter((n) => n.id !== id));
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
          Captura puntos de referencia con GPS de alta precisión para construir el mapa de
          orientación.
        </p>
      </header>

      <div className="space-y-3 rounded-lg border border-border p-4">
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
          onClick={capturar}
          disabled={capturando}
          aria-label="Capturar la ubicación GPS actual como nuevo nodo"
          className="h-20 w-full bg-navy text-xl font-bold text-navy-foreground hover:bg-navy/90"
        >
          <Crosshair className="mr-3 h-7 w-7" aria-hidden="true" />
          {capturando ? "Capturando GPS…" : "Capturar posición GPS"}
        </Button>

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
