import { expect, test } from "@playwright/test";

/* Topics without information are built without the AI: they are ready on the first visit. */
const FIRST = "/topic/astronomia-de-saturno";

async function openTopic(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
}

test("the trail shows the way and «Mis temas» remembers what was read", async ({ page }) => {
  await openTopic(page, FIRST);
  await page.getByLabel("¿Qué más quieres saber?").fill("Planetas del sistema solar");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/planetas-del-sistema-solar$/);

  const trail = page.getByRole("navigation", { name: "Tu recorrido" });
  await expect(trail.getByRole("link")).toHaveText(["Inicio", "Astronomia de saturno"]);
  await expect(trail.locator('[aria-current="page"]')).toHaveText("Planetas del sistema solar");

  await page.getByRole("link", { name: "Mis temas" }).click();
  const read = page.getByRole("region", { name: "Leídos hace poco" });
  await expect(read.getByRole("link")).toHaveText([/Planetas del sistema solar/, /Astronomia de saturno/]);
});

test("a saved page can be read without signal", async ({ page, context }) => {
  test.skip(!process.env.CI, "The service worker is only installed in the production build (in CI)");
  await openTopic(page, FIRST);
  // Waits until the service worker controls the page (it takes over as soon as it activates).
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await page.getByRole("button", { name: "⤓ Guardar para leer sin señal" }).click();
  await expect(page.getByText("✓ Guardada para leer sin señal")).toBeVisible();

  await context.setOffline(true);
  await page.goto(FIRST);
  await expect(page.getByRole("heading", { level: 1, name: "Astronomia de saturno" })).toBeVisible();

  // A page that was not kept explains it and offers the saved ones.
  await page.goto("/topic/otro-tema-sin-guardar");
  await expect(page.getByRole("heading", { name: "Sin señal" })).toBeVisible();
  await page.getByRole("link", { name: "Astronomia de saturno" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Astronomia de saturno" })).toBeVisible();
  await context.setOffline(false);
});
