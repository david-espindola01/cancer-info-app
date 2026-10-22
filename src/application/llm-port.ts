/** The shape the model's answer must have, and how to check it. */
export interface JsonOutput<T> {
  /** Short schema name (required by the structured-output API). */
  name: string;
  jsonSchema: Record<string, unknown>;
  /** Returns the typed value, or throws if it does not match the schema. */
  validate(value: unknown): T;
}

export interface JsonRequest<T> {
  output: JsonOutput<T>;
  system: string;
  user: string;
  /**
   * What the request is about (for example, `page:tumor`): repeated requests for the same
   * thing share one place in the line to use the AI.
   */
  subject: string;
  /** Cap on answer tokens (includes the model's reasoning). */
  maxOutputTokens: number;
}

/**
 * A language model that answers with JSON matching a schema.
 * Throws `RateLimitExceeded` or `InvalidAnswer` (see llm-errors.ts).
 */
export interface LlmProvider {
  generateJson<T>(request: JsonRequest<T>): Promise<T>;
}
