import { expect, test } from "@playwright/test";

test("la página de inicio responde y muestra el primer tema", async ({ page }) => {
  const respuesta = await page.goto("/");

  expect(respuesta?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "¿Qué es el cáncer?" }),
  ).toBeVisible();
});
