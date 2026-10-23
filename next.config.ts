import type { NextConfig } from "next";

const inProduction = process.env.NODE_ENV === "production";

/**
 * Content policy: everything is served from the site itself (the AI is called from the
 * server, never from the browser). Next.js needs inline scripts and styles to hydrate the
 * page; in development it also uses eval, so the policy only applies in production.
 */
const contentPolicy = [
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

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(inProduction ? [{ key: "Content-Security-Policy", value: contentPolicy }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Unstable rural connections: if the signal drops while navigating, Next.js retries
    // only when it comes back, and useOffline lets the page tell the person what is happening.
    useOffline: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The service worker is always asked for again, so a new version reaches every phone.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
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
