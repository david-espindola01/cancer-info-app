/*
 * Who may use an AI model now. Each model has a limit of tokens per minute and per day
 * (Groq's free tier: 8,000 and 200,000). Requests wait in line by priority and arrival,
 * so the quota is shared without wasting calls that the provider would reject.
 */

/** From most to least urgent: someone waiting for a page, the team's reading, work nobody waits for. */
export const PRIORITIES = ["visitor", "reader", "background"] as const;
export type AiPriority = (typeof PRIORITIES)[number];

export interface TokenLimits {
  perMinute: number;
  perDay: number;
}

export interface TurnRequest {
  model: string;
  subject: string;
  priority: AiPriority;
  /** Tokens the call is expected to spend (prompt plus answer): what is reserved. */
  tokens: number;
  /**
   * Tokens of the prompt alone. As Groq does, a call may start when its prompt fits in the
   * minute: its answer is counted afterwards.
   */
  promptTokens: number;
  /** Fraction of the day's tokens this request may use up to (for example, 0.6 leaves 40 % for others). */
  dailyShare: number;
}

export type TurnDecision = { kind: "granted" } | { kind: "wait"; waitMs: number; ahead: number };

/** The state of one model, as stored: times in milliseconds since the epoch. */
export interface ModelState {
  now: number;
  /** Calls of the last 24 hours (reserved or already settled). */
  calls: { at: number; tokens: number }[];
  /** Who is waiting, the request being decided included. */
  queue: { subject: string; priority: AiPriority; since: number; promptTokens: number }[];
  /** The provider rejected calls until then (it knows limits we cannot see, such as other users of the key). */
  blockedUntil: number | null;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** Margin added to computed waits so the window has really moved on when the request comes back. */
const MARGIN_MS = 1_000;

export function decideTurn(state: ModelState, request: TurnRequest, limits: TokenLimits): TurnDecision {
  const ahead = linedUpBefore(state, request);
  const wait = (waitMs: number): TurnDecision => ({ kind: "wait", waitMs: Math.ceil(waitMs), ahead: ahead.length });

  if (state.blockedUntil !== null && state.blockedUntil > state.now) return wait(state.blockedUntil - state.now);

  const dayCeiling = limits.perDay * request.dailyShare;
  const dayWait = timeUntilFits(state.calls, state.now - DAY_MS, request.tokens, dayCeiling);
  if (dayWait === null) return wait(DAY_MS);
  if (dayWait > 0) return wait(dayWait + MARGIN_MS);

  // Those ahead go first: there must be room for their prompts and for this one.
  const needed = request.promptTokens + ahead.reduce((total, other) => total + other.promptTokens, 0);
  const minuteWait = timeUntilFits(state.calls, state.now - MINUTE_MS, needed, limits.perMinute);
  if (minuteWait === 0) return { kind: "granted" };
  // When the line does not fit in one minute, estimate how many minutes it takes.
  return wait((minuteWait ?? Math.ceil(needed / limits.perMinute) * MINUTE_MS) + MARGIN_MS);
}

/** Requests that go before this one: more urgent, or as urgent and older. */
function linedUpBefore(state: ModelState, request: TurnRequest) {
  const rank = (priority: AiPriority) => PRIORITIES.indexOf(priority);
  const own = state.queue.find((entry) => entry.subject === request.subject);
  const since = own?.since ?? state.now;
  return state.queue.filter(
    (other) =>
      other.subject !== request.subject &&
      (rank(other.priority) < rank(request.priority) ||
        (rank(other.priority) === rank(request.priority) &&
          (other.since < since || (other.since === since && other.subject < request.subject)))),
  );
}

/**
 * How long until `tokens` more fit under `ceiling`, counting the calls made after
 * `windowStart` (each one leaves the window when it gets as old as the window). 0 if they
 * fit now; null if they never will.
 */
function timeUntilFits(
  calls: ModelState["calls"],
  windowStart: number,
  tokens: number,
  ceiling: number,
): number | null {
  if (tokens > ceiling) return null;
  const inWindow = calls.filter((call) => call.at > windowStart).sort((a, b) => a.at - b.at);
  let used = inWindow.reduce((total, call) => total + call.tokens, 0);
  let wait = 0;
  for (const call of inWindow) {
    if (used + tokens <= ceiling) break;
    used -= call.tokens;
    wait = call.at - windowStart;
  }
  return wait;
}
