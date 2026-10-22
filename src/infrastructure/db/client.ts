import postgres, { type Sql } from "postgres";

/**
 * Connection for serverless functions against Neon's pooler (PgBouncer in transaction
 * mode): no prepared statements and few connections per instance.
 */
export function createConnection(url: string): Sql {
  return postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
}
