import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ListenBar } from "@/components/listen-bar";
import { history } from "@/lib/mock-data";

export const Route = createFileRoute("/historial")({
  head: () => ({ meta: [{ title: "Historial" }] }),
  component: History,
});

function History() {
  return (
    <AppShell title="Historial" back bottomBar={<ListenBar />}>
      <div className="mx-auto max-w-2xl px-5 py-6">
        <ul className="space-y-3">
          {history.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy/10 text-navy">
                <Clock className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{h.title}</p>
                <p className="text-sm text-muted-foreground">
                  {h.date} · {h.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
