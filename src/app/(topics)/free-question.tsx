"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { normalizeSlug } from "@/domain/slug";

/** Lets people ask about any topic: the question becomes that topic's page. */
export function FreeQuestion() {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const slug = normalizeSlug(question);
    if (slug) router.push(`/topic/${slug}`);
  }

  return (
    <form role="search" onSubmit={submit} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <label htmlFor="question" className="font-bold">
        ¿Qué más quieres saber?
      </label>
      <div className="flex gap-2">
        <input
          id="question"
          type="search"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Por ejemplo: cómo se previene"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-semibold text-background">
          Buscar
        </button>
      </div>
    </form>
  );
}
