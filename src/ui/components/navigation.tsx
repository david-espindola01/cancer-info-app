import Link from "next/link";
import { withoutMarks } from "@/domain/markup";
import type { PageSource } from "@/domain/page";
import { normalizeSlug } from "@/domain/slug";
import { ArrowIcon, BookIcon, SearchIcon } from "../icons";
import { styles } from "../styles";

/** `available` are the page's sources as the server knows them; the model only gives numbers. */
export function Sources({ numbers, available }: { numbers: number[]; available: PageSource[] }) {
  const used = available.filter((source) => numbers.includes(source.number));
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

/**
 * Colored cards to the recommended topics; when tapped, the page slides forward. The first
 * one is the suggested next step: wider and outlined, so there is always one clear way on.
 */
export function NextTopics({ topics }: { topics: { label: string; reason: string }[] }) {
  return (
    <nav aria-label="Sigue aprendiendo" className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">Sigue aprendiendo</h2>
      <ul className="color-cycle grid gap-3 sm:grid-cols-2">
        {topics.map((topic, i) => (
          <li key={topic.label} className={i === 0 ? "sm:col-span-2" : undefined}>
            <Link
              href={`/topic/${normalizeSlug(topic.label)}`}
              transitionTypes={["forward"]}
              className={`liftable flex h-full items-center gap-3 rounded-2xl border-2 bg-(--cf) p-4 hover:border-(--c) ${
                i === 0 ? "border-(--c)" : "border-transparent"
              }`}
            >
              <span className="flex-1">
                {i === 0 && <span className="block text-sm font-bold uppercase tracking-wide">Te recomendamos</span>}
                <span className="block font-bold text-(--c) first-letter:uppercase">{withoutMarks(topic.label)}</span>
                <span className="block text-base">{withoutMarks(topic.reason)}</span>
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
      <p>{withoutMarks(message)}</p>
      <Link href="/" transitionTypes={["back"]} className="topic-link self-start">
        Volver al inicio
      </Link>
    </div>
  );
}
