import { useMemo, useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, Trash2, Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useReacciones,
  useToggleReaccion,
  useRespuestas,
  useCrearRespuesta,
  useEliminarRespuesta,
} from "@/hooks/use-resena-interacciones";
import { speak } from "@/lib/speech";

export function ResenaInteracciones({
  lugarId,
  resenaId,
  autorResena,
}: {
  lugarId: string;
  resenaId: string;
  autorResena: string;
}) {
  const { user } = useAuth();
  const { data: reacciones } = useReacciones(lugarId, [resenaId]);
  const { data: respuestas } = useRespuestas(lugarId, [resenaId]);
  const toggle = useToggleReaccion(lugarId);
  const crear = useCrearRespuesta(lugarId);
  const eliminar = useEliminarRespuesta(lugarId);

  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { likes, dislikes, miReaccion } = useMemo(() => {
    const list = reacciones ?? [];
    return {
      likes: list.filter((r) => r.tipo === "like").length,
      dislikes: list.filter((r) => r.tipo === "dislike").length,
      miReaccion: list.find((r) => r.es_mia)?.tipo ?? null,
    };
  }, [reacciones, user?.id]);

  const respuestasDeEsta = (respuestas ?? []).filter((r) => r.resena_id === resenaId);

  function reaccionar(tipo: "like" | "dislike") {
    if (!user) {
      speak("Inicia sesión para reaccionar.");
      return;
    }
    toggle.mutate({ resenaId, userId: user.id, tipo, actual: miReaccion });
    speak(
      miReaccion === tipo
        ? "Reacción quitada"
        : tipo === "like"
        ? "Me gusta marcado"
        : "No me gusta marcado",
    );
  }

  function enviarRespuesta(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = texto.trim();
    if (t.length < 2) {
      setError("Escribe al menos 2 caracteres.");
      return;
    }
    if (t.length > 600) {
      setError("Máximo 600 caracteres.");
      return;
    }
    if (!user) return;
    const nombre = (user.email?.split("@")[0] || "Visitante").slice(0, 60);
    crear.mutate(
      { resenaId, userId: user.id, autor: nombre, comentario: t },
      {
        onSuccess: () => {
          setTexto("");
          speak("Respuesta publicada.");
        },
        onError: (err) => setError((err as Error).message),
      },
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => reaccionar("like")}
          aria-pressed={miReaccion === "like"}
          aria-label={`Me gusta la reseña de ${autorResena}. ${likes} me gusta${likes === 1 ? "" : "s"}.`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple ${
            miReaccion === "like"
              ? "border-purple bg-purple text-purple-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{likes}</span>
        </button>
        <button
          type="button"
          onClick={() => reaccionar("dislike")}
          aria-pressed={miReaccion === "dislike"}
          aria-label={`No me gusta la reseña de ${autorResena}. ${dislikes} no me gusta${dislikes === 1 ? "" : "s"}.`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple ${
            miReaccion === "dislike"
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{dislikes}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto((v) => !v);
            speak(abierto ? "Respuestas ocultas" : "Mostrando respuestas");
          }}
          aria-expanded={abierto}
          aria-controls={`respuestas-${resenaId}`}
          aria-label={`${abierto ? "Ocultar" : "Ver"} respuestas (${respuestasDeEsta.length})`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted focus:outline-none focus:ring-2 focus:ring-purple"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{respuestasDeEsta.length} respuesta{respuestasDeEsta.length === 1 ? "" : "s"}</span>
        </button>
      </div>

      {abierto && (
        <div id={`respuestas-${resenaId}`} className="mt-3 space-y-2">
          <ul aria-label={`Respuestas a la reseña de ${autorResena}`} className="space-y-2">
            {respuestasDeEsta.length === 0 && (
              <li className="text-xs text-muted-foreground">Aún no hay respuestas.</li>
            )}
            {respuestasDeEsta.map((r) => {
              const fecha = new Date(r.created_at).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "short",
              });
              const esMia = !!user && r.es_mia;
              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-border bg-background p-3"
                  aria-label={`Respuesta de ${r.autor || "Visitante"} el ${fecha}: ${r.comentario}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{r.autor || "Visitante"}</p>
                    <p className="text-[10px] text-muted-foreground">{fecha}</p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-xs">{r.comentario}</p>
                  {esMia && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("¿Eliminar tu respuesta?")) eliminar.mutate(r.id);
                      }}
                      disabled={eliminar.isPending}
                      aria-label="Eliminar mi respuesta"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline disabled:opacity-60"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" /> Eliminar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {user ? (
            <form
              onSubmit={enviarRespuesta}
              aria-label={`Responder a la reseña de ${autorResena}`}
              className="mt-2"
            >
              <label htmlFor={`respuesta-${resenaId}`} className="sr-only">
                Tu respuesta
              </label>
              <textarea
                id={`respuesta-${resenaId}`}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={2}
                maxLength={600}
                aria-required="true"
                placeholder="Escribe una respuesta…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple"
              />
              {error && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={crear.isPending}
                aria-label="Publicar respuesta"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-purple px-3 py-2 text-xs font-semibold text-purple-foreground hover:bg-purple/90 disabled:opacity-60"
              >
                {crear.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Responder
              </button>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground">
              Inicia sesión para responder a esta reseña.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
