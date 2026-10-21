import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const PDF_PRUEBA = fileURLToPath(new URL("./fixtures/articulo-prueba.pdf", import.meta.url));

test("el equipo inicia sesión y sube un artículo en PDF", async ({ page }) => {
  await page.goto("/subir");

  await page.getByLabel("Clave del equipo").fill(process.env.ADMIN_CLAVE ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByLabel("Elegir artículos (PDF)").setInputFiles(PDF_PRUEBA);

  // La base de pruebas puede conservar el artículo de una corrida anterior.
  await expect(
    page.getByText(/articulo-prueba\.pdf:\s*(Subido\. Queda en espera de lectura\.|Este artículo ya se había subido\.)/),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Artículos subidos" }).getByRole("listitem").filter({ hasText: "articulo-prueba" }),
  ).toHaveCount(1);
});

test("sin la clave correcta no se accede", async ({ page }) => {
  await page.goto("/subir");

  await page.getByLabel("Clave del equipo").fill("clave-incorrecta");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("La clave no es correcta.")).toBeVisible();
  await expect(page.getByLabel("Elegir artículos (PDF)")).toHaveCount(0);
});
