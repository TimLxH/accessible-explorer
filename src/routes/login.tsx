import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Volume2, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { speak } from "@/lib/speech";

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
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    nav({ to: "/home" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="bg-navy px-6 pb-10 pt-12 text-navy-foreground">
        <Link to="/" aria-label="Volver a la pantalla de bienvenida" className="text-sm text-white/70 hover:text-white">← Volver</Link>
        <h1 className="mt-4 text-3xl font-extrabold">Bienvenido de vuelta</h1>
        <p className="mt-1 text-white/70">Inicia sesión para continuar tu viaje</p>
      </div>
      <form
        onSubmit={onSubmit}
        aria-label="Formulario de inicio de sesión"
        className="mx-auto -mt-6 w-full max-w-md flex-1 space-y-5 rounded-t-3xl bg-card p-6 pt-8 shadow-sm sm:rounded-3xl sm:p-8"
      >
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-sm font-medium">Contraseña</label>
          <div className="relative">
            <input
              id="login-password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-base outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
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
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          aria-label="Iniciar sesión con tu correo y contraseña"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple py-4 text-base font-semibold text-purple-foreground shadow transition-colors hover:bg-purple/90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          Iniciar sesión
        </button>
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link to="/register" aria-label="Ir a la pantalla de registro" className="font-semibold text-purple hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
      <button
        type="button"
        onClick={() =>
          speak(
            "Pantalla de inicio de sesión. Escribe tu correo electrónico y tu contraseña. Luego pulsa el botón Iniciar sesión. Si no tienes cuenta, abajo encontrarás un enlace para registrarte.",
          )
        }
        aria-label="Escuchar instrucciones de la pantalla de inicio de sesión"
        className="flex items-center justify-center gap-3 border-t border-border bg-navy px-4 py-4 text-navy-foreground hover:bg-navy/90"
      >
        <Volume2 className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Escuchar</span>
      </button>
    </div>
  );
}
