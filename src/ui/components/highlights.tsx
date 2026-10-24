import type { ReactNode } from "react";
import { withoutMarks } from "@/domain/markup";
import { AlertIcon, BookIcon, HealthIcon, InfoIcon } from "../icons";
import { styles } from "../styles";
import { TextWithTopics } from "../text-with-topics";

/** The figure inside a big clay-colored stone, with its explanation beside it. */
export function Stat({ value, description, source }: { value: string; description: string; source: number }) {
  return (
    <figure className="color-barro flex items-center gap-4 rounded-[2rem] rounded-tl-md bg-(--cf) p-4">
      <p className="seed solid flex min-h-28 min-w-28 max-w-[50%] shrink-0 items-center justify-center px-4 py-4 text-center text-2xl font-extrabold leading-tight">
        {withoutMarks(value)}
      </p>
      <figcaption>
        {withoutMarks(description)} <span className="text-base text-muted">(fuente {source})</span>
      </figcaption>
    </figure>
  );
}

/** A speech bubble in hill green, as if someone explained the word. */
export function Definition({ term, explanation }: { term: string; explanation: string }) {
  return (
    <dl className="color-monte bubble solid p-4">
      <dt className="flex items-center gap-2 text-base font-extrabold uppercase tracking-wide">
        <BookIcon />
        ¿Qué significa?
      </dt>
      <dd className="mt-1">
        <span className="font-extrabold">{withoutMarks(term)}:</span> <TextWithTopics text={explanation} />
      </dd>
    </dl>
  );
}

export type NoticeKind = "info" | "important" | "consult";

const NOTICES: Record<NoticeKind, { label: string; icon: ReactNode; color: string }> = {
  info: { label: "Dato útil", icon: <InfoIcon />, color: "color-cielo" },
  important: { label: "Importante", icon: <AlertIcon />, color: "color-maiz" },
  consult: { label: "Consulta a un profesional de salud", icon: <HealthIcon />, color: "color-flor" },
};

export function Notice({ kind, text }: { kind: NoticeKind; text: string }) {
  const notice = NOTICES[kind];
  return (
    <aside className={`${notice.color} bubble-start flex gap-3 border-[3px] border-(--c) bg-(--cf) p-4`}>
      <span aria-hidden className={`${styles.circle} seed size-12`}>
        {notice.icon}
      </span>
      <div>
        <p className="font-extrabold text-(--c)">{notice.label}</p>
        <p className="mt-1">
          <TextWithTopics text={text} />
        </p>
      </div>
    </aside>
  );
}
