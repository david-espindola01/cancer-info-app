import type { Sql } from "postgres";
import type { DailyBudget } from "@/application/ports";

export class PostgresDailyBudget implements DailyBudget {
  constructor(private readonly sql: Sql) {}

  async consume(reason: string, max: number) {
    if (max <= 0) return false;
    // A single statement: two functions at once cannot go over the maximum.
    const rows = await this.sql`
      insert into ai_usage (reason, amount) values (${reason}, 1)
      on conflict (day, reason) do update set amount = ai_usage.amount + 1
      where ai_usage.amount < ${max}
      returning amount`;
    return rows.length > 0;
  }

  async add(reason: string, amount: number) {
    await this.sql`
      insert into ai_usage (reason, amount) values (${reason}, ${amount})
      on conflict (day, reason) do update set amount = ai_usage.amount + excluded.amount`;
  }

  async usageToday() {
    const rows = await this.sql<{ reason: string; amount: number }[]>`
      select reason, amount from ai_usage where day = current_date order by reason`;
    return Object.fromEntries(rows.map((row) => [row.reason, row.amount]));
  }
}
