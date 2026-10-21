import { Suspense } from "react";
import { ContenidoTema } from "./contenido-tema";
import { EsqueletoTema } from "./esqueleto-tema";

/** El recorrido empieza siempre por aquí; desde este tema, la página guía hacia los demás. */
const TEMA_INICIAL = "que-es-el-cancer";

export default function Inicio() {
  return (
    <Suspense fallback={<EsqueletoTema />}>
      <ContenidoTema slug={TEMA_INICIAL} />
    </Suspense>
  );
}
