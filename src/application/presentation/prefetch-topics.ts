import type { DailyBudget } from "../ports";
import { generateTopicPage, type PresentationDependencies } from "./topic-pages";

export interface PrefetchOptions {
  /** How many new pages are prepared, at most, after each visit. */
  perVisit: number;
  /** How many pages may be prefetched per day (the rest of the quota is for real visits). */
  dailyMax: number;
}

/**
 * If the AI asks to wait up to this long, wait and retry once. This happens almost always:
 * Groq deducts the requested maximum from its per-minute limit, so right after generating
 * a page the next one does not fit until the minute window moves on.
 */
const MAX_WAIT_MS = 30_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Prepares in advance the pages the one just viewed leads to (in the recommended order),
 * so they are ready when clicked. Skips the ones that are up to date; if the AI asks to
 * wait briefly, waits and retries; stops when the day's budget runs out or the wait would
 * be long. Returns how many pages it prepared.
 */
export async function prefetchTopics(
  slugs: string[],
  deps: PresentationDependencies & { budget: DailyBudget },
  { perVisit, dailyMax }: PrefetchOptions,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<number> {
  const version = await deps.memories.corpusVersion();
  let prepared = 0;

  for (const slug of slugs) {
    if (prepared >= perVisit) break;
    const stored = await deps.pages.get(slug);
    const upToDate = stored?.ui && stored.corpusVersion === version;
    if (upToDate || stored?.status === "generating") continue;
    if (!(await deps.budget.consume("prefetch", dailyMax))) break;

    let result = await generateTopicPage(slug, deps);
    if (result.kind === "wait" && result.waitMs <= MAX_WAIT_MS) {
      await wait(result.waitMs);
      result = await generateTopicPage(slug, deps);
    }
    if (result.kind === "wait") break;
    if (result.kind === "ready") prepared += 1;
  }
  return prepared;
}
