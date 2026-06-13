import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { SiteCard } from "@/components/site-card";
import { sites } from "@/lib/mock-data";

export const Route = createFileRoute("/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos" }] }),
  component: Favoritos,
});

function Favoritos() {
  const favs = sites.filter((s) => s.favorite);
  return (
    <AppShell title="Favoritos" back bottomBar={<ListenBar label="Escuchar lista" />}>
      <div className="mx-auto max-w-5xl px-5 py-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {favs.length} lugares guardados
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favs.map((s) => (
            <SiteCard key={s.id} site={s} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
