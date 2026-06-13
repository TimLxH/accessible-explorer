import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmergencyBar } from "@/components/emergency-bar";
import { SiteCard } from "@/components/site-card";
import { sitesQuery } from "@/lib/api";

export const Route = createFileRoute("/explorar")({
  head: () => ({ meta: [{ title: "Explorar — Turismo Sin Barreras" }] }),
  component: Explorar,
});

const categories = ["Todas", "Formación natural", "Lago", "Histórico", "Montaña"];

function Explorar() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const { data: sites, isLoading, isError, error, refetch, isFetching } = useQuery(sitesQuery);

  const filtered = (sites ?? []).filter(
    (s) =>
      (cat === "Todas" || s.category === cat) &&
      s.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell title="Explorar" back bottomBar={<EmergencyBar />}>
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="search-input" className="sr-only">Buscar destino por nombre</label>
            <input
              id="search-input"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar destino..."
              className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </div>
          <div className="relative sm:w-56">
            <label htmlFor="category-select" className="sr-only">Filtrar por categoría</label>
            <select
              id="category-select"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full appearance-none rounded-xl border border-input bg-card px-4 py-3 pr-10 outline-none focus:border-purple"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>


        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando lugares desde el servidor…
          </div>
        )}

        {isError && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" /> No se pudieron cargar los lugares
            </div>
            <p className="mt-1">{(error as Error)?.message}</p>
            <button
              onClick={() => refetch()}
              aria-label="Reintentar la carga de lugares"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              Reintentar
            </button>
          </div>
        )}


        {!isLoading && !isError && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {filtered.length} resultados {isFetching && "· actualizando…"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <SiteCard key={s.id} site={s} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
