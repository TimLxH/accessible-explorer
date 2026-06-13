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
  function escuchar() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      "Bienvenido a Puriy Ayni, tu asistente de viaje accesible. Descubre lugares accesibles, con guía de voz y rutas pensadas para todos. Toca el botón de iniciar sesión para entrar a tu cuenta, o el botón de registrarse para crear una nueva.",
    );
    u.lang = "es-ES";
    window.speechSynthesis.speak(u);
  }
  return (
    <div className="flex min-h-dvh flex-col bg-navy text-navy-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div
          aria-hidden="true"
          className="relative mb-8 grid h-48 w-48 place-items-center overflow-hidden rounded-full bg-white/10 shadow-lg ring-2 ring-white/20 backdrop-blur-sm"
        >
          <img
            src={logo.url}
            alt=""
            className="h-40 w-40 object-contain"
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
            aria-label="Iniciar sesión: ir a la pantalla de inicio de sesión"
            className="rounded-xl bg-purple px-6 py-4 text-base font-semibold text-purple-foreground shadow-lg transition-colors hover:bg-purple/90"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            aria-label="Registrarse: ir a la pantalla de creación de cuenta"
            className="rounded-xl border-2 border-white/30 bg-white/5 px-6 py-4 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            Registrarse
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={escuchar}
        aria-label="Escuchar descripción de la pantalla de bienvenida"
        className="flex items-center justify-center gap-3 border-t border-white/10 bg-navy px-4 py-4 text-white/90 hover:bg-white/5"
      >
        <Volume2 className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Escuchar</span>
      </button>
    </div>
  );
}

