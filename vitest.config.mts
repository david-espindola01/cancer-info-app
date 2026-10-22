import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Carga .env.local (p. ej. DATABASE_URL_PRUEBAS) sin pisar variables ya definidas, como las de CI.
for (const [clave, valor] of Object.entries(loadEnv("test", process.cwd(), ""))) {
  process.env[clave] ??= valor;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unidad",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integracion",
          environment: "node",
          include: ["src/**/*.int.test.ts"],
          globalSetup: ["./src/pruebas/preparar-bd.ts"],
          // Todas las pruebas comparten una sola base de datos.
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        // Utilidades compartidas de las pruebas.
        "src/pruebas/**",
        // El layout raíz solo arma <html>/<body>; lo cubren las pruebas e2e.
        "src/app/layout.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        "src/dominio/**": { lines: 90, functions: 90, branches: 90, statements: 90 },
        "src/aplicacion/**": { lines: 90, functions: 90, branches: 90, statements: 90 },
      },
    },
  },
});
