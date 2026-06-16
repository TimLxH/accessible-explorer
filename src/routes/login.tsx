import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Volume2, Loader2, KeyRound } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { speak } from "@/lib/speech";
import logo from "@/assets/puriy-ayni-logo-v2.png.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Puriy Ayni" }] }),
  component: Login,
});

function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      console.error("[login] signInWithPassword", error);
      setError("Correo o contraseña incorrectos. Por favor verifica tus datos.");
      return;
    }
    nav({ to: "/home" });
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    setGoogleLoading(false);
    if (error) {
      console.error("[login] signInWithOAuth google", error);
      setError("No se pudo iniciar sesión con Google. Por favor intenta de nuevo.");
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0a0e27]">
      {/* Fondo decorativo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-foreground" />
        <div className="absolute left-1/2 top-[12%] h-48 w-48 -translate-x-1/2 rounded-full bg-[#4ade80]/8 blur-3xl" />
        <div className="absolute left-1/2 top-[12%] h-36 w-36 -translate-x-1/2 rounded-full bg-[#a78bfa]/8 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="stars-login" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="30" r="1" fill="white" opacity="0.25" />
              <circle cx="80" cy="70" r="0.8" fill="white" opacity="0.15" />
              <circle cx="50" cy="10" r="1.2" fill="white" opacity="0.2" />
              <circle cx="100" cy="40" r="0.6" fill="white" opacity="0.3" />
              <circle cx="10" cy="90" r="0.9" fill="white" opacity="0.15" />
              <circle cx="70" cy="100" r="0.7" fill="white" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stars-login)" />
        </svg>
      </div>

      {/* Header con logo */}
      <div className="relative flex flex-col items-center px-6 pt-10 pb-6 text-center">
        <Link
          to="/"
          aria-label="Volver a la pantalla de bienvenida"
          className="absolute left-4 top-4 text-sm text-white/60 hover:text-white transition-colors"
        >
          ← Volver
        </Link>
        <div
          aria-hidden="true"
          className="mb-4 grid aspect-square h-24 w-24 place-items-center overflow-hidden rounded-full bg-white/5 shadow-[0_0_30px_rgba(74,222,128,0.12)] ring-1 ring-white/20 backdrop-blur-sm"
        >
          <img
            src={logo.url}
            alt=""
            className="h-full w-full object-cover drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
          />
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
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
        <p className="mt-1 text-white/60 text-sm">Inicia sesión para continuar tu viaje</p>
      </div>

      {/* Formulario */}
      <form
        onSubmit={onSubmit}
        aria-label="Formulario de inicio de sesión"
        className="relative mx-auto w-full max-w-md flex-1 space-y-5 px-6 pb-6"
      >
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-white/80">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/30 outline-none focus:border-[#a78bfa]/60 focus:ring-2 focus:ring-[#a78bfa]/20 backdrop-blur-sm transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-sm font-medium text-white/80">Contraseña</label>
          <div className="relative">
            <input
              id="login-password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 pr-12 text-base text-white placeholder:text-white/30 outline-none focus:border-[#a78bfa]/60 focus:ring-2 focus:ring-[#a78bfa]/20 backdrop-blur-sm transition-all"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-white/50 hover:text-white/80 transition-colors"
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={show}
            >
              {show ? <Eye className="h-5 w-5" aria-hidden="true" /> : <EyeOff className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2.5 text-sm text-red-300 border border-red-500/20">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          aria-label="Iniciar sesión con tu correo y contraseña"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5b2d8a] py-4 text-base font-semibold text-white shadow-[0_0_20px_rgba(91,45,138,0.4)] transition-all hover:bg-[#4a2370] hover:shadow-[0_0_30px_rgba(91,45,138,0.6)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:ring-offset-2 focus:ring-offset-[#0a0e27]"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          Iniciar sesión
        </button>

        <p className="text-center text-sm text-white/50">
          ¿No tienes cuenta?{" "}
          <Link to="/register" aria-label="Ir a la pantalla de registro" className="font-semibold text-[#c9a84c] hover:text-[#f0d78c] transition-colors">
            Regístrate
          </Link>
        </p>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">O</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          aria-label="Continuar con Google"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:ring-offset-2 focus:ring-offset-[#0a0e27]"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continuar con Google
        </button>
      </form>

      {/* Botón Escuchar */}
      <button
        type="button"
        onClick={() =>
          speak(
            "Pantalla de inicio de sesión. Escribe tu correo electrónico y tu contraseña. Luego pulsa el botón Iniciar sesión. Si no tienes cuenta, abajo encontrarás un enlace para registrarte.",
          )
        }
        aria-label="Escuchar instrucciones de la pantalla de inicio de sesión"
        className="relative flex items-center justify-center gap-3 border-t border-white/10 bg-[#0a0e27]/80 px-4 py-4 text-white/90 backdrop-blur-sm transition-colors hover:bg-white/5"
      >
        <Volume2 className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Escuchar</span>
      </button>
    </div>
  );
}
