import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Volume2, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Crear cuenta — Puriy Ayni" }] }),
  component: Register,
});

function Register() {
  const [show, setShow] = useState(false);
  const [fullName, setFullName] = useState("");
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
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
      setError(error.message);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="bg-navy px-6 pb-10 pt-12 text-navy-foreground">
        <Link to="/" aria-label="Volver a la pantalla de bienvenida" className="text-sm text-white/70 hover:text-white">← Volver</Link>
        <h1 className="mt-4 text-3xl font-extrabold">Crear cuenta</h1>
        <p className="mt-1 text-white/70">Únete y comienza a explorar sin barreras</p>
      </div>
      <form
        onSubmit={onSubmit}
        aria-label="Formulario de registro de cuenta nueva"
        className="mx-auto -mt-6 w-full max-w-md flex-1 space-y-5 rounded-t-3xl bg-card p-6 pt-8 shadow-sm sm:rounded-3xl sm:p-8"
      >
        <div className="space-y-1.5">
          <label htmlFor="reg-name" className="text-sm font-medium">Nombre completo</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="María Pérez"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="text-sm font-medium">Correo electrónico</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="text-sm font-medium">Contraseña</label>
          <div className="relative">
            <input
              id="reg-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              aria-describedby="reg-password-hint"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={show}
            >
              {show ? <Eye className="h-5 w-5" aria-hidden="true" /> : <EyeOff className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
          <p id="reg-password-hint" className="text-xs text-muted-foreground">
            Usa al menos 6 caracteres.
          </p>
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" required className="mt-0.5 h-5 w-5 accent-purple" aria-label="Acepto los términos y la política de privacidad" />
          <span>Acepto los términos y la política de privacidad</span>
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          aria-label="Crear cuenta con los datos ingresados"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple py-4 text-base font-semibold text-purple-foreground shadow hover:bg-purple/90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          Crear cuenta
        </button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" aria-label="Ir a la pantalla de inicio de sesión" className="font-semibold text-purple hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
      <div className="mx-auto w-full max-w-md px-6 pb-4 pt-2 sm:px-8">
        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">O</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          aria-label="Continuar con Google"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background py-3.5 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-accent disabled:opacity-60"
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
      </div>
      <button
        type="button"
        onClick={() =>
          speak(
            "Pantalla de registro de cuenta. Escribe tu nombre completo, tu correo electrónico y una contraseña de al menos seis caracteres. Marca la casilla de aceptar los términos y luego pulsa el botón Crear cuenta.",
          )
        }
        aria-label="Escuchar instrucciones de la pantalla de registro"
        className="flex items-center justify-center gap-3 border-t border-border bg-navy px-4 py-4 text-navy-foreground hover:bg-navy/90"
      >
        <Volume2 className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Escuchar</span>
      </button>
    </div>
  );
}
