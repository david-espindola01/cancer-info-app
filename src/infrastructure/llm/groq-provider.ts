import OpenAI from "openai";
import { InvalidAnswer, RateLimitExceeded } from "@/application/llm-errors";
import type { JsonRequest, LlmProvider } from "@/application/llm-port";
import { recoverJson } from "./recover-json";
import { strictModeViolations } from "./strict-schema";

const GROQ_URL = "https://api.groq.com/openai/v1";
/** If Groq does not say how long to wait after a 429, retry after this long. */
const DEFAULT_WAIT_MS = 15_000;

export type ReasoningEffort = "low" | "medium" | "high";

export interface GroqOptions {
  apiKey: string;
  model: string;
  /** "low" uses ~70 % fewer output tokens (measured in Phase 1). */
  effort: ReasoningEffort;
  /** For tests: replaces the global fetch. */
  fetch?: typeof fetch;
  /** Reports how many tokens each call spent (for the usage panel). If it fails, nothing is interrupted. */
  onUsage?: (usage: { model: string; tokens: number }) => Promise<void>;
}

/** LLM provider on Groq with structured output in strict mode. */
export class GroqProvider implements LlmProvider {
  private readonly client: OpenAI;

  constructor(private readonly options: GroqOptions) {
    // No automatic retries: limits are handled by the caller (RateLimitExceeded).
    this.client = new OpenAI({ apiKey: options.apiKey, baseURL: GROQ_URL, maxRetries: 0, fetch: options.fetch });
  }

  async generateJson<T>(request: JsonRequest<T>): Promise<T> {
    const { output } = request;
    const schema = schemaForGroq(output.jsonSchema);
    const start = Date.now();

    const { model, onUsage } = this.options;

    let response: OpenAI.ChatCompletion;
    try {
      response = await this.client.chat.completions.create({
        model,
        temperature: 0.2,
        reasoning_effort: this.options.effort,
        max_completion_tokens: request.maxOutputTokens,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: output.name, strict: true, schema },
        },
      });
    } catch (error) {
      const recovered = recoverRejectedAnswer(error, output.validate);
      if (!recovered) translateError(error);
      console.info(JSON.stringify({ event: "llm-answer-recovered", model, schema: output.name }));
      return recovered.value;
    }

    console.info(
      JSON.stringify({
        event: "llm",
        model,
        schema: output.name,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
        ms: Date.now() - start,
      }),
    );
    await onUsage?.({ model, tokens: response.usage?.total_tokens ?? 0 }).catch((error: unknown) =>
      console.error(JSON.stringify({ event: "llm-usage-not-recorded", model, error: String(error) })),
    );
    return validate(response.choices[0]?.message.content, output.validate);
  }
}

function schemaForGroq(original: Record<string, unknown>): Record<string, unknown> {
  const jsonSchema = { ...original };
  delete jsonSchema.$schema;
  const violations = strictModeViolations(jsonSchema);
  if (violations.length > 0) {
    throw new Error(`The schema does not meet Groq's strict mode:\n${violations.join("\n")}`);
  }
  return jsonSchema;
}

/**
 * When Groq rejects an answer as malformed it sends what the model wrote
 * (`failed_generation`); if it is the known stray-bracket quirk and, once recovered, it
 * matches the schema, it is used instead of asking the model again.
 */
function recoverRejectedAnswer<T>(error: unknown, validateOutput: (value: unknown) => T): { value: T } | null {
  if (!(error instanceof OpenAI.APIError) || error.status !== 400) return null;
  const generation = (error.error as { failed_generation?: unknown } | undefined)?.failed_generation;
  const recovered = typeof generation === "string" ? recoverJson(generation) : null;
  if (recovered === null) return null;
  try {
    return { value: validateOutput(recovered) };
  } catch {
    return null;
  }
}

function translateError(error: unknown): never {
  if (error instanceof OpenAI.APIError && error.status === 429) {
    const waitMs = indicatedWait(error.headers) ?? DEFAULT_WAIT_MS;
    // Logged so pages that take long to appear can be diagnosed.
    console.warn(JSON.stringify({ event: "llm-rate-limit", waitMs, detail: error.message }));
    throw new RateLimitExceeded(waitMs);
  }
  if (error instanceof OpenAI.APIError && error.status === 400) {
    // Logged so the cause (for example, an answer cut off by the token cap) can be diagnosed.
    console.warn(JSON.stringify({ event: "llm-invalid-answer", detail: error.message }));
    throw new InvalidAnswer(error.message);
  }
  throw error;
}

/** Reads `retry-after` (seconds) or `x-ratelimit-reset-tokens` (e.g. «11.6s», «1m2s»). */
function indicatedWait(headers: Headers | undefined): number | undefined {
  const retryAfter = Number(headers?.get("retry-after"));
  if (retryAfter > 0) return Math.ceil(retryAfter * 1000);

  const reset = headers?.get("x-ratelimit-reset-tokens");
  const parts = reset?.match(/^(?:(\d+)m)?(?:([\d.]+)s)?$/);
  if (!parts || (!parts[1] && !parts[2])) return undefined;
  return Math.ceil((Number(parts[1] ?? 0) * 60 + Number(parts[2] ?? 0)) * 1000);
}

function validate<T>(content: string | null | undefined, validateOutput: (value: unknown) => T): T {
  try {
    return validateOutput(JSON.parse(content ?? ""));
  } catch (error) {
    throw new InvalidAnswer((error as Error).message);
  }
}
