import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Sql, TransactionSql } from "postgres";

// Node also runs this module directly (scripts/migrate.mjs, with type stripping): it only
// uses TypeScript syntax that can be erased and imports no aliased paths.

/** Identifier of the lock that prevents two simultaneous migrations (for example, two deploys). */
const MIGRATION_LOCK = 7_340_001;

/**
 * Databases created before the code was in English recorded the migrations under their
 * Spanish names; they are carried over to the current ones so they are not applied again.
 */
const LEGACY_NAMES: Record<string, string> = {
  "001_inicial.sql": "001_initial.sql",
  "002_paginas_listas_para_servir.sql": "002_pages_ready_to_serve.sql",
  "003_uso_ia.sql": "003_ai_usage.sql",
  "004_limite_peticiones.sql": "004_rate_limits.sql",
  "005_busqueda_por_titulo.sql": "005_title_search.sql",
};

/**
 * Applies, in alphabetical order and inside a transaction, the `.sql` files of `directory`
 * that have not been applied yet. Returns the names of the applied ones.
 */
export async function migrate(sql: Sql, directory: string): Promise<string[]> {
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();

  return sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${MIGRATION_LOCK})`;
    await upgradeLegacyRegistry(tx);
    await tx`
      create table if not exists migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )`;
    const rows = await tx<{ name: string }[]>`select name from migrations`;
    const alreadyApplied = new Set(rows.map((row) => row.name));

    const applied: string[] = [];
    for (const file of files.filter((name) => !alreadyApplied.has(name))) {
      await tx.unsafe(await readFile(join(directory, file), "utf8"));
      await tx`insert into migrations (name) values (${file})`;
      applied.push(file);
    }
    return applied;
  });
}

async function upgradeLegacyRegistry(tx: TransactionSql): Promise<void> {
  const [legacy] = await tx<{ exists: boolean }[]>`select to_regclass('migraciones') is not null as exists`;
  if (!legacy?.exists) return;

  await tx`alter table migraciones rename to migrations`;
  await tx`alter table migrations rename column nombre to name`;
  await tx`alter table migrations rename column aplicada_en to applied_at`;
  await tx`alter table migrations rename constraint migraciones_pkey to migrations_pkey`;
  for (const [old, current] of Object.entries(LEGACY_NAMES)) {
    await tx`update migrations set name = ${current} where name = ${old}`;
  }
}
