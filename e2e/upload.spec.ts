import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const SAMPLE_PDF = fileURLToPath(new URL("./fixtures/sample-article.pdf", import.meta.url));

test("the team uploads a PDF article and the Reader Agent gets it ready", async ({ page }) => {
  await page.goto("/upload");

  await page.getByLabel("Clave del equipo").fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByLabel("Elegir artículos (PDF)").setInputFiles(SAMPLE_PDF);

  // The test database may keep the article from a previous run.
  await expect(
    page.getByText(/sample-article\.pdf:\s*(Subido\. Queda en espera de lectura\.|Este artículo ya se había subido\.)/),
  ).toBeVisible();
  const article = page
    .getByRole("list", { name: "Artículos subidos" })
    .getByRole("listitem")
    .filter({ hasText: "sample-article" });
  await expect(article).toHaveCount(1);
  await expect(article).toContainText("Listo", { timeout: 20_000 });
});

test("without the right password there is no access", async ({ page }) => {
  await page.goto("/upload");

  await page.getByLabel("Clave del equipo").fill("wrong-password");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("La clave no es correcta.")).toBeVisible();
  await expect(page.getByLabel("Elegir artículos (PDF)")).toHaveCount(0);
});

test("the team turns an article off and on, and deletes it after confirming", async ({ page, request }) => {
  await request.post("/api/session", { data: { password: process.env.ADMIN_PASSWORD } });
  await request.post("/api/documents", { data: { title: "para-borrar-e2e", text: "Texto de prueba sobre células. ".repeat(20) } });
  await page.goto("/upload");
  await page.getByLabel("Clave del equipo").fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  const article = page.getByRole("listitem").filter({ hasText: "para-borrar-e2e" });
  const toggle = article.getByRole("switch", { name: "Usar «para-borrar-e2e» en la página" });
  // While it is being read, its controls wait.
  await expect(article).toContainText("Listo", { timeout: 20_000 });

  await toggle.click();
  // In development the first request to a route compiles it: it may take a few seconds.
  await expect(article).toContainText("Apagado: el agente no lo usa en la página.", { timeout: 20_000 });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true", { timeout: 20_000 });

  await article.getByRole("button", { name: "Eliminar" }).click();
  await article.getByRole("button", { name: "Sí, eliminar" }).click();
  await expect(article).toHaveCount(0, { timeout: 20_000 });
});
