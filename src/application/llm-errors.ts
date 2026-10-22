/** The provider hit its usage limit; it can be retried after `waitMs`. */
export class RateLimitExceeded extends Error {
  constructor(readonly waitMs: number) {
    super(`AI provider limit reached; retry in ${waitMs} ms.`);
    this.name = "RateLimitExceeded";
  }
}

/** The model answered something that does not match the requested schema. */
export class InvalidAnswer extends Error {
  constructor(detail: string) {
    super(`The model did not return a valid answer: ${detail}`);
    this.name = "InvalidAnswer";
  }
}

/**
 * Runs `attempt` again when the model's answer is invalid (usually a one-off, such as an
 * answer cut off by the token cap), up to `times` in total. Other errors are not retried.
 */
export async function retryInvalidAnswers<T>(times: number, attempt: () => Promise<T>): Promise<T> {
  for (let n = 1; ; n += 1) {
    try {
      return await attempt();
    } catch (error) {
      if (!(error instanceof InvalidAnswer) || n >= times) throw error;
    }
  }
}
