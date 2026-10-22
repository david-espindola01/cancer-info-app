import { defineConfig, devices } from "@playwright/test";

// Locally, the password and the database URLs come from .env.local; in CI, from the workflow.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (for example, in CI).
}

const inCI = Boolean(process.env.CI);
const baseURL = "http://localhost:3000";

// The test server uses the test-only database (never the development one) and the fake
// LLM provider (it spends no Groq quota).
const serverEnvironment = Object.fromEntries(
  Object.entries({ ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL, LLM_PROVIDER: "fake" }).filter(
    (pair): pair is [string, string] => pair[1] !== undefined,
  ),
);

export default defineConfig({
  testDir: "./e2e",
  // The first visit to each page compiles in development mode and may take a while.
  timeout: 60_000,
  forbidOnly: inCI,
  retries: inCI ? 1 : 0,
  // The tests share the test database.
  workers: 1,
  reporter: inCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "on-first-retry" },
  // The target audience mostly uses phones: tests run on a mobile profile.
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    // In CI the build already applied the migrations; locally they are applied before starting.
    command: inCI ? "npm run start" : "node scripts/migrate.mjs && npm run dev",
    url: baseURL,
    env: serverEnvironment,
    reuseExistingServer: !inCI,
    timeout: 120_000,
  },
});
