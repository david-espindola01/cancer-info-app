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
    <form role="search" onSubmit={submit} className="color-maiz bubble flex flex-col gap-2 bg-(--cf) p-5">
      <label htmlFor="question" className="text-lg font-extrabold">
        ¿Qué más quieres saber?
      </label>
      <div className="flex gap-2">
        <input
          id="question"
          type="search"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Por ejemplo: cómo se previene"
          className="min-w-0 flex-1 rounded-full border-2 border-(--c) bg-surface px-4 py-2"
        />
        <button type="submit" className="color-barro solid rounded-full px-5 py-2 font-extrabold">
          Buscar
        </button>
      </div>
    </form>
  );
}
