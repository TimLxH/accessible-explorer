import { createFileRoute, Link } from "@tanstack/react-router";
import { Volume2, KeyRound, Plus } from "lucide-react";
import logo from "@/assets/puriy-ayni-logo-v2.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pury Ayni" },
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
      "Bienvenido a Pury Ayni, tu asistente de viaje accesible. Descubre lugares accesibles, con guía de voz y rutas pensadas para todos. Toca el botón de iniciar sesión para entrar a tu cuenta, o el botón de registrarse para crear una nueva.",
    );
    u.lang = "es-ES";
    window.speechSynthesis.speak(u);
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0a0e27]">
      {/* Fondo decorativo: estrellas y montañas */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Gradiente base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27] via-[#10153a] to-[#0a0e27]" />
        {/* Glow detrás del logo */}
        <div className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-[#4ade80]/10 blur-3xl" />
        <div className="absolute left-1/2 top-[18%] h-48 w-48 -translate-x-1/2 rounded-full bg-[#a78bfa]/10 blur-3xl" />
        {/* Estrellas */}
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="stars" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="30" r="1" fill="white" opacity="0.3" />
              <circle cx="80" cy="70" r="0.8" fill="white" opacity="0.2" />
              <circle cx="50" cy="10" r="1.2" fill="white" opacity="0.25" />
              <circle cx="100" cy="40" r="0.6" fill="white" opacity="0.35" />
              <circle cx="10" cy="90" r="0.9" fill="white" opacity="0.2" />
              <circle cx="70" cy="100" r="0.7" fill="white" opacity="0.3" />
              <circle cx="110" cy="110" r="1" fill="white" opacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stars)" />
        </svg>
        {/* Montañas geométricas sutiles */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,200 200,80 400,150 600,60 800,140 1000,50 1200,130 1440,90 1440,200" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <polygon points="0,200 150,100 350,170 550,90 750,160 950,70 1150,150 1350,100 1440,140 1440,200" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>
        {/* Líneas de constelación sutiles */}
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="10%" y1="15%" x2="25%" y2="8%" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="25%" y1="8%" x2="40%" y2="18%" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="70%" y1="12%" x2="85%" y2="5%" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="60%" y1="25%" x2="75%" y2="18%" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="85%" y1="30%" x2="95%" y2="22%" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Contenido principal */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        {/* Logo con glow */}
        <div
          aria-hidden="true"
          className="relative mb-6 grid aspect-square h-40 w-40 place-items-center overflow-hidden rounded-full bg-white/5 shadow-[0_0_40px_rgba(74,222,128,0.15)] ring-1 ring-white/20 backdrop-blur-sm"
        >
          <img
            src={logo.url}
            alt=""
            className="h-full w-full object-cover drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
          />
        </div>

        {/* Título PURY AYNI con efecto dorado */}
        <h1
          className="mb-3 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl"
          style={{
            background: "linear-gradient(180deg, #f0d78c 0%, #c9a84c 40%, #8b6914 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 2px 4px rgba(201,168,76,0.3))",
          }}
        >
          PURY AYNI
        </h1>

        <p className="mb-2 max-w-md text-lg text-white/85">
          Descubre lugares accesibles, con guía de voz y rutas pensadas para todos.
        </p>
        <p className="mb-10 max-w-md text-sm text-white/55">
          Tu asistente de viaje accesible
        </p>

        {/* Botones */}
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Link
            to="/login"
            aria-label="Iniciar sesión: ir a la pantalla de inicio de sesión"
            className="flex items-center justify-center gap-3 rounded-2xl bg-[#5b2d8a] px-6 py-4 text-base font-semibold text-white shadow-[0_0_20px_rgba(91,45,138,0.4)] transition-all hover:bg-[#4a2370] hover:shadow-[0_0_30px_rgba(91,45,138,0.6)] focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:ring-offset-2 focus:ring-offset-[#0a0e27]"
          >
            <KeyRound className="h-5 w-5" aria-hidden="true" />
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            aria-label="Registrarse: ir a la pantalla de creación de cuenta"
            className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[#a78bfa]/40 bg-[#a78bfa]/10 px-6 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-[#a78bfa]/20 hover:border-[#a78bfa]/60 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:ring-offset-2 focus:ring-offset-[#0a0e27]"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Registrarse
          </Link>
        </div>

        <p className="mt-6 max-w-xs text-xs text-white/40">
          Al continuar, aceptas nuestos{" "}
          <Link to="/" className="underline hover:text-white/60" aria-label="Ver términos de servicio">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link to="/" className="underline hover:text-white/60" aria-label="Ver política de privacidad">
            Política de Privacidad
          </Link>
          .
        </p>
      </div>

      {/* Botón Escuchar */}
      <button
        type="button"
        onClick={escuchar}
        aria-label="Escuchar descripción de la pantalla de bienvenida"
        className="relative flex items-center justify-center gap-3 border-t border-white/10 bg-[#0a0e27]/80 px-4 py-4 text-white/90 backdrop-blur-sm transition-colors hover:bg-white/5"
      >
        <Volume2 className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Escuchar</span>
      </button>
    </div>
  );
}
