import { expect, test } from "@playwright/test";

const ARTICULO =
  "Estudio sobre las celulas del cuerpo humano. Las celulas se dividen y se renuevan de forma ordenada. " +
  "Cuando ese orden se pierde, algunas celulas crecen sin control y forman un tumor. ".repeat(8);

test("el Presentador arma la página de un tema a partir de un artículo leído", async ({ page, request }) => {
  // Prepara el conocimiento por la API (no depende del orden de las demás pruebas).
  await request.post("/api/sesion", { data: { clave: process.env.ADMIN_CLAVE } });
  const subida = await request.post("/api/documentos", { data: { titulo: "celulas-e2e", texto: ARTICULO } });
  const { documento } = await subida.json();
  for (let paso = 0; paso < 10; paso += 1) {
    const { tipo } = await (await request.post(`/api/documentos/${documento.id}/paso`)).json();
    if (tipo === "listo") break;
  }

  await page.goto("/tema/celulas");

  await expect(page.getByText("Consulta a un profesional de salud")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("region", { name: "Fuentes", exact: true })).toBeVisible();
});

test("un tema sin información lo dice con amabilidad", async ({ page }) => {
  await page.goto("/tema/astronomia-de-saturno");

  await expect(page.getByText(/Todavía no tenemos información sobre «astronomia de saturno»/)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
});

test("la pregunta libre lleva a la página de ese tema", async ({ page }) => {
  await page.goto("/tema/astronomia-de-saturno");

  await page.getByLabel("¿Qué más quieres saber?").fill("Planetas del sistema solar");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page).toHaveURL(/\/tema\/planetas-del-sistema-solar$/);
});
