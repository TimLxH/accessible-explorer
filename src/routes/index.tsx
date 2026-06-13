import { createFileRoute, Link } from "@tanstack/react-router";
import { Volume2 } from "lucide-react";
import logo from "@/assets/puriy-ayni-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Puriy Ayni" },
      { name: "description", content: "App de turismo accesible para todos." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="flex min-h-screen flex-col bg-navy text-navy-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative mb-10 grid h-44 w-44 place-items-center rounded-full bg-white/10 ring-4 ring-white/15">
          <img
            src={logo.url}
            alt="Puriy Ayni — Tu asistente de viaje accesible"
            className="h-36 w-36 object-contain"
          />
        </div>
        <h1 className="mb-3 text-4xl font-extrabold leading-tight sm:text-5xl">
          Puriy Ayni
        </h1>
        <p className="mb-2 max-w-md text-lg text-white/80">
          Descubre lugares accesibles, con guía de voz y rutas pensadas para todos.
        </p>
        <p className="mb-10 max-w-md text-sm text-white/60">
          Tu asistente de viaje accesible
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
