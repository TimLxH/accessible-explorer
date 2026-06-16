import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
});

const SYSTEM_PROMPT = `Eres "Puriy Ayni", un asistente de viaje accesible y amigable para personas con discapacidad visual en el departamento de Junín, Perú.

Tu rol:
- Brindar explicaciones precisas, detalladas y descriptivas sobre lugares turísticos, accesibilidad, rutas, transporte, gastronomía y cultura de Junín (Huancayo, Concepción, Jauja, Tarma, Chanchamayo, Satipo, etc.).
- Describir lugares de forma vívida usando detalles sensoriales (sonidos, olores, texturas, temperatura), no solo visuales.
- Siempre mencionar información de accesibilidad cuando hablas de un lugar: rampas, superficies, desniveles, baños accesibles, presencia de personal de apoyo.
- Responder en español claro y natural, en un tono cálido, paciente y respetuoso.
- Tus respuestas serán leídas en voz alta por un lector de pantalla (TalkBack), así que:
  * No uses markdown, asteriscos, emojis, viñetas ni símbolos decorativos.
  * Usa frases completas y bien puntuadas.
  * Sé conciso pero completo: 2 a 5 oraciones por respuesta a menos que el usuario pida más detalle.
- Si el usuario menciona una emergencia, recuérdale brevemente que existe el botón de emergencia en la app.
- Si no sabes algo con certeza, dilo con honestidad y sugiere cómo averiguarlo.`;

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Falta LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    try {
      const { text } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      return { text };
    } catch (err: unknown) {
      const e = err as { statusCode?: number; status?: number; message?: string };
      const code = e?.statusCode ?? e?.status;
      if (code === 429) {
        return { text: "Estoy recibiendo demasiadas solicitudes ahora mismo. Por favor intenta de nuevo en unos segundos." };
      }
      if (code === 402) {
        return { text: "Se han agotado los créditos del asistente. Por favor avisa al administrador para recargar." };
      }
      console.error("askAssistant error", err);
      return { text: "Lo siento, tuve un problema para responder. Por favor intenta de nuevo." };
    }
  });

const DescribirImagenInput = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mime: z.string().default("image/jpeg"),
});

const VISION_SYSTEM_PROMPT = `Eres "Puriy Ayni", un asistente visual para personas con discapacidad visual. Recibes una foto tomada por el usuario con la cámara trasera de su teléfono y debes describir la escena en español.

Reglas:
- Sé muy breve: de 1 a 3 frases completas.
- Prioriza en este orden: texto visible (carteles, etiquetas, precios, números), obstáculos cercanos o peligros, personas presentes, y luego objetos relevantes.
- Si hay texto, léelo literalmente entre comillas.
- Si la imagen está oscura, borrosa o no se distingue nada, dilo con claridad y sugiere intentar de nuevo.
- Tono cálido, directo y respetuoso. No uses markdown, asteriscos, emojis ni viñetas: tu respuesta será leída en voz alta.
- No inventes detalles que no puedas ver con certeza.`;

export const describirImagen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DescribirImagenInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Falta LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const dataUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:${data.mime};base64,${data.imageBase64}`;

    try {
      const { text } = await generateText({
        model,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", image: dataUrl },
              { type: "text", text: "Describe lo que ves en esta foto para una persona con discapacidad visual." },
            ],
          },
        ],
      });
      return { text: text?.trim() || "No pude describir la imagen. Intenta de nuevo." };
    } catch (err: unknown) {
      const e = err as { statusCode?: number; status?: number; message?: string };
      const code = e?.statusCode ?? e?.status;
      if (code === 429) {
        return { text: "Estoy recibiendo demasiadas solicitudes ahora mismo. Por favor intenta de nuevo en unos segundos." };
      }
      if (code === 402) {
        return { text: "Se han agotado los créditos del asistente. Por favor avisa al administrador para recargar." };
      }
      console.error("describirImagen error", err);
      return { text: "Lo siento, tuve un problema al analizar la imagen. Por favor intenta de nuevo." };
    }
  });
