import type { DailyBudget } from "@/application/ports";

/** Tests every DailyBudget implementation must pass. */
export function dailyBudgetContract(create: () => Promise<DailyBudget>) {
  let budget: DailyBudget;

  beforeEach(async () => {
    budget = await create();
  });

  it("allows uses up to the day's maximum and then denies them", async () => {
    const uses = [];
    for (let i = 0; i < 4; i += 1) uses.push(await budget.consume("prefetch", 3));

    expect(uses).toEqual([true, true, true, false]);
  });

  it("keeps a separate count for each reason", async () => {
    await budget.consume("prefetch", 1);

    expect(await budget.consume("other", 1)).toBe(true);
    expect(await budget.consume("prefetch", 1)).toBe(false);
  });

  it("with a maximum of 0 allows no use", async () => {
    expect(await budget.consume("prefetch", 0)).toBe(false);
  });

  it("adds amounts without a cap and summarizes today's usage by reason", async () => {
    await budget.add("tokens:model-a", 1_200);
    await budget.add("tokens:model-a", 800);
    await budget.consume("prefetch", 5);

    expect(await budget.usageToday()).toEqual({ prefetch: 1, "tokens:model-a": 2_000 });
  });

  it("does not go over the maximum even when asked many times at once", async () => {
    const uses = await Promise.all(Array.from({ length: 10 }, () => budget.consume("prefetch", 4)));

    expect(uses.filter(Boolean)).toHaveLength(4);
  });
}
