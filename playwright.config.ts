import { defineConfig, devices } from "@playwright/test";

const enCI = Boolean(process.env.CI);
const urlBase = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: enCI,
  retries: enCI ? 1 : 0,
  reporter: enCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: urlBase, trace: "on-first-retry" },
  // El público objetivo usa sobre todo celulares: se prueba en un perfil móvil.
  projects: [{ name: "movil", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: enCI ? "npm run start" : "npm run dev",
    url: urlBase,
    reuseExistingServer: !enCI,
    timeout: 120_000,
  },
});
