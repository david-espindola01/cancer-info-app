# cancer-info-app

Página informativa sobre cáncer para el público general, basada **solo** en los artículos científicos que sube el equipo. Un agente lee cada PDF y escribe una memoria con lo fundamental. Otro agente usa esas memorias para armar páginas en lenguaje sencillo, con un catálogo de interfaces genéricas ([Hashbrown](https://hashbrown.dev)), y guía la lectura con palabras clave subrayadas.

**Stack**: Next.js 16 · Hashbrown 0.7 · Groq · Postgres (Neon) · Vercel

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.
