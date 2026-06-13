import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Menu, Settings, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const nav = [
  { to: "/home", label: "Inicio" },
  { to: "/explorar", label: "Explorar" },
  { to: "/lugares-cercanos", label: "Cercanos" },
  { to: "/favoritos", label: "Favoritos" },
  { to: "/historial", label: "Historial" },
  { to: "/asistente", label: "Asistente" },
  { to: "/navegacion", label: "Navegación" },
  { to: "/emergencia", label: "Emergencia" },
  { to: "/configuracion", label: "Configuración" },
];

export function AppShell({
  title,
  back,
  children,
  bottomBar,
}: {
  title?: string;
  back?: boolean;
  children: ReactNode;
  bottomBar?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-navy px-4 py-3 text-navy-foreground">
        <div className="flex items-center gap-2">
          {back ? (
            <button
              onClick={() => router.history.back()}
              aria-label="Volver"
              className="rounded-md p-2 hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              aria-label="Menú"
              className="rounded-md p-2 hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link to="/home" className="hidden text-base font-bold tracking-tight lg:block">
            Turismo Sin Barreras
          </Link>
        </div>
        <h1 className="truncate text-center text-base font-semibold lg:text-left">
          {title}
        </h1>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-1.5 text-sm hover:bg-white/10"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-sm bg-white/15 font-semibold" }}
            >
              {n.label}
            </Link>
          ))}
          <Link to="/configuracion" className="ml-1 rounded-md p-2 hover:bg-white/10" aria-label="Configuración">
            <Settings className="h-5 w-5" />
          </Link>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-navy p-5 text-navy-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold">Menú</span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm hover:bg-white/10"
                  activeProps={{ className: "rounded-md px-3 py-2.5 text-sm bg-white/15 font-semibold" }}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 pb-20">{children}</main>
      {bottomBar}
    </div>
  );
}
