export type Site = {
  id: string;
  title: string;
  location: string;
  distance: string;
  category: string;
  image: string;
  description: string;
  history: string;
  info: string;
  accessibility: string;
  favorite?: boolean;
};

export const sites: Site[] = [
  {
    id: "torre-torre",
    title: "Torre Torre",
    location: "Huancayo, Junín",
    distance: "2.3 km",
    category: "Formación natural",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80",
    description:
      "Las Torre Torre son impresionantes formaciones geológicas de arcilla rojiza que se elevan como torres naturales esculpidas por la erosión del viento y la lluvia durante millones de años.",
    history:
      "Estas formaciones se originaron por la erosión diferencial sobre depósitos aluviales del Pleistoceno. Son consideradas un patrimonio geológico del valle del Mantaro.",
    info: "Altitud: 3,400 msnm. Mejor época para visitar: abril a octubre. Entrada libre.",
    accessibility:
      "Nivel medio. Senderos de tierra compactada. Se recomienda calzado adecuado. Disponibilidad parcial para sillas de ruedas en el mirador inicial.",
    favorite: true,
  },
  {
    id: "laguna-paca",
    title: "Laguna de Paca",
    location: "Jauja, Junín",
    distance: "45 km",
    category: "Lago",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    description:
      "Hermosa laguna de origen glaciar rodeada de totorales y leyendas ancestrales. Famosa por sus paseos en bote y su gastronomía a base de trucha.",
    history:
      "Según la leyenda, bajo sus aguas duerme una sirena que custodia un toro de oro. Fue un importante centro ceremonial preinca.",
    info: "Altitud: 3,418 msnm. Servicios: restaurantes, paseos en bote, mirador.",
    accessibility: "Nivel alto. Caminos pavimentados, rampas en muelle principal.",
    favorite: true,
  },
  {
    id: "convento-ocopa",
    title: "Convento de Santa Rosa de Ocopa",
    location: "Concepción, Junín",
    distance: "25 km",
    category: "Histórico",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80",
    description:
      "Convento franciscano del siglo XVIII, centro misional y cultural con una biblioteca de más de 25,000 volúmenes antiguos.",
    history:
      "Fundado en 1725 por los franciscanos como centro de evangelización de la selva central peruana.",
    info: "Horario: 9:00 - 17:00. Visitas guiadas disponibles.",
    accessibility: "Nivel medio. Algunos desniveles en patios coloniales.",
  },
  {
    id: "nevado-huaytapallana",
    title: "Nevado Huaytapallana",
    location: "Huancayo, Junín",
    distance: "32 km",
    category: "Montaña",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
    description:
      "Majestuoso nevado con lagunas turquesa, sitio ceremonial de pagos a la tierra durante el solsticio.",
    history:
      "Considerado apu sagrado por las comunidades andinas, escenario de rituales ancestrales aún vigentes.",
    info: "Altitud: 5,557 msnm. Requiere aclimatación previa.",
    accessibility: "Nivel bajo. Terreno montañoso, no apto para movilidad reducida.",
  },
];

export const nearby = [
  { id: "n1", title: "Mirador del valle", icon: "eye", distance: "120 m" },
  { id: "n2", title: "Servicios higiénicos", icon: "bath", distance: "200 m" },
  { id: "n3", title: "Restaurante La Cabaña", icon: "utensils", distance: "350 m" },
  { id: "n4", title: "Punto de información", icon: "info", distance: "410 m" },
  { id: "n5", title: "Parada de bus", icon: "bus", distance: "600 m" },
];

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
