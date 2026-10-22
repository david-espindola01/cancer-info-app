import { Suspense, ViewTransition, type ReactNode } from "react";
import { EsqueletoTema } from "./esqueleto-tema";

const DIRECCIONES = { avanzar: "avanzar", volver: "volver", default: "none" } as const;

/**
 * Envuelve el contenido de una página de tema con sus animaciones (View Transitions):
 * al navegar, la página sale y la nueva entra deslizándose en la dirección del recorrido
 * (avanzar o volver); mientras carga, el esqueleto baja y se desvanece, y el contenido
 * sube y aparece. Los estilos están en globals.css.
 */
export function TransicionPagina({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={DIRECCIONES} exit={DIRECCIONES} default="none">
      <Suspense
        fallback={
          <ViewTransition exit="bajar" default="none">
            <EsqueletoTema />
          </ViewTransition>
        }
      >
        <ViewTransition enter="subir" default="none">
          {children}
        </ViewTransition>
      </Suspense>
    </ViewTransition>
  );
}
