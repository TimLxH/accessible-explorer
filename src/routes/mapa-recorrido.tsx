import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Accessibility,
  AlertTriangle,
  Camera,
  Coffee,
  Info,
  MapPin,
  Mountain,
  Trees,
  Utensils,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/mapa-recorrido")({
  head: () => ({ meta: [{ title: "Mapa del recorrido — Turismo Sin Barreras" }] }),
  component: MapaRecorrido,
});

type Category = "mirador" | "accesible" | "servicio" | "alerta";

type Node = {
  id: string;
  x: number;
  y: number;
  title: string;
  category: Category;
  icon: LucideIcon;
  description: string;
  photo: string;
  obstacles?: string[];
};

const NODES: Node[] = [
  {
    id: "n1",
    x: 70,
    y: 470,
    title: "Punto de inicio",
    category: "servicio",
    icon: MapPin,
    description:
      "Acceso principal con boletería, mapas impresos y baños. Personal de orientación disponible.",
    photo: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80",
  },
  {
    id: "n2",
    x: 180,
    y: 380,
    title: "Sendero del bosque",
    category: "accesible",
    icon: Trees,
    description:
      "Tramo plano de tierra compactada de 200 m, sombreado por eucaliptos nativos.",
    photo: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
  },
  {
    id: "n3",
    x: 290,
    y: 250,
    title: "Mirador del valle",
    category: "mirador",
    icon: Mountain,
    description:
      "Plataforma con vista panorámica al valle del Mantaro. Barandilla reforzada y bancas.",
    photo: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
    obstacles: ["Pendiente del 8% en los últimos 30 m antes del mirador."],
  },
  {
    id: "n4",
    x: 430,
    y: 200,
    title: "Zona fotográfica",
    category: "mirador",
    icon: Camera,
    description:
      "Punto recomendado para fotografías al amanecer, con marco panorámico señalizado.",
    photo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
  },
  {
    id: "n5",
    x: 560,
    y: 300,
    title: "Tramo rocoso",
    category: "alerta",
    icon: AlertTriangle,
    description:
      "Sección con piedras sueltas. Camina por el sendero marcado en color amarillo.",
    photo: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
    obstacles: [
      "Escalones irregulares de 80 m.",
      "No apto para sillas de ruedas sin acompañante.",
    ],
  },
  {
    id: "n6",
    x: 700,
    y: 220,
    title: "Cafetería del mirador",
    category: "servicio",
    icon: Coffee,
    description:
      "Servicios higiénicos accesibles, agua potable y cafetería con menú regional.",
    photo: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&q=80",
  },
  {
    id: "n7",
    x: 830,
    y: 120,
    title: "Cumbre",
    category: "mirador",
    icon: Mountain,
    description:
      "Punto más alto del recorrido (3.520 msnm). Mirador 360° con paneles interpretativos.",
    photo: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    obstacles: ["Última subida con 45 escalones de piedra."],
  },
  {
    id: "n8",
    x: 900,
    y: 420,
    title: "Restaurante mirador",
    category: "servicio",
    icon: Utensils,
    description:
      "Restaurante con terraza accesible, rampa de ingreso y baños adaptados.",
    photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  },
];

const PATH =
  "M 70 470 Q 130 430 180 380 T 290 250 Q 360 200 430 200 T 560 300 Q 640 270 700 220 T 830 120 Q 880 280 900 420";

const FILTERS: { key: "todo" | "accesible" | "servicio" | "mirador" | "alerta"; label: string }[] = [
  { key: "todo", label: "Ver todo" },
  { key: "accesible", label: "Rutas accesibles" },
  { key: "servicio", label: "Servicios" },
  { key: "mirador", label: "Miradores" },
  { key: "alerta", label: "Alertas" },
];

const CATEGORY_COLOR: Record<Category, string> = {
  mirador: "oklch(0.48 0.19 295)", // purple
  accesible: "oklch(0.55 0.18 160)", // teal-green
  servicio: "oklch(0.30 0.10 265)", // navy
  alerta: "oklch(0.62 0.22 35)", // orange-red
};

