import type { Sql } from "postgres";
import { decideTurn, PRIORITIES, type AiPriority, type TokenLimits, type TurnRequest } from "@/application/ai-turns";
import type { AiCapacity } from "@/application/ports";

/** A waiting request that has not asked again in this long lost its place (the visitor left). */
const PLACE_KEPT = "2 minutes";

export class PostgresAiCapacity implements AiCapacity {
  constructor(
    private readonly sql: Sql,
    private readonly limits: TokenLimits,
  ) {}

  requestTurn(request: TurnRequest) {
    const { model, subject, priority, tokens } = request;
    return this.sql.begin(async (tx) => {
      // One decision per model at a time, across every server instance.
      await tx`select pg_advisory_xact_lock(hashtext(${`ai:${model}`}))`;
      await tx`delete from ai_calls where model = ${model} and at < now() - interval '1 day'`;
      await tx`delete from ai_queue where model = ${model} and seen_at < now() - ${PLACE_KEPT}::text::interval`;
      // Asking again keeps the place; if a more urgent request asks for the same thing, it moves up.
      await tx`
        insert into ai_queue (model, subject, priority, tokens) values (${model}, ${subject}, ${priority}, ${tokens}::int)
        on conflict (model, subject) do update set
          seen_at = now(),
          tokens = excluded.tokens,
          priority = case when array_position(${[...PRIORITIES]}::text[], excluded.priority)
                             < array_position(${[...PRIORITIES]}::text[], ai_queue.priority)
                          then excluded.priority else ai_queue.priority end`;

      const [clock] = await tx<{ now: number; blocked_until: number | null }[]>`
        select (extract(epoch from now()) * 1000)::float8 as now,
          (select (extract(epoch from until) * 1000)::float8 from ai_blocks where model = ${model}) as blocked_until`;
      const calls = await tx<{ at: number; tokens: number }[]>`
        select (extract(epoch from at) * 1000)::float8 as at, tokens from ai_calls where model = ${model}`;
      const queue = await tx<{ subject: string; priority: AiPriority; since: number; tokens: number }[]>`
        select subject, priority, (extract(epoch from since) * 1000)::float8 as since, tokens from ai_queue where model = ${model}`;

      const decision = decideTurn(
        { now: clock!.now, calls: [...calls], queue: [...queue], blockedUntil: clock!.blocked_until },
        request,
        this.limits,
      );
      if (decision.kind === "wait") return decision;

      // The turn leaves the line of every model (a visitor may wait for two at once).
      await tx`delete from ai_queue where subject = ${subject}`;
      const [call] = await tx<{ id: string }[]>`
        insert into ai_calls (model, tokens) values (${model}, ${tokens}) returning id`;
      return { kind: "granted" as const, callId: call!.id };
    });
  }

  async settle(callId: string, tokens: number) {
    await this.sql`update ai_calls set tokens = ${tokens} where id = ${callId}`;
  }

  async block(model: string, waitMs: number) {
    await this.sql`
      insert into ai_blocks (model, until) values (${model}, now() + ${waitMs}::float8 * interval '1 millisecond')
      on conflict (model) do update set until = greatest(ai_blocks.until, excluded.until)`;
  }
}
