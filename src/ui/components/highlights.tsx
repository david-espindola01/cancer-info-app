import type { ReactNode } from "react";
import { AlertIcon, BookIcon, HealthIcon, InfoIcon } from "../icons";
import { styles } from "../styles";
import { TextWithTopics } from "../text-with-topics";

/** The figure inside a big circle, with its explanation beside it. */
export function Stat({ value, description, source }: { value: string; description: string; source: number }) {
  return (
    <figure className="color-coral flex items-center gap-4 rounded-3xl bg-(--cf) p-4">
      <p className={`${styles.circle} min-h-24 min-w-24 max-w-[50%] px-4 py-3 text-center text-2xl leading-tight`}>
        {value}
      </p>
      <figcaption>
        {description} <span className="text-base text-muted">(fuente {source})</span>
      </figcaption>
    </figure>
  );
}

/** A note with a folded corner, like a dictionary's. */
export function Definition({ term, explanation }: { term: string; explanation: string }) {
  return (
    <dl className="color-blue relative overflow-hidden rounded-2xl rounded-tr-none bg-(--cf) p-4 pr-10">
      <span aria-hidden className="absolute right-0 top-0 size-7 rounded-bl-2xl bg-(--c) opacity-40" />
      <dt className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-(--c)">
        <BookIcon />
        ¿Qué significa?
      </dt>
      <dd className="mt-1">
        <span className="font-bold">{term}:</span> <TextWithTopics text={explanation} />
      </dd>
    </dl>
  );
}

export type NoticeKind = "info" | "important" | "consult";

const NOTICES: Record<NoticeKind, { label: string; icon: ReactNode; color: string }> = {
  info: { label: "Dato útil", icon: <InfoIcon />, color: "color-blue" },
  important: { label: "Importante", icon: <AlertIcon />, color: "color-amber" },
  consult: { label: "Consulta a un profesional de salud", icon: <HealthIcon />, color: "color-violet" },
};

export function Notice({ kind, text }: { kind: NoticeKind; text: string }) {
  const notice = NOTICES[kind];
  return (
    <aside className={`${notice.color} flex gap-3 rounded-2xl border-2 border-(--c) bg-(--cf) p-4`}>
      <span aria-hidden className={`${styles.circle} size-11`}>
        {notice.icon}
      </span>
      <div>
        <p className="font-bold text-(--c)">{notice.label}</p>
        <p className="mt-1">
          <TextWithTopics text={text} />
        </p>
      </div>
    </aside>
  );
}
