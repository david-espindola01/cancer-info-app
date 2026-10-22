"use client";

import Link from "next/link";
import { normalizeSlug } from "@/domain/slug";
import { ArrowIcon, BookIcon, SearchIcon } from "../icons";
import { useSources } from "../sources";
import { styles } from "../styles";

export function Sources({ numbers }: { numbers: number[] }) {
  const used = useSources().filter((source) => numbers.includes(source.number));
  if (used.length === 0) return null;
  return (
    <section aria-label="Fuentes" className="border-t border-border pt-4 text-base text-muted">
      <h2 className="flex items-center gap-2 font-bold">
        <BookIcon />
        Fuentes
      </h2>
      <ol className="mt-1 flex flex-col gap-1">
        {used.map((source) => (
          <li key={source.number}>
            [{source.number}] {source.title}. {source.reference}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Colored cards to the recommended topics; when tapped, the page slides forward. */
export function NextTopics({ topics }: { topics: { label: string; reason: string }[] }) {
  return (
    <nav aria-label="Sigue aprendiendo" className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">Sigue aprendiendo</h2>
      <ul className="color-cycle grid gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <li key={topic.label}>
            <Link
              href={`/topic/${normalizeSlug(topic.label)}`}
              transitionTypes={["forward"]}
              className="liftable flex h-full items-center gap-3 rounded-2xl border-2 border-transparent bg-(--cf) p-4 hover:border-(--c)"
            >
              <span className="flex-1">
                <span className="block font-bold text-(--c) first-letter:uppercase">{topic.label}</span>
                <span className="block text-base">{topic.reason}</span>
              </span>
              <span aria-hidden className={`${styles.circle} size-9`}>
                <ArrowIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function NoInformation({ message }: { message: string }) {
  return (
    <div className="color-amber flex flex-col gap-3 rounded-3xl bg-(--cf) p-5">
      <span aria-hidden className={`${styles.circle} size-12`}>
        <SearchIcon />
      </span>
      <p>{message}</p>
      <Link href="/" transitionTypes={["back"]} className="topic-link self-start">
        Volver al inicio
      </Link>
    </div>
  );
}
