import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Volume2, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Crear cuenta — Turismo Sin Barreras" }] }),
  component: Register,
});

function Register() {
  const [show, setShow] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-navy px-6 pb-10 pt-12 text-navy-foreground">
        <Link to="/" className="text-sm text-white/70 hover:text-white">← Volver</Link>
        <h1 className="mt-4 text-3xl font-extrabold">Crear cuenta</h1>
        <p className="mt-1 text-white/70">Únete y comienza a explorar sin barreras</p>
      </div>
      <form
        onSubmit={onSubmit}
        className="mx-auto -mt-6 w-full max-w-md flex-1 space-y-5 rounded-t-3xl bg-card p-6 pt-8 shadow-sm sm:rounded-3xl sm:p-8"
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre completo</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="María Pérez"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Correo electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Contraseña</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              aria-label="Mostrar contraseña"
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-purple" />
          <span>Acepto los términos y la política de privacidad</span>
        </label>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple py-4 text-base font-semibold text-purple-foreground shadow hover:bg-purple/90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          Crear cuenta
        </button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-purple hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
      <button className="flex items-center justify-center gap-3 border-t border-border bg-navy px-4 py-3 text-navy-foreground">
        <Volume2 className="h-5 w-5" />
        <span className="text-sm font-medium">Escuchar</span>
      </button>
    </div>
  );
}
