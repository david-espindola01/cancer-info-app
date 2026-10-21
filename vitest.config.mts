import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // El layout raíz solo arma <html>/<body>; lo cubren las pruebas e2e.
      exclude: ["src/**/*.test.{ts,tsx}", "src/app/layout.tsx"],
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
