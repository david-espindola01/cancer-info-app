import { expect, test } from "@playwright/test";

test("la página de inicio responde y parte del primer tema", async ({ page }) => {
  const respuesta = await page.goto("/");

  expect(respuesta?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/qu[eé] es el c[aá]ncer/i, { timeout: 20_000 });
  await expect(page.getByRole("search")).toBeVisible();
});
