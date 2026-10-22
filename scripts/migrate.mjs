// Applies the pending migrations to DATABASE_URL.
// Runs before every build: on Vercel, each environment migrates its own Neon branch.
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { migrate } from "../src/infrastructure/db/migrator.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL is not defined: migrations are skipped.");
  process.exit(0);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const directory = fileURLToPath(new URL("../src/infrastructure/db/migrations", import.meta.url));
  const applied = await migrate(sql, directory);
  console.log(applied.length > 0 ? `Migrations applied: ${applied.join(", ")}` : "The database is up to date.");
} finally {
  await sql.end();
}
