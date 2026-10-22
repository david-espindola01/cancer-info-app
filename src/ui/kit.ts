import type { s } from "@hashbrownai/core";
import { exposeComponent } from "@hashbrownai/react";
import {
  bulletListContract,
  comparisonContract,
  definitionContract,
  faqContract,
  headingContract,
  nextTopicsContract,
  noInformationContract,
  noticeContract,
  paragraphContract,
  sectionContract,
  sourcesContract,
  statContract,
  stepsContract,
} from "@/ui-contracts/contracts";
import { Definition, Notice, Stat, type NoticeKind } from "./components/highlights";
import { BulletList, Comparison, Faq, Steps } from "./components/lists";
import { NextTopics, NoInformation, Sources } from "./components/navigation";
import { Heading, Paragraph, Section } from "./components/structure";

/** Each catalog contract with the component that renders it. */
export const exposedComponents = [
  exposeComponent(Section, sectionContract),
  exposeComponent(Heading, headingContract),
  exposeComponent(Paragraph, paragraphContract),
  exposeComponent(BulletList, bulletListContract),
  exposeComponent(Steps, stepsContract),
  exposeComponent(Stat, statContract),
  exposeComponent(Comparison, comparisonContract),
  exposeComponent(Definition, definitionContract),
  exposeComponent(Faq, faqContract),
  exposeComponent(Notice, {
    ...noticeContract,
    // Skillet turns the `kind` union into a tuple whose order changes between builds; the
    // value is the same (covered by the GeneratedPage tests), only its type is pinned.
    props: { ...noticeContract.props, kind: noticeContract.props.kind as unknown as s.Schema<NoticeKind> },
  }),
  exposeComponent(Sources, sourcesContract),
  exposeComponent(NextTopics, nextTopicsContract),
  exposeComponent(NoInformation, noInformationContract),
];
