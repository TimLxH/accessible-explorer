import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, MapPin, ChevronDown, Volume2, Navigation, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { speak } from "@/lib/speech";
import { AppShell } from "@/components/app-shell";
import { siteQuery } from "@/lib/api";

export const Route = createFileRoute("/detalle/$id")({
  head: ({ params }) => ({
    meta: [{ title: `${params.id} — Turismo Sin Barreras` }],
  }),
  component: Detalle,
});

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold"
      >
        <span>{title}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-border px-5 py-4 text-muted-foreground">{children}</div>}
    </div>
  );
}

function Detalle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: site, isLoading, isError, error, refetch } = useQuery(siteQuery(id));
  const [fav, setFav] = useState(false);

  if (isLoading) {
    return (
      <AppShell title="Cargando…" back>
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando información del lugar…
        </div>
      </AppShell>
    );
  }

  if (isError || !site) {
    return (
      <AppShell title="Error" back>
        <div className="mx-auto max-w-3xl px-5 py-10">
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" /> No se pudo cargar el lugar
            </div>
            <p className="mt-1">{(error as Error)?.message ?? "Lugar no encontrado."}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  function iniciarRecorrido() {
    speak(`Iniciando recorrido hacia ${site!.title}`);
    navigate({ to: "/navegacion", search: { dest: site!.id } });
  }

  return (
    <AppShell title={site.title} back>
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        <img src={site.image} alt={site.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => setFav((f) => !f)}
          aria-label="Favorito"
          className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/95 text-purple shadow-lg"
        >
          <Heart className={`h-6 w-6 ${fav ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className="mx-auto max-w-3xl px-5 py-6">
        <h2 className="text-3xl font-extrabold">{site.title}</h2>
        <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{site.location}</span>
          <span className="ml-3 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {site.distance}
          </span>
        </div>
        <p className="mt-4 text-base leading-relaxed text-foreground">{site.description}</p>

        <div className="mt-6 space-y-3">
          <Section title="Historia del lugar" defaultOpen>{site.history}</Section>
          <Section title="Información general">{site.info}</Section>
          <Section title="Nivel de accesibilidad">{site.accessibility}</Section>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => speak(`${site.title}. ${site.description} ${site.accessibility}`)}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-purple bg-white py-4 font-semibold text-purple hover:bg-purple/5"
          >
            <Volume2 className="h-5 w-5" /> Escuchar descripción
          </button>
          <button
            onClick={iniciarRecorrido}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple py-4 font-semibold text-purple-foreground shadow hover:bg-purple/90"
          >
            <Navigation className="h-5 w-5" /> Iniciar recorrido
          </button>
        </div>
      </div>
    </AppShell>
  );
}
