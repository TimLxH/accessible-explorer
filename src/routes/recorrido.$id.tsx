import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Hand, Volume2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { speak, stopSpeaking } from "@/lib/speech";

export const Route = createFileRoute("/recorrido/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Recorrido — ${params.id}` }],
  }),
  component: Recorrido,
});

type Step =
  | "welcome"
  | "seq-1"
  | "seq-2"
  | "seq-3"
  | "seq-4"
  | "free";

type Sculpture = "mate" | "vasija" | "mujer";

const SCULPTURES: Record<Sculpture, { name: string; desc: string }> = {
  mate: {
    name: "Mate de piedra",
    desc: "El mate de piedra está a unos 3 metros frente a ti, ligeramente a la izquierda del camino. Es una pieza tallada en piedra volcánica oscura, con forma redonda y ahuecada, de aproximadamente 80 centímetros de diámetro. Representa el mate burilado tradicional del valle del Mantaro, donde se grababan escenas de la vida cotidiana y festividades wankas. Recuerda que puedes tocar las esculturas para sentir su textura y los relieves.",
  },
  vasija: {
    name: "Vasija enterrada",
    desc: "Para llegar a la vasija avanza unos 4 metros en línea recta. Es una vasija de cerámica de gran tamaño, de más de un metro de alto, semi enterrada en el suelo, simulando un hallazgo arqueológico. Su superficie es rugosa y conserva grecas geométricas típicas de la cultura Wanka prehispánica. Recuerda que puedes tocar las esculturas para sentir su textura y los relieves.",
  },
  mujer: {
    name: "Mujer con pollera",
    desc: "La escultura de la mujer con pollera se encuentra a tu derecha, a unos 5 metros. Es una figura de tamaño natural, vestida con la pollera huanca tradicional, blusa bordada, sombrero y trenzas largas. Representa a la mujer wanka del valle, símbolo de trabajo y cultura viva. Recuerda que puedes tocar las esculturas para sentir su textura y los relieves.",
  },
};

const FREE_SPOTS = [
  {
    id: "entrada",
    title: "Entrada principal",
    danger: false,
    text: "La entrada principal está al inicio del parque. Para llegar, camina recto desde la vereda hasta sentir las puertas de metal. No representa peligro, el piso es plano y de cemento.",
  },
  {
    id: "esculturas",
    title: "Esculturas de bienvenida",
    danger: false,
    text: "Para llegar a las esculturas de bienvenida ingresa por la puerta del medio y camina diez metros en línea recta. El camino es de piedra plana, seguro para caminar sin acompañante.",
  },
  {
    id: "jarrones",
    title: "Jarrones antiguos",
    danger: false,
    text: "Para los jarrones, desde las esculturas de entrada gira a la izquierda y camina veinte metros de forma circular. Hay un asiento al lado izquierdo si necesitas descansar. El camino es de piedra con vegetación a los lados.",
  },
  {
    id: "santiago",
    title: "Mujer de la danza Santiago",
    danger: true,
    text: "Atención: para llegar a la mujer de la danza Santiago hay puentes pequeños de madera sin barandas y un tramo con piedras separadas. Es peligroso si vas solo. Te recomendamos ir acompañado o regresar dándote la vuelta por la derecha.",
  },
  {
    id: "pileta",
    title: "Pileta central",
    danger: false,
    text: "La pileta central está al fondo del parque siguiendo el camino principal. Es un espacio amplio y plano, puedes acercarte y sentir el agua con la mano. Seguro para caminar sin acompañante.",
  },
  {
    id: "relieves",
    title: "Paredes con relieves",
    danger: false,
    text: "Las paredes con relieves rodean el parque. Puedes tocarlas en cualquier momento; sentirás hojas, ramas y figuras talladas en bajo relieve. Es totalmente seguro.",
  },
];

