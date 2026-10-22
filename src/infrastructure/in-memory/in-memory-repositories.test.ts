import { dailyBudgetContract } from "@/testing/contracts/daily-budget.contract";
import { documentRepositoryContract } from "@/testing/contracts/document-repository.contract";
import { memoryRepositoryContract } from "@/testing/contracts/memory-repository.contract";
import { pageRepositoryContract } from "@/testing/contracts/page-repository.contract";
import { rateLimiterContract } from "@/testing/contracts/rate-limiter.contract";
import { InMemoryDailyBudget } from "./in-memory-daily-budget";
import { InMemoryDocumentRepository } from "./in-memory-document-repository";
import { InMemoryMemoryRepository } from "./in-memory-memory-repository";
import { InMemoryPageRepository } from "./in-memory-page-repository";
import { InMemoryRateLimiter } from "./in-memory-rate-limiter";

describe("InMemoryDocumentRepository", () => {
  documentRepositoryContract(async () => new InMemoryDocumentRepository());
});

describe("InMemoryMemoryRepository", () => {
  memoryRepositoryContract(async () => {
    const documents = new InMemoryDocumentRepository();
    return { documents, memories: new InMemoryMemoryRepository(documents) };
  });
});

describe("InMemoryPageRepository", () => {
  pageRepositoryContract(async () => new InMemoryPageRepository());

  it("considers a turn older than 2 minutes abandoned", async () => {
    let now = 0;
    const repo = new InMemoryPageRepository(() => now);
    await repo.reserve("tumor", "tumor");

    now = 2 * 60 * 1000 - 1;
    expect(await repo.reserve("tumor", "tumor")).toBe(false);
    now = 2 * 60 * 1000;
    expect(await repo.reserve("tumor", "tumor")).toBe(true);
  });

  it("releasing a missing page does nothing", async () => {
    const repo = new InMemoryPageRepository();

    await repo.release("nothing");

    expect(await repo.get("nothing")).toBeNull();
  });
});

describe("InMemoryDailyBudget", () => {
  dailyBudgetContract(async () => new InMemoryDailyBudget());

  it("resets the count every day", async () => {
    let today = "2026-10-21";
    const budget = new InMemoryDailyBudget(() => today);
    await budget.consume("prefetch", 1);

    today = "2026-10-22";

    expect(await budget.consume("prefetch", 1)).toBe(true);
  });
});

describe("InMemoryRateLimiter", () => {
  rateLimiterContract(async () => new InMemoryRateLimiter());

  it("allows again once the window expires", async () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(() => now);
    await limiter.allow("a", 1, 60);
    expect(await limiter.allow("a", 1, 60)).toBe(false);

    now = 60_000;

    expect(await limiter.allow("a", 1, 60)).toBe(true);
  });
});
