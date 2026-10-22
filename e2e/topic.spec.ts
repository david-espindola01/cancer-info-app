import { expect, test } from "@playwright/test";

const ARTICLE =
  "Estudio sobre las celulas del cuerpo humano. Las celulas se dividen y se renuevan de forma ordenada. " +
  "Cuando ese orden se pierde, algunas celulas crecen sin control y forman un tumor. ".repeat(8);

test("the Presenter builds a topic's page from an article that was read", async ({ page, request }) => {
  // Prepares the knowledge through the API (it does not depend on the order of the other tests).
  await request.post("/api/session", { data: { password: process.env.ADMIN_PASSWORD } });
  const upload = await request.post("/api/documents", { data: { title: "celulas-e2e", text: ARTICLE } });
  const { document } = await upload.json();
  for (let step = 0; step < 10; step += 1) {
    const { kind } = await (await request.post(`/api/documents/${document.id}/step`)).json();
    if (kind === "ready") break;
  }

  await page.goto("/topic/celulas");

  await expect(page.getByText("Consulta a un profesional de salud")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("region", { name: "Fuentes", exact: true })).toBeVisible();
});

test("a topic without information says so kindly", async ({ page }) => {
  await page.goto("/topic/astronomia-de-saturno");

  await expect(page.getByText(/Todavía no tenemos información sobre «astronomia de saturno»/)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
});

test("the free question leads to that topic's page", async ({ page }) => {
  await page.goto("/topic/astronomia-de-saturno");

  await page.getByLabel("¿Qué más quieres saber?").fill("Planetas del sistema solar");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page).toHaveURL(/\/topic\/planetas-del-sistema-solar$/);
});
