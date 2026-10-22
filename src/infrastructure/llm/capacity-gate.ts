import type { AiPriority } from "@/application/ai-turns";
import { RateLimitExceeded } from "@/application/llm-errors";
import type { JsonRequest } from "@/application/llm-port";
import type { AiCapacity } from "@/application/ports";

/**
 * About how many characters make one token of these prompts (Spanish text, labels and the
 * JSON schema). Measured against Groq's count: the presenter's ~15,200 characters were
 * 3,391 prompt tokens (4.5 per token); 4 errs on the safe side. The estimate only reserves
 * room: each call is settled afterwards with what it really spent.
 */
const CHARACTERS_PER_TOKEN = 4;
/** Answers used about half of their cap (the presenter ~830 of 2,000; the reader up to ~2,400 of 4,000). */
const EXPECTED_SHARE_OF_ANSWER = 0.5;

/** A granted turn: it is settled with what the call actually spent, or freed if the provider rejected it. */
export interface Turn {
  settle(tokens: number): Promise<void>;
  rejected(waitMs: number): Promise<void>;
}

/** Waits in line before each call to a model (see application/ai-turns.ts). */
export class CapacityGate {
  constructor(
    private readonly capacity: AiCapacity,
    private readonly options: { model: string; priority: AiPriority; dailyShare: number },
  ) {}

  /** Takes a turn, or throws `RateLimitExceeded` with how long to wait and how many are ahead. */
  async enter(request: JsonRequest<unknown>): Promise<Turn> {
    const { model, priority, dailyShare } = this.options;
    const { promptTokens, tokens } = estimateTokens(request);
    const decision = await this.capacity.requestTurn({
      model,
      subject: request.subject,
      priority,
      tokens,
      promptTokens,
      dailyShare,
    });
    if (decision.kind === "wait") throw new RateLimitExceeded(decision.waitMs, decision.ahead);
    return {
      settle: (tokens) => this.capacity.settle(decision.callId, tokens),
      rejected: async (waitMs) => {
        await this.capacity.settle(decision.callId, 0);
        await this.capacity.block(model, waitMs);
      },
    };
  }
}

/** The prompt's tokens, and those plus the expected answer's. */
export function estimateTokens({ system, user, output, maxOutputTokens }: JsonRequest<unknown>) {
  const characters = system.length + user.length + JSON.stringify(output.jsonSchema).length;
  const promptTokens = Math.ceil(characters / CHARACTERS_PER_TOKEN);
  return { promptTokens, tokens: promptTokens + Math.ceil(maxOutputTokens * EXPECTED_SHARE_OF_ANSWER) };
}
