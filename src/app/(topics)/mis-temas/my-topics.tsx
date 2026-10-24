"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import type { TopicSummary } from "@/domain/page";
import { Heading } from "@/ui/components/structure";
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
      <h2 className="flex items-center gap-3 text-2xl font-extrabold">
        <span aria-hidden className="leaf size-6 shrink-0 bg-(--c)" />
        {title}
      </h2>
      {topics.length === 0 ? (
        <p className="bubble bg-(--cf) p-4">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {topics.map((topic) => (
            <li key={topic.slug}>
              <Link
                href={topicPath(topic.slug)}
                transitionTypes={["forward"]}
                className="liftable flex items-center gap-3 rounded-full border-2 border-transparent bg-(--cf) px-5 py-3 hover:border-(--c)"
              >
                <span className="flex-1 font-bold first-letter:uppercase">{topic.title}</span>
                {read?.has(topic.slug) && <span className="solid rounded-full px-2 text-sm font-extrabold">✓ Leído</span>}
                <span aria-hidden className="text-2xl font-extrabold text-(--c)">
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
      <Heading
        title="Mis temas"
        subtitle="Lo que leíste y lo que puedes leer sin señal. Se guarda solo en este teléfono."
      />
      {canSave && (
        <TopicGroup
          title="Guardados para leer sin señal"
          color="color-flor"
          topics={saved}
          empty="Cuando leas un tema, toca «Guardar sin señal» y aparecerá aquí."
        />
      )}
      <TopicGroup
        title="Leídos hace poco"
        color="color-cielo"
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
        color="color-monte"
        topics={ready}
        read={readSlugs}
      />
    </article>
  );
}
