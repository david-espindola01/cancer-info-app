import { RateLimitExceeded } from "@/application/llm-errors";
import type { JsonRequest, LlmProvider } from "@/application/llm-port";

/** Waits up to this long are the per-minute limit: the caller waits instead of switching model. */
const SHORT_WAIT_MS = 60_000;

/**
 * Uses the next provider when one hits a long limit (for example, its daily quota on
 * Groq's free tier), so visitors are not left waiting for hours. A short wait is passed on
 * to the caller as is; if every provider is limited, the shortest wait is reported.
 */
export class FallbackProvider implements LlmProvider {
  constructor(private readonly providers: LlmProvider[]) {}

  async generateJson<T>(request: JsonRequest<T>): Promise<T> {
    let shortest: RateLimitExceeded | undefined;
    for (const provider of this.providers) {
      try {
        return await provider.generateJson(request);
      } catch (error) {
        if (!(error instanceof RateLimitExceeded) || error.waitMs <= SHORT_WAIT_MS) throw error;
        if (!shortest || error.waitMs < shortest.waitMs) shortest = error;
      }
    }
    throw shortest ?? new Error("FallbackProvider needs at least one provider.");
  }
}
