import { expect, test } from "@playwright/test";

test("the home page answers and starts from the first topic", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/qu[eé] es el c[aá]ncer/i, { timeout: 20_000 });
  await expect(page.getByRole("search")).toBeVisible();
});
