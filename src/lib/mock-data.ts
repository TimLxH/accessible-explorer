// Datos estáticos retirados: la app ahora consume el backend FastAPI vía src/lib/api.ts.
// Solo permanecen aquí datos locales auxiliares (historial de navegación y mensajes
// iniciales del asistente) que no provienen del backend.

export const history = [
  { id: "h1", title: "Torre Torre", date: "13 jun 2026", time: "10:24" },
  { id: "h2", title: "Laguna de Paca", date: "08 jun 2026", time: "15:02" },
  { id: "h3", title: "Convento de Ocopa", date: "02 jun 2026", time: "11:45" },
  { id: "h4", title: "Plaza Constitución", date: "28 may 2026", time: "17:30" },
];

export const chat = [
  { id: 1, from: "assistant", text: "¡Hola! Soy tu asistente de viaje. ¿En qué puedo ayudarte?" },
  { id: 2, from: "user", text: "¿Qué lugares accesibles hay cerca?" },
  { id: 3, from: "assistant", text: "Encontré 3 lugares con accesibilidad alta a menos de 5 km: Plaza Constitución, Parque Identidad Huanca y Mirador del Cerrito de la Libertad." },
  { id: 4, from: "user", text: "Cuéntame sobre el Parque Identidad Huanca" },
  { id: 5, from: "assistant", text: "El Parque Identidad Huanca es un espacio cultural al aire libre que representa la identidad del valle del Mantaro con esculturas de personajes típicos. Cuenta con rampas y senderos accesibles." },
];
