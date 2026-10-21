import { defineConfig, devices } from "@playwright/test";

// En local, la clave y las URLs de base de datos vienen de .env.local; en CI, del workflow.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local (por ejemplo, en CI).
}

const enCI = Boolean(process.env.CI);
const urlBase = "http://localhost:3000";

// El servidor de las pruebas usa la base exclusiva de pruebas (nunca la de desarrollo)
// y el proveedor LLM falso (no gasta cuota de Groq).
const entornoServidor = Object.fromEntries(
  Object.entries({ ...process.env, DATABASE_URL: process.env.DATABASE_URL_PRUEBAS, LLM_PROVEEDOR: "falso" }).filter(
    (par): par is [string, string] => par[1] !== undefined,
  ),
);

export default defineConfig({
  testDir: "./e2e",
  // La primera visita a cada página compila en modo desarrollo y puede tardar.
  timeout: 60_000,
  forbidOnly: enCI,
  retries: enCI ? 1 : 0,
  // Las pruebas comparten la base de datos de pruebas.
  workers: 1,
  reporter: enCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: urlBase, trace: "on-first-retry" },
  // El público objetivo usa sobre todo celulares: se prueba en un perfil móvil.
  projects: [{ name: "movil", use: { ...devices["Pixel 7"] } }],
  webServer: {
    // En CI el build ya aplicó las migraciones; en local se aplican antes de arrancar.
    command: enCI ? "npm run start" : "node scripts/migrar.mjs && npm run dev",
    url: urlBase,
    env: entornoServidor,
    reuseExistingServer: !enCI,
    timeout: 120_000,
  },
});