function MapaRecorrido() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("todo");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const visible = useMemo(
    () => NODES.filter((n) => filter === "todo" || n.category === filter),
    [filter],
  );
  const visibleIds = new Set(visible.map((n) => n.id));
  const active = NODES.find((n) => n.id === activeId) ?? null;

  return (
    <AppShell title="Mapa del recorrido" back>
      <div className="mx-auto w-full max-w-5xl px-4 py-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  on
                    ? "bg-purple text-purple-foreground shadow"
                    : "border border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-sm">
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Mapa del recorrido turístico"
            className="block h-auto w-full"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="oklch(0.5 0.05 270 / 0.15)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="1000" height="600" fill="url(#grid)" />

            {/* Decorative terrain blobs */}
            <ellipse cx="220" cy="500" rx="180" ry="50" fill="oklch(0.55 0.18 160 / 0.18)" />
            <ellipse cx="750" cy="500" rx="220" ry="55" fill="oklch(0.55 0.18 160 / 0.15)" />
            <circle cx="830" cy="120" r="60" fill="oklch(0.48 0.19 295 / 0.12)" />

            {/* Route halo */}
            <path d={PATH} stroke="oklch(0.48 0.19 295 / 0.18)" strokeWidth="22" fill="none" strokeLinecap="round" />
            {/* Route dashed */}
            <path
              d={PATH}
              stroke="oklch(0.48 0.19 295)"
              strokeWidth="6"
              strokeDasharray="14 12"
              strokeLinecap="round"
              fill="none"
            />

            {/* Nodes */}
            {NODES.map((n) => {
              const enabled = visibleIds.has(n.id);
              const isHover = hoverId === n.id;
              const isActive = activeId === n.id;
              const r = isActive ? 32 : isHover ? 30 : 26;
              const color = CATEGORY_COLOR[n.category];
              const Icon = n.icon;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  style={{
                    cursor: enabled ? "pointer" : "default",
                    opacity: enabled ? 1 : 0.25,
                    transition: "opacity 200ms",
                  }}
                  onMouseEnter={() => enabled && setHoverId(n.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => enabled && setActiveId(n.id)}
                  role="button"
                  tabIndex={enabled ? 0 : -1}
                  aria-label={n.title}
                  onKeyDown={(e) => {
                    if (enabled && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setActiveId(n.id);
                    }
                  }}
                >
                  <circle r={r + 6} fill={color} opacity={isHover || isActive ? 0.25 : 0.12} />
                  <circle
                    r={r}
                    fill="white"
                    stroke={color}
                    strokeWidth={isActive ? 5 : 4}
                    style={{ transition: "r 180ms ease, stroke-width 180ms ease" }}
                  />
                  <foreignObject x={-12} y={-12} width={24} height={24}>
                    <div
                      style={{
                        color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <Icon size={20} strokeWidth={2.4} />
                    </div>
                  </foreignObject>
                  <text
                    y={r + 18}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="600"
                    fill="oklch(0.25 0.05 270)"
                  >
                    {n.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Toca un punto del mapa para ver información, fotos y alertas de accesibilidad.
        </p>
      </div>

      {/* Detail panel — bottom sheet on mobile, side drawer on desktop */}
      {active && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setActiveId(null)}
            aria-hidden
          />
          <aside
            className="fixed z-50 bg-card text-card-foreground shadow-2xl
              inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl
              lg:inset-y-0 lg:right-0 lg:left-auto lg:top-0 lg:h-full lg:w-[420px] lg:max-h-none lg:rounded-none lg:rounded-l-3xl"
            role="dialog"
            aria-label={active.title}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="grid h-9 w-9 place-items-center rounded-full text-white"
                  style={{ background: CATEGORY_COLOR[active.category] }}
                >
                  <active.icon className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold">{active.title}</h2>
              </div>
              <button
                onClick={() => setActiveId(null)}
                aria-label="Cerrar"
                className="rounded-full p-2 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <img
                src={active.photo}
                alt={active.title}
                className="mb-4 h-48 w-full rounded-xl object-cover"
              />
              <div className="mb-3 flex items-center gap-2 text-xs">
                <span
                  className="rounded-full px-2.5 py-0.5 font-medium text-white"
                  style={{ background: CATEGORY_COLOR[active.category] }}
                >
                  {active.category === "accesible" && "Accesible"}
                  {active.category === "mirador" && "Mirador"}
                  {active.category === "servicio" && "Servicio"}
                  {active.category === "alerta" && "Zona de alerta"}
                </span>
                {active.category === "accesible" && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Accessibility className="h-3.5 w-3.5" /> Apto para movilidad reducida
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed text-foreground">{active.description}</p>

              {active.obstacles && active.obstacles.length > 0 && (
                <div className="mt-4 rounded-xl border border-orange-300/60 bg-orange-50 p-3 text-sm text-orange-900 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-200">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    Alertas de obstáculos
                  </div>
                  <ul className="ml-5 list-disc space-y-1">
                    {active.obstacles.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() =>
                    speak(
                      `${active.title}. ${active.description} ${
                        active.obstacles ? "Alertas: " + active.obstacles.join(". ") : ""
                      }`,
                    )
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-purple py-3 text-sm font-semibold text-purple hover:bg-purple/5"
                >
                  <Volume2 className="h-4 w-4" /> Escuchar
                </button>
                <button
                  onClick={() => setActiveId(null)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple px-4 py-3 text-sm font-semibold text-purple-foreground hover:bg-purple/90"
                >
                  <Info className="h-4 w-4" /> Entendido
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </AppShell>
  );
}
