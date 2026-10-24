"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { getNothing, getTrail, recordVisit, subscribe, type ReadTopic } from "./reading-history";

/** Each step is a small rounded stone; the current one is solid. */
const CHIP = "inline-block rounded-full bg-(--cf) px-3 py-0.5 font-bold text-(--c) hover:underline";

const CHEVRON = (
  <span aria-hidden className="font-extrabold text-accent">
    ›
  </span>
);

/**
 * «Inicio › Qué es el cáncer › Mutaciones»: where the person is and the way back to the
 * topics they came through. «Inicio» is the starting topic, so on it the trail is not shown.
 */
export function RouteTrail({ topic, start }: { topic: ReadTopic; start: boolean }) {
  const trail = useSyncExternalStore(subscribe, getTrail, getNothing);

  const { slug, title } = topic;
  useEffect(() => {
    recordVisit({ slug, title }, { start });
  }, [slug, title, start]);

  if (start) return null;

  // The steps before the current topic; before the first render on the phone there are none.
  const at = trail.findIndex((step) => step.slug === topic.slug);
  const before = at >= 0 ? trail.slice(0, at) : trail;

  return (
    <nav aria-label="Tu recorrido" className="color-barro text-base">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li className="flex items-center gap-2">
          <Link href="/" transitionTypes={["back"]} className={CHIP}>
            Inicio
          </Link>
        </li>
        {before.map((step) => (
          <li key={step.slug} className="flex min-w-0 items-center gap-2">
            {CHEVRON}
            <Link
              href={`/topic/${step.slug}`}
              transitionTypes={["back"]}
              className={`${CHIP} max-w-[12rem] truncate`}
            >
              {step.title}
            </Link>
          </li>
        ))}
        <li className="flex min-w-0 items-center gap-2">
          {CHEVRON}
          <span aria-current="page" className="solid inline-block max-w-[14rem] truncate rounded-full px-3 py-0.5 font-extrabold">
            {topic.title}
          </span>
        </li>
      </ol>
    </nav>
  );
}
