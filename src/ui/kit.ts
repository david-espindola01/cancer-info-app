import { s, type UiComponentDefinition } from "@hashbrownai/core";
import type { ComponentType } from "react";
import { catalog } from "@/ui-contracts/contracts";
import { Definition, Notice, Stat } from "./components/highlights";
import { BulletList, Comparison, Faq, Steps } from "./components/lists";
import { NextTopics, NoInformation, Sources } from "./components/navigation";
import { Heading, Paragraph, Section } from "./components/structure";

/** Names of the catalog components, as the model writes them. */
export type ComponentName =
  | "Section"
  | "Heading"
  | "Paragraph"
  | "BulletList"
  | "Steps"
  | "Stat"
  | "Comparison"
  | "Definition"
  | "Faq"
  | "Notice"
  | "Sources"
  | "NextTopics"
  | "NoInformation";

/*
 * Each prop arrives already checked against its contract (see `validProps`), so the
 * components can receive it as `any` here: their own prop types stay strict.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CatalogComponent = ComponentType<any>;

/** Each catalog contract with the component that renders it. */
export const components: Record<ComponentName, CatalogComponent> = {
  Section,
  Heading,
  Paragraph,
  BulletList,
  Steps,
  Stat,
  Comparison,
  Definition,
  Faq,
  Notice,
  Sources,
  NextTopics,
  NoInformation,
};

const contracts = new Map<string, UiComponentDefinition>(catalog.map((contract) => [contract.name, contract]));

/** The Skillet schema of each contract's props, built once. */
const propSchemas = new Map(
  catalog.map((contract) => [contract.name, s.object(contract.name, contract.props ?? {}) as s.HashbrownType]),
);

/**
 * Checks a component's props against its contract with Hashbrown on the server: the
 * browser receives ready HTML and never downloads the library.
 */
export function validProps(name: string, props: unknown): props is Record<string, unknown> {
  const schema = propSchemas.get(name);
  if (!schema) return false;
  try {
    schema.validate(props ?? {});
    return true;
  } catch {
    return false;
  }
}

/** Whether the contract lets this component hold other components. */
export const acceptsChildren = (name: string) => contracts.get(name)?.children === "any";
