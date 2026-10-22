"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noSubscription = () => () => {};
const hasVoice = () => "speechSynthesis" in window;

/**
 * Reads the page aloud with the phone's or computer's own voice: it uses no network and
 * costs nothing, and it helps people who have trouble reading.
 */
export function ListenButton() {
  const available = useSyncExternalStore(noSubscription, hasVoice, () => false);
  const [speaking, setSpeaking] = useState(false);

  // If the person changes page, reading stops.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!available) return null;

  function toggle() {
    const voice = window.speechSynthesis;
    if (speaking) {
      voice.cancel();
      setSpeaking(false);
      return;
    }
    // Next.js keeps the pages visited before hidden in the document: only the visible one is read.
    const article = [...document.querySelectorAll<HTMLElement>("main article")].find(
      (candidate) => candidate.checkVisibility?.() ?? true,
    );
    // innerText keeps the pauses between blocks (title, paragraphs); textContent joins them.
    const text = (article?.innerText || article?.textContent)?.trim();
    if (!text) return;
    const reading = new SpeechSynthesisUtterance(text);
    reading.lang = "es";
    reading.rate = 0.95;
    reading.onend = () => setSpeaking(false);
    voice.cancel();
    voice.speak(reading);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="self-start rounded-lg border border-border bg-surface px-4 py-2 font-semibold"
    >
      {speaking ? "■ Detener lectura" : "▶ Escuchar esta página"}
    </button>
  );
}
