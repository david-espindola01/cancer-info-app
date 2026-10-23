import { expect, test } from "@playwright/test";

/**
 * JavaScript (compressed, as it travels over the network) a phone downloads when opening a
 * topic page. On a slow 3G network, every 100 KB is ~1 s more of waiting.
 * It was ~234 KB while Hashbrown rendered the page in the browser; since the page is checked
 * and rendered on the server it is ~140 KB (Next.js and React). The margin is for the
 * route trail and «Mis temas», which are small client components.
 */
const JS_BUDGET_KB = 160;

test("a topic page downloads little JavaScript", async ({ page }) => {
  test.skip(!process.env.CI, "Only measured against the production build (in CI)");
  const sizes: Promise<number>[] = [];
  page.on("requestfinished", (request) => {
    if (request.resourceType() === "script") {
      sizes.push(request.sizes().then((size) => size.responseBodySize));
    }
  });

  await page.goto("/topic/no-information-test");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");

  const kilobytes = (await Promise.all(sizes)).reduce((total, bytes) => total + bytes, 0) / 1024;
  console.info(`JavaScript downloaded: ${kilobytes.toFixed(1)} KB`);
  expect(kilobytes).toBeLessThanOrEqual(JS_BUDGET_KB);
});
