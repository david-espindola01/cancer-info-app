import type { Sql } from "postgres";
import type { RateLimiter } from "@/application/ports";

export class PostgresRateLimiter implements RateLimiter {
  constructor(private readonly sql: Sql) {}

  async allow(key: string, max: number, windowSeconds: number) {
    if (max <= 0) return false;
    const expired = this.sql`rate_limits.window_start < now() - ${windowSeconds}::int * interval '1 second'`;
    // A single atomic statement: if the window expired, a new one starts; otherwise one is
    // added as long as the maximum is not exceeded. With no row returned, the request is denied.
    const rows = await this.sql`
      insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
      on conflict (key) do update set
        count = case when ${expired} then 1 else rate_limits.count + 1 end,
        window_start = case when ${expired} then now() else rate_limits.window_start end
      where ${expired} or rate_limits.count < ${max}
      returning count`;
    return rows.length > 0;
  }
}
