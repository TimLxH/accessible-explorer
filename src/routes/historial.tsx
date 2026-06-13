import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { useAuth } from "@/hooks/use-auth";
import { useHistory } from "@/hooks/use-history";

export const Route = createFileRoute("/historial")({
  head: () => ({ meta: [{ title: "Historial" }] }),
  component: History,
});

function History() {
  const { user, loading } = useAuth();
  const { data, isLoading, isError, error } = useHistory();

  return (
    <AppShell title="Historial" back bottomBar={<ListenBar />}>
      <div className="mx-auto max-w-2xl px-5 py-6">
        {loading && (
          <p className="text-muted-foreground"><Loader2 className="inline h-5 w-5 animate-spin" /> Cargando…</p>
        )}
        {!loading && !user && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-navy" />
            <h2 className="mt-4 text-lg font-bold">Tu historial está vacío</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Inicia sesión para que guardemos los lugares que visitas.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-xl bg-purple px-6 py-3 font-semibold text-purple-foreground"
            >
              Iniciar sesión
            </Link>
          </div>
        )}
        {user && isLoading && (
          <p className="text-muted-foreground"><Loader2 className="inline h-5 w-5 animate-spin" /> Cargando historial…</p>
        )}
        {user && isError && (
          <p className="text-sm text-destructive">{(error as Error)?.message}</p>
        )}
        {user && !isLoading && data && data.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Todavía no has visitado ningún lugar.
          </p>
        )}
        {user && data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((h) => {
              const lugar = (h as { lugares: { title: string; location: string } | null }).lugares;
              const d = new Date(h.visited_at);
              return (
                <li
                  key={h.id}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy/10 text-navy">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{lugar?.title ?? h.lugar_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.toLocaleDateString()} · {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
