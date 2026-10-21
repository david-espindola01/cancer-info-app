import { ContenidoTema } from "./contenido-tema";
import { TransicionPagina } from "./transicion-pagina";

/** El recorrido empieza siempre por aquí; desde este tema, la página guía hacia los demás. */
const TEMA_INICIAL = "que-es-el-cancer";

export default function Inicio() {
  return (
    <TransicionPagina>
      <ContenidoTema slug={TEMA_INICIAL} />
    </TransicionPagina>
  );
}
