import type { DailyBudget } from "@/application/ports";

/** In-memory implementation for tests (same contract as the Postgres one). */
export class InMemoryDailyBudget implements DailyBudget {
  private readonly usages = new Map<string, number>();

  constructor(private readonly today: () => string = () => new Date().toISOString().slice(0, 10)) {}

  async consume(reason: string, max: number) {
    const key = `${this.today()}|${reason}`;
    const used = this.usages.get(key) ?? 0;
    if (used >= max) return false;
    this.usages.set(key, used + 1);
    return true;
  }

  async add(reason: string, amount: number) {
    const key = `${this.today()}|${reason}`;
    this.usages.set(key, (this.usages.get(key) ?? 0) + amount);
  }

  async usageToday() {
    const prefix = `${this.today()}|`;
    return Object.fromEntries(
      [...this.usages]
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, amount]) => [key.slice(prefix.length), amount])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    );
  }
}
