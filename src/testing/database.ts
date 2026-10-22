import { fileURLToPath } from "node:url";
import type { Sql } from "postgres";
import { createConnection } from "@/infrastructure/db/client";

export const MIGRATIONS_DIRECTORY = fileURLToPath(new URL("../infrastructure/db/migrations", import.meta.url));

/**
 * Database used only by the integration tests: it is wiped on every run. That is why it
 * is read from TEST_DATABASE_URL and never from DATABASE_URL.
 */
function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing TEST_DATABASE_URL: the integration tests need a database used only for tests " +
        "(for example, Neon's «tests» branch) in .env.local.",
    );
  }
  return url;
}

export const testConnection = (): Sql => createConnection(testDatabaseUrl());

export async function emptyTables(sql: Sql): Promise<void> {
  await sql`truncate documents, memories, pages, ai_usage, rate_limits, ai_calls, ai_queue, ai_blocks cascade`;
  await sql`update corpus set version = 0`;
}
