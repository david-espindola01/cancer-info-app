"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import type { TopicSummary } from "@/domain/page";
import { canSaveOffline, topicPath } from "../offline-library";
import { getNothing, getRead, getSaved, subscribe } from "../reading-history";

const noSubscription = () => () => {};
/** «Leídos hace poco» is a reminder, not a history: a few are enough. */
const RECENT = 8;

function TopicGroup({
  title,
  color,
  topics,
  empty,
  read,
}: {
  title: string;
  color: string;
  topics: TopicSummary[];
  empty?: ReactNode;
  read?: Set<string>;
}) {
  if (topics.length === 0 && !empty) return null;
  return (
    <section aria-label={title} className={`${color} flex flex-col gap-3`}>
      <h2 className="flex items-center gap-3 text-2xl font-bold">
        <span aria-hidden className="size-4 shrink-0 rotate-45 rounded-sm bg-(--c)" />
        {title}
      </h2>
      {topics.length === 0 ? (
        <p className="rounded-2xl bg-(--cf) p-4">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {topics.map((topic) => (
            <li key={topic.slug}>
              <Link
                href={topicPath(topic.slug)}
                transitionTypes={["forward"]}
                className="liftable flex items-center gap-3 rounded-xl border-2 border-transparent bg-(--cf) px-4 py-3 hover:border-(--c)"
              >
                <span className="flex-1 font-semibold first-letter:uppercase">{topic.title}</span>
                {read?.has(topic.slug) && <span className="text-base font-semibold text-(--c)">✓ Leído</span>}
                <span aria-hidden className="text-xl text-(--c)">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * «Mis temas»: what the person kept to read without signal, what they read recently and
 * every topic that is ready (those open at once). The first two live only on the phone.
 */
export function MyTopics({ ready }: { ready: TopicSummary[] }) {
  const read = useSyncExternalStore(subscribe, getRead, getNothing);
  const saved = useSyncExternalStore(subscribe, getSaved, getNothing);
  const canSave = useSyncExternalStore(noSubscription, canSaveOffline, () => false);
  const readSlugs = new Set(read.map((topic) => topic.slug));

  return (
    <article className="flex flex-col gap-8">
      <header className="color-teal rounded-3xl bg-(--cf) px-5 py-6">
        <h1 className="text-3xl font-bold leading-tight">Mis temas</h1>
        <p className="mt-2 text-xl text-muted">
          Lo que leíste y lo que puedes leer sin señal. Se guarda solo en este teléfono.
        </p>
      </header>
      {canSave && (
        <TopicGroup
          title="Guardados para leer sin señal"
          color="color-violet"
          topics={saved}
          empty="Cuando leas un tema, toca «Guardar para leer sin señal» y aparecerá aquí."
        />
      )}
      <TopicGroup
        title="Leídos hace poco"
        color="color-blue"
        topics={read.slice(0, RECENT)}
        empty={
          <>
            Todavía no has leído ningún tema.{" "}
            <Link href="/" transitionTypes={["back"]} className="topic-link">
              Empieza por «¿Qué es el cáncer?»
            </Link>
          </>
        }
      />
      <TopicGroup
        title={`Todos los temas listos (${ready.length})`}
        color="color-green"
        topics={ready}
        read={readSlugs}
      />
    </article>
  );
}
