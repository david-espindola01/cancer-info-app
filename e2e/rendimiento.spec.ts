import { expect, test } from "@playwright/test";

/**
 * JavaScript (comprimido, como viaja por la red) que descarga un celular al abrir una
 * página de tema. En una red 3G lenta, cada 100 KB son ~1 s más de espera.
 * Medido en la Fase 8: ~233 KB, de los cuales ~95 KB son Hashbrown con @ag-ui/core y zod
 * (que no se pueden descartar porque @ag-ui/core no declara "sideEffects": false).
 */
const PRESUPUESTO_JS_KB = 240;

test("una página de tema descarga poco JavaScript", async ({ page }) => {
  test.skip(!process.env.CI, "Solo se mide contra el build de producción (en CI)");
  const tamanos: Promise<number>[] = [];
  page.on("requestfinished", (peticion) => {
    if (peticion.resourceType() === "script") {
      tamanos.push(peticion.sizes().then((tamano) => tamano.responseBodySize));
    }
  });

  await page.goto("/tema/sin-informacion-de-prueba");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");

  const kilobytes = (await Promise.all(tamanos)).reduce((total, bytes) => total + bytes, 0) / 1024;
  console.info(`JavaScript descargado: ${kilobytes.toFixed(1)} KB`);
  expect(kilobytes).toBeLessThanOrEqual(PRESUPUESTO_JS_KB);
});
