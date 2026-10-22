"use client";

import { useJsonParser, useUiKit } from "@hashbrownai/react";
import type { PageSource } from "@/domain/page";
import { exposedComponents } from "./kit";
import { SourcesProvider } from "./sources";

/**
 * Renders a page built by the Presenter Agent: `ui` is its JSON answer
 * (`{ "ui": [...] }`), validated against the catalog before it is shown.
 */
export function GeneratedPage({ ui, sources }: { ui: string; sources: PageSource[] }) {
  const kit = useUiKit({ components: exposedComponents });
  const { value, error } = useJsonParser(ui, kit.schema);

  // Hashbrown drops components that are not in the catalog: if nothing is left, say so.
  if (error || !value || value.ui.length === 0) {
    return (
      <p role="alert" className="font-semibold">
        No se pudo mostrar esta página. Intenta de nuevo en unos minutos.
      </p>
    );
  }
  return (
    <SourcesProvider value={sources}>
      <article className="blocks flex flex-col gap-6">{kit.render(value)}</article>
    </SourcesProvider>
  );
}
