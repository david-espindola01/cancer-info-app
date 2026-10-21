"use client";

import { useJsonParser, useUiKit } from "@hashbrownai/react";
import { ProveedorFuentes, type FuenteVista } from "./fuentes";
import { componentesExpuestos } from "./kit";

/**
 * Dibuja una página armada por el Agente Presentador: `ui` es su respuesta JSON
 * (`{ "ui": [...] }`), que se valida contra el catálogo antes de mostrarse.
 */
export function PaginaGenerada({ ui, fuentes }: { ui: string; fuentes: FuenteVista[] }) {
  const kit = useUiKit({ components: componentesExpuestos });
  const { value, error } = useJsonParser(ui, kit.schema);

  // Hashbrown descarta los componentes que no están en el catálogo: si no queda nada, se avisa.
  if (error || !value || value.ui.length === 0) {
    return (
      <p role="alert" className="font-semibold">
        No se pudo mostrar esta página. Intenta de nuevo en unos minutos.
      </p>
    );
  }
  return (
    <ProveedorFuentes value={fuentes}>
      <article className="flex flex-col gap-6">{kit.render(value)}</article>
    </ProveedorFuentes>
  );
}
