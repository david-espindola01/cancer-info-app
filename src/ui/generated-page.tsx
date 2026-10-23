import type { ReactNode } from "react";
import { pageNodes, type PageSource } from "@/domain/page";
import { acceptsChildren, components, validProps, type ComponentName } from "./kit";

/**
 * Turns the agent's nodes into components. A node whose name is not in the catalog, or
 * whose props do not follow its contract, is left out, as Hashbrown's browser parser did.
 */
function renderNodes(nodes: unknown, sources: PageSource[], path = "n"): ReactNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.flatMap((node, i) => {
    if (!node || typeof node !== "object") return [];
    const entries = Object.entries(node as Record<string, { props?: unknown; children?: unknown }>);
    const [entry] = entries;
    if (!entry || entries.length !== 1) return [];
    const [name, body] = entry;
    if (!(name in components) || !validProps(name, body?.props)) return [];

    const Component = components[name as ComponentName];
    const key = `${path}-${i}`;
    const props = { ...(body?.props as Record<string, unknown>) };
    // The sources' titles and references come from the server, never from the model.
    if (name === "Sources") props.available = sources;
    if (!acceptsChildren(name)) return [<Component key={key} {...props} />];
    return [
      <Component key={key} {...props}>
        {renderNodes(body?.children, sources, key)}
      </Component>,
    ];
  });
}

/**
 * Renders on the server a page built by the Presenter Agent: `ui` is its JSON answer
 * (`{ "ui": [...] }`), checked against the catalog before it is shown. The phone receives
 * plain HTML: neither Hashbrown nor the catalog travel to the browser.
 */
export function GeneratedPage({ ui, sources }: { ui: string; sources: PageSource[] }) {
  const blocks = renderNodes(pageNodes(ui), sources);

  if (blocks.length === 0) {
    return (
      <p role="alert" className="font-semibold">
        No se pudo mostrar esta página. Intenta de nuevo en unos minutos.
      </p>
    );
  }
  return <article className="blocks flex flex-col gap-6">{blocks}</article>;
}
