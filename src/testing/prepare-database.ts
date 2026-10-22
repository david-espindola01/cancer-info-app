import { migrate } from "@/infrastructure/db/migrator";
import { MIGRATIONS_DIRECTORY, testConnection } from "./database";

/** Vitest globalSetup: leaves the test database empty and with every migration applied. */
export default async function prepareTestDatabase(): Promise<void> {
  const sql = testConnection();
  try {
    await sql`drop schema if exists public cascade`;
    await sql`create schema public`;
    await migrate(sql, MIGRATIONS_DIRECTORY);
  } finally {
    await sql.end();
  }
}
