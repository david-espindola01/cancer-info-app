import { RateLimitExceeded } from "@/application/llm-errors";
import type { JsonRequest, LlmProvider } from "@/application/llm-port";

/**
 * Uses the next provider when one has to wait (its line is long or its daily quota ran
 * out), so a visitor gets the capacity of every model. If they all have to wait, the
 * shortest wait is reported. Each model's line decides how much of its day it lends.
 */
export class FallbackProvider implements LlmProvider {
  constructor(private readonly providers: LlmProvider[]) {}

  async generateJson<T>(request: JsonRequest<T>): Promise<T> {
    let shortest: RateLimitExceeded | undefined;
    for (const provider of this.providers) {
      try {
        return await provider.generateJson(request);
      } catch (error) {
        if (!(error instanceof RateLimitExceeded)) throw error;
        if (!shortest || error.waitMs < shortest.waitMs) shortest = error;
      }
    }
    throw shortest ?? new Error("FallbackProvider needs at least one provider.");
  }
}
