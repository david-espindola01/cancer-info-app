/*
 * What the person has read, kept only on their phone (nothing travels to the server):
 * - the trail: the topics of this visit, from the start to the current one (sessionStorage);
 * - the read topics: every topic opened, the most recent first, for «Mis temas» (localStorage);
 * - the saved topics: the ones the person chose to keep for reading without signal (localStorage;
 *   the pages themselves are in the Cache API, see `offline-library.ts`).
 * The phone may block the storage (private mode, full memory): then nothing is remembered
 * and the pages keep working.
 */

import type { TopicSummary } from "@/domain/page";

export type ReadTopic = TopicSummary;

/** The trail shows only the last steps so it fits on one or two lines of a phone. */
export const MAX_TRAIL = 4;
const MAX_READ = 60;

const TRAIL_KEY = "recorrido";
const READ_KEY = "temas-leidos";
const SAVED_KEY = "temas-guardados";

/**
 * The trail after opening `topic`: if it was already in it (the person went back), the
 * trail is cut there; if not, it is added at the end.
 */
export function followTrail(trail: ReadTopic[], topic: ReadTopic): ReadTopic[] {
  const at = trail.findIndex((step) => step.slug === topic.slug);
  const next = at >= 0 ? [...trail.slice(0, at), topic] : [...trail, topic];
  return next.slice(-MAX_TRAIL);
}

/** The read topics after opening `topic`: it goes first, without repeating it. */
export function rememberRead(read: ReadTopic[], topic: ReadTopic): ReadTopic[] {
  return [topic, ...read.filter((item) => item.slug !== topic.slug)].slice(0, MAX_READ);
}

function isReadTopic(value: unknown): value is ReadTopic {
  const item = value as ReadTopic | null;
  return typeof item?.slug === "string" && typeof item.title === "string";
}

type Area = "session" | "local";

function storage(area: Area): Storage | null {
  try {
    return area === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

const EMPTY: ReadTopic[] = [];

/** Last value read from each key: the same list is returned while the stored text does not change. */
const cache = new Map<string, { raw: string | null; list: ReadTopic[] }>();

function readList(area: Area, key: string): ReadTopic[] {
  let raw: string | null = null;
  try {
    raw = storage(area)?.getItem(key) ?? null;
  } catch {
    // Blocked storage: as if nothing had been read.
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.list;
  let list = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) list = parsed.filter(isReadTopic);
  } catch {
    // Damaged data: it starts again from zero.
  }
  cache.set(key, { raw, list });
  return list;
}

function writeList(area: Area, key: string, list: ReadTopic[]) {
  try {
    storage(area)?.setItem(key, JSON.stringify(list));
  } catch {
    // Without storage (or full), it is simply not remembered.
  }
}

const listeners = new Set<() => void>();

/** For `useSyncExternalStore`: also hears changes made in other tabs. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export const getTrail = () => readList("session", TRAIL_KEY);
export const getRead = () => readList("local", READ_KEY);
export const getSaved = () => readList("local", SAVED_KEY);
/** What the server and the first render see: nothing, because the storage lives on the phone. */
export const getNothing = () => EMPTY;

/**
 * Records that the person opened `topic`. The starting topic is «Inicio»: opening it begins
 * a new, empty trail.
 */
export function recordVisit(topic: ReadTopic, { start }: { start: boolean }) {
  writeList("session", TRAIL_KEY, start ? [] : followTrail(getTrail(), topic));
  writeList("local", READ_KEY, rememberRead(getRead(), topic));
  notify();
}

/** Adds or removes `topic` from the saved topics (the most recent first). */
export function recordSaved(topic: ReadTopic, saved: boolean) {
  const others = getSaved().filter((item) => item.slug !== topic.slug);
  writeList("local", SAVED_KEY, saved ? [topic, ...others] : others);
  notify();
}

function notify() {
  listeners.forEach((listener) => listener());
}
