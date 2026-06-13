import { createFileRoute, Link } from "@tanstack/react-router";
import { Volume2, Waves } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turismo Sin Barreras" },
      { name: "description", content: "App de turismo accesible para todos." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="flex min-h-screen flex-col bg-navy text-navy-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative mb-10 grid h-32 w-32 place-items-center rounded-full bg-white/10 ring-4 ring-white/15">
          <Waves className="absolute -bottom-2 h-10 w-32 text-purple opacity-70" />
          <svg viewBox="0 0 64 64" className="h-20 w-20 text-white" fill="currentColor">
            <circle cx="32" cy="14" r="6" />
            <path d="M22 30c0-3 4-6 10-6s10 3 10 6l-3 18h-4l1-12-3 12h-4l-3-12 1 12h-4l-3-18z" />
            <path d="M14 38l8-4 2 4-8 4z" />
          </svg>
        </div>
        <h1 className="mb-3 text-4xl font-extrabold leading-tight sm:text-5xl">
          Turismo Sin Barreras
        </h1>
        <p className="mb-2 max-w-md text-lg text-white/80">
          Descubre lugares accesibles, con guía de voz y rutas pensadas para todos.
        </p>
        <p className="mb-10 max-w-md text-sm text-white/60">
          Tu compañero de viaje inclusivo
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-purple px-6 py-4 text-base font-semibold text-purple-foreground shadow-lg transition-colors hover:bg-purple/90"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="rounded-xl border-2 border-white/30 bg-white/5 px-6 py-4 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            Registrarse
          </Link>
        </div>
      </div>
      <button className="flex items-center justify-center gap-3 border-t border-white/10 bg-navy px-4 py-4 text-white/90 hover:bg-white/5">
        <Volume2 className="h-5 w-5" />
        <span className="text-sm font-medium">Escuchar</span>
      </button>
    </div>
  );
}
