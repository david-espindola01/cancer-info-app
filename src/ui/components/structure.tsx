import { useId, type ReactNode } from "react";
import { withoutMarks } from "@/domain/markup";
import { Hills } from "../icons";
import { TextWithTopics } from "../text-with-topics";

/** Section opened by a leaf; on the page, each section takes the next palette color. */
export function Section({ title, children }: { title: string; children?: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="color-monte flex flex-col gap-4">
      <h2 id={id} className="flex items-center gap-3 text-2xl font-extrabold leading-tight">
        <span aria-hidden className="leaf size-6 shrink-0 bg-(--c)" />
        {withoutMarks(title)}
      </h2>
      <div className="flex flex-col gap-4 rounded-bl-3xl border-b-4 border-l-4 border-(--cf) pb-4 pl-4">{children}</div>
    </section>
  );
}

/** The sun of the page: a maize-colored band with a sun and hills at the bottom. */
export function Heading({ title, subtitle }: { title: string; subtitle: string | null }) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] rounded-bl-md bg-sol px-5 pb-16 pt-7 text-sol-text">
      <span aria-hidden className="seed absolute -right-3 -top-3 size-20 bg-[#a3361b]" />
      <h1 className="relative pr-[4.5rem] text-3xl font-extrabold leading-tight sm:text-4xl">{withoutMarks(title)}</h1>
      {subtitle && <p className="relative mt-2 text-xl font-medium">{withoutMarks(subtitle)}</p>}
      <Hills className="absolute inset-x-0 bottom-0 h-12 w-full text-(--colina)" />
    </header>
  );
}

export function Paragraph({ text }: { text: string }) {
  return (
    <p>
      <TextWithTopics text={text} />
    </p>
  );
}
