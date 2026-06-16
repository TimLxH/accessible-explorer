import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Trash2, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useResenas,
  useCrearResena,
  useEliminarResena,
} from "@/hooks/use-resenas";
import { ResenaInteracciones } from "@/components/resena-interacciones";
import { speak } from "@/lib/speech";

function Estrellas({
  value,
  onChange,
  readonly = false,
  size = 24,
  label,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
  label?: string;
}) {
  return (
    <div
      role={readonly ? "img" : "radiogroup"}
      aria-label={label ?? `Calificación ${value} de 5 estrellas`}
      className="flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        if (readonly) {
          return (
            <Star
              key={n}
              aria-hidden="true"
              style={{ width: size, height: size }}
              className={filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}
            />
          );
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            onClick={() => onChange?.(n)}
            className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-purple"
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ResenasSection({
  lugarId,
  lugarTitulo,
}: {
  lugarId: string;
  lugarTitulo: string;
}) {
  const { user } = useAuth();
  const { data: resenas, isLoading } = useResenas(lugarId);
  const crear = useCrearResena(lugarId);
  const eliminar = useEliminarResena(lugarId);

  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [autor, setAutor] = useState("");
  const [error, setError] = useState<string | null>(null);

  const total = resenas?.length ?? 0;
  const promedio =
    total > 0
      ? (resenas!.reduce((a, r) => a + r.calificacion, 0) / total).toFixed(1)
      : "0.0";

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const texto = comentario.trim();
    const nombre = (autor.trim() || user?.email?.split("@")[0] || "Visitante").slice(0, 60);
    if (texto.length < 3) {
      setError("Escribe un comentario de al menos 3 caracteres.");
      return;
    }
    if (texto.length > 1000) {
      setError("El comentario no puede superar 1000 caracteres.");
      return;
    }
    if (!user) return;
    crear.mutate(
      { userId: user.id, autor: nombre, calificacion, comentario: texto },
      {
        onSuccess: () => {
          setComentario("");
          setCalificacion(5);
          speak("Reseña publicada. Gracias por compartir tu experiencia.");
        },
        onError: (err) => setError((err as Error).message),
      },
    );
  }

  return (
    <section aria-labelledby="resenas-titulo" className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h3 id="resenas-titulo" className="text-xl font-bold">
          Reseñas y recomendaciones
        </h3>
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-label={`Promedio ${promedio} de 5 basado en ${total} reseñas`}
        >
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
          <span className="font-semibold text-foreground">{promedio}</span>
          <span>({total})</span>
        </div>
      </div>

      {user ? (
        <form
          onSubmit={enviar}
          aria-label={`Formulario para dejar una reseña sobre ${lugarTitulo}`}
          className="mt-4 rounded-2xl border border-border bg-card p-4"
        >
          <label className="block text-sm font-semibold" htmlFor="resena-autor">
            Nombre (opcional)
          </label>
          <input
            id="resena-autor"
            type="text"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            maxLength={60}
            placeholder={user.email?.split("@")[0] ?? "Visitante"}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple"
          />

          <div className="mt-3">
            <span className="block text-sm font-semibold" id="resena-cal-label">
              Tu calificación
            </span>
            <div aria-labelledby="resena-cal-label" className="mt-1">
              <Estrellas
                value={calificacion}
                onChange={(v) => {
                  setCalificacion(v);
                  speak(`${v} ${v === 1 ? "estrella" : "estrellas"}`);
                }}
                label={`Selecciona una calificación, actualmente ${calificacion} de 5`}
              />
            </div>
          </div>

          <label htmlFor="resena-comentario" className="mt-3 block text-sm font-semibold">
            Tu comentario o recomendación
          </label>
          <textarea
            id="resena-comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={1000}
            rows={4}
            required
            aria-required="true"
            aria-describedby="resena-help"
            placeholder="Cuéntale a otros visitantes cómo fue tu experiencia, qué recomiendas y la accesibilidad del lugar."
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple"
          />
          <p id="resena-help" className="mt-1 text-xs text-muted-foreground">
            {comentario.length}/1000 caracteres
          </p>

          {error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={crear.isPending}
            aria-label={`Publicar reseña sobre ${lugarTitulo}`}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-purple px-4 py-3 text-sm font-semibold text-purple-foreground shadow hover:bg-purple/90 disabled:opacity-60"
          >
            {crear.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            )}
            Publicar reseña
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="text-muted-foreground">
            Inicia sesión para dejar tu reseña y recomendación de este lugar.
          </p>
          <Link
            to="/login"
            aria-label="Inicia sesión para dejar una reseña"
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-purple px-4 py-3 text-sm font-semibold text-purple-foreground shadow hover:bg-purple/90"
          >
            Iniciar sesión
          </Link>
        </div>
      )}

      <ul aria-label="Lista de reseñas" className="mt-5 space-y-3">
        {isLoading && (
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando reseñas…
          </li>
        )}
        {!isLoading && total === 0 && (
          <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Aún no hay reseñas. ¡Sé la primera persona en compartir tu experiencia!
          </li>
        )}
        {resenas?.map((r) => {
          const fecha = new Date(r.created_at).toLocaleDateString("es-PE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const esMia = !!user && r.es_mia;
          return (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-card p-4"
              aria-label={`Reseña de ${r.autor || "Visitante"}, ${r.calificacion} de 5 estrellas, publicada el ${fecha}. ${r.comentario}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.autor || "Visitante"}</p>
                  <p className="text-xs text-muted-foreground">{fecha}</p>
                </div>
                <Estrellas value={r.calificacion} readonly size={18} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {r.comentario}
              </p>
              {esMia && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Eliminar tu reseña?")) eliminar.mutate(r.id);
                  }}
                  disabled={eliminar.isPending}
                  aria-label="Eliminar mi reseña"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Eliminar
                </button>
              )}
              <ResenaInteracciones
                lugarId={lugarId}
                resenaId={r.id}
                autorResena={r.autor || "Visitante"}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
