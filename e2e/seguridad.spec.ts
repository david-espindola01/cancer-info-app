import { expect, test } from "@playwright/test";

test("las páginas llevan los encabezados de seguridad", async ({ request }) => {
  const respuesta = await request.get("/subir");
  const encabezados = respuesta.headers();

  expect(encabezados["x-content-type-options"]).toBe("nosniff");
  expect(encabezados["x-frame-options"]).toBe("DENY");
  expect(encabezados["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(encabezados["permissions-policy"]).toContain("camera=()");
  if (process.env.CI) {
    // En CI se prueba el build de producción, que además lleva la política de contenido.
    expect(encabezados["content-security-policy"]).toContain("frame-ancestors 'none'");
  }
});

test("las rutas del equipo no responden sin sesión", async ({ request }) => {
  expect((await request.get("/api/documentos")).status()).toBe(401);
  expect((await request.post("/api/documentos", { data: { titulo: "x", texto: "y" } })).status()).toBe(401);
  expect((await request.post("/api/documentos/00000000-0000-0000-0000-000000000000/paso")).status()).toBe(401);
});

test("un tema con caracteres de SQL se trata como texto común", async ({ page }) => {
  const respuesta = await page.goto("/tema/x'%3B%20drop%20table%20paginas%3B--");

  expect(respuesta?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
});
