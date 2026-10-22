type RequiredVariable = "DATABASE_URL" | "ADMIN_PASSWORD" | "SESSION_SECRET" | "GROQ_API_KEY";
type OptionalVariable =
  | "LLM_PROVIDER"
  | "GROQ_READER_MODEL"
  | "GROQ_PRESENTER_MODEL"
  | "GROQ_PRESENTER_FALLBACK_MODEL"
  | "GROQ_REASONING_EFFORT"
  | "PREFETCH_PER_VISIT"
  | "PREFETCH_DAILY_MAX";

/**
 * Reads a required environment variable. If it is missing, fails with a clear message
 * instead of spreading a silent `undefined`.
 */
export function requiredVariable(name: RequiredVariable): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Define it in .env.local (local) ` +
        "or in Settings → Environment Variables (Vercel). See .env.example.",
    );
  }
  return value;
}

/** Reads an optional variable that must be an integer greater than or equal to 0. */
export function optionalInteger(name: OptionalVariable, fallback: number): number {
  const value = optionalVariable(name, String(fallback));
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${name}="${value}" is not valid. It must be an integer greater than or equal to 0.`);
  }
  return number;
}

/** Reads an optional variable; if it is defined, it must be one of the allowed values. */
export function optionalVariable<T extends string>(name: OptionalVariable, fallback: T, allowed?: readonly T[]): T {
  const value = process.env[name] || fallback;
  if (allowed && !allowed.includes(value as T)) {
    throw new Error(`${name}="${value}" is not valid. Possible values: ${allowed.join(", ")}.`);
  }
  return value as T;
}
