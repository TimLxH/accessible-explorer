import { Link } from "@tanstack/react-router";
import { Heart, MapPin } from "lucide-react";
import type { Site } from "@/lib/mock-data";

export function SiteCard({ site }: { site: Site }) {
  return (
    <Link
      to="/detalle/$id"
      params={{ id: site.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={site.image}
          alt={site.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {site.favorite && (
          <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-purple shadow">
            <Heart className="h-4 w-4 fill-current" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-bold text-foreground">{site.title}</h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{site.location}</span>
          <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {site.distance}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{site.description}</p>
      </div>
    </Link>
  );
}
