import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Navigation } from "lucide-react";
import type { Site } from "@/lib/api";

export function SiteCard({ site }: { site: Site }) {
  const favSuffix = site.favorite ? ". Marcado como favorito" : "";
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to="/detalle/$id"
        params={{ id: site.id }}
        aria-label={`${site.title}, en ${site.location}, a ${site.distance}${favSuffix}. Ver detalles`}
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={site.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {site.favorite && (
            <div aria-hidden="true" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-purple shadow">
              <Heart className="h-4 w-4 fill-current" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="text-lg font-bold text-foreground">{site.title}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate">{site.location}</span>
            <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {site.distance}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{site.description}</p>
        </div>
      </Link>
      <div className="border-t border-border p-3">
        <Link
          to="/navegacion"
          search={{ dest: site.id }}
          aria-label={`Iniciar recorrido guiado por voz hacia ${site.title}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple py-3 text-sm font-semibold text-purple-foreground shadow hover:bg-purple/90 focus:outline-none focus:ring-4 focus:ring-purple/40"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Iniciar recorrido
        </Link>
      </div>
    </div>
  );
}
