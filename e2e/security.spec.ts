import { expect, test } from "@playwright/test";

test("pages carry the security headers", async ({ request }) => {
  const response = await request.get("/upload");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  if (process.env.CI) {
    // CI tests the production build, which also carries the content policy.
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  }
});

test("the team's routes do not answer without a session", async ({ request }) => {
  expect((await request.get("/api/documents")).status()).toBe(401);
  expect((await request.post("/api/documents", { data: { title: "x", text: "y" } })).status()).toBe(401);
  expect((await request.post("/api/documents/00000000-0000-0000-0000-000000000000/step")).status()).toBe(401);
});

test("a topic with SQL characters is treated as plain text", async ({ page }) => {
  const response = await page.goto("/topic/x'%3B%20drop%20table%20pages%3B--");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
});
