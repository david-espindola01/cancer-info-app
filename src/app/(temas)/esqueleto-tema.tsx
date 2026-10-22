import { MensajeCarga } from "./estado-conexion";

/** Lo que se ve mientras se prepara una página: liviano, sin imágenes. */
export function EsqueletoTema() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <MensajeCarga />
      <div aria-hidden className="flex animate-pulse flex-col gap-3">
        <div className="h-9 w-3/4 rounded bg-borde" />
        <div className="h-4 w-full rounded bg-borde" />
        <div className="h-4 w-11/12 rounded bg-borde" />
        <div className="h-4 w-4/5 rounded bg-borde" />
      </div>
    </div>
  );
}