function BigButton({
  onClick,
  label,
  ariaLabel,
  variant = "primary",
  icon,
}: {
  onClick: () => void;
  label: string;
  ariaLabel: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
}) {
  const styles =
    variant === "primary"
      ? "bg-purple text-purple-foreground hover:bg-purple/90"
      : variant === "danger"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : "bg-white border-2 border-purple text-purple hover:bg-purple/5";
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-lg font-bold shadow focus:outline-none focus:ring-4 focus:ring-purple/40 ${styles}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Narration({ text }: { text: string }) {
  return (
    <p
      role="region"
      aria-live="polite"
      className="rounded-2xl border-2 border-border bg-card p-5 text-lg leading-relaxed text-foreground"
    >
      {text}
    </p>
  );
}

function StepHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-extrabold text-foreground">{children}</h2>;
}

function Recorrido() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [currentSculpture, setCurrentSculpture] = useState<Sculpture | null>(null);
  const [activeSpot, setActiveSpot] = useState<string | null>(null);
  const spokenRef = useRef<string>("");

  // Auto-speak on step change
  function autoSpeak(key: string, text: string) {
    if (spokenRef.current === key) return;
    spokenRef.current = key;
    speak(text);
  }

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  function goto(next: Step) {
    stopSpeaking();
    spokenRef.current = "";
    setCurrentSculpture(null);
    setActiveSpot(null);
    setStep(next);
  }

  // ---------- WELCOME ----------
  if (step === "welcome") {
    const welcome = "Bien, llegaste al parque de la identidad Wanka.";
    const intro =
      "Te guiaré paso a paso desde la entrada principal hasta los hitos más importantes del parque. Puedes elegir entre dos modos de recorrido. El primero es secuencial, donde te llevo de la mano por cada lugar en orden. El segundo es libre, donde tú eliges qué hito visitar.";
    autoSpeak("welcome", `${welcome} ${intro}`);
    return (
      <AppShell title="Recorrido del parque" back>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">
          <StepHeading>Bien, llegaste al parque de la identidad Wanka.</StepHeading>
          <Narration text={intro} />
          <div className="flex flex-col gap-4">
            <BigButton
              label="Recorrido Secuencial"
              ariaLabel="Botón para iniciar el recorrido secuencial guiado paso a paso por todos los hitos del parque en orden"
              onClick={() => goto("seq-1")}
              icon={<ArrowRight className="h-6 w-6" aria-hidden="true" />}
            />
            <BigButton
              label="Recorrido Libre"
              ariaLabel="Botón para iniciar el recorrido libre donde tú eliges qué hito del parque visitar"
              variant="secondary"
              onClick={() => goto("free")}
              icon={<Hand className="h-6 w-6" aria-hidden="true" />}
            />
            <BigButton
              label="Repetir explicación"
              ariaLabel="Botón para escuchar nuevamente la explicación de bienvenida y las opciones del recorrido"
              variant="secondary"
              onClick={() => speak(`${welcome} ${intro}`)}
              icon={<Volume2 className="h-6 w-6" aria-hidden="true" />}
            />
          </div>
        </div>
      </AppShell>
    );
  }

  // ---------- SEQ 1: ENTRADA PRINCIPAL ----------
  if (step === "seq-1") {
    const text =
      "La puerta principal cuenta con 3 grandes puertas, las 2 puertas de los extremos tienen aproximadamente 2.30 metros de altura y la puerta del medio con 3 metros aproximadamente, en la puerta del centro hay un arco de hojas y el nombre del parque en un cartel debajo de dicho arco. Arriba de ello hay una mujer y un varón con las vestimentas típicas de Huaylarsh. Si sigues avanzado habrá 2 carteles colocadas en las puertas de metal.";
    const carteles =
      "El primero nos especifica que la hora de atención de lunes a sábados es de 9 am hasta las 8 pm, y los domingos de 9 am a 7 pm. Y no ingresan bicicletas, skaters, mascotas, armas, bebidas alcohólicas y no tires basura. Disfrute el parque.";
    autoSpeak("seq-1", text);
    return (
      <AppShell title="Paso 1 — Entrada principal" back>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
          <StepHeading>Paso 1: Entrada principal</StepHeading>
          <div
            role="img"
            aria-label="Fotografía de la entrada principal del parque de la identidad Wanka con tres puertas grandes y un arco de hojas en el centro"
            className="grid aspect-[16/10] place-items-center rounded-2xl bg-gradient-to-br from-navy to-purple text-center text-white"
          >
            <span className="px-4 text-lg font-semibold">Entrada principal del parque</span>
          </div>
          <Narration text={text} />
          <div className="flex flex-col gap-4">
            <BigButton
              label="Escuchar el detalle de los carteles"
              ariaLabel="Botón para escuchar el detalle de los dos carteles colocados en las puertas de metal, con horarios y reglas del parque"
              variant="secondary"
              icon={<Volume2 className="h-6 w-6" aria-hidden="true" />}
              onClick={() => speak(carteles)}
            />
            <BigButton
              label="Seguir"
              ariaLabel="Botón para seguir al paso 2 del recorrido y conocer las esculturas de entrada"
              onClick={() => goto("seq-2")}
              icon={<ArrowRight className="h-6 w-6" aria-hidden="true" />}
            />
            <BigButton
              label="Repetir descripción"
              ariaLabel="Botón para repetir la descripción de la entrada principal"
              variant="secondary"
              icon={<Volume2 className="h-6 w-6" aria-hidden="true" />}
              onClick={() => speak(text)}
            />
          </div>
        </div>
      </AppShell>
    );
  }

  // ---------- SEQ 2: ESCULTURAS ----------
  if (step === "seq-2") {
    const base =
      "Delante de ti hay un mate hecho de piedra, también una vasija muy grande que parece estar enterrada y una escultura de una mujer con pollera. Elige a dónde quisieras dirigirte.";
    autoSpeak("seq-2", base);
    const sc = currentSculpture ? SCULPTURES[currentSculpture] : null;
    const order: Sculpture[] = ["mate", "vasija", "mujer"];
    const nextSculpture = (): Sculpture => {
      if (!currentSculpture) return "mate";
      const i = order.indexOf(currentSculpture);
      return order[(i + 1) % order.length];
    };
    return (
      <AppShell title="Paso 2 — Esculturas de entrada" back>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
          <StepHeading>Paso 2: Esculturas de entrada</StepHeading>
          <div
            role="img"
            aria-label="Fotografía de tres esculturas: un mate de piedra, una vasija grande semi enterrada y una mujer con pollera huanca"
            className="grid aspect-[16/10] place-items-center rounded-2xl bg-gradient-to-br from-purple to-navy text-center text-white"
          >
            <span className="px-4 text-lg font-semibold">Esculturas de bienvenida</span>
          </div>
          <Narration text={base} />
          <p className="text-xl font-bold">¿Elige a dónde quisieras dirigirte?</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {order.map((k) => (
              <BigButton
                key={k}
                label={SCULPTURES[k].name}
                ariaLabel={`Botón para escuchar la descripción detallada y cómo llegar a la escultura ${SCULPTURES[k].name}`}
                variant={currentSculpture === k ? "primary" : "secondary"}
                onClick={() => {
                  setCurrentSculpture(k);
                  speak(SCULPTURES[k].desc);
                }}
              />
            ))}
          </div>
          {sc && <Narration text={sc.desc} />}
          <div className="flex flex-col gap-4">
            <BigButton
              label="Seguir con la siguiente escultura"
              ariaLabel={`Botón para escuchar la siguiente escultura: ${SCULPTURES[nextSculpture()].name}`}
              variant="secondary"
              icon={<ArrowRight className="h-6 w-6" aria-hidden="true" />}
              onClick={() => {
                const n = nextSculpture();
                setCurrentSculpture(n);
                speak(SCULPTURES[n].desc);
              }}
            />
            <BigButton
              label="Continuar recorrido"
              ariaLabel="Botón para continuar el recorrido al paso 3 donde están los jarrones antiguos"
              onClick={() => goto("seq-3")}
              icon={<ArrowRight className="h-6 w-6" aria-hidden="true" />}
            />
          </div>
        </div>
      </AppShell>
    );
  }

  // ---------- SEQ 3: JARRONES ----------
  if (step === "seq-3") {
    const intro =
      "Delante de ti hay un conjunto de jarrones antiguos apilados al centro del parque.";
    const dirigirse =
      "Diríjase a la izquierda caminando unos 20 metros de forma circular aproximadamente, al lado izquierdo del camino habrá asiento donde pueda sentarse, considera que todos los caminos son hechos de piedra y a sus lados hay vegetación así que tómalo como ayuda, sigue el camino y llegaras a una intersección y date la vuelta hacia la derecha habrá un camino y ya llegaste a la cerámica.";
    const explica =
      "Son 5 jarrones artesanales, una encima de otra, esta está en medio de una pileta circular que también parece ser una vasija enterrada. Al lado izquierdo a unos 2 metros esta una escultura de un señor con vestimenta de Santiago sobre un soporte y debajo de este hay una guitarra que representa la música andina.";
    autoSpeak("seq-3", intro);
    return (
      <AppShell title="Paso 3 — Jarrones antiguos" back>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
          <StepHeading>Paso 3: Jarrones antiguos</StepHeading>
          <div
            role="img"
            aria-label="Fotografía de cinco jarrones de cerámica antiguos apilados uno encima del otro en medio de una pileta circular"
            className="grid aspect-[16/10] place-items-center rounded-2xl bg-gradient-to-br from-accent to-purple text-center text-white"
          >
            <span className="px-4 text-lg font-semibold">Jarrones antiguos</span>
          </div>
          <Narration text={intro} />
          <div className="flex flex-col gap-4">
            <BigButton
              label="Dirigirse a dicho lugar"
              ariaLabel="Botón para escuchar las indicaciones de cómo dirigirse caminando hasta los jarrones antiguos"
              variant="secondary"
              icon={<Volume2 className="h-6 w-6" aria-hidden="true" />}
              onClick={() => speak(dirigirse)}
            />
            <BigButton
              label="Explícame"
              ariaLabel="Botón para escuchar la descripción detallada de los jarrones antiguos y la escultura del señor con vestimenta de Santiago"
              variant="secondary"
              icon={<Volume2 className="h-6 w-6" aria-hidden="true" />}
              onClick={() => speak(explica)}
            />
            <BigButton
              label="Continuar a la siguiente escultura"
              ariaLabel="Botón para continuar al paso 4 del recorrido donde se encuentra la mujer de la danza Santiago, con advertencia de seguridad"
              onClick={() => goto("seq-4")}
              icon={<ArrowRight className="h-6 w-6" aria-hidden="true" />}
            />
          </div>
        </div>
      </AppShell>
    );
  }

  // ---------- SEQ 4: ADVERTENCIA + MUJER SANTIAGO ----------
  if (step === "seq-4") {
    const warn =
      "Advertencia. Si quiere dirigirse a la siguiente escultura por favor vaya acompañado ya que para llegar ahí hay puentes pequeños de madera sin barandas con un poco de relieve, y también hay un camino con solo piedras separadas lo que imposibilita su camino, es peligroso si va solo. Le recomendamos regresar dándose la vuelta por la derecha.";
    const describe =
      "Aquí está una mujer huancaína con el traje típico de la danza del Santiago, hay un sombrero el cual puedes tocar al igual que los relieves del monumento.";
    autoSpeak("seq-4", warn);
    return (
      <AppShell title="Paso 4 — Mujer de la danza Santiago" back>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
          <StepHeading>Paso 4: Mujer de la danza Santiago</StepHeading>
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border-4 border-destructive bg-destructive/10 p-5 text-destructive"
          >
            <AlertTriangle className="mt-1 h-7 w-7 shrink-0" aria-hidden="true" />
            <p className="text-base font-semibold leading-relaxed">{warn}</p>
          </div>
          <div
            role="img"
            aria-label="Fotografía de la escultura de una mujer huancaína con el traje típico de la danza del Santiago y un sombrero"
            className="grid aspect-[16/10] place-items-center rounded-2xl bg-gradient-to-br from-navy to-accent text-center text-white"
          >
            <span className="px-4 text-lg font-semibold">Mujer de la danza Santiago</span>
          </div>
          <div className="flex flex-col gap-4">
            <BigButton
              label="Describe"
              ariaLabel="Botón para escuchar la descripción detallada de la escultura de la mujer de la danza Santiago"
              variant="secondary"
              icon={<Volume2 className="h-6 w-6" aria-hidden="true" />}
              onClick={() => speak(describe)}
            />
            <BigButton
              label="Repetir advertencia"
              ariaLabel="Botón para repetir la advertencia de seguridad sobre los puentes sin barandas"
              variant="danger"
              icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
              onClick={() => speak(warn)}
            />
            <BigButton
              label="Finalizar recorrido"
              ariaLabel="Botón para finalizar el recorrido secuencial y volver a la pantalla de detalles del parque"
              onClick={() => {
                stopSpeaking();
                navigate({ to: "/home" });
              }}
            />
          </div>
        </div>
      </AppShell>
    );
  }

  // ---------- FREE MODE ----------
  if (step === "free") {
    const intro = "Puedes tocar las paredes, tienes relieves sobre hojas y ramas.";
    autoSpeak("free", intro);
    const spot = FREE_SPOTS.find((s) => s.id === activeSpot);
    return (
      <AppShell title="Recorrido libre" back>
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-6">
          <StepHeading>Recorrido libre</StepHeading>
          <Narration text={intro} />
          <p className="text-base text-muted-foreground">
            Elige cualquier hito turístico del parque. Tómate tu tiempo, puedes volver al
            catálogo cuando quieras.
          </p>
          <ul
            aria-label="Catálogo de hitos turísticos del parque"
            className="grid gap-4 sm:grid-cols-2"
          >
            {FREE_SPOTS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setActiveSpot(s.id);
                    speak(s.text);
                  }}
                  aria-label={`Botón para escuchar cómo llegar y la descripción de ${s.title}${s.danger ? ", incluye advertencia de peligro" : ""}`}
                  className={`flex w-full flex-col items-start gap-2 rounded-2xl border-2 p-5 text-left shadow focus:outline-none focus:ring-4 focus:ring-purple/40 ${
                    activeSpot === s.id
                      ? "border-purple bg-purple/5"
                      : "border-border bg-card hover:border-purple"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className={`grid aspect-[16/10] w-full place-items-center rounded-xl text-white ${
                      s.danger
                        ? "bg-gradient-to-br from-destructive to-navy"
                        : "bg-gradient-to-br from-purple to-navy"
                    }`}
                  >
                    <span className="px-3 text-center text-sm font-semibold">{s.title}</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{s.title}</span>
                  {s.danger && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Requiere
                      acompañante
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {spot && (
            <div className="flex flex-col gap-4 rounded-2xl border-2 border-purple bg-card p-5">
              <h3 className="text-xl font-bold">{spot.title}</h3>
              <Narration text={spot.text} />
              <div className="flex flex-col gap-3">
                <BigButton
                  label="Repetir descripción"
                  ariaLabel={`Botón para escuchar nuevamente la descripción y la ruta hacia ${spot.title}`}
                  variant="secondary"
                  icon={<Volume2 className="h-6 w-6" aria-hidden="true" />}
                  onClick={() => speak(spot.text)}
                />
                <BigButton
                  label="Continuar"
                  ariaLabel="Botón para continuar y volver al catálogo y elegir otro hito del parque"
                  onClick={() => {
                    stopSpeaking();
                    setActiveSpot(null);
                  }}
                />
              </div>
            </div>
          )}

          <BigButton
            label="Finalizar recorrido"
            ariaLabel="Botón para finalizar el recorrido libre y volver al inicio"
            variant="secondary"
            onClick={() => {
              stopSpeaking();
              navigate({ to: "/home" });
            }}
          />
        </div>
      </AppShell>
    );
  }

  return null;
}
