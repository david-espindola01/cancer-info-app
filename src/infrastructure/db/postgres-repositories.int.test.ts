import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TurnRequest } from "@/application/ai-turns";
import { dailyBudgetContract } from "@/testing/contracts/daily-budget.contract";
import { documentRepositoryContract } from "@/testing/contracts/document-repository.contract";
import { memoryRepositoryContract } from "@/testing/contracts/memory-repository.contract";
import { pageRepositoryContract } from "@/testing/contracts/page-repository.contract";
import { rateLimiterContract } from "@/testing/contracts/rate-limiter.contract";
import { emptyTables, MIGRATIONS_DIRECTORY, testConnection } from "@/testing/database";
import { newDocument, sampleMemory } from "@/testing/factories";
import { migrate } from "./migrator";
import { PostgresAiCapacity } from "./postgres-ai-capacity";
import { PostgresDailyBudget } from "./postgres-daily-budget";
import { PostgresDocumentRepository } from "./postgres-document-repository";
import { PostgresMemoryRepository } from "./postgres-memory-repository";
import { PostgresPageRepository } from "./postgres-page-repository";
import { PostgresRateLimiter } from "./postgres-rate-limiter";

const sql = testConnection();

afterAll(async () => {
  await sql.end();
});

describe("PostgresDocumentRepository", () => {
  documentRepositoryContract(async () => {
    await emptyTables(sql);
    return new PostgresDocumentRepository(sql);
  });
});

describe("PostgresMemoryRepository", () => {
  memoryRepositoryContract(async () => {
    await emptyTables(sql);
    return { documents: new PostgresDocumentRepository(sql), memories: new PostgresMemoryRepository(sql) };
  });

  it("finds variants of a word (Spanish stems)", async () => {
    await emptyTables(sql);
    const documents = new PostgresDocumentRepository(sql);
    const memories = new PostgresMemoryRepository(sql);
    const { document } = await documents.register(newDocument());
    await memories.save(document.id, sampleMemory({ plainSummary: "Los tumores crecen." }));

    expect(await memories.search("tumor", 5)).toHaveLength(1);
  });
});

describe("PostgresPageRepository", () => {
  pageRepositoryContract(async () => {
    await emptyTables(sql);
    return new PostgresPageRepository(sql);
  });

  it("considers a turn older than 2 minutes abandoned", async () => {
    await emptyTables(sql);
    const repo = new PostgresPageRepository(sql);
    await repo.reserve("tumor", "tumor");

    await sql`update pages set updated_at = now() - interval '3 minutes' where slug = 'tumor'`;

    expect(await repo.reserve("tumor", "tumor")).toBe(true);
  });
});

describe("PostgresDailyBudget", () => {
  dailyBudgetContract(async () => {
    await emptyTables(sql);
    return new PostgresDailyBudget(sql);
  });
});

describe("PostgresRateLimiter", () => {
  rateLimiterContract(async () => {
    await emptyTables(sql);
    return new PostgresRateLimiter(sql);
  });

  it("allows again once the window expires", async () => {
    await emptyTables(sql);
    const limiter = new PostgresRateLimiter(sql);
    await limiter.allow("a", 1, 60);
    expect(await limiter.allow("a", 1, 60)).toBe(false);

    await sql`update rate_limits set window_start = now() - interval '61 seconds' where key = 'a'`;

    expect(await limiter.allow("a", 1, 60)).toBe(true);
    expect(await limiter.allow("a", 1, 60)).toBe(false);
  });
});

