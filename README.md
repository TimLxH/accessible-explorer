# Turismo Sin Barreras

Single Page Application (SPA) de turismo accesible construida con **React 19**, **TanStack Router/Start**, **Tailwind CSS v4** y **TypeScript**.

## Características

- Página de bienvenida con identidad visual (azul marino + púrpura).
- Autenticación simulada (Login / Registro).
- Dashboard con accesos rápidos a las funciones principales.
- Explorar destinos con búsqueda y filtros por categoría.
- Detalle de sitio con secciones expandibles (historia, info, accesibilidad).
- Navegación guiada simulada con mapa decorativo.
- Asistente virtual con interfaz de chat.
- Lugares cercanos, favoritos e historial.
- Página de emergencia con acciones rápidas.
- Configuración de accesibilidad (voz, contraste, idioma, etc.).

## Stack

- React 19 + TypeScript
- TanStack Router (file-based) + TanStack Start
- Tailwind CSS v4 con tokens semánticos (`src/styles.css`)
- Lucide React (iconografía)

## Estructura

```
src/
├── components/        # Componentes reutilizables (AppShell, SiteCard, ListenBar)
├── lib/               # Datos mock y utilidades
├── routes/            # Rutas (file-based, ver TanStack Router)
└── styles.css         # Design system (colores, fuentes)
```

## Desarrollo

```bash
bun install
bun run dev
```

> Los botones de "Escuchar" y el asistente de voz son visuales; no hay síntesis ni backend reales.
