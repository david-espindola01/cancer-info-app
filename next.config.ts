import type { NextConfig } from "next";

const enProduccion = process.env.NODE_ENV === "production";

/**
 * Política de contenido: todo se sirve desde el propio sitio (la IA se llama desde el
 * servidor, nunca desde el navegador). Next.js necesita scripts y estilos en línea para
 * hidratar la página; en desarrollo además usa eval, por eso la política es solo de producción.
 */
const politicaContenido = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const encabezadosSeguridad = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(enProduccion ? [{ key: "Content-Security-Policy", value: politicaContenido }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Conexiones rurales inestables: si la señal se cae al navegar, Next.js reintenta
    // solo cuando vuelve, y useOffline permite avisarle a la persona qué pasa.
    useOffline: true,
  },
  async headers() {
    return [{ source: "/:ruta*", headers: encabezadosSeguridad }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
