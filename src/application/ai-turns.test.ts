import { decideTurn, type ModelState, type TurnRequest } from "./ai-turns";

const NOW = 1_800_000_000_000;
const limits = { perMinute: 8_000, perDay: 200_000 };
const request = (changes: Partial<TurnRequest> = {}): TurnRequest => ({
  model: "m",
  subject: "page:tumor",
  priority: "visitor",
  tokens: 5_000,
  dailyShare: 1,
  ...changes,
});
const state = (changes: Partial<ModelState> = {}): ModelState => ({
  now: NOW,
  calls: [],
  queue: [],
  blockedUntil: null,
  ...changes,
});
const secondsAgo = (seconds: number) => NOW - seconds * 1000;

describe("decideTurn", () => {
  it("grants the turn when the tokens fit in the minute and in the day", () => {
    expect(decideTurn(state({ calls: [{ at: secondsAgo(30), tokens: 3_000 }] }), request(), limits)).toEqual({
      kind: "granted",
    });
  });

  it("asks to wait until enough of the minute's calls leave the window", () => {
    const calls = [
      { at: secondsAgo(50), tokens: 2_000 },
      { at: secondsAgo(20), tokens: 4_000 },
    ];

    // 6,000 used + 5,000 do not fit; when the first call leaves (in 10 s), 4,000 + 5,000 still
    // do not; when the second leaves (in 40 s), they do.
    expect(decideTurn(state({ calls }), request(), limits)).toEqual({ kind: "wait", waitMs: 41_000, ahead: 0 });
  });

  it("serves visitors before the team's reading and before background work", () => {
    const queue = [
      { subject: "prefetch", priority: "background" as const, since: secondsAgo(90), tokens: 5_000 },
      { subject: "document:1", priority: "reader" as const, since: secondsAgo(60), tokens: 5_000 },
      { subject: "page:tumor", priority: "visitor" as const, since: NOW, tokens: 5_000 },
    ];

    expect(decideTurn(state({ queue }), request(), limits)).toEqual({ kind: "granted" });
    expect(decideTurn(state({ queue }), request({ subject: "document:1", priority: "reader" }), limits)).toMatchObject({
      kind: "wait",
      ahead: 1,
    });
    expect(
      decideTurn(state({ queue }), request({ subject: "prefetch", priority: "background" }), limits),
    ).toMatchObject({ kind: "wait", ahead: 2 });
  });

  it("among equals, the one who arrived first goes first", () => {
    const queue = [
      { subject: "page:a", priority: "visitor" as const, since: secondsAgo(20), tokens: 5_000 },
      { subject: "page:b", priority: "visitor" as const, since: secondsAgo(10), tokens: 5_000 },
      { subject: "page:c", priority: "visitor" as const, since: secondsAgo(10), tokens: 5_000 },
    ];

    expect(decideTurn(state({ queue }), request({ subject: "page:a" }), limits)).toEqual({ kind: "granted" });
    expect(decideTurn(state({ queue }), request({ subject: "page:c" }), limits)).toMatchObject({ ahead: 2 });
  });

  it("estimates the wait in minutes when the line does not fit in one", () => {
    const queue = [
      { subject: "page:a", priority: "visitor" as const, since: secondsAgo(20), tokens: 5_000 },
      { subject: "page:b", priority: "visitor" as const, since: secondsAgo(10), tokens: 5_000 },
    ];

    expect(decideTurn(state({ queue }), request(), limits)).toEqual({ kind: "wait", waitMs: 121_000, ahead: 2 });
  });

  it("keeps part of the day for others when the request may only use a share of it", () => {
    const calls = [{ at: NOW - 23 * 3_600_000, tokens: 118_000 }];

    expect(decideTurn(state({ calls }), request({ dailyShare: 0.6 }), limits)).toEqual({
      kind: "wait",
      waitMs: 3_601_000,
      ahead: 0,
    });
    expect(decideTurn(state({ calls }), request({ dailyShare: 1 }), limits)).toEqual({ kind: "granted" });
  });

  it("waits a whole day for a request larger than its share of the day", () => {
    expect(decideTurn(state(), request({ tokens: 9_000, dailyShare: 0.04 }), limits)).toMatchObject({
      waitMs: 86_400_000,
    });
  });

  it("respects the provider's block until it ends", () => {
    expect(decideTurn(state({ blockedUntil: NOW + 12_000 }), request(), limits)).toEqual({
      kind: "wait",
      waitMs: 12_000,
      ahead: 0,
    });
    expect(decideTurn(state({ blockedUntil: NOW - 1 }), request(), limits)).toEqual({ kind: "granted" });
  });
});
