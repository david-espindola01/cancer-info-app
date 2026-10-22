import type { Sql } from "postgres";
import type { LlmProvider } from "@/application/llm-port";
import { generateTopicPage, getTopicPage } from "@/application/presentation/topic-pages";
import { prefetchTopics } from "@/application/presentation/prefetch-topics";
import { processNextStep } from "@/application/reading/process-next-step";
import { registerDocument } from "@/application/reading/register-document";
import { createConnection } from "./db/client";
import { PostgresDailyBudget } from "./db/postgres-daily-budget";
import { PostgresDocumentRepository } from "./db/postgres-document-repository";
import { PostgresMemoryRepository } from "./db/postgres-memory-repository";
import { PostgresPageRepository } from "./db/postgres-page-repository";
import { PostgresRateLimiter } from "./db/postgres-rate-limiter";
import { optionalInteger, optionalVariable, requiredVariable } from "./environment";
import { FakeProvider } from "./llm/fake-provider";
import { responseFromSchema } from "./llm/generic-response";
import { GroqProvider, type ReasoningEffort } from "./llm/groq-provider";
import { createSessionToken, passwordMatches, sessionTokenValid, visitorFingerprint } from "./session";

/*
 * Composition of the application: the only place where the use cases get their concrete
 * implementations, and the only infrastructure module `app/` uses.
 */

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "./session";

let connection: Sql | undefined;
const sql = () => (connection ??= createConnection(requiredVariable("DATABASE_URL")));
const documentRepository = () => new PostgresDocumentRepository(sql());
const dailyBudget = () => new PostgresDailyBudget(sql());

/** Groq in real use; «fake» in CI and e2e: valid answers without calling any model. */
function llmProvider(model: string): LlmProvider {
  if (optionalVariable("LLM_PROVIDER", "groq", ["groq", "fake"]) === "fake") {
    return new FakeProvider((request) => responseFromSchema(request.output.jsonSchema, request.user));
  }
  return new GroqProvider({
    apiKey: requiredVariable("GROQ_API_KEY"),
    model,
    onUsage: (usage) => dailyBudget().add(`tokens:${usage.model}`, usage.tokens),
    effort: optionalVariable<ReasoningEffort>("GROQ_REASONING_EFFORT", "low", ["low", "medium", "high"]),
  });
}

export const documents = {
  register: (input: { title: string; text: string }) => registerDocument(input, documentRepository()),
  list: () => documentRepository().list(),
  processStep: (id: string) =>
    processNextStep(id, {
      documents: documentRepository(),
      memories: new PostgresMemoryRepository(sql()),
      reader: llmProvider(optionalVariable("GROQ_READER_MODEL", "openai/gpt-oss-120b")),
    }),
};

const presentationDependencies = () => ({
  pages: new PostgresPageRepository(sql()),
  memories: new PostgresMemoryRepository(sql()),
  presenter: llmProvider(optionalVariable("GROQ_PRESENTER_MODEL", "openai/gpt-oss-20b")),
});

/** For the team's panel: AI usage today and pages ready to serve. */
export async function systemStatus() {
  const [usageToday, readyPages] = await Promise.all([
    dailyBudget().usageToday(),
    new PostgresPageRepository(sql()).countReady(),
  ]);
  return { usageToday, readyPages };
}

/** Per-visitor limits: they protect the AI quota and the team password. */
const LIMITS = {
  newPages: { max: 10, windowSeconds: 10 * 60 },
  loginAttempts: { max: 5, windowSeconds: 15 * 60 },
} as const;

function allow(reason: keyof typeof LIMITS, ip: string): Promise<boolean> {
  const { max, windowSeconds } = LIMITS[reason];
  const visitor = visitorFingerprint(ip, requiredVariable("SESSION_SECRET"));
  return new PostgresRateLimiter(sql()).allow(`${reason}:${visitor}`, max, windowSeconds);
}

export const topics = {
  get: (input: string, ip: string) =>
    getTopicPage(input, {
      ...presentationDependencies(),
      allowGeneration: () => allow("newPages", ip),
    }),
  regenerate: (slug: string) => generateTopicPage(slug, presentationDependencies()),
  prefetch: (slugs: string[]) =>
    prefetchTopics(
      slugs,
      { ...presentationDependencies(), budget: dailyBudget() },
      {
        perVisit: optionalInteger("PREFETCH_PER_VISIT", 2),
        dailyMax: optionalInteger("PREFETCH_DAILY_MAX", 30),
      },
    ),
};

export type Login = { kind: "ok"; token: string } | { kind: "wrong-password" } | { kind: "limit" };

export const session = {
  async login(password: string, ip: string): Promise<Login> {
    if (!(await allow("loginAttempts", ip))) return { kind: "limit" };
    if (!passwordMatches(password, requiredVariable("ADMIN_PASSWORD"))) return { kind: "wrong-password" };
    return { kind: "ok", token: createSessionToken(requiredVariable("SESSION_SECRET"), Date.now()) };
  },
  valid: (token: string | undefined) => sessionTokenValid(token, requiredVariable("SESSION_SECRET"), Date.now()),
};
