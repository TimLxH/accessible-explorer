import { createServerFn } from "@tanstack/react-start";

// Sarah - cálida y serena
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .inputValidator((data: { text: string }) => {
    if (!data || typeof data.text !== "string") throw new Error("text required");
    const text = data.text.trim().slice(0, 2000);
    if (!text) throw new Error("empty text");
    return { text };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ElevenLabs no está conectado");

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8,
            style: 0.15,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`TTS falló (${res.status}): ${err.slice(0, 200)}`);
    }

    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return { audio: base64, mime: "audio/mpeg" };
  });
