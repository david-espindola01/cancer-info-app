import { InvalidAnswer } from "@/application/llm-errors";
import type { JsonRequest, LlmProvider } from "@/application/llm-port";

type Respond = (request: JsonRequest<unknown>) => unknown | Promise<unknown>;

/**
 * Deterministic provider for tests and CI: calls no API and spends no quota.
 * Validates the answer against the schema just like the real provider.
 */
export class FakeProvider implements LlmProvider {
  readonly requests: JsonRequest<unknown>[] = [];

  constructor(private readonly respond: Respond) {}

  async generateJson<T>(request: JsonRequest<T>): Promise<T> {
    this.requests.push(request);
    const answer = await this.respond(request);
    try {
      return request.output.validate(answer);
    } catch (error) {
      throw new InvalidAnswer((error as Error).message);
    }
  }
}
