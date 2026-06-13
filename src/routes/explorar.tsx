import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { SiteCard } from "@/components/site-card";
import { sites } from "@/lib/mock-data";

export const Route = createFileRoute("/explorar")({
  head: () => ({ meta: [{ title: "Explorar — Turismo Sin Barreras" }] }),
  component: Explorar,
});

const categories = ["Todas", "Formación natural", "Lago", "Histórico", "Montaña"];

function Explorar() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const filtered = sites.filter(
    (s) =>
      (cat === "Todas" || s.category === cat) &&
      s.title.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <AppShell title="Explorar" back bottomBar={<ListenBar label="Escuchar lista" />}>
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar destino..."
              className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </div>
          <div className="relative sm:w-56">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full appearance-none rounded-xl border border-input bg-card px-4 py-3 pr-10 outline-none focus:border-purple"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          {filtered.length} resultados
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <SiteCard key={s.id} site={s} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
