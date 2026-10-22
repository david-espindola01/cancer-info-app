import { useId, type ReactNode } from "react";
import { TextWithTopics } from "../text-with-topics";

/** Section with a colored diamond; on the page, each section takes the next palette color. */
export function Section({ title, children }: { title: string; children?: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="color-teal flex flex-col gap-4">
      <h2 id={id} className="flex items-center gap-3 text-2xl font-bold">
        <span aria-hidden className="size-4 shrink-0 rotate-45 rounded-sm bg-(--c)" />
        {title}
      </h2>
      <div className="flex flex-col gap-4 border-l-4 border-(--cf) pl-4">{children}</div>
    </section>
  );
}

/** Welcome band with decorative shapes. */
export function Heading({ title, subtitle }: { title: string; subtitle: string | null }) {
  return (
    <header className="color-teal relative overflow-hidden rounded-3xl bg-(--cf) px-5 py-7">
      <span aria-hidden className="absolute -right-10 -top-12 size-40 rounded-full bg-(--c) opacity-15" />
      <span aria-hidden className="absolute -bottom-10 right-20 size-24 rotate-12 rounded-[40%] bg-(--coral) opacity-20" />
      <span aria-hidden className="absolute bottom-6 right-6 size-6 rounded-full bg-(--violet) opacity-30" />
      <h1 className="relative text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
      {subtitle && <p className="relative mt-2 text-xl text-muted">{subtitle}</p>}
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
