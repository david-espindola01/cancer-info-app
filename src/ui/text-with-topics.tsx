import Link from "next/link";
import { Fragment } from "react";
import { splitMarks } from "@/domain/markup";

/** Shows a text with its [[marked]] keywords as underlined links to their topic. */
export function TextWithTopics({ text }: { text: string }) {
  return (
    <>
      {splitMarks(text).map((segment, i) =>
        segment.kind === "topic" ? (
          <Link key={i} href={`/topic/${segment.slug}`} transitionTypes={["forward"]} className="topic-link">
            {segment.text}
          </Link>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
