import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Menu, Settings, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const nav = [
  { to: "/home", label: "Inicio" },
  { to: "/explorar", label: "Explorar" },
  { to: "/lugares-cercanos", label: "Cercanos" },
  { to: "/favoritos", label: "Favoritos" },
  { to: "/historial", label: "Historial" },
  { to: "/asistente", label: "Asistente" },
  { to: "/navegacion", label: "Navegación" },
  { to: "/orientacion", label: "Orientación" },
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
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Foco al abrir el cajón + cerrar con Escape (mejora TalkBack/teclado)
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-navy px-4 py-3 text-navy-foreground">
        <div className="flex items-center gap-2">
          {back ? (
            <button
              onClick={() => router.history.back()}
              aria-label="Volver a la pantalla anterior"
              className="grid h-11 w-11 place-items-center rounded-md hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={open}
              aria-controls="main-drawer"
              className="grid h-11 w-11 place-items-center rounded-md hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <Link
            to="/home"
            aria-label="Ir al inicio de Puriy Ayni"
            className="hidden text-base font-bold tracking-tight lg:block"
          >
            Puriy Ayni
          </Link>
        </div>
        <h1 className="truncate text-center text-base font-semibold lg:text-left">
          {title}
        </h1>
        <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              aria-label={`Ir a ${n.label}`}
              className="rounded-md px-3 py-1.5 text-sm hover:bg-white/10"
              activeProps={{
                className: "rounded-md px-3 py-1.5 text-sm bg-white/15 font-semibold",
                "aria-current": "page",
              }}
            >
              {n.label}
            </Link>
          ))}
          <Link
            to="/configuracion"
            className="ml-1 grid h-11 w-11 place-items-center rounded-md hover:bg-white/10"
            aria-label="Ir a configuración"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>
        </nav>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          id="main-drawer"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-navy p-5 text-navy-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold">Menú</span>
              <button
                ref={closeBtnRef}
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú de navegación"
                className="grid h-11 w-11 place-items-center rounded-md hover:bg-white/10"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Menú lateral" className="flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  aria-label={`Ir a ${n.label}`}
                  className="rounded-md px-3 py-3 text-base hover:bg-white/10"
                  activeProps={{
                    className: "rounded-md px-3 py-3 text-base bg-white/15 font-semibold",
                    "aria-current": "page",
                  }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="flex-1 pb-20 focus:outline-none">
        {children}
      </main>
      {bottomBar}
    </div>
  );
}
