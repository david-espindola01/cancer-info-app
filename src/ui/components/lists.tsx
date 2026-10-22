import { withoutMarks } from "@/domain/markup";
import { CheckIcon } from "../icons";
import { styles } from "../styles";
import { TextWithTopics } from "../text-with-topics";

/** Items with check-mark bullets, in the container's color. */
function Items({ items }: { items: string[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className={`${styles.circle} mt-1 size-6`}>
            <CheckIcon />
          </span>
          <span>
            <TextWithTopics text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BulletList({ title, items }: { title: string | null; items: string[] }) {
  return (
    <div className="color-green rounded-2xl bg-(--cf) p-4">
      {title && <h3 className={`${styles.blockTitle} text-(--c)`}>{withoutMarks(title)}</h3>}
      <Items items={items} />
    </div>
  );
}

/** Timeline: colored numbered circles joined by a line. */
export function Steps({ title, steps }: { title: string | null; steps: { title: string; text: string }[] }) {
  return (
    <div>
      {title && <h3 className={styles.blockTitle}>{withoutMarks(title)}</h3>}
      <ol className="color-cycle mt-3 flex flex-col">
        {steps.map((step, i) => (
          <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span aria-hidden className="absolute bottom-0 left-[1.125rem] top-10 w-1 rounded-full bg-border" />
            )}
            <span aria-hidden className={`${styles.circle} relative size-10 text-lg`}>
              {i + 1}
            </span>
            <div className="pt-1.5">
              <p className="font-bold text-(--c)">{withoutMarks(step.title)}</p>
              <p>
                <TextWithTopics text={step.text} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Columns with a colored tab (for example, «Mito» and «Realidad»). */
export function Comparison({ title, columns }: { title: string; columns: { title: string; items: string[] }[] }) {
  return (
    <div>
      <h3 className={styles.blockTitle}>{withoutMarks(title)}</h3>
      <div className="color-cycle mt-3 grid gap-3 sm:grid-cols-2">
        {columns.map((column, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border-2 border-(--c)">
            <h4 className="bg-(--c) px-4 py-2 text-lg font-bold text-background">{withoutMarks(column.title)}</h4>
            <div className="h-full bg-(--cf) px-4 pb-4 pt-2">
              <Items items={column.items} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Questions as speech bubbles that unfold when tapped. */
export function Faq({ questions }: { questions: { question: string; answer: string }[] }) {
  return (
    <div className="color-violet flex flex-col gap-3">
      <h3 className={styles.blockTitle}>Preguntas frecuentes</h3>
      {questions.map((item, i) => (
        <details key={i} className="group">
          <summary className="liftable flex cursor-pointer list-none items-center gap-3 rounded-2xl rounded-bl-sm bg-(--cf) px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
            <span aria-hidden className={`${styles.circle} size-8`}>
              ?
            </span>
            <span className="flex-1">{withoutMarks(item.question)}</span>
            <span aria-hidden className="text-2xl leading-none text-(--c) transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="ml-11 mt-2 rounded-2xl rounded-tl-sm border-2 border-(--cf) px-4 py-3">
            <TextWithTopics text={item.answer} />
          </p>
        </details>
      ))}
    </div>
  );
}
