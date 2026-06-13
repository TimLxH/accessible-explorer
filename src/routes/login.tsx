import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Volume2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Turismo Sin Barreras" }] }),
  component: Login,
});

function Login() {
  const [show, setShow] = useState(false);
  const nav = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-navy px-6 pb-10 pt-12 text-navy-foreground">
        <Link to="/" className="text-sm text-white/70 hover:text-white">← Volver</Link>
        <h1 className="mt-4 text-3xl font-extrabold">Bienvenido de vuelta</h1>
        <p className="mt-1 text-white/70">Inicia sesión para continuar tu viaje</p>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); nav({ to: "/home" }); }}
        className="mx-auto -mt-6 w-full max-w-md flex-1 space-y-5 rounded-t-3xl bg-card p-6 pt-8 shadow-sm sm:rounded-3xl sm:p-8"
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Correo electrónico</label>
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Contraseña</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-base outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Ocultar" : "Mostrar"}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <a href="#" className="block text-right text-sm font-medium text-purple hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
        <button
          type="submit"
          className="w-full rounded-xl bg-purple py-4 text-base font-semibold text-purple-foreground shadow transition-colors hover:bg-purple/90"
        >
          Iniciar sesión
        </button>
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-semibold text-purple hover:underline">
            Regístrate
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