describe("PostgresAiCapacity", () => {
  const limits = { perMinute: 8_000, perDay: 200_000 };
  const turn = (subject: string, changes: Partial<TurnRequest> = {}): TurnRequest => ({
    model: "m",
    subject,
    priority: "visitor",
    tokens: 5_000,
    dailyShare: 1,
    ...changes,
  });

  beforeEach(() => emptyTables(sql));

  it("grants turns while the minute's tokens last, and records what each call spent", async () => {
    const capacity = new PostgresAiCapacity(sql, limits);

    const first = await capacity.requestTurn(turn("page:a"));
    expect(first).toEqual({ kind: "granted", callId: expect.any(String) });
    expect(await capacity.requestTurn(turn("page:b"))).toMatchObject({ kind: "wait", ahead: 0 });

    await capacity.settle(first.kind === "granted" ? first.callId : "", 2_000);
    expect(await capacity.requestTurn(turn("page:b"))).toMatchObject({ kind: "granted" });
  });

  it("keeps the place of whoever asks again, and visitors go before background work", async () => {
    const capacity = new PostgresAiCapacity(sql, limits);
    await capacity.requestTurn(turn("page:busy", { tokens: 7_000 }));

    await capacity.requestTurn(turn("prefetch:x", { priority: "background" }));
    expect(await capacity.requestTurn(turn("page:a"))).toMatchObject({ kind: "wait", ahead: 0 });
    expect(await capacity.requestTurn(turn("prefetch:x", { priority: "background" }))).toMatchObject({ ahead: 1 });
  });

  it("a request that stops asking loses its place", async () => {
    const capacity = new PostgresAiCapacity(sql, limits);
    await capacity.requestTurn(turn("page:busy", { tokens: 7_000 }));
    await capacity.requestTurn(turn("page:gone"));

    await sql`update ai_queue set seen_at = now() - interval '3 minutes' where subject = 'page:gone'`;

    expect(await capacity.requestTurn(turn("page:a"))).toMatchObject({ ahead: 0 });
  });

  it("a granted turn leaves the line of every model", async () => {
    const capacity = new PostgresAiCapacity(sql, limits);
    await capacity.requestTurn(turn("page:busy", { model: "other", tokens: 7_000 }));
    await capacity.requestTurn(turn("page:a", { model: "other" }));

    expect(await capacity.requestTurn(turn("page:a"))).toMatchObject({ kind: "granted" });
    expect(await sql`select subject from ai_queue`).toEqual([]);
  });

  it("a more urgent request for the same thing moves it up the line", async () => {
    const capacity = new PostgresAiCapacity(sql, limits);
    await capacity.requestTurn(turn("page:busy", { tokens: 7_000 }));
    await capacity.requestTurn(turn("page:x", { priority: "background" }));

    await capacity.requestTurn(turn("page:x"));

    expect(await sql`select priority from ai_queue where subject = 'page:x'`).toEqual([{ priority: "visitor" }]);
  });

  it("nobody uses a model the provider blocked until the block ends", async () => {
    const capacity = new PostgresAiCapacity(sql, limits);

    await capacity.block("m", 60_000);
    await capacity.block("m", 1_000);

    const decision = await capacity.requestTurn(turn("page:a"));
    expect(decision.kind === "wait" && decision.waitMs).toBeGreaterThan(55_000);
  });

  it("does not hand out more turns than fit when many ask at once", async () => {
    const capacity = new PostgresAiCapacity(sql, limits);

    const decisions = await Promise.all(
      Array.from({ length: 6 }, (_, i) => capacity.requestTurn(turn(`page:${i}`, { tokens: 3_000 }))),
    );

    expect(decisions.filter((d) => d.kind === "granted")).toHaveLength(2);
  });
});

describe("migrate", () => {
  it("does not apply migrations that were already applied", async () => {
    expect(await migrate(sql, MIGRATIONS_DIRECTORY)).toEqual([]);
  });

  it("carries over the registry of databases created with the Spanish migration names", async () => {
    await sql`alter table migrations rename to migraciones`;
    await sql`alter table migraciones rename column name to nombre`;
    await sql`alter table migraciones rename column applied_at to aplicada_en`;
    await sql`alter table migraciones rename constraint migrations_pkey to migraciones_pkey`;
    await sql`update migraciones set nombre = '001_inicial.sql' where nombre = '001_initial.sql'`;
    await sql`update migraciones set nombre = '004_limite_peticiones.sql' where nombre = '004_rate_limits.sql'`;

    expect(await migrate(sql, MIGRATIONS_DIRECTORY)).toEqual([]);
    const rows = await sql<{ name: string }[]>`select name from migrations order by name`;
    expect(rows.map((row) => row.name)).toEqual(expect.arrayContaining(["001_initial.sql", "004_rate_limits.sql"]));
    expect(await sql`select to_regclass('migraciones') as legacy`).toEqual([{ legacy: null }]);
  });

  it("applies new migrations in order and records them", async () => {
    const directory = await mkdtemp(join(tmpdir(), "migrations-"));
    await writeFile(join(directory, "b.sql"), "insert into migrator_test values (2);");
    await writeFile(join(directory, "a.sql"), "create table migrator_test (n integer);");
    try {
      expect(await migrate(sql, directory)).toEqual(["a.sql", "b.sql"]);
      expect(await sql`select n from migrator_test`).toEqual([{ n: 2 }]);
      expect(await migrate(sql, directory)).toEqual([]);
    } finally {
      await sql`drop table if exists migrator_test`;
      await sql`delete from migrations where name in ('a.sql', 'b.sql')`;
      await rm(directory, { recursive: true });
    }
  });
});
