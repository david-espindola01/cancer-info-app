import { withoutMarks } from "@/domain/markup";
import { CheckIcon } from "../icons";
import { styles } from "../styles";
import { TextWithTopics } from "../text-with-topics";

/** Items with leaf-shaped bullets, in the container's color. */
function Items({ items }: { items: string[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="leaf mt-1 flex size-6 shrink-0 items-center justify-center bg-(--c) text-background">
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
    <div className="color-monte rounded-[2rem] rounded-tl-md bg-(--cf) p-5">
      {title && <h3 className={`${styles.blockTitle} text-(--c)`}>{withoutMarks(title)}</h3>}
      <Items items={items} />
    </div>
  );
}

/** A path: numbered stones joined by a dotted trail. */
export function Steps({ title, steps }: { title: string | null; steps: { title: string; text: string }[] }) {
  return (
    <div>
      {title && <h3 className={styles.blockTitle}>{withoutMarks(title)}</h3>}
      <ol className="color-cycle mt-3 flex flex-col">
        {steps.map((step, i) => (
          <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute bottom-1 left-[1.3rem] top-12 border-l-4 border-dotted border-(--c) opacity-60"
              />
            )}
            <span aria-hidden className={`${styles.circle} seed relative size-11 text-lg`}>
              {i + 1}
            </span>
            <div className="pt-1.5">
              <p className="font-extrabold text-(--c)">{withoutMarks(step.title)}</p>
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

/** Columns under a rounded label (for example, «Mito» and «Realidad»). */
export function Comparison({ title, columns }: { title: string; columns: { title: string; items: string[] }[] }) {
  return (
    <div>
      <h3 className={styles.blockTitle}>{withoutMarks(title)}</h3>
      <div className="color-cycle mt-3 grid gap-4 sm:grid-cols-2">
        {columns.map((column, i) => (
          <div key={i} className="flex flex-col">
            <h4 className="solid self-start rounded-full px-4 py-1 text-lg font-extrabold">{withoutMarks(column.title)}</h4>
            <div className="-mt-1 h-full rounded-[1.75rem] rounded-tl-md bg-(--cf) px-4 pb-4 pt-3">
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
    <div className="color-cielo flex flex-col gap-3">
      <h3 className={styles.blockTitle}>Preguntas frecuentes</h3>
      {questions.map((item, i) => (
        <details key={i} className="group">
          <summary className="bubble liftable flex cursor-pointer list-none items-center gap-3 bg-(--cf) px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
            <span aria-hidden className={`${styles.circle} seed size-9`}>
              ?
            </span>
            <span className="flex-1">{withoutMarks(item.question)}</span>
            <span aria-hidden className="text-3xl leading-none text-(--c) transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="bubble-start ml-8 mt-2 border-[3px] border-(--cf) px-4 py-3">
            <TextWithTopics text={item.answer} />
          </p>
        </details>
      ))}
    </div>
  );
}
