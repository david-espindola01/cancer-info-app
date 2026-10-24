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
 * Cards to the recommended topics; when tapped, the page slides forward. The first one is
 * the suggested next step: a solid clay block with a sun-colored label, so there is always
 * one clear way on.
 */
export function NextTopics({ topics }: { topics: { label: string; reason: string }[] }) {
  return (
    <nav aria-label="Sigue aprendiendo" className="flex flex-col gap-3">
      <h2 className="text-2xl font-extrabold">Sigue aprendiendo</h2>
      <ul className="color-cycle grid gap-3 sm:grid-cols-2">
        {topics.map((topic, i) => {
          const first = i === 0;
          return (
            <li key={topic.label} className={first ? "sm:col-span-2" : undefined}>
              <Link
                href={`/topic/${normalizeSlug(topic.label)}`}
                transitionTypes={["forward"]}
                className={`liftable flex h-full items-center gap-3 p-4 ${
                  first ? "color-barro solid rounded-[2rem] rounded-bl-md" : "bubble bg-(--cf)"
                }`}
              >
                <span className="flex-1">
                  {first && (
                    <span className="mb-1 inline-block rounded-full bg-sol px-3 py-0.5 text-sm font-extrabold uppercase tracking-wide text-sol-text">
                      Te recomendamos
                    </span>
                  )}
                  <span className={`block text-lg font-extrabold first-letter:uppercase ${first ? "" : "text-(--c)"}`}>
                    {withoutMarks(topic.label)}
                  </span>
                  <span className="block text-base">{withoutMarks(topic.reason)}</span>
                </span>
                <span
                  aria-hidden
                  className={`seed flex size-10 shrink-0 items-center justify-center ${
                    first ? "bg-sol text-sol-text" : "bg-(--c) text-background"
                  }`}
                >
                  <ArrowIcon />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NoInformation({ message }: { message: string }) {
  return (
    <div className="color-maiz bubble flex flex-col gap-3 bg-(--cf) p-5">
      <span aria-hidden className={`${styles.circle} seed size-14`}>
        <SearchIcon />
      </span>
      <p>{withoutMarks(message)}</p>
      <Link href="/" transitionTypes={["back"]} className="topic-link self-start">
        Volver al inicio
      </Link>
    </div>
  );
}
