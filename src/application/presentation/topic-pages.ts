import type { TopicPage } from "@/domain/page";
import { normalizeSlug } from "@/domain/slug";
import { InvalidAnswer, RateLimitExceeded, retryInvalidAnswers } from "../llm-errors";
import type { LlmProvider } from "../llm-port";
import type { FoundMemory, MemoryRepository, NewPage, PageRepository } from "../ports";
import { PRESENTER_INSTRUCTIONS, presenterMessage } from "./instructions";
import { prepareMaterial } from "./material";
import { noInformationPage, pageOutput, reviewPage } from "./page-ui";

/** How many memories are used as sources of a page (besides the character cap). */
const MAX_SOURCES = 3;
/** How many covered topics are offered when there is no information about the requested topic. */
const SUGGESTED_TOPICS = 5;
/**
 * Cap on the generated page's tokens (includes the model's reasoning). The maximum seen
 * with gpt-oss was ~830; a tight cap reserves less of the per-minute limit.
 */
const PRESENTER_MAX_TOKENS = 2_000;
/** If the page cites a non-existent source, it is requested once more before giving up. */
const ATTEMPTS = 2;
/** How often the browser asks again when someone else is already generating the page. */
const RETRY_WHEN_BUSY_MS = 2_000;
/**
 * The browser asks again within this time at most, even if the AI says to wait longer
 * (its daily limit frees up gradually, and its estimate is approximate).
 */
const MAX_RETRY_MS = 30_000;

export interface PresentationDependencies {
  pages: PageRepository;
  memories: MemoryRepository;
  presenter: LlmProvider;
}

type ReadyPage = TopicPage & { ui: string };

type GenerationResult =
  | { kind: "ready"; page: ReadyPage }
  | { kind: "busy" }
  | { kind: "wait"; waitMs: number; ahead: number }
  | { kind: "error" };

export type TopicResult =
  | { kind: "ready"; page: ReadyPage; stale: boolean }
  /** `ahead` and `waitMs`: how many pages are waiting before this one, and roughly for how long. */
  | { kind: "preparing"; retryMs: number; ahead: number; waitMs: number }
  | { kind: "limit" }
  | { kind: "error" }
  | { kind: "invalid" };

/** To serve pages: also decides whether this visitor may request a new page right now. */
export type VisitDependencies = PresentationDependencies & { allowGeneration: () => Promise<boolean> };

/**
 * A topic's page: the stored one if it exists (flagging whether it went stale so it can be
 * regenerated separately) or a freshly generated one, if the visitor has not reached their
 * limit of new pages. Never generates the same page twice at the same time.
 */
export async function getTopicPage(input: string, deps: VisitDependencies): Promise<TopicResult> {
  const slug = normalizeSlug(input);
  if (!slug) return { kind: "invalid" };

  const stored = await deps.pages.get(slug);
  if (stored?.ui) {
    const version = await deps.memories.corpusVersion();
    const stale = stored.corpusVersion !== version && stored.status !== "generating";
    return { kind: "ready", page: { ...stored, ui: stored.ui }, stale };
  }
  // Only the first request for a page counts against the visitor's limit: asking again for one
  // that is already on its way (waiting in line, for example) does not.
  if (!stored && !(await deps.allowGeneration())) return { kind: "limit" };

  const result = await generateTopicPage(slug, deps);
  switch (result.kind) {
    case "ready":
      return { kind: "ready", page: result.page, stale: false };
    case "busy":
      return { kind: "preparing", retryMs: RETRY_WHEN_BUSY_MS, ahead: 0, waitMs: RETRY_WHEN_BUSY_MS };
    case "wait":
      return { kind: "preparing", retryMs: Math.min(result.waitMs, MAX_RETRY_MS), ahead: result.ahead, waitMs: result.waitMs };
    case "error":
      return { kind: "error" };
  }
}

/** Generates (or regenerates) and stores a topic's page from the memories that cover it. */
export async function generateTopicPage(slug: string, deps: PresentationDependencies): Promise<GenerationResult> {
  const topic = slug.replaceAll("-", " ");
  if (!(await deps.pages.reserve(slug, topic))) return { kind: "busy" };

  try {
    const corpusVersion = await deps.memories.corpusVersion();
    const found = await deps.memories.search(topic, MAX_SOURCES);
    const content =
      found.length > 0 ? await present(slug, topic, found, deps.presenter) : await noInformation(slug, topic, deps.memories);

    const page: NewPage = { slug, topic, corpusVersion, ...content };
    await deps.pages.save(page);
    return { kind: "ready", page: { ...page, status: "ready" } };
  } catch (error) {
    await deps.pages.release(slug);
    if (error instanceof RateLimitExceeded) return { kind: "wait", waitMs: error.waitMs, ahead: error.ahead };
    if (error instanceof InvalidAnswer) return { kind: "error" };
    throw error;
  }
}

/** A page built without calling the AI, suggesting the topics most articles cover. */
async function noInformation(slug: string, topic: string, memories: MemoryRepository) {
  const topics = await memories.mostCommonTopics(SUGGESTED_TOPICS);
  const { page, keywords } = reviewPage(noInformationPage(topic), { sources: [], topics }, slug);
  return { ui: JSON.stringify(page), sources: [], keywords };
}

async function present(slug: string, topic: string, found: FoundMemory[], presenter: LlmProvider) {
  const material = prepareMaterial(found);
  return retryInvalidAnswers(ATTEMPTS, async () => {
    const answer = await presenter.generateJson({
      output: pageOutput,
      system: PRESENTER_INSTRUCTIONS,
      user: presenterMessage(topic, material.text),
      subject: `page:${slug}`,
      maxOutputTokens: PRESENTER_MAX_TOKENS,
    });
    const { page, keywords } = reviewPage(answer, material, slug);
    return { ui: JSON.stringify(page), sources: material.sources, keywords };
  });
}
