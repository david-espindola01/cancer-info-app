import type { Sql } from "postgres";
import type { AiPriority } from "@/application/ai-turns";
import type { LlmProvider } from "@/application/llm-port";
import { generateTopicPage, getTopicPage, readyTopics } from "@/application/presentation/topic-pages";
import { prefetchTopics } from "@/application/presentation/prefetch-topics";
import { processNextStep } from "@/application/reading/process-next-step";
import { registerDocument } from "@/application/reading/register-document";
import { createConnection } from "./db/client";
import { PostgresAiCapacity } from "./db/postgres-ai-capacity";
import { PostgresDailyBudget } from "./db/postgres-daily-budget";
import { PostgresDocumentRepository } from "./db/postgres-document-repository";
import { PostgresMemoryRepository } from "./db/postgres-memory-repository";
import { PostgresPageRepository } from "./db/postgres-page-repository";
import { PostgresRateLimiter } from "./db/postgres-rate-limiter";
import { optionalInteger, optionalVariable, requiredVariable } from "./environment";
import { CapacityGate } from "./llm/capacity-gate";
import { FakeProvider } from "./llm/fake-provider";
import { FallbackProvider } from "./llm/fallback-provider";
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

/** Each model's limits on Groq's free tier (the same for gpt-oss-20b and gpt-oss-120b). */
const aiCapacity = () =>
  new PostgresAiCapacity(sql(), {
    perMinute: optionalInteger("GROQ_TOKENS_PER_MINUTE", 8_000),
    perDay: optionalInteger("GROQ_TOKENS_PER_DAY", 200_000),
  });

/**
 * Who goes first in each model's line and how much of its day each kind of work may use:
 * work nobody is waiting for stops at 60 % so visitors keep the rest, and visitors may use
 * up to 70 % of the Reader's model, which leaves 30 % for the team's reading.
 */
const TURNS = {
  visitor: { priority: "visitor", dailyShare: 1 },
  visitorOnReaderModel: { priority: "visitor", dailyShare: 0.7 },
  reader: { priority: "reader", dailyShare: 1 },
  background: { priority: "background", dailyShare: 0.6 },
} satisfies Record<string, { priority: AiPriority; dailyShare: number }>;

const readerModel = () => optionalVariable("GROQ_READER_MODEL", "openai/gpt-oss-120b");

/** Groq in real use; «fake» in CI and e2e: valid answers without calling any model. */
function llmProvider(model: string, turn: (typeof TURNS)[keyof typeof TURNS]): LlmProvider {
  if (optionalVariable("LLM_PROVIDER", "groq", ["groq", "fake"]) === "fake") {
    return new FakeProvider((request) => responseFromSchema(request.output.jsonSchema, request.user));
  }
  return new GroqProvider({
    apiKey: requiredVariable("GROQ_API_KEY"),
    model,
    onUsage: (usage) => dailyBudget().add(`tokens:${usage.model}`, usage.tokens),
    effort: optionalVariable<ReasoningEffort>("GROQ_REASONING_EFFORT", "low", ["low", "medium", "high"]),
    gate: new CapacityGate(aiCapacity(), { model, ...turn }),
  });
}

export const documents = {
  register: (input: { title: string; text: string }) => registerDocument(input, documentRepository()),
  list: () => documentRepository().list(),
  processStep: (id: string) =>
    processNextStep(id, {
      documents: documentRepository(),
      memories: new PostgresMemoryRepository(sql()),
      reader: llmProvider(readerModel(), TURNS.reader),
    }),
};

/**
 * A visitor waiting for a page may also use the fallback models, in order, when the main one
 * makes them wait (each model has its own quota); work nobody is waiting for (prefetching,
 * refreshing) only uses the main one.
 */
function presentationDependencies({ visitorWaiting }: { visitorWaiting: boolean }) {
  const model = optionalVariable("GROQ_PRESENTER_MODEL", "openai/gpt-oss-20b");
  const fallbackModels = optionalVariable("GROQ_PRESENTER_FALLBACK_MODELS", "qwen/qwen3.8-27b,openai/gpt-oss-120b")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const forVisitor = (name: string) =>
    llmProvider(name, name === readerModel() ? TURNS.visitorOnReaderModel : TURNS.visitor);
  return {
    pages: new PostgresPageRepository(sql()),
    memories: new PostgresMemoryRepository(sql()),
    presenter: visitorWaiting
      ? new FallbackProvider([model, ...fallbackModels].map(forVisitor))
      : llmProvider(model, TURNS.background),
  };
}

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
  // Generous because many people may share one IP (a classroom, a health post); the AI's line
  // already protects the quota.
  newPages: { max: 30, windowSeconds: 10 * 60 },
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
      ...presentationDependencies({ visitorWaiting: true }),
      allowGeneration: () => allow("newPages", ip),
    }),
  ready: () => readyTopics(new PostgresPageRepository(sql())),
  regenerate: (slug: string) => generateTopicPage(slug, presentationDependencies({ visitorWaiting: false })),
  prefetch: (slugs: string[]) =>
    prefetchTopics(
      slugs,
      { ...presentationDependencies({ visitorWaiting: false }), budget: dailyBudget() },
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
