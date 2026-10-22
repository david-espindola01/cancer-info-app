import type { RateLimiter } from "@/application/ports";

/** In-memory implementation for tests (same contract as the Postgres one). */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  async allow(key: string, max: number, windowSeconds: number) {
    if (max <= 0) return false;
    const current = this.windows.get(key);
    if (!current || this.now() - current.start >= windowSeconds * 1000) {
      this.windows.set(key, { start: this.now(), count: 1 });
      return true;
    }
    if (current.count >= max) return false;
    current.count += 1;
    return true;
  }
}
