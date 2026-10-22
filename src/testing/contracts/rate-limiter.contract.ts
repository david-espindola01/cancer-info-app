import type { RateLimiter } from "@/application/ports";

/** Tests every RateLimiter implementation must pass. */
export function rateLimiterContract(create: () => Promise<RateLimiter>) {
  let limiter: RateLimiter;

  beforeEach(async () => {
    limiter = await create();
  });

  it("allows up to the maximum within the window and then denies", async () => {
    const answers = [];
    for (let i = 0; i < 4; i += 1) answers.push(await limiter.allow("visitor-a", 3, 600));

    expect(answers).toEqual([true, true, true, false]);
  });

  it("keeps a separate count for each key", async () => {
    await limiter.allow("visitor-a", 1, 600);

    expect(await limiter.allow("visitor-b", 1, 600)).toBe(true);
    expect(await limiter.allow("visitor-a", 1, 600)).toBe(false);
  });

  it("with a maximum of 0 allows nothing", async () => {
    expect(await limiter.allow("visitor-a", 0, 600)).toBe(false);
  });

  it("does not go over the maximum with many simultaneous requests", async () => {
    const answers = await Promise.all(Array.from({ length: 8 }, () => limiter.allow("visitor-a", 3, 600)));

    expect(answers.filter(Boolean)).toHaveLength(3);
  });
}
